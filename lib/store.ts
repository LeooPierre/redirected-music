import "server-only";
import { randomUUID } from "node:crypto";
import type { z } from "zod";
import { isDemo, isConfigured } from "./config";
import { database } from "./supabase";
import { DemoStore } from "./demo-store";
import { activeInvite, hashToken, newToken, validToken } from "./tokens";
import {
  canPublish,
  cleanIntake,
  type Artist,
  type GuestInvite,
  type Intake,
  type Invite,
  type PublicArtist,
  type inviteSchema,
  type artistPatchSchema,
} from "./models";
import { HttpError } from "./http";
const root = globalThis as typeof globalThis & { redirectedDemo?: DemoStore };
function demo() {
  return (root.redirectedDemo ??= new DemoStore());
}
export async function findInvite(token: string): Promise<GuestInvite | null> {
  if (!validToken(token)) return null;
  let invite: Invite | undefined;
  if (isDemo())
    invite = demo().invites.find((i) => i.token_hash === hashToken(token));
  else {
    if (!isConfigured()) return null;
    const { data, error } = await database()
      .from("invitations")
      .select("*")
      .eq("token_hash", hashToken(token))
      .maybeSingle();
    if (error) throw error;
    invite = data || undefined;
  }
  if (!invite || !activeInvite(invite)) return null;
  const {
    guest_name,
    format_type,
    season_number,
    already_recorded,
    is_test,
    expires_at,
  } = invite;
  return {
    guest_name,
    format_type,
    season_number,
    already_recorded,
    is_test,
    expires_at,
  };
}
export async function createInvite(values: z.infer<typeof inviteSchema>) {
  const token = newToken();
  const invite: Invite = {
    ...values,
    id: randomUUID(),
    token_hash: hashToken(token),
    is_test: true,
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 14 * 86400000).toISOString(),
    used_at: null,
    revoked_at: null,
  };
  if (isDemo()) demo().invites.unshift(invite);
  else {
    const { error } = await database().from("invitations").insert(invite);
    if (error) throw error;
  }
  return { id: invite.id, token, expires_at: invite.expires_at };
}
export async function submitGuest(token: string, value: Intake) {
  if (!validToken(token))
    throw new HttpError(
      410,
      "This invitation is unavailable. Please ask Leonardo for a new link.",
    );
  const intake = cleanIntake(value);
  let id: string | null;
  if (isDemo()) id = demo().consume(hashToken(token), intake);
  else {
    const { data, error } = await database().rpc("submit_invited_artist", {
      p_token_hash: hashToken(token),
      p_data: intake,
    });
    if (error) {
      if (error.message.includes("invitation_unavailable"))
        throw new HttpError(
          410,
          "This invitation was used, expired, or revoked. Please ask for a new link.",
        );
      throw error;
    }
    id = data;
  }
  if (!id)
    throw new HttpError(
      410,
      "This invitation was used, expired, or revoked. Please ask for a new link.",
    );
  return id;
}
export async function adminData() {
  if (isDemo())
    return {
      artists: demo().artists,
      invitations: demo().invites.map(
        ({ token_hash: _hash, ...invite }) => invite,
      ),
    };
  const db = database();
  const [a, i] = await Promise.all([
    db
      .from("artists")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500),
    db
      .from("invitations")
      .select(
        "id,guest_name,format_type,season_number,already_recorded,is_test,created_at,expires_at,used_at,revoked_at",
      )
      .order("created_at", { ascending: false })
      .limit(500),
  ]);
  if (a.error || i.error) throw a.error || i.error;
  return {
    artists: a.data as Artist[],
    invitations: i.data as Omit<Invite, "token_hash">[],
  };
}
export async function revokeInvite(id: string) {
  const revoked_at = new Date().toISOString();
  if (isDemo()) {
    const invite = demo().invites.find((i) => i.id === id && !i.used_at);
    if (!invite) throw new HttpError(404, "Invitation unavailable.");
    invite.revoked_at = revoked_at;
  } else {
    const { data, error } = await database()
      .from("invitations")
      .update({ revoked_at })
      .eq("id", id)
      .is("used_at", null)
      .select("id")
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new HttpError(404, "Invitation unavailable.");
  }
}
export async function updateArtist(
  id: string,
  values: z.infer<typeof artistPatchSchema>,
) {
  const existing = isDemo()
    ? demo().artists.find((a) => a.id === id)
    : ((await database().from("artists").select("*").eq("id", id).maybeSingle())
        .data as Artist | null);
  if (!existing) throw new HttpError(404, "Guest not found.");
  if (values.profile_live_status && !canPublish(existing))
    throw new HttpError(
      409,
      "Test submissions cannot be published. Approved release wording and a fresh live invitation are required.",
    );
  if (
    values.pre_prod_call_status &&
    ((existing.pre_prod_call_requested &&
      values.pre_prod_call_status === "not_requested") ||
      (!existing.pre_prod_call_requested &&
        values.pre_prod_call_status !== "not_requested"))
  )
    throw new HttpError(400, "Call status must match the guest’s request.");
  if (existing.already_recorded && values.scheduled_shoot_date)
    throw new HttpError(400, "This episode has already been recorded.");
  if (isDemo()) Object.assign(existing, values);
  else {
    const { error } = await database()
      .from("artists")
      .update(values)
      .eq("id", id);
    if (error) throw error;
  }
}
export async function publicArtists(): Promise<PublicArtist[]> {
  if (isDemo() || !isConfigured()) return [];
  // Deliberately read the physically separate public projection, never private intake rows.
  const { data, error } = await database()
    .from("artist_profiles")
    .select(
      "id,artist_name,format_type,season_number,short_bio,linktree_url,spotify_embed_url",
    )
    .order("artist_name");
  if (error) throw error;
  return data as PublicArtist[];
}
