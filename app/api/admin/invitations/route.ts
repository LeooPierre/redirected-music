import { requireAdmin } from "@/lib/auth";
import { inviteSchema } from "@/lib/models";
import { createInvite } from "@/lib/store";
import { apiError, checkOrigin, readJson, response } from "@/lib/http";
export async function POST(request: Request) {
  try {
    checkOrigin(request);
    await requireAdmin();
    const invite = await createInvite(
      inviteSchema.parse(await readJson(request)),
    );
    return response(
      {
        url: new URL(
          "/invite/" + invite.token,
          process.env.APP_URL!,
        ).toString(),
        expires_at: invite.expires_at,
      },
      201,
    );
  } catch (error) {
    return apiError(error);
  }
}
