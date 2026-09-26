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
export function calEventUrl() {
  try {
    const url = new URL(process.env.CAL_EVENT_URL || "");
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
