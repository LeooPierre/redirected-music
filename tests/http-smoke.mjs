// Run against the local demo with `node tests/http-smoke.mjs`.
// Creates explicitly fictional test records; never use against production.
import assert from "node:assert/strict";
const base = "http://127.0.0.1:3000";
async function api(path, method, body, origin = base) {
  return fetch(base + path, {
    method,
    headers: { "Content-Type": "application/json", Origin: origin },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}
async function submit(token, intake, origin = base) {
  const body = new FormData();
  body.set("token", token);
  body.set("intake", JSON.stringify(intake));
  if (!intake.press_kit_url)
    body.append("media", new File(["sample"], "press-kit.pdf", { type: "application/pdf" }));
  return fetch(base + "/api/artists", { method: "POST", headers: { Origin: origin }, body });
}
assert.match(
  await (await fetch(base + "/admin")).text(),
  /LOCAL DEMO/,
  "Only run this script against the local demo",
);
const create = await api("/api/admin/invitations", "POST", {
  guest_name: "HTTP smoke — sample only",
  format_type: "Backstage",
  season_number: 1,
  already_recorded: true,
});
assert.equal(create.status, 201);
const { url } = await create.json();
const token = new URL(url).pathname.split("/").pop();
const intake = {
  artist_name: "HTTP smoke — sample only",
  government_name: "Test Person",
  email: "test@example.com",
  format_type: "Backstage",
  linktree_url: "https://example.com",
  press_kit_url: "",
  pre_prod_call_requested: false,
  test_acknowledged: true,
};
assert.equal(
  (
    await submit(token, intake, "https://other.example")
  ).status,
  403,
);
assert.equal(
  (
    await submit(token, { ...intake, profile_live_status: true })
  ).status,
  400,
);
const statuses = await Promise.all([
  submit(token, intake),
  submit(token, intake),
]);
assert.deepEqual(statuses.map((r) => r.status).sort(), [201, 410]);
assert.match(await (await fetch(url)).text(), /This link is unavailable/);
const adminHtml = await (await fetch(base + "/admin")).text();
assert.match(adminHtml, /HTTP smoke/);
// Public view must remain free of every private sample record.
const directory = await (await fetch(base + "/artists")).text();
assert.doesNotMatch(directory, /HTTP smoke|test@example.com|Test Person/);
assert.equal(
  (
    await api(
      "/api/admin/invitations",
      "POST",
      {
        guest_name: "CSRF sample",
        format_type: "Sessions",
        season_number: 1,
        already_recorded: false,
      },
      "https://other.example",
    )
  ).status,
  403,
);
console.log(
  "HTTP smoke passed: creation, origin enforcement, forged-field rejection, concurrent replay protection, consumed-link blocking, public directory privacy.",
);
