"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/providers/AuthProvider";
import {
  subscribeToDashboardStats,
  subscribeToLeaderboard,
  subscribeToDailyQuestion,
} from "@/lib/firebase/firestore";
import { subscribeToMemories } from "@/lib/firebase/memories";
import { createCampfirePost } from "@/lib/firebase/community";
import { MOCK_MEMORIES, MOCK_MENTORS } from "@/lib/mockData";
import { UserProfile, MemoryItem } from "@/types";
import {
  DailyQuestionCard,
  LeaderboardCard,
  LatestMemoryCard,
  SecretFriendCard,
} from "@/components/dashboard/DashboardCards";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { DailyQuestionModal } from "@/components/dashboard/DailyQuestionModal";

export default function DashboardPage() {
  const { user } = useAuth();
  const userName = user?.name || "Mentor";
  const isFirebaseConfigured = Boolean(process.env.NEXT_PUBLIC_FIREBASE_API_KEY);

  const [stats, setStats] = useState({
    mentorsCount: isFirebaseConfigured ? 0 : 15,
    memoriesCount: isFirebaseConfigured ? 0 : 245,
    postsCount: isFirebaseConfigured ? 0 : 120,
    totalXp: isFirebaseConfigured ? 0 : 3500,
  });
  const [leaderboard, setLeaderboard] = useState<UserProfile[]>(
    isFirebaseConfigured ? [] : MOCK_MENTORS.slice(1)
  );
  const [latestMemory, setLatestMemory] = useState<MemoryItem | null>(
    isFirebaseConfigured ? null : MOCK_MEMORIES[0]
  );
  const [dailyQuestion, setDailyQuestion] = useState<string>(
    "Quel est ton premier souvenir avec un ordinateur ?"
  );

  // Daily Question Answer Modal State
  const [showAnswerModal, setShowAnswerModal] = useState(false);
  const [answerText, setAnswerText] = useState("");
  const [answerSuccess, setAnswerSuccess] = useState(false);

  useEffect(() => {
    if (!isFirebaseConfigured) return;

    const unsub1 = subscribeToDashboardStats(setStats);
    const unsub2 = subscribeToLeaderboard((mentors) => setLeaderboard(mentors));
    const unsub3 = subscribeToMemories((memories) => {
      if (memories.length > 0) setLatestMemory(memories[0]);
    });
    const unsub4 = subscribeToDailyQuestion((q) => {
      if (q) setDailyQuestion(q.text);
    });

    return () => {
      unsub1();
      unsub2();
      unsub3();
      unsub4();
    };
  }, [isFirebaseConfigured]);

  const handleAnswerDailyQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!answerText.trim() || !user) return;

    const formattedContent = `💡 Question du jour: "${dailyQuestion}"\n\n${answerText}`;

    if (process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
      await createCampfirePost({
        authorId: user.id,
        authorName: user.name,
        authorAvatar: user.avatar,
        content: formattedContent,
        category: "idea",
        reactions: { "❤️": [user.id] },
        likesCount: 1,
        commentsCount: 0,
      });
    }

    setAnswerSuccess(true);
    setTimeout(() => {
      setAnswerSuccess(false);
      setShowAnswerModal(false);
      setAnswerText("");
    }, 1500);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Greeting */}
      <div className="py-2">
        <h1 className="font-headline text-2xl md:text-3xl font-bold text-on-surface mb-1">
          Bonjour {userName} !
        </h1>
        <p className="font-body text-on-surface-variant">
          Prêt à inspirer les ninjas aujourd&apos;hui ? Voici ce qui se passe dans le Club.
        </p>
      </div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <DailyQuestionCard question={dailyQuestion} onAnswer={() => setShowAnswerModal(true)} />
        <SecretFriendCard />
        <DashboardStats stats={stats} />
        {latestMemory && <LatestMemoryCard memory={latestMemory} />}
        <LeaderboardCard leaderboard={leaderboard} />
      </div>

      {showAnswerModal && (
        <DailyQuestionModal
          question={dailyQuestion}
          answerText={answerText}
          answerSuccess={answerSuccess}
          onAnswerTextChange={setAnswerText}
          onClose={() => {
            setShowAnswerModal(false);
            setAnswerText("");
          }}
          onSubmit={handleAnswerDailyQuestion}
        />
      )}
    </div>
  );
}
