import { doc, getDocs, setDoc, collection } from "firebase/firestore";
import { auth, db } from "./config";
import {
  MOCK_MENTORS,
  MOCK_POSTS,
  MOCK_MEMORIES,
  MOCK_SECRET_FRIEND,
  MOCK_GUESS_WHO,
  MOCK_BADGES,
} from "@/lib/mockData";

/**
 * Automatically seeds initial Firestore collections if they are empty,
 * ensuring all pages pull dynamic data from Cloud Firestore.
 * Only runs if a user is authenticated with Firebase Auth to prevent permission errors.
 */
export async function seedFirestoreIfEmpty(): Promise<void> {
  if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY || !auth.currentUser) return;

  try {
    // 1. Seed Mentors / Users
    try {
      const usersSnap = await getDocs(collection(db, "users"));
      if (usersSnap.empty) {
        for (const mentor of MOCK_MENTORS) {
          await setDoc(doc(db, "users", mentor.id), mentor);
        }
      }
    } catch (e) {
      console.warn("Seed users skipped:", e);
    }

    // 2. Seed Campfire Posts
    try {
      const postsSnap = await getDocs(collection(db, "campfirePosts"));
      if (postsSnap.empty) {
        for (const post of MOCK_POSTS) {
          const { id, ...data } = post;
          await setDoc(doc(db, "campfirePosts", id), {
            ...data,
            createdAt: new Date().toISOString(),
          });
        }
      }
    } catch (e) {
      console.warn("Seed posts skipped:", e);
    }

    // 3. Seed Memories
    try {
      const memSnap = await getDocs(collection(db, "memories"));
      if (memSnap.empty) {
        for (const mem of MOCK_MEMORIES) {
          const { id, ...data } = mem;
          await setDoc(doc(db, "memories", id), {
            ...data,
            createdAt: new Date().toISOString(),
          });
        }
      }
    } catch (e) {
      console.warn("Seed memories skipped:", e);
    }

    // 4. Seed Badges
    try {
      const badgeSnap = await getDocs(collection(db, "badges"));
      if (badgeSnap.empty) {
        for (const badge of MOCK_BADGES) {
          await setDoc(doc(db, "badges", badge.id), badge);
        }
      }
    } catch (e) {
      console.warn("Seed badges skipped:", e);
    }

    // 5. Seed Secret Friend Assignments
    try {
      const sfSnap = await getDocs(collection(db, "secretFriendAssignments"));
      if (sfSnap.empty) {
        const { id, ...data } = MOCK_SECRET_FRIEND;
        await setDoc(doc(db, "secretFriendAssignments", id), {
          ...data,
          createdAt: new Date().toISOString(),
        });
      }
    } catch (e) {
      console.warn("Seed secretFriend skipped:", e);
    }

    // 6. Seed Guess Who Games
    try {
      const gwSnap = await getDocs(collection(db, "guessWhoGames"));
      if (gwSnap.empty) {
        const { id, ...data } = MOCK_GUESS_WHO;
        await setDoc(doc(db, "guessWhoGames", id), {
          ...data,
          createdAt: new Date().toISOString(),
        });
      }
    } catch (e) {
      console.warn("Seed guessWho skipped:", e);
    }
  } catch (err) {
    console.warn("Firestore auto-seed warning:", err);
  }
}
