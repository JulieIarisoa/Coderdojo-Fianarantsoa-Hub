"use client";

import { Suspense, useEffect, useState } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { MOCK_MENTORS } from "@/lib/mockData";
import { UserProfile } from "@/types";
import { subscribeToAllMentors } from "@/lib/firebase/firestore";
import { sendDirectMessage } from "@/lib/firebase/messaging";
import { DirectMessageModal } from "@/components/common/DirectMessageModal";
import { MentorCard } from "@/components/mentors/MentorCard";
import { MentorFilters } from "@/components/mentors/MentorFilters";
import { useMentorFilters } from "@/hooks/useMentorFilters";
import { Search } from "lucide-react";

function MentorsDirectory() {
  const { user } = useAuth();
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

  const {
    searchInput,
    setSearchInput,
    selectedSkills,
    toggleSkill,
    resetFilters,
    availableSkills,
    filteredMentors,
    isFilterActive,
  } = useMentorFilters(allMentors);

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
      {/* Page Header */}
      <div>
        <h1 className="font-headline text-3xl md:text-4xl font-extrabold text-on-surface">
          Répertoire des Mentors
        </h1>
        <p className="font-body text-on-surface-variant text-base mt-1">
          Connectez-vous, collaborez et apprenez des meilleurs du Coderdojo Hub.
        </p>
      </div>

      <MentorFilters
        searchInput={searchInput}
        onSearchChange={setSearchInput}
        availableSkills={availableSkills}
        selectedSkills={selectedSkills}
        onToggleSkill={toggleSkill}
        onReset={resetFilters}
        isFilterActive={isFilterActive}
        resultCount={filteredMentors.length}
      />

      {/* Mentors Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMentors.map((m) => (
          <MentorCard
            key={m.id}
            mentor={m}
            isSelf={m.id === user?.id}
            onMessage={setMessageTarget}
          />
        ))}
      </div>

      {filteredMentors.length === 0 && (
        <div className="text-center py-12 text-on-surface-variant">
          <Search className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-body text-lg">Aucun mentor trouvé</p>
          <p className="font-mono text-xs mt-1">
            Essayez un autre terme de recherche ou réinitialisez les filtres
          </p>
          {isFilterActive && (
            <button
              type="button"
              onClick={resetFilters}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-on-primary font-mono text-xs font-bold rounded-full hover:bg-surface-tint transition-all focus:outline-none focus:ring-2 focus:ring-primary"
            >
              Réinitialiser les filtres
            </button>
          )}
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

export default function MentorsPage() {
  return (
    <Suspense fallback={null}>
      <MentorsDirectory />
    </Suspense>
  );
}
