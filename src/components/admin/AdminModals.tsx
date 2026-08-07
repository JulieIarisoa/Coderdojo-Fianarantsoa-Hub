"use client";

import Image from "next/image";
import type { FormEvent } from "react";
import {
  Check,
  CheckCircle,
  Edit3,
  Gift,
  HelpCircle,
  Save,
  Send,
  ShieldAlert,
  Users,
} from "lucide-react";
import { CampfirePost, UserProfile } from "@/types";
import { Modal } from "@/components/common/Modal";

interface QuestionModalProps {
  open: boolean;
  success: boolean;
  value: string;
  onChange: (value: string) => void;
  onClose: () => void;
  onSubmit: (event: FormEvent) => void;
}

export function AdminQuestionModal({
  open,
  success,
  value,
  onChange,
  onClose,
  onSubmit,
}: QuestionModalProps) {
  if (!open) return null;

  return (
    <Modal
      title="Nouvelle question du jour"
      icon={<HelpCircle className="w-5 h-5 text-primary" />}
      onClose={onClose}
    >
      {success ? (
        <SuccessMessage>Question enregistrée avec succès !</SuccessMessage>
      ) : (
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <textarea
            rows={3}
            required
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder="Ex: Quel est ton projet Scratch préféré à montrer aux élèves ?"
            className={inputClassName}
          />
          <ModalActions onClose={onClose} submitLabel="Publier sur le Dashboard" />
        </form>
      )}
    </Modal>
  );
}

interface SecretFriendModalProps {
  open: boolean;
  success: boolean;
  error?: string | null;
  title: string;
  description: string;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onClose: () => void;
  onSubmit: (event: FormEvent) => void;
}

export function AdminSecretFriendModal({
  open,
  success,
  error,
  title,
  description,
  onTitleChange,
  onDescriptionChange,
  onClose,
  onSubmit,
}: SecretFriendModalProps) {
  if (!open) return null;

  return (
    <Modal
      title="Campagne Secret Friend"
      icon={<Gift className="w-5 h-5 text-primary" />}
      onClose={onClose}
    >
      {success ? (
        <SuccessMessage>Campagne et binômes générés avec succès !</SuccessMessage>
      ) : (
        <>
          {error && (
            <p className="font-mono text-xs text-error" role="alert">
              {error}
            </p>
          )}
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <Field label="Titre de la mission">
            <input
              type="text"
              required
              value={title}
              onChange={(event) => onTitleChange(event.target.value)}
              placeholder="Ex: Mission de la semaine"
              className={inputClassName}
            />
          </Field>
          <Field label="Description de la mission">
            <textarea
              rows={2}
              required
              value={description}
              onChange={(event) => onDescriptionChange(event.target.value)}
              placeholder="Ex: Offrir un café virtuel ou un mot d'encouragement anonyme"
              className={inputClassName}
            />
          </Field>
          <ModalActions onClose={onClose} submitLabel="Lancer le tirage au sort" />
          </form>
        </>
      )}
    </Modal>
  );
}

interface GuessWhoModalProps {
  open: boolean;
  success: boolean;
  clue: string;
  selectedMentorId: string;
  mentors: UserProfile[];
  onClueChange: (value: string) => void;
  onMentorChange: (value: string) => void;
  onClose: () => void;
  onSubmit: (event: FormEvent) => void;
}

export function AdminGuessWhoModal({
  open,
  success,
  clue,
  selectedMentorId,
  mentors,
  onClueChange,
  onMentorChange,
  onClose,
  onSubmit,
}: GuessWhoModalProps) {
  if (!open) return null;

  return (
    <Modal
      title={'Créer une devinette "Qui suis-je ?"'}
      icon={<HelpCircle className="w-5 h-5 text-primary" />}
      onClose={onClose}
    >
      {success ? (
        <SuccessMessage>Devinette enregistrée avec succès !</SuccessMessage>
      ) : (
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <Field label="Indice / Anecdote">
            <input
              type="text"
              required
              value={clue}
              onChange={(event) => onClueChange(event.target.value)}
              placeholder="Ex: J'ai appris le C++ en fabriquant un robot à 12 ans"
              className={inputClassName}
            />
          </Field>
          <Field label="Mentor mystère à deviner">
            <select
              value={selectedMentorId}
              onChange={(event) => onMentorChange(event.target.value)}
              required
              className={inputClassName}
            >
              <option value="">-- Choisir un mentor --</option>
              {mentors.map((mentor) => (
                <option key={mentor.id} value={mentor.id}>
                  {mentor.name} ({mentor.role})
                </option>
              ))}
            </select>
          </Field>
          <ModalActions onClose={onClose} submitLabel="Créer le jeu" />
        </form>
      )}
    </Modal>
  );
}

