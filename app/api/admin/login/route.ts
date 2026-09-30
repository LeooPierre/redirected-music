import { z } from "zod";
import { cookies } from "next/headers";
import { authClient } from "@/lib/supabase";
import { sessionCookie } from "@/lib/auth";
import { isConfigured } from "@/lib/config";
import {
  apiError,
  checkOrigin,
  HttpError,
  readJson,
  response,
} from "@/lib/http";
export async function POST(request: Request) {
  try {
    checkOrigin(request);
    if (!isConfigured())
      throw new HttpError(
        503,
        "Supabase is not connected yet. Use the local demo to test.",
      );
    const values = z
      .object({
        email: z.string().email().max(254),
        password: z.string().min(1).max(256),
      })
      .strict()
      .parse(await readJson(request));
    const { data, error } = await authClient().auth.signInWithPassword(values);
    if (error || !data.session || data.user.id !== process.env.ADMIN_USER_ID)
      throw new HttpError(401, "Unable to sign in with these details.");
    (await cookies()).set(sessionCookie, data.session.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: Math.min(data.session.expires_in, 3600),
    });
    return response({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
