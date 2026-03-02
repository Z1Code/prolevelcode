import { requireRole } from "@/lib/auth/session";
import { AnalyticsDashboardLoader } from "./analytics-loader";

export const metadata = { title: "Analytics | Admin" };

export default async function AdminAnalyticsPage() {
  await requireRole(["admin", "superadmin"]);

  return (
    <div className="page-enter">
      <h2 className="mb-4 text-2xl font-semibold">Analytics</h2>
      <AnalyticsDashboardLoader />
    </div>
  );
}
