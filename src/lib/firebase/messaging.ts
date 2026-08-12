import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  updateDoc,
  where,
  serverTimestamp,
  writeBatch,
  Timestamp,
} from "firebase/firestore";
import { db, auth } from "./config";
import { directMessageSchema } from "@/lib/validation/schemas";
import { createNotification } from "./notifications";
import {
  decryptMessage,
  encryptMessage,
  getMessageIdentities,
  getOrCreateMessageIdentity,
  MessagePublicKey,
} from "@/lib/crypto/messaging";
import type {
  Conversation,
  ConversationParticipant,
  ChatMessage,
} from "@/types/messaging";

// ────────────────────────────────────────────────────────────────────────────────
// Direct Message types (kept for backward compatibility)
// ────────────────────────────────────────────────────────────────────────────────

export interface DirectMessage {
  id: string;
  fromId: string;
  fromName: string;
  fromAvatar: string;
  toId: string;
  toName: string;
  content: string;
  createdAt: unknown;
  read?: boolean;
  ciphertext?: string;
  iv?: string;
  encryptionVersion?: number;
  senderPublicKey?: MessagePublicKey;
  recipientPublicKey?: MessagePublicKey;
  decryptionFailed?: boolean;
  conversationId?: string;
}

// ────────────────────────────────────────────────────────────────────────────────
// Encryption helpers
// ────────────────────────────────────────────────────────────────────────────────

function publicKeysMatch(first: MessagePublicKey, second: MessagePublicKey) {
  return (
    first.kty === second.kty &&
    first.crv === second.crv &&
    first.x === second.x &&
    first.y === second.y
  );
}

const MESSAGE_ENCRYPTION_KEY_MISMATCH_MESSAGE =
  "La clé de chiffrement locale ne correspond pas à celle du compte. Une récupération de clé est nécessaire.";

export class MessageEncryptionKeyMismatchError extends Error {
  constructor() {
    super(MESSAGE_ENCRYPTION_KEY_MISMATCH_MESSAGE);
    this.name = "MessageEncryptionKeyMismatchError";
  }
}

export function isMessageEncryptionKeyMismatchError(
  error: unknown
): error is MessageEncryptionKeyMismatchError {
  if (error instanceof MessageEncryptionKeyMismatchError) return true;
  if (!(error instanceof Error)) return false;
  return (
    error.name === "MessageEncryptionKeyMismatchError" ||
    error.message === MESSAGE_ENCRYPTION_KEY_MISMATCH_MESSAGE
  );
}

async function updateAccountMessagePublicKey(userId: string, publicKey: MessagePublicKey) {
  await updateDoc(doc(db, "users", userId), {
    encryptionPublicKey: publicKey,
    updatedAt: serverTimestamp(),
  });
}

export async function resetMessageEncryptionKey(userId: string) {
  const identity = await getOrCreateMessageIdentity(userId);
  await updateAccountMessagePublicKey(userId, identity.publicKey);
  return identity.publicKey;
}

export async function ensureMessageEncryptionKey(userId: string) {
  const identity = await getOrCreateMessageIdentity(userId);
  const userRef = doc(db, "users", userId);
  const userSnapshot = await getDoc(userRef);
  const storedPublicKey = userSnapshot.data()?.encryptionPublicKey as
    | MessagePublicKey
    | undefined;

  if (!storedPublicKey) {
    await updateAccountMessagePublicKey(userId, identity.publicKey);
  } else if (!publicKeysMatch(storedPublicKey, identity.publicKey)) {
    throw new MessageEncryptionKeyMismatchError();
  }

  return identity.publicKey;
}

// ────────────────────────────────────────────────────────────────────────────────
// Common helpers
// ────────────────────────────────────────────────────────────────────────────────

function handleSnapshotError(err: unknown, source: string) {
  const code = (err as { code?: string })?.code;
  if (code === "permission-denied") {
    console.warn(
      `[Firestore Permission Warning] ${source}: Insufficient permissions or unauthenticated session.`
    );
  } else {
    console.error(`[Firestore Error] ${source}:`, err);
  }
}

