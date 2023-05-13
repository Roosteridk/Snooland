import { Reddit } from "../mod.ts";
import { load } from "https://deno.land/std@0.187.0/dotenv/mod.ts";

const env = await load();
const init = {
  clientId: env.REDDIT_CLIENT_ID,
  clientSecret: env.REDDIT_CLIENT_SECRET,
  username: env.REDDIT_USERNAME,
  password: env.REDDIT_PASSWORD,
};

const reddit = Reddit.create(init);

console.log(await reddit.me);
