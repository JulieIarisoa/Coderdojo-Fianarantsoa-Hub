"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/providers/AuthProvider";
import { MOCK_MENTORS } from "@/lib/mockData";
import { UserProfile } from "@/types";
import { subscribeToAllMentors } from "@/lib/firebase/firestore";
import { sendDirectMessage } from "@/lib/firebase/messaging";
import { DirectMessageModal } from "@/components/common/DirectMessageModal";
import {
  Search,
  Star,
  Send,
  Eye,
} from "lucide-react";

export default function MentorsPage() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSkill, setSelectedSkill] = useState("");
  const [allMentors, setAllMentors] = useState<UserProfile[]>(MOCK_MENTORS);

  // Message modal state
  const [messageTarget, setMessageTarget] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) return;

    const unsub = subscribeToAllMentors((firestoreMentors) => {
      setAllMentors(firestoreMentors);
    });

    return () => unsub();
  }, []);

  const mentors = allMentors.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.bio.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSkill = selectedSkill
      ? m.skills.includes(selectedSkill)
      : true;
    return matchesSearch && matchesSkill;
  });

  const allSkills = Array.from(
    new Set(allMentors.flatMap((m) => m.skills))
  );

  const handleSendMessage = async (content: string) => {
    if (!messageTarget || !user) return;

    if (process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
      await sendDirectMessage({
        fromId: user.id,
        fromName: user.name,
        fromAvatar: user.avatar,
        toId: messageTarget.id,
        toName: messageTarget.name,
        content,
      });
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header & Search Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="font-headline text-3xl md:text-4xl font-extrabold text-on-surface">
            Répertoire des Mentors
          </h1>
          <p className="font-body text-on-surface-variant text-base mt-1">
            Connectez-vous, collaborez et apprenez des meilleurs du Coderdojo Hub.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Search Box */}
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-outline-variant w-5 h-5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Chercher un mentor..."
              className="w-full pl-10 pr-4 py-2.5 bg-surface-bright border border-outline-variant/40 rounded-full font-body text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Skill Filter Dropdown */}
          <select
            value={selectedSkill}
            onChange={(e) => setSelectedSkill(e.target.value)}
            className="bg-surface-bright border border-outline-variant/40 rounded-full px-4 py-2.5 font-mono text-xs font-semibold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Tous les skills</option>
            {allSkills.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Mentors Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mentors.map((m) => (
          <div
            key={m.id}
            className="bg-surface rounded-2xl p-6 card-shadow border border-outline-variant/30 flex flex-col justify-between hover:-translate-y-1 transition-all duration-200"
          >
            <div>
              {/* Header Info */}
              <div className="flex items-center gap-4 mb-6">
                <Image src={m.avatar} alt={m.name} width={64} height={64} className="w-16 h-16 rounded-full object-cover border-2 border-primary/20" />
                <div>
                  <h2 className="font-headline text-xl font-bold text-on-surface">
                    {m.name}
                  </h2>
                  <p className="font-body text-xs text-on-surface-variant mb-1">
                    {m.bio.split(".")[0]}
                  </p>
                  <span className="inline-flex items-center gap-1 font-mono text-xs text-primary font-bold bg-primary-container/20 px-2.5 py-0.5 rounded-full">
                    <Star className="w-3.5 h-3.5" />
                    Niveau {m.level}
                  </span>
                </div>
              </div>

              {/* Skills Section */}
              <div className="mb-6">
                <span className="font-mono text-xs uppercase tracking-wider text-on-surface-variant font-semibold block mb-2">
                  Compétences
                </span>
                <div className="flex flex-wrap gap-2">
                  {m.skills.map((s) => (
                    <span
                      key={s}
                      className="bg-surface-container-high text-on-surface font-mono text-xs px-3 py-1 rounded-full"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              {/* Stats */}
              <div className="mb-6 grid grid-cols-3 gap-2 text-center font-mono text-xs">
                <div className="bg-surface-container-low rounded-lg p-2">
                  <span className="font-headline text-lg font-bold text-on-surface block">{m.workshopsCount || 0}</span>
                  <span className="text-on-surface-variant">Ateliers</span>
                </div>
                <div className="bg-surface-container-low rounded-lg p-2">
                  <span className="font-headline text-lg font-bold text-on-surface block">{m.projectsCount || m.studentsCount || 0}</span>
                  <span className="text-on-surface-variant">Projets</span>
                </div>
                <div className="bg-surface-container-low rounded-lg p-2">
                  <span className="font-headline text-lg font-bold text-on-surface block">{m.xp}</span>
                  <span className="text-on-surface-variant">XP</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-outline-variant/20">
              <Link
                href={`/mentors/${m.id}`}
                className="w-full text-center py-2.5 px-4 border border-primary text-primary font-mono text-xs font-bold rounded-lg hover:bg-surface-container transition-all flex items-center justify-center gap-1.5"
              >
                <Eye className="w-4 h-4" />
                Voir le profil
              </Link>
              <button
                disabled={m.id === user?.id}
                onClick={() => setMessageTarget(m)}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 px-4 bg-primary text-on-primary font-mono text-xs font-bold rounded-lg hover:bg-surface-tint transition-all disabled:opacity-50 disabled:bg-surface-container-high disabled:text-on-surface-variant disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
                {m.id === user?.id ? "Mon profil" : "Message"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {mentors.length === 0 && (
        <div className="text-center py-12 text-on-surface-variant">
          <Search className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-body text-lg">Aucun mentor trouvé</p>
          <p className="font-mono text-xs mt-1">Essayez un autre terme de recherche</p>
        </div>
      )}
      {/* Message Modal */}
      {messageTarget && (
        <DirectMessageModal
          recipient={messageTarget}
          onClose={() => setMessageTarget(null)}
          onSend={handleSendMessage}
        />
      )}
    </div>
  );
}
