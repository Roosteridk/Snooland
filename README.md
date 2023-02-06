# Snooland

_Work in progress, PRs are welcome!_

🔑 Supports OAuth2 and Basic Auth.\
🔍 Auth-free methods for scraping\
⏰ Automatic rate limitting\
📃 Pagination handling

## Goals

The aim of this library is not to be 1:1 mapping of the Reddit API but rather
provide 99% of the functionality while keeping it simple and easy to use.

## Usage

```ts
import { Reddit } from "https://deno.land/x/reddit/mod.ts";
```

### Web app (OAuth2)

Note: You need to obtain an acccess and refresh token from Reddit using Oauth2.

```ts
const reddit = new Reddit.create({
  clientId: "CLIENT_ID",
  clientSecret: "CLIENT_SECRET",
  accessToken: "ACCESS_TOKEN",
  refreshToken: "REFRESH_TOKEN",
});
```

### Script (Basic Auth)

```ts
const reddit = Reddit.create({
  clientId: "CLIENT_ID",
  clientSecret: "SECRET",
  username: "USERNAME",
  password: "PASSWORD",
});

const user = await reddit.me;
console.log(user.name); // USERNAME
```

### No auth (read-only)

```ts
const subreddit = await Reddit.subreddit("deno").about;
console.log(subreddit.title); // Deno - A secure TypeScript runtime on V8
```

## TODO:

- Add more tests
- Complete documentation
- (Almost) 100% coverage
- Add more examples
