import { describe, it, expect } from "vitest";
import { UserProfile } from "@/types";
import {
  MENTOR_SEARCH_DEBOUNCE_MS,
  collectAvailableSkills,
  filterMentors,
  parseSkillsParam,
} from "../mentorFilters";

const MENTORS: UserProfile[] = [
  {
    id: "u1",
    name: "Jean Rakoto",
    email: "jean@dojo.mg",
    avatar: "",
    bio: "Python & Machine Learning mentor.",
    skills: ["Python", "AI", "Machine Learning"],
    role: "MENTOR",
    xp: 100,
    level: 1,
    badges: [],
    createdAt: "2026-01-01",
  },
  {
    id: "u2",
    name: "Sarah Jenkins",
    email: "sarah@dojo.mg",
    avatar: "",
    bio: "UX/UI Designer & Scratch Instructor.",
    skills: ["Scratch", "CSS"],
    role: "MENTOR",
    xp: 200,
    level: 2,
    badges: [],
    createdAt: "2026-01-01",
  },
  {
    id: "u3",
    name: "Marc Dubois",
    email: "marc@dojo.mg",
    avatar: "",
    bio: "React web developer.",
    skills: ["React", "JavaScript"],
    role: "MENTOR",
    xp: 300,
    level: 3,
    badges: [],
    createdAt: "2026-01-01",
  },
];

describe("parseSkillsParam", () => {
  it("returns an empty array for null or empty values", () => {
    expect(parseSkillsParam(null)).toEqual([]);
    expect(parseSkillsParam("")).toEqual([]);
    expect(parseSkillsParam("   ")).toEqual([]);
  });

  it("splits comma-separated values and trims whitespace", () => {
    expect(parseSkillsParam("Python, React ,HTML/CSS")).toEqual([
      "Python",
      "React",
      "HTML/CSS",
    ]);
  });

  it("deduplicates repeated skills", () => {
    expect(parseSkillsParam("Python,Python,React")).toEqual(["Python", "React"]);
  });
});

describe("filterMentors", () => {
  it("returns all mentors when no filter is applied", () => {
    expect(filterMentors(MENTORS, { search: "", skills: [] })).toHaveLength(3);
  });

  it("filters by name, case-insensitively", () => {
    expect(filterMentors(MENTORS, { search: "jean", skills: [] })).toEqual([
      MENTORS[0],
    ]);
    expect(filterMentors(MENTORS, { search: "SARAH", skills: [] })).toEqual([
      MENTORS[1],
    ]);
  });

  it("filters by bio", () => {
    expect(filterMentors(MENTORS, { search: "scratch", skills: [] })).toEqual([
      MENTORS[1],
    ]);
  });

  it("matches a mentor having at least one selected skill (OR logic)", () => {
    const result = filterMentors(MENTORS, { search: "", skills: ["Python", "React"] });
    expect(result.map((m) => m.id).sort()).toEqual(["u1", "u3"]);
  });

  it("returns an empty array when no mentor matches", () => {
    expect(filterMentors(MENTORS, { search: "zelda", skills: [] })).toEqual([]);
    expect(filterMentors(MENTORS, { search: "", skills: ["Rust"] })).toEqual([]);
  });

  it("combines search and skills filters", () => {
    expect(
      filterMentors(MENTORS, { search: "jean", skills: ["React"] })
    ).toEqual([]);
    expect(
      filterMentors(MENTORS, { search: "jean", skills: ["Python"] })
    ).toEqual([MENTORS[0]]);
  });
});

describe("collectAvailableSkills", () => {
  it("collects a unique, alphabetically sorted list of skills", () => {
    expect(collectAvailableSkills(MENTORS)).toEqual([
      "AI",
      "CSS",
      "JavaScript",
      "Machine Learning",
      "Python",
      "React",
      "Scratch",
    ]);
  });

  it("returns an empty list for no mentors", () => {
    expect(collectAvailableSkills([])).toEqual([]);
  });
});

describe("MENTOR_SEARCH_DEBOUNCE_MS", () => {
  it("debounces at 300ms", () => {
    expect(MENTOR_SEARCH_DEBOUNCE_MS).toBe(300);
  });
});
