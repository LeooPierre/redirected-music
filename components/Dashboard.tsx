"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Brand, TestBanner } from "./Brand";
import {
  canPublish,
  safeWebUrl,
  type Artist,
  type Invite,
  type Format,
} from "@/lib/models";
import { demoRecordedToken, demoSessionsToken } from "@/lib/demo-links";
type Invitation = Omit<Invite, "token_hash">;
const callLabels = {
  not_requested: "No call requested",
  pending_scheduling: "Needs call",
  scheduled: "Call scheduled",
  completed: "Call completed",
};
function inviteStatus(i: Invitation) {
  return i.used_at
    ? "Submitted"
    : i.revoked_at
      ? "Revoked"
      : new Date(i.expires_at) < new Date()
        ? "Expired"
        : "Invited";
}
async function mutate(url: string, method: string, body?: unknown) {
  const r = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  const data = await r.json();
  if (!r.ok) throw Error(data.error || "Unable to save.");
  return data;
}
export function Dashboard({
  artists,
  invitations,
  demo,
}: {
  artists: Artist[];
  invitations: Invitation[];
  demo: boolean;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<"guests" | "invitations">("guests");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All formats");
  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [inviteUrl, setInviteUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [inv, setInv] = useState({
    guest_name: "",
    format_type: "Sessions" as Format,
    season_number: 1,
    already_recorded: false,
  });
  const active = artists.find((a) => a.id === selected);
  const filtered = artists.filter(
    (a) =>
      (filter === "All formats" || a.format_type === filter) &&
      `${a.artist_name} ${a.email}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  const filteredInvites = invitations.filter(
    (i) =>
      (filter === "All formats" || i.format_type === filter) &&
      i.guest_name.toLowerCase().includes(search.toLowerCase()),
  );
  async function change(id: string, body: unknown) {
    setBusy(true);
    setError("");
    try {
      await mutate("/api/admin/artists/" + id, "PATCH", body);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to save.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="dashboard">
      <TestBanner demo={demo} />
      <aside className="desk-sidebar">
        <Brand />
        <p className="eyebrow desk-label">Production desk</p>
        <nav aria-label="Dashboard">
          <button
            className={tab === "guests" ? "desk-nav active" : "desk-nav"}
            onClick={() => {
              setTab("guests");
              setSelected(null);
            }}
          >
            Guests <span>{artists.length}</span>
          </button>
          <button
            className={tab === "invitations" ? "desk-nav active" : "desk-nav"}
            onClick={() => {
              setTab("invitations");
              setSelected(null);
            }}
          >
            Invitations <span>{invitations.length}</span>
          </button>
          <Link className="desk-nav" href="/artists">
            Public directory ↗
          </Link>
          <Link className="desk-nav" href="/">
            View website ↗
          </Link>
        </nav>
        <div className="desk-sidebar-bottom">
          <div className="avatar">LS</div>
          <div>
            <strong>Leonardo</strong>
            <small>Administrator</small>
          </div>
          {!demo && (
            <button
              className="text-button"
              onClick={async () => {
                await mutate("/api/admin/logout", "POST");
                router.replace("/admin/login");
                router.refresh();
              }}
            >
              Sign out
            </button>
          )}
        </div>
      </aside>
      <main className="desk-main">
        <header className="desk-top">
          <div>
            <p className="eyebrow">Redirected / Guest management</p>
            <h1>Good stories start here.</h1>
            <p className="muted">
              Your invitations, conversations, and people. All in one place.
            </p>
          </div>
          <button
            className="button primary"
            onClick={() => {
              setCreating(!creating);
              setInviteUrl("");
              setCopied(false);
            }}
          >
            + Invite a guest
          </button>
        </header>
        <div className="stats-grid">
          <div className="stat">
            <span>Submissions</span>
            <strong>{String(artists.length).padStart(2, "0")}</strong>
            <small>Ready for your review</small>
          </div>
          <div className="stat">
            <span>Needs a call</span>
            <strong>
              {String(
                artists.filter(
                  (a) => a.pre_prod_call_status === "pending_scheduling",
                ).length,
              ).padStart(2, "0")}
            </strong>
            <small>Keep the conversation going</small>
          </div>
          <div className="stat">
            <span>Open invitations</span>
            <strong>
              {String(
                invitations.filter((i) => inviteStatus(i) === "Invited").length,
              ).padStart(2, "0")}
            </strong>
            <small>A story waiting to happen</small>
          </div>
        </div>
        {creating && (
          <section
            className="panel invitation-panel"
            aria-label="Create invitation"
          >
            <div className="section-heading">
              <div>
                <p className="eyebrow">A personal invitation</p>
                <h2>Bring someone into the story.</h2>
              </div>
              <button
                className="text-button"
                onClick={() => setCreating(false)}
                aria-label="Close invitation form"
              >
                Close ×
              </button>
            </div>
            <p className="muted">
              Each link works once and expires in 14 days. Only share it with
              your invited guest.
            </p>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setBusy(true);
                setError("");
                try {
                  const data = await mutate(
                    "/api/admin/invitations",
                    "POST",
                    inv,
                  );
                  setInviteUrl(data.url);
                  setCopied(false);
                  router.refresh();
                } catch (e) {
                  setError(
                    e instanceof Error
                      ? e.message
                      : "Unable to create invitation.",
                  );
                } finally {
                  setBusy(false);
                }
              }}
            >
              <div className="form-columns three">
                <label>
                  Guest name
                  <input
                    required
                    value={inv.guest_name}
                    maxLength={120}
                    onChange={(e) =>
                      setInv({ ...inv, guest_name: e.target.value })
                    }
                  />
                </label>
                <label>
                  Episode format
                  <select
                    value={inv.format_type}
                    onChange={(e) =>
                      setInv({ ...inv, format_type: e.target.value as Format })
                    }
                  >
                    <option>Sessions</option>
                    <option>Backstage</option>
                  </select>
                </label>
                <label>
                  Season
                  <input
                    type="number"
                    required
                    min={1}
                    max={100}
                    value={inv.season_number}
                    onChange={(e) =>
                      setInv({ ...inv, season_number: Number(e.target.value) })
                    }
                  />
                </label>
              </div>
              <label className="check-card compact">
                <input
                  type="checkbox"
                  checked={inv.already_recorded}
                  onChange={(e) =>
                    setInv({ ...inv, already_recorded: e.target.checked })
                  }
                />
                <span>Already recorded — skip shoot scheduling</span>
              </label>
              <p className="hint">
                All invitations in this milestone are private tests. No release
                is collected and no profile can be published.
              </p>
              <button className="button primary" disabled={busy}>
                {busy ? "Creating…" : "Create test invitation ↗"}
              </button>
            </form>
            {inviteUrl && (
              <div className="created-link" role="status">
                <label>
                  Your guest’s private link
                  <input readOnly value={inviteUrl} />
                </label>
                <div className="inline-actions">
                  <button
                    className="button secondary"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(inviteUrl);
                        setCopied(true);
                      } catch {
                        setError("Copy the link from the field above.");
                      }
                    }}
                  >
                    {copied ? "Copied ✓" : "Copy link"}
                  </button>
                  <a
                    className="text-link"
                    href={inviteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Open invitation ↗
                  </a>
                </div>
                <p className="hint">
                  Copy it now; the full link is only shown here. Creating it
                  does not email the guest.
                </p>
              </div>
            )}
          </section>
        )}
        {demo && (
          <div className="demo-quick">
            <span>
              <strong>Try the guest experience</strong>
              <small>Two sample invitations, no account needed.</small>
            </span>
            <Link
              href={"/invite/" + demoSessionsToken}
              target="_blank"
              className="button secondary"
            >
              Sessions ↗
            </Link>
            <Link
              href={"/invite/" + demoRecordedToken}
              target="_blank"
              className="button secondary"
            >
              Recorded guest ↗
            </Link>
          </div>
        )}
        {error && (
          <div className="error" role="alert">
            {error}
          </div>
        )}
        <section className="guest-section">
          <div className="section-heading">
            <h2>{tab === "guests" ? "Your guests" : "Your invitations"}</h2>
            <span className="count-label">
              {tab === "guests" ? filtered.length : filteredInvites.length}{" "}
              showing · latest 500
            </span>
          </div>
          <div className="table-toolbar">
            <label className="search-label">
              <span className="sr-only">Search guests</span>
              <input
                type="search"
                placeholder="Search by name…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>
            <label>
              <span className="sr-only">Filter by format</span>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option>All formats</option>
                <option>Sessions</option>
                <option>Backstage</option>
              </select>
            </label>
          </div>
          {tab === "guests" ? (
            filtered.length ? (
              <div className="table-wrap">
                <table className="guest-table">
                  <thead>
                    <tr>
                      <th>Guest</th>
                      <th>Format</th>
                      <th>Musician type</th>
                      <th>Call</th>
                      <th>Profile</th>
                      <th>
                        <span className="sr-only">Review</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((a) => (
                      <tr key={a.id}>
                        <td>
                          <strong>{a.artist_name}</strong>
                          <small>
                            Season {a.season_number}
                            {a.already_recorded ? " · Recorded" : ""}
                          </small>
                        </td>
                        <td>
                          <span className="format-badge">{a.format_type}</span>
                        </td>
                        <td>
                          <span className="format-badge">
                            {a.format_type === "Sessions"
                              ? [...a.musical_roles.filter((role) => role !== "Other"), ...(a.other_musical_role ? [a.other_musical_role] : [])].join(", ") || "—"
                              : "—"}
                          </span>
                        </td>
                        <td>
                          <span
                            className={"status-badge " + a.pre_prod_call_status}
                          >
                            {callLabels[a.pre_prod_call_status]}
                          </span>
                        </td>
                        <td>
                          <span className="status-badge">
                            {a.is_test
                              ? "Private test"
                              : a.profile_live_status
                                ? "Published"
                                : "Private"}
                          </span>
                        </td>
                        <td>
                          <button
                            className="text-button"
                            onClick={() =>
                              setSelected(selected === a.id ? null : a.id)
                            }
                          >
                            {selected === a.id ? "Close" : "Review"} ↗
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state">
                <span className="empty-symbol">↗</span>
                <h3>
                  {search || filter !== "All formats"
                    ? "No matching guests."
                    : "Your first story is waiting."}
                </h3>
                <p>
                  {search || filter !== "All formats"
                    ? "Try another name or format."
                    : "When an invited guest submits their form, you’ll find their story and production notes here."}
                </p>
              </div>
            )
          ) : filteredInvites.length ? (
            <div className="table-wrap">
              <table className="guest-table">
                <thead>
                  <tr>
                    <th>Guest</th>
                    <th>Format</th>
                    <th>Status</th>
                    <th>Expires</th>
                    <th>
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvites.map((i) => (
                    <tr key={i.id}>
                      <td>
                        <strong>{i.guest_name}</strong>
                        <small>
                          Season {i.season_number}
                          {i.already_recorded ? " · Recorded" : ""}
                        </small>
                      </td>
                      <td>
                        <span className="format-badge">{i.format_type}</span>
                      </td>
                      <td>
                        <span className="status-badge">{inviteStatus(i)}</span>
                      </td>
                      <td>
                        {new Date(i.expires_at).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          timeZone: "Europe/Zurich",
                        })}
                      </td>
                      <td>
                        {inviteStatus(i) === "Invited" && (
                          <button
                            className="text-button"
                            disabled={busy}
                            onClick={async () => {
                              setBusy(true);
                              setError("");
                              try {
                                await mutate(
                                  "/api/admin/invitations/" + i.id,
                                  "DELETE",
                                );
                                router.refresh();
                              } catch (e) {
                                setError(
                                  e instanceof Error
                                    ? e.message
                                    : "Unable to revoke.",
                                );
                              } finally {
                                setBusy(false);
                              }
                            }}
                          >
                            Revoke
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <h3>No matching invitations.</h3>
              <p>Create an invitation to get started.</p>
            </div>
          )}
        </section>
        {active && (
          <section
            className="panel guest-detail"
            aria-label={"Review " + active.artist_name}
          >
            <div className="section-heading">
              <div>
                <p className="eyebrow">Private production notes</p>
                <h2>{active.artist_name}</h2>
              </div>
              <button className="text-button" onClick={() => setSelected(null)}>
                Close ×
              </button>
            </div>
            <div className="detail-columns">
              <div>
                <h3>The story</h3>
                <dl className="review-list">
                  {[
                    ["Full name", active.government_name],
                    ["Email", active.email],
                    ["Redirected moment", active.redirected_moment],
                    ["Episode focus", active.feature_promotion_focus],
                    ["Inspirations", active.musical_inspirations],
                    ["Roles", active.musical_roles.join(", ")],
                    ["Other musical role", active.other_musical_role],
                    ["Creative superpower", active.creative_superpower],
                    ["Session music plan", active.session_plan],
                    ["Studio preferences", active.technical_preferences],
                    ["Venue / location", active.backstage_location],
                    ["Access / logistics", active.backstage_access],
                    ["Event timeline", active.backstage_timeline],
                    ["Off-limit topics", active.off_limit_topics],
                    ["Drink, snack or access needs", active.dietary_preferences],
                    ["Other notes", active.other_comments],
                  ]
                    .filter(([, v]) => v)
                    .map(([label, value]) => (
                      <div key={label}>
                        <dt>{label}</dt>
                        <dd>{value}</dd>
                      </div>
                    ))}
                </dl>
                <div className="inline-actions">
                  {safeWebUrl(active.linktree_url) && (
                    <a
                      className="text-link"
                      href={active.linktree_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Profile / socials ↗
                    </a>
                  )}
                  {active.press_kit_url && safeWebUrl(active.press_kit_url) && (
                    <a
                      className="text-link"
                      href={active.press_kit_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Private media folder ↗
                    </a>
                  )}
                  {(active.media_uploads || []).map((file) => (
                    <a
                      className="text-link"
                      href={`/api/admin/media?path=${encodeURIComponent(file.path)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      key={file.path}
                    >
                      {file.name} ↗
                    </a>
                  ))}
                </div>
              </div>
              <div className="production-controls">
                <h3>Next steps</h3>
                <label>
                  Pre-production call
                  <select
                    disabled={busy || !active.pre_prod_call_requested}
                    value={active.pre_prod_call_status}
                    onChange={(e) =>
                      change(active.id, {
                        pre_prod_call_status: e.target.value,
                      })
                    }
                  >
                    {Object.entries(callLabels)
                      .filter(([k]) =>
                        active.pre_prod_call_requested
                          ? k !== "not_requested"
                          : k === "not_requested",
                      )
                      .map(([k, v]) => (
                        <option value={k} key={k}>
                          {v}
                        </option>
                      ))}
                  </select>
                </label>
                {active.already_recorded ? (
                  <div className="notice">
                    Already recorded. No shoot booking needed.
                  </div>
                ) : (
                  <ShootDate
                    key={active.id + active.scheduled_shoot_date}
                    value={active.scheduled_shoot_date}
                    busy={busy}
                    save={(value) =>
                      change(active.id, { scheduled_shoot_date: value })
                    }
                  />
                )}
                <label className="check-card">
                  <input
                    type="checkbox"
                    role="switch"
                    disabled={busy || !canPublish(active)}
                    checked={active.profile_live_status}
                    onChange={(e) =>
                      change(active.id, {
                        profile_live_status: e.target.checked,
                      })
                    }
                  />
                  <span>
                    <strong>Public profile</strong>
                    <small>
                      {canPublish(active)
                        ? "Make this approved profile visible in the directory."
                        : "Locked: test submissions have no content release."}
                    </small>
                  </span>
                </label>
                <div className="notice">
                  <strong>Consent pending</strong>
                  <p>
                    This milestone does not collect a release. A test submission
                    cannot be turned into publication permission.
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}
        <footer className="desk-footer">
          Made for the people behind the music.<span>Redirected</span>
        </footer>
      </main>
    </div>
  );
}
function ShootDate({
  value,
  busy,
  save,
}: {
  value: string | null;
  busy: boolean;
  save: (value: string | null) => Promise<void>;
}) {
  const toLocal = (value: string | null) => {
    if (!value) return "";
    const d = new Date(value);
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
  };
  const [date, setDate] = useState(toLocal(value));
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save(date ? new Date(date).toISOString() : null);
      }}
    >
      <label>
        Confirmed shoot date
        <input
          type="datetime-local"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        <span className="hint">
          Your browser’s timezone. Add after checking the booking in Cal.com;
          automatic sync is not connected yet.
        </span>
      </label>
      <button className="button secondary" disabled={busy}>
        Save shoot date
      </button>
    </form>
  );
}
