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
import { createNotification, hasExistingReactionNotification } from "./notifications";

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

export async function toggleLikeCampfirePost(
  postId: string,
  actor: { id: string; name: string }
) {
  const postReference = doc(db, "campfirePosts", postId);
  const snapshot = await getDoc(postReference);
  if (!snapshot.exists()) return;

  const postData = snapshot.data() as CampfirePost;
  const hearts: string[] = postData.reactions?.["❤️"] || [];
  const hasLiked = hearts.includes(actor.id);

  await updateDoc(postReference, {
    "reactions.❤️": hasLiked ? arrayRemove(actor.id) : arrayUnion(actor.id),
    likesCount: increment(hasLiked ? -1 : 1),
  });

  const shouldNotify =
    !hasLiked &&
    postData.authorId !== actor.id &&
    !(await hasExistingReactionNotification(postData.authorId, actor.id, postId));

  if (shouldNotify) {
    await createNotification({
      userId: postData.authorId,
      type: "reaction",
      message: `${actor.name} a réagi ❤️ à votre publication`,
      link: "/campfire",
      actorId: actor.id,
      refId: postId,
    });
  }
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
  const postReference = doc(db, "campfirePosts", postId);
  const postSnapshot = await getDoc(postReference);
  const postAuthorId = postSnapshot.exists()
    ? (postSnapshot.data().authorId as string | undefined)
    : undefined;

  await addDoc(collection(db, "campfirePosts", postId, "comments"), {
    ...comment,
    createdAt: serverTimestamp(),
  });
  await updateDoc(postReference, {
    commentsCount: increment(1),
  });

  if (postAuthorId && postAuthorId !== comment.authorId) {
    await createNotification({
      userId: postAuthorId,
      type: "comment",
      message: `${comment.authorName} a commenté votre publication`,
      link: "/campfire",
      actorId: comment.authorId,
      refId: postId,
    });
  }
}
