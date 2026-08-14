"use client";

import { useEffect, useRef, useState } from "react";
import { SmilePlus } from "lucide-react";

export const DEFAULT_REACTION_EMOJIS = ["❤️", "🎉", "🚀", "💡", "🔥", "👏"];

interface ReactionPickerProps {
  onSelectEmoji: (emoji: string) => void;
  emojis?: string[];
  label?: string;
  size?: "sm" | "md";
  className?: string;
}

export function ReactionPicker({
  onSelectEmoji,
  emojis = DEFAULT_REACTION_EMOJIS,
  label = "😀+ Réagir",
  size = "md",
  className = "",
}: ReactionPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDownOutside = (event: MouseEvent | TouchEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDownOutside);
    document.addEventListener("touchstart", handlePointerDownOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDownOutside);
      document.removeEventListener("touchstart", handlePointerDownOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const togglePicker = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen((prev) => !prev);
  };

  const handleEmojiClick = (e: React.MouseEvent, emoji: string) => {
    e.stopPropagation();
    onSelectEmoji(emoji);
    setIsOpen(false);
  };

  const isSmall = size === "sm";

  return (
    <div className={`relative inline-block ${className}`} ref={containerRef}>
      <button
        type="button"
        aria-label="Ajouter une réaction"
        aria-expanded={isOpen}
        onClick={togglePicker}
        className={
          isSmall
            ? "px-2.5 py-1 rounded-full bg-surface-container-low hover:bg-primary-container/30 transition-all text-primary hover:text-primary flex items-center gap-1.5 font-mono text-xs font-semibold cursor-pointer border border-outline-variant/40 hover:border-primary/50 shadow-xs active:scale-95"
            : "px-3 py-1.5 rounded-full bg-surface-container-low hover:bg-primary-container/30 transition-all text-primary hover:text-primary flex items-center gap-1.5 font-mono text-xs font-semibold cursor-pointer border border-outline-variant/40 hover:border-primary/50 shadow-xs active:scale-95"
        }
      >
        <SmilePlus
          className={
            isSmall
              ? "w-3.5 h-3.5 pointer-events-none"
              : "w-4 h-4 pointer-events-none"
          }
        />
        {label && <span className="pointer-events-none">{label}</span>}
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-label="Choisir une réaction"
          className="absolute right-0 bottom-full mb-2 z-50 flex items-center gap-1 p-1.5 bg-surface-container-high/95 backdrop-blur-md rounded-full shadow-2xl border border-outline-variant/40 animate-in fade-in zoom-in-95 duration-150"
        >
          {emojis.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={(e) => handleEmojiClick(e, emoji)}
              className={
                isSmall
                  ? "w-8 h-8 flex items-center justify-center hover:bg-surface-container-highest rounded-full transition-transform hover:scale-125 text-base cursor-pointer active:scale-110"
                  : "w-9 h-9 flex items-center justify-center hover:bg-surface-container-highest rounded-full transition-transform hover:scale-125 text-lg cursor-pointer active:scale-110"
              }
              aria-label={`Réagir avec ${emoji}`}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