interface ModerationModalProps {
  open: boolean;
  posts: CampfirePost[];
  notice: string | null;
  onClose: () => void;
  onDelete: (postId: string) => void;
}

export function AdminModerationModal({
  open,
  posts,
  notice,
  onClose,
  onDelete,
}: ModerationModalProps) {
  if (!open) return null;

  return (
    <Modal
      title="File de Modération Campfire"
      icon={<ShieldAlert className="w-5 h-5 text-error" />}
      onClose={onClose}
      maxWidth="max-w-2xl"
    >
      {notice && (
        <div className="mb-4 p-3 bg-primary-container/20 text-primary font-mono text-xs rounded-xl flex items-center gap-2">
          <Check className="w-4 h-4" />
          {notice}
        </div>
      )}

      <div className="overflow-y-auto max-h-[60vh] flex flex-col gap-4 pr-1">
        {posts.length === 0 ? (
          <p className="text-center py-8 font-body text-sm text-on-surface-variant">
            Aucun message à modérer pour l&apos;instant.
          </p>
        ) : (
          posts.map((post) => (
            <div
              key={post.id}
              className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/30 flex justify-between items-start gap-4"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-headline font-bold text-xs text-on-surface">
                    {post.authorName}
                  </span>
                  <span className="font-mono text-[10px] text-on-surface-variant uppercase bg-primary-container/20 px-2 py-0.5 rounded-full">
                    {post.category}
                  </span>
                </div>
                <p className="font-body text-sm text-on-surface line-clamp-2">
                  {post.content}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onDelete(post.id)}
                className="bg-error/10 text-error hover:bg-error/20 p-2 rounded-lg transition-colors flex items-center gap-1 font-mono text-xs shrink-0"
              >
                <ShieldAlert className="w-4 h-4" />
                Supprimer
              </button>
            </div>
          ))
        )}
      </div>
    </Modal>
  );
}

export interface MentorStatsForm {
  workshopsCount: number;
  projectsCount: number;
  xp: number;
  level: number;
}

interface MentorManagementModalProps {
  open: boolean;
  mentors: UserProfile[];
  editingMentor: UserProfile | null;
  editForm: MentorStatsForm;
  successName: string | null;
  onClose: () => void;
  onEdit: (mentor: UserProfile) => void;
  onClearEditing: () => void;
  onFormChange: (field: keyof MentorStatsForm, value: number) => void;
  onSave: () => void;
}

