export async function scrape () {
  const allGamesOnSteam = `http://api.steampowered.com/ISteamApps/GetAppList/v0002/?format=json&type_filter=game`;
  const allKnownGamesResponse = await fetch(allGamesOnSteam);
  const allKnownGames: SteamAllGamesResponse = await allKnownGamesResponse.json();
  console.log(`Scrapy! Found ${allKnownGames.applist.apps.length} games on steam`);
}

export type SteamAllGamesResponse = {
  applist: {
    apps: {
      appid: number,
      name: string,
    }[]
  }
}

export type SteamUserProfileResponse = {
  response ?: {
    steamid: string;
  }
}

export type SteamUserGamesResponse = {
  response ?: {
    game_count: number;
    games: {
      appid: number;
      name: string;
      playtime_forever: number;
      img_icon_url ?:string;
    }[];
  }
}

export async function getUsersGames(profileName:string): Promise<SteamUserGamesResponse> {
  const key = Deno.env.get('STEAM_KEY');
  const profileConvertUrl = `https://api.steampowered.com/ISteamUser/ResolveVanityURL/v1?key=${key}&vanityurl=${profileName}`;
  const profileResponse = await fetch(profileConvertUrl);
  const profile: SteamUserProfileResponse  = await profileResponse.json();
  const steamid = profile.response.steamid;
  const usersGamesResponse = await fetch(`https://api.steampowered.com/IPlayerService/GetOwnedGames/v1?key=${key}&steamid=${steamid}&include_appinfo=1&include_played_free_games=1`)
  const usersGames: SteamUserGamesResponse = await usersGamesResponse.json();
  return usersGames
}
