import { describe, it, expect, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  addDoc: vi.fn(),
  collection: vi.fn(),
  deleteDoc: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  increment: vi.fn((value: number) => value),
  limit: vi.fn((value: number) => value),
  onSnapshot: vi.fn(),
  orderBy: vi.fn(),
  query: vi.fn((value: unknown) => value),
  serverTimestamp: vi.fn(() => "SERVER_TIMESTAMP"),
  updateDoc: vi.fn(),
  where: vi.fn(),
  arrayRemove: vi.fn((id: string) => id),
  arrayUnion: vi.fn((id: string) => id),
}));

vi.mock("firebase/firestore", () => ({
  addDoc: mocks.addDoc,
  collection: mocks.collection,
  deleteDoc: mocks.deleteDoc,
  doc: mocks.doc,
  getDoc: mocks.getDoc,
  getDocs: mocks.getDocs,
  increment: mocks.increment,
  limit: mocks.limit,
  onSnapshot: mocks.onSnapshot,
  orderBy: mocks.orderBy,
  query: mocks.query,
  serverTimestamp: mocks.serverTimestamp,
  updateDoc: mocks.updateDoc,
  where: mocks.where,
  arrayRemove: mocks.arrayRemove,
  arrayUnion: mocks.arrayUnion,
}));

vi.mock("../config", () => ({ db: {} }));

import {
  toggleLikeCampfirePost,
  addCommentToCampfirePost,
} from "../community";

describe("community module notifications", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.collection.mockImplementation(
      (_db: unknown, path: string, subPath?: string, id?: string) =>
        id ? `${path}/${subPath}/${id}` : path
    );
    mocks.doc.mockImplementation(
      (_db: unknown, path: string, id: string) => `${path}/${id}`
    );
  });

  describe("toggleLikeCampfirePost", () => {
    const post = {
      authorId: "u2",
      content: "Un post",
      reactions: { "❤️": [] },
      likesCount: 0,
    };

    it("notifies the author when a new user likes the post", async () => {
      mocks.getDoc.mockResolvedValue({ exists: () => true, data: () => post });
      mocks.getDocs.mockResolvedValue({ docs: [] });

      await toggleLikeCampfirePost("p1", { id: "u1", name: "Fanilo" });

      expect(mocks.updateDoc).toHaveBeenCalledTimes(1);
      expect(mocks.addDoc).toHaveBeenCalledWith("notifications", {
        userId: "u2",
        type: "reaction",
        message: "Fanilo a réagi ❤️ à votre publication",
        link: "/campfire",
        actorId: "u1",
        refId: "p1",
        read: false,
        createdAt: "SERVER_TIMESTAMP",
      });
    });

    it("writes a custom emoji key and includes it in the notification", async () => {
      mocks.getDoc.mockResolvedValue({ exists: () => true, data: () => post });
      mocks.getDocs.mockResolvedValue({ docs: [] });

      await toggleLikeCampfirePost("p1", { id: "u1", name: "Fanilo" }, "🎉");

      expect(mocks.updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          "reactions.🎉": expect.anything(),
        })
      );
      expect(mocks.addDoc).toHaveBeenCalledWith(
        "notifications",
        expect.objectContaining({
          message: "Fanilo a réagi 🎉 à votre publication",
        })
      );
    });

    it("does not notify when a reaction notification already exists", async () => {
      mocks.getDoc.mockResolvedValue({ exists: () => true, data: () => post });
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

      await toggleLikeCampfirePost("p1", { id: "u1", name: "Fanilo" });

      expect(mocks.updateDoc).toHaveBeenCalledTimes(1);
      expect(mocks.addDoc).not.toHaveBeenCalled();
    });

    it("does not notify when the like is removed", async () => {
      mocks.getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ ...post, reactions: { "❤️": ["u1"] } }),
      });

      await toggleLikeCampfirePost("p1", { id: "u1", name: "Fanilo" });

      expect(mocks.addDoc).not.toHaveBeenCalled();
    });

    it("does not notify when liking your own post", async () => {
      mocks.getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ ...post, authorId: "u1" }),
      });

      await toggleLikeCampfirePost("p1", { id: "u1", name: "Fanilo" });

      expect(mocks.addDoc).not.toHaveBeenCalled();
    });

    it("does nothing when the post does not exist", async () => {
      mocks.getDoc.mockResolvedValue({ exists: () => false });

      await toggleLikeCampfirePost("p1", { id: "u1", name: "Fanilo" });

      expect(mocks.updateDoc).not.toHaveBeenCalled();
      expect(mocks.addDoc).not.toHaveBeenCalled();
    });
  });

  describe("addCommentToCampfirePost", () => {
    const comment = {
      postId: "p1",
      authorId: "u1",
      authorName: "Fanilo",
      authorAvatar: "avatar",
      content: "Bien vu !",
    };

    it("notifies the author when someone comments", async () => {
      mocks.getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ authorId: "u2" }),
      });

      await addCommentToCampfirePost("p1", comment);

      expect(mocks.addDoc).toHaveBeenCalledTimes(2);
      expect(mocks.addDoc).toHaveBeenCalledWith(
        expect.stringContaining("comments"),
        expect.objectContaining({ content: "Bien vu !" })
      );
      expect(mocks.addDoc).toHaveBeenCalledWith("notifications", {
        userId: "u2",
        type: "comment",
        message: "Fanilo a commenté votre publication",
        link: "/campfire",
        actorId: "u1",
        refId: "p1",
        read: false,
        createdAt: "SERVER_TIMESTAMP",
      });
    });

    it("does not notify when commenting on your own post", async () => {
      mocks.getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ authorId: "u1" }),
      });

      await addCommentToCampfirePost("p1", comment);

      expect(mocks.addDoc).toHaveBeenCalledTimes(1);
    });
  });
});
