import { AlertCircle } from "lucide-react";

interface FieldErrorProps {
  message?: string;
}

export function FieldError({ message }: FieldErrorProps) {
  if (!message) return null;

  return (
    <p
      role="alert"
      className="mt-1.5 font-mono text-xs text-error flex items-start gap-1.5 leading-relaxed"
    >
      <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
      <span>{message}</span>
    </p>
  );
}
