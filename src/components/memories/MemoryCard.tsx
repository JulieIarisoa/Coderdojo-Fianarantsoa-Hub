"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Heart, Images, MessageCircle, Send, Share2 } from "lucide-react";
import { MemoryItem, PostComment } from "@/types";
import { CommentsList } from "@/components/common/CommentsList";
import { ReactionPicker } from "@/components/common/ReactionPicker";
import { subscribeToMemoryComments } from "@/lib/firebase/memories";

interface MemoryCardProps {
  memory: MemoryItem;
  userId?: string;
  commentsOpen: boolean;
  commentInput: string;
  onLike: (memoryId: string, emoji?: string) => void;
  onToggleComments: (memoryId: string) => void;
  onCommentInputChange: (value: string) => void;
  onComment: (memoryId: string) => void;
  onShare: (title: string, description: string) => void;
}

export function MemoryCard({
  memory,
  userId,
  commentsOpen,
  commentInput,
  onLike,
  onToggleComments,
  onCommentInputChange,
  onComment,
  onShare,
}: MemoryCardProps) {
  const photoCount = memory.images?.length || (memory.imageUrl ? 1 : 0);
  const isLiked = Boolean(userId && memory.reactions?.["❤️"]?.includes(userId));

  return (
    <article className="bg-surface rounded-2xl p-5 card-shadow border border-outline-variant/30 flex flex-col justify-between hover:border-primary/40 transition-all group relative">
      <Link href={`/memories/${memory.id}`} className="block relative h-48 w-full rounded-xl overflow-hidden mb-4 cursor-pointer">
        <Image src={memory.imageUrl} alt={memory.title} fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover group-hover:scale-105 transition-transform duration-300" />
        {photoCount > 1 && (
          <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-md text-white font-mono text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-md">
            <Images className="w-3.5 h-3.5 text-primary-container" />
            {photoCount} photos
          </div>
        )}
      </Link>

      <div>
        <Link href={`/memories/${memory.id}`}>
          <h3 className="font-headline text-xl font-bold text-on-surface mb-2 hover:text-primary transition-colors cursor-pointer">
            {memory.title}
          </h3>
        </Link>
        <p className="font-body text-sm text-on-surface-variant line-clamp-3 mb-4">
          {memory.description}
        </p>
      </div>

      {/* Active Reactions Pills */}
      {memory.reactions && Object.keys(memory.reactions).length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 mb-3">
          {Object.entries(memory.reactions).map(([emoji, userIds]) => {
            if (!userIds || userIds.length === 0) return null;
            const hasReacted = Boolean(userId && userIds.includes(userId));
            return (
              <button
                key={emoji}
                type="button"
                onClick={() => onLike(memory.id, emoji)}
                className={`px-2 py-0.5 rounded-full font-mono text-xs flex items-center gap-1 border transition-all cursor-pointer ${
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

      <div className="flex flex-col gap-3 pt-3 border-t border-outline-variant/20 mt-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image src={memory.authorAvatar} alt={memory.authorName} width={32} height={32} className="w-8 h-8 rounded-full object-cover" />
            <span className="font-headline font-semibold text-xs text-on-surface">
              {memory.authorName}
            </span>
          </div>

          <div className="flex items-center gap-2.5 font-mono text-xs">
            <button
              type="button"
              onClick={() => onLike(memory.id, "❤️")}
              className={`flex items-center gap-1 transition-colors cursor-pointer ${
                isLiked ? "text-error font-bold" : "text-on-surface-variant hover:text-primary"
              }`}
            >
              <Heart className="w-4 h-4" fill={isLiked ? "currentColor" : "none"} />
              <span>{memory.likesCount}</span>
            </button>
            <button
              type="button"
              onClick={() => onToggleComments(memory.id)}
              className="flex items-center gap-1 text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
            >
              <MessageCircle className="w-4 h-4" />
              <span>{memory.commentsCount}</span>
            </button>

            <ReactionPicker
              onSelectEmoji={(emoji) => onLike(memory.id, emoji)}
              size="sm"
              label="😀+"
            />

            <button
              type="button"
              onClick={() => onShare(memory.title, memory.description)}
              className="text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
              aria-label="Partager ce souvenir"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {commentsOpen && (
          <div className="pt-3 border-t border-outline-variant/20 flex flex-col gap-3">
            {process.env.NEXT_PUBLIC_FIREBASE_API_KEY && (
              <MemoryComments memoryId={memory.id} />
            )}
            <div className="flex gap-2">
              <input
                type="text"
                value={commentInput}
                onChange={(event) => onCommentInputChange(event.target.value)}
                placeholder="Commenter..."
                className="flex-1 bg-surface-container-low border border-outline-variant/40 rounded-full px-3 py-1.5 font-body text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    onComment(memory.id);
                  }
                }}
              />
              <button
                type="button"
                onClick={() => onComment(memory.id)}
                className="bg-primary text-on-primary font-mono text-[10px] font-semibold px-3 py-1.5 rounded-full flex items-center gap-1"
              >
                <Send className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}
      </div>
    </article>
  );
}

export function MemoryComments({ memoryId }: { memoryId: string }) {
  const [comments, setComments] = useState<PostComment[]>([]);

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) return;
    const unsubscribe = subscribeToMemoryComments(memoryId, setComments);
    return () => unsubscribe();
  }, [memoryId]);

  return (
    <CommentsList
      comments={comments}
      emptyMessage="Aucun commentaire sur cette photo. Sois le premier à commenter !"
      avatarClassName="w-7 h-7"
      textClassName="text-xs"
    />
  );
}
