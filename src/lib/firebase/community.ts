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
  const code = (error as { code?: string })?.code;
  if (code === "permission-denied") {
    console.warn(
      `[Firestore Permission Warning] ${source}: Insufficient permissions or unauthenticated session.`
    );
  } else {
    console.error(`[Firestore Error] ${source}:`, error);
  }
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
  actor: { id: string; name: string },
  emoji: string = "❤️"
) {
  const postReference = doc(db, "campfirePosts", postId);
  const snapshot = await getDoc(postReference);
  if (!snapshot.exists()) return;

  const postData = snapshot.data() as CampfirePost;
  const usersForEmoji: string[] = postData.reactions?.[emoji] || [];
  const hasReacted = usersForEmoji.includes(actor.id);

  await updateDoc(postReference, {
    [`reactions.${emoji}`]: hasReacted ? arrayRemove(actor.id) : arrayUnion(actor.id),
    likesCount: increment(hasReacted ? -1 : 1),
  });

  // Notification handling must never break the like itself. If the dedup query or the
  // notification creation fails (e.g. rules not deployed yet), we log and skip the
  // notification instead of throwing a permission error to the user.
  let shouldNotify = false;
  try {
    shouldNotify =
      !hasReacted &&
      postData.authorId !== actor.id &&
      !(await hasExistingReactionNotification(
        postData.authorId,
        actor.id,
        postId
      ));
  } catch (error) {
    handleCommunityError(
      error,
      `toggleLikeCampfirePost notification check (${postId})`
    );
  }

  if (shouldNotify) {
    await createNotification({
      userId: postData.authorId,
      type: "reaction",
      message: `${actor.name} a réagi ${emoji} à votre publication`,
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
