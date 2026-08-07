"use client";

import Image from "next/image";
import { useAuth } from "@/providers/AuthProvider";
import { MOCK_BADGES, MOCK_MILESTONES } from "@/lib/mockData";
import { useFirestoreSubscription } from "@/hooks/useFirestoreSubscription";
import { subscribeToBadges, subscribeToMilestones } from "@/lib/firebase/gamification";
import {
  Award,
  Star,
  Heart,
  Camera,
  Handshake,
  Lightbulb,
  Trophy,
  GraduationCap,
  Zap,
  CheckCircle,
  Clock,
} from "lucide-react";

const BADGE_ICON_MAP: Record<string, React.ReactNode> = {
  favorite: <Heart className="w-10 h-10" />,
  photo_camera: <Camera className="w-10 h-10" />,
  handshake: <Handshake className="w-10 h-10" />,
  lightbulb: <Lightbulb className="w-10 h-10" />,
};

const MILESTONE_ICON_MAP: Record<string, React.ReactNode> = {
  workspace_premium: <Award className="w-6 h-6" />,
  school: <GraduationCap className="w-6 h-6" />,
};

export default function BadgesPage() {
  const { user } = useAuth();
  const firebaseEnabled = Boolean(process.env.NEXT_PUBLIC_FIREBASE_API_KEY);
  const { data: badges, loading: badgesLoading, error: badgesError } = useFirestoreSubscription(subscribeToBadges, MOCK_BADGES, firebaseEnabled);
  const { data: milestones, loading: milestonesLoading, error: milestonesError } = useFirestoreSubscription(subscribeToMilestones, MOCK_MILESTONES, firebaseEnabled);

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div>
        <h1 className="font-headline text-3xl md:text-4xl font-extrabold text-on-surface flex items-center gap-2">
          <Award className="w-8 h-8 text-primary" />
          Badges & Gamification
        </h1>
        <p className="font-body text-on-surface-variant text-base mt-1">
          Suis ta progression et célèbre tes accomplissements de mentor.
        </p>
      </div>

      {(badgesLoading || milestonesLoading) && (
        <p className="font-mono text-xs text-primary" role="status">Chargement de la progression...</p>
      )}
      {Boolean(badgesError || milestonesError) && (
        <p className="font-mono text-xs text-error" role="alert">La progression distante est indisponible. Les données locales sont affichées.</p>
      )}

      {/* Main Profile XP Card */}
      <div className="bg-surface rounded-2xl p-6 sm:p-8 card-shadow border border-outline-variant/30 flex flex-col md:flex-row items-center gap-6 sm:gap-8 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-primary-container/10 rounded-full blur-3xl pointer-events-none" />

        {/* Avatar with Level Badge */}
        <div className="relative shrink-0">
          <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full p-1 border-4 border-primary">
            <Image src={user?.avatar || "/logo.jpg"} alt={user?.name || "Avatar"} width={128} height={128} className="w-full h-full rounded-full object-cover" />
          </div>
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-surface text-primary font-mono text-xs font-bold px-3 py-1 rounded-full border border-primary shadow-sm flex items-center gap-1">
            <Star className="w-3.5 h-3.5" />
            Niv {user?.level || 8}
          </div>
        </div>

        {/* Level Details & Progress */}
        <div className="flex-1 w-full text-center md:text-left">
          <h2 className="font-headline text-2xl font-bold text-on-surface">
            Mentor Sénior
          </h2>
          <p className="font-body text-on-surface-variant text-sm mt-0.5 mb-4">
            Top 5% des mentors actifs cette saison.
          </p>

          {/* XP Bar */}
          <div>
            <div className="flex justify-between items-center font-mono text-xs mb-1.5">
              <span className="font-semibold text-on-surface">Progression XP</span>
              <span className="bg-primary-container/20 text-primary font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <Zap className="w-3 h-3" />
                {user?.xp || 8450} / 10 000 XP
              </span>
            </div>

            <div className="h-3 w-full bg-surface-container-high rounded-full overflow-hidden mb-2">
              <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${((user?.xp || 8450) / 10000) * 100}%` }} />
            </div>

            <span className="font-mono text-xs text-on-surface-variant block text-right">
              {10000 - (user?.xp || 8450)} XP pour le niveau {(user?.level || 8) + 1}
            </span>
          </div>
        </div>
      </div>

      {/* Badge Collection Section */}
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-headline text-xl font-bold text-on-surface">
            Collection de badges
          </h2>
          <button className="font-mono text-xs font-semibold text-primary hover:underline">
            Voir tout
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {badges.map((b) => (
            <div
              key={b.id}
              className="bg-surface rounded-2xl p-6 card-shadow border border-outline-variant/30 flex flex-col items-center text-center group hover:-translate-y-1 transition-all"
            >
              <div className="w-20 h-20 rounded-full bg-surface-container-low border-2 border-primary/20 flex items-center justify-center text-primary mb-4 group-hover:scale-110 group-hover:border-primary transition-all">
                {BADGE_ICON_MAP[b.icon] || <Trophy className="w-10 h-10" />}
              </div>
              <h3 className="font-headline font-bold text-on-surface text-base mb-1">
                {b.name}
              </h3>
              <p className="font-mono text-xs text-on-surface-variant">
                {b.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Milestones Section */}
      <div>
        <h2 className="font-headline text-xl font-bold text-on-surface mb-6">
          Étapes récentes
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {milestones.map((m) => (
            <div
              key={m.id}
              className={`rounded-2xl p-6 border flex gap-4 ${
                m.completed
                  ? "bg-surface-container-low border-outline-variant/30"
                  : "bg-surface border-outline-variant/30"
              }`}
            >
              <div className="w-12 h-12 rounded-full bg-primary-container/20 text-primary flex items-center justify-center shrink-0">
                {MILESTONE_ICON_MAP[m.icon] || <Trophy className="w-6 h-6" />}
              </div>

              <div className="flex-1">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-headline font-bold text-on-surface text-base">
                    {m.title}
                  </h3>
                  {!m.completed && (
                    <span className="font-mono text-xs text-primary font-bold flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      En cours
                    </span>
                  )}
                </div>

                <p className="font-body text-sm text-on-surface-variant mb-4">
                  {m.description}
                </p>

                {m.completed ? (
                  <div className="flex items-center gap-3 font-mono text-xs flex-wrap">
                    <span className="bg-primary-container/30 text-primary font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                      <Zap className="w-3 h-3" />
                      +{m.xpAwarded} XP
                    </span>
                    <span className="text-on-surface-variant flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" />
                      Complété le {m.completedDate}
                    </span>
                  </div>
                ) : (
                  <div>
                    <div className="flex justify-between font-mono text-xs text-on-surface-variant mb-1">
                      <span>
                        {m.progress} / {m.maxProgress} Ninjas
                      </span>
                      <span>
                        {Math.round(((m.progress || 0) / (m.maxProgress || 1)) * 100)}%
                      </span>
                    </div>
                    <div className="h-2 w-full bg-surface-container-high rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{
                          width: `${((m.progress || 0) / (m.maxProgress || 1)) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
