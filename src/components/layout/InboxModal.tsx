"use client";

import Image from "next/image";
import { useState, useEffect, useRef, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "@/providers/AuthProvider";
import { subscribeToReceivedMessages, sendDirectMessage, DirectMessage, markMessageAsRead } from "@/lib/firebase/messaging";
import { Mail, X, Send, CheckCircle, Clock } from "lucide-react";

export function InboxModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { user } = useAuth();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [replyTarget, setReplyTarget] = useState<DirectMessage | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [replySent, setReplySent] = useState(false);
  const readInProgress = useRef<Set<string>>(new Set());

  const markAsRead = async (messageId: string) => {
    if (readInProgress.current.has(messageId)) return;
    readInProgress.current.add(messageId);
    try {
      await markMessageAsRead(messageId);
    } finally {
      readInProgress.current.delete(messageId);
    }
  };

  useEffect(() => {
    if (!isOpen || !user || !process.env.NEXT_PUBLIC_FIREBASE_API_KEY) return;

    const unsub = subscribeToReceivedMessages(user.id, (msgs) => {
      setMessages(msgs);
    });

    return () => unsub();
  }, [isOpen, user]);

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim() || !replyTarget || !user) return;

    if (process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
      await sendDirectMessage({
        fromId: user.id,
        fromName: user.name,
        fromAvatar: user.avatar,
        toId: replyTarget.fromId,
        toName: replyTarget.fromName,
        content: replyContent,
      });
    }

    setReplySent(true);
    setTimeout(() => {
      setReplySent(false);
      setReplyTarget(null);
      setReplyContent("");
    }, 1500);
  };

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-surface rounded-2xl p-6 md:p-8 max-w-lg w-full shadow-2xl border border-outline-variant/40 max-h-[85vh] flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-headline text-lg font-bold text-on-surface flex items-center gap-2">
            <Mail className="w-5 h-5 text-primary" />
            Boîte de réception (Messages reçus)
          </h3>
          <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface">
            <X className="w-5 h-5" />
          </button>
        </div>

        {replyTarget ? (
          <div className="flex flex-col gap-4">
            <div className="p-3 bg-surface-container-low rounded-xl border border-outline-variant/20">
              <span className="font-mono text-xs text-on-surface-variant block mb-1">En réponse à {replyTarget.fromName} :</span>
              <p className="font-body text-xs text-on-surface italic">&quot;{replyTarget.content}&quot;</p>
            </div>

            {replySent ? (
              <div className="py-6 text-center text-primary font-bold flex flex-col items-center gap-2">
                <CheckCircle className="w-8 h-8 text-green-600" />
                Réponse envoyée !
              </div>
            ) : (
              <form onSubmit={handleSendReply} className="flex flex-col gap-4">
                <textarea
                  rows={4}
                  required
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder={`Répondre à ${replyTarget.fromName}...`}
                  className="w-full bg-surface-container-low border border-outline-variant/40 rounded-xl p-3 text-on-surface font-body resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                />

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setReplyTarget(null)}
                    className="px-4 py-2 font-mono text-xs text-on-surface-variant hover:bg-surface-container rounded-full"
                  >
                    Retour
                  </button>
                  <button
                    type="submit"
                    className="bg-primary text-on-primary font-mono text-xs font-semibold px-6 py-2 rounded-full flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Envoyer la réponse
                  </button>
                </div>
              </form>
            )}
          </div>
        ) : (
          <div className="overflow-y-auto flex-1 flex flex-col gap-3 pr-1">
            {messages.length === 0 ? (
              <div className="py-12 text-center text-on-surface-variant font-body text-sm">
                <Mail className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p>Aucun message reçu pour l&apos;instant.</p>
                <p className="font-mono text-xs mt-1">Les messages envoyés par d&apos;autres mentors apparaîtront ici.</p>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  onClick={() => markAsRead(msg.id)}
                  className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/30 flex flex-col gap-2 cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Image src={msg.fromAvatar} alt={msg.fromName} width={32} height={32} className="w-8 h-8 rounded-full object-cover border border-outline-variant/40" />
                      <span className="font-headline font-bold text-xs text-on-surface">{msg.fromName}</span>
                    </div>
                    <span className="font-mono text-[10px] text-on-surface-variant flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Reçu
                    </span>
                  </div>
                  <p className="font-body text-sm text-on-surface">{msg.content}</p>

                  <div className="flex justify-end pt-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); void markAsRead(msg.id); setReplyTarget(msg); }}
                        className="bg-primary-container/20 text-primary hover:bg-primary-container/40 font-mono text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1"
                      >
                      <Send className="w-3.5 h-3.5" />
                      Répondre
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        <div className="pt-4 border-t border-outline-variant/20 flex justify-end mt-auto">
          <button
            onClick={onClose}
            className="bg-surface-container-high text-on-surface font-mono text-xs font-semibold px-6 py-2 rounded-full"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
