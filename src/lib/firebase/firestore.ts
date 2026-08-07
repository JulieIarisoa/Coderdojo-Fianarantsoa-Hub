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
} from "firebase/firestore";
import { db } from "./config";
import { UserProfile } from "@/types";
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



