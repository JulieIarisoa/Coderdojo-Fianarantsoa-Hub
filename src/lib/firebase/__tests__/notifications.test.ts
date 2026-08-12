import { describe, it, expect, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => {
  const batch = { update: vi.fn(), commit: vi.fn() };
  return {
    addDoc: vi.fn(),
    collection: vi.fn(),
    doc: vi.fn(),
    getDocs: vi.fn(),
    onSnapshot: vi.fn(),
    query: vi.fn((value: unknown) => value),
    serverTimestamp: vi.fn(() => "SERVER_TIMESTAMP"),
    updateDoc: vi.fn(),
    where: vi.fn(),
    writeBatch: vi.fn(() => batch),
    batch,
  };
});

vi.mock("firebase/firestore", () => ({
  addDoc: mocks.addDoc,
  collection: mocks.collection,
  doc: mocks.doc,
  getDocs: mocks.getDocs,
  onSnapshot: mocks.onSnapshot,
  query: mocks.query,
  serverTimestamp: mocks.serverTimestamp,
  updateDoc: mocks.updateDoc,
  where: mocks.where,
  writeBatch: mocks.writeBatch,
}));

vi.mock("../config", () => ({ db: {} }));

import {
  subscribeToNotifications,
  markAllNotificationsRead,
  createNotification,
  hasExistingReactionNotification,
} from "../notifications";

describe("notifications module", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.batch.commit.mockResolvedValue(undefined);
    mocks.collection.mockImplementation((_db: unknown, path: string) => path);
    mocks.doc.mockImplementation(
      (_db: unknown, path: string, id: string) => `${path}/${id}`
    );
  });

  describe("subscribeToNotifications", () => {
    it("returns a noop when userId is empty", () => {
      const noop = subscribeToNotifications("", vi.fn());
      expect(typeof noop).toBe("function");
      expect(mocks.onSnapshot).not.toHaveBeenCalled();
    });

    it("sorts the user's notifications by createdAt descending", () => {
      const docs = [
        {
          id: "n1",
          data: () => ({
            userId: "u1",
            read: false,
            createdAt: { toMillis: () => 1000 },
          }),
        },
        {
          id: "n2",
          data: () => ({
            userId: "u1",
            read: true,
            createdAt: { toMillis: () => 3000 },
          }),
        },
        {
          id: "n3",
          data: () => ({
            userId: "u1",
            read: false,
            createdAt: { toMillis: () => 2000 },
          }),
        },
      ];
      mocks.onSnapshot.mockImplementation(
        (_q: unknown, success: (snap: { docs: unknown[] }) => void) => {
          success({ docs });
          return () => {};
        }
      );

      const callback = vi.fn();
      const unsubscribe = subscribeToNotifications("u1", callback);

      expect(mocks.onSnapshot).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith([
        expect.objectContaining({ id: "n2" }),
        expect.objectContaining({ id: "n3" }),
        expect.objectContaining({ id: "n1" }),
      ]);
      expect(typeof unsubscribe).toBe("function");
    });

    it("reports snapshot errors through the error handler", () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      mocks.onSnapshot.mockImplementation(
        (
          _q: unknown,
          _success: unknown,
          onError: (error: { code: string }) => void
        ) => {
          onError({ code: "unavailable" });
          return () => {};
        }
      );

      subscribeToNotifications("u1", vi.fn());

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe("markAllNotificationsRead", () => {
    it("marks only unread notifications as read in a batch", async () => {
      mocks.getDocs.mockResolvedValue({
        docs: [
          { ref: "ref1", data: () => ({ read: false }) },
          { ref: "ref2", data: () => ({ read: true }) },
          { ref: "ref3", data: () => ({ read: false }) },
        ],
      });

      await markAllNotificationsRead("u1");

      expect(mocks.writeBatch).toHaveBeenCalledTimes(1);
      expect(mocks.batch.update).toHaveBeenCalledTimes(2);
      expect(mocks.batch.update).toHaveBeenCalledWith("ref1", { read: true });
      expect(mocks.batch.update).toHaveBeenCalledWith("ref3", { read: true });
      expect(mocks.batch.commit).toHaveBeenCalledTimes(1);
    });

    it("does nothing when everything is already read", async () => {
      mocks.getDocs.mockResolvedValue({
        docs: [{ ref: "ref1", data: () => ({ read: true }) }],
      });

      await markAllNotificationsRead("u1");

      expect(mocks.writeBatch).not.toHaveBeenCalled();
    });

    it("does nothing for an empty userId", async () => {
      await markAllNotificationsRead("");
      expect(mocks.getDocs).not.toHaveBeenCalled();
    });
  });

  describe("createNotification", () => {
    it("creates an unread notification with a server timestamp", async () => {
      mocks.addDoc.mockResolvedValue({ id: "n1" });

      await createNotification({
        userId: "u2",
        type: "message",
        message: "Nouveau message de Fanilo",
      });

      expect(mocks.addDoc).toHaveBeenCalledWith("notifications", {
        userId: "u2",
        type: "message",
        message: "Nouveau message de Fanilo",
        read: false,
        createdAt: "SERVER_TIMESTAMP",
      });
    });

    it("persists the actorId and refId when provided", async () => {
      mocks.addDoc.mockResolvedValue({ id: "n1" });

      await createNotification({
        userId: "u2",
        type: "reaction",
        message: "Fanilo a réagi à votre publication",
        actorId: "u1",
        refId: "p1",
      });

      expect(mocks.addDoc).toHaveBeenCalledWith("notifications", {
        userId: "u2",
        type: "reaction",
        message: "Fanilo a réagi à votre publication",
        actorId: "u1",
        refId: "p1",
        read: false,
        createdAt: "SERVER_TIMESTAMP",
      });
    });
  });

  describe("hasExistingReactionNotification", () => {
    it("returns true when a matching reaction notification exists", async () => {
      mocks.getDocs.mockResolvedValue({
        docs: [
          {
            data: () => ({
              type: "reaction",
              userId: "u2",
              actorId: "u1",
              refId: "p1",
            }),
          },
        ],
      });

      const result = await hasExistingReactionNotification("u2", "u1", "p1");

      expect(result).toBe(true);
      expect(mocks.query).toHaveBeenCalled();
    });

    it("returns false when no notification references the post", async () => {
      mocks.getDocs.mockResolvedValue({ docs: [] });

      const result = await hasExistingReactionNotification("u2", "u1", "p1");

      expect(result).toBe(false);
    });

    it("returns false when a notification exists for a different actor", async () => {
      mocks.getDocs.mockResolvedValue({
        docs: [
          {
            data: () => ({
              type: "reaction",
              userId: "u2",
              actorId: "u3",
              refId: "p1",
            }),
          },
        ],
      });

      const result = await hasExistingReactionNotification("u2", "u1", "p1");

      expect(result).toBe(false);
    });
  });
});
