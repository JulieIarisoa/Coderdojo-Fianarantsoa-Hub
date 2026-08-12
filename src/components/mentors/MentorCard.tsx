"use client";

import Image from "next/image";
import Link from "next/link";
import { Eye, Send, Star } from "lucide-react";
import { UserProfile } from "@/types";

interface MentorCardProps {
  mentor: UserProfile;
  isSelf: boolean;
  onMessage: (mentor: UserProfile) => void;
}

export function MentorCard({ mentor: m, isSelf, onMessage }: MentorCardProps) {
  return (
    <div className="bg-surface rounded-2xl p-6 card-shadow border border-outline-variant/30 flex flex-col justify-between hover:-translate-y-1 transition-all duration-200">
      <div>
        <div className="flex items-center gap-4 mb-6">
          <Image
            src={m.avatar}
            alt={m.name}
            width={64}
            height={64}
            className="w-16 h-16 rounded-full object-cover border-2 border-primary/20"
          />
          <div>
            <h2 className="font-headline text-xl font-bold text-on-surface">{m.name}</h2>
            <p className="font-body text-xs text-on-surface-variant mb-1">
              {m.bio.split(".")[0]}
            </p>
            <span className="inline-flex items-center gap-1 font-mono text-xs text-primary font-bold bg-primary-container/20 px-2.5 py-0.5 rounded-full">
              <Star className="w-3.5 h-3.5" />
              Niveau {m.level}
            </span>
          </div>
        </div>

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

        <div className="mb-6 grid grid-cols-3 gap-2 text-center font-mono text-xs">
          <div className="bg-surface-container-low rounded-lg p-2">
            <span className="font-headline text-lg font-bold text-on-surface block">
              {m.workshopsCount || 0}
            </span>
            <span className="text-on-surface-variant">Ateliers</span>
          </div>
          <div className="bg-surface-container-low rounded-lg p-2">
            <span className="font-headline text-lg font-bold text-on-surface block">
              {m.projectsCount || m.studentsCount || 0}
            </span>
            <span className="text-on-surface-variant">Projets</span>
          </div>
          <div className="bg-surface-container-low rounded-lg p-2">
            <span className="font-headline text-lg font-bold text-on-surface block">{m.xp}</span>
            <span className="text-on-surface-variant">XP</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 pt-4 border-t border-outline-variant/20">
        <Link
          href={`/mentors/${m.id}`}
          className="w-full text-center py-2.5 px-4 border border-primary text-primary font-mono text-xs font-bold rounded-lg hover:bg-surface-container transition-all flex items-center justify-center gap-1.5"
        >
          <Eye className="w-4 h-4" />
          Voir le profil
        </Link>
        <button
          disabled={isSelf}
          onClick={() => onMessage(m)}
          className="w-full flex items-center justify-center gap-1.5 py-2.5 px-4 bg-primary text-on-primary font-mono text-xs font-bold rounded-lg hover:bg-surface-tint transition-all disabled:opacity-50 disabled:bg-surface-container-high disabled:text-on-surface-variant disabled:cursor-not-allowed"
        >
          <Send className="w-4 h-4" />
          {isSelf ? "Mon profil" : "Message"}
        </button>
      </div>
    </div>
  );
}
