import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { isDemo } from "@/lib/config";
import { signedGuestMediaUrl } from "@/lib/media";
import { apiError, HttpError } from "@/lib/http";

export async function GET(request: Request) {
  try {
    await requireAdmin();
    if (isDemo()) throw new HttpError(404, "Sample uploads are not stored.");
    const path = new URL(request.url).searchParams.get("path") || "";
    if (!/^[a-f0-9]{64}\/[a-zA-Z0-9._-]+$/.test(path))
      throw new HttpError(400, "Invalid media path.");
    return NextResponse.redirect(await signedGuestMediaUrl(path));
  } catch (error) {
    return apiError(error);
  }
}
