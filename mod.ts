import type {
  Account,
  AnyThing,
  Comment,
  CommentTreeParams,
  Fullname,
  FullnameToType,
  HistoryParams,
  Link,
  Listing,
  ListingParams,
  ListingTypes,
  Message,
  OAuthScope,
  Permissions,
  SearchParams,
  SearchResult,
  SubmitParams,
  Subreddit,
  Thing,
  Trophy,
  WikiPage,
} from "./types.ts";
import { EventEmitter } from "node:events";

const version = "0.0.2";

type Exact<A, B> = A extends B ? B extends A ? A
  : never
  : never;

type RedditFactoryReturn<T extends RedditInit | undefined = undefined> =
  T extends Exact<RedditOauthInit, T> ? RedditOauth : RedditAnon;

export class Reddit {
  static create<T extends RedditInit | undefined>(
    options?: T,
  ): RedditFactoryReturn<T> {
    if (!options) {
      return new RedditAnon() as RedditFactoryReturn<T>;
    } else if (Object.keys(options).length === 1 && options.userAgent) {
      return new RedditAnon(options.userAgent) as RedditFactoryReturn<T>;
    }

    if (options.clientId && options.clientSecret) {
      if (options.username && options.password) {
        return new RedditOauth(options) as RedditFactoryReturn<T>;
      } else if (options.refreshToken) {
        return new RedditOauth(options) as RedditFactoryReturn<T>;
      }
    } else if (options.accessToken) {
      console.warn(
        "Using an access token without credentials is not recommended.",
      );
      return new RedditOauth(options) as RedditFactoryReturn<T>;
    }
    throw new TypeError("Missing credentials.");
  }

  static subreddit(name: string) {
    return new RedditAnon().subreddit(name);
  }

  static user(name: string) {
    return new RedditAnon().user(name);
  }

  static get info() {
    const r = new RedditAnon();
    return r.info.bind(r);
  }

  static get comments() {
    const r = new RedditAnon();
    return r.comments.bind(r);
  }

  static get search() {
    const r = new RedditAnon();
    return r.search.bind(r);
  }
}

/**
 * The base class for all Reddit API interactions that do not require authentication
 */
class RedditAnon extends EventEmitter {
  protected userAgent: string;
  protected baseUrl = "https://www.reddit.com";
  constructor(userAgent?: string) {
    super();
    this.userAgent = userAgent ?? `Snooland ${version}`;
  }

  protected rateLimit = {
    reqRemaining: 60,
    resetMs: Date.now() + 60_000,
  };
  protected async fetch<T extends unknown>(
    input: string | URL,
    options?: RequestInit,
  ): Promise<T> {
    // Check if rate limit is reached
    if (this.rateLimit.reqRemaining === 0) {
      // Log only once when the rate limit is reached
      if (this.rateLimit.resetMs > Date.now()) {
        console.info("Rate limit reached, waiting until reset");
      }
      // Wait until the rate limit resets
      await new Promise((resolve) => {
        setTimeout(resolve, this.rateLimit.resetMs - Date.now());
      });
    }

    let url: string | URL = new URL(input, this.baseUrl);
    url = new URL(url.origin + url.pathname + ".json" + url.search);
    url.searchParams.set("raw_json", "1");

    const res = await fetch(url, {
      ...options,
      headers: { ...options?.headers, "User-Agent": this.userAgent },
    });

    // TODO: handle http errors
    if (!res.ok) {
      super.emit("error", new Error(res.statusText));
    }

    // Update rate limit info
    this.rateLimit.reqRemaining = Number(
      res.headers.get("x-ratelimit-remaining"),
    );
    this.rateLimit.resetMs = Number(res.headers.get("x-ratelimit-reset"));

    return res.json();
  }

  private async paginate<T extends ListingTypes>(
    endpoint: string | URL,
    params?: Record<string, unknown>,
    callback?: (items: T[]) => void,
  ) {
    const items: T[] = [];
    const url = new URL(endpoint, this.baseUrl);
    url.search = new URLSearchParams(params as any).toString();
    let limit = (params?.limit || 100) as number;
    let json;
    do {
      json = await this.fetch(url) as Thing<Listing<T>>;
      const newItems = json.data.children.map((c) => c.data);
      items.push(...newItems);
      if (callback) callback(newItems);
      if (!json.data.after) break;
      url.searchParams.set("after", json.data.after);
    } while ((limit -= 100) > 0);
    return items;
  }

