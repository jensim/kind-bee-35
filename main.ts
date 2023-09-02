/// <reference no-default-lib="true" />
/// <reference lib="dom" />
/// <reference lib="dom.iterable" />
/// <reference lib="dom.asynciterable" />
/// <reference lib="deno.ns" />

import "$std/dotenv/load.ts";

import { start } from "$fresh/server.ts";
import manifest from "./fresh.gen.ts";
import config from "./fresh.config.ts";
import { scrape } from './func/scrape.ts'

const MINUTE = 60_000
const HOUR = 60*MINUTE;
const DAY = 24*HOUR;

await scrape();
setInterval(scrape, 1*DAY);

await start(manifest, config);
