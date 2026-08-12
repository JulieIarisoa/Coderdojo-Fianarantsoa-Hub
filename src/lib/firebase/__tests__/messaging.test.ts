import { describe, it, expect, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  addDoc: vi.fn(),
  collection: vi.fn(),
  onSnapshot: vi.fn(),
  query: vi.fn((value: unknown) => value),
  serverTimestamp: vi.fn(() => "SERVER_TIMESTAMP"),
  where: vi.fn(),
}));

vi.mock("firebase/firestore", () => ({
  addDoc: mocks.addDoc,
  collection: mocks.collection,
  onSnapshot: mocks.onSnapshot,
  query: mocks.query,
  serverTimestamp: mocks.serverTimestamp,
  where: mocks.where,
}));

vi.mock("../config", () => ({ db: {} }));

import { sendDirectMessage, subscribeToReceivedMessages } from "../messaging";

describe("messaging module", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.collection.mockImplementation((_db: unknown, path: string) => path);
  });

  describe("sendDirectMessage", () => {
    const validMessage = {
      fromId: "u1",
      fromName: "Fanilo",
      fromAvatar: "avatar1",
      toId: "u2",
      toName: "Sarah",
      content: "Salut !",
    };

    it("stores the message and notifies the recipient", async () => {
      await sendDirectMessage(validMessage);

      expect(mocks.addDoc).toHaveBeenCalledTimes(2);
      expect(mocks.addDoc).toHaveBeenCalledWith("directMessages", {
        ...validMessage,
        createdAt: "SERVER_TIMESTAMP",
        read: false,
      });
      expect(mocks.addDoc).toHaveBeenCalledWith("notifications", {
        userId: "u2",
        type: "message",
        message: "Nouveau message de Fanilo",
        read: false,
        createdAt: "SERVER_TIMESTAMP",
      });
    });

    it("does not write anything when the message is invalid", async () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      await sendDirectMessage({ ...validMessage, toId: "" });

      expect(mocks.addDoc).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe("subscribeToReceivedMessages", () => {
    it("calls back with received messages", () => {
      mocks.onSnapshot.mockImplementation(
        (_q: unknown, success: (snap: { docs: unknown[] }) => void) => {
          success({
            docs: [
              {
                id: "m1",
                data: () => ({ toId: "u2", content: "Salut !", read: false }),
              },
            ],
          });
          return () => {};
        }
      );

      const callback = vi.fn();
      subscribeToReceivedMessages("u2", callback);

      expect(callback).toHaveBeenCalledWith([
        expect.objectContaining({ id: "m1", content: "Salut !" }),
      ]);
    });
  });
});
