import { z } from "zod";

const text = (max = 2000) => z.string().trim().max(max).default("");
export const formatSchema = z.enum(["Sessions", "Backstage"]);
export const roleOptions = [
  "Vocalist",
  "Rapper",
  "Producer",
  "Songwriter",
  "Instrumentalist",
  "Other",
] as const;
export function safeWebUrl(value: string) {
  try {
    const u = new URL(value);
    return (
      ["https:", "http:"].includes(u.protocol) && !u.username && !u.password
    );
  } catch {
    return false;
  }
}
const link = z
  .string()
  .trim()
  .max(1000)
  .refine(safeWebUrl, "Enter a full https:// link.");
const optionalLink = z.union([z.literal(""), link]).default("");
export function spotifyEmbed(value: string) {
  if (!value) return "";
  try {
    const u = new URL(value);
    if (u.protocol !== "https:" || u.hostname !== "open.spotify.com")
      return null;
    const match = u.pathname.match(
      /^\/(?:embed\/)?(artist|album|track|playlist)\/([A-Za-z0-9]{22})\/?$/,
    );
    return match
      ? `https://open.spotify.com/embed/${match[1]}/${match[2]}`
      : null;
  } catch {
    return null;
  }
}
export const intakeSchema = z
  .object({
    artist_name: z
      .string()
      .trim()
      .min(1, "Enter your artist or professional name.")
      .max(120),
    government_name: z.string().trim().min(1, "Enter your full name.").max(160),
    email: z.string().trim().email("Enter a valid email.").max(254),
    format_type: formatSchema,
    linktree_url: link,
    press_kit_url: optionalLink,
    spotify_embed_url: text(1000).refine(
      (v) => spotifyEmbed(v) !== null,
      "Use an artist, album, track, or playlist link from open.spotify.com.",
    ),
    short_bio: z
      .string()
      .trim()
      .min(1, "Add a short introduction.")
      .max(3000)
      .refine(
        (v) => v.split(/\s+/).filter(Boolean).length <= 100,
        "Keep your bio to 100 words.",
      ),
    redirected_moment: text(),
    feature_promotion_focus: text(),
    musical_inspirations: text(),
    musical_roles: z.array(z.enum(roleOptions)).max(6).default([]),
    creative_superpower: text(),
    collaboration_style: text(),
    technical_preferences: text(),
    backstage_location: text(500),
    backstage_access: text(),
    backstage_timeline: text(),
    pre_prod_call_requested: z.boolean(),
    off_limit_topics: text(),
    dietary_preferences: text(500),
    other_comments: text(),
    test_acknowledged: z.literal(true, {
      error: "Please acknowledge this is a test.",
    }),
  })
  .strict();
export type Intake = z.infer<typeof intakeSchema>;
export type Format = z.infer<typeof formatSchema>;
export type Invite = {
  id: string;
  token_hash: string;
  guest_name: string;
  format_type: Format;
  season_number: number;
  already_recorded: boolean;
  is_test: boolean;
  created_at: string;
  expires_at: string;
  used_at: string | null;
  revoked_at: string | null;
};
export type GuestInvite = Pick<
  Invite,
  | "guest_name"
  | "format_type"
  | "season_number"
  | "already_recorded"
  | "is_test"
  | "expires_at"
>;
export type CallStatus =
  "not_requested" | "pending_scheduling" | "scheduled" | "completed";
export type Artist = Omit<Intake, "test_acknowledged"> & {
  id: string;
  invitation_id: string;
  created_at: string;
  season_number: number;
  already_recorded: boolean;
  is_test: boolean;
  pre_prod_call_status: CallStatus;
  scheduled_shoot_date: string | null;
  content_release_accepted: boolean;
  release_version: string | null;
  release_accepted_at: string | null;
  profile_live_status: boolean;
  referral_code: string;
  membership_tier: "cohort" | "alumni";
  alumni_subscription_status: "inactive" | "active" | "canceled";
};
export type PublicArtist = Pick<
  Artist,
  | "id"
  | "artist_name"
  | "format_type"
  | "season_number"
  | "short_bio"
  | "linktree_url"
  | "spotify_embed_url"
>;
export const inviteSchema = z
  .object({
    guest_name: z.string().trim().min(1).max(120),
    format_type: formatSchema,
    season_number: z.number().int().min(1).max(100),
    already_recorded: z.boolean(),
  })
  .strict();
export const artistPatchSchema = z
  .object({
    pre_prod_call_status: z
      .enum(["not_requested", "pending_scheduling", "scheduled", "completed"])
      .optional(),
    scheduled_shoot_date: z
      .string()
      .datetime({ offset: true })
      .nullable()
      .optional(),
    profile_live_status: z.boolean().optional(),
  })
  .strict()
  .refine((v) => Object.keys(v).length > 0);
export function publicProfile(a: Artist): PublicArtist {
  return {
    id: a.id,
    artist_name: a.artist_name,
    format_type: a.format_type,
    season_number: a.season_number,
    short_bio: a.short_bio,
    linktree_url: a.linktree_url,
    spotify_embed_url: a.spotify_embed_url,
  };
}
export function canPublish(a: Artist) {
  return (
    !a.is_test &&
    a.content_release_accepted &&
    !!a.release_version &&
    !!a.release_accepted_at
  );
}
export function cleanIntake(value: Intake): Intake {
  return {
    ...value,
    spotify_embed_url: spotifyEmbed(value.spotify_embed_url) || "",
    ...(value.format_type === "Backstage"
      ? {
          musical_roles: [],
          creative_superpower: "",
          collaboration_style: "",
          technical_preferences: "",
        }
      : {
          backstage_location: "",
          backstage_access: "",
          backstage_timeline: "",
        }),
  };
}
