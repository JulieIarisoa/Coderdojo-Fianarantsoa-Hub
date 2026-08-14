"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/providers/AuthProvider";
import { MOCK_POSTS, MOCK_MENTORS } from "@/lib/mockData";
import { CampfirePost, CampfireCategory } from "@/types";
import { CampfirePostCard } from "@/components/campfire/CampfirePostCard";
import { FieldError } from "@/components/common/FieldError";
import { campfireComposerSchema } from "@/lib/validation/schemas";
import {
  subscribeToCampfirePosts,
  createCampfirePost,
  toggleLikeCampfirePost,
  addCommentToCampfirePost,
} from "@/lib/firebase/community";
import {
  Lightbulb,
  Rocket,
  GraduationCap,
  Smile,
  Send,
  TrendingUp,
  Flame,
} from "lucide-react";

const CATEGORIES: { id: CampfireCategory; label: string; icon: React.ReactNode }[] = [
  { id: "idea", label: "Idée", icon: <Lightbulb className="w-4 h-4" /> },
  { id: "project", label: "Projet", icon: <Rocket className="w-4 h-4" /> },
  { id: "teaching", label: "Enseignement", icon: <GraduationCap className="w-4 h-4" /> },
  { id: "fun", label: "Fun", icon: <Smile className="w-4 h-4" /> },
];

type CampfireComposerValues = {
  content: string;
  category: CampfireCategory;
};

function buildMockPost(
  data: Omit<CampfirePost, "id" | "createdAt">
): CampfirePost {
  return {
    id: `post-${Date.now()}`,
    ...data,
    createdAt: "À l'instant",
  };
}

