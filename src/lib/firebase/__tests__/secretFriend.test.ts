import { describe, it, expect } from "vitest";

function computeRecipientId({
  user,
  assignment,
  replyTo,
}: {
  user: { id: string };
  assignment: { secretFriendId: string };
  replyTo: { id: string; senderId: string; recipientId: string } | null;
}): string {
  return replyTo
    ? replyTo.senderId === user.id
      ? replyTo.recipientId
      : replyTo.senderId
    : assignment.secretFriendId;
}

describe("Secret Friend Bidirectional Reply Recipient Logic", () => {
  const assignment = { secretFriendId: "secret-friend-123" };

  it("assigns recipientId to secretFriendId when sending initial message without replyTo", () => {
    const user = { id: "user-A" };
    const recipientId = computeRecipientId({ user, assignment, replyTo: null });
    expect(recipientId).toBe("secret-friend-123");
  });

  it("assigns recipientId to replyTo.senderId when replying to a received message", () => {
    const user = { id: "user-B" };
    const receivedMessage = {
      id: "msg-1",
      senderId: "user-A",
      recipientId: "user-B",
    };
    const recipientId = computeRecipientId({ user, assignment, replyTo: receivedMessage });
    expect(recipientId).toBe("user-A");
  });

  it("assigns recipientId to replyTo.recipientId when replying to a self-sent message", () => {
    const user = { id: "user-A" };
    const selfSentMessage = {
      id: "msg-1",
      senderId: "user-A",
      recipientId: "user-B",
    };
    const recipientId = computeRecipientId({ user, assignment, replyTo: selfSentMessage });
    expect(recipientId).toBe("user-B");
  });
});