  // Returns a generic paginated function
  protected paginated<
    T extends ListingTypes,
    P extends ListingParams = ListingParams,
  >(endpoint: string) {
    return (
      /**
       * @param params Listing query parameters
       * @param callback A callback that is called with each page of items
       */
      (
        params?: P,
        callback?: (items: T[]) => void,
      ) => this.paginate<T>(endpoint, params, callback)
    );
  }

  /**
   * Get info about a thing(s)
   * @param fullnames A list of fullnames
   * @returns A list of things with the given fullnames
   */
  async info<T extends Fullname<Comment | Subreddit | Link>>(
    ...fullnames: T[]
  ) {
    const url = new URL("api/info", this.baseUrl);
    url.searchParams.set("id", fullnames.join(","));
    const thing = await this.fetch(url) as Thing<Listing<FullnameToType[T]>>;
    return thing.data.children.map((c) => c.data);
  }

  /**
   * Get the comment tree for a given link, including the link itself
   * @param linkId The id or fullname of the link
   * @returns An array with the link as the first element, followed by the comments
   */
  async comments(linkId: string | Fullname<Link>, options: CommentTreeParams) {
    linkId = linkId.split("_").pop()!;
    const params = new URLSearchParams(options as any);
    params.append("article", linkId);
    const url = new URL("comments", this.baseUrl);
    url.search = params.toString();
    const res = await this.fetch(url) as Thing<Listing>[];
    return [...res[0].data.children, ...res[1].data.children].map(
      (c) => c.data,
    ) as [Link, ...Comment[]];
  }

  /**
   * Search across reddit
   * Doesn't work on comments for some reason
   */
  search<T extends SearchParams>(params: T) {
    return this.paginate<SearchResult<T["type"]>>("search", params);
  }

  /**
   * Get subreddit accessors
   * @param name The name of the subreddit
   * @returns An object representing the subreddit endpoints
   */
  subreddit(name: string) {
    return new RedditAnon.Subreddit(this, name);
  }
  private static Subreddit = class {
    constructor(private r: RedditAnon, private name: string) {}
    get hot() {
      return this.r.paginated<Link>(`r/${this.name}/hot`);
    }

    get new() {
      return this.r.paginated<Link>(`r/${this.name}/new`);
    }

    get top() {
      return this.r.paginated<Link, Omit<HistoryParams, "context">>(
        `r/${this.name}/top`,
      );
    }

    get controversial() {
      return this.r.paginated<Link, Omit<HistoryParams, "context">>(
        `r/${this.name}/controversial`,
      );
    }

    get gilded() {
      return this.r.paginated<Link>(`r/${this.name}/gilded`);
    }

    get rising() {
      const res = this.r.fetch<Thing<Listing<Link>>>(`r/${this.name}/rising`);
      return res.then((r) => r.data.children.map((c) => c.data));
    }

    /**
     * Search the subreddit
     */
    search<T extends SearchParams>(params: T) {
      return this.r.paginate<SearchResult<T["type"]>>(
        `${this.name}/search`,
        params,
      );
    }

    /**
     * Get the subreddit's comments, sorted by new
     *
     * **Note: sorting parameters have no effect**
     */
    get comments() {
      return this.r.paginated<Comment>(`r/${this.name}/comments`);
    }

    /**
     * Get info about the subreddit
     */
    get about() {
      const res = this.r.fetch<Thing<Subreddit>>(`r/${this.name}/about`);
      return res.then((r) => r.data);
    }

    get wiki() {
      const res = this.r.fetch(`r/${this.name}/wiki`) as Promise<
        Thing<WikiPage>
      >;
      return res.then((r) => r.data);
    }
  };

