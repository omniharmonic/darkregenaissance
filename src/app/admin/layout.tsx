import type { Metadata } from "next";
import './admin.css';

export const metadata: Metadata = {
  title: "Admin Dashboard - Dark Regenaissance",
  description: "Administrative control panel",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

