import { createHash, randomBytes } from "node:crypto";
export const newToken = () => randomBytes(32).toString("hex");
export const validToken = (token: string) => /^[a-f0-9]{64}$/.test(token);
export const hashToken = (token: string) =>
  createHash("sha256").update(token).digest("hex");
export function activeInvite(
  invite: {
    expires_at: string;
    used_at: string | null;
    revoked_at: string | null;
  },
  now = Date.now(),
) {
  return (
    !invite.used_at && !invite.revoked_at && Date.parse(invite.expires_at) > now
  );
}
