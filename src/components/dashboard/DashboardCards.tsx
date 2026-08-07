import Image from "next/image";
import Link from "next/link";
import {
  BookOpen,
  Brain,
  Pencil,
  Heart,
  HeartHandshake,
  MessageCircle,
  Trophy,
} from "lucide-react";
import { MemoryItem, UserProfile } from "@/types";

export function DailyQuestionCard({
  question,
  onAnswer,
}: {
  question: string;
  onAnswer: () => void;
}) {
  return (
    <div className="bg-surface rounded-2xl p-gutter card-shadow md:col-span-2 xl:col-span-2 flex flex-col justify-between relative overflow-hidden group border border-outline-variant/30">
      <div className="absolute -right-12 -top-12 w-48 h-48 bg-tertiary-fixed rounded-full opacity-50 blur-3xl group-hover:scale-110 transition-transform duration-700 pointer-events-none" />
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-4">
          <Brain className="w-5 h-5 text-surface-tint" />
          <span className="font-mono text-xs text-surface-tint uppercase tracking-wider font-semibold">
            Question du jour
          </span>
        </div>
        <h2 className="font-headline text-xl md:text-2xl font-semibold text-on-surface mb-6 max-w-xl">
          &quot;{question}&quot;
        </h2>
      </div>
      <div className="relative z-10 flex justify-start">
        <button
          onClick={onAnswer}
          className="bg-gradient-to-r from-primary to-surface-tint text-on-primary font-mono text-sm py-3 px-6 rounded-full hover:shadow-lg hover:scale-105 transition-all flex items-center gap-2 font-medium"
        >
          <Pencil className="w-4 h-4" />
          Répondre
        </button>
      </div>
    </div>
  );
}

export function SecretFriendCard() {
  return (
    <div className="bg-inverse-surface rounded-2xl p-gutter card-shadow flex flex-col justify-between relative overflow-hidden text-surface">
      <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none">
        <HeartHandshake className="w-24 h-24" />
      </div>
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-4">
          <HeartHandshake className="w-5 h-5 text-inverse-primary" />
          <span className="font-mono text-xs text-inverse-primary uppercase tracking-wider font-semibold">
            Secret Friend
          </span>
        </div>
        <h2 className="font-headline text-xl md:text-2xl font-bold text-surface mb-2">
          Tu as une mission cette semaine
        </h2>
        <p className="font-body text-sm text-surface-variant opacity-80 mb-6">
          Surprends ton mentor assigné avant vendredi.
        </p>
      </div>
      <div className="relative z-10">
        <Link
          href="/secret-friend"
          className="bg-surface text-primary font-mono text-sm py-3 px-6 rounded-full hover:bg-surface-container hover:scale-105 transition-all w-full text-center block font-semibold shadow-sm"
        >
          Voir ma mission
        </Link>
      </div>
    </div>
  );
}

export function LatestMemoryCard({ memory }: { memory: MemoryItem }) {
  return (
    <div className="bg-surface rounded-2xl p-4 card-shadow md:col-span-1 xl:col-span-1 flex flex-col border border-outline-variant/30">
      <div className="flex items-center gap-2 mb-3 px-2 pt-2">
        <BookOpen className="w-4 h-4 text-primary" />
        <span className="font-mono text-xs text-on-surface-variant uppercase tracking-wider font-semibold">
          Dernier souvenir
        </span>
      </div>
      <div className="relative h-48 w-full rounded-xl overflow-hidden mb-4">
        <Image
          src={memory.imageUrl}
          alt={memory.title}
          fill
          sizes="(min-width: 1280px) 25vw, (min-width: 768px) 33vw, 100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex items-end p-4">
          <h3 className="font-headline text-lg font-bold text-white leading-tight">
            {memory.title}
          </h3>
        </div>
      </div>
      <div className="flex items-center gap-4 px-2 pb-2 mt-auto">
        <span className="flex items-center gap-1.5 text-on-surface-variant">
          <Heart className="w-[18px] h-[18px]" />
          <span className="font-mono text-xs">{memory.likesCount}</span>
        </span>
        <span className="flex items-center gap-1.5 text-on-surface-variant">
          <MessageCircle className="w-[18px] h-[18px]" />
          <span className="font-mono text-xs">{memory.commentsCount}</span>
        </span>
      </div>
    </div>
  );
}

export function LeaderboardCard({ leaderboard }: { leaderboard: UserProfile[] }) {
  const colors = ["text-primary", "text-surface-tint", "text-outline"];
  const barColors = ["bg-primary", "bg-surface-tint", "bg-tertiary-container"];

  return (
    <div className="bg-surface rounded-2xl p-gutter card-shadow md:col-span-2 xl:col-span-1 flex flex-col border border-outline-variant/30">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-primary" />
          <h2 className="font-headline text-xl font-bold text-on-surface">Top Mentors</h2>
        </div>
        <Link href="/badges" className="font-mono text-xs text-primary hover:underline font-semibold">
          Voir tout
        </Link>
      </div>
      <div className="flex flex-col gap-4">
        {leaderboard.slice(0, 3).map((mentor, index) => {
          const maxXp = leaderboard[0]?.xp || 1;
          const pct = Math.round((mentor.xp / maxXp) * 100);

          return (
            <div key={mentor.id} className="flex items-center gap-4">
              <div className={`w-8 font-mono text-sm font-bold ${colors[index]} text-center`}>
                #{index + 1}
              </div>
              <Image
                src={mentor.avatar}
                alt={mentor.name}
                width={40}
                height={40}
                className="w-10 h-10 rounded-full object-cover border border-outline-variant"
              />
              <div className="flex-1">
                <div className="flex justify-between items-end mb-1">
                  <span className="font-body text-sm font-semibold text-on-surface leading-none">
                    {mentor.name}
                  </span>
                  <span className="font-mono text-xs text-on-surface-variant">{mentor.xp} XP</span>
                </div>
                <div className="h-2 w-full bg-surface-container-high rounded-full overflow-hidden">
                  <div className={`h-full ${barColors[index]} rounded-full`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
