"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, MessageCirclePlus } from "lucide-react";
import { useAuth } from "@/providers/AuthProvider";
import type { Conversation } from "@/types/messaging";

function formatLastMessageTime(createdAt: unknown): string {
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
  const diffHours = Math.floor(diffMs / 3600000);

  if (diffMins < 1) return "Maintenant";
  if (diffMins < 60) return `${diffMins}min`;
  if (diffHours < 24) return `${diffHours}h`;

  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays === 1) return "Hier";
  if (diffDays < 7) return `${diffDays}j`;

  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

interface ConversationListProps {
  conversations: Conversation[];
  selectedId: string | null;
  onSelect: (conversation: Conversation) => void;
  onNewConversation: () => void;
}

export function ConversationList({
  conversations,
  selectedId,
  onSelect,
  onNewConversation,
}: ConversationListProps) {
  const { user } = useAuth();
  const [search, setSearch] = useState("");

  const filtered = conversations.filter((convo) => {
    if (!search.trim()) return true;
    const otherUserId = convo.participants.find((p) => p !== user?.id) || "";
    const otherName = convo.participantProfiles?.[otherUserId]?.name || "";
    return otherName.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 pt-5 pb-3 shrink-0">
        <div className="flex items-center justify-between mb-4">
          <h1 className="font-headline text-xl font-extrabold text-on-surface">
            Messages
          </h1>
          <button
            onClick={onNewConversation}
            className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center hover:bg-primary/90 active:scale-95 transition-all shadow-md"
            aria-label="Nouvelle conversation"
            id="new-conversation-btn"
          >
            <MessageCirclePlus className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/50" />
          <input
            type="text"
            placeholder="Rechercher un mentor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-surface-container rounded-xl pl-10 pr-4 py-2.5 text-on-surface font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 border border-outline-variant/30 placeholder:text-on-surface-variant/50"
            id="conversation-search"
          />
        </div>
      </div>

      {/* Conversations */}
      <div className="flex-1 overflow-y-auto px-2">
        <AnimatePresence>
          {filtered.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-16 text-center"
            >
              <div className="w-16 h-16 rounded-full bg-surface-container-high flex items-center justify-center mb-3">
                <MessageCirclePlus className="w-8 h-8 text-on-surface-variant/30" />
              </div>
              <p className="font-headline font-bold text-on-surface-variant text-sm">
                {search ? "Aucun résultat" : "Aucune conversation"}
              </p>
              <p className="font-body text-xs text-on-surface-variant/60 mt-1">
                {search
                  ? "Essaie un autre nom"
                  : "Commence une nouvelle discussion !"}
              </p>
              {!search && (
                <button
                  onClick={onNewConversation}
                  className="mt-4 bg-primary text-on-primary font-mono text-xs font-bold px-5 py-2.5 rounded-full hover:bg-primary/90 active:scale-95 transition-all shadow-md flex items-center gap-1.5"
                >
                  <MessageCirclePlus className="w-4 h-4" />
                  Nouveau message
                </button>
              )}
            </motion.div>
          ) : (
            filtered.map((convo, index) => {
              const otherUserId =
                convo.participants.find((p) => p !== user?.id) || "";
              const otherProfile = convo.participantProfiles?.[otherUserId];
              const otherAvatar = typeof otherProfile?.avatar === "string" ? otherProfile.avatar.trim() : "";
              const unreadCount = convo.unreadCounts?.[user?.id || ""] || 0;
              const isSelected = selectedId === convo.id;
              const isTyping = convo.typingUsers?.includes(otherUserId);

              return (
                <motion.button
                  key={convo.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03, duration: 0.2 }}
                  onClick={() => onSelect(convo)}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-2xl transition-all duration-200 text-left mb-0.5 ${
                    isSelected
                      ? "bg-primary-container/30 border border-primary/20"
                      : "hover:bg-surface-container-high border border-transparent"
                  }`}
                  id={`conversation-${convo.id}`}
                >
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    {otherAvatar ? (
                      // eslint-disable-next-line @next/next/no-img-element -- avatar URL comes from the profile and may be external
                      <img
                        src={otherAvatar}
                        alt={otherProfile?.name || ""}
                        className="w-12 h-12 rounded-full object-cover border-2 border-surface-container shadow-sm"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-primary-container text-primary flex items-center justify-center font-headline font-bold border-2 border-surface-container shadow-sm">
                        {(otherProfile?.name || "U").charAt(0).toUpperCase()}
                      </div>
                    )}
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-primary text-on-primary font-mono text-[10px] font-bold min-w-[20px] h-5 rounded-full flex items-center justify-center px-1 border-2 border-surface shadow-sm">
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </span>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span
                        className={`font-headline text-sm truncate ${
                          unreadCount > 0
                            ? "font-extrabold text-on-surface"
                            : "font-bold text-on-surface"
                        }`}
                      >
                        {otherProfile?.name || "Utilisateur"}
                      </span>
                      {Boolean(convo.lastMessage?.createdAt) && (
                        <span
                          className={`font-mono text-[10px] shrink-0 ml-2 ${
                            unreadCount > 0
                              ? "text-primary font-bold"
                              : "text-on-surface-variant/60"
                          }`}
                        >
                          {formatLastMessageTime(convo.lastMessage?.createdAt)}
                        </span>
                      )}
                    </div>

                    {isTyping ? (
                      <p className="font-body text-xs text-primary italic truncate mt-0.5">
                        est en train d&apos;écrire...
                      </p>
                    ) : convo.lastMessage ? (
                      <p
                        className={`font-body text-xs truncate mt-0.5 ${
                          unreadCount > 0
                            ? "text-on-surface font-semibold"
                            : "text-on-surface-variant"
                        }`}
                      >
                        {convo.lastMessage.senderId === user?.id && (
                          <span className="text-on-surface-variant/60">
                            Vous :{" "}
                          </span>
                        )}
                        {convo.lastMessage.content}
                      </p>
                    ) : (
                      <p className="font-body text-xs text-on-surface-variant/50 italic truncate mt-0.5">
                        Pas encore de message
                      </p>
                    )}
                  </div>
                </motion.button>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
