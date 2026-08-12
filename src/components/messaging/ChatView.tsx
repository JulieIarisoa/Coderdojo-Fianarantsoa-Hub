"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Send, ShieldCheck, ShieldAlert, Loader2 } from "lucide-react";
import { useAuth } from "@/providers/AuthProvider";
import {
  subscribeToConversationMessages,
  sendMessageToConversation,
  markConversationRead,
  setTypingStatus,
  isMessageEncryptionKeyMismatchError,
  resetMessageEncryptionKey,
} from "@/lib/firebase/messaging";
import type { Conversation, ChatMessage } from "@/types/messaging";
import { MessageBubble } from "./MessageBubble";

interface ChatViewProps {
  conversation: Conversation;
  onBack: () => void;
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 px-4 py-2">
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 rounded-full bg-primary/40"
            animate={{ y: [0, -4, 0] }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              delay: i * 0.15,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
      <span className="font-body text-xs text-on-surface-variant">
        est en train d&apos;écrire...
      </span>
    </div>
  );
}

export function ChatView({ conversation, onBack }: ChatViewProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const [needsKeyRecovery, setNeedsKeyRecovery] = useState(false);
  const [recoveringKey, setRecoveringKey] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const otherUserId = conversation.participants.find((p) => p !== user?.id) || "";
  const otherProfile = conversation.participantProfiles?.[otherUserId];
  const otherAvatar = typeof otherProfile?.avatar === "string" ? otherProfile.avatar.trim() : "";
  const isTyping = conversation.typingUsers?.includes(otherUserId);

  // Subscribe to messages
  useEffect(() => {
    if (!user || !conversation.id) return;

    const unsub = subscribeToConversationMessages(
      conversation.id,
      user.id,
      (msgs) => {
        setMessages(msgs);
      }
    );

    return () => unsub();
  }, [user, conversation.id]);

  // Mark as read when opening
  useEffect(() => {
    if (!user || !conversation.id) return;
    const unreadCount = conversation.unreadCounts?.[user.id] || 0;
    if (unreadCount > 0) {
      void markConversationRead(conversation.id, user.id);
    }
  }, [user, conversation.id, conversation.unreadCounts]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Focus input
  useEffect(() => {
    inputRef.current?.focus();
  }, [conversation.id]);

  const handleTyping = useCallback(() => {
    if (!user || !conversation.id) return;

    void setTypingStatus(conversation.id, user.id, true);

    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      void setTypingStatus(conversation.id, user.id, false);
    }, 2000);
  }, [user, conversation.id]);

  // Clear typing on unmount
  useEffect(() => {
    return () => {
      if (typingTimeout.current) clearTimeout(typingTimeout.current);
      if (user && conversation.id) {
        void setTypingStatus(conversation.id, user.id, false);
      }
    };
  }, [user, conversation.id]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = inputValue.trim();
    if (!content || !user || sending) return;

    setSending(true);
    setSendError("");
    setNeedsKeyRecovery(false);

    try {
      await sendMessageToConversation({
        conversationId: conversation.id,
        fromId: user.id,
        fromName: user.name,
        fromAvatar: user.avatar,
        toId: otherUserId,
        toName: otherProfile?.name || "Utilisateur",
        content,
      });
      setInputValue("");
      void setTypingStatus(conversation.id, user.id, false);
    } catch (error) {
      if (isMessageEncryptionKeyMismatchError(error)) {
        setNeedsKeyRecovery(true);
        setSendError(
          "La clé de ce navigateur n'est plus synchronisée. Réinitialise-la pour continuer."
        );
      } else {
        setSendError(
          error instanceof Error ? error.message : "Le message n'a pas pu être envoyé."
        );
      }
    } finally {
      setSending(false);
    }
  };

  const handleRecoverKey = async () => {
    if (!user || recoveringKey) return;
    setRecoveringKey(true);
    setSendError("");
    try {
      await resetMessageEncryptionKey(user.id);
      setNeedsKeyRecovery(false);
    } catch (error) {
      setSendError(
        error instanceof Error ? error.message : "La clé n'a pas pu être réinitialisée."
      );
    } finally {
      setRecoveringKey(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend(e);
    }
  };

  // Group messages to control avatar display
  const shouldShowAvatar = (index: number) => {
    if (index === messages.length - 1) return true;
    return messages[index].fromId !== messages[index + 1]?.fromId;
  };

  return (
    <div className="flex min-w-0 min-h-0 flex-col h-full bg-surface">
      {/* Chat Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-outline-variant/30 bg-surface-container-lowest/90 backdrop-blur-md shrink-0">
        <button
          onClick={onBack}
          className="lg:hidden w-9 h-9 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high transition-colors"
          aria-label="Retour à la liste"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        {otherAvatar ? (
          // eslint-disable-next-line @next/next/no-img-element -- avatar URL comes from the profile and may be external
          <img
            src={otherAvatar}
            alt={otherProfile?.name || ""}
            className="w-10 h-10 rounded-full object-cover border-2 border-primary-container shadow-sm"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-primary-container text-primary flex items-center justify-center font-headline font-bold border-2 border-primary-container shadow-sm">
            {(otherProfile?.name || "U").charAt(0).toUpperCase()}
          </div>
        )}

        <div className="flex-1 min-w-0">
          <h2 className="font-headline font-bold text-on-surface text-sm truncate">
            {otherProfile?.name || "Conversation"}
          </h2>
          <AnimatePresence mode="wait">
            {isTyping ? (
              <motion.p
                key="typing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="font-body text-xs text-primary"
              >
                est en train d&apos;écrire...
              </motion.p>
            ) : (
              <motion.p
                key="encrypted"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="font-mono text-[10px] text-on-surface-variant flex items-center gap-1"
              >
                <ShieldCheck className="w-3 h-3" />
                Chiffré de bout en bout
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Messages Area */}
      <div
        ref={scrollRef}
        className="min-h-0 flex-1 overflow-y-auto px-5 py-6 space-y-2 scroll-smooth bg-surface-container-lowest/35"
        style={{ overscrollBehavior: "contain" }}
      >
        {messages.some((message) => message.decryptionFailed) && (
          <div className="mb-4 flex items-start gap-3 rounded-2xl border border-error/20 bg-error-container/25 px-4 py-3 text-on-surface">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-error" />
            <div>
              <p className="font-headline text-xs font-bold">Certains messages sont indisponibles</p>
              <p className="mt-0.5 font-body text-xs text-on-surface-variant">Ils ont été chiffrés avec une ancienne clé de cet appareil.</p>
            </div>
          </div>
        )}
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <div className="w-16 h-16 rounded-full bg-primary-container/30 flex items-center justify-center mb-4">
              <ShieldCheck className="w-8 h-8 text-primary/40" />
            </div>
            <p className="font-headline font-bold text-on-surface-variant text-sm">
              Début de la conversation
            </p>
            <p className="font-body text-xs text-on-surface-variant/60 mt-1 max-w-xs">
              Les messages sont chiffrés de bout en bout. Seuls toi et{" "}
              {otherProfile?.name || "ton contact"} pouvez les lire.
            </p>
          </div>
        ) : (
          <>
            {messages.map((msg, index) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                isMine={msg.fromId === user?.id}
                showAvatar={shouldShowAvatar(index)}
              />
            ))}

            {isTyping && <TypingIndicator />}
          </>
        )}
      </div>

      {/* Send Error */}
      <AnimatePresence>
        {sendError && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-4 overflow-hidden"
          >
            <div className="py-2 flex items-center gap-2">
              <p className="font-mono text-xs text-error flex-1">{sendError}</p>
              {needsKeyRecovery && (
                <button
                  onClick={handleRecoverKey}
                  disabled={recoveringKey}
                  className="shrink-0 bg-primary-container/20 text-primary hover:bg-primary-container/40 font-mono text-xs font-bold px-3 py-1.5 rounded-lg disabled:opacity-40"
                >
                  {recoveringKey ? "..." : "Réinitialiser la clé"}
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Area */}
      <form
        onSubmit={handleSend}
        className="flex items-end gap-2 px-4 py-3 border-t border-outline-variant/30 bg-surface-container-lowest/80 backdrop-blur-md shrink-0"
      >
        <textarea
          ref={inputRef}
          rows={1}
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            handleTyping();
          }}
          onKeyDown={handleKeyDown}
          placeholder="Écris un message..."
          className="flex-1 bg-surface-container rounded-2xl px-4 py-2.5 text-on-surface font-body text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/40 border border-outline-variant/30 max-h-32 placeholder:text-on-surface-variant/50"
          style={{
            height: "auto",
            minHeight: "40px",
          }}
          onInput={(e) => {
            const target = e.target as HTMLTextAreaElement;
            target.style.height = "auto";
            target.style.height = Math.min(target.scrollHeight, 128) + "px";
          }}
        />

        <button
          type="submit"
          disabled={!inputValue.trim() || sending}
          className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center shrink-0 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary/90 active:scale-95 transition-all shadow-md"
          aria-label="Envoyer"
        >
          {sending ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </button>
      </form>
    </div>
  );
}
