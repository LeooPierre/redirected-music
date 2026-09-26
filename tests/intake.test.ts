import test from "node:test";
import assert from "node:assert/strict";
import {
  intakeSchema,
  cleanIntake,
  publicProfile,
  canPublish,
  spotifyEmbed,
} from "../lib/models";
import { DemoStore } from "../lib/demo-store";
import { demoSessionsToken } from "../lib/demo-links";
import { activeInvite, hashToken, newToken } from "../lib/tokens";
import { isDemo, calEventUrl } from "../lib/config";
import { checkOrigin, readJson } from "../lib/http";
export const valid = {
  artist_name: "Sample guest",
  government_name: "Sample Person",
  email: "sample@example.com",
  format_type: "Sessions",
  linktree_url: "https://example.com/guest",
  short_bio: "A fictional musician used to test the form.",
  pre_prod_call_requested: false,
  test_acknowledged: true,
};
test("valid intake supports any profile URL and optional media folder", () => {
  const a = intakeSchema.parse(valid);
  assert.equal(a.press_kit_url, "");
  assert.equal(a.email, "sample@example.com");
});
test("forged publication and release fields are rejected", () => {
  assert.equal(
    intakeSchema.safeParse({
      ...valid,
      profile_live_status: true,
      content_release_accepted: true,
    }).success,
    false,
  );
});
test("unsafe links, excessive bios, and false test acknowledgements are rejected", () => {
  for (const change of [
    { linktree_url: "javascript:alert(1)" },
    { press_kit_url: "https://user:secret@example.com" },
    { short_bio: Array(101).fill("word").join(" ") },
    { test_acknowledged: false },
  ])
    assert.equal(
      intakeSchema.safeParse({ ...valid, ...change }).success,
      false,
    );
});
test("Spotify accepts only supported Spotify URLs, never arbitrary iframe code", () => {
  assert.equal(
    spotifyEmbed(
      "https://open.spotify.com/album/6SbgFO7RRuss5TLuk0S0wf?si=secret",
    ),
    "https://open.spotify.com/embed/album/6SbgFO7RRuss5TLuk0S0wf",
  );
  assert.equal(spotifyEmbed("https://evil.example/embed/abc"), null);
  assert.equal(spotifyEmbed('<iframe src="evil"></iframe>'), null);
});
test("hidden format answers are removed on the server", () => {
  const a = cleanIntake(
    intakeSchema.parse({
      ...valid,
      format_type: "Backstage",
      musical_roles: ["Producer"],
      technical_preferences: "private old answer",
    }),
  );
  assert.deepEqual(a.musical_roles, []);
  assert.equal(a.technical_preferences, "");
});
test("invitation tokens are random, hashed and single-use", () => {
  assert.notEqual(newToken(), newToken());
  const store = new DemoStore();
  const a = intakeSchema.parse(valid);
  assert.ok(store.consume(hashToken(demoSessionsToken), a));
  assert.equal(store.consume(hashToken(demoSessionsToken), a), null);
  assert.equal(store.artists.length, 1);
  assert.equal(store.artists[0].pre_prod_call_status, "not_requested");
});
test("expired, revoked and wrong-format invitations cannot be consumed", () => {
  for (const kind of ["expired", "revoked", "format"]) {
    const store = new DemoStore();
    if (kind === "expired")
      store.invites[0].expires_at = new Date(0).toISOString();
    if (kind === "revoked")
      store.invites[0].revoked_at = new Date().toISOString();
    const a = intakeSchema.parse({
      ...valid,
      ...(kind === "format" ? { format_type: "Backstage" } : {}),
    });
    assert.equal(store.consume(hashToken(demoSessionsToken), a), null);
  }
});
test("call requests receive pending status; publication and private-field leaks are blocked", () => {
  const store = new DemoStore();
  store.consume(
    hashToken(demoSessionsToken),
    intakeSchema.parse({
      ...valid,
      pre_prod_call_requested: true,
      off_limit_topics: "private topic",
    }),
  );
  const a = store.artists[0];
  assert.equal(a.pre_prod_call_status, "pending_scheduling");
  assert.equal(canPublish(a), false);
  const p = publicProfile(a);
  for (const key of [
    "email",
    "government_name",
    "off_limit_topics",
    "press_kit_url",
    "referral_code",
  ])
    assert.equal(key in p, false);
});
test("production cannot enable demo authentication", () => {
  const prev = {
    NODE_ENV: process.env.NODE_ENV,
    REDIRECTED_DEMO_MODE: process.env.REDIRECTED_DEMO_MODE,
  };
  Object.assign(process.env, {
    NODE_ENV: "production",
    REDIRECTED_DEMO_MODE: "true",
  });
  assert.equal(isDemo(), false);
  Object.assign(process.env, prev);
});
test("Cal.com URL config rejects unrelated hosts and credentials", () => {
  const previous = process.env.CAL_EVENT_URL;
  for (const url of [
    "https://example.com/calendar",
    "https://evil.cal.com/event",
    "https://name:pass@cal.com/name/event",
  ]) {
    process.env.CAL_EVENT_URL = url;
    assert.equal(calEventUrl(), null);
  }
  process.env.CAL_EVENT_URL = "https://cal.com/leonardo/redirected";
  assert.equal(calEventUrl(), process.env.CAL_EVENT_URL);
  if (previous === undefined) delete process.env.CAL_EVENT_URL;
  else process.env.CAL_EVENT_URL = previous;
});
test("mutation origin and bounded JSON checks reject cross-site and oversized input", async () => {
  process.env.APP_URL = "http://127.0.0.1:3000";
  assert.throws(() =>
    checkOrigin(
      new Request("http://127.0.0.1:3000/api/artists", {
        headers: { origin: "https://evil.example" },
      }),
    ),
  );
  await assert.rejects(
    readJson(
      new Request("http://127.0.0.1:3000/api/artists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "x".repeat(40000),
      }),
    ),
  );
});
test("invitation expiry is enforced at exact cutoff", () => {
  assert.equal(
    activeInvite(
      {
        expires_at: new Date(1000).toISOString(),
        used_at: null,
        revoked_at: null,
      },
      1000,
    ),
    false,
  );
});
