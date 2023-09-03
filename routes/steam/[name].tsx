import { RouteContext } from "$fresh/server.ts";
import { getUsersGames } from '../../func/scrape.ts';

export default async function SteamLib(_req: Request, ctx: RouteContext) {
    const games = await getUsersGames(ctx.params.name);
    return <div>Hello {ctx.params.name}, you have {games.response.games.length} games</div>;
}
