import { RouteContext } from "$fresh/server.ts";
import { getUsersGames } from '../../func/scrape.ts';
import {SteamGame} from "../../types/global.ts";

export default async function SteamLib(_req: Request, ctx: RouteContext) {
    const games: SteamGame[] = await getUsersGames(ctx.params.name);
    return <div>Hello {ctx.params.name}, you have {games.length} games</div>;
}
