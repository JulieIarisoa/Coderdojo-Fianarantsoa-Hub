import {
  collection,
  doc,
  addDoc,
  onSnapshot,
  query,
  where,
  limit,
  updateDoc,
  serverTimestamp,
  arrayUnion,
  writeBatch,
} from "firebase/firestore";
import { db } from "./config";
import {
  SecretFriendAssignment,
  SecretFriendCampaign,
  SecretFriendMessage,
} from "@/types";

function handleSecretFriendError(error: unknown, source: string) {
  const code = (error as { code?: string })?.code;
  if (code === "permission-denied") {
    console.warn(
      `[Firestore Permission Warning] ${source}: Insufficient permissions or unauthenticated session.`
    );
  } else {
    console.error(`[Firestore Error] ${source}:`, error);
  }
}

export function subscribeToSecretFriendAssignment(
  mentorId: string,
  callback: (assignment: SecretFriendAssignment | null) => void
) {
  try {
    const assignmentQuery = query(
      collection(db, "secretFriendAssignments"),
      where("mentorId", "==", mentorId),
      limit(1)
    );

    return onSnapshot(
      assignmentQuery,
      (snapshot) => {
        if (snapshot.empty) {
          callback(null);
          return;
        }

        const document = snapshot.docs[0];
        const data = document.data();
        callback({
          actionJournal: [],
          ...data,
          id: document.id,
        } as unknown as SecretFriendAssignment);
      },
      (error) => handleSecretFriendError(error, `subscribeToSecretFriendAssignment(${mentorId})`)
    );
  } catch (err) {
    handleSecretFriendError(err, `subscribeToSecretFriendAssignment(${mentorId})`);
    return () => {};
  }
}

export async function addSecretFriendJournalEntry(
  assignmentId: string,
  entry: { actionText: string; icon: string }
) {
  const newEntry = {
    id: `act-${Date.now()}`,
    actionText: entry.actionText,
    timeAgo: "À l'instant",
    icon: entry.icon,
  };

  await updateDoc(doc(db, "secretFriendAssignments", assignmentId), {
    actionJournal: arrayUnion(newEntry),
  });
}

export function subscribeToSecretFriendMessages(
  mentorId: string,
  callback: (messages: SecretFriendMessage[]) => void
) {
  const messages = new Map<string, SecretFriendMessage>();
  const emit = () => {
    callback(
      [...messages.values()].sort((a, b) => {
        const getTime = (value: unknown) => {
          if (value && typeof value === "object" && value !== null && "toMillis" in value) {
            return (value as { toMillis: () => number }).toMillis();
          }
          if (typeof value === "string" || typeof value === "number") {
            return new Date(value).getTime() || 0;
          }
          return 0;
        };
        return getTime(b.createdAt) - getTime(a.createdAt);
      })
    );
  };

  const updateFromSnapshot = (snapshot: {
    docs: Array<{ id: string; data: () => Record<string, unknown> }>;
  }) => {
    snapshot.docs.forEach((message) => {
      messages.set(message.id, {
        ...message.data(),
        id: message.id,
      } as SecretFriendMessage);
    });
    emit();
  };

  let unsubReceived = () => {};
  let unsubSent = () => {};

  try {
    unsubReceived = onSnapshot(
      query(
        collection(db, "secretFriendMessages"),
        where("recipientId", "==", mentorId)
      ),
      updateFromSnapshot,
      (error) => handleSecretFriendError(error, `subscribeToSecretFriendMessages(received:${mentorId})`)
    );
    unsubSent = onSnapshot(
      query(collection(db, "secretFriendMessages"), where("senderId", "==", mentorId)),
      updateFromSnapshot,
      (error) => handleSecretFriendError(error, `subscribeToSecretFriendMessages(sent:${mentorId})`)
    );
  } catch (err) {
    handleSecretFriendError(err, `subscribeToSecretFriendMessages(${mentorId})`);
  }

  return () => {
    try { unsubReceived(); } catch {}
    try { unsubSent(); } catch {}
  };
}

export async function createSecretFriendMessage(
  message: Omit<SecretFriendMessage, "id" | "createdAt" | "read">
) {
  await addDoc(collection(db, "secretFriendMessages"), {
    ...message,
    read: false,
    createdAt: serverTimestamp(),
  });
}

export async function markSecretFriendMessageRead(messageId: string) {
  await updateDoc(doc(db, "secretFriendMessages", messageId), { read: true });
}

export async function createSecretFriendCampaign(
  campaign: Omit<SecretFriendCampaign, "createdAt">,
  assignments: Omit<SecretFriendAssignment, "id">[]
) {
  if (assignments.length < 2) {
    throw new Error("Il faut au moins deux mentors pour lancer le tirage.");
  }

  const batch = writeBatch(db);
  const campaignRef = doc(db, "secretFriendCampaigns", campaign.id);
  const { id: campaignId, ...campaignData } = campaign;
  batch.set(campaignRef, {
    ...campaignData,
    id: campaignId,
    createdAt: serverTimestamp(),
  });

  for (const assignment of assignments) {
    const assignmentRef = doc(collection(db, "secretFriendAssignments"));
    batch.set(assignmentRef, {
      ...assignment,
      createdAt: serverTimestamp(),
    });
  }

  await batch.commit();
}

const secretFriend = {
  subscribeToSecretFriendAssignment,
  addSecretFriendJournalEntry,
  subscribeToSecretFriendMessages,
  createSecretFriendMessage,
  markSecretFriendMessageRead,
  createSecretFriendCampaign,
};

export default secretFriend;
