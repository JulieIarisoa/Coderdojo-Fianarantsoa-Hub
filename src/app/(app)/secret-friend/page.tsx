"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { MOCK_SECRET_FRIEND } from "@/lib/mockData";
import { SecretFriendAssignment, SecretFriendMessage } from "@/types";
import {
  subscribeToSecretFriendAssignment,
  subscribeToSecretFriendMessages,
  createSecretFriendMessage,
  markSecretFriendMessageRead,
} from "@/lib/firebase/firestore";
import { useImageUpload } from "@/hooks/useImageUpload";
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
  ImagePlus,
  Reply,
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
  const [messageImage, setMessageImage] = useState<File | null>(null);
  const [replyTo, setReplyTo] = useState<SecretFriendMessage | null>(null);
  const [messages, setMessages] = useState<SecretFriendMessage[]>([]);
  const [messageSent, setMessageSent] = useState(false);
  const [messageError, setMessageError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const { uploadImage, isUploading } = useImageUpload();

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY || !user) return;

    const unsubAssignment = subscribeToSecretFriendAssignment(user.id, (a) => {
      if (a) {
        setAssignment({
          ...a,
          actionJournal: a.actionJournal || [],
        });
      }
    });

    const unsubMessages = subscribeToSecretFriendMessages(user.id, setMessages);

    return () => {
      unsubAssignment?.();
      unsubMessages?.();
    };
  }, [user]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!secretMessage.trim() && !messageImage) || !user || !assignment.id) return;

    setSending(true);
    setMessageError(null);

    try {
      let imageUrl: string | undefined;
      if (messageImage) {
        const uploaded = await uploadImage(messageImage);
        if (!uploaded?.url) throw new Error("L'image n'a pas pu être envoyée.");
        imageUrl = uploaded.url;
      }

      const newMessage = {
        campaignId: assignment.campaignId,
        assignmentId: assignment.id,
        senderId: user.id,
        recipientId: replyTo?.senderId || assignment.secretFriendId,
        text: secretMessage.trim(),
        ...(imageUrl ? { imageUrl } : {}),
        ...(replyTo ? { replyToId: replyTo.id } : {}),
      };

      if (process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
        await createSecretFriendMessage(newMessage);
      } else {
        setMessages((current) => [
          {
            ...newMessage,
            id: `local-${Date.now()}`,
            read: false,
            createdAt: new Date().toISOString(),
          },
          ...current,
        ]);
      }

      setMessageSent(true);
      setTimeout(() => {
        setMessageSent(false);
        setShowMessageModal(false);
        setSecretMessage("");
        setMessageImage(null);
        setReplyTo(null);
      }, 1200);
    } catch (error: unknown) {
      setMessageError(error instanceof Error ? error.message : "Le message n'a pas pu être envoyé.");
    } finally {
      setSending(false);
    }
  };

  const openReply = async (message: SecretFriendMessage) => {
    setReplyTo(message);
    setSecretMessage("");
    setMessageImage(null);
    setMessageError(null);
    setShowMessageModal(true);
    if (!message.read && process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
      await markSecretFriendMessageRead(message.id);
    }
  };

  const activeMessages = messages.filter((message) => message.assignmentId === assignment.id);
  const receivedMessages = activeMessages.filter((message) => message.recipientId === user?.id);

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
            onClick={() => {
              setReplyTo(null);
              setMessageError(null);
              setShowMessageModal(true);
            }}
            className="w-full bg-primary hover:bg-surface-tint text-on-primary font-mono text-sm font-semibold py-3.5 px-6 rounded-xl shadow-md transition-all text-center flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" />
            Écrire anonymement
          </button>
        </div>
      </div>

      {/* Anonymous conversation */}
      <div className="bg-surface rounded-2xl p-gutter card-shadow border border-outline-variant/30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h3 className="font-headline text-xl font-bold text-on-surface flex items-center gap-2">
              <Mail className="w-5 h-5 text-primary" />
              Boîte secrète
            </h3>
            <p className="font-body text-sm text-on-surface-variant mt-1">
              Les messages sont anonymes. Tu peux répondre sans révéler ton identité.
            </p>
          </div>
          {receivedMessages.some((message) => !message.read) && (
            <span className="bg-primary-container/30 text-primary font-mono text-xs font-bold px-3 py-1.5 rounded-full">
              Nouveau message
            </span>
          )}
        </div>

        {activeMessages.length === 0 ? (
          <div className="py-8 text-center bg-surface-container-low rounded-xl border border-dashed border-outline-variant/40">
            <Mail className="w-8 h-8 text-primary/60 mx-auto mb-2" />
            <p className="font-body text-sm text-on-surface-variant">
              Aucun message secret pour le moment.
            </p>
            <p className="font-mono text-xs text-on-surface-variant/80 mt-1">
              Sois le premier à écrire anonymement.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {activeMessages.map((message) => {
              const received = message.recipientId === user?.id;
              return (
                <div
                  key={message.id}
                  className={`rounded-xl border p-4 ${
                    received
                      ? "bg-primary-container/10 border-primary/20"
                      : "bg-surface-container-low border-outline-variant/30"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-primary">
                      {received ? "Message anonyme reçu" : "Message envoyé anonymement"}
                    </span>
                    {received && !message.read && (
                      <span className="font-mono text-[10px] font-bold text-primary">Nouveau</span>
                    )}
                  </div>
                  {message.text && (
                    <p className="font-body text-sm text-on-surface whitespace-pre-wrap">
                      {message.text}
                    </p>
                  )}
                  {message.imageUrl && (
                    <div className="relative mt-3 h-56 w-full overflow-hidden rounded-xl bg-surface-container-high">
                      <Image
                        src={message.imageUrl}
                        alt="Image envoyée anonymement"
                        fill
                        unoptimized
                        className="object-contain"
                      />
                    </div>
                  )}
                  {received && (
                    <button
                      type="button"
                      onClick={() => openReply(message)}
                      className="mt-4 bg-primary text-on-primary font-mono text-xs font-semibold px-4 py-2 rounded-full flex items-center gap-1.5"
                    >
                      <Reply className="w-3.5 h-3.5" />
                      Répondre anonymement
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Action Journal Section */}
      <div className="bg-surface rounded-2xl p-gutter card-shadow border border-outline-variant/30">
        <h3 className="font-headline text-xl font-bold text-on-surface mb-6">
          Journal des actions
        </h3>

        <div className="flex flex-col gap-6 relative before:absolute before:left-5 before:top-3 before:bottom-3 before:w-0.5 before:bg-outline-variant/30">
          {(assignment.actionJournal || []).map((act) => (
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
                {replyTo ? "Répondre anonymement" : "Nouveau message anonyme"}
              </h3>
              <button type="button" onClick={() => setShowMessageModal(false)} className="text-on-surface-variant hover:text-on-surface">
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
                  value={secretMessage}
                  onChange={(e) => setSecretMessage(e.target.value)}
                  placeholder={replyTo ? "Écris ta réponse anonyme..." : "Écris ton message anonyme..."}
                  className="w-full bg-surface-container-low border border-outline-variant/40 rounded-xl p-3 text-on-surface font-body resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                />

                <label className="flex items-center gap-2 border border-dashed border-outline-variant/50 rounded-xl px-4 py-3 text-on-surface-variant hover:border-primary hover:text-primary cursor-pointer transition-colors">
                  <ImagePlus className="w-5 h-5" />
                  <span className="font-mono text-xs truncate">
                    {messageImage ? messageImage.name : "Ajouter une image (facultatif)"}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(event) => setMessageImage(event.target.files?.[0] || null)}
                  />
                </label>

                {messageError && (
                  <p className="font-mono text-xs text-error" role="alert">
                    {messageError}
                  </p>
                )}

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
                    disabled={sending || isUploading || (!secretMessage.trim() && !messageImage)}
                    className="bg-primary text-on-primary font-mono text-xs font-semibold px-6 py-2 rounded-full flex items-center gap-1.5 disabled:opacity-40"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {sending || isUploading ? "Envoi..." : "Envoyer"}
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
