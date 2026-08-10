import {
  collection,
  count,
  getAggregateFromServer,
  getCountFromServer,
  sum,
  doc,
  addDoc,
  getDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
  updateDoc,
  serverTimestamp,
  arrayUnion,
  writeBatch,
  where,
} from "firebase/firestore";
import { db } from "./config";
import {
  UserProfile,
  SecretFriendAssignment,
  SecretFriendCampaign,
  SecretFriendMessage,
} from "@/types";
import { profileUpdateSchema } from "@/lib/validation/schemas";

/**
 * Handles snapshot listener errors gracefully without throwing uncaught exceptions
 * when users are offline, in demo mode, or unauthenticated.
 */
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

// ==========================================
// 1. USER PROFILES / MENTORS
// ==========================================

export function subscribeToAllMentors(callback: (mentors: UserProfile[]) => void) {
  const usersRef = collection(db, "users");
  const q = query(usersRef, orderBy("xp", "desc"));

  return onSnapshot(
    q,
    (snapshot) => {
      const mentors: UserProfile[] = snapshot.docs.map((d) => ({
        ...d.data(),
        id: d.id,
      })) as UserProfile[];
      callback(mentors);
    },
    (err) => handleSnapshotError(err, "subscribeToAllMentors")
  );
}

export async function getMentorById(id: string): Promise<UserProfile | null> {
  try {
    const userRef = doc(db, "users", id);
    const snap = await getDoc(userRef);
    if (!snap.exists()) return null;
    return { ...snap.data(), id: snap.id } as UserProfile;
  } catch (err) {
    handleSnapshotError(err, `getMentorById(${id})`);
    return null;
  }
}

export async function updateUserProfile(
  userId: string,
  data: Partial<UserProfile>
) {
  const userRef = doc(db, "users", userId);
  const validatedData = profileUpdateSchema.parse(data);
  await updateDoc(userRef, { ...validatedData, updatedAt: serverTimestamp() });
}

export async function updateUserStatus(
  userId: string,
  status: "APPROVED" | "PENDING" | "REJECTED"
) {
  const userRef = doc(db, "users", userId);
  await updateDoc(userRef, { status, updatedAt: serverTimestamp() });
}

export function subscribeToLeaderboard(callback: (mentors: UserProfile[]) => void) {
  const usersRef = collection(db, "users");
  const q = query(usersRef, orderBy("xp", "desc"), limit(10));

  return onSnapshot(
    q,
    (snapshot) => {
      const mentors: UserProfile[] = snapshot.docs.map((d) => ({
        ...d.data(),
        id: d.id,
      })) as UserProfile[];
      callback(mentors);
    },
    (err) => handleSnapshotError(err, "subscribeToLeaderboard")
  );
}

// ==========================================
// 2. DASHBOARD STATS
// ==========================================

export function subscribeToDashboardStats(
  callback: (stats: {
    mentorsCount: number;
    memoriesCount: number;
    postsCount: number;
    totalXp: number;
  }) => void
) {
  const usersRef = collection(db, "users");
  const memoriesRef = collection(db, "memories");
  const postsRef = collection(db, "campfirePosts");
  let active = true;

  const refreshStats = async () => {
    try {
      const [usersAggregate, memoriesCount, postsCount] = await Promise.all([
        getAggregateFromServer(usersRef, { mentorsCount: count(), totalXp: sum("xp") }),
        getCountFromServer(memoriesRef),
        getCountFromServer(postsRef),
      ]);

      if (!active) return;
      const userStats = usersAggregate.data();
      callback({
        mentorsCount: userStats.mentorsCount,
        memoriesCount: memoriesCount.data().count,
        postsCount: postsCount.data().count,
        totalXp: userStats.totalXp || 0,
      });
    } catch (error) {
      handleSnapshotError(error, "subscribeToDashboardStats");
    }
  };

  void refreshStats();
  const refreshTimer = setInterval(refreshStats, 30_000);

  return () => {
    active = false;
    clearInterval(refreshTimer);
  };
}

// ==========================================
// 3. DAILY QUESTIONS
// ==========================================

export function subscribeToDailyQuestion(
  callback: (question: { id: string; text: string; createdAt: unknown } | null) => void
) {
  const ref = collection(db, "dailyQuestions");
  const q = query(ref, orderBy("createdAt", "desc"), limit(1));

  return onSnapshot(
    q,
    (snapshot) => {
      if (snapshot.empty) {
        callback(null);
      } else {
        const d = snapshot.docs[0];
        callback({ id: d.id, text: d.data().text, createdAt: d.data().createdAt });
      }
    },
    (err) => handleSnapshotError(err, "subscribeToDailyQuestion")
  );
}

export async function createDailyQuestion(text: string) {
  const ref = collection(db, "dailyQuestions");
  return addDoc(ref, { text, createdAt: serverTimestamp() });
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
      (error) => handleSnapshotError(error, `subscribeToSecretFriendAssignment(${mentorId})`)
    );
  } catch (err) {
    handleSnapshotError(err, `subscribeToSecretFriendAssignment(${mentorId})`);
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
      (error) => handleSnapshotError(error, `subscribeToSecretFriendMessages(received:${mentorId})`)
    );
    unsubSent = onSnapshot(
      query(collection(db, "secretFriendMessages"), where("senderId", "==", mentorId)),
      updateFromSnapshot,
      (error) => handleSnapshotError(error, `subscribeToSecretFriendMessages(sent:${mentorId})`)
    );
  } catch (err) {
    handleSnapshotError(err, `subscribeToSecretFriendMessages(${mentorId})`);
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




