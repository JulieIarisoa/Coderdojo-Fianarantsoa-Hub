import { describe, it, expect } from "vitest";
import { timeAgo, formatDate, formatMonthYear } from "../date";

describe("date utilities", () => {
  describe("timeAgo", () => {
    it("formats past dates with relative French text", () => {
      const pastDate = new Date(Date.now() - 1000 * 60 * 5); // 5 minutes ago
      const result = timeAgo(pastDate);
      expect(result).toMatch(/il y a/i);
    });
  });

  describe("formatDate", () => {
    it("formats date with default pattern (dd MMM yyyy) in French", () => {
      const date = new Date(2026, 0, 15); // 15 Jan 2026
      const result = formatDate(date);
      expect(result).toContain("15");
      expect(result.toLowerCase()).toContain("janv");
      expect(result).toContain("2026");
    });

    it("formats date with custom pattern", () => {
      const date = new Date(2026, 7, 10); // 10 Aug 2026
      const result = formatDate(date, "yyyy-MM-dd");
      expect(result).toBe("2026-08-10");
    });
  });

  describe("formatMonthYear", () => {
    it("formats date into month and year in French", () => {
      const date = new Date(2026, 11, 25); // 25 Dec 2026
      const result = formatMonthYear(date);
      expect(result.toLowerCase()).toContain("déc");
      expect(result).toContain("2026");
    });
  });
});
