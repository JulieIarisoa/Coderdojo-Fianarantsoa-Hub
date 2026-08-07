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
  } catch (error) {
    console.error("[Firestore Error] sendDirectMessage:", error);
  }
}

export function subscribeToReceivedMessages(
  userId: string,
  callback: (messages: DirectMessage[]) => void
) {
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
    (error) => console.error("[Firestore Error] subscribeToReceivedMessages:", error)
  );
}
