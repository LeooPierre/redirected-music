"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
export function LoginForm() {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError("");
        const f = new FormData(e.currentTarget);
        try {
          const r = await fetch("/api/admin/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: f.get("email"),
              password: f.get("password"),
            }),
          });
          const data = await r.json();
          if (!r.ok) throw Error(data.error);
          router.replace("/admin");
          router.refresh();
        } catch (e) {
          setError(e instanceof Error ? e.message : "Could not sign in.");
        } finally {
          setBusy(false);
        }
      }}
    >
      <label>
        Email
        <input name="email" type="email" required autoComplete="username" />
      </label>
      <label>
        Password
        <input
          name="password"
          type="password"
          required
          autoComplete="current-password"
        />
      </label>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      <button className="button primary" disabled={busy}>
        {busy ? "Signing in…" : "Sign in ↗"}
      </button>
      <p className="hint">
        Sessions last up to one hour. Use Supabase to reset your password if
        needed.
      </p>
    </form>
  );
}
