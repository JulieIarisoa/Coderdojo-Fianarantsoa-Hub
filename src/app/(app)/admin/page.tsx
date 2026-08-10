"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { subscribeToAdminStats } from "@/lib/firebase/admin";
import {
  createDailyQuestion,
  subscribeToAllMentors,
  updateUserProfile,
  updateUserStatus,
  createSecretFriendCampaign,
} from "@/lib/firebase/firestore";
import { subscribeToCampfirePosts, deleteCampfirePost } from "@/lib/firebase/community";
import { createGuessWhoGame } from "@/lib/firebase/gamification";
import { CampfirePost, UserProfile } from "@/types";
import { MOCK_MENTORS, MOCK_POSTS } from "@/lib/mockData";
import {
  AdminGuessWhoModal,
  AdminMentorManagementModal,
  AdminModerationModal,
  AdminQuestionModal,
  AdminSecretFriendModal,
  AdminUserValidationModal,
} from "@/components/admin/AdminModals";
import {
  Lock,
  Users,
  TrendingUp,
  BookImage,
  MessageSquare,
  Gift,
  Flame,
  HelpCircle,
  ShieldAlert,
  Plus,
  Edit3,
  UserCheck,
} from "lucide-react";

export default function AdminPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalMentors: 14,
    totalPosts: 84,
    totalMemories: 32,
    pendingApprovals: 1,
    activeQuestions: 15,
    flaggedPosts: 2,
  });

  // Mentors list for select dropdowns
  const [mentorsList, setMentorsList] = useState<UserProfile[]>(MOCK_MENTORS);
  // Campfire posts for moderation queue
  const [postsList, setPostsList] = useState<CampfirePost[]>(MOCK_POSTS);

  // Modal 0: Validation Utilisateurs
  const [showUserValidationModal, setShowUserValidationModal] = useState(false);

  // Modal 1: Question du jour
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [questionText, setQuestionText] = useState("");
  const [questionSuccess, setQuestionSuccess] = useState(false);

  // Modal 2: Guess Who (Qui suis-je ?)
  const [showGuessWhoModal, setShowGuessWhoModal] = useState(false);
  const [clueText, setClueText] = useState("");
  const [selectedMentorId, setSelectedMentorId] = useState("");
  const [guessWhoSuccess, setGuessWhoSuccess] = useState(false);

  // Modal 3: Secret Friend Campaign
  const [showSecretFriendModal, setShowSecretFriendModal] = useState(false);
  const [campaignTitle, setCampaignTitle] = useState("Mission de la semaine");
  const [campaignDesc, setCampaignDesc] = useState("Envoyer un mot d'encouragement secrètement");
  const [secretFriendSuccess, setSecretFriendSuccess] = useState(false);
  const [secretFriendError, setSecretFriendError] = useState<string | null>(null);

  // Modal 4: Moderation Queue
  const [showModerationModal, setShowModerationModal] = useState(false);
  const [moderationNotice, setModerationNotice] = useState<string | null>(null);

  // Modal 5: Mentor Management
  const [showMentorMgmtModal, setShowMentorMgmtModal] = useState(false);
  const [editingMentor, setEditingMentor] = useState<UserProfile | null>(null);
  const [editForm, setEditForm] = useState({ workshopsCount: 0, projectsCount: 0, xp: 0, level: 1 });
  const [mentorSaveSuccess, setMentorSaveSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) return;

    const unsubStats = subscribeToAdminStats((newStats) => {
      setStats((prev) => ({ ...prev, ...newStats }));
    });

    const unsubMentors = subscribeToAllMentors((mentors) => {
      if (mentors.length > 0) setMentorsList(mentors);
    });

    const unsubPosts = subscribeToCampfirePosts((posts) => {
      if (posts.length > 0) setPostsList(posts);
    });

    return () => {
      unsubStats();
      unsubMentors();
      unsubPosts();
    };
  }, []);

  if (user?.role !== "ADMIN") {
    return (
      <div className="py-16 text-center text-on-surface-variant font-body flex flex-col items-center">
        <Lock className="w-16 h-16 text-error mb-4 opacity-80" />
        <h1 className="font-headline text-2xl font-bold text-on-surface">Accès restreint</h1>
        <p className="mt-2 text-sm max-w-md">
          Seuls les administrateurs du CoderDojo Fianarantsoa peuvent accéder au portail de gestion.
        </p>
      </div>
    );
  }

  // Handle Create Question du jour
  const handleCreateDailyQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionText.trim()) return;

    if (process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
      await createDailyQuestion(questionText);
    }
    setQuestionSuccess(true);
    setTimeout(() => {
      setQuestionSuccess(false);
      setShowQuestionModal(false);
      setQuestionText("");
    }, 1500);
  };

  // Handle Create Guess Who
  const handleCreateGuessWho = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clueText.trim()) return;

    const target = mentorsList.find((m) => m.id === selectedMentorId) || mentorsList[0];
    const altOptions = mentorsList
      .filter((m) => m.id !== target.id)
      .slice(0, 2)
      .map((m) => ({ id: m.id, name: m.name, avatar: m.avatar }));

    const newGame = {
      clue: clueText,
      targetMentorId: target.id,
      targetMentorName: target.name,
      options: [
        { id: target.id, name: target.name, avatar: target.avatar },
        ...altOptions,
      ],
      active: true,
      createdAt: new Date().toISOString(),
    };

    if (process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
      await createGuessWhoGame(newGame);
    }

    setGuessWhoSuccess(true);
    setTimeout(() => {
      setGuessWhoSuccess(false);
      setShowGuessWhoModal(false);
      setClueText("");
      setSelectedMentorId("");
    }, 1500);
  };

  // Handle Create Secret Friend Campaign
  const handleCreateSecretFriendCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    setSecretFriendError(null);
    if (!campaignTitle.trim()) return;

    if (mentorsList.length < 2) {
      setSecretFriendError("Il faut au moins deux mentors pour lancer le tirage.");
      return;
    }

    const campaignId = "camp-" + Date.now();
    const campaign = {
      id: campaignId,
      title: campaignTitle,
      season: new Date().getFullYear().toString(),
      instruction: campaignDesc,
      status: "active" as const,
      revealDaysLeft: 30,
    };
    const assignments = mentorsList.map((mentor, index) => {
      const pairedMentor = mentorsList[(index + 1) % mentorsList.length];
      return {
        campaignId,
        mentorId: mentor.id,
        secretFriendId: pairedMentor.id,
        secretFriendName: pairedMentor.name,
        secretFriendAvatar: pairedMentor.avatar,
        missionTitle: campaignTitle,
        missionDescription: campaignDesc,
        completed: false,
        actionJournal: [],
      };
    });

    try {
      if (process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
        await createSecretFriendCampaign(campaign, assignments);
      }

      setSecretFriendSuccess(true);
      setTimeout(() => {
        setSecretFriendSuccess(false);
        setShowSecretFriendModal(false);
      }, 1500);
    } catch (error: unknown) {
      console.error("Secret Friend campaign creation failed:", error);
      setSecretFriendError(error instanceof Error ? error.message : "Le tirage a échoué.");
    }
  };

  // Handle Moderation Actions
  const handleDeletePost = async (postId: string) => {
    if (process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
      await deleteCampfirePost(postId);
    } else {
      setPostsList(postsList.filter((p) => p.id !== postId));
    }
    setModerationNotice("Message supprimé de la communauté.");
    setTimeout(() => setModerationNotice(null), 2500);
  };

  // Handle Edit Mentor Stats
  const handleEditMentor = (mentor: UserProfile) => {
    setEditingMentor(mentor);
    setEditForm({
      workshopsCount: mentor.workshopsCount || 0,
      projectsCount: mentor.projectsCount || 0,
      xp: mentor.xp || 0,
      level: mentor.level || 1,
    });
  };

  const handleSaveMentorStats = async () => {
    if (!editingMentor) return;
    if (process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
      await updateUserProfile(editingMentor.id, {
        workshopsCount: editForm.workshopsCount,
        projectsCount: editForm.projectsCount,
        xp: editForm.xp,
        level: editForm.level,
      });
    }
    setMentorSaveSuccess(editingMentor.name);
    setEditingMentor(null);
    setTimeout(() => setMentorSaveSuccess(null), 2500);
  };

  const handleUpdateUserStatus = async (
    userId: string,
    newStatus: "APPROVED" | "PENDING" | "REJECTED"
  ) => {
    if (process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
      await updateUserStatus(userId, newStatus);
    } else {
      setMentorsList((prev) =>
        prev.map((m) => (m.id === userId ? { ...m, status: newStatus } : m))
      );
    }
  };

  const pendingUsersCount = mentorsList.filter((m) => m.status === "PENDING").length;

  return (
    <div className="flex flex-col gap-8">
      {/* Overview Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-headline text-3xl md:text-4xl font-extrabold text-on-surface">
            Panneau d&apos;Administration
          </h1>
          <p className="font-body text-on-surface-variant text-base mt-1">
            Supervisez les activités de l&apos;espace, gérez les inscriptions et la modération.
          </p>
        </div>

        <button
          onClick={() => setShowQuestionModal(true)}
          className="bg-primary hover:bg-surface-tint text-on-primary font-mono text-sm font-semibold px-6 py-3 rounded-full hover:shadow-lg transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Nouvelle question du jour
        </button>
      </div>

      {/* Top Stats Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div
          onClick={() => setShowUserValidationModal(true)}
          className="bg-surface rounded-2xl p-6 card-shadow border border-outline-variant/30 flex flex-col justify-between cursor-pointer hover:border-primary/50 transition-all"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary-container text-on-primary-container flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
              <span className="font-mono text-xs text-on-surface-variant font-semibold uppercase tracking-wider">
                Mentors & Inscriptions
              </span>
            </div>
            {pendingUsersCount > 0 && (
              <span className="bg-amber-100 text-amber-800 font-mono text-[10px] font-bold px-2.5 py-0.5 rounded-full animate-bounce">
                {pendingUsersCount} en attente
              </span>
            )}
          </div>
          <div>
            <span className="font-headline text-4xl font-extrabold text-on-surface block mb-2">
              {stats.totalMentors}
            </span>
            <span className="inline-flex items-center gap-1 font-mono text-xs text-green-700 bg-green-100 font-bold px-2.5 py-0.5 rounded-full">
              <TrendingUp className="w-3.5 h-3.5" /> Accès contrôlé par l&apos;Admin
            </span>
          </div>
        </div>

        <div className="bg-surface rounded-2xl p-6 card-shadow border border-outline-variant/30 flex flex-col justify-between">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary-container text-on-primary-container flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
              <span className="font-mono text-xs text-on-surface-variant font-semibold uppercase tracking-wider">
                Taux d&apos;Engagement
              </span>
            </div>
            <span className="font-mono text-xs text-on-surface-variant">30 Derniers Jours</span>
          </div>
          <div className="h-16 w-full bg-surface-container-low rounded-xl flex items-center justify-center font-mono text-xs text-primary font-bold border border-outline-variant/20">
            ✨ 94% d&apos;activité constante
          </div>
        </div>

        <div className="bg-surface rounded-2xl p-6 card-shadow border border-outline-variant/30 flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-primary-container text-on-primary-container flex items-center justify-center">
              <BookImage className="w-4 h-4" />
            </div>
            <span className="font-mono text-xs text-on-surface-variant font-semibold uppercase tracking-wider">
              Contenus Partagés
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="font-mono text-xs text-on-surface-variant flex items-center gap-1">
                <MessageSquare className="w-3.5 h-3.5" /> Posts
              </span>
              <span className="font-headline text-2xl font-bold text-on-surface">
                {stats.totalPosts}
              </span>
            </div>
            <div>
              <span className="font-mono text-xs text-on-surface-variant flex items-center gap-1">
                <BookImage className="w-3.5 h-3.5" /> Photos
              </span>
              <span className="font-headline text-2xl font-bold text-on-surface">
                {stats.totalMemories}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Management Hub Section */}
      <div>
        <h2 className="font-headline text-2xl font-bold text-on-surface mb-6">
          Centre de Gestion
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* User Validation Admin Card */}
          <div className="bg-surface rounded-2xl p-6 card-shadow border border-outline-variant/30 flex flex-col justify-between relative overflow-hidden">
            {pendingUsersCount > 0 && (
              <div className="absolute top-0 right-0 bg-amber-500 text-white font-mono text-[10px] font-bold px-3 py-1 rounded-bl-xl shadow-sm">
                {pendingUsersCount} DEMANDE{pendingUsersCount > 1 ? "S" : ""}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2 text-primary mb-3">
                <UserCheck className="w-5 h-5 text-primary" />
                <h3 className="font-headline font-bold text-xl">
                  Validation des Inscriptions
                </h3>
              </div>
              <p className="font-body text-sm text-on-surface-variant mb-6">
                Validez ou refusez l&apos;accès des nouveaux utilisateurs inscrits au Clubhouse CoderDojo.
              </p>
            </div>
            <button
              onClick={() => setShowUserValidationModal(true)}
              className="w-full bg-primary hover:bg-surface-tint text-on-primary font-mono text-xs font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <UserCheck className="w-4 h-4" />
              Gérer les demandes ({pendingUsersCount} en attente)
            </button>
          </div>

          {/* Question du jour Admin Card */}
          <div className="bg-surface rounded-2xl p-6 card-shadow border border-outline-variant/30 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-primary mb-3">
                <HelpCircle className="w-5 h-5" />
                <h3 className="font-headline font-bold text-xl">
                  Question du jour
                </h3>
              </div>
              <p className="font-body text-sm text-on-surface-variant mb-6">
                Alimentez le fil du Dashboard avec de nouvelles questions pour stimuler les échanges.
              </p>
            </div>
            <button
              onClick={() => setShowQuestionModal(true)}
              className="w-full bg-surface-container-high hover:bg-surface-container text-primary font-mono text-xs font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Créer une question
            </button>
          </div>

          {/* Secret Friend Admin Card */}
          <div className="bg-surface rounded-2xl p-6 card-shadow border border-outline-variant/30 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-primary mb-3">
                <Gift className="w-5 h-5" />
                <h3 className="font-headline font-bold text-xl">
                  Secret Friend
                </h3>
              </div>
              <p className="font-body text-sm text-on-surface-variant mb-6">
                Configurez les campagnes d&apos;attribution anonyme et lancez les tirages entre mentors.
              </p>
            </div>
            <button
              onClick={() => setShowSecretFriendModal(true)}
              className="w-full bg-surface-container-high hover:bg-surface-container text-primary font-mono text-xs font-bold py-3 rounded-xl transition-all"
            >
              Paramètres de campagne →
            </button>
          </div>

          {/* Campfire Moderation Card */}
          <div className="bg-surface rounded-2xl p-6 card-shadow border border-outline-variant/30 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-primary">
                  <Flame className="w-5 h-5" />
                  <h3 className="font-headline font-bold text-xl">
                    Modération Campfire
                  </h3>
                </div>
                <span className="bg-error-container text-on-error-container font-mono text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">
                  {postsList.length}
                </span>
              </div>
              <p className="font-body text-sm text-on-surface-variant mb-6">
                Passez en revue les messages publiés et modérez le contenu si nécessaire.
              </p>
            </div>
            <button
              onClick={() => setShowModerationModal(true)}
              className="w-full bg-surface-bright border border-outline-variant/40 hover:bg-surface-container-low text-on-surface font-mono text-xs font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <ShieldAlert className="w-4 h-4 text-error" />
              File de modération →
            </button>
          </div>

          {/* Qui suis-je? Q&A Admin Card */}
          <div className="bg-surface rounded-2xl p-6 card-shadow border border-outline-variant/30 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-primary mb-3">
                <HelpCircle className="w-5 h-5" />
                <h3 className="font-headline font-bold text-xl">
                  Jeu &quot;Qui suis-je ?&quot;
                </h3>
              </div>
              <p className="font-body text-sm text-on-surface-variant mb-6">
                Créez une nouvelle devinette mystère en choisissant un mentor et une anecdote.
              </p>
            </div>
            <button
              onClick={() => setShowGuessWhoModal(true)}
              className="w-full bg-surface-bright border border-outline-variant/40 hover:bg-surface-container-low text-on-surface font-mono text-xs font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4 text-primary" />
              Ajouter une devinette →
            </button>
          </div>

          {/* Mentor Management Card */}
          <div className="bg-surface rounded-2xl p-6 card-shadow border border-outline-variant/30 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-primary mb-3">
                <Users className="w-5 h-5" />
                <h3 className="font-headline font-bold text-xl">
                  Gestion des Mentors
                </h3>
              </div>
              <p className="font-body text-sm text-on-surface-variant mb-6">
                Ajustez les statistiques (ateliers, projets, XP, niveau) de chaque mentor.
              </p>
            </div>
            <button
              onClick={() => setShowMentorMgmtModal(true)}
              className="w-full bg-surface-container-high hover:bg-surface-container text-primary font-mono text-xs font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <Edit3 className="w-4 h-4" />
              Gérer les statistiques →
            </button>
          </div>
        </div>
      </div>
      <AdminQuestionModal
        open={showQuestionModal}
        success={questionSuccess}
        value={questionText}
        onChange={setQuestionText}
        onClose={() => setShowQuestionModal(false)}
        onSubmit={handleCreateDailyQuestion}
      />
      <AdminSecretFriendModal
        open={showSecretFriendModal}
        success={secretFriendSuccess}
        error={secretFriendError}
        title={campaignTitle}
        description={campaignDesc}
        onTitleChange={setCampaignTitle}
        onDescriptionChange={setCampaignDesc}
        onClose={() => setShowSecretFriendModal(false)}
        onSubmit={handleCreateSecretFriendCampaign}
      />
      <AdminModerationModal
        open={showModerationModal}
        posts={postsList}
        notice={moderationNotice}
        onClose={() => setShowModerationModal(false)}
        onDelete={handleDeletePost}
      />
      <AdminGuessWhoModal
        open={showGuessWhoModal}
        success={guessWhoSuccess}
        clue={clueText}
        selectedMentorId={selectedMentorId}
        mentors={mentorsList}
        onClueChange={setClueText}
        onMentorChange={setSelectedMentorId}
        onClose={() => setShowGuessWhoModal(false)}
        onSubmit={handleCreateGuessWho}
      />
      <AdminMentorManagementModal
        open={showMentorMgmtModal}
        mentors={mentorsList}
        editingMentor={editingMentor}
        editForm={editForm}
        successName={mentorSaveSuccess}
        onClose={() => {
          setShowMentorMgmtModal(false);
          setEditingMentor(null);
        }}
        onEdit={handleEditMentor}
        onClearEditing={() => setEditingMentor(null)}
        onFormChange={(field, value) =>
          setEditForm((current) => ({ ...current, [field]: value }))
        }
        onSave={handleSaveMentorStats}
      />
      <AdminUserValidationModal
        open={showUserValidationModal}
        mentors={mentorsList}
        onClose={() => setShowUserValidationModal(false)}
        onUpdateStatus={handleUpdateUserStatus}
      />
    </div>
  );
}
