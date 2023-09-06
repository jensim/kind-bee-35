import {
    getGame, getGames,
    getLastSteamReload, getSteamUserGames,
    getSteamUserLastReload,
    setLastSteamReload,
    setSteamUserGames,
    updateGame
} from "./Repo.ts";
import {DAY, SteamGame} from "../types/global.ts";

export async function scrape() {
    const allGamesOnSteam = `http://api.steampowered.com/ISteamApps/GetAppList/v0002/?format=json&type_filter=game`;
    const allKnownGamesResponse = await fetch(allGamesOnSteam);
    const allKnownGames: SteamAllGamesResponse = await allKnownGamesResponse.json();
    console.log(`Scrapy! Found ${allKnownGames.applist.apps.length} games on steam`);

    const lastReload = await getLastSteamReload();
    let now = new Date().getTime();
    if (lastReload < now - 1 * DAY) {
        for (let i = 0; i < 100; i++) {
            const appid = allKnownGames.applist.apps[i].appid;
            const game: SteamGame | undefined = await getGame(appid);
            if (game?.reloaded && game.reloaded < now - 1 * DAY) {
                continue;
            }
            console.log('Fetching app with datas ' + JSON.stringify(allKnownGames.applist.apps[i]));
            const response = await fetch(`https://store.steampowered.com/api/appdetails?appids=${appid}`)
            const json = await response.json();
            //console.log(json);
            await updateGame({
                appid: appid,
                name: json[appid]?.data?.name,
                reloaded: now,

            })
        }
        await setLastSteamReload();
    }
}


export async function getUsersGames(profileName: string): Promise<SteamGame[]> {
    const now = new Date().getTime();
    const reloaded = await getSteamUserLastReload(profileName)
    let games: number[] = [];
    if (reloaded && reloaded < now - 1 * DAY) {
        const appids = await reloadSteamUserGames(profileName);
        return await getGames(appids)
    } else {
        return await getSteamUserGames(profileName)
    }
}

async function reloadSteamUserGames(profileName:string) :Promise<number[]> {
    const key = Deno.env.get('STEAM_KEY');
    const profileConvertUrl = `https://api.steampowered.com/ISteamUser/ResolveVanityURL/v1?key=${key}&vanityurl=${profileName}`;
    const profileResponse = await fetch(profileConvertUrl);
    const profile: SteamUserProfileResponse = await profileResponse.json();
    const steamid = profile.response.steamid;
    const usersGamesResponse = await fetch(`https://api.steampowered.com/IPlayerService/GetOwnedGames/v1?key=${key}&steamid=${steamid}&include_appinfo=1&include_played_free_games=1`)
    const usersGames: SteamUserGamesResponse = await usersGamesResponse.json();
    const appIds = usersGames.response.games.map((game) => game.appid);
    await setSteamUserGames(profileName, appIds);
    return appIds;
}
