import { ZodError } from "zod";
import { isDemo } from "./config";
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export function checkOrigin(request: Request) {
  const allowed = process.env.APP_URL;
  if (!allowed || request.headers.get("origin") !== new URL(allowed).origin)
    throw new HttpError(403, "Please reload this page and try again.");
  if (
    isDemo() &&
    !["127.0.0.1", "localhost", "[::1]"].includes(new URL(request.url).hostname)
  )
    throw new HttpError(403, "Demo mode is local only.");
}
export async function readJson(request: Request) {
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    throw new HttpError(415, "Expected JSON.");
  // Bound the stream itself: Content-Length may be absent or untrusted.
  const reader = request.body?.getReader();
  if (!reader) throw new HttpError(400, "Missing form data.");
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > 32768) {
      await reader.cancel();
      throw new HttpError(
        413,
        "Your submission is too large. Please shorten your answers.",
      );
    }
    chunks.push(value);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new HttpError(400, "Invalid form data.");
  }
}
export function response(data: unknown, status = 200) {
  return Response.json(data, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  });
}
export function apiError(error: unknown) {
  if (error instanceof ZodError)
    return response(
      {
        error: error.issues[0]?.message || "Check your form.",
        fields: error.flatten().fieldErrors,
      },
      400,
    );
  if (error instanceof HttpError)
    return response({ error: error.message }, error.status);
  // Do not log request bodies, credentials, tokens, or private guest answers.
  console.error(
    "Redirected request failed:",
    error instanceof Error ? error.name : "UnknownError",
  );
  return response(
    {
      error:
        "We could not save this right now. Your answers are still here; please try again.",
    },
    503,
  );
}
