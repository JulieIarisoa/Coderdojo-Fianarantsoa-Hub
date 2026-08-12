"use client";

import { useState, useEffect, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { Search, X, MessageSquarePlus, UserCheck } from "lucide-react";
import { useAuth } from "@/providers/AuthProvider";
import { subscribeToAllMentors } from "@/lib/firebase/firestore";
import { getOrCreateConversation } from "@/lib/firebase/messaging";
import { MOCK_MENTORS } from "@/lib/mockData";
import type { UserProfile } from "@/types";
import type { Conversation } from "@/types/messaging";

interface NewConversationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectConversation: (convo: Conversation) => void;
}

export function NewConversationModal({
  isOpen,
  onClose,
  onSelectConversation,
}: NewConversationModalProps) {
  const { user } = useAuth();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const [mentors, setMentors] = useState<UserProfile[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) return;

    if (process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
      const unsub = subscribeToAllMentors((data) => {
        setMentors(data);
      });
      return () => unsub();
    } else {
      queueMicrotask(() => {
        setMentors(MOCK_MENTORS as UserProfile[]);
      });
    }
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  const availableMentors = mentors
    .filter((m) => m.id !== user?.id)
    .filter((m) => {
      if (!search.trim()) return true;
      const queryStr = search.toLowerCase();
      return (
        m.name.toLowerCase().includes(queryStr) ||
        m.skills?.some((s) => s.toLowerCase().includes(queryStr))
      );
    });

  const handleStartConversation = async (mentor: UserProfile) => {
    if (!user) return;
    setLoading(true);
    setError("");

    try {
      const convo = await getOrCreateConversation(
        { id: user.id, name: user.name, avatar: user.avatar },
        { id: mentor.id, name: mentor.name, avatar: mentor.avatar }
      );
      onSelectConversation(convo);
      onClose();
    } catch (err) {
      console.error("Error starting conversation:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de démarrer la conversation."
      );
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-surface rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl border border-outline-variant/40 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-headline text-lg font-extrabold text-on-surface flex items-center gap-2">
            <MessageSquarePlus className="w-5 h-5 text-primary" />
            Nouveau message
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-variant transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Input */}
        <div className="relative mb-4">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/50" />
          <input
            type="text"
            placeholder="Rechercher par nom ou compétence..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-surface-container rounded-xl pl-10 pr-4 py-2.5 text-on-surface font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 border border-outline-variant/30 placeholder:text-on-surface-variant/50"
            autoFocus
          />
        </div>

        {error && (
          <p className="font-mono text-xs text-error mb-3">{error}</p>
        )}

        {/* Mentor List */}
        <div className="overflow-y-auto flex-1 space-y-2 pr-1">
          {availableMentors.length === 0 ? (
            <div className="py-12 text-center text-on-surface-variant/60 font-body text-sm">
              Aucun mentor trouvé
            </div>
          ) : (
            availableMentors.map((mentor) => (
              <button
                key={mentor.id}
                onClick={() => handleStartConversation(mentor)}
                disabled={loading}
                className="w-full flex items-center gap-3 p-3 rounded-2xl bg-surface-container-low hover:bg-surface-container border border-outline-variant/20 hover:border-primary/30 transition-all text-left group"
              >
                {mentor.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element -- profile avatars use dynamic external URLs
                  <img
                    src={mentor.avatar}
                    alt={mentor.name}
                    className="w-11 h-11 rounded-full object-cover border-2 border-surface-container shadow-sm group-hover:scale-105 transition-transform"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-full bg-primary-container text-primary flex items-center justify-center font-headline font-bold border-2 border-surface-container shadow-sm group-hover:scale-105 transition-transform">
                    {(mentor.name || "U").charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-headline font-bold text-sm text-on-surface truncate">
                      {mentor.name}
                    </span>
                    <span className="font-mono text-[10px] text-primary bg-primary-container/30 px-2 py-0.5 rounded-full">
                      Niv. {mentor.level || 1}
                    </span>
                  </div>

                  {mentor.skills && mentor.skills.length > 0 && (
                    <div className="flex gap-1 mt-1 overflow-hidden">
                      {mentor.skills.slice(0, 3).map((skill) => (
                        <span
                          key={skill}
                          className="font-mono text-[10px] text-on-surface-variant/70 bg-surface-container-high px-1.5 py-0.5 rounded"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <UserCheck className="w-5 h-5 text-on-surface-variant/30 group-hover:text-primary transition-colors shrink-0" />
              </button>
            ))
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
