import { RedditOauth, RedditOauthOptions } from "./mod.ts";
import { load } from "https://deno.land/std@0.170.0/dotenv/mod.ts";

const env = await load();

Deno.test("Reddit Script", async (t) => {
  const app = new RedditOauth({
    clientID: env["REDDIT_CLIENT_ID"],
    clientSecret: env["REDDIT_CLIENT_SECRET"],
    appType: "script",
    username: env["REDDIT_USERNAME"],
    password: env["REDDIT_PASSWORD"],
  });

  await t.step("getOauthToken", async () => {
    const token = await app.getOauthToken();
    console.log(token);
  });

  await t.step("getMe", async () => {
    const me = await app.me();
    console.log(me);
  });

  await t.step("getScopes", async () => {
    const scopes = await app.getScopes();
    console.log(scopes);
  });
});
