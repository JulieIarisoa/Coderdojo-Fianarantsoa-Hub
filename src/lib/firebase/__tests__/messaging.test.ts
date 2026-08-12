import { describe, it, expect, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => {
  const batch = { set: vi.fn(), update: vi.fn(), commit: vi.fn() };
  return {
    addDoc: vi.fn(),
    collection: vi.fn(),
    doc: vi.fn(),
    getDoc: vi.fn(),
    getDocs: vi.fn(),
    onSnapshot: vi.fn(),
    query: vi.fn((value: unknown) => value),
    serverTimestamp: vi.fn(() => "SERVER_TIMESTAMP"),
    Timestamp: { now: vi.fn(() => "NOW") },
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
  getDoc: mocks.getDoc,
  getDocs: mocks.getDocs,
  onSnapshot: mocks.onSnapshot,
  query: mocks.query,
  serverTimestamp: mocks.serverTimestamp,
  Timestamp: mocks.Timestamp,
  updateDoc: mocks.updateDoc,
  where: mocks.where,
  writeBatch: mocks.writeBatch,
}));

vi.mock("../config", () => ({ db: {}, auth: { currentUser: { uid: "u1" } } }));

vi.mock("@/lib/crypto/messaging", () => ({
  decryptMessage: vi.fn(),
  encryptMessage: vi.fn(() => ({ ciphertext: "ciphertext", iv: "iv" })),
  getMessageIdentities: vi.fn(() => []),
  getOrCreateMessageIdentity: vi.fn(() => ({
    publicKey: { kty: "EC", crv: "P-256", x: "sender", y: "sender" },
    privateKey: {},
  })),
}));

import { sendDirectMessage, subscribeToReceivedMessages } from "../messaging";

describe("messaging module", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.collection.mockImplementation((_db: unknown, path: string) => path);
    mocks.doc.mockImplementation((_db: unknown, path: string, id: string) => `${path}/${id}`);
    mocks.batch.commit.mockResolvedValue(undefined);
    mocks.getDoc.mockResolvedValue({ exists: () => false, data: () => ({}) });
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
      const senderPublicKey = { kty: "EC", crv: "P-256", x: "sender", y: "sender" };
      const recipientPublicKey = { kty: "EC", crv: "P-256", x: "recipient", y: "recipient" };
      mocks.getDoc
        .mockResolvedValueOnce({ exists: () => false, data: () => ({}) })
        .mockResolvedValueOnce({ data: () => ({ encryptionPublicKey: senderPublicKey }) })
        .mockResolvedValueOnce({ data: () => ({ encryptionPublicKey: recipientPublicKey }) })
        .mockResolvedValueOnce({ data: () => ({ unreadCounts: { u2: 0 } }) });

      await sendDirectMessage(validMessage);

      expect(mocks.addDoc).toHaveBeenCalledTimes(2);
      expect(mocks.batch.set).toHaveBeenCalledTimes(1);
      expect(mocks.addDoc).toHaveBeenCalledWith(
        "directMessages",
        expect.objectContaining({
          conversationId: "u1_u2",
          fromId: validMessage.fromId,
          fromName: validMessage.fromName,
          fromAvatar: validMessage.fromAvatar,
          toId: validMessage.toId,
          toName: validMessage.toName,
          ciphertext: "ciphertext",
          iv: "iv",
          encryptionVersion: 1,
          senderPublicKey,
          recipientPublicKey,
          createdAt: "SERVER_TIMESTAMP",
          read: false,
        })
      );
      expect(mocks.addDoc).toHaveBeenCalledWith("notifications", {
        userId: "u2",
        type: "message",
        message: "Nouveau message de Fanilo",
        read: false,
        createdAt: "SERVER_TIMESTAMP",
      });
    });

    it("does not write anything when the message is invalid", async () => {
      await expect(sendDirectMessage({ ...validMessage, toId: "" })).rejects.toThrow();

      expect(mocks.addDoc).not.toHaveBeenCalled();
    });
  });

  describe("subscribeToReceivedMessages", () => {
    it("calls back with received messages", async () => {
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

      await vi.waitFor(() => expect(callback).toHaveBeenCalledWith([
        expect.objectContaining({ id: "m1", content: "Salut !" }),
      ]));
    });
  });
});
