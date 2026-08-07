import { FormEvent } from "react";
import { Brain, CheckCircle, Send, X } from "lucide-react";

interface DailyQuestionModalProps {
  question: string;
  answerText: string;
  answerSuccess: boolean;
  onAnswerTextChange: (value: string) => void;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

export function DailyQuestionModal({
  question,
  answerText,
  answerSuccess,
  onAnswerTextChange,
  onClose,
  onSubmit,
}: DailyQuestionModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-surface rounded-2xl p-6 md:p-8 max-w-md w-full shadow-2xl border border-outline-variant/40">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-headline text-lg font-bold text-on-surface flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary" />
            Répondre à la question du jour
          </h3>
          <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface" aria-label="Fermer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-3 bg-primary-container/20 rounded-xl mb-4 border border-primary/20">
          <span className="font-mono text-[10px] uppercase text-primary font-bold block mb-1">
            Question :
          </span>
          <p className="font-headline text-sm font-bold text-on-surface">&quot;{question}&quot;</p>
        </div>

        {answerSuccess ? (
          <div className="py-6 text-center text-primary font-bold flex flex-col items-center gap-2">
            <CheckCircle className="w-8 h-8 text-green-600" />
            Réponse publiée sur le Hub ! 
          </div>
        ) : (
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <textarea
              rows={4}
              required
              value={answerText}
              onChange={(event) => onAnswerTextChange(event.target.value)}
              placeholder="Écris ta réponse ici..."
              className="w-full bg-surface-container-low border border-outline-variant/40 rounded-xl p-3 text-on-surface font-body resize-none focus:outline-none focus:ring-2 focus:ring-primary"
            />

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 font-mono text-xs text-on-surface-variant hover:bg-surface-container rounded-full"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={!answerText.trim()}
                className="bg-primary text-on-primary font-mono text-xs font-semibold px-6 py-2 rounded-full flex items-center gap-1.5 disabled:opacity-40"
              >
                <Send className="w-3.5 h-3.5" />
                Publier la réponse 
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
