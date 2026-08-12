"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme, type ThemePreference } from "@/providers/ThemeProvider";

const OPTIONS: { value: ThemePreference; label: string; icon: typeof Sun }[] = [
  { value: "system", label: "Système", icon: Monitor },
  { value: "light", label: "Clair", icon: Sun },
  { value: "dark", label: "Sombre", icon: Moon },
];

export default function ThemeSelector() {
  const { theme, resolvedTheme, setTheme } = useTheme();

  const description =
    theme === "system"
      ? `Détecte automatiquement le thème du système (${resolvedTheme === "dark" ? "sombre" : "clair"} actuellement).`
      : theme === "dark"
        ? "Mode sombre activé pour toute l'application."
        : "Mode clair activé pour toute l'application.";

  return (
    <div className="flex flex-col gap-3">
      <label className="font-mono text-xs uppercase font-semibold text-on-surface flex items-center gap-1.5">
        <Moon className="w-4 h-4" />
        Apparence
      </label>

      <div
        className="flex flex-wrap gap-2"
        role="radiogroup"
        aria-label="Thème d'affichage"
      >
        {OPTIONS.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={theme === value}
            onClick={() => setTheme(value)}
            className={`inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-full font-mono text-xs font-semibold border transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary ${
              theme === value
                ? "bg-primary text-on-primary border-primary shadow-sm"
                : "bg-surface-container-high text-on-surface-variant border-outline-variant/40 hover:bg-surface-container hover:text-primary"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      <p className="font-body text-xs text-on-surface-variant" aria-live="polite">
        {description}
      </p>
    </div>
  );
}
