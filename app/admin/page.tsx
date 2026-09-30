import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { isDemo } from "@/lib/config";
import { adminData } from "@/lib/store";
import { HttpError } from "@/lib/http";
import { Dashboard } from "@/components/Dashboard";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Guest desk",
  robots: { index: false, follow: false },
};
export default async function AdminPage() {
  try {
    await requireAdmin();
  } catch (error) {
    if (error instanceof HttpError) redirect("/admin/login");
    throw error;
  }
  const data = await adminData();
  return <Dashboard {...data} demo={isDemo()} />;
}
