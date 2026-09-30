"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="login-page">
      <div className="panel login-panel">
        <h1>A brief interruption.</h1>
        <p>We couldn’t load this page. Please try again in a moment.</p>
        <button className="button primary" onClick={reset}>
          Try again
        </button>
        <a className="text-link" href="/">
          Back to Redirected
        </a>
      </div>
    </main>
  );
}
