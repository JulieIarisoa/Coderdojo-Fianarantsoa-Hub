import {
  collection,
  doc,
  addDoc,
  getDocs,
  onSnapshot,
  query,
  where,
  updateDoc,
  serverTimestamp,
  arrayUnion,
  writeBatch,
} from "firebase/firestore";
import { db } from "./config";
import { createNotification } from "./notifications";
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

export function subscribeToSecretFriendAssignments(
  mentorId: string,
  callback: (assignments: SecretFriendAssignment[]) => void
) {
  try {
    const assignmentQuery = query(
      collection(db, "secretFriendAssignments"),
      where("mentorId", "==", mentorId)
    );

    return onSnapshot(
      assignmentQuery,
      (snapshot) => {
        if (snapshot.empty) {
          callback([]);
          return;
        }

        const list = snapshot.docs.map((docSnap) => ({
          actionJournal: [],
          ...docSnap.data(),
          id: docSnap.id,
        })) as unknown as SecretFriendAssignment[];

        callback(list);
      },
      (error) => handleSecretFriendError(error, `subscribeToSecretFriendAssignments(${mentorId})`)
    );
  } catch (err) {
    handleSecretFriendError(err, `subscribeToSecretFriendAssignments(${mentorId})`);
    return () => {};
  }
}

export function subscribeToSecretFriendCampaigns(
  callback: (campaigns: SecretFriendCampaign[]) => void
) {
  try {
    const campaignsQuery = query(collection(db, "secretFriendCampaigns"));

    return onSnapshot(
      campaignsQuery,
      (snapshot) => {
        const list = snapshot.docs.map((docSnap) => ({
          ...docSnap.data(),
          id: docSnap.id,
        })) as SecretFriendCampaign[];

        callback(list);
      },
      (error) => handleSecretFriendError(error, `subscribeToSecretFriendCampaigns`)
    );
  } catch (err) {
    handleSecretFriendError(err, `subscribeToSecretFriendCampaigns`);
    return () => {};
  }
}

export function subscribeToSecretFriendAssignment(
  mentorId: string,
  callback: (assignment: SecretFriendAssignment | null) => void
) {
  return subscribeToSecretFriendAssignments(mentorId, (list) => {
    callback(list.length > 0 ? list[0] : null);
  });
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

  if (message.recipientId) {
    await createNotification({
      userId: message.recipientId,
      type: "secret-friend",
      message: "Tu as reçu un nouveau message anonyme !",
      link: "/secret-friend",
    });
  }
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

export async function resetSecretFriendData() {
  const batch = writeBatch(db);
  const collections = ["secretFriendCampaigns", "secretFriendAssignments", "secretFriendMessages"];

  for (const collName of collections) {
    const snap = await getDocs(collection(db, collName));
    snap.docs.forEach((docSnap) => {
      batch.delete(docSnap.ref);
    });
  }

  const notifSnap = await getDocs(
    query(collection(db, "notifications"), where("type", "==", "secret-friend"))
  );
  notifSnap.docs.forEach((docSnap) => {
    batch.delete(docSnap.ref);
  });

  await batch.commit();
}

const secretFriend = {
  subscribeToSecretFriendAssignment,
  subscribeToSecretFriendAssignments,
  subscribeToSecretFriendCampaigns,
  addSecretFriendJournalEntry,
  subscribeToSecretFriendMessages,
  createSecretFriendMessage,
  markSecretFriendMessageRead,
  createSecretFriendCampaign,
  resetSecretFriendData,
};

export default secretFriend;
