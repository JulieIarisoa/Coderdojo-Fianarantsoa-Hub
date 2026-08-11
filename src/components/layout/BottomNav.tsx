"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { cn } from "@/lib/utils/cn";
import {
  Home,
  Users,
  Flame,
  Trophy,
  Menu,
  X,
  HeartHandshake,
  UserSearch,
  BookImage,
  Settings,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

const mainNavItems: NavItem[] = [
  { label: "Accueil", href: "/dashboard", icon: Home },
  { label: "Mentors", href: "/mentors", icon: Users },
  { label: "Campfire", href: "/campfire", icon: Flame },
  { label: "Badges", href: "/badges", icon: Trophy },
];

export function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  const secondaryNavItems = [
    {
      label: "Secret Friend",
      href: "/secret-friend",
      icon: HeartHandshake,
      description: "Missions anonymes entre mentors",
    },
    {
      label: "Qui suis-je ?",
      href: "/qui-suis-je",
      icon: UserSearch,
      description: "Jeu du mentor mystère",
    },
    {
      label: "Memories",
      href: "/memories",
      icon: BookImage,
      description: "Photos & souvenirs du Dojo",
    },
    {
      label: "Paramètres",
      href: "/settings",
      icon: Settings,
      description: "Informations personnelles & déconnexion",
    },
  ];

  const isMoreActive =
    secondaryNavItems.some((item) => pathname?.startsWith(item.href)) ||
    pathname?.startsWith("/admin");

  return (
    <>
      {/* Mobile Bottom Navigation Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-2 py-2 bg-surface shadow-[0_-4px_16px_rgba(75,31,147,0.08)] rounded-t-xl border-t border-outline-variant/30">
        {mainNavItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname?.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center py-1 transition-all duration-200",
                isActive
                  ? "bg-primary-container text-on-primary-container rounded-full px-4 scale-95 font-bold"
                  : "text-on-surface-variant hover:text-primary"
              )}
            >
              <Icon className="w-[22px] h-[22px]" strokeWidth={isActive ? 2.5 : 2} />
              <span className="font-label-sm text-[11px] mt-0.5">{item.label}</span>
            </Link>
          );
        })}

        {/* More Menu Toggle Button */}
        <button
          onClick={() => setShowMoreMenu((prev) => !prev)}
          className={cn(
            "flex flex-col items-center justify-center py-1 transition-all duration-200",
            showMoreMenu || isMoreActive
              ? "bg-primary-container text-on-primary-container rounded-full px-4 scale-95 font-bold"
              : "text-on-surface-variant hover:text-primary"
          )}
        >
          {showMoreMenu ? (
            <X className="w-[22px] h-[22px]" strokeWidth={2.5} />
          ) : (
            <Menu className="w-[22px] h-[22px]" strokeWidth={isMoreActive ? 2.5 : 2} />
          )}
          <span className="font-label-sm text-[11px] mt-0.5">Plus</span>
        </button>
      </nav>

      {/* Backdrop overlay */}
      {showMoreMenu && (
        <div
          onClick={() => setShowMoreMenu(false)}
          className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-xs z-40 animate-in fade-in duration-200"
        />
      )}

      {/* Bottom Sheet Drawer for "Plus" */}
      {showMoreMenu && (
        <div className="lg:hidden fixed bottom-16 left-0 right-0 z-50 p-4 animate-in slide-in-from-bottom duration-200">
          <div className="bg-surface rounded-3xl p-5 card-shadow border border-outline-variant/30 max-w-lg mx-auto flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
              <div>
                <h2 className="font-headline font-extrabold text-lg text-on-surface">
                  Menu CoderDojo
                </h2>
                <p className="font-body text-xs text-on-surface-variant">
                  Accès rapide aux fonctionnalités
                </p>
              </div>
              <button
                onClick={() => setShowMoreMenu(false)}
                className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant hover:bg-surface-variant"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-2">
              {secondaryNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname?.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setShowMoreMenu(false)}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-2xl border transition-all",
                      isActive
                        ? "bg-primary-container/20 border-primary/40 text-primary font-bold"
                        : "bg-surface-container-low border-outline-variant/20 hover:bg-surface-container text-on-surface"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary-container/30 text-primary flex items-center justify-center shrink-0">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="font-headline font-bold text-sm block">
                          {item.label}
                        </span>
                        <span className="font-body text-xs text-on-surface-variant">
                          {item.description}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-on-surface-variant/60" />
                  </Link>
                );
              })}

              {/* Admin Link if Admin user */}
              {user?.role === "ADMIN" && (
                <Link
                  href="/admin"
                  onClick={() => setShowMoreMenu(false)}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-2xl border transition-all mt-1",
                    pathname?.startsWith("/admin")
                      ? "bg-primary text-on-primary font-bold border-primary"
                      : "bg-primary-container text-on-primary-container border-primary/30 hover:bg-primary-container/80"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="font-headline font-bold text-sm block">
                        Espace Administrateur
                      </span>
                      <span className="font-body text-xs opacity-80">
                        Gestion & validation des mentors
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
