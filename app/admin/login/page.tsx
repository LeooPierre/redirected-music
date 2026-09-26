import { Brand } from "@/components/Brand";
import { LoginForm } from "@/components/LoginForm";
import { isConfigured, isDemo } from "@/lib/config";
import Link from "next/link";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Admin sign in",
  robots: { index: false, follow: false },
};
export default function LoginPage() {
  return (
    <div className="login-page">
      <Brand />
      <main className="panel login-panel">
        <p className="eyebrow">Behind the scenes</p>
        <h1>Your guest desk.</h1>
        <p className="muted">Private access for the Redirected team.</p>
        {isDemo() ? (
          <>
            <div className="notice">
              Local demo mode is active. Use sample details only.
            </div>
            <Link className="button primary" href="/admin">
              Open demo dashboard ↗
            </Link>
          </>
        ) : isConfigured() ? (
          <LoginForm />
        ) : (
          <div className="notice">
            Your dashboard is ready to connect. Set up Supabase and your
            administrator account using the setup guide before signing in.
          </div>
        )}
      </main>
    </div>
  );
}
