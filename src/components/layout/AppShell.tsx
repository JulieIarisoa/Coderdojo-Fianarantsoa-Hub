"use client";

import React from "react";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { BottomNav } from "./BottomNav";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-surface-container-lowest text-on-surface font-body flex flex-col md:flex-row">
      {/* Sidebar for Desktop */}
      <Sidebar />

      {/* Main Content Stage */}
      <main className="flex-1 w-full lg:ml-60 flex flex-col min-h-screen">
        <TopBar />
        <div className="flex-1 w-full max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-gutter pb-32 lg:pb-gutter">
          {children}
        </div>
      </main>

      {/* Bottom Navigation for Mobile */}
      <BottomNav />
    </div>
  );
}
