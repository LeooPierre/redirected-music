import "server-only";
import { randomUUID } from "node:crypto";
import { isDemo } from "./config";
import { database } from "./supabase";
import { hashToken } from "./tokens";
import type { MediaUpload } from "./models";
import { HttpError } from "./http";

const bucket = "guest-media";
const allowedExtensions = new Set([
  "jpg", "jpeg", "png", "webp", "heic", "heif", "pdf", "doc", "docx", "zip",
]);

export function validateMedia(files: File[]) {
  if (files.length > 10) throw new HttpError(400, "Upload no more than 10 files.");
  let total = 0;
  for (const file of files) {
    const extension = file.name.split(".").pop()?.toLowerCase() || "";
    if (!allowedExtensions.has(extension))
      throw new HttpError(400, `${file.name} is not a supported photo or press-kit file.`);
    if (file.size > 10 * 1024 * 1024)
      throw new HttpError(400, `${file.name} is larger than 10 MB.`);
    total += file.size;
  }
  if (total > 25 * 1024 * 1024)
    throw new HttpError(400, "Uploads may total no more than 25 MB.");
}

export async function uploadGuestMedia(token: string, files: File[]): Promise<MediaUpload[]> {
  validateMedia(files);
  const prefix = hashToken(token);
  const uploaded: MediaUpload[] = [];
  for (const file of files) {
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-").slice(-120);
    const path = `${prefix}/${randomUUID()}-${safeName}`;
    if (!isDemo()) {
      const { error } = await database().storage.from(bucket).upload(path, file, {
        contentType: file.type || "application/octet-stream",
        upsert: false,
      });
      if (error) {
        if (uploaded.length)
          await database().storage.from(bucket).remove(uploaded.map((item) => item.path));
        throw error;
      }
    }
    uploaded.push({ path, name: file.name, type: file.type, size: file.size });
  }
  return uploaded;
}

export async function removeGuestMedia(files: MediaUpload[]) {
  if (!isDemo() && files.length)
    await database().storage.from(bucket).remove(files.map((file) => file.path));
}

export async function signedGuestMediaUrl(path: string) {
  const { data, error } = await database().storage.from(bucket).createSignedUrl(path, 300);
  if (error) throw error;
  return data.signedUrl;
}
