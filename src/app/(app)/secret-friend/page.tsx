"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { MOCK_SECRET_FRIEND } from "@/lib/mockData";
import { SecretFriendAssignment } from "@/types";
import {
  subscribeToSecretFriendAssignment,
  addSecretFriendJournalEntry,
} from "@/lib/firebase/secretFriend";
import {
  Gift,
  Clock,
  HelpCircle,
  Flame,
  Send,
  X,
  Heart,
  Coffee,
  Mail,
  Sparkles,
} from "lucide-react";

const ICON_MAP: Record<string, React.ReactNode> = {
  favorite: <Heart className="w-5 h-5" />,
  local_cafe: <Coffee className="w-5 h-5" />,
  mark_email_read: <Mail className="w-5 h-5" />,
};

export default function SecretFriendPage() {
  const { user } = useAuth();
  const [assignment, setAssignment] = useState<SecretFriendAssignment>(MOCK_SECRET_FRIEND);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [secretMessage, setSecretMessage] = useState("");
  const [messageSent, setMessageSent] = useState(false);

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY || !user) return;

    const unsub = subscribeToSecretFriendAssignment(user.id, (a) => {
      if (a) setAssignment(a);
    });

    return () => unsub();
  }, [user]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!secretMessage.trim()) return;

    if (process.env.NEXT_PUBLIC_FIREBASE_API_KEY && assignment.id) {
      await addSecretFriendJournalEntry(assignment.id, {
        actionText: `Message anonyme envoyé: "${secretMessage}"`,
        icon: "mark_email_read",
      });
    } else {
      const newJournalItem = {
        id: `act-${Date.now()}`,
        actionText: `Message anonyme envoyé: "${secretMessage}"`,
        timeAgo: "À l'instant",
        icon: "mark_email_read",
      };
      setAssignment({
        ...assignment,
        actionJournal: [newJournalItem, ...assignment.actionJournal],
      });
    }

    setMessageSent(true);
    setTimeout(() => {
      setMessageSent(false);
      setShowMessageModal(false);
      setSecretMessage("");
    }, 1500);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div>
        <h1 className="font-headline text-3xl md:text-4xl font-extrabold text-on-surface flex items-center gap-2">
          <Gift className="w-8 h-8 text-primary" />
          Secret Friend
        </h1>
        <p className="font-body text-on-surface-variant text-base mt-1">
          Répands la bonne humeur, en toute discrétion.
        </p>
      </div>

      {/* Top Grid: Mystery Card & Mission Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ton Secret Friend Card */}
        <div className="lg:col-span-2 bg-surface rounded-2xl p-gutter card-shadow border border-outline-variant/30 flex flex-col justify-between relative overflow-hidden">
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-3">
            <div>
              <h2 className="font-headline text-2xl font-bold text-on-surface mb-1">
                Ton Secret Friend
              </h2>
              <span className="font-mono text-xs text-on-surface-variant uppercase tracking-wider">
                Saison Automne 2023
              </span>
            </div>

            <div className="bg-primary-container/20 text-primary font-mono text-xs font-semibold px-4 py-2 rounded-full flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Révélation dans 12 jours
            </div>
          </div>

          {/* Mystery Avatar & Subtext */}
          <div className="flex flex-col items-center text-center my-6">
            <div className="w-28 h-28 rounded-full bg-surface-container-high border-4 border-surface shadow-inner flex items-center justify-center text-primary mb-6">
              <HelpCircle className="w-12 h-12" />
            </div>
            <p className="font-body text-on-surface-variant max-w-md text-base leading-relaxed">
              Quelqu&apos;un au dojo compte sur toi pour lui donner le sourire. Remplis tes missions hebdomadaires pour semer des indices !
            </p>
          </div>
        </div>

        {/* Mission Card */}
        <div className="bg-surface-container-low rounded-2xl p-gutter card-shadow border border-outline-variant/30 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4 text-primary">
              <Flame className="w-5 h-5" />
              <h3 className="font-headline font-bold text-lg">
                {assignment.missionTitle}
              </h3>
            </div>

            <p className="font-headline text-lg font-bold text-on-surface leading-snug mb-6">
              {assignment.missionDescription}
            </p>
          </div>

          <button
            onClick={() => setShowMessageModal(true)}
            className="w-full bg-primary hover:bg-surface-tint text-on-primary font-mono text-sm font-semibold py-3.5 px-6 rounded-xl shadow-md transition-all text-center flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" />
            Envoyer un message
          </button>
        </div>
      </div>

      {/* Action Journal Section */}
      <div className="bg-surface rounded-2xl p-gutter card-shadow border border-outline-variant/30">
        <h3 className="font-headline text-xl font-bold text-on-surface mb-6">
          Journal des actions
        </h3>

        <div className="flex flex-col gap-6 relative before:absolute before:left-5 before:top-3 before:bottom-3 before:w-0.5 before:bg-outline-variant/30">
          {assignment.actionJournal.map((act) => (
            <div key={act.id} className="flex items-start gap-4 relative z-10">
              <div className="w-10 h-10 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center shrink-0 shadow-sm">
                {ICON_MAP[act.icon] || <Gift className="w-5 h-5" />}
              </div>
              <div>
                <p className="font-body font-semibold text-on-surface text-base">
                  {act.actionText}
                </p>
                <span className="font-mono text-xs text-on-surface-variant">
                  {act.timeAgo}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Secret Message Modal */}
      {showMessageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-surface rounded-2xl p-6 md:p-8 max-w-md w-full shadow-2xl border border-outline-variant/40">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-headline text-lg font-bold text-on-surface flex items-center gap-2">
                <Mail className="w-5 h-5 text-primary" />
                Envoyer un message anonyme
              </h3>
              <button onClick={() => setShowMessageModal(false)} className="text-on-surface-variant hover:text-on-surface">
                <X className="w-5 h-5" />
              </button>
            </div>

            {messageSent ? (
              <div className="py-8 text-center text-primary font-headline font-bold flex flex-col items-center gap-2">
                <Sparkles className="w-8 h-8" />
                Message envoyé à ton Secret Friend !
              </div>
            ) : (
              <form onSubmit={handleSendMessage} className="flex flex-col gap-4">
                <textarea
                  rows={4}
                  required
                  value={secretMessage}
                  onChange={(e) => setSecretMessage(e.target.value)}
                  placeholder="Écris ton mot d'encouragement anonyme ici..."
                  className="w-full bg-surface-container-low border border-outline-variant/40 rounded-xl p-3 text-on-surface font-body resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                />

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowMessageModal(false)}
                    className="px-4 py-2 font-mono text-xs text-on-surface-variant hover:bg-surface-container rounded-full"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="bg-primary text-on-primary font-mono text-xs font-semibold px-6 py-2 rounded-full flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Envoyer
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
