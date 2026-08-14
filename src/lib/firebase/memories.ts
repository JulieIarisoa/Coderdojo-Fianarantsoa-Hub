import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  getDoc,
  increment,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { MemoryItem, PostComment } from "@/types";
import { db } from "./config";
import { memorySchema } from "@/lib/validation/schemas";

function handleMemoryError(error: unknown, source: string) {
  const code = (error as { code?: string })?.code;
  if (code === "permission-denied") {
    console.warn(
      `[Firestore Permission Warning] ${source}: Insufficient permissions or unauthenticated session.`
    );
  } else {
    console.error(`[Firestore Error] ${source}:`, error);
  }
}

export function subscribeToMemories(callback: (memories: MemoryItem[]) => void) {
  const memoriesQuery = query(
    collection(db, "memories"),
    orderBy("createdAt", "desc"),
    limit(50)
  );

  return onSnapshot(
    memoriesQuery,
    (snapshot) => {
      const memories = snapshot.docs.map((document) => ({
        ...document.data(),
        id: document.id,
      })) as MemoryItem[];
      callback(memories);
    },
    (error) => handleMemoryError(error, "subscribeToMemories")
  );
}

export function subscribeToMemory(
  memoryId: string,
  callback: (memory: MemoryItem | null) => void
) {
  const memoryReference = doc(db, "memories", memoryId);
  return onSnapshot(
    memoryReference,
    (snapshot) => {
      if (snapshot.exists()) {
        callback({ ...snapshot.data(), id: snapshot.id } as MemoryItem);
      } else {
        callback(null);
      }
    },
    (error) => handleMemoryError(error, `subscribeToMemory(${memoryId})`)
  );
}

export async function getMemoryById(id: string): Promise<MemoryItem | null> {
  try {
    const memoryReference = doc(db, "memories", id);
    const snapshot = await getDoc(memoryReference);
    if (!snapshot.exists()) return null;
    return { ...snapshot.data(), id: snapshot.id } as MemoryItem;
  } catch (error) {
    handleMemoryError(error, `getMemoryById(${id})`);
    return null;
  }
}

export async function createMemory(
  memory: Omit<MemoryItem, "id" | "createdAt">
) {
  const validatedMemory = memorySchema.parse(memory);
  return addDoc(collection(db, "memories"), {
    ...validatedMemory,
    createdAt: serverTimestamp(),
  });
}

export async function toggleLikeMemory(memoryId: string, userId: string, emoji: string = "❤️") {
  const memoryReference = doc(db, "memories", memoryId);
  const snapshot = await getDoc(memoryReference);
  if (!snapshot.exists()) return;

  const usersForEmoji: string[] = snapshot.data().reactions?.[emoji] || [];
  const hasReacted = usersForEmoji.includes(userId);

  await updateDoc(memoryReference, {
    [`reactions.${emoji}`]: hasReacted ? arrayRemove(userId) : arrayUnion(userId),
    likesCount: increment(hasReacted ? -1 : 1),
  });
}

export function subscribeToMemoryComments(
  memoryId: string,
  callback: (comments: PostComment[]) => void
) {
  const commentsQuery = query(
    collection(db, "memories", memoryId, "comments"),
    orderBy("createdAt", "asc")
  );

  return onSnapshot(
    commentsQuery,
    (snapshot) => {
      const comments = snapshot.docs.map((document) => ({
        ...document.data(),
        id: document.id,
      })) as PostComment[];
      callback(comments);
    },
    (error) => handleMemoryError(error, `subscribeToMemoryComments(${memoryId})`)
  );
}

export async function addCommentToMemory(
  memoryId: string,
  comment: Omit<PostComment, "id" | "createdAt">
) {
  try {
    await addDoc(collection(db, "memories", memoryId, "comments"), {
      ...comment,
      createdAt: serverTimestamp(),
    });
    await updateDoc(doc(db, "memories", memoryId), {
      commentsCount: increment(1),
    });
  } catch (error) {
    handleMemoryError(error, `addCommentToMemory(${memoryId})`);
  }
}
