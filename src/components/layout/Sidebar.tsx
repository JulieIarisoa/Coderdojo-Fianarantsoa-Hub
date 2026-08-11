"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { cn } from "@/lib/utils/cn";
import {
  LayoutDashboard,
  Users,
  Flame,
  BookImage,
  HeartHandshake,
  UserSearch,
  Trophy,
  Settings,
  ShieldCheck,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Mentors", href: "/mentors", icon: Users },
  { label: "Campfire", href: "/campfire", icon: Flame },
  { label: "Memories", href: "/memories", icon: BookImage },
  { label: "Secret Friend", href: "/secret-friend", icon: HeartHandshake },
  { label: "Qui suis-je?", href: "/qui-suis-je", icon: UserSearch },
  { label: "Badges & Ranking", href: "/badges", icon: Trophy },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  return (
    <nav className="hidden lg:flex flex-col h-full border-r border-outline-variant/40 bg-surface-container-lowest shadow-[16px_0_32px_-10px_rgba(75,31,147,0.06)] w-60 fixed left-0 top-0 z-50">
      <div className="p-gutter flex flex-col gap-2">
        {/* Brand Header */}
        <Link href="/dashboard" className="flex items-center gap-3 mb-8">
          <Image src="/logo.jpg" alt="CoderDojo Logo" width={40} height={40} className="w-10 h-10 rounded-xl object-cover shadow-sm border border-outline-variant/30" />
          <div>
            <h1 className="font-headline text-[20px] font-bold text-primary leading-tight">CoderDojo</h1>
            <p className="font-label-sm text-[12px] text-on-surface-variant">Mentor Clubhouse</p>
          </div>
        </Link>

        {/* Navigation List */}
        <ul className="flex flex-col gap-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname?.startsWith(item.href));
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 font-label-md text-label-md transition-all duration-200 rounded-r-full border-l-4",
                    isActive
                      ? "bg-surface-container text-primary border-primary font-bold shadow-sm"
                      : "text-on-surface-variant hover:bg-surface-container-high border-transparent"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}

          {user?.role === "ADMIN" && (
            <li>
              <Link
                href="/admin"
                className={cn(
                  "flex items-center gap-3 px-4 py-3 font-label-md text-label-md transition-all duration-200 rounded-r-full border-l-4",
                  pathname === "/admin" || pathname?.startsWith("/admin")
                    ? "bg-primary-container text-primary border-primary font-bold shadow-sm"
                    : "text-primary hover:bg-surface-container-high border-transparent font-semibold"
                )}
              >
                <ShieldCheck className="w-5 h-5" />
                <span>Espace Admin</span>
              </Link>
            </li>
          )}
        </ul>
      </div>

      {/* Footer / Settings */}
      <div className="mt-auto p-gutter border-t border-outline-variant/20">
        <Link
          href="/settings"
          className={cn(
            "flex items-center gap-3 px-4 py-3 text-on-surface-variant hover:bg-surface-container-high transition-colors duration-200 rounded-r-full font-label-md text-label-md border-l-4 border-transparent",
            pathname === "/settings" && "bg-surface-container text-primary border-primary font-bold"
          )}
        >
          <Settings className="w-5 h-5" />
          <span>Paramètres</span>
        </Link>
      </div>
    </nav>
  );
}
