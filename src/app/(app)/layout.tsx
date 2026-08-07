"use client";

import { ProtectedAppShell } from "@/components/layout/ProtectedAppShell";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedAppShell>{children}</ProtectedAppShell>;
}
