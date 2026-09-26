"use client";
import { useRef, useState, useEffect } from "react";
import { Brand, TestBanner } from "./Brand";
import {
  intakeSchema,
  roleOptions,
  type GuestInvite,
  type Intake,
} from "@/lib/models";
const steps = [
  "Your episode",
  "Your profile",
  "Your story",
  "The details",
  "Review",
];
const empty = {
  artist_name: "",
  government_name: "",
  email: "",
  linktree_url: "",
  press_kit_url: "",
  spotify_embed_url: "",
  short_bio: "",
  redirected_moment: "",
  feature_promotion_focus: "",
  musical_inspirations: "",
  musical_roles: [],
  creative_superpower: "",
  collaboration_style: "",
  technical_preferences: "",
  backstage_location: "",
  backstage_access: "",
  backstage_timeline: "",
  pre_prod_call_requested: false,
  off_limit_topics: "",
  dietary_preferences: "",
  other_comments: "",
};
type Draft = Omit<Intake, "test_acknowledged"> & { test_acknowledged: boolean };
export function IntakeForm({
  token,
  invite,
  demo,
  calUrl,
}: {
  token: string;
  invite: GuestInvite;
  demo: boolean;
  calUrl: string | null;
}) {
  const [step, setStep] = useState(0),
    [draft, setDraft] = useState<Draft>({
      ...empty,
      format_type: invite.format_type,
      test_acknowledged: false,
    });
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [done, setDone] = useState(false),
    [showCalendar, setShowCalendar] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus();
  }, [step, done]);
  function field<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }
  const words = draft.short_bio.trim().split(/\s+/).filter(Boolean).length;
  const textField = (
    key: keyof Draft,
    label: string,
    options: {
      required?: boolean;
      type?: string;
      hint?: string;
      multiline?: boolean;
      max?: number;
    } = {},
  ) => (
    <label key={key}>
      {label}
      {!options.required && <span className="optional">Optional</span>}
      {options.multiline ? (
        <textarea
          name={key}
          value={String(draft[key])}
          onChange={(e) => field(key, e.target.value as never)}
          required={options.required}
          maxLength={options.max || 2000}
          rows={4}
        />
      ) : (
        <input
          name={key}
          value={String(draft[key])}
          onChange={(e) => field(key, e.target.value as never)}
          type={options.type || "text"}
          required={options.required}
          maxLength={options.max || 500}
        />
      )}{" "}
      {options.hint && <span className="hint">{options.hint}</span>}
    </label>
  );
  async function next(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    if (step === 1) {
      const result = intakeSchema
        .pick({
          artist_name: true,
          government_name: true,
          email: true,
          linktree_url: true,
          press_kit_url: true,
          spotify_embed_url: true,
        })
        .safeParse({
          artist_name: draft.artist_name,
          government_name: draft.government_name,
          email: draft.email,
          linktree_url: draft.linktree_url,
          press_kit_url: draft.press_kit_url,
          spotify_embed_url: draft.spotify_embed_url,
        });
      if (!result.success) {
        setError(result.error.issues[0].message);
        return;
      }
    }
    if (step === 2 && (!words || words > 100)) {
      setError("Please add a bio of 1–100 words.");
      return;
    }
    if (step < 4) {
      setStep(step + 1);
      return;
    }
    const result = intakeSchema.safeParse(draft);
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }
    setBusy(true);
    try {
      const r = await fetch("/api/artists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, intake: result.data }),
      });
      const data = await r.json();
      if (!r.ok) throw Error(data.error);
      setDone(true);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Could not save. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="intake-page">
      <TestBanner demo={demo} />
      <header className="public-header">
        <Brand />
        <span className="private-label">By invitation only</span>
      </header>
      <main className="intake-shell">
        <aside className="intake-aside">
          <p className="eyebrow">
            Season {String(invite.season_number).padStart(2, "0")} /{" "}
            {invite.format_type}
          </p>
          <h1>
            Every story <br />
            starts somewhere.
          </h1>
          <p className="muted">Let’s make room for yours.</p>
          <ol className="step-list">
            {steps.map((s, i) => (
              <li
                key={s}
                className={
                  i === step && !done
                    ? "active"
                    : i < step || done
                      ? "complete"
                      : ""
                }
                aria-current={i === step && !done ? "step" : undefined}
              >
                <span>
                  {i < step || done ? "✓" : String(i + 1).padStart(2, "0")}
                </span>
                {s}
              </li>
            ))}
          </ol>
          <p className="aside-note">
            A few questions before we create something together. About 8–10
            minutes.
            <br />
            <br />
            Your production notes stay between you and Leonardo.
          </p>
        </aside>
        <section className="intake-content" aria-label="Guest intake">
          {done ? (
            <div className="success-panel">
              <span className="success-icon">✓</span>
              <p className="eyebrow">Test submission received</p>
              <h2 ref={heading} tabIndex={-1}>
                You’re on the guest list.
              </h2>
              <p>
                Thanks, {draft.artist_name}. Leonardo can now review your
                answers. Your profile is private and no content release has been
                signed.
              </p>
              {invite.already_recorded ? (
                <div className="notice">
                  <strong>Your episode is already recorded.</strong>
                  <p>
                    No shoot booking is needed. Leonardo will follow up about
                    the next steps.
                  </p>
                </div>
              ) : (
                <div className="calendar-panel">
                  <h3>Find your time.</h3>
                  {calUrl && !demo ? (
                    <>
                      <p>
                        Choose from Leonardo’s availability on Cal.com. Check
                        the booking confirmation there; this form does not
                        confirm or reserve a time.
                      </p>
                      {showCalendar ? (
                        <iframe
                          title="Choose an available time on Cal.com"
                          src={calUrl}
                          referrerPolicy="no-referrer"
                          className="calendar-frame"
                        />
                      ) : (
                        <button
                          className="button primary"
                          onClick={() => setShowCalendar(true)}
                        >
                          Show available dates ↗
                        </button>
                      )}
                      <a
                        className="text-link"
                        href={calUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Open Cal.com in a new tab ↗
                      </a>
                    </>
                  ) : (
                    <>
                      <p>
                        Leonardo’s calendar will appear here once Cal.com is
                        connected. No date has been booked during this test.
                      </p>
                      <div className="calendar-placeholder">
                        <span>CALENDAR COMING SOON</span>
                        <p>Available dates → your selection → confirmation</p>
                      </div>
                    </>
                  )}
                </div>
              )}
              {draft.pre_prod_call_requested && (
                <p className="notice">
                  Your request for a pre-production call is noted. Leonardo will
                  arrange it with you separately.
                </p>
              )}
              <a className="text-link" href="/">
                Back to Redirected ↗
              </a>
            </div>
          ) : (
            <form onSubmit={next}>
              <p className="eyebrow">
                {String(step + 1).padStart(2, "0")} /{" "}
                {String(steps.length).padStart(2, "0")}{" "}
                <span className="mobile-step">{steps[step]}</span>
              </p>
              <h2 ref={heading} tabIndex={-1}>
                {
                  [
                    "What are we filming?",
                    "Your world, in a few links.",
                    "Let’s hear your story.",
                    "Make yourself at home.",
                    "One last look.",
                  ][step]
                }
              </h2>
              {step === 0 && (
                <>
                  <p className="muted">
                    Welcome, {invite.guest_name}. Leonardo has invited you to
                    Redirected {invite.format_type}.
                  </p>
                  <fieldset className="format-options">
                    <legend className="sr-only">Episode format</legend>
                    {(["Sessions", "Backstage"] as const).map((f) => (
                      <label
                        className={
                          "format-option " +
                          (f === invite.format_type
                            ? "selected"
                            : "unavailable")
                        }
                        key={f}
                      >
                        <input
                          type="radio"
                          name="format_type"
                          checked={f === invite.format_type}
                          disabled={f !== invite.format_type}
                          readOnly
                        />
                        <span>
                          <strong>Redirected {f}</strong>
                          <small>
                            {f === "Sessions"
                              ? "A conversation. A collaboration. A creative seed."
                              : "The people and work behind the spotlight."}
                          </small>
                        </span>
                        <span aria-hidden="true">
                          {f === invite.format_type ? "↗" : ""}
                        </span>
                      </label>
                    ))}
                  </fieldset>
                  <p className="hint">
                    Your invitation sets the format. If it needs changing, ask
                    Leonardo for a new link.
                  </p>
                  {invite.already_recorded && (
                    <div className="notice">
                      Already recorded — we’ll skip shoot scheduling for this
                      invitation.
                    </div>
                  )}
                  <div className="notice">
                    This is a test of the guest form, not a release agreement.
                    Nothing you submit will be published.
                    {demo ? " Please use made-up details." : ""}
                  </div>
                </>
              )}
              {step === 1 && (
                <>
                  <p className="muted form-intro">
                    How should we introduce you, and where can we explore your
                    work?
                  </p>
                  {textField("artist_name", "Artist / professional name", {
                    required: true,
                    max: 120,
                  })}
                  <div className="form-columns">
                    {textField("government_name", "Full name", {
                      required: true,
                      max: 160,
                      hint: "Private — only Leonardo can see this.",
                    })}
                    {textField("email", "Email address", {
                      required: true,
                      type: "email",
                      max: 254,
                      hint: "Private — for episode planning.",
                    })}
                  </div>
                  {textField("linktree_url", "Your main profile or link hub", {
                    required: true,
                    type: "url",
                    max: 1000,
                    hint: "Linktree, Feature.fm, Instagram, a website — wherever your work lives.",
                  })}
                  {textField("press_kit_url", "Photos, videos, or press kit", {
                    type: "url",
                    max: 1000,
                    hint: "A media-folder or press-kit link. Please give Leonardo viewing access; don’t include passwords here. This link stays private.",
                  })}
                  {textField("spotify_embed_url", "Spotify link", {
                    type: "url",
                    max: 1000,
                    hint: "An artist, album, track, or playlist URL — not embed code.",
                  })}
                </>
              )}
              {step === 2 && (
                <>
                  {textField("short_bio", "A short introduction", {
                    required: true,
                    multiline: true,
                    max: 3000,
                    hint: `${words}/100 words · This may become your public bio, only after a future release and your profile is approved.`,
                  })}
                  {textField(
                    "redirected_moment",
                    "What was your “redirected” moment?",
                    {
                      multiline: true,
                      hint: "A turning point, a change of direction, or the moment things started to click.",
                    },
                  )}
                  {textField(
                    "feature_promotion_focus",
                    "What would you like this episode to explore?",
                    {
                      multiline: true,
                      hint: "A project, a question, a part of your world people don’t usually see.",
                    },
                  )}
                  {textField(
                    "musical_inspirations",
                    "Who or what inspires you?",
                    { multiline: true },
                  )}
                </>
              )}
              {step === 3 && (
                <>
                  {invite.format_type === "Sessions" ? (
                    <>
                      <fieldset>
                        <legend>
                          Your musical roles{" "}
                          <span className="optional">Optional</span>
                        </legend>
                        <div className="role-options">
                          {roleOptions.map((role) => (
                            <label className="role-chip" key={role}>
                              <input
                                type="checkbox"
                                checked={draft.musical_roles.includes(role)}
                                onChange={(e) =>
                                  field(
                                    "musical_roles",
                                    e.target.checked
                                      ? [...draft.musical_roles, role]
                                      : draft.musical_roles.filter(
                                          (r) => r !== role,
                                        ),
                                  )
                                }
                              />
                              {role}
                            </label>
                          ))}
                        </div>
                      </fieldset>
                      {textField(
                        "creative_superpower",
                        "Your creative superpower",
                        { multiline: true },
                      )}
                      {textField(
                        "collaboration_style",
                        "How do you like to collaborate?",
                        { multiline: true },
                      )}
                      {textField(
                        "technical_preferences",
                        "Your studio setup & preferences",
                        {
                          multiline: true,
                          hint: "DAW, microphones, instruments, or anything that helps you feel ready.",
                        },
                      )}
                    </>
                  ) : (
                    <>
                      {textField(
                        "backstage_location",
                        "Venue / event / location",
                      )}
                      {textField(
                        "backstage_access",
                        "Access & filming logistics",
                        {
                          multiline: true,
                          hint: "Who should we coordinate with? Any restricted areas or permissions to arrange?",
                        },
                      )}
                      {textField("backstage_timeline", "The day’s timeline", {
                        multiline: true,
                        hint: "Travel, setup, soundcheck, doors, set times — approximate is fine.",
                      })}
                    </>
                  )}
                  <label className="check-card">
                    <input
                      type="checkbox"
                      checked={draft.pre_prod_call_requested}
                      onChange={(e) =>
                        field("pre_prod_call_requested", e.target.checked)
                      }
                    />
                    <span>
                      <strong>A quick conversation first?</strong>
                      <small>
                        Would you like to discuss ideas or concepts in a brief
                        call before the shoot? For recorded episodes, use this
                        to request a follow-up conversation.
                      </small>
                    </span>
                  </label>
                  {textField(
                    "off_limit_topics",
                    "Anything you’d rather not discuss?",
                    {
                      multiline: true,
                      hint: "Private — production planning only.",
                    },
                  )}
                  {!invite.already_recorded &&
                    textField("dietary_preferences", "Food or access needs", {
                      hint: "Only share what will help us prepare.",
                    })}
                  {textField(
                    "other_comments",
                    "Anything else we should know?",
                    { multiline: true },
                  )}
                </>
              )}
              {step === 4 && (
                <>
                  <p className="muted form-intro">
                    Check the essentials below. Use Back to adjust any of your
                    answers before sending.
                  </p>
                  <dl className="review-list">
                    <div>
                      <dt>Guest</dt>
                      <dd>{draft.artist_name}</dd>
                    </div>
                    <div>
                      <dt>Episode</dt>
                      <dd>
                        {invite.format_type} · Season {invite.season_number}
                      </dd>
                    </div>
                    <div>
                      <dt>Private contact</dt>
                      <dd>{draft.email}</dd>
                    </div>
                    <div>
                      <dt>Profile link</dt>
                      <dd>{draft.linktree_url}</dd>
                    </div>
                    <div>
                      <dt>Bio</dt>
                      <dd>{draft.short_bio}</dd>
                    </div>
                    <div>
                      <dt>Pre-production call</dt>
                      <dd>
                        {draft.pre_prod_call_requested
                          ? "Requested"
                          : "Not requested"}
                      </dd>
                    </div>
                    <div>
                      <dt>Shoot</dt>
                      <dd>
                        {invite.already_recorded
                          ? "Already recorded — no scheduling needed"
                          : "Choose a time after submitting, once the calendar is ready"}
                      </dd>
                    </div>
                  </dl>
                  <div className="notice">
                    <strong>Release wording is still being prepared.</strong>
                    <p>
                      This test does not authorize publication of your name,
                      image, recording, or profile. Leonardo will arrange the
                      release separately before anything goes live.
                    </p>
                  </div>
                  <label className="check-card">
                    <input
                      type="checkbox"
                      required
                      checked={draft.test_acknowledged}
                      onChange={(e) =>
                        field("test_acknowledged", e.target.checked)
                      }
                    />
                    <span>
                      I understand this is a private test submission, not a
                      content release.
                      {demo ? " I am using sample details." : ""}
                    </span>
                  </label>
                </>
              )}
              {error && (
                <p className="error" role="alert">
                  {error}
                </p>
              )}
              <div className="form-actions">
                {step > 0 ? (
                  <button
                    type="button"
                    className="button quiet"
                    disabled={busy}
                    onClick={() => {
                      setError("");
                      setStep(step - 1);
                    }}
                  >
                    ← Back
                  </button>
                ) : (
                  <span className="hint">Your story, your pace.</span>
                )}
                <button className="button primary" disabled={busy}>
                  {busy
                    ? "Sending…"
                    : step === 4
                      ? "Send test submission ↗"
                      : "Continue →"}
                </button>
              </div>
              <p className="form-footnote">
                Your answers stay in this tab until you submit. Keep it open to
                avoid losing your progress.
              </p>
            </form>
          )}
        </section>
      </main>
      <footer className="intake-footer">
        <span>Redirected · Independent stories.</span>
        <a href="mailto:leonardo.soares@redirectedmusic.com">Need a hand? ↗</a>
      </footer>
    </div>
  );
}
