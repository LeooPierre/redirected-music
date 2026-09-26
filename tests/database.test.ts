import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { intakeSchema } from "../lib/models";
const input = intakeSchema.parse({
  artist_name: "Demo guest",
  government_name: "Private name",
  email: "guest@example.com",
  format_type: "Sessions",
  linktree_url: "https://example.com",
  short_bio: "A sample biography.",
  pre_prod_call_requested: true,
  test_acknowledged: true,
  off_limit_topics: "Private production note",
});
test("PostgreSQL migration: atomic invitations, release gate, private RLS and public projection", async () => {
  const db = new PGlite();
  try {
    await db.exec(
      "create role anon; create role authenticated; create role service_role bypassrls; grant usage on schema public to anon, authenticated, service_role;",
    );
    await db.exec(
      await readFile(
        new URL(
          "../supabase/migrations/001_invited_guests.sql",
          import.meta.url,
        ),
        "utf8",
      ),
    );
    async function invite(hash: string, extra = "") {
      await db.query<Record<string, unknown>>(
        `insert into public.invitations(token_hash,guest_name,format_type${extra ? ",expires_at" : ""}) values($1,'Sample guest','Sessions'${extra ? ",now()-interval '1 day'" : ""})`,
        [hash],
      );
    }
    const hash = "a".repeat(64);
    await invite(hash);
    await db.exec("set role service_role");
    const result = await db.query<{ id: string }>(
      "select public.submit_invited_artist($1,$2::jsonb) as id",
      [hash, JSON.stringify(input)],
    );
    const id = result.rows[0].id;
    await assert.rejects(
      db.query<Record<string, unknown>>(
        "select public.submit_invited_artist($1,$2::jsonb)",
        [hash, JSON.stringify(input)],
      ),
      /invitation_unavailable/,
    );
    const a = (
      await db.query<Record<string, unknown>>(
        "select * from public.artists where id=$1",
        [id],
      )
    ).rows[0];
    assert.equal(a.pre_prod_call_status, "pending_scheduling");
    assert.equal(a.content_release_accepted, false);
    assert.equal(a.profile_live_status, false);
    await assert.rejects(
      db.query<Record<string, unknown>>(
        "update public.artists set profile_live_status=true where id=$1",
        [id],
      ),
      /safe_publication/,
    );
    assert.equal(
      (
        await db.query<Record<string, unknown>>(
          "select * from public.artist_profiles",
        )
      ).rows.length,
      0,
    );
    await db.exec("reset role");
    const expired = "b".repeat(64);
    await invite(expired, "expired");
    await assert.rejects(
      db.query<Record<string, unknown>>(
        "select public.submit_invited_artist($1,$2::jsonb)",
        [expired, JSON.stringify(input)],
      ),
      /invitation_unavailable/,
    );
    const revoked = "c".repeat(64);
    await invite(revoked);
    await db.query<Record<string, unknown>>(
      "update public.invitations set revoked_at=now() where token_hash=$1",
      [revoked],
    );
    await assert.rejects(
      db.query<Record<string, unknown>>(
        "select public.submit_invited_artist($1,$2::jsonb)",
        [revoked, JSON.stringify(input)],
      ),
      /invitation_unavailable/,
    );
    const fresh = "d".repeat(64);
    await invite(fresh);
    await assert.rejects(
      db.query<Record<string, unknown>>(
        "select public.submit_invited_artist($1,$2::jsonb)",
        [
          fresh,
          JSON.stringify({
            ...input,
            short_bio: Array(101).fill("word").join(" "),
          }),
        ],
      ),
    );
    assert.equal(
      (
        await db.query<Record<string, unknown>>(
          "select used_at from public.invitations where token_hash=$1",
          [fresh],
        )
      ).rows[0].used_at,
      null,
      "failed insert must not consume invitation",
    );
    await assert.rejects(
      db.query<Record<string, unknown>>(
        "select public.submit_invited_artist($1,$2::jsonb)",
        [fresh, JSON.stringify({ ...input, format_type: "Backstage" })],
      ),
      /invitation_unavailable/,
    );
    // Simulate a FUTURE non-test record with an actual release, only through privileged SQL.
    await db.query<Record<string, unknown>>(
      "update public.artists set is_test=false,content_release_accepted=true,release_version='future-reviewed-release',release_accepted_at=now(),profile_live_status=true where id=$1",
      [id],
    );
    for (const role of ["anon", "authenticated"]) {
      await db.exec("set role " + role);
      await assert.rejects(
        db.query<Record<string, unknown>>(
          "select government_name from public.artists",
        ),
        /permission denied/,
      );
      await assert.rejects(
        db.query<Record<string, unknown>>(
          "select token_hash from public.invitations",
        ),
        /permission denied/,
      );
      await assert.rejects(
        db.query<Record<string, unknown>>(
          "select public.submit_invited_artist($1,$2::jsonb)",
          [fresh, JSON.stringify(input)],
        ),
        /permission denied/,
      );
      const profiles = (
        await db.query<Record<string, unknown>>(
          "select * from public.artist_profiles",
        )
      ).rows;
      assert.equal(profiles.length, 1);
      assert.equal("government_name" in profiles[0], false);
      assert.equal("off_limit_topics" in profiles[0], false);
      await assert.rejects(
        db.query<Record<string, unknown>>(
          "update public.artist_profiles set artist_name='attack'",
        ),
        /permission denied/,
      );
      await db.exec("reset role");
    }
    await db.query<Record<string, unknown>>(
      "update public.artists set profile_live_status=false where id=$1",
      [id],
    );
    assert.equal(
      (
        await db.query<Record<string, unknown>>(
          "select * from public.artist_profiles",
        )
      ).rows.length,
      0,
    );
  } finally {
    await db.close();
  }
});
