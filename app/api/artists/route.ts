import { z } from "zod";
import { intakeSchema } from "@/lib/models";
import { submitGuest } from "@/lib/store";
import { apiError, checkOrigin, readJson, response } from "@/lib/http";
export async function POST(request: Request) {
  try {
    checkOrigin(request);
    const { token, intake } = z
      .object({ token: z.string().length(64), intake: intakeSchema })
      .strict()
      .parse(await readJson(request));
    await submitGuest(token, intake);
    // Future email automation belongs AFTER commit, through an idempotent outbox.
    // No test submission sends invitations, email, or Google Meet links.
    return response({ ok: true }, 201);
  } catch (error) {
    return apiError(error);
  }
}
