import {SteamGame} from "../types/global.ts";

const kv = await Deno.openKv();

const key_steam_last_reload = ['steam', 'last_reload']
const key_steam_game_prefix = ['steam', 'game']
const key_steam_user_last_reload = ['steam', 'user', 'last_reload']
const key_steam_user_games = ['steam', 'user', 'games']


export async function getLastSteamReload(): number {
    try {
        const response = await kv.get(key_steam_last_reload)
        if (response && response.value) {
            return response.value;
        }
    } catch (e) {
        console.error('Failed to get last steam reload time');
        console.error(e)
    }
    console.log('No last steam reload time found, returning 0');
    return 0;
}

export async function setSteamUserLastReload(userId: number) {
    try {
        await kv.set([...key_steam_user_last_reload, userId.toString()], new Date().getTime())
    } catch (e) {
        console.error('Failed to set last steam user reload time');
        console.error(e)
    }
}

export async function getSteamUserLastReload(profileAlias: string): Promise<number> {
    try {
        const response = await kv.get([...key_steam_user_last_reload, profileAlias])
        if (response && response.value) {
            return response.value;
        }
    } catch (e) {
        console.error('Failed to get last steam user reload time');
        console.error(e)
    }
    console.log('No last steam user reload time found, returning 0');
    return 0;
}

export async function getSteamUserGames(steamAlias: string): Promise<SteamGame[]> {
    try {
        const response = await kv.get([...key_steam_user_games, steamAlias])
        if (response && response.value) {
            return await getGames(response.value);
        }
    } catch (e) {
        console.error('Failed to get steam user games');
        console.error(e)
    }
    console.log('No steam user games found, returning empty array');
    return [];
}

export async function setSteamUserGames(steamAlias: string, games: number[]) {
    try {
        await kv.set([...key_steam_user_games, steamAlias], games)
    } catch (e) {
        console.error('Failed to set steam user games');
        console.error(e)
    }
}

export async function setLastSteamReload() {
    try {
        await kv.set(key_steam_last_reload, new Date().getTime())
    } catch (e) {
        console.error('Failed to set last steam reload time');
        console.error(e)
    }
}

export async function updateGame(game: SteamGame) {
    try {
        game.reloaded = new Date().getTime();
        await kv.set([...key_steam_game_prefix, game.appid.toString()], game)
    } catch (e) {
        console.error('Failed to set game');
        console.error(e)
    }
}

export async function getGame(appid: number): Promise<SteamGame | undefined> {
    try {
        const response = await kv.get([...key_steam_game_prefix, appid.toString()])
        response?.value
    } catch (e) {
        console.error('Failed to get game');
        console.error(e)
    }
}

export async function getGames(appIds: number[]) {
    const futures = appIds.map((appId) => getGame(appId));
    const games = await Promise.all(futures);
    return games.filter((game) => game !== undefined)
}
