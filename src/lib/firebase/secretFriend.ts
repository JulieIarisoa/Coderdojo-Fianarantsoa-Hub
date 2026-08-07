import {
  arrayUnion,
  collection,
  doc,
  limit,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  writeBatch,
  where,
} from "firebase/firestore";
import { SecretFriendAssignment } from "@/types";
import { db } from "./config";

function handleSecretFriendError(error: unknown, source: string) {
  console.error(`[Firestore Error] ${source}:`, error);
}

export function subscribeToSecretFriendAssignment(
  mentorId: string,
  callback: (assignment: SecretFriendAssignment | null) => void
) {
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
      callback({ ...document.data(), id: document.id } as SecretFriendAssignment);
    },
    (error) =>
      handleSecretFriendError(
        error,
        `subscribeToSecretFriendAssignment(${mentorId})`
      )
  );
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

export async function createSecretFriendCampaign(
  assignments: Omit<SecretFriendAssignment, "id">[]
) {
  if (assignments.length < 2) {
    throw new Error("Il faut au moins deux mentors pour lancer le tirage.");
  }

  const batch = writeBatch(db);
  for (const assignment of assignments) {
    const assignmentRef = doc(collection(db, "secretFriendAssignments"));
    batch.set(assignmentRef, {
      ...assignment,
      createdAt: serverTimestamp(),
    });
  }

  await batch.commit();
}
