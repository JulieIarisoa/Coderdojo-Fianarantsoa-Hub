"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import {
  Heart,
  Link as LinkIcon,
  MessageCircle,
  Send,
} from "lucide-react";
import { CampfirePost, PostComment } from "@/types";
import { CommentsList } from "@/components/common/CommentsList";
import { ReactionPicker } from "@/components/common/ReactionPicker";
import { subscribeToPostComments } from "@/lib/firebase/community";

interface CampfirePostCardProps {
  post: CampfirePost;
  userId?: string;
  showComments: boolean;
  commentInput: string;
  onLike: (postId: string, emoji?: string) => void;
  onToggleComments: (postId: string) => void;
  onCommentInputChange: (value: string) => void;
  onComment: (postId: string) => void;
}

export function CampfirePostCard({
  post,
  userId,
  showComments,
  commentInput,
  onLike,
  onToggleComments,
  onCommentInputChange,
  onComment,
}: CampfirePostCardProps) {
  const isLiked = Boolean(userId && post.reactions?.["❤️"]?.includes(userId));

  return (
    <article className="bg-surface rounded-2xl p-gutter card-shadow border border-outline-variant/30 flex flex-col gap-4 relative">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Image src={post.authorAvatar} alt={post.authorName} width={48} height={48} className="w-12 h-12 rounded-full object-cover border border-outline-variant/40" />
          <div>
            <h3 className="font-headline font-bold text-on-surface text-base">
              {post.authorName}
            </h3>
            <span className="font-mono text-xs text-on-surface-variant">
              {typeof post.createdAt === "string" ? post.createdAt : "Récemment"}
            </span>
          </div>
        </div>
        <span className="bg-primary-container/20 text-primary font-mono text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
          {post.category}
        </span>
      </div>

      <p className="font-body text-on-surface leading-relaxed text-base">
        {post.content}
      </p>

      {post.linkPreview && (
        <a
          href={post.linkPreview.url}
          target="_blank"
          rel="noreferrer"
          className="bg-surface-container-low hover:bg-surface-container transition-colors rounded-xl p-4 flex items-center gap-4 border border-outline-variant/20"
        >
          <div className="w-12 h-12 rounded-lg bg-primary-container/20 flex items-center justify-center text-primary shrink-0">
            <LinkIcon className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-headline font-bold text-on-surface text-sm">
              {post.linkPreview.title}
            </h4>
            <p className="font-mono text-xs text-on-surface-variant mt-0.5">
              {post.linkPreview.description}
            </p>
          </div>
        </a>
      )}

      {/* Active Reactions Pills */}
      {post.reactions && Object.keys(post.reactions).length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          {Object.entries(post.reactions).map(([emoji, userIds]) => {
            if (!userIds || userIds.length === 0) return null;
            const hasReacted = Boolean(userId && userIds.includes(userId));
            return (
              <button
                key={emoji}
                type="button"
                onClick={() => onLike(post.id, emoji)}
                className={`px-2.5 py-1 rounded-full font-mono text-xs flex items-center gap-1.5 border transition-all cursor-pointer ${
                  hasReacted
                    ? "bg-primary-container/20 border-primary text-primary font-bold shadow-xs"
                    : "bg-surface-container-low border-outline-variant/30 text-on-surface-variant hover:border-primary/40"
                }`}
              >
                <span>{emoji}</span>
                <span>{userIds.length}</span>
              </button>
            );
          })}
        </div>
      )}

      <div className="flex items-center justify-between pt-3 border-t border-outline-variant/20 font-mono text-xs text-on-surface-variant">
        <div className="flex items-center gap-6">
          <button
            type="button"
            onClick={() => onLike(post.id, "❤️")}
            className={`flex items-center gap-1.5 transition-colors cursor-pointer ${
              isLiked ? "text-error font-bold" : "hover:text-primary"
            }`}
          >
            <Heart className="w-5 h-5" fill={isLiked ? "currentColor" : "none"} />
            <span>{post.likesCount}</span>
          </button>
          <button
            type="button"
            onClick={() => onToggleComments(post.id)}
            className="flex items-center gap-1.5 hover:text-primary transition-colors cursor-pointer"
          >
            <MessageCircle className="w-5 h-5" />
            <span>{post.commentsCount} Commentaires</span>
          </button>
        </div>

        <ReactionPicker
          onSelectEmoji={(emoji) => onLike(post.id, emoji)}
          label="😀+ Réagir"
        />
      </div>

      {showComments && (
        <div className="pt-3 border-t border-outline-variant/20 flex flex-col gap-3">
          {process.env.NEXT_PUBLIC_FIREBASE_API_KEY && (
            <PostComments postId={post.id} />
          )}
          <div className="flex gap-3">
            <input
              type="text"
              value={commentInput}
              onChange={(event) => onCommentInputChange(event.target.value)}
              placeholder="Écrire un commentaire..."
              className="flex-1 bg-surface-container-low border border-outline-variant/40 rounded-full px-4 py-2 font-body text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  onComment(post.id);
                }
              }}
            />
            <button
              type="button"
              onClick={() => onComment(post.id)}
              className="bg-primary text-on-primary font-mono text-xs font-semibold px-4 py-2 rounded-full flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              Envoyer
            </button>
          </div>
        </div>
      )}
    </article>
  );
}

function PostComments({ postId }: { postId: string }) {
  const [comments, setComments] = useState<PostComment[]>([]);

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) return;
    const unsubscribe = subscribeToPostComments(postId, setComments);
    return () => unsubscribe();
  }, [postId]);

  return (
    <CommentsList
      comments={comments}
      emptyMessage="Aucun commentaire pour l'instant."
    />
  );
}
