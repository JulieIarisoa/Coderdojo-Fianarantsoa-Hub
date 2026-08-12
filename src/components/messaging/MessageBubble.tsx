"use client";

import { motion } from "framer-motion";
import { ShieldAlert } from "lucide-react";
import type { ChatMessage } from "@/types/messaging";

function formatMessageTime(createdAt: unknown): string {
  if (!createdAt) return "";

  let date: Date;
  if (createdAt && typeof createdAt === "object" && "toMillis" in createdAt) {
    date = new Date((createdAt as { toMillis: () => number }).toMillis());
  } else if (typeof createdAt === "string" || typeof createdAt === "number") {
    date = new Date(createdAt);
  } else {
    return "";
  }

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "À l'instant";
  if (diffMins < 60) return `il y a ${diffMins}min`;

  const isToday = date.toDateString() === now.toDateString();
  if (isToday) {
    return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  }

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return `Hier ${date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`;
  }

  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface MessageBubbleProps {
  message: ChatMessage;
  isMine: boolean;
  showAvatar?: boolean;
}

export function MessageBubble({ message, isMine, showAvatar = true }: MessageBubbleProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={`flex w-full gap-2 ${isMine ? "flex-row-reverse" : "flex-row"} items-end`}
    >
      {/* Avatar placeholder for alignment */}
      {showAvatar ? (
        message.fromAvatar ? (
          // eslint-disable-next-line @next/next/no-img-element -- profile avatars use dynamic external URLs
          <img
            src={message.fromAvatar}
            alt={message.fromName}
            className="w-7 h-7 rounded-full object-cover border border-outline-variant/40 shrink-0"
          />
        ) : (
          <div className="w-7 h-7 rounded-full bg-primary-container text-primary flex items-center justify-center text-xs font-bold border border-outline-variant/40 shrink-0">
            {(message.fromName || "U").charAt(0).toUpperCase()}
          </div>
        )
      ) : (
        <div className="w-7 shrink-0" />
      )}

      {/* Bubble */}
      <div
        className={`group relative max-w-[80%] px-4 py-3 rounded-[1.25rem] shadow-sm transition-all ${
          message.decryptionFailed
            ? "border border-error/20 bg-error-container/35 text-on-surface"
            : isMine
              ? "bg-primary text-on-primary rounded-br-md"
              : "border border-outline-variant/25 bg-surface-container-high text-on-surface rounded-bl-md"
        }`}
      >
        {message.decryptionFailed && (
          <div className="flex items-center gap-1.5 mb-1">
            <ShieldAlert className="w-3.5 h-3.5 text-error" />
            <span className="font-mono text-[10px] text-error font-semibold">
              Message indisponible
            </span>
          </div>
        )}

        <p className="font-body text-sm leading-relaxed whitespace-pre-wrap break-words">
          {message.content}
        </p>

        {/* Timestamp */}
        <div
          className={`flex items-center gap-1 mt-1 ${
            isMine ? "justify-end" : "justify-start"
          }`}
        >
          <span
            className={`font-mono text-[10px] ${
              isMine ? "text-on-primary/60" : "text-on-surface-variant/60"
            }`}
          >
            {formatMessageTime(message.createdAt)}
          </span>

          {isMine && message.read && (
            <span className="text-on-primary/60 text-[10px] font-bold">✓✓</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
