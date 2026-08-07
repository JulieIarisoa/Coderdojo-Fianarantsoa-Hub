import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
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
import { CampfirePost, PostComment } from "@/types";
import { db } from "./config";
import { campfirePostSchema } from "@/lib/validation/schemas";

function handleCommunityError(error: unknown, source: string) {
  console.error(`[Firestore Error] ${source}:`, error);
}

export function subscribeToCampfirePosts(callback: (posts: CampfirePost[]) => void) {
  const postsQuery = query(
    collection(db, "campfirePosts"),
    orderBy("createdAt", "desc"),
    limit(50)
  );

  return onSnapshot(
    postsQuery,
    (snapshot) => {
      const posts = snapshot.docs.map((document) => ({
        ...document.data(),
        id: document.id,
      })) as CampfirePost[];
      callback(posts);
    },
    (error) => handleCommunityError(error, "subscribeToCampfirePosts")
  );
}

export async function createCampfirePost(
  post: Omit<CampfirePost, "id" | "createdAt">
) {
  const validatedPost = campfirePostSchema.parse(post);
  return addDoc(collection(db, "campfirePosts"), {
    ...validatedPost,
    createdAt: serverTimestamp(),
  });
}

export async function deleteCampfirePost(postId: string) {
  try {
    await deleteDoc(doc(db, "campfirePosts", postId));
  } catch (error) {
    handleCommunityError(error, `deleteCampfirePost(${postId})`);
  }
}

export async function toggleLikeCampfirePost(postId: string, userId: string) {
  const postReference = doc(db, "campfirePosts", postId);
  const snapshot = await getDoc(postReference);
  if (!snapshot.exists()) return;

  const hearts: string[] = snapshot.data().reactions?.["❤️"] || [];
  const hasLiked = hearts.includes(userId);

  await updateDoc(postReference, {
    "reactions.❤️": hasLiked ? arrayRemove(userId) : arrayUnion(userId),
    likesCount: increment(hasLiked ? -1 : 1),
  });
}

export function subscribeToPostComments(
  postId: string,
  callback: (comments: PostComment[]) => void
) {
  const commentsQuery = query(
    collection(db, "campfirePosts", postId, "comments"),
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
    (error) => handleCommunityError(error, `subscribeToPostComments(${postId})`)
  );
}

export async function addCommentToCampfirePost(
  postId: string,
  comment: Omit<PostComment, "id" | "createdAt">
) {
  await addDoc(collection(db, "campfirePosts", postId, "comments"), {
    ...comment,
    createdAt: serverTimestamp(),
  });
  await updateDoc(doc(db, "campfirePosts", postId), {
    commentsCount: increment(1),
  });
}
