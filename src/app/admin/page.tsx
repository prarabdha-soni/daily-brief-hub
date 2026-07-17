import type { Metadata } from "next";

import { AdminClient } from "./admin-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin — Bharat Pulse",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return <AdminClient />;
}
