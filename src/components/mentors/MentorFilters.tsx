"use client";

import { RotateCcw, Search, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface MentorFiltersProps {
  searchInput: string;
  onSearchChange: (value: string) => void;
  availableSkills: string[];
  selectedSkills: string[];
  onToggleSkill: (skill: string) => void;
  onReset: () => void;
  isFilterActive: boolean;
  resultCount: number;
}

export function MentorFilters({
  searchInput,
  onSearchChange,
  availableSkills,
  selectedSkills,
  onToggleSkill,
  onReset,
  isFilterActive,
  resultCount,
}: MentorFiltersProps) {
  return (
    <section aria-label="Recherche et filtres des mentors" className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <label htmlFor="mentor-search" className="sr-only">
            Rechercher un mentor par nom ou bio
          </label>
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-outline-variant w-5 h-5" />
          <input
            id="mentor-search"
            type="search"
            value={searchInput}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Rechercher un mentor..."
            autoComplete="off"
            className="w-full appearance-none pl-14 pr-6 py-3 bg-surface-bright border border-outline-variant/40 rounded-full font-body text-sm text-on-surface placeholder:text-outline-variant focus:outline-none focus:ring-2 focus:ring-primary [&::-webkit-search-cancel-button]:hidden"
          />
        </div>

        {isFilterActive && (
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center justify-center gap-1.5 px-5 py-3 bg-surface-container-high border border-outline-variant/40 rounded-full font-mono text-xs font-semibold text-on-surface-variant hover:bg-surface-container hover:text-primary transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <RotateCcw className="w-4 h-4" />
            Réinitialiser
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrer par compétences">
        {availableSkills.map((skill) => {
          const isSelected = selectedSkills.includes(skill);
          return (
            <button
              key={skill}
              type="button"
              onClick={() => onToggleSkill(skill)}
              aria-pressed={isSelected}
              className={cn(
                "inline-flex items-center gap-1.5 px-4 py-2 rounded-full font-mono text-xs font-semibold border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary",
                isSelected
                  ? "bg-primary text-on-primary border-primary shadow-sm"
                  : "bg-surface-container-high text-on-surface-variant border-outline-variant/40 hover:bg-surface-container hover:text-primary"
              )}
            >
              {skill}
              {isSelected && <X className="w-3.5 h-3.5" aria-hidden="true" />}
            </button>
          );
        })}
      </div>

      <p aria-live="polite" className="font-mono text-xs text-on-surface-variant">
        {resultCount} mentor{resultCount > 1 ? "s" : ""} trouvé{resultCount > 1 ? "s" : ""}
        {isFilterActive && " avec ces filtres"}
      </p>
    </section>
  );
}
