import "server-only";
import { cookies } from "next/headers";
import { isDemo, isConfigured } from "./config";
import { authClient } from "./supabase";
import { HttpError } from "./http";
export const sessionCookie = "redirected-admin";
export async function requireAdmin() {
  if (isDemo()) return "local-demo";
  if (!isConfigured())
    throw new HttpError(
      503,
      "Connect Supabase to enable your private dashboard.",
    );
  const token = (await cookies()).get(sessionCookie)?.value;
  if (!token) throw new HttpError(401, "Please sign in.");
  const { data, error } = await authClient().auth.getUser(token);
  if (error || !data.user || data.user.id !== process.env.ADMIN_USER_ID)
    throw new HttpError(401, "Please sign in with your administrator account.");
  return data.user.id;
}
