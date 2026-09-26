import { cookies } from "next/headers";
import { sessionCookie } from "@/lib/auth";
import { apiError, checkOrigin, response } from "@/lib/http";
export async function POST(request: Request) {
  try {
    checkOrigin(request);
    (await cookies()).delete(sessionCookie);
    return response({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
