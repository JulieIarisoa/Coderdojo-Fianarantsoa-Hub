"use client";

import type { ReactNode } from "react";
import { X } from "lucide-react";

interface ModalProps {
  title: string;
  icon?: ReactNode;
  onClose: () => void;
  children: ReactNode;
  maxWidth?: string;
}

export function Modal({
  title,
  icon,
  onClose,
  children,
  maxWidth = "max-w-md",
}: ModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className={`bg-surface rounded-2xl p-6 md:p-8 ${maxWidth} w-full shadow-2xl border border-outline-variant/40`}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-headline text-lg font-bold text-on-surface flex items-center gap-2">
            {icon}
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="text-on-surface-variant hover:text-on-surface"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}
