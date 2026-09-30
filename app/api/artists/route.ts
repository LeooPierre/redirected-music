import { intakeSchema, type MediaUpload } from "@/lib/models";
import { findInvite, submitGuest } from "@/lib/store";
import { removeGuestMedia, uploadGuestMedia } from "@/lib/media";
import { apiError, checkOrigin, HttpError, response } from "@/lib/http";
export async function POST(request: Request) {
  let uploads: MediaUpload[] = [];
  try {
    checkOrigin(request);
    const form = await request.formData();
    const token = String(form.get("token") || "");
    const raw = String(form.get("intake") || "");
    const intake = intakeSchema.parse(JSON.parse(raw));
    const files = form.getAll("media").filter((value): value is File => value instanceof File && value.size > 0);
    if (!(await findInvite(token))) throw new HttpError(410, "This invitation is unavailable. Please ask Leonardo for a new link.");
    if (!intake.press_kit_url && files.length === 0)
      throw new HttpError(400, "Add a photos or press-kit link, or upload at least one file.");
    uploads = await uploadGuestMedia(token, files);
    await submitGuest(token, intake, uploads);
    // Future email automation belongs AFTER commit, through an idempotent outbox.
    // No test submission sends invitations, email, or Google Meet links.
    return response({ ok: true }, 201);
  } catch (error) {
    await removeGuestMedia(uploads);
    return apiError(error);
  }
}
