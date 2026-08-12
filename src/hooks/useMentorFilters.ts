"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { UserProfile } from "@/types";
import {
  MENTOR_SEARCH_DEBOUNCE_MS,
  collectAvailableSkills,
  filterMentors,
  parseSkillsParam,
} from "./mentorFilters";

interface MentorFiltersState {
  search: string;
  skills: string[];
}

export function useMentorFilters(mentors: UserProfile[]) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // On a hard refresh of a statically prerendered page, `useSearchParams` can
  // still be empty on the very first hydrated render. Fall back to the real
  // browser URL so the filters survive a reload / shared link.
  const readUrlParam = (key: string): string | null => {
    const fromRouter = searchParams.get(key);
    if (fromRouter !== null) return fromRouter;
    if (typeof window !== "undefined") {
      return new URLSearchParams(window.location.search).get(key);
    }
    return null;
  };

  const urlSearch = readUrlParam("search") ?? "";
  const skillsParam = readUrlParam("skills");
  const urlSkills = useMemo(() => parseSkillsParam(skillsParam), [skillsParam]);

  const [filters, setFilters] = useState<MentorFiltersState>({
    search: urlSearch,
    skills: urlSkills,
  });
  const [searchInput, setSearchInput] = useState(urlSearch);

  const lastWrittenUrl = useRef<string | null>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const buildUrl = useCallback(
    (search: string, skills: string[]) => {
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (skills.length > 0) params.set("skills", skills.join(","));
      const query = params.toString();
      return query ? `${pathname}?${query}` : pathname;
    },
    [pathname]
  );

  const currentUrl = useMemo(
    () => buildUrl(urlSearch, urlSkills),
    [buildUrl, urlSearch, urlSkills]
  );

  // Sync local state from the URL when it changes externally (back/forward,
  // shared link pasted in the address bar), without clobbering our own writes.
  useEffect(() => {
    if (lastWrittenUrl.current === currentUrl) return;
    lastWrittenUrl.current = currentUrl;
    setFilters({ search: urlSearch, skills: urlSkills });
    setSearchInput(urlSearch);
  }, [currentUrl, urlSearch, urlSkills]);

  // Write the committed filters to the URL whenever they change.
  useEffect(() => {
    const nextUrl = buildUrl(filters.search, filters.skills);
    if (lastWrittenUrl.current === nextUrl) return;
    lastWrittenUrl.current = nextUrl;
    router.replace(nextUrl, { scroll: false });
  }, [filters.search, filters.skills, buildUrl, router]);

  const handleSearchChange = useCallback((value: string) => {
    setSearchInput(value);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setFilters((prev) =>
        prev.search === value.trim() ? prev : { ...prev, search: value.trim() }
      );
    }, MENTOR_SEARCH_DEBOUNCE_MS);
  }, []);

  const toggleSkill = useCallback((skill: string) => {
    setFilters((prev) => {
      const skills = prev.skills.includes(skill)
        ? prev.skills.filter((s) => s !== skill)
        : [...prev.skills, skill];
      return { ...prev, skills };
    });
  }, []);

  const resetFilters = useCallback(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    setSearchInput("");
    setFilters({ search: "", skills: [] });
  }, []);

  const availableSkills = useMemo(() => collectAvailableSkills(mentors), [mentors]);

  const filteredMentors = useMemo(() => filterMentors(mentors, filters), [mentors, filters]);

  return {
    searchInput,
    setSearchInput: handleSearchChange,
    selectedSkills: filters.skills,
    toggleSkill,
    resetFilters,
    availableSkills,
    filteredMentors,
    isFilterActive: filters.search.length > 0 || filters.skills.length > 0,
  };
}
