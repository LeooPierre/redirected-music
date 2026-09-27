"use client";
import { useRef, useState, useEffect } from "react";
import { Brand, TestBanner } from "./Brand";
import {
  intakeSchema,
  profileStepSchema,
  roleOptions,
  sessionPlanOptions,
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
  redirected_moment: "",
  feature_promotion_focus: "",
  musical_inspirations: "",
  musical_roles: [],
  other_musical_role: "",
  creative_superpower: "",
  session_plan: "" as const,
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
  calUrls,
}: {
  token: string;
  invite: GuestInvite;
  demo: boolean;
  calUrls: { discussion: string | null; Sessions: string | null; Backstage: string | null };
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
    [openCalendar, setOpenCalendar] = useState<string | null>(null),
    [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const heading = useRef<HTMLHeadingElement>(null);
  const bookings = [
    ...(draft.pre_prod_call_requested
      ? [{
        id: "discussion",
        url: calUrls.discussion,
        title: "Book your pre-production discussion.",
        copy: "Choose a 30-minute time to discuss ideas and concepts before the shoot.",
      }]
      : []),
    ...(!invite.already_recorded
      ? [{
        id: "shoot",
        url: calUrls[invite.format_type],
        title: `Book your ${invite.format_type} shoot.`,
        copy: "Choose an available recording time. Your booking remains subject to Leonardo’s confirmation.",
      }]
      : []),
  ];
  useEffect(() => {
    heading.current?.focus();
  }, [step, done]);
  function field<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }
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
      const result = profileStepSchema.safeParse({
          artist_name: draft.artist_name,
          government_name: draft.government_name,
          email: draft.email,
          linktree_url: draft.linktree_url,
          press_kit_url: draft.press_kit_url,
      });
      if (!result.success) {
        setError(result.error.issues[0].message);
        return;
      }
      if (!draft.press_kit_url && mediaFiles.length === 0) {
        setError("Add a photos or press-kit link, or upload at least one file.");
        return;
      }
      if (mediaFiles.length > 10 || mediaFiles.some((file) => file.size > 10 * 1024 * 1024) || mediaFiles.reduce((sum, file) => sum + file.size, 0) > 25 * 1024 * 1024) {
        setError("Choose up to 10 files, no more than 10 MB each and 25 MB total.");
        return;
      }
    }
    if (step === 3 && invite.format_type === "Sessions") {
      if (draft.musical_roles.length === 0) {
        setError("Choose at least one musical role.");
        return;
      }
      if (draft.musical_roles.includes("Other") && !draft.other_musical_role.trim()) {
        setError("Tell us what your other musical role is.");
        return;
      }
      if (!draft.session_plan) {
        setError("Choose how you would like to approach the song.");
        return;
      }
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
      const body = new FormData();
      body.set("token", token);
      body.set("intake", JSON.stringify(result.data));
      mediaFiles.forEach((file) => body.append("media", file));
      const r = await fetch("/api/artists", {
        method: "POST",
        body,
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
              {invite.already_recorded && (
                <div className="notice">
                  <strong>Your episode is already recorded.</strong>
                  <p>
                    No shoot booking is needed. Leonardo will follow up about
                    the next steps.
                  </p>
                </div>
              )}
              {demo && bookings.length > 0 && (
                <p className="notice">
                  These are your live Cal.com calendars. Only complete a booking
                  if you want to reserve a real time.
                </p>
              )}
              {bookings.map((booking) => (
                <div className="calendar-panel" key={booking.id}>
                  <h3>{booking.title}</h3>
                  {booking.url ? (
                    <>
                      <p>{booking.copy}</p>
                      {openCalendar === booking.id ? (
                        <iframe
                          title={booking.title}
                          src={booking.url}
                          referrerPolicy="no-referrer"
                          className="calendar-frame"
                        />
                      ) : (
                        <button
                          className="button primary"
                          onClick={() => setOpenCalendar(booking.id)}
                        >
                          Show available dates ↗
                        </button>
                      )}
                      <a
                        className="text-link"
                        href={booking.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Open this calendar in a new tab ↗
                      </a>
                    </>
                  ) : (
                    <>
                      <p>
                        This Cal.com event is not configured yet. Please contact
                        Leonardo to arrange a time.
                      </p>
                      <div className="calendar-placeholder">
                        <span>CALENDAR COMING SOON</span>
                        <p>Available dates → your selection → confirmation</p>
                      </div>
                    </>
                  )}
                </div>
              ))}
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
                  {textField("press_kit_url", "Photos or press-kit link", {
                    type: "url",
                    max: 1000,
                    hint: "Provide this link or upload files below. Please give Leonardo viewing access. You can send more later if needed.",
                  })}
                  <label>
                    Upload photos or a press kit
                    <span className="optional">Required if no link</span>
                    <input
                      type="file"
                      multiple
                      accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.pdf,.doc,.docx,.zip"
                      onChange={(event) => setMediaFiles(Array.from(event.target.files || []))}
                    />
                    <span className="hint">
                      Up to 10 JPG, PNG, WEBP, HEIC, PDF, Word, or ZIP files; 10 MB each and 25 MB total. Files stay private. You can send more later if needed.
                    </span>
                  </label>
                </>
              )}
              {step === 2 && (
                <>
                  {textField(
                    "redirected_moment",
                    "What was a turning point in your life that connected you more deeply with music?",
                    {
                      multiline: true,
                      hint: "Think of a moment of realization or a change in direction that shaped your relationship with music. That is what we call your “Redirected” moment.",
                    },
                  )}
                  {textField(
                    "feature_promotion_focus",
                    "Is there anything you would like to promote?",
                    {
                      multiline: true,
                      hint: "A single, album, upcoming project, event, or anything else you want people to discover.",
                    },
                  )}
                  {textField(
                    "musical_inspirations",
                    "Who or what inspires you musically?",
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
                          What kind of musician are you?{" "}
                          <span className="optional">Required</span>
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
                      {draft.musical_roles.includes("Other") &&
                        textField("other_musical_role", "Your other musical role", {
                          required: true,
                          max: 120,
                        })}
                      {textField(
                        "creative_superpower",
                        "What is your biggest strength when creating music?",
                        {
                          multiline: true,
                          hint: "For example: drums, melodies, songwriting, singing, arrangement, or performance.",
                        },
                      )}
                      <fieldset>
                        <legend>
                          How would you like to approach the music during your episode?{" "}
                          <span className="optional">Required</span>
                        </legend>
                        <p className="hint">
                          A Redirected Sessions episode usually creates an entire song together — from the beat and musical foundation to vocals.
                        </p>
                        <div className="session-plan-options">
                          {sessionPlanOptions.map((option) => (
                            <label className="role-chip" key={option}>
                              <input
                                type="radio"
                                name="session_plan"
                                checked={draft.session_plan === option}
                                onChange={() => field("session_plan", option)}
                              />
                              {option}
                            </label>
                          ))}
                        </div>
                      </fieldset>
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
                    textField("dietary_preferences", "Any favourite drink or snack for the shoot?", {
                      hint: "You can also mention dietary or access needs that will help us prepare.",
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
                      <dt>Photos / press kit</dt>
                      <dd>{draft.press_kit_url || `${mediaFiles.length} file${mediaFiles.length === 1 ? "" : "s"} selected`}</dd>
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
                          : draft.pre_prod_call_requested
                            ? "Choose a 30-minute discussion after submitting"
                            : `Choose a ${invite.format_type} shoot time after submitting`}
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
