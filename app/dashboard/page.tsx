import type { Metadata } from "next";
import { DashboardHome } from "@/src/features/auth/components/dashboard-home";

export const metadata: Metadata = {
  title: "Không gian làm việc",
  robots: { index: false, follow: false },
};

export default function DashboardPage() {
  return <DashboardHome />;
}
