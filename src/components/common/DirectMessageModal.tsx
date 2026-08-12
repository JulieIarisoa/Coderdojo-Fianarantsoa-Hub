"use client";

import Image from "next/image";
import { useState } from "react";
import { CheckCircle, KeyRound, Send } from "lucide-react";
import { UserProfile } from "@/types";
import { Modal } from "./Modal";
import { useAuth } from "@/providers/AuthProvider";
import {
  isMessageEncryptionKeyMismatchError,
  resetMessageEncryptionKey,
} from "@/lib/firebase/messaging";

interface DirectMessageModalProps {
  recipient: UserProfile;
  onClose: () => void;
  onSend: (content: string) => Promise<void>;
}

export function DirectMessageModal({
  recipient,
  onClose,
  onSend,
}: DirectMessageModalProps) {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [recoveringKey, setRecoveringKey] = useState(false);
  const [needsKeyRecovery, setNeedsKeyRecovery] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmedContent = content.trim();
    if (!trimmedContent || submitting) return;

    setSubmitting(true);
    setError("");
    setNotice("");
    setNeedsKeyRecovery(false);
    try {
      await onSend(trimmedContent);
      setSent(true);
      setTimeout(onClose, 1500);
    } catch (sendError) {
      if (isMessageEncryptionKeyMismatchError(sendError)) {
        setNeedsKeyRecovery(true);
        setError(
          "La clé de ce navigateur n'est plus synchronisée avec ton compte. Réinitialise-la pour envoyer de nouveaux messages."
        );
      } else {
        setError(
          sendError instanceof Error
            ? sendError.message
            : "Le message n'a pas pu être envoyé."
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleRecoverKey = async () => {
    if (!user || recoveringKey) return;

    setRecoveringKey(true);
    setError("");
    setNotice("");
    try {
      await resetMessageEncryptionKey(user.id);
      setNeedsKeyRecovery(false);
      setNotice("Clé réinitialisée. Tu peux renvoyer le message.");
    } catch (recoverError) {
      setError(
        recoverError instanceof Error
          ? recoverError.message
          : "La clé n'a pas pu être réinitialisée."
      );
    } finally {
      setRecoveringKey(false);
    }
  };

  return (
    <Modal
      title="Envoyer un message"
      icon={<Send className="w-5 h-5 text-primary" />}
      onClose={onClose}
    >
      <div className="flex items-center gap-3 mb-5 p-3 bg-surface-container-low rounded-xl border border-outline-variant/20">
        <Image src={recipient.avatar} alt={recipient.name} width={40} height={40} className="w-10 h-10 rounded-full object-cover border border-outline-variant/40" />
        <div>
          <span className="font-headline font-bold text-on-surface text-sm block">
            {recipient.name}
          </span>
          <span className="font-mono text-[10px] text-on-surface-variant uppercase">
            {recipient.role}
          </span>
        </div>
      </div>

      {sent ? (
        <div className="py-6 text-center text-primary font-bold flex flex-col items-center gap-2">
          <CheckCircle className="w-8 h-8 text-green-600" />
          Message envoyé à {recipient.name} !
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <textarea
            rows={4}
            required
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder={`Écris ton message pour ${recipient.name}...`}
            className="w-full bg-surface-container-low border border-outline-variant/40 rounded-xl p-3 text-on-surface font-body resize-none focus:outline-none focus:ring-2 focus:ring-primary"
          />
          {error && (
            <p className="font-mono text-xs text-error" role="alert">
              {error}
            </p>
          )}
          {notice && (
            <p className="font-mono text-xs text-primary" role="status">
              {notice}
            </p>
          )}
          {needsKeyRecovery && (
            <button
              type="button"
              onClick={handleRecoverKey}
              disabled={!user || recoveringKey}
              className="self-start bg-primary-container/20 text-primary hover:bg-primary-container/40 font-mono text-xs font-bold px-3 py-2 rounded-lg flex items-center gap-1.5 disabled:opacity-40"
            >
              <KeyRound className="w-3.5 h-3.5" />
              {recoveringKey ? "Réinitialisation..." : "Réinitialiser la clé"}
            </button>
          )}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 font-mono text-xs text-on-surface-variant hover:bg-surface-container rounded-full"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={!content.trim() || submitting}
              className="bg-primary text-on-primary font-mono text-xs font-semibold px-6 py-2 rounded-full flex items-center gap-1.5 disabled:opacity-40"
            >
              <Send className="w-3.5 h-3.5" />
              {submitting ? "Envoi..." : "Envoyer"}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