function timestampToMillis(value: unknown) {
  if (value && typeof value === "object" && "toMillis" in value) {
    return (value as { toMillis: () => number }).toMillis();
  }
  if (typeof value === "string" || typeof value === "number") {
    return new Date(value).getTime() || 0;
  }
  return 0;
}

type EncryptedMessage = {
  fromId: string;
  toId: string;
  ciphertext?: string;
  iv?: string;
  senderPublicKey?: MessagePublicKey;
  recipientPublicKey?: MessagePublicKey;
};

async function decryptWithAvailableIdentity(
  message: EncryptedMessage,
  userId: string,
  identities: Awaited<ReturnType<typeof getMessageIdentities>>
) {
  if (!message.ciphertext || !message.iv || !message.senderPublicKey || !message.recipientPublicKey) {
    throw new Error("Message chiffré incomplet");
  }

  const ownPublicKey = message.fromId === userId ? message.senderPublicKey : message.recipientPublicKey;
  const otherPublicKey = message.fromId === userId ? message.recipientPublicKey : message.senderPublicKey;
  const matching = identities.filter((identity) => publicKeysMatch(identity.publicKey, ownPublicKey));
  const fallback = identities.filter((identity) => !matching.includes(identity));
  let lastError: unknown;

  for (const identity of [...matching, ...fallback]) {
    try {
      return await decryptMessage(message.ciphertext, message.iv, identity.privateKey, otherPublicKey);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Message chiffré indisponible");
}

// ────────────────────────────────────────────────────────────────────────────────
// Conversation management
// ────────────────────────────────────────────────────────────────────────────────

/** Generate a deterministic conversation ID for a 1-to-1 pair */
function conversationId(userA: string, userB: string) {
  return [userA, userB].sort().join("_");
}

/** Get or create a 1-to-1 conversation between two users */
export async function getOrCreateConversation(
  currentUser: { id: string; name: string; avatar: string },
  otherUser: { id: string; name: string; avatar: string }
): Promise<Conversation> {
  const convoId = conversationId(currentUser.id, otherUser.id);
  const convoRef = doc(db, "conversations", convoId);
  const convoSnap = await getDoc(convoRef);

  if (convoSnap.exists()) {
    return { ...convoSnap.data(), id: convoSnap.id } as Conversation;
  }

  const participantProfiles: Record<string, ConversationParticipant> = {
    [currentUser.id]: { name: currentUser.name, avatar: currentUser.avatar },
    [otherUser.id]: { name: otherUser.name, avatar: otherUser.avatar },
  };

  const batch = writeBatch(db);
  const newConversation = {
    participants: [currentUser.id, otherUser.id].sort(),
    participantProfiles,
    lastMessage: null,
    unreadCounts: { [currentUser.id]: 0, [otherUser.id]: 0 },
    typingUsers: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  batch.set(convoRef, newConversation);
  await batch.commit();

  return {
    ...newConversation,
    id: convoId,
  } as Conversation;
}

/** Subscribe to all conversations for a user, ordered by most recent */
export function subscribeToConversations(
  userId: string,
  callback: (conversations: Conversation[]) => void
) {
  if (!userId || !auth.currentUser) return () => {};

  const convoRef = collection(db, "conversations");
  const q = query(convoRef, where("participants", "array-contains", userId));

  return onSnapshot(
    q,
    (snapshot) => {
      const conversations = snapshot.docs
        .map((d) => ({
          ...d.data(),
          id: d.id,
        }))
        .map((conversation) => conversation as Conversation)
        .sort(
          (first, second) =>
            timestampToMillis(second.updatedAt) - timestampToMillis(first.updatedAt)
        );
      callback(conversations);
    },
    (err) => handleSnapshotError(err, "subscribeToConversations")
  );
}

/** Subscribe to the total unread count across all conversations */
export function subscribeToTotalUnreadCount(
  userId: string,
  callback: (count: number) => void
) {
  return subscribeToConversations(userId, (conversations) => {
    const total = conversations.reduce((sum, convo) => {
      return sum + (convo.unreadCounts?.[userId] || 0);
    }, 0);
    callback(total);
  });
}

// ────────────────────────────────────────────────────────────────────────────────
// Conversation messages
// ────────────────────────────────────────────────────────────────────────────────

/** Subscribe to messages in a specific conversation with E2E decryption */
export function subscribeToConversationMessages(
  convoId: string,
  userId: string,
  callback: (messages: ChatMessage[]) => void
) {
  if (!convoId || !userId) return () => {};

  const messagesRef = collection(db, "directMessages");
  const q = query(
    messagesRef,
    where("conversationId", "==", convoId)
  );

  let active = true;
  let emission = 0;

  const unsub = onSnapshot(
    q,
    async (snapshot) => {
      const currentEmission = ++emission;
      const decrypted = await Promise.all(
        snapshot.docs.map(async (d) => {
          const data = d.data();
          const msg = { ...data, id: d.id } as ChatMessage;

          if (
            msg.content ||
            !msg.ciphertext ||
            !msg.iv ||
            !msg.senderPublicKey ||
            !msg.recipientPublicKey
          ) {
            return msg;
          }

          try {
            const identities = await getMessageIdentities(userId);
            const content = await decryptWithAvailableIdentity(msg, userId, identities);
            return { ...msg, content };
          } catch {
            return {
              ...msg,
              content: "Message chiffré indisponible",
              decryptionFailed: true,
            };
          }
        })
      );

      decrypted.sort((first, second) => timestampToMillis(first.createdAt) - timestampToMillis(second.createdAt));
      if (active && currentEmission === emission) {
        callback(decrypted);
      }
    },
    (err) => handleSnapshotError(err, "subscribeToConversationMessages")
  );

  return () => {
    active = false;
    unsub();
  };
}

/** Send a message within a conversation, with E2E encryption */
export async function sendMessageToConversation(message: {
  conversationId: string;
  fromId: string;
  fromName: string;
  fromAvatar: string;
  toId: string;
  toName: string;
  content: string;
}) {
  const validatedMessage = directMessageSchema.parse(message);
  await ensureMessageEncryptionKey(validatedMessage.fromId);
  const senderIdentity = await getOrCreateMessageIdentity(validatedMessage.fromId);
  const recipientSnapshot = await getDoc(doc(db, "users", validatedMessage.toId));
  const recipientPublicKey = recipientSnapshot.data()?.encryptionPublicKey as
    | MessagePublicKey
    | undefined;

  if (!recipientPublicKey) {
    throw new Error(
      "Le destinataire doit d'abord ouvrir une session pour activer son chiffrement."
    );
  }

  const encrypted = await encryptMessage(
    validatedMessage.content,
    senderIdentity.privateKey,
    recipientPublicKey
  );

  // Add the message
  await addDoc(collection(db, "directMessages"), {
    conversationId: message.conversationId,
    fromId: validatedMessage.fromId,
    fromName: validatedMessage.fromName,
    fromAvatar: validatedMessage.fromAvatar,
    toId: validatedMessage.toId,
    toName: validatedMessage.toName,
    ...encrypted,
    encryptionVersion: 1,
    senderPublicKey: senderIdentity.publicKey,
    recipientPublicKey,
    createdAt: serverTimestamp(),
    read: false,
  });

  await createNotification({
    userId: validatedMessage.toId,
    type: "message",
    message: `Nouveau message de ${validatedMessage.fromName}`,
  });

  // Update conversation metadata
  const convoRef = doc(db, "conversations", message.conversationId);
  const convoSnap = await getDoc(convoRef);
  const currentUnread = (convoSnap.data()?.unreadCounts?.[message.toId] as number) || 0;

  await updateDoc(convoRef, {
    lastMessage: {
      content: validatedMessage.content,
      senderId: validatedMessage.fromId,
      createdAt: Timestamp.now(),
    },
    [`unreadCounts.${message.toId}`]: currentUnread + 1,
    updatedAt: serverTimestamp(),
  });
}

/** Mark all messages in a conversation as read for a user */
export async function markConversationRead(convoId: string, userId: string) {
  try {
    const convoRef = doc(db, "conversations", convoId);
    await updateDoc(convoRef, {
      [`unreadCounts.${userId}`]: 0,
    });

    // Also mark individual messages as read
    const messagesRef = collection(db, "directMessages");
    const q = query(
      messagesRef,
      where("conversationId", "==", convoId),
      where("toId", "==", userId),
      where("read", "==", false)
    );

    const snapshot = await getDocs(q);
    if (snapshot.empty) return;

    const batch = writeBatch(db);
    snapshot.docs.forEach((d) => {
      batch.update(d.ref, { read: true });
    });
    await batch.commit();
  } catch (err) {
    handleSnapshotError(err, `markConversationRead(${convoId})`);
  }
}

/** Set typing status for a user in a conversation */
export async function setTypingStatus(
  convoId: string,
  userId: string,
  isTyping: boolean
) {
  try {
    const convoRef = doc(db, "conversations", convoId);
    const convoSnap = await getDoc(convoRef);
    if (!convoSnap.exists()) return;

    const currentTyping = (convoSnap.data().typingUsers as string[]) || [];

    let updatedTyping: string[];
    if (isTyping && !currentTyping.includes(userId)) {
      updatedTyping = [...currentTyping, userId];
    } else if (!isTyping) {
      updatedTyping = currentTyping.filter((id) => id !== userId);
    } else {
      return; // no change
    }

    await updateDoc(convoRef, { typingUsers: updatedTyping });
  } catch {
    // Silent catch for ephemeral typing status
  }
}

// ────────────────────────────────────────────────────────────────────────────────
// Legacy direct message functions (kept for backward compatibility)
// ────────────────────────────────────────────────────────────────────────────────

export async function sendDirectMessage(message: {
  fromId: string;
  fromName: string;
  fromAvatar: string;
  toId: string;
  toName: string;
  content: string;
}) {
  directMessageSchema.parse(message);

  const convo = await getOrCreateConversation(
    { id: message.fromId, name: message.fromName, avatar: message.fromAvatar },
    { id: message.toId, name: message.toName, avatar: "" }
  );

  return sendMessageToConversation({
    conversationId: convo.id,
    ...message,
  });
}

export function subscribeToReceivedMessages(
  userId: string,
  callback: (messages: DirectMessage[]) => void
) {
  return subscribeToMessages(userId, callback, false);
}

export function subscribeToUserMessages(
  userId: string,
  callback: (messages: DirectMessage[]) => void
) {
  return subscribeToMessages(userId, callback, true);
}

function subscribeToMessages(
  userId: string,
  callback: (messages: DirectMessage[]) => void,
  includeSent: boolean
) {
  if (!userId) return () => {};

  const messageCache = new Map<string, Record<string, unknown>>();
  let active = true;
  let emission = 0;

  const emitMessages = async () => {
    const currentEmission = ++emission;
    const messages = await Promise.all(
      [...messageCache.entries()].map(async ([id, data]) => {
        const baseMessage = { ...data, id } as unknown as DirectMessage;

        if (
          baseMessage.content ||
          !baseMessage.ciphertext ||
          !baseMessage.iv ||
          !baseMessage.senderPublicKey ||
          !baseMessage.recipientPublicKey
        ) {
          return baseMessage;
        }

        try {
          const identity = await getOrCreateMessageIdentity(userId);
          const publicKey =
            baseMessage.fromId === userId
              ? baseMessage.recipientPublicKey
              : baseMessage.senderPublicKey;
          const content = await decryptMessage(
            baseMessage.ciphertext,
            baseMessage.iv,
            identity.privateKey,
            publicKey
          );
          return { ...baseMessage, content };
        } catch (error) {
          console.warn(`[Messaging] Impossible de déchiffrer ${id}:`, error);
          return {
            ...baseMessage,
            content: "Message chiffré indisponible",
            decryptionFailed: true,
          };
        }
      })
    );

    messages.sort((a, b) => timestampToMillis(a.createdAt) - timestampToMillis(b.createdAt));
    if (active && currentEmission === emission) callback(messages);
  };

  const updateFromSnapshot = (snapshot: {
    docs: Array<{ id: string; data: () => Record<string, unknown> }>;
  }) => {
    snapshot.docs.forEach((document) => {
      messageCache.set(document.id, document.data());
    });
    void emitMessages();
  };

  const unsubscribers: Array<() => void> = [];
  const messagesRef = collection(db, "directMessages");
  const messagesQueries = [query(messagesRef, where("toId", "==", userId))];
  if (includeSent) messagesQueries.push(query(messagesRef, where("fromId", "==", userId)));

  messagesQueries.forEach((messagesQuery) => {
    unsubscribers.push(
      onSnapshot(
        messagesQuery,
        updateFromSnapshot,
        (error) => handleSnapshotError(error, "subscribeToMessages")
      )
    );
  });

  return () => {
    active = false;
    unsubscribers.forEach((unsubscribe) => unsubscribe());
  };
}

export async function markDirectMessageRead(messageId: string) {
  await updateDoc(doc(db, "directMessages", messageId), { read: true });
}

/** Migrate legacy messages (without conversationId) into conversations */
export async function migrateLegacyMessages(userId: string) {
  try {
    const messagesRef = collection(db, "directMessages");
    const received = query(messagesRef, where("toId", "==", userId));
    const sent = query(messagesRef, where("fromId", "==", userId));

    const [receivedSnap, sentSnap] = await Promise.all([
      getDocs(received),
      getDocs(sent),
    ]);

    const allDocs = [...receivedSnap.docs, ...sentSnap.docs];
    const toMigrate = allDocs.filter((d) => !d.data().conversationId);

    if (toMigrate.length === 0) return;

    // Group by conversation partner
    const partnerMap = new Map<string, typeof toMigrate>();
    for (const d of toMigrate) {
      const data = d.data();
      const partnerId = data.fromId === userId ? data.toId : data.fromId;
      if (!partnerMap.has(partnerId as string)) {
        partnerMap.set(partnerId as string, []);
      }
      partnerMap.get(partnerId as string)!.push(d);
    }

    for (const [partnerId, docs] of partnerMap) {
      const convoId = conversationId(userId, partnerId);
      const batch = writeBatch(db);

      for (const d of docs) {
        batch.update(d.ref, { conversationId: convoId });
      }

      // Create conversation document if it doesn't exist
      const convoRef = doc(db, "conversations", convoId);
      const convoSnap = await getDoc(convoRef);
      if (!convoSnap.exists()) {
        const lastDoc = docs.sort((a, b) => {
          return timestampToMillis(b.data().createdAt) - timestampToMillis(a.data().createdAt);
        })[0];
        const lastData = lastDoc.data();

        batch.set(convoRef, {
          participants: [userId, partnerId].sort(),
          participantProfiles: {
            [userId]: {
              name: lastData.fromId === userId ? lastData.fromName : lastData.toName,
              avatar: lastData.fromId === userId ? lastData.fromAvatar : "",
            },
            [partnerId]: {
              name: lastData.fromId === partnerId ? lastData.fromName : lastData.toName,
              avatar: lastData.fromId === partnerId ? lastData.fromAvatar : "",
            },
          },
          lastMessage: null,
          unreadCounts: { [userId]: 0, [partnerId]: 0 },
          typingUsers: [],
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      await batch.commit();
    }
  } catch (err) {
    handleSnapshotError(err, `migrateLegacyMessages(${userId})`);
  }
}
