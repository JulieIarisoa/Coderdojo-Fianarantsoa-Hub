import { UserProfile } from "@/types";

export const MENTOR_SEARCH_DEBOUNCE_MS = 300;

export interface MentorFilterState {
  search: string;
  skills: string[];
}

export function parseSkillsParam(value: string | null): string[] {
  if (!value) return [];
  return Array.from(
    new Set(
      value
        .split(",")
        .map((skill) => skill.trim())
        .filter(Boolean)
    )
  );
}

export function filterMentors(
  mentors: UserProfile[],
  filters: MentorFilterState
): UserProfile[] {
  const query = filters.search.trim().toLowerCase();
  const hasSkillFilter = filters.skills.length > 0;

  return mentors.filter((mentor) => {
    const matchesSearch =
      query.length === 0 ||
      mentor.name.toLowerCase().includes(query) ||
      mentor.bio.toLowerCase().includes(query);

    const matchesSkills =
      !hasSkillFilter || filters.skills.some((skill) => mentor.skills.includes(skill));

    return matchesSearch && matchesSkills;
  });
}

export function collectAvailableSkills(mentors: UserProfile[]): string[] {
  return Array.from(new Set(mentors.flatMap((mentor) => mentor.skills))).sort((a, b) =>
    a.localeCompare(b, "fr")
  );
}