export default function CampfirePage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<CampfirePost[]>(MOCK_POSTS);
  const [activeCommentsPostId, setActiveCommentsPostId] = useState<string | null>(null);
  const [commentInput, setCommentInput] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    formState: { errors },
  } = useForm<CampfireComposerValues>({
    resolver: zodResolver(campfireComposerSchema),
    mode: "onBlur",
    defaultValues: { content: "", category: "idea" },
  });

  const content = useWatch({ control, name: "content" }) ?? "";
  const selectedCategory = useWatch({ control, name: "category" }) ?? "idea";

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) return;

    const unsubscribe = subscribeToCampfirePosts((firestorePosts) => {
      setPosts(firestorePosts);
    });

    return () => unsubscribe();
  }, []);

  const handleCreatePost = async (values: CampfireComposerValues) => {
    if (!values.content.trim() || !user) return;

    const newPostData = {
      authorId: user.id,
      authorName: user.name,
      authorAvatar: user.avatar,
      content: values.content,
      category: values.category,
      reactions: { "❤️": [user.id] },
      likesCount: 1,
      commentsCount: 0,
    };

    if (process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
      await createCampfirePost(newPostData);
    } else {
      setPosts([buildMockPost(newPostData), ...posts]);
    }

    reset({ content: "", category: values.category });
  };

  const handleLike = async (postId: string, emoji: string = "❤️") => {
    if (!user) return;

    setPosts((prevPosts) =>
      prevPosts.map((p) => {
        if (p.id === postId) {
          const hasReacted = p.reactions?.[emoji]?.includes(user.id);
          const newLikes = hasReacted ? Math.max(0, p.likesCount - 1) : p.likesCount + 1;
          const newReactions = { ...(p.reactions || {}) };
          newReactions[emoji] = hasReacted
            ? (newReactions[emoji] || []).filter((id) => id !== user.id)
            : [...(newReactions[emoji] || []), user.id];
          return { ...p, likesCount: newLikes, reactions: newReactions };
        }
        return p;
      })
    );

    if (process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
      try {
        await toggleLikeCampfirePost(postId, { id: user.id, name: user.name }, emoji);
      } catch (err) {
        console.warn("Firestore like sync error:", err);
      }
    }
  };

  const handleComment = async (postId: string) => {
    if (!commentInput.trim() || !user) return;

    const currentComment = commentInput;
    setCommentInput("");

    setPosts((prevPosts) =>
      prevPosts.map((p) =>
        p.id === postId ? { ...p, commentsCount: p.commentsCount + 1 } : p
      )
    );

    if (process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
      try {
        await addCommentToCampfirePost(postId, {
          postId,
          authorId: user.id,
          authorName: user.name,
          authorAvatar: user.avatar,
          content: currentComment,
        });
      } catch (err) {
        console.warn("Firestore comment sync error:", err);
      }
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-headline text-2xl md:text-3xl font-bold text-on-surface flex items-center gap-2">
            <Flame className="w-7 h-7 text-primary" />
            CoderDojo Hub
          </h1>
          <p className="font-body text-on-surface-variant text-sm mt-1">
            Un espace d&apos;échange en temps réel pour tous les mentors du Dojo.
          </p>
        </div>
      </div>

      {/* Main Grid: Feed (Left) & Sidebar (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Feed Column */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Post Composer Card */}
          <div className="bg-surface rounded-2xl p-gutter card-shadow border border-outline-variant/30">
            <form onSubmit={handleSubmit(handleCreatePost)} className="flex flex-col gap-4">
              <div className="flex gap-4 items-start">
                <Image src={user?.avatar || MOCK_MENTORS[0].avatar} alt={user?.name || "Avatar"} width={48} height={48} className="w-12 h-12 rounded-full object-cover border border-outline-variant/40 shrink-0" />
                <div className="w-full">
                  <textarea
                    {...register("content")}
                    placeholder="Partage une idée, pose une question, ou lance une discussion..."
                    rows={3}
                    className="w-full bg-surface-container-low border border-outline-variant/40 rounded-xl p-3 text-on-surface font-body placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary transition-all resize-none"
                  />
                  <FieldError message={errors.content?.message} />
                </div>
              </div>

              {/* Category Pills & Post Action */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-outline-variant/20">
                <div className="flex items-center gap-2 flex-wrap">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setValue("category", cat.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-mono text-xs font-medium transition-all ${
                        selectedCategory === cat.id
                          ? "bg-primary text-on-primary shadow-sm"
                          : "bg-surface-container-high text-on-surface-variant hover:bg-surface-container"
                      }`}
                    >
                      {cat.icon}
                      {cat.label}
                    </button>
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={!content.trim()}
                  className="bg-primary hover:bg-surface-tint text-on-primary font-mono text-sm font-semibold px-6 py-2 rounded-full transition-all duration-200 disabled:opacity-40 disabled:hover:bg-primary flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  Publier
                </button>
              </div>
            </form>
          </div>

          {/* Posts List */}
          {posts.map((post) => (
            <CampfirePostCard
              key={post.id}
              post={post}
              userId={user?.id}
              showComments={activeCommentsPostId === post.id}
              commentInput={commentInput}
              onLike={handleLike}
              onToggleComments={(postId) =>
                setActiveCommentsPostId((current) =>
                  current === postId ? null : postId
                )
              }
              onCommentInputChange={setCommentInput}
              onComment={handleComment}
            />
          ))}
        </div>

        {/* Right Sidebar */}
        <div className="flex flex-col gap-6">
          {/* Trending Topics Card */}
          <div className="bg-surface rounded-2xl p-gutter card-shadow border border-outline-variant/30">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-primary" />
              <h2 className="font-headline font-bold text-on-surface text-lg">
                Sujets tendances
              </h2>
            </div>

            <div className="flex flex-col gap-4 font-mono text-xs">
              <div>
                <span className="font-bold text-on-surface block text-sm">
                  #ProjetsScratch
                </span>
                <span className="text-on-surface-variant">15 nouveaux posts cette semaine</span>
              </div>
              <div>
                <span className="font-bold text-on-surface block text-sm">
                  #ConseilsMentor
                </span>
                <span className="text-on-surface-variant">8 nouveaux posts cette semaine</span>
              </div>
              <div>
                <span className="font-bold text-on-surface block text-sm">
                  #HardwareHacks
                </span>
                <span className="text-on-surface-variant">3 nouveaux posts cette semaine</span>
              </div>
            </div>
          </div>

          {/* Around the Fire Card */}
          <div className="bg-surface rounded-2xl p-gutter card-shadow border border-outline-variant/30">
            <h2 className="font-headline font-bold text-on-surface text-lg mb-4">
              Autour du feu
            </h2>

            <div className="flex items-center gap-2">
              {MOCK_MENTORS.slice(0, 3).map((m) => (
                <Image key={m.id} src={m.avatar} alt={m.name} width={40} height={40} className="w-10 h-10 rounded-full object-cover border-2 border-surface" />
              ))}
              <div className="w-10 h-10 rounded-full bg-primary-container/20 text-primary font-mono text-xs font-bold flex items-center justify-center border-2 border-surface">
                +12
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
