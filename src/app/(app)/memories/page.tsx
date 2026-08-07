"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { useImageUpload } from "@/hooks/useImageUpload";
import { MemoryUploadModal } from "@/components/memories/MemoryUploadModal";
import { MemoryCard, MemoryComments } from "@/components/memories/MemoryCard";
import { MOCK_MEMORIES, MOCK_MENTORS } from "@/lib/mockData";
import { MemoryItem } from "@/types";
import {
  subscribeToMemories,
  createMemory,
  toggleLikeMemory,
  addCommentToMemory,
} from "@/lib/firebase/memories";
import {
  Camera,
  Plus,
  Calendar,
  Heart,
  MessageCircle,
  Share2,
  Send,
  Check,
  Images,
} from "lucide-react";

export default function MemoriesPage() {
  const { user } = useAuth();
  const { uploadImage, isUploading, error: uploadError } = useImageUpload();
  const [memories, setMemories] = useState<MemoryItem[]>(MOCK_MEMORIES);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newDate, setNewDate] = useState("Août 2026");
  const [imageUrl, setImageUrl] = useState("");
  const [imagesList, setImagesList] = useState<string[]>([]);
  const [cloudinaryId, setCloudinaryId] = useState("");

  // Active comments memory ID
  const [activeCommentsMemId, setActiveCommentsMemId] = useState<string | null>(null);
  const [commentInput, setCommentInput] = useState("");

  // Share Toast notification
  const [shareNotice, setShareNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) return;

    const unsubscribe = subscribeToMemories((firestoreMemories) => {
      setMemories(firestoreMemories);
    });

    return () => unsubscribe();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newUrls: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const uploaded = await uploadImage(file);
      if (uploaded) {
        newUrls.push(uploaded.url);
        if (!imageUrl) {
          setImageUrl(uploaded.url);
          setCloudinaryId(uploaded.cloudinaryId || "");
        }
      }
    }
    setImagesList((prev) => [...prev, ...newUrls]);
  };

  const handleRemoveImage = (index: number) => {
    setImagesList((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      if (updated.length > 0) {
        setImageUrl(updated[0]);
      } else {
        setImageUrl("");
      }
      return updated;
    });
  };

  const handleAddMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const mainImg = imagesList[0] || imageUrl || MOCK_MEMORIES[0].imageUrl;
    const finalImages = imagesList.length > 0 ? imagesList : [mainImg];

    const newMemData = {
      title: newTitle,
      description: newDesc,
      imageUrl: mainImg,
      images: finalImages,
      cloudinaryId: cloudinaryId || `cl_${Date.now()}`,
      authorId: user?.id || "user-fanilo",
      authorName: user?.name || "Fanilo",
      authorAvatar: user?.avatar || MOCK_MENTORS[0].avatar,
      authorRole: "Mentor",
      eventDate: newDate,
      likesCount: 1,
      commentsCount: 0,
      reactions: { "❤️": [user?.id || "user-fanilo"] },
    };

    if (process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
      await createMemory(newMemData);
    } else {
      const mockMem: MemoryItem = {
        id: `mem-${Date.now()}`,
        ...newMemData,
        createdAt: new Date().toISOString(),
      };
      setMemories([mockMem, ...memories]);
    }

    setShowUploadModal(false);
    setNewTitle("");
    setNewDesc("");
    setImageUrl("");
    setImagesList([]);
    setCloudinaryId("");
  };

  const handleLike = async (memoryId: string) => {
    if (!user) return;

    if (process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
      await toggleLikeMemory(memoryId, user.id);
    } else {
      setMemories(
        memories.map((m) => {
          if (m.id === memoryId) {
            const hasLiked = m.reactions["❤️"]?.includes(user.id);
            return {
              ...m,
              likesCount: hasLiked ? m.likesCount - 1 : m.likesCount + 1,
              reactions: {
                ...m.reactions,
                "❤️": hasLiked
                  ? (m.reactions["❤️"] || []).filter((id) => id !== user.id)
                  : [...(m.reactions["❤️"] || []), user.id],
              },
            };
          }
          return m;
        })
      );
    }
  };

  const handleComment = async (memoryId: string) => {
    if (!commentInput.trim() || !user) return;

    if (process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
      await addCommentToMemory(memoryId, {
        postId: memoryId,
        authorId: user.id,
        authorName: user.name,
        authorAvatar: user.avatar,
        content: commentInput,
      });
    } else {
      setMemories(
        memories.map((m) =>
          m.id === memoryId ? { ...m, commentsCount: m.commentsCount + 1 } : m
        )
      );
    }
    setCommentInput("");
  };

  const handleShareMemory = async (title: string, desc: string) => {
    if (typeof window !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title,
          text: desc,
          url: window.location.href,
        });
        return;
      } catch (e) {
        console.warn("Share cancelled or failed", e);
      }
    }
    // Fallback to clipboard
    if (typeof window !== "undefined") {
      await navigator.clipboard.writeText(window.location.href);
      setShareNotice("Lien du souvenir copié dans le presse-papier !");
      setTimeout(() => setShareNotice(null), 2500);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-headline text-3xl md:text-4xl font-extrabold text-on-surface flex items-center gap-2">
            <Camera className="w-8 h-8 text-primary" />
            Souvenirs
          </h1>
          <p className="font-body text-on-surface-variant text-base mt-1">
            Revivez les meilleurs moments de notre communauté.
          </p>
        </div>

        <button
          onClick={() => setShowUploadModal(true)}
          className="bg-primary hover:bg-surface-tint text-on-primary font-mono text-sm font-semibold px-6 py-3 rounded-full hover:shadow-lg transition-all flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Ajouter un souvenir
        </button>
      </div>

      {shareNotice && (
        <div className="p-3 bg-primary-container/20 text-primary font-mono text-xs rounded-xl flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4" />
          {shareNotice}
        </div>
      )}

      {/* Main Timeline Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Featured Big Memory Card (Spans 2 columns) */}
        {memories[0] && (
          <div className="lg:col-span-2 bg-surface rounded-2xl p-6 card-shadow border border-outline-variant/30 flex flex-col justify-between group">
            <Link href={`/memories/${memories[0].id}`} className="block relative h-64 sm:h-80 md:h-96 w-full rounded-2xl overflow-hidden mb-6 cursor-pointer">
              <Image src={memories[0].imageUrl} alt={memories[0].title} fill sizes="(min-width: 1024px) 66vw, 100vw" className="object-cover group-hover:scale-[1.02] transition-transform duration-300" />
              <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md text-white px-3 py-1 rounded-full font-mono text-xs flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                {memories[0].eventDate}
              </div>
              {(memories[0].images?.length || 0) > 1 && (
                <div className="absolute top-4 right-4 bg-primary text-on-primary font-mono text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5 shadow-lg">
                  <Images className="w-4 h-4" />
                  {memories[0].images?.length} photos (Voir la galerie)
                </div>
              )}
            </Link>

            <div>
              <Link href={`/memories/${memories[0].id}`}>
                <h2 className="font-headline text-2xl sm:text-3xl font-extrabold text-on-surface mb-3 hover:text-primary transition-colors cursor-pointer">
                  {memories[0].title}
                </h2>
              </Link>
              <p className="font-body text-on-surface-variant text-base leading-relaxed mb-6">
                {memories[0].description}
              </p>
            </div>

            <div className="flex flex-col gap-4 pt-4 border-t border-outline-variant/20">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Image src={memories[0].authorAvatar} alt={memories[0].authorName} width={40} height={40} className="w-10 h-10 rounded-full object-cover border border-outline-variant/40" />
                  <div>
                    <span className="font-headline font-bold text-on-surface block text-sm leading-tight">
                      {memories[0].authorName}
                    </span>
                    <span className="font-mono text-xs text-on-surface-variant">
                      {memories[0].authorRole || "Mentor"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4 font-mono text-xs text-on-surface-variant">
                  <button
                    onClick={() => handleLike(memories[0].id)}
                    className="flex items-center gap-1.5 hover:text-primary transition-colors"
                  >
                    <Heart className="w-5 h-5" />
                    <span>{memories[0].likesCount}</span>
                  </button>

                  <button
                    onClick={() =>
                      setActiveCommentsMemId(
                        activeCommentsMemId === memories[0].id ? null : memories[0].id
                      )
                    }
                    className="flex items-center gap-1.5 hover:text-primary transition-colors"
                  >
                    <MessageCircle className="w-5 h-5" />
                    <span>{memories[0].commentsCount} Commentaires</span>
                  </button>

                  <button
                    onClick={() => handleShareMemory(memories[0].title, memories[0].description)}
                    className="hover:text-primary transition-colors"
                    title="Partager ce souvenir"
                  >
                    <Share2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Comments Section */}
              {activeCommentsMemId === memories[0].id && (
                <div className="pt-3 border-t border-outline-variant/20 flex flex-col gap-3">
                  {process.env.NEXT_PUBLIC_FIREBASE_API_KEY && (
                    <MemoryComments memoryId={memories[0].id} />
                  )}
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={commentInput}
                      onChange={(e) => setCommentInput(e.target.value)}
                      placeholder="Écrire un commentaire..."
                      className="flex-1 bg-surface-container-low border border-outline-variant/40 rounded-full px-4 py-2 font-body text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleComment(memories[0].id);
                        }
                      }}
                    />
                    <button
                      onClick={() => handleComment(memories[0].id)}
                      className="bg-primary text-on-primary font-mono text-xs font-semibold px-4 py-2 rounded-full flex items-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Poster
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Secondary Memories Column */}
        <div className="flex flex-col gap-6">
          {memories.slice(1).map((memory) => (
            <MemoryCard
              key={memory.id}
              memory={memory}
              commentsOpen={activeCommentsMemId === memory.id}
              commentInput={commentInput}
              onLike={handleLike}
              onToggleComments={(memoryId) =>
                setActiveCommentsMemId((current) =>
                  current === memoryId ? null : memoryId
                )
              }
              onCommentInputChange={setCommentInput}
              onComment={handleComment}
              onShare={handleShareMemory}
            />
          ))}
        </div>
      </div>

      <MemoryUploadModal
        open={showUploadModal}
        title={newTitle}
        description={newDesc}
        eventDate={newDate}
        imageUrl={imageUrl}
        images={imagesList}
        cloudinaryId={cloudinaryId}
        isUploading={isUploading}
        uploadError={uploadError}
        onTitleChange={setNewTitle}
        onDescriptionChange={setNewDesc}
        onEventDateChange={setNewDate}
        onFileChange={handleFileUpload}
        onRemoveImage={handleRemoveImage}
        onClose={() => setShowUploadModal(false)}
        onSubmit={handleAddMemory}
      />
    </div>
  );
}
