"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { Home, Users, Flame, Trophy, Menu } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

const navItems: NavItem[] = [
  { label: "Accueil", href: "/dashboard", icon: Home },
  { label: "Mentors", href: "/mentors", icon: Users },
  { label: "Campfire", href: "/campfire", icon: Flame },
  { label: "Badges", href: "/badges", icon: Trophy },
  { label: "Plus", href: "/memories", icon: Menu },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 py-2 bg-surface shadow-[0_-4px_16px_rgba(75,31,147,0.08)] rounded-t-xl border-t border-outline-variant/30">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center py-1 transition-all duration-200",
              isActive
                ? "bg-primary-container text-on-primary-container rounded-full px-4 scale-95"
                : "text-on-surface-variant hover:text-primary"
            )}
          >
            <Icon className="w-[22px] h-[22px]" strokeWidth={isActive ? 2.5 : 2} />
            <span className="font-label-sm text-[11px] mt-0.5">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
