import { randomUUID } from "node:crypto";
import type { Artist, Intake, Invite } from "./models";
import { activeInvite, hashToken } from "./tokens";
import { demoSessionsToken, demoRecordedToken } from "./demo-links";
export class DemoStore {
  invites: Invite[];
  artists: Artist[] = [];
  constructor() {
    this.invites = [
      {
        token: demoSessionsToken,
        guest_name: "Your next guest",
        format_type: "Sessions" as const,
        already_recorded: false,
      },
      {
        token: demoRecordedToken,
        guest_name: "Your recorded guest",
        format_type: "Backstage" as const,
        already_recorded: true,
      },
    ].map(({ token, ...v }) => ({
      ...v,
      id: randomUUID(),
      token_hash: hashToken(token),
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 14 * 86400000).toISOString(),
      season_number: 1,
      is_test: true,
      used_at: null,
      revoked_at: null,
    }));
  }
  consume(tokenHash: string, intake: Intake) {
    const invite = this.invites.find((i) => i.token_hash === tokenHash);
    if (
      !invite ||
      !activeInvite(invite) ||
      invite.format_type !== intake.format_type
    )
      return null;
    // Synchronous mutation makes two simultaneous requests single-use in the local demo.
    const now = new Date().toISOString();
    const { test_acknowledged: _ack, ...values } = intake;
    const artist: Artist = {
      ...values,
      id: randomUUID(),
      invitation_id: invite.id,
      created_at: now,
      season_number: invite.season_number,
      already_recorded: invite.already_recorded,
      is_test: true,
      pre_prod_call_status: values.pre_prod_call_requested
        ? "pending_scheduling"
        : "not_requested",
      scheduled_shoot_date: null,
      content_release_accepted: false,
      release_version: null,
      release_accepted_at: null,
      profile_live_status: false,
      referral_code: randomUUID(),
      membership_tier: "cohort",
      alumni_subscription_status: "inactive",
    };
    this.artists.unshift(artist);
    invite.used_at = now;
    return artist.id;
  }
}
