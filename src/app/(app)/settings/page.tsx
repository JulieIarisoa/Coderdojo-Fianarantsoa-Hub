"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { useImageUpload } from "@/hooks/useImageUpload";
import { updateUserProfile } from "@/lib/firebase/firestore";
import ThemeSelector from "@/components/settings/ThemeSelector";
import type { UserProfile } from "@/types";
import {
  Save,
  LogOut,
  User,
  Mail,
  FileText,
  CloudUpload,
  Upload,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";

export default function SettingsPage() {
  const { user, logout, updateUser } = useAuth();
  const { uploadImage, isUploading, error: uploadError } = useImageUpload();
  const [name, setName] = useState(user?.name || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar || "");

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    try {
      const updates: Partial<UserProfile> = {
        name,
        bio,
        ...(avatarUrl !== user.avatar ? { avatar: avatarUrl } : {}),
      };
      if (process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
        await updateUserProfile(user.id, updates);
      }
      updateUser(updates);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      console.error("Save failed:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const uploaded = await uploadImage(file);
    if (uploaded) setAvatarUrl(uploaded.url);
  };

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-headline text-3xl font-bold text-on-surface">
            Paramètres du profil
          </h1>
          <p className="font-body text-on-surface-variant text-sm mt-1">
            Gère tes informations personnelles et tes préférences.
          </p>
        </div>
        {user?.role === "ADMIN" && (
          <Link
            href="/admin"
            className="bg-primary-container text-on-primary-container hover:bg-primary/10 font-mono text-xs font-bold px-4 py-2 rounded-full transition-all flex items-center gap-2 border border-primary/30 shadow-sm w-fit"
          >
            <ShieldCheck className="w-4 h-4 text-primary" />
            Accéder à l&apos;espace Admin
          </Link>
        )}
      </div>

      <div className="bg-surface rounded-2xl p-6 card-shadow border border-outline-variant/30">
        <form onSubmit={handleSave} className="flex flex-col gap-5">
          {/* Avatar upload */}
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Image src={avatarUrl || user?.avatar || "/logo.jpg"} alt={user?.name || "Avatar"} width={80} height={80} className="w-20 h-20 rounded-full object-cover border-2 border-primary/20" />
            <div className="flex flex-col gap-2">
              <label className="font-mono text-xs uppercase font-semibold text-on-surface flex items-center gap-1.5">
                <CloudUpload className="w-4 h-4" />
                Photo de profil
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="text-xs font-mono text-on-surface bg-surface-container-low border border-outline-variant/40 rounded-xl p-2 file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-on-primary hover:file:bg-surface-tint"
                />
                {uploadError && (
                  <span className="font-mono text-xs text-error" role="alert">{uploadError}</span>
                )}
                {isUploading && (
                  <span className="font-mono text-xs text-primary animate-pulse flex items-center gap-1">
                    <Upload className="w-4 h-4 animate-bounce" />
                  </span>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="font-mono text-xs uppercase font-semibold text-on-surface mb-2 flex items-center gap-1.5">
              <User className="w-4 h-4" />
              Nom complet
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-surface-container-low border border-outline-variant/40 rounded-xl p-3 text-on-surface font-body focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="font-mono text-xs uppercase font-semibold text-on-surface mb-2 flex items-center gap-1.5">
              <FileText className="w-4 h-4" />
              Biographie / Description
            </label>
            <textarea
              rows={4}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full bg-surface-container-low border border-outline-variant/40 rounded-xl p-3 text-on-surface font-body resize-none focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="font-mono text-xs uppercase font-semibold text-on-surface mb-2 flex items-center gap-1.5">
              <Mail className="w-4 h-4" />
              Email
            </label>
            <input
              type="email"
              disabled
              value={user?.email || ""}
              className="w-full bg-surface-container-high border border-outline-variant/20 rounded-xl p-3 text-on-surface-variant font-body cursor-not-allowed opacity-70"
            />
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center pt-4 border-t border-outline-variant/20 gap-4">
            <div className="flex items-center gap-3 flex-wrap">
              <button
                type="button"
                onClick={() => logout()}
                className="text-error font-mono text-xs font-bold hover:underline flex items-center gap-1.5"
              >
                <LogOut className="w-4 h-4" />
                Se déconnecter
              </button>

              {user?.role === "ADMIN" && (
                <Link
                  href="/admin"
                  className="bg-primary-container text-on-primary-container hover:bg-primary/10 font-mono text-xs font-bold px-3.5 py-2 rounded-full transition-all flex items-center gap-1.5 border border-primary/30"
                >
                  <ShieldCheck className="w-4 h-4 text-primary" />
                  Espace Admin
                </Link>
              )}
            </div>

            <button
              type="submit"
              disabled={saving}
              className="bg-primary text-on-primary font-mono text-xs font-semibold px-6 py-3 rounded-full hover:bg-surface-tint transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {saved ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Enregistré !
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {saving ? "Enregistrement..." : "Enregistrer les modifications"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-surface rounded-2xl p-6 card-shadow border border-outline-variant/30">
        <ThemeSelector />
      </div>
    </div>
  );
}
