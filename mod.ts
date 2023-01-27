import { EventEmitter } from "node:events";

export class RedditOauth extends EventEmitter {
  readonly baseURL = "https://oauth.reddit.com/";
  token?: BetterToken;
  clientID: string;
  clientSecret: string;
  username?: string;
  password?: string;
  appType: "script" | "web";
  userAgent: RedditOauthOptions["userAgent"];

  constructor(options: RedditOauthOptions) {
    super();
    this.clientID = options.clientID;
    this.clientSecret = options.clientSecret;

    this.appType = options.appType;
    this.userAgent = options.userAgent ?? "reddeno";

    if (options.appType === "script") {
      this.username = options.username;
      this.password = options.password;
    }
  }
  
  setToken(token: BetterToken) {
    this.token = token;
  }

  async getOauthToken(refresh = false) {
    if (this.appType === "web") {
      if (refresh && this.token?.refreshToken) {
        // Refresh the token
        const response = await fetch(
          "https://www.reddit.com/api/v1/access_token",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
              Authorization: `Basic ${
                btoa(`${this.clientID}:${this.clientSecret}`)
              }`,
            },
            body: new URLSearchParams({
              grant_type: "refresh_token",
              refresh_token: this.token.refreshToken,
            }),
          },
        );
        const json = await response.json() as RedditOauthToken;
        if ("error" in json) {
          throw new Error(json.error as string);
        }
        this.setToken({
          accessToken: json.access_token,
          refreshToken: json.refresh_token,
          expiry: new Date(Date.now() + json.expires_in * 1000),
        });
        this.emit("tokenRefreshed", this.token);
        return json;
      } else {
        throw new Error("Use setToken to set the token for web apps");
      }
    } else if (this.appType === "script") {
      // Shorthand oauth flow for bots and personal scripts; don't need callback urls
      if (!this.username || !this.password) {
        throw new Error("Username and password are required for script apps");
      }
      const response = await fetch(
        "https://www.reddit.com/api/v1/access_token",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Basic ${
              btoa(`${this.clientID}:${this.clientSecret}`)
            }`,
          },
          body: new URLSearchParams({
            grant_type: "password",
            username: this.username,
            password: this.password,
          }),
        },
      );
      const json = await response.json() as RedditOauthToken;
      if ("error" in json) {
        throw new Error(json.error as string);
      }
      this.setToken({
        accessToken: json.access_token,
        expiry: new Date(Date.now() + json.expires_in * 1000),
      });
      return json;
    } else {
      throw new Error("Invalid app type");
    }
  }

  private rateLimitRemaining = 60;
  private rateLimitReset = 0;
  private rateLimitReached = false;

  /**
   * Wrapper around fetch that adds the authorization header and checks the rate limit
   * @param url The api endpoint to fetch. Eg: `api/v1/me`
   * @param options Request options
   * @returns a Promise that resolves to a JSON object
   */
  fetch: typeof fetch = async (url, options) => {
    url = new URL(url as string, this.baseURL);

    // Check if we need to get a new token
    if (!this.token || Date.now() > this.token.expiry!.getTime()) {
      console.info("Token expired, fetching new token");
      await this.getOauthToken(true);
    }

    // Check if we need to wait for the rate limit to reset
    if (this.rateLimitRemaining === 0) {
      // Log only once when the rate limit is reached
      if (!this.rateLimitReached) {
        console.info("Rate limit reached, waiting for reset");
      }
      this.rateLimitReached = true;
      await sleep((this.rateLimitReset - Date.now() / 1000) * 1000);
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        ...options?.headers,
        Authorization: `bearer ${this.token!.accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`${response.status}: ${response.statusText}`);
    }

    // Update rate limit info
    this.rateLimitRemaining = parseInt(
      response.headers.get("x-ratelimit-remaining")!,
    );
    this.rateLimitReset = parseInt(response.headers.get("x-ratelimit-reset")!);

    return response;
  };

  /**
   * Get the user's account details
   * @returns a Promise that resolves to a RedditAccount object
   * @scopes identity
   */
  async me(): Promise<Account> {
    const res = await this.fetch("api/v1/me");
    return res.json();
  }

  /**
   * Submit a new comment or reply to a message.
   * @param parent The fullname of the parent comment, link, or message
   * @param text The comment text
   * @scopes submit, privatemessages (for replying to messages)
   */
  async comment(
    parent: Fullname<
      FullnameType.Comment | FullnameType.Link | FullnameType.Message
    >,
    text: string,
  ) {
    const res = await this.fetch("api/comment", {
      method: "POST",
      body: new URLSearchParams({
        api_type: "json",
        parent_id: parent,
        text,
      }),
    });
  }

  /**
   * Get the user's authorized scopes
   * @returns a Promise that resolves to a RedditPermissions object
   */
  async getScopes(): Promise<Permissions> {
    const res = await this.fetch("api/v1/scopes");
    return res.json();
  }

  /**
   * Sends a private message to the specified user
   * @param to the username of the recipient
   * @param subject the subject of the message
   * @param text the message text
   * @scopes privatemessages
   */
  async compose(
    to: string,
    subject: string,
    text: string,
  ) {
    await this.fetch("api/compose", {
      method: "POST",
      body: new URLSearchParams({
        api_type: "json",
        to,
        subject,
        text,
      }),
    });
  }
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

type RedditOauthToken = {
  access_token: string;
  token_type: string;
  expires_in: number;
  /** The scopes that the token has access to, separated by spaces Eg: `"identity edit"` */
  scope: string;
  /** The refresh token, only provided if the auth request includes `duration=permanent` */
  refresh_token?: string;
};

type BetterToken = {
  accessToken: string;
  refreshToken?: string;
  expiry?: Date;
  //scopes: RedditScope[] | "*";
};

export type RedditOauthOptions =
  & {
    clientID: string;
    clientSecret: string;
    token?: BetterToken;
    userAgent?: string;
  }
  & ({
    appType: "web";
  } | {
    appType: "script";
    username: string;
    password: string;
  });
