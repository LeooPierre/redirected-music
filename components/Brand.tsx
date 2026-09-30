import Link from "next/link";
export function Brand() {
  return (
    <Link className="wordmark" href="/" aria-label="Redirected homepage">
      Redirected<span className="brand-dot">↗</span>
    </Link>
  );
}
export function TestBanner({ demo }: { demo: boolean }) {
  return (
    <div className="test-banner">
      <span className="status-dot" />
      {demo
        ? "LOCAL DEMO · Sample details only. Data resets when the server restarts."
        : "PRIVATE TEST · No release is being signed. Your profile will not be published."}
    </div>
  );
}
