"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { MessageSquare, ShieldCheck } from "lucide-react";
import { useAuth } from "@/providers/AuthProvider";
import {
  subscribeToConversations,
  getOrCreateConversation,
  migrateLegacyMessages,
} from "@/lib/firebase/messaging";
import { getMentorById } from "@/lib/firebase/firestore";
import type { Conversation } from "@/types/messaging";
import { ConversationList } from "@/components/messaging/ConversationList";
import { ChatView } from "@/components/messaging/ChatView";
import { NewConversationModal } from "@/components/messaging/NewConversationModal";

function MessagesContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const targetUserId = searchParams.get("user");

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConvoId, setSelectedConvoId] = useState<string | null>(null);
  const [draftConvo, setDraftConvo] = useState<Conversation | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // Derive the active conversation from conversations list or draftConvo
  const selectedConvo =
    conversations.find((c) => c.id === selectedConvoId) ||
    (draftConvo?.id === selectedConvoId ? draftConvo : null);

  // Subscribe to user conversations
  useEffect(() => {
    if (!user) {
      queueMicrotask(() => setLoading(false));
      return;
    }

    if (process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
      void migrateLegacyMessages(user.id);

      const unsub = subscribeToConversations(user.id, (convos) => {
        setConversations(convos);
        setLoading(false);
      });
      return () => unsub();
    } else {
      queueMicrotask(() => setLoading(false));
    }
  }, [user]);

  // Handle direct navigation via query param ?user=<targetUserId>
  useEffect(() => {
    if (!targetUserId || !user || loading) return;

    const existing = conversations.find((c) =>
      c.participants.includes(targetUserId)
    );
    if (existing) {
      queueMicrotask(() => setSelectedConvoId(existing.id));
      return;
    }

    void (async () => {
      try {
        const targetProfile = await getMentorById(targetUserId);
        if (targetProfile) {
          const newConvo = await getOrCreateConversation(
            { id: user.id, name: user.name, avatar: user.avatar },
            { id: targetProfile.id, name: targetProfile.name, avatar: targetProfile.avatar }
          );
          setDraftConvo(newConvo);
          setSelectedConvoId(newConvo.id);
        }
      } catch (err) {
        console.error("Error opening conversation with target user:", err);
      }
    })();
  }, [targetUserId, user, loading, conversations]);

  const handleSelectConversation = (convo: Conversation) => {
    setDraftConvo(convo);
    setSelectedConvoId(convo.id);
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
        <MessageSquare className="w-12 h-12 text-primary/30 mb-3" />
        <h2 className="font-headline font-bold text-lg text-on-surface">
          Connexion requise
        </h2>
        <p className="font-body text-sm text-on-surface-variant mt-1">
          Connecte-toi pour accéder à tes messages et discuter avec les mentors.
        </p>
      </div>
    );
  }

  return (
    <div className="grid h-[calc(100dvh-7.5rem)] min-h-[520px] max-h-[820px] max-w-7xl mx-auto min-w-0 overflow-hidden rounded-3xl border border-outline-variant/30 bg-surface shadow-[0_18px_50px_-24px_rgba(50,20,100,0.35)] lg:grid-cols-[20rem_minmax(0,_1fr)]">
      {/* Left Panel: Conversation List */}
      <div
        className={`min-w-0 min-h-0 border-r border-outline-variant/30 bg-surface-container-lowest flex flex-col ${
          selectedConvo ? "hidden lg:flex" : "flex"
        }`}
      >
        <ConversationList
          conversations={conversations}
          selectedId={selectedConvoId}
          onSelect={handleSelectConversation}
          onNewConversation={() => setShowNewModal(true)}
        />
      </div>

      {/* Right Panel: Chat View */}
      <div
        className={`min-w-0 min-h-0 flex flex-col bg-surface ${
          selectedConvo ? "flex" : "hidden lg:flex"
        }`}
      >
        {selectedConvo ? (
          <ChatView
            conversation={selectedConvo}
            onBack={() => setSelectedConvoId(null)}
          />
        ) : (
          <div className="hidden lg:flex flex-col items-center justify-center h-full text-center p-8">
            <div className="w-20 h-20 rounded-3xl bg-primary-container/30 flex items-center justify-center mb-4 card-shadow">
              <MessageSquare className="w-10 h-10 text-primary" />
            </div>
            <h2 className="font-headline font-extrabold text-xl text-on-surface">
              Vos discussions
            </h2>
            <p className="font-body text-sm text-on-surface-variant mt-2 max-w-sm">
              Sélectionne une conversation dans la liste à gauche ou démarre un nouveau message pour échanger avec un mentor.
            </p>
            <button
              onClick={() => setShowNewModal(true)}
              className="mt-6 bg-primary text-on-primary font-mono text-xs font-bold px-6 py-3 rounded-full hover:bg-primary/90 active:scale-95 transition-all shadow-md flex items-center gap-2"
            >
              <MessageSquare className="w-4 h-4" />
              Nouveau message
            </button>
            <div className="mt-8 flex items-center gap-1.5 font-mono text-xs text-on-surface-variant/60">
              <ShieldCheck className="w-4 h-4 text-primary" />
              Chiffrement E2E activé (ECDH + AES-256)
            </div>
          </div>
        )}
      </div>

      {/* New Conversation Modal */}
      <NewConversationModal
        isOpen={showNewModal}
        onClose={() => setShowNewModal(false)}
        onSelectConversation={handleSelectConversation}
      />
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      }
    >
      <MessagesContent />
    </Suspense>
  );
}
