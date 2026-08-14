"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { X, Flame } from "lucide-react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { CampfirePost, UserProfile } from "@/types";
import { CampfirePostCard } from "@/components/campfire/CampfirePostCard";
import {
  toggleLikeCampfirePost,
  addCommentToCampfirePost,
} from "@/lib/firebase/community";

interface PostNotificationModalProps {
  postId: string;
  user: UserProfile;
  onClose: () => void;
}

export function PostNotificationModal({
  postId,
  user,
  onClose,
}: PostNotificationModalProps) {
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const [post, setPost] = useState<CampfirePost | null>(null);
  const [notFound, setNotFound] = useState(
    () => !process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  );
  const [showComments, setShowComments] = useState(false);
  const [commentInput, setCommentInput] = useState("");

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) return;

    let active = true;
    getDoc(doc(db, "campfirePosts", postId))
      .then((snapshot) => {
        if (!active) return;
        if (!snapshot.exists()) {
          setNotFound(true);
          return;
        }
        setPost({ ...snapshot.data(), id: snapshot.id } as CampfirePost);
      })
      .catch(() => {
        if (active) setNotFound(true);
      });

    return () => {
      active = false;
    };
  }, [postId]);

  const handleLike = async (postIdToLike: string, emoji: string = "❤️") => {
    if (!post) return;
    const usersForEmoji = post.reactions[emoji] || [];
    const hasReacted = usersForEmoji.includes(user.id);

    setPost({
      ...post,
      reactions: {
        ...post.reactions,
        [emoji]: hasReacted
          ? usersForEmoji.filter((id) => id !== user.id)
          : [...usersForEmoji, user.id],
      },
      likesCount: post.likesCount + (hasReacted ? -1 : 1),
    });

    await toggleLikeCampfirePost(postIdToLike, {
      id: user.id,
      name: user.name,
    }, emoji);
  };

  const handleComment = async () => {
    if (!commentInput.trim() || !post) return;

    setPost({ ...post, commentsCount: post.commentsCount + 1 });
    await addCommentToCampfirePost(post.id, {
      postId: post.id,
      authorId: user.id,
      authorName: user.name,
      authorAvatar: user.avatar,
      content: commentInput,
    });
    setCommentInput("");
  };

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-surface rounded-2xl p-4 md:p-6 w-full max-w-2xl shadow-2xl border border-outline-variant/40 max-h-[85vh] flex flex-col overflow-hidden">
        <div className="flex justify-between items-center mb-4 shrink-0">
          <h3 className="font-headline text-lg font-bold text-on-surface flex items-center gap-2">
            <Flame className="w-5 h-5 text-primary" />
            Publication du Campfire
          </h3>
          <button
            onClick={onClose}
            aria-label="Fermer la publication"
            className="text-on-surface-variant hover:text-on-surface"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto pr-1">
          {notFound ? (
            <div className="py-12 text-center text-on-surface-variant font-body text-sm">
              <Flame className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p>Cette publication n&apos;existe plus.</p>
            </div>
          ) : post ? (
            <CampfirePostCard
              post={post}
              userId={user.id}
              showComments={showComments}
              commentInput={commentInput}
              onLike={handleLike}
              onToggleComments={() => setShowComments((open) => !open)}
              onCommentInputChange={setCommentInput}
              onComment={handleComment}
            />
          ) : (
            <div className="py-12 text-center text-on-surface-variant font-body text-sm">
              <Flame className="w-10 h-10 mx-auto mb-2 animate-pulse opacity-30" />
              <p>Chargement de la publication...</p>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
