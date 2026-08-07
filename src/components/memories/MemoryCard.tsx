"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Heart, Images, MessageCircle, Send, Share2 } from "lucide-react";
import { MemoryItem, PostComment } from "@/types";
import { CommentsList } from "@/components/common/CommentsList";
import { subscribeToMemoryComments } from "@/lib/firebase/memories";

interface MemoryCardProps {
  memory: MemoryItem;
  commentsOpen: boolean;
  commentInput: string;
  onLike: (memoryId: string) => void;
  onToggleComments: (memoryId: string) => void;
  onCommentInputChange: (value: string) => void;
  onComment: (memoryId: string) => void;
  onShare: (title: string, description: string) => void;
}

export function MemoryCard({
  memory,
  commentsOpen,
  commentInput,
  onLike,
  onToggleComments,
  onCommentInputChange,
  onComment,
  onShare,
}: MemoryCardProps) {
  const photoCount = memory.images?.length || (memory.imageUrl ? 1 : 0);

  return (
    <article className="bg-surface rounded-2xl p-5 card-shadow border border-outline-variant/30 flex flex-col justify-between hover:border-primary/40 transition-all group">
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

      <div className="flex flex-col gap-3 pt-3 border-t border-outline-variant/20 mt-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image src={memory.authorAvatar} alt={memory.authorName} width={32} height={32} className="w-8 h-8 rounded-full object-cover" />
            <span className="font-headline font-semibold text-xs text-on-surface">
              {memory.authorName}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onLike(memory.id)}
              className="flex items-center gap-1 font-mono text-xs text-on-surface-variant hover:text-primary transition-colors"
            >
              <Heart className="w-4 h-4" />
              <span>{memory.likesCount}</span>
            </button>
            <button
              type="button"
              onClick={() => onToggleComments(memory.id)}
              className="flex items-center gap-1 font-mono text-xs text-on-surface-variant hover:text-primary transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              <span>{memory.commentsCount}</span>
            </button>
            <button
              type="button"
              onClick={() => onShare(memory.title, memory.description)}
              className="text-on-surface-variant hover:text-primary transition-colors"
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
