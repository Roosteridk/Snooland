import { Reddit } from "./mod.ts";
import { load } from "https://deno.land/std@0.175.0/dotenv/mod.ts";

const env = await load();

//const subreddit = await Reddit.subreddit("deno").about;
//console.log(subreddit.title); // Deno - A secure TypeScript runtime on V8
Reddit.info("t3_10q7oy7").then(console.log);
//Reddit.search({ q: "deno", type: "user", limit: 1 }).then(console.log);
