import { Brand } from "@/components/Brand";
export default function NotFound() {
  return (
    <main className="login-page">
      <Brand />
      <div className="panel login-panel">
        <h1>A different direction.</h1>
        <p>This page isn’t available.</p>
        <a className="text-link" href="/">
          Back to Redirected ↗
        </a>
      </div>
    </main>
  );
}