export function AdminMentorManagementModal({
  open,
  mentors,
  editingMentor,
  editForm,
  successName,
  onClose,
  onEdit,
  onClearEditing,
  onFormChange,
  onSave,
}: MentorManagementModalProps) {
  if (!open) return null;

  return (
    <Modal
      title="Gestion des Statistiques Mentors"
      icon={<Users className="w-5 h-5 text-primary" />}
      onClose={onClose}
      maxWidth="max-w-2xl"
    >
      {successName && (
        <div className="mb-4 p-3 bg-green-100 text-green-800 font-mono text-xs rounded-xl flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          Statistiques de {successName} mises à jour avec succès !
        </div>
      )}

      {editingMentor ? (
        <div className="flex flex-col gap-5">
          <div className="flex items-center gap-3 pb-4 border-b border-outline-variant/20">
            <Image src={editingMentor.avatar} alt={editingMentor.name} width={48} height={48} className="w-12 h-12 rounded-full object-cover border-2 border-primary/20" />
            <div>
              <h4 className="font-headline font-bold text-on-surface">
                {editingMentor.name}
              </h4>
              <span className="font-mono text-xs text-on-surface-variant">
                {editingMentor.role}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <NumberField
              label="Ateliers animés"
              value={editForm.workshopsCount}
              onChange={(value) => onFormChange("workshopsCount", value)}
            />
            <NumberField
              label="Projets réalisés"
              value={editForm.projectsCount}
              onChange={(value) => onFormChange("projectsCount", value)}
            />
            <NumberField
              label="XP Total"
              value={editForm.xp}
              onChange={(value) => onFormChange("xp", value)}
            />
            <NumberField
              label="Niveau"
              value={editForm.level}
              min={1}
              max={99}
              onChange={(value) => onFormChange("level", value)}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClearEditing}
              className="px-4 py-2 font-mono text-xs text-on-surface-variant hover:bg-surface-container rounded-full"
            >
              ← Retour à la liste
            </button>
            <button
              type="button"
              onClick={onSave}
              className="bg-primary text-on-primary font-mono text-xs font-semibold px-6 py-2 rounded-full flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              Enregistrer
            </button>
          </div>
        </div>
      ) : (
        <div className="overflow-y-auto max-h-[60vh] flex flex-col gap-3 pr-1">
          {mentors.length === 0 ? (
            <p className="text-center py-8 font-body text-sm text-on-surface-variant">
              Aucun mentor enregistré.
            </p>
          ) : (
            mentors.map((mentor) => (
              <div
                key={mentor.id}
                className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/30 flex justify-between items-center gap-4"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Image src={mentor.avatar} alt={mentor.name} width={40} height={40} className="w-10 h-10 rounded-full object-cover border-2 border-primary/20 shrink-0" />
                  <div className="min-w-0">
                    <h4 className="font-headline font-bold text-sm text-on-surface truncate">
                      {mentor.name}
                    </h4>
                    <div className="flex items-center gap-3 font-mono text-[10px] text-on-surface-variant mt-0.5">
                      <span>{mentor.workshopsCount || 0} ateliers</span>
                      <span>•</span>
                      <span>{mentor.projectsCount || mentor.studentsCount || 0} projets</span>
                      <span>•</span>
                      <span>{mentor.xp} XP</span>
                      <span>•</span>
                      <span>Niv. {mentor.level}</span>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onEdit(mentor)}
                  className="bg-primary/10 text-primary hover:bg-primary/20 p-2 rounded-lg transition-colors flex items-center gap-1.5 font-mono text-xs shrink-0"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Modifier
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </Modal>
  );
}

export interface UserValidationModalProps {
  open: boolean;
  mentors: UserProfile[];
  onClose: () => void;
  onUpdateStatus: (userId: string, status: "APPROVED" | "PENDING" | "REJECTED") => void;
}

export function AdminUserValidationModal({
  open,
  mentors,
  onClose,
  onUpdateStatus,
}: UserValidationModalProps) {
  if (!open) return null;

  const pendingUsers = mentors.filter((m) => m.status === "PENDING");
  const approvedUsers = mentors.filter((m) => !m.status || m.status === "APPROVED");
  const rejectedUsers = mentors.filter((m) => m.status === "REJECTED");

  return (
    <Modal
      title="Validation des Inscriptions Mentors"
      icon={<Users className="w-5 h-5 text-primary" />}
      onClose={onClose}
      maxWidth="max-w-3xl"
    >
      <div className="flex flex-col gap-6">
        {/* Pending Requests Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-headline font-bold text-base text-on-surface flex items-center gap-2">
              <span>Demandes en attente</span>
              <span className="bg-amber-100 text-amber-800 font-mono text-xs px-2.5 py-0.5 rounded-full">
                {pendingUsers.length}
              </span>
            </h4>
            <span className="font-mono text-xs text-on-surface-variant">
              Validation requise pour l&apos;accès au Clubhouse
            </span>
          </div>

          <div className="overflow-y-auto max-h-60 flex flex-col gap-3 pr-1">
            {pendingUsers.length === 0 ? (
              <div className="p-6 bg-surface-container-low rounded-xl border border-outline-variant/30 text-center font-body text-sm text-on-surface-variant">
                ✨ Aucune demande d&apos;inscription en attente.
              </div>
            ) : (
              pendingUsers.map((user) => (
                <div
                  key={user.id}
                  className="bg-surface-container-low p-4 rounded-2xl border border-amber-200/60 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Image
                      src={user.avatar}
                      alt={user.name}
                      width={44}
                      height={44}
                      className="w-11 h-11 rounded-full object-cover border-2 border-amber-300 shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h5 className="font-headline font-bold text-sm text-on-surface truncate">
                          {user.name}
                        </h5>
                        <span className="bg-amber-100 text-amber-800 font-mono text-[10px] font-bold px-2 py-0.5 rounded-full">
                          En attente
                        </span>
                      </div>
                      <p className="font-mono text-xs text-on-surface-variant truncate">
                        {user.email}
                      </p>
                      <p className="font-body text-xs text-on-surface-variant/80 line-clamp-1 mt-0.5">
                        {user.bio || "Aucune biographie"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
                    <button
                      type="button"
                      onClick={() => onUpdateStatus(user.id, "REJECTED")}
                      className="bg-error/10 hover:bg-error/20 text-error font-mono text-xs font-semibold px-3 py-2 rounded-xl transition-all"
                    >
                      Refuser
                    </button>
                    <button
                      type="button"
                      onClick={() => onUpdateStatus(user.id, "APPROVED")}
                      className="bg-primary hover:bg-surface-tint text-on-primary font-mono text-xs font-bold px-4 py-2 rounded-xl transition-all flex items-center gap-1.5"
                    >
                      <Check className="w-4 h-4" />
                      Autoriser l&apos;accès
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Managed Users Section (Approved & Rejected) */}
        <div>
          <h4 className="font-headline font-bold text-base text-on-surface mb-3">
            Membres existants ({approvedUsers.length} validés, {rejectedUsers.length} refusés)
          </h4>

          <div className="overflow-y-auto max-h-48 flex flex-col gap-2 pr-1">
            {[...approvedUsers, ...rejectedUsers].map((user) => {
              const isApproved = !user.status || user.status === "APPROVED";
              return (
                <div
                  key={user.id}
                  className="bg-surface-container-low p-3 rounded-xl border border-outline-variant/30 flex justify-between items-center gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Image
                      src={user.avatar}
                      alt={user.name}
                      width={36}
                      height={36}
                      className="w-9 h-9 rounded-full object-cover border border-outline-variant/40 shrink-0"
                    />
                    <div className="min-w-0">
                      <span className="font-headline font-bold text-xs text-on-surface truncate block">
                        {user.name} ({user.role})
                      </span>
                      <span className="font-mono text-[10px] text-on-surface-variant truncate block">
                        {user.email}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isApproved
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {isApproved ? "Accès validé" : "Accès révoqué"}
                    </span>
                    {isApproved ? (
                      <button
                        type="button"
                        onClick={() => onUpdateStatus(user.id, "REJECTED")}
                        className="text-error hover:underline font-mono text-[11px]"
                      >
                        Révoquer
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onUpdateStatus(user.id, "APPROVED")}
                        className="text-primary hover:underline font-mono text-[11px]"
                      >
                        Réautoriser
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Modal>
  );
}

const inputClassName =
  "w-full bg-surface-container-low border border-outline-variant/40 rounded-xl p-3 text-on-surface font-body focus:outline-none focus:ring-2 focus:ring-primary";

function SuccessMessage({ children }: { children: string }) {
  return (
    <div className="py-6 text-center text-primary font-bold flex flex-col items-center gap-2">
      <CheckCircle className="w-8 h-8 text-green-600" />
      {children}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block font-mono text-xs uppercase text-on-surface mb-1 font-semibold">
        {label}
      </label>
      {children}
    </div>
  );
}

function NumberField({
  label,
  value,
  min = 0,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
}) {
  return (
    <Field label={label}>
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(event) => onChange(parseInt(event.target.value, 10) || 0)}
        className={`${inputClassName} font-mono`}
      />
    </Field>
  );
}

function ModalActions({
  onClose,
  submitLabel,
}: {
  onClose: () => void;
  submitLabel: string;
}) {
  return (
    <div className="flex justify-end gap-3 mt-2">
      <button
        type="button"
        onClick={onClose}
        className="px-4 py-2 font-mono text-xs text-on-surface-variant hover:bg-surface-container rounded-full"
      >
        Annuler
      </button>
      <button
        type="submit"
        className="bg-primary text-on-primary font-mono text-xs font-semibold px-6 py-2 rounded-full flex items-center gap-1.5"
      >
        <Send className="w-3.5 h-3.5" />
        {submitLabel}
      </button>
    </div>
  );
}
