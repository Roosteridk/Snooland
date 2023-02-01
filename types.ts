declare global {
  export type KindOf<T extends AnyThing> = //
    T extends Comment ? "t1"
      : T extends Link ? "t3"
      : T extends Message ? "t4"
      : T extends Subreddit ? "t5"
      : T extends Account | SuspendedAccount ? "t2"
      : T extends Award ? "t6"
      : T extends Listing ? "Listing"
      : T extends WikiPage ? "wikipage"
      : T extends Listing<Trophy> ? "TrophyList"
      : never;

  // Example: FullnameToType["t1_123"] -> Comment
  // ok wtf it actually works
  export type FullnameToType = {
    [K in Fullname<ListingTypes>]: K extends `${infer T}_${string}`
      ? T extends KindOf<Comment> ? Comment
      : T extends KindOf<Account> ? Account
      : T extends KindOf<Link> ? Link
      : T extends KindOf<Message> ? Message
      : T extends KindOf<Subreddit> ? Subreddit
      : T extends KindOf<Award> ? Award
      : never
      : never;
  };

  export type OAuthScope =
    | "creddits"
    | "edit"
    | "flair"
    | "history"
    | "identity"
    | "livemanage"
    | "modconfig"
    | "modflair"
    | "modlog"
    | "modposts"
    | "modwiki"
    | "mysubreddits"
    | "privatemessages"
    | "read"
    | "report"
    | "save"
    | "submit"
    | "subscribe"
    | "vote"
    | "wikiread"
    | "wikiedit";

  export type Permissions = Partial<
    {
      [K in OAuthScope]: {
        description: string;
        id: K;
        name: string;
      };
    }
  >;

  export type Time = "hour" | "day" | "week" | "month" | "year" | "all";
  export type ListingParams = {
    /**The fullname of the thing that should be the last item in the listing. */
    after?: string;
    /**The fullname of the thing that should be the first item in the listing. */
    before?: string;
    /**The number of items already seen in this listing. */
    count?: number;
    /**The maximum number of items desired. */
    limit?: number;
    /**The number of items already seen in this listing. */
    show?: "all" | "given" | "saved";
  };

  export type HistoryParams = ListingParams & {
    /**The time period to search. */
    t?: Time;
    //** An integer between 2 and 10 inclusive. */
    context?: number;
    sort?: "new" | "hot" | "top" | "controversial";
    /**Expand subreddits */
    sr_detail?: boolean;
  };

  export type SearchParams = ListingParams & {
    /**The search query. */
    q: string;
    /**The type of thing to search for. */
    type?: "link" | "sr" | "user";
    /**The time period to search. */
    t?: Time;
    /**Enable Safe search */
    include_over_18?: boolean;
    sort?: "relevance" | "hot" | "top" | "new" | "comments";
  };

  export type SearchResult<T extends SearchParams["type"]> = T extends "link"
    ? Link
    : T extends "sr" ? Subreddit
    : T extends "comment" ? Comment
    : T extends "user" ? Account | SuspendedAccount
    : never;

  /** Fullnames start with the type prefix for the object's type, followed by the thing's unique ID in base 36.
   * @example "t3_15bfi0" */
  export type Fullname<T extends ListingTypes> = `${KindOf<T>}_${string}`;

  type ListingTypes =
    | Comment
    | Link
    | Message
    | Subreddit
    | Account
    | Award
    | Trophy
    | SuspendedAccount;
  type AnyThing = ListingTypes | Listing | WikiPage;

  export interface Thing<T extends AnyThing = AnyThing> {
    kind: KindOf<T>;
    data: T;
  }

  /**Used to paginate content that is too long to display in one go */
  export interface Listing<T extends ListingTypes = ListingTypes> {
    /**The fullname of the listing that follows before this page. null if there is no previous page. */
    before: Fullname<T> | null;
    dist: number;
    modhash: string;
    geo_filter: string;
    children: Thing<T>[];
    /**The fullname of the listing that follows after this page. null if there is no next page.*/
    after: Fullname<T> | null;
  }

  interface Created {
    created: number;
    created_utc: number;
    id: string;
  }

  interface Votable {
    ups: number;
    downs: number;
    /** `null` if the user has not voted on the thing or not logged in*/
    likes: boolean | null;
  }

  export interface Link extends Created, Votable {
    approved_at_utc: number | null;
    subreddit: string;
    selftext: string;
    author_fullname: Fullname<Account>;
    saved: boolean;
    mod_reason_title: null;
    gilded: number;
    clicked: boolean;
    title: string;
    link_flair_richtext: string[];
    link_flair_text: string | null;
    subreddit_name_prefixed: string;
    hidden: boolean;
    subreddit_id: Fullname<Subreddit>;
    ups: number;
    hide_score: boolean;
    id: string;
    score: number | null;
    name: Fullname<Link>;
    quarantine: boolean;
    upvote_ratio: number;
    url: string;
    author: string;
    is_self: boolean;
    locked: boolean;
    removed_by: string | null;
    permalink: string;
    removed_by_category: string | null;
    media?: Record<string, unknown>;
    contest_mode: boolean;
  }

  export interface Comment extends Created, Votable {
    approved_by: string | null;
    author: string;
    author_flair_css_class: string;
    author_flair_text: string;
    banned_by: string | null;
    body: string;
    body_html: string;
    edited: boolean | number;
    gilded: number;
    link_author: string;
    link_id: string;
    link_title: string;
    link_url: string;
    num_reports: number | null;
    parent_id: string;
    replies: Thing<Listing<Comment>>;
    saved: boolean;
    score: number;
    score_hidden: boolean;
    subreddit: string;
    subreddit_id: string;
    distinguished: string | null;
    name: Fullname<this>;
    approved_at_utc: null | string;
    author_is_blocked: boolean;
    comment_type: null | string;
    awarders: string[];
    mod_reason_by: null | string;
    author_flair_type: string;
    total_awards_received: number;
    author_flair_template_id: null | string;
    user_reports: string[];
    banned_at_utc: null | string;
    mod_reason_title: null | string;
    archived: boolean;
    collapsed_reason_code: null | string;
    no_follow: boolean;
    can_mod_post: boolean;
    send_replies: boolean;
    author_fullname: Fullname<Account>;
    mod_note: null | string;
    all_awardings: Award[];
    collapsed: boolean;
    top_awarded_type: null | string;
    is_submitter: boolean;
    author_flair_richtext: string[];
    author_patreon_flair: boolean;
    removal_reason: null | string;
    collapsed_reason: null | string;
    associated_award: null | string;
    stickied: boolean;
    author_premium: boolean;
    can_gild: boolean;
    gildings: { [key: string]: number };
    unrepliable_reason: null | string;
    author_flair_text_color: null | string;
    permalink: string;
    subreddit_type: string;
    locked: boolean;
    report_reasons: null | string;
    treatment_tags: string[];
    subreddit_name_prefixed: string;
    controversiality: number;
    depth: number;
    author_flair_background_color: null | string;
    collapsed_because_crowd_control: null | string;
    mod_reports: string[];
  }

  export interface Message extends Created {
    first_message: string | null;
    first_message_name: Fullname<Message> | null;
    subreddit: string | null;
    replies: string | null;
    author_fullname: Fullname<Account> | null;
    subject: string;
    associated_award_id: string | null;
    score: number;
    author: string;
    num_comments: number | null;
    parent_id: string | null;
    subreddit_name_prefixed: string | null;
    new: boolean;
    type: string;
    body: string;
    link_title: string | null;
    dest: string | null;
    was_comment: boolean;
    name: Fullname<this>;
    context: string;
    distinguished: string | null;
  }

  export interface Subreddit extends Created {
    accounts_active: number;
    name: Fullname<Subreddit>;
    comment_score_hide_mins: number;
    description: string;
    description_html: string;
    display_name: string;
    header_img: string;
    header_size: number[];
    header_title: string;
    over18: boolean;
    public_description: string;
    public_traffic: boolean;
    subscribers: number;
    submission_type: string;
    submit_link_label?: string;
    submit_text_label?: string;
    subreddit_type: string;
    title: string;
    url: string;
    user_is_banned: boolean;
    user_is_contributor: boolean;
    user_is_moderator: boolean;
    user_is_subscriber: boolean;
  }

  export interface Account extends Created {
    comment_karma: number;
    has_verified_email: boolean;
    is_friend: boolean;
    is_gold: boolean;
    is_mod: boolean;
    link_karma: number;
    modhash: string;
    name: string;
    over_18: boolean;
    subreddit: Subreddit;
    icon_img: string;
    is_employee: boolean;
    is_blocked: boolean;
    snoovatar_img: string;
    verified: boolean;
  }

  export interface SuspendedAccount {
    name: string;
    is_suspended: true;
    is_blocked: boolean;
  }

  export interface Award extends Created {
    award_type: string;
    coin_price: number;
    coin_reward: number;
    count: number;
    days_of_drip_extension: number;
    days_of_premium: number;
    description: string;
    end_date: string | null;
    giver_coin_reward: number;
    icon_format: string;
    icon_height: number;
    icon_url: string;
    icon_width: number;
    is_enabled: boolean;
    is_new: boolean;
    name: Fullname<Award>;
    resized_icons: {
      height: number;
      url: string;
      width: number;
    }[];
    resized_static_icons: {
      height: number;
      url: string;
      width: number;
    }[];
    start_date: string | null;
    subreddit_coin_reward: number;
    subreddit_id: string | null;
    subreddit_coin_price: number;
    tiers_by_required_awardings: {
      awardings_required: number;
      resized_icons: {
        height: number;
        url: string;
        width: number;
      }[];
      resized_static_icons: {
        height: number;
        url: string;
        width: number;
      }[];
      static_icon_height: number;
      static_icon_url: string;
      static_icon_width: number;
    }[];
    static_icon_height: number;
    static_icon_url: string;
    static_icon_width: number;
    subreddit: string;
    subreddit_name_prefixed: string;
    description_html: string;
    is_global: boolean;
    is_enabled_in_pms: boolean;
    awardings_required_to_grant_benefits: number;
  }

  export interface WikiPage {
    content_md: string;
    content_html: string;
    may_revise: boolean;
    revision_by: Thing<Account>;
    revision_date: number;
    revision_id: number;
  }

  export interface Trophy {
    name: string;
    id: string;
    description: string;
    award_id: string;
    icon_70: string;
    icon_40: string;
    url: string;
  }
}
