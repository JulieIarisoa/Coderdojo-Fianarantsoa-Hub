"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { MOCK_GUESS_WHO } from "@/lib/mockData";
import { GuessWhoGame } from "@/types";
import { subscribeToActiveGuessWho, submitGuessWhoVote } from "@/lib/firebase/gamification";
import {
  Search,
  Trophy,
  HelpCircle,
  Vote,
  CheckCircle,
  XCircle,
  Zap,
  BarChart3,
  RotateCcw,
} from "lucide-react";

export default function QuiSuisJePage() {
  const { user } = useAuth();
  const [game, setGame] = useState<GuessWhoGame>(MOCK_GUESS_WHO);
  const [selectedOption, setSelectedOption] = useState<string>("");
  const [hasVoted, setHasVoted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [userScore, setUserScore] = useState(user?.xp || 450);

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) return;

    const unsub = subscribeToActiveGuessWho((g) => {
      if (g) setGame(g);
    });

    return () => unsub();
  }, []);

  const handleVote = async () => {
    if (!selectedOption || !user) return;
    setHasVoted(true);
    const correct = selectedOption === game.targetMentorId;
    setIsCorrect(correct);

    if (correct) {
      setUserScore(userScore + 50);
    }

    if (process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
      await submitGuessWhoVote(game.id, user.id, selectedOption, correct);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header & Score */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-headline text-3xl md:text-4xl font-extrabold text-on-surface flex items-center gap-2">
            <Search className="w-8 h-8 text-primary" />
            Qui suis-je ?
          </h1>
          <p className="font-body text-on-surface-variant text-base mt-1">
            Devine le mentor derrière l&apos;indice mystère !
          </p>
        </div>

        <div className="bg-primary-container text-on-primary-container font-mono text-sm font-bold px-5 py-2.5 rounded-full flex items-center gap-2 shadow-sm">
          <Trophy className="w-[18px] h-[18px]" />
          Ton score : {userScore} XP
        </div>
      </div>

      {/* Main Grid: Game Stage (Left) & Sidebar (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Game Stage Card */}
        <div className="lg:col-span-2 bg-surface rounded-2xl p-gutter card-shadow border border-outline-variant/30 flex flex-col items-center text-center">
          {/* Question Icon Badge */}
          <div className="w-20 h-20 rounded-full bg-surface-container-high border-4 border-surface shadow-inner flex items-center justify-center text-primary mb-6 mt-4">
            <HelpCircle className="w-10 h-10" />
          </div>

          {/* Clue Quote Card */}
          <div className="w-full max-w-xl bg-surface-container-low border border-outline-variant/30 rounded-2xl p-6 sm:p-8 mb-8 relative">
            <span className="font-headline text-4xl text-primary/30 absolute left-4 top-2">&ldquo;</span>
            <h2 className="font-headline text-xl sm:text-2xl font-bold text-on-surface leading-relaxed">
              {game.clue}
            </h2>
            <span className="font-headline text-4xl text-primary/30 absolute right-4 bottom-2">&rdquo;</span>
          </div>

          {/* Options Selection */}
          <div className="w-full max-w-md flex flex-col gap-3 mb-8">
            <p className="font-mono text-xs text-on-surface-variant uppercase tracking-wider mb-1">
              Qui est ce mentor ?
            </p>

            {game.options.map((opt) => (
              <label
                key={opt.id}
                onClick={() => !hasVoted && setSelectedOption(opt.id)}
                className={`flex items-center gap-4 p-4 rounded-xl border transition-all cursor-pointer ${
                  selectedOption === opt.id
                    ? "border-primary bg-primary-container/10 shadow-sm"
                    : "border-outline-variant/40 bg-surface-bright hover:bg-surface-container-low"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                    selectedOption === opt.id
                      ? "border-primary bg-primary"
                      : "border-outline-variant"
                  }`}
                >
                  {selectedOption === opt.id && (
                    <div className="w-2 h-2 rounded-full bg-on-primary" />
                  )}
                </div>

                <Image src={opt.avatar} alt={opt.name} width={40} height={40} className="w-10 h-10 rounded-full object-cover border border-outline-variant/40" />

                <span className="font-headline font-bold text-on-surface text-base">
                  {opt.name}
                </span>
              </label>
            ))}
          </div>

          {/* Vote Button */}
          {!hasVoted ? (
            <button
              onClick={handleVote}
              disabled={!selectedOption}
              className="w-full max-w-md bg-primary hover:bg-surface-tint text-on-primary font-mono text-base font-semibold py-3.5 px-8 rounded-xl shadow-md transition-all disabled:opacity-40 flex items-center justify-center gap-2"
            >
              <Vote className="w-5 h-5" />
              Voter
            </button>
          ) : (
            <button
              onClick={() => {
                setHasVoted(false);
                setSelectedOption("");
              }}
              className="w-full max-w-md bg-surface-container-high text-primary font-mono text-sm font-semibold py-3 px-6 rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Rejouer
            </button>
          )}
        </div>

        {/* Right Sidebar: Detectives Leaderboard & Feedback */}
        <div className="flex flex-col gap-6">
          {/* Top Detectives Card */}
          <div className="bg-surface rounded-2xl p-gutter card-shadow border border-outline-variant/30">
            <div className="flex items-center gap-2 mb-6">
              <BarChart3 className="w-5 h-5 text-primary" />
              <h2 className="font-headline font-bold text-on-surface text-lg">
                Top Détectives
              </h2>
            </div>

            <div className="flex flex-col gap-3 font-mono text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-primary-container/20 border border-primary-container/30">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary text-on-primary font-bold flex items-center justify-center text-xs">
                    1
                  </span>
                  <span className="font-headline font-bold text-on-surface text-sm">Kanto</span>
                </div>
                <span className="bg-primary text-on-primary px-2.5 py-1 rounded-full font-bold">
                  1200 XP
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-surface-container-low">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-surface-container-high text-on-surface font-bold flex items-center justify-center text-xs">
                    2
                  </span>
                  <span className="font-headline font-bold text-on-surface text-sm">Njaka</span>
                </div>
                <span className="text-on-surface-variant font-semibold">950 XP</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-surface-container-low">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-surface-container-high text-on-surface font-bold flex items-center justify-center text-xs">
                    3
                  </span>
                  <span className="font-headline font-bold text-on-surface text-sm">Feno</span>
                </div>
                <span className="text-on-surface-variant font-semibold">820 XP</span>
              </div>
            </div>
          </div>

          {/* Feedback Card (Shown after voting) */}
          {hasVoted && (
            <div
              className={`rounded-2xl p-6 border flex items-start gap-4 animate-in fade-in duration-300 ${
                isCorrect
                  ? "bg-green-50 border-green-500 text-green-900"
                  : "bg-red-50 border-red-500 text-red-900"
              }`}
            >
              {isCorrect ? (
                <CheckCircle className="w-8 h-8 shrink-0" />
              ) : (
                <XCircle className="w-8 h-8 shrink-0" />
              )}
              <div>
                <h3 className="font-headline font-bold text-lg">
                  {isCorrect ? "Correct !" : "Dommage !"}
                </h3>
                <p className="font-body text-sm mt-1">
                  {isCorrect
                    ? `C'était bien ${game.targetMentorName}.`
                    : `La bonne réponse était ${game.targetMentorName}.`}
                </p>
                {isCorrect && (
                  <span className="inline-flex items-center gap-1 mt-3 bg-green-200 text-green-800 font-mono text-xs font-bold px-3 py-1 rounded-full">
                    <Zap className="w-3.5 h-3.5" />
                    + 50 XP
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
