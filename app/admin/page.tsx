import type { Metadata } from "next";
import { AdminDashboard } from "@/src/features/admin/components/admin-dashboard";

export const metadata: Metadata = {
  title: "Báo cáo quản trị",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return <AdminDashboard />;
}
