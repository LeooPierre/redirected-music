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
export const sessionPlanOptions = [
  "Create a new original song",
  "Present and develop an existing song",
  "Create a cover or reinterpretation",
  "Not sure yet — discuss together",
] as const;
const intakeFieldsSchema = z.object({
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
    redirected_moment: text(),
    feature_promotion_focus: text(),
    musical_inspirations: text(),
    musical_roles: z.array(z.enum(roleOptions)).max(6).default([]),
    other_musical_role: text(120),
    creative_superpower: text(),
    session_plan: z.union([z.literal(""), z.enum(sessionPlanOptions)]).default(""),
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
  }).strict();
export const profileStepSchema = intakeFieldsSchema.pick({
  artist_name: true,
  government_name: true,
  email: true,
  linktree_url: true,
  press_kit_url: true,
});
export const intakeSchema = intakeFieldsSchema
  .superRefine((value, ctx) => {
    if (value.format_type === "Sessions" && value.musical_roles.length === 0)
      ctx.addIssue({ code: "custom", path: ["musical_roles"], message: "Choose at least one musical role." });
    if (value.musical_roles.includes("Other") && !value.other_musical_role)
      ctx.addIssue({ code: "custom", path: ["other_musical_role"], message: "Tell us what your other musical role is." });
    if (value.format_type === "Sessions" && !value.session_plan)
      ctx.addIssue({ code: "custom", path: ["session_plan"], message: "Choose how you would like to approach the song." });
  });
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
  media_uploads: MediaUpload[];
};
export type MediaUpload = { path: string; name: string; type: string; size: number };
export type PublicArtist = Pick<
  Artist,
  | "id"
  | "artist_name"
  | "format_type"
  | "season_number"
  | "linktree_url"
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
    linktree_url: a.linktree_url,
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
    ...(value.format_type === "Backstage"
      ? {
          musical_roles: [],
          other_musical_role: "",
          creative_superpower: "",
          session_plan: "" as const,
          technical_preferences: "",
        }
      : {
          backstage_location: "",
          backstage_access: "",
          backstage_timeline: "",
        }),
  };
}
