import { Brand } from "@/components/Brand";
import { IntakeForm } from "@/components/IntakeForm";
import { findInvite } from "@/lib/store";
import { calEventUrl, isDemo } from "@/lib/config";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Your invitation",
  robots: { index: false, follow: false },
};
export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const invite = await findInvite(token);
  if (!invite)
    return (
      <div className="login-page">
        <Brand />
        <main className="panel login-panel">
          <p className="eyebrow">By invitation</p>
          <h1>This link is unavailable.</h1>
          <p className="muted">
            It may have expired, already been used, or been withdrawn. Ask
            Leonardo for a fresh invitation.
          </p>
          <a
            className="text-link"
            href="mailto:leonardo.soares@redirectedmusic.com"
          >
            Get in touch ↗
          </a>
        </main>
      </div>
    );
  return (
    <IntakeForm
      token={token}
      invite={invite}
      demo={isDemo()}
      calUrl={calEventUrl()}
    />
  );
}
