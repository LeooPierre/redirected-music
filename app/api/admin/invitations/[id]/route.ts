import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { revokeInvite } from "@/lib/store";
import { apiError, checkOrigin, response } from "@/lib/http";
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    checkOrigin(request);
    await requireAdmin();
    await revokeInvite(
      z
        .string()
        .uuid()
        .parse((await params).id),
    );
    return response({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
