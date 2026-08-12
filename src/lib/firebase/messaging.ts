import {
  addDoc,
  collection,
  onSnapshot,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./config";
import { directMessageSchema } from "@/lib/validation/schemas";
import { createNotification } from "./notifications";

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
}

export async function sendDirectMessage(message: {
  fromId: string;
  fromName: string;
  fromAvatar: string;
  toId: string;
  toName: string;
  content: string;
}) {
  try {
    const validatedMessage = directMessageSchema.parse(message);
    await addDoc(collection(db, "directMessages"), {
      ...validatedMessage,
      createdAt: serverTimestamp(),
      read: false,
    });
    await createNotification({
      userId: message.toId,
      type: "message",
      message: `Nouveau message de ${message.fromName}`,
    });
  } catch (error) {
    console.error("[Firestore Error] sendDirectMessage:", error);
  }
}

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

export function subscribeToReceivedMessages(
  userId: string,
  callback: (messages: DirectMessage[]) => void
) {
  if (!userId) return () => {};
  const messagesRef = collection(db, "directMessages");
  const messagesQuery = query(messagesRef, where("toId", "==", userId));

  return onSnapshot(
    messagesQuery,
    (snapshot) => {
      const messages: DirectMessage[] = snapshot.docs.map((document) => ({
        ...document.data(),
        id: document.id,
      })) as DirectMessage[];
      callback(messages);
    },
    (error) => handleSnapshotError(error, "subscribeToReceivedMessages")
  );
}