  user(name: string) {
    return new RedditAnon.User(this, name);
  }
  private static User = class {
    constructor(private r: RedditAnon, private name: string) {}
    get about() {
      const res = this.r.fetch<Thing<Account>>(`user/${this.name}/about`);
      return res.then((r) => r.data);
    }

    /**
     * Get the user's comments
     */
    get comments() {
      return this.r.paginated<Comment>(`user/${this.name}/comments`);
    }

    /**
     * Get the user's overview (posts, comments, etc.)
     */
    get overview() {
      return this.r.paginated<Link>(`user/${this.name}/overview`);
    }

    /**
     * Get the user's submitted posts
     */
    get submitted() {
      return this.r.paginated<Link>(`user/${this.name}/submitted`);
    }

    get trophies() {
      const res = this.r.fetch<Thing<Trophy>>(`user/${this.name}/trophies`);
      return res.then((r) => r.data);
    }
  };
}

class RedditOauth extends RedditAnon {
  private readonly id?: string;
  private readonly secret?: string;
  private readonly username?: string;
  private readonly password?: string;
  private readonly appType: "script" | "web" | undefined;
  private token?: BetterToken;

  constructor(options: RedditInit) {
    super(options.userAgent);
    this.id = options.clientId;
    this.secret = options.clientSecret;
    this.username = options.username;
    this.password = options.password;
    this.token = {
      access: options.accessToken,
      refresh: options.refreshToken,
      expiry: options.tokenExpiry,
    };
    this.baseUrl = "https://oauth.reddit.com";
    this.appType = options.password
      ? "script"
      : options.refreshToken
      ? "web"
      : undefined;
  }

  setToken(token: BetterToken) {
    this.token = token;
  }

