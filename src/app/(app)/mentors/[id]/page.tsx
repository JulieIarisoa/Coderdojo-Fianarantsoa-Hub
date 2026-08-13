"use client";

import Image from "next/image";
import { use, useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/providers/AuthProvider";
import { MOCK_MENTORS } from "@/lib/mockData";
import { UserProfile } from "@/types";
import { getMentorById } from "@/lib/firebase/firestore";
import { sendDirectMessage } from "@/lib/firebase/messaging";
import { DirectMessageModal } from "@/components/common/DirectMessageModal";
import {
  ArrowLeft,
  Send,
  UserPlus,
  UserCheck,
  GraduationCap,
  UsersRound,
  Trophy,
  BookImage,
  CheckCircle,
  Clock,
  HeartHandshake,
  Bug,
  Flame,
  Lock,
  Loader2,
} from "lucide-react";

export default function MentorProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useAuth();
  const [mentor, setMentor] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);

  // Message modal state
  const [showMessageModal, setShowMessageModal] = useState(false);

  useEffect(() => {
    async function loadMentor() {
      if (process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
        const profile = await getMentorById(id);
        if (profile) {
          setMentor(profile);
        } else {
          setMentor(MOCK_MENTORS.find((m) => m.id === id) || MOCK_MENTORS[3]);
        }
      } else {
        setMentor(MOCK_MENTORS.find((m) => m.id === id) || MOCK_MENTORS[3]);
      }
      setLoading(false);
    }
    loadMentor();
  }, [id]);

  const handleSendMessage = async (content: string) => {
    if (!content.trim() || !mentor || !user) return;

    if (process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
      await sendDirectMessage({
        fromId: user.id,
        fromName: user.name,
        fromAvatar: user.avatar,
        toId: mentor.id,
        toName: mentor.name,
        content,
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!mentor) {
    return (
      <div className="text-center py-12">
        <p className="font-headline text-xl text-on-surface-variant">Mentor introuvable</p>
        <Link href="/mentors" className="text-primary font-mono text-sm hover:underline mt-2 inline-block">
          Retour à l&apos;annuaire
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Top Back Navigation */}
      <div>
        <Link
          href="/mentors"
          className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold text-primary hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour à l&apos;annuaire
        </Link>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Profile Card */}
        <div className="flex flex-col gap-6">
          <div className="bg-surface rounded-2xl p-6 card-shadow border border-outline-variant/30 flex flex-col items-center text-center">
            {/* Header Banner Background */}
            <div className="w-full h-24 rounded-xl bg-gradient-to-r from-primary-container/30 to-surface-tint/20 mb-[-48px]" />

            {/* Avatar with Verified Badge */}
            <div className="relative mb-4">
              <Image src={mentor.avatar} alt={mentor.name} width={96} height={96} className="w-24 h-24 rounded-full object-cover border-4 border-surface shadow-md" />
              <div className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-primary text-on-primary flex items-center justify-center">
                <CheckCircle className="w-4 h-4" />
              </div>
            </div>

            <h1 className="font-headline text-2xl font-bold text-on-surface mb-1">
              {mentor.name}
            </h1>
            <p className="font-body text-sm text-on-surface-variant max-w-xs mb-4">
              {mentor.bio}
            </p>

            <div className="flex items-center gap-2 mb-6 flex-wrap justify-center">
              <span className="bg-primary-container/20 text-primary font-mono text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                Niveau {mentor.level} Mentor
              </span>
              <span className="bg-surface-container-high text-on-surface font-mono text-xs font-semibold px-3 py-1 rounded-full">
                {mentor.role}
              </span>
            </div>

            {/* Skills */}
            <div className="flex flex-wrap gap-2 justify-center mb-6">
              {mentor.skills.map((s) => (
                <span
                  key={s}
                  className="bg-surface-container-high text-on-surface font-mono text-xs px-3 py-1 rounded-full"
                >
                  {s}
                </span>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3 w-full">
              <button
                disabled={mentor.id === user?.id}
                onClick={() => setShowMessageModal(true)}
                className="flex items-center justify-center gap-1.5 py-3 px-4 bg-primary text-on-primary font-mono text-xs font-bold rounded-xl hover:bg-surface-tint transition-all disabled:opacity-50 disabled:bg-surface-container-high disabled:text-on-surface-variant disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
                {mentor.id === user?.id ? "Mon profil" : "Message"}
              </button>

              <button
                onClick={() => setIsFollowing(!isFollowing)}
                className={`py-3 px-4 font-mono text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                  isFollowing
                    ? "bg-primary-container text-on-primary-container border border-primary/30"
                    : "border border-outline-variant text-on-surface hover:bg-surface-container"
                }`}
              >
                {isFollowing ? (
                  <>
                    <UserCheck className="w-4 h-4 text-primary" />
                    Abonné(e)
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    Suivre
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Stats Cards Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-surface rounded-2xl p-5 card-shadow border border-outline-variant/30 text-center flex flex-col items-center justify-center">
              <GraduationCap className="w-6 h-6 text-primary mb-1" />
              <span className="font-headline text-2xl font-bold text-on-surface">
                {mentor.workshopsCount || 0}
              </span>
              <span className="font-mono text-xs text-on-surface-variant uppercase">
                Ateliers
              </span>
            </div>

            <div className="bg-surface rounded-2xl p-5 card-shadow border border-outline-variant/30 text-center flex flex-col items-center justify-center">
              <UsersRound className="w-6 h-6 text-primary mb-1" />
              <span className="font-headline text-2xl font-bold text-on-surface">
                {mentor.projectsCount || mentor.studentsCount || 0}
              </span>
              <span className="font-mono text-xs text-on-surface-variant uppercase">
                Projets
              </span>
            </div>
          </div>

          {/* Memories Card */}
          <div className="bg-primary text-on-primary rounded-2xl p-6 card-shadow flex items-center justify-between">
            <div>
              <span className="font-headline text-2xl font-bold block">
                {mentor.memoriesCount || 0} Souvenirs
              </span>
              <span className="font-body text-xs opacity-80">
                Partagés dans le Dojo Hub
              </span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <BookImage className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Right Column: Badges & Timeline */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Badges Earned Card */}
          <div className="bg-surface rounded-2xl p-gutter card-shadow border border-outline-variant/30">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-headline font-bold text-on-surface text-lg flex items-center gap-2">
                <Trophy className="w-5 h-5 text-primary" />
                Badges obtenus
              </h2>
              <Link href="/badges" className="font-mono text-xs text-primary font-semibold hover:underline">
                Voir tout
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center font-mono text-xs">
              <div className="flex flex-col items-center">
                <div className="w-14 h-14 rounded-full bg-primary-container/20 text-primary flex items-center justify-center mb-2">
                  <Trophy className="w-7 h-7" />
                </div>
                <span>Premier atelier</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-14 h-14 rounded-full bg-primary-container/20 text-primary flex items-center justify-center mb-2">
                  <Bug className="w-7 h-7" />
                </div>
                <span>Bug Squasher</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-14 h-14 rounded-full bg-primary-container/20 text-primary flex items-center justify-center mb-2">
                  <Flame className="w-7 h-7" />
                </div>
                <span>Hot Streak</span>
              </div>
              <div className="flex flex-col items-center opacity-40">
                <div className="w-14 h-14 rounded-full bg-surface-container-high text-on-surface flex items-center justify-center mb-2">
                  <Lock className="w-7 h-7" />
                </div>
                <span>Verrouillé</span>
              </div>
            </div>
          </div>

          {/* Recent Activity Timeline */}
          <div className="bg-surface rounded-2xl p-gutter card-shadow border border-outline-variant/30">
            <h2 className="font-headline font-bold text-on-surface text-lg mb-6 flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Activité récente
            </h2>

            <div className="flex flex-col gap-8 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-outline-variant/30">
              <div className="flex items-start gap-4 relative z-10">
                <div className="w-6 h-6 rounded-full bg-primary text-on-primary flex items-center justify-center shrink-0 mt-1">
                  <BookImage className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="font-mono text-xs text-on-surface-variant block mb-1">
                    Il y a 2 heures
                  </span>
                  <p className="font-body text-on-surface text-sm">
                    <span className="font-bold">A ajouté un souvenir</span> de l&apos;atelier Python Basics.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 relative z-10">
                <div className="w-6 h-6 rounded-full bg-primary text-on-primary flex items-center justify-center shrink-0 mt-1">
                  <HeartHandshake className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="font-mono text-xs text-on-surface-variant block mb-1">
                    Hier
                  </span>
                  <p className="font-body text-on-surface text-sm">
                    <span className="font-bold">Mission Secret Friend</span> accomplie !
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 relative z-10">
                <div className="w-6 h-6 rounded-full bg-outline text-surface-container-lowest flex items-center justify-center shrink-0 mt-1">
                  <Trophy className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="font-mono text-xs text-on-surface-variant block mb-1">
                    Il y a 3 jours
                  </span>
                  <p className="font-body text-on-surface text-sm">
                    A obtenu le badge <span className="font-bold">Bug Squasher</span>.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Direct Message Modal */}
      {showMessageModal && mentor && (
        <DirectMessageModal
          recipient={mentor}
          onClose={() => setShowMessageModal(false)}
          onSend={handleSendMessage}
        />
      )}
    </div>
  );
}
