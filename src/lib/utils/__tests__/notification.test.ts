import { describe, it, expect } from "vitest";
import { countUnread, notificationTime, createdAtMillis } from "../notification";

describe("notification utils", () => {
  describe("countUnread", () => {
    it("counts only unread notifications", () => {
      const notifications = [
        { id: "1", read: true },
        { id: "2", read: false },
        { id: "3", read: false },
      ];

      expect(countUnread(notifications)).toBe(2);
    });

    it("returns 0 when all notifications are read", () => {
      const notifications = [
        { id: "1", read: true },
        { id: "2", read: true },
      ];

      expect(countUnread(notifications)).toBe(0);
    });

    it("returns 0 for an empty list", () => {
      expect(countUnread([])).toBe(0);
    });

    it("returns 0 for null or undefined", () => {
      expect(countUnread(null)).toBe(0);
      expect(countUnread(undefined)).toBe(0);
    });
  });

  describe("notificationTime", () => {
    it("formats a Firestore-like timestamp with toMillis", () => {
      const createdAt = { toMillis: () => Date.now() - 60_000 };
      expect(notificationTime(createdAt)).toBe("il y a 1 minute");
    });

    it("formats an ISO date string", () => {
      const createdAt = new Date(Date.now() - 600_000).toISOString();
      expect(notificationTime(createdAt)).toBe("il y a 10 minutes");
    });

    it("returns an empty string for null or undefined values", () => {
      expect(notificationTime(null)).toBe("");
      expect(notificationTime(undefined)).toBe("");
    });
  });

  describe("createdAtMillis", () => {
    it("converts a Firestore-like timestamp to milliseconds", () => {
      const createdAt = { toMillis: () => 1_700_000_000_000 };
      expect(createdAtMillis(createdAt)).toBe(1_700_000_000_000);
    });

    it("returns 0 for null or undefined values", () => {
      expect(createdAtMillis(null)).toBe(0);
      expect(createdAtMillis(undefined)).toBe(0);
    });
  });
});
