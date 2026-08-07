import Image from "next/image";
import { PostComment } from "@/types";

interface CommentsListProps {
  comments: PostComment[];
  emptyMessage: string;
  avatarClassName?: string;
  textClassName?: string;
}

export function CommentsList({
  comments,
  emptyMessage,
  avatarClassName = "w-8 h-8",
  textClassName = "text-sm",
}: CommentsListProps) {
  if (comments.length === 0) {
    return (
      <p className="font-body text-xs text-on-surface-variant py-2">
        {emptyMessage}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {comments.map((comment) => (
        <div key={comment.id} className="flex items-start gap-3">
          <Image src={comment.authorAvatar} alt={comment.authorName} width={32} height={32} className={`${avatarClassName} rounded-full object-cover border border-outline-variant/40 shrink-0`} />
          <div className="flex-1 bg-surface-container-low rounded-xl px-3 py-2">
            <span className="font-headline font-bold text-on-surface text-xs block">
              {comment.authorName}
            </span>
            <p className={`font-body text-on-surface ${textClassName}`}>
              {comment.content}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
