declare global {
  export enum FullnameType {
    Comment = "t1",
    Account = "t2",
    Link = "t3",
    Message = "t4",
    Subreddit = "t5",
    Award = "t6",
  }

  export enum OAuthScope {
    Creddits = "creddits",
    Edit = "edit",
    Flair = "flair",
    History = "history",
    Identity = "identity",
    LiveManage = "livemanage",
    ModConfig = "modconfig",
    ModFlair = "modflair",
    ModLog = "modlog",
    ModPosts = "modposts",
    ModWiki = "modwiki",
    MySubreddits = "mysubreddits",
    PrivateMessages = "privatemessages",
    Read = "read",
    Report = "report",
    Save = "save",
    Submit = "submit",
    Subscribe = "subscribe",
    Vote = "vote",
    WikiRead = "wikiread",
    WikiEdit = "wikiedit",
  }

  export type Permissions = Partial<
    {
      [K in OAuthScope]: {
        description: string;
        id: K;
        name: string;
      };
    }
  >;

  /**Fullnames start with the type prefix for the object's type, followed by the thing's unique ID in base 36. For example, `t3_15bfi0` */
  export type Fullname<T extends FullnameType, I extends string = string> =
    `${T}_${I}`;

  export type Thing<
    T =
      | Listing
      | Link
      | Message
      | Subreddit
      | Account
      | Award,
  > = {
    kind: T extends Listing ? "Listing"
      : T extends Comment ? FullnameType.Comment
      : T extends Link ? FullnameType.Link
      : T extends Message ? FullnameType.Message
      : T extends Subreddit ? FullnameType.Subreddit
      : T extends Account ? FullnameType.Account
      : never;
    data: T;
  };

  /**Used to paginate content that is too long to display in one go */
  export type Listing<
    T = Link | Message | Subreddit | Account | Award,
  > = {
    /**The fullname of the listing that follows before this page. null if there is no previous page. */
    before: Fullname<FullnameType> | null;
    dist: number;
    modhash: string;
    geo_filter: string;
    children: Thing<T>[];
    /**The fullname of the listing that follows after this page. null if there is no next page.*/
    after: Fullname<FullnameType> | null;
  };

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

  export type Link = Created & Votable & {
    approved_at_utc: number | null;
    subreddit: string;
    selftext: string;
    author_fullname: Fullname<FullnameType.Account>;
    saved: boolean;
    mod_reason_title: null;
    gilded: number;
    clicked: boolean;
    title: string;
    link_flair_richtext: string[];
    subreddit_name_prefixed: string;
    hidden: boolean;
    ups: number;
    hide_score: boolean;
    score: number | null;
    name: Fullname<FullnameType.Link>;
    quarantine: boolean;
    upvote_ratio: number;
    url: string;
    author: string;
    likes: boolean;
    is_self: boolean;
    locked: boolean;
    removed_by: string | null;
    permalink: string;
    removed_by_category: string | null;
  };

  export type Comment = Created & Votable & {
    approved_by: string | null;
    author: string;
    author_flair_css_class: string;
    author_flair_text: string;
    banned_by: string | null;
    body: string;
    body_html: string;
    edited: boolean | number;
    gilded: number;
    likes: boolean | null;
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
    name: Fullname<FullnameType.Comment>;
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
    author_fullname: Fullname<FullnameType.Account>;
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
  };

  export type Message = Created & {
    first_message: string | null;
    first_message_name: Fullname<FullnameType.Message> | null;
    subreddit: string | null;
    replies: string | null;
    author_fullname: Fullname<FullnameType.Account> | null;
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
    name: Fullname<FullnameType.Message>;
    context: string;
    distinguished: string | null;
  };

  export type Subreddit = {
    accounts_active: number;
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
  };

  export type Account = Created & {
    comment_karma: number;
    has_mail: boolean;
    has_mod_mail: boolean;
    has_verified_email: boolean;
    is_friend: boolean;
    is_gold: boolean;
    is_mod: boolean;
    link_karma: number;
    modhash: string;
    name: Fullname<FullnameType.Account>;
    over_18: boolean;
    subreddit: Subreddit;
    icon_img: string;
  };

  export type Award = Created & {
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
    name: Fullname<FullnameType.Award>;
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
  };
}
