import { collection, onSnapshot } from "firebase/firestore";
import { db } from "./config";

export interface AdminStats {
  totalMentors: number;
  totalPosts: number;
  totalMemories: number;
  pendingApprovals: number;
  activeQuestions: number;
  flaggedPosts: number;
}

function handleAdminSnapshotError(error: unknown, source: string) {
  console.error(`[Firestore Error] ${source}:`, error);
}

export function subscribeToAdminStats(
  callback: (stats: AdminStats) => void
) {
  const collections = {
    totalMentors: collection(db, "users"),
    totalPosts: collection(db, "campfirePosts"),
    totalMemories: collection(db, "memories"),
    activeQuestions: collection(db, "guessWhoGames"),
  };

  let stats: AdminStats = {
    totalMentors: 0,
    totalPosts: 0,
    totalMemories: 0,
    pendingApprovals: 0,
    activeQuestions: 0,
    flaggedPosts: 0,
  };

  const unsubscribers = Object.entries(collections).map(([field, ref]) =>
    onSnapshot(
      ref,
      (snapshot) => {
        if (field === "totalMentors") {
          const pendingCount = snapshot.docs.filter(
            (d) => d.data().status === "PENDING"
          ).length;
          stats = {
            ...stats,
            totalMentors: snapshot.size,
            pendingApprovals: pendingCount,
          };
        } else {
          stats = { ...stats, [field]: snapshot.size };
        }
        callback(stats);
      },
      (error) => handleAdminSnapshotError(error, `subscribeToAdminStats(${field})`)
    )
  );

  return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
}
