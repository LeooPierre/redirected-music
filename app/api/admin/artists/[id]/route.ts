import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { artistPatchSchema } from "@/lib/models";
import { updateArtist } from "@/lib/store";
import { apiError, checkOrigin, readJson, response } from "@/lib/http";
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    checkOrigin(request);
    await requireAdmin();
    await updateArtist(
      z
        .string()
        .uuid()
        .parse((await params).id),
      artistPatchSchema.parse(await readJson(request)),
    );
    return response({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
