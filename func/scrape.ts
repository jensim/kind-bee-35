import {DOMParser} from "https://deno.land/x/deno_dom/deno-dom-wasm.ts";
import {getGame, getGames, getSteamUserGames, getSteamUserLastReload, setSteamUserGames, updateGame} from "./Repo.ts";
import {DAY, SteamGame} from "../types/global.ts";

// Steam is stidgy abaot what url we are calling from
let steamConsecutive403 = 0;
let steamFuse = true;

export async function scrape() {
    await scrapeWemod();
}

async function scrapeWemod() {
    const wemodResponse = await fetch('https://www.wemod.com/cheats?sort=alpha');
    const wemodHtml = await wemodResponse.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(wemodHtml, 'text/html');
    const errorNode = doc.querySelector("parsererror");
    if (errorNode) {
        console.error('Failed parsing wemod html');
        console.error(errorNode);
    }
    console.log('Parsed wemod html');
    //console.log(doc);
    const list = doc.querySelector('div.results-list');
    const table: NodeListOf<Element> = list.querySelectorAll('a.has-trainer');
    table.forEach((row, i) => {
        const platforms = row.querySelectorAll('div.platforms-wrapper')
        let platformNames = [...platforms].map((platform) => platform.textContent.trim())
            .filter((name) => name !== undefined)
            .filter((name) => name.length > 0);

        if (platformNames.some((name) => name.indexOf('Steam') !== -1)) {
            const hrefAttr = row.getAttribute('href');
            setTimeout(() => scrapeWemodGame(hrefAttr), i * 250);
        }
    });
    console.log('Cheats: ' + table.length);
}

async function scrapeWemodGame(href: string) {
    const wemodGameResponse = await fetch('https://www.wemod.com' + href);
    const wemodGameHtml = await wemodGameResponse.text();
    const parser = new DOMParser();
    const gameHtml = parser.parseFromString(wemodGameHtml, 'text/html');
    const steamBg = gameHtml?.querySelector('div.view-background-image')
    const attrLink = steamBg?.getAttribute('style')
    if (attrLink === null || attrLink === undefined) {
        return
    }
    const steamId = attrLink.split('https://cdn.cloudflare.steamstatic.com/steam/apps/')[1].split('/')[0]

    const gameName = gameHtml.querySelector('h1.view-title').textContent.trim()
    console.log(steamId + ': ' + gameName)

    await updateGame({name: gameName, appid: steamId, wemodSupport: true, wemodSupportSeen: new Date().getTime()})
}

/*
async function scrapeSteam() {
    throw "Dont scrape all games. That's just wasteful!"

    const allGamesOnSteam = `http://api.steampowered.com/ISteamApps/GetAppList/v0002/?format=json&type_filter=game`;
    const allKnownGamesResponse = await fetch(allGamesOnSteam);
    const allKnownGames: SteamAllGamesResponse = await allKnownGamesResponse.json();
    console.log(`Scrapy! Found ${allKnownGames.applist.apps.length} games on steam`);

    const lastReload = await getLastSteamReload();
    let now = new Date().getTime();
    if (lastReload < now - 1 * DAY) {
        for (let i = 0; i < 100; i++) {
            // TODO: Derp
        }
    }
    await setLastSteamReload();
}
*/

export async function getUsersGames(profileName: string): Promise<SteamGame[]> {
    const now = new Date().getTime();
    const reloaded = await getSteamUserLastReload(profileName)
    if (!reloaded || reloaded < now - 1 * DAY) {
        console.log(`Reloading steam user games for ${profileName}`);
        const appids = await reloadSteamUserGames(profileName);
        return await getGames(appids)
    } else {
        return await getSteamUserGames(profileName)
    }
}

async function reloadSteamUserGames(profileName: string): Promise<SteamGame[]> {
    const key = Deno.env.get('STEAM_KEY');
    const profileConvertUrl = `https://api.steampowered.com/ISteamUser/ResolveVanityURL/v1?key=${key}&vanityurl=${profileName}`;
    const profileResponse = await fetch(profileConvertUrl);
    const profile: SteamUserProfileResponse = await profileResponse.json();
    const steamid = profile.response.steamid;
    const usersGamesResponse = await fetch(`https://api.steampowered.com/IPlayerService/GetOwnedGames/v1?key=${key}&steamid=${steamid}&include_appinfo=1&include_played_free_games=1`)
    const usersGames: SteamUserGamesResponse = await usersGamesResponse.json();
    const appIds = usersGames.response.games.map((game) => game.appid);
    await setSteamUserGames(profileName, appIds);
    const gameFutures = appIds.map((appid, i) => reloadGame(appid, i))
        .filter((game) => game !== undefined && game !== null);
    return await Promise.all(gameFutures);
}


async function reloadGame(appid: number, seqNum: number) {
    if (!steamFuse) {
        return {name: '⚠️ Unavailable ⚠️', appid: appid};
    }
    const game: SteamGame | undefined = await getGame(appid);
    const now = new Date().getTime();
    if (game?.reloaded && game.reloaded > now - 1 * DAY) {
        return game;
    }
    await sleep(seqNum * 100);
    console.log('Fetching app with datas ' + appid);
    const response = await fetch(`https://store.steampowered.com/api/appdetails?appids=${appid}`)
    if (response.status === 403) {
        steamConsecutive403++;
        if (steamConsecutive403 > 25) {
            console.log('Steam fuse blown! Try NODE_ENV '+Deno.env().NODE_ENV);
            steamFuse = false;
            return {name: '⚠️ Unavailable ⚠️', appid: appid}
        }
    }
    const text = await response.text();
    try {
        const json = JSON.parse(text);
        //console.log(json);
        return await updateGame({
            appid: appid,
            name: json[appid]?.data?.name,
            reloaded: now,
            // TODO: Categories etc
        });
    } catch (e) {
        console.error('Failed to fetch app with datas ' + appid);
        console.error(e);
        console.error('response text from steam was this:');
        console.error(text)
    }
    return {name: '⚠️ Unavailable ⚠️', appid: appid};
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
