export function isDemo() {
  return (
    process.env.NODE_ENV === "development" &&
    process.env.REDIRECTED_DEMO_MODE === "true"
  );
}
export function isConfigured() {
  return !!(
    process.env.SUPABASE_URL &&
    process.env.SUPABASE_SECRET_KEY &&
    process.env.SUPABASE_PUBLISHABLE_KEY &&
    process.env.ADMIN_USER_ID
  );
}
function validCalUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" &&
      url.hostname === "cal.com" &&
      !url.username &&
      !url.password &&
      url.pathname.split("/").filter(Boolean).length >= 2
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}
export function calEventUrls() {
  return {
    discussion: validCalUrl(
      process.env.CAL_DISCUSSION_URL || "https://cal.com/leonardoredirected/30min",
    ),
    Sessions: validCalUrl(
      process.env.CAL_SESSIONS_URL || "https://cal.com/leonardoredirected/redirected-sessions-recording",
    ),
    Backstage: validCalUrl(
      process.env.CAL_BACKSTAGE_URL || "https://cal.com/leonardoredirected/redirected-backstage-recording",
    ),
  };
}
