
export const MINUTE = 60_000
export const HOUR = 60 * MINUTE;
export const DAY = 24 * HOUR;

export type SteamGame = {
    appid: number,
    name: string,
    reloaded?: number,
    genres?: string[],
    platforms?: string[],
    categories?: string[],
}
export type SteamAllGamesResponse = {
    applist: {
        apps: SteamGame[]
    }
}

export type SteamUserProfileResponse = {
    response?: {
        steamid: string;
    }
}

export type SteamUserGamesResponse = {
    response?: {
        game_count: number;
        games: {
            appid: number;
            name: string;
            playtime_forever: number;
            img_icon_url?: string;
        }[];
    }
}