  private async getNewToken() {
    if (this.appType === "web") {
      if (!this.token?.refresh) {
        return super.emit(
          "error",
          new Error("Access token expired; excpected a refresh token."),
        );
      }
      const response = await fetch(
        "https://www.reddit.com/api/v1/access_token",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Basic ${btoa(`${this.id}:${this.secret}`)}`,
          },
          body: new URLSearchParams({
            grant_type: "refresh_token",
            refresh_token: this.token.refresh,
          }),
        },
      );
      const json = await response.json() as OauthTokenResponseBody;
      if ("error" in json) {
        return super.emit("error", new Error(json.error as string));
      }
      this.setToken({
        access: json.access_token,
        refresh: this.token.refresh,
        expiry: new Date(Date.now() + json.expires_in * 1000),
      });
      super.emit("tokenRefreshed", this.token);
      return json;
    } else if (this.appType === "script") {
      // Shorthand oauth flow for bots and personal scripts which don't need oauth callback
      if (!this.username || !this.password) {
        throw new Error("Username and password are required for script apps");
      }
      const response = await fetch(
        "https://www.reddit.com/api/v1/access_token",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Basic ${btoa(`${this.id}:${this.secret}`)}`,
          },
          body: new URLSearchParams({
            grant_type: "password",
            username: this.username,
            password: this.password,
          }),
        },
      );
      const json = await response.json() as OauthTokenResponseBody;
      if ("error" in json) {
        return super.emit("error", new Error(json.error as string));
      }
      // No refresh token for script apps
      this.setToken({
        access: json.access_token,
        expiry: new Date(Date.now() + json.expires_in * 1000),
      });
      return json;
    }
  }

  protected async fetch<T extends unknown>(
    input: string | URL,
    options?: RequestInit,
  ): Promise<T> {
    if (!this.token?.expiry || Date.now() > this.token.expiry.getTime()) {
      console.info("Getting new token");
      await this.getNewToken();
    }
    return super.fetch(input, {
      ...options,
      headers: {
        ...options?.headers,
        Authorization: `bearer ${this.token!.access}`,
      },
    });
  }

  /**
   * Get the user's account details
   * @returns a Promise that resolves to an Account object
   * @scopes identity
   */
  get me() {
    return this.fetch<Account>("api/v1/me");
  }

  /**
   * Get the user's authorized OAuth2 scopes
   */
  get scopes() {
    return this.fetch<Permissions>("api/v1/scopes");
  }

  /**
   * Get the user's saved posts and comments
   */
  get saved() {
    return this.paginated<Link | Comment, HistoryParams>(`user/me/saved`);
  }

  /**
   * Get the user's hidden posts and comments
   */
  get hidden() {
    return this.paginated<Link | Comment, HistoryParams>(`user/me/hidden`);
  }

  /**
   * Get the user's gilded posts and comments
   */
  get gilded() {
    return this.paginated<Link | Comment, HistoryParams>(`user/me/gilded`);
  }

  /**
   * Get the comments and posts the user has upvoted
   */
  get upvoted() {
    return this.paginated<Link | Comment, HistoryParams>(`user/me/upvoted`);
  }

  /**
   * Get the comments and posts the user has downvoted
   */
  get downvoted() {
    return this.paginated<Link | Comment, HistoryParams>(`user/me/downvoted`);
  }

  /**
   * Get the user's home feed
   */
  get feed() {
    return new RedditOauth.Feed(this);
  }

  private static Feed = class {
    constructor(private r: RedditOauth) {}

    get best() {
      return this.r.paginated<Link>("best");
    }

    get hot() {
      return this.r.paginated<Link>("hot");
    }

    get new() {
      return this.r.paginated<Link>("new");
    }

    get rising() {
      return this.r.paginated<Link>("rising");
    }

    get top() {
      return this.r.paginated<Link, Omit<HistoryParams, "context">>("top");
    }

    get controversial() {
      return this.r.paginated<Link, Omit<HistoryParams, "context">>(
        "controversial",
      );
    }

    get gilded() {
      return this.r.paginated<Link>("gilded");
    }

    get random() {
      return this.r.paginated<Link>("random");
    }
  };

  /**
   * Submit a new comment or reply to a message.
   * @param parent The fullname of the parent comment, link, or message to reply to
   * @param text Raw markdown text
   * @scopes submit, privatemessages (for replying to messages)
   */
  reply(
    parent: Fullname<Comment | Link | Message>,
    text: string,
  ) {
    return this.fetch("api/comment", {
      method: "POST",
      body: new URLSearchParams({
        api_type: "json",
        parent,
        text,
      }),
    });
  }

  /**
   * Sends a private message to the specified user
   * @param to the username of the recipient
   * @param subject the subject of the message
   * @param text the message text
   * @scopes privatemessages
   */
  compose(
    to: string,
    subject: string,
    text: string,
  ) {
    return this.fetch("api/v1/compose", {
      method: "POST",
      body: new URLSearchParams({
        api_type: "json",
        to,
        subject,
        text,
      }),
    });
  }
  
  submit(options: SubmitParams) {
    const params = new URLSearchParams(options as any);
    params.append("api_type", "json");
    return this.fetch("api/submit", {
      method: "POST",
      body: params,
    });
  }
}

type OauthTokenResponseBody = {
  access_token: string;
  token_type: string;
  expires_in: number;
  /** Space delimited scopes that the token can access
   * @example "identity edit"
   */
  scope: string;
  /** The refresh token, only provided if the auth request includes `duration=permanent` */
  refresh_token?: string;
};

type BetterToken = {
  access?: string;
  refresh?: string;
  expiry?: Date;
  scopes?: OAuthScope[] | "*";
};

// RedditInitWithLogin ^ RedditInitWithRefresh ^ RedditInitSingleUse ^ { userAgent: string }
type RedditInit = XOR<RedditOauthInit, { userAgent: string }>;

type RedditOauthInit =
  & XOR<
    XOR<RedditInitWithLogin, RedditInitWithRefresh>,
    RedditInitSingleUse
  >
  & { userAgent?: string };

// Mutually exclusive init cases
type RedditInitSingleUse = {
  accessToken: string;
};

type RedditInitWithLogin = {
  username: string;
  password: string;
  clientId: string;
  clientSecret: string;
};

type RedditInitWithRefresh = {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  accessToken?: string;
  tokenExpiry?: Date;
};

// https://miyauchi.dev/posts/exclusive-property/
type XOR<
  T extends Record<PropertyKey, unknown>,
  U extends Record<PropertyKey, unknown>,
> =
  | (T & { [k in Exclude<keyof U, keyof T>]?: never })
  | (U & { [k in Exclude<keyof T, keyof U>]?: never });
