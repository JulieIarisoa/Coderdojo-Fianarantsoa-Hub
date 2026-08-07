"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { AppShell } from "./AppShell";

export function ProtectedAppShell({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center font-body text-primary gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-primary-container border-t-primary animate-spin" />
        <span className="font-headline font-bold text-sm">Chargement du Clubhouse...</span>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // User Pending Approval Guard Screen
  if (user.status === "PENDING") {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center font-body p-6 text-center">
        <div className="max-w-md w-full bg-surface-container-lowest p-8 rounded-3xl card-shadow border border-outline-variant/30 flex flex-col items-center gap-5">
          <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-3xl font-headline font-extrabold shadow-sm animate-pulse">
            ⏳
          </div>
          <span className="bg-amber-100 text-amber-800 font-mono text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
            Compte en attente de validation
          </span>
          <h1 className="font-headline text-2xl font-extrabold text-on-surface">
            Bienvenue, {user.name} !
          </h1>
          <p className="font-body text-sm text-on-surface-variant leading-relaxed">
            L&apos;accès au Clubhouse est réservé uniquement aux mentors autorisés du <strong>CoderDojo Fianarantsoa</strong>.
          </p>
          <p className="font-body text-xs text-on-surface-variant/80 bg-surface-container-low p-3 rounded-xl border border-outline-variant/20">
            Un administrateur examine actuellement votre inscription. Vous recevrez l&apos;accès dès que votre compte aura été validé.
          </p>
          <div className="flex flex-col w-full gap-3 pt-2">
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-primary hover:bg-surface-tint text-on-primary font-mono text-xs font-bold py-3 rounded-xl transition-all"
            >
              Vérifier l&apos;état de validation
            </button>
            <button
              onClick={() => logout()}
              className="w-full bg-surface-container hover:bg-surface-container-high text-on-surface-variant font-mono text-xs font-semibold py-3 rounded-xl transition-all"
            >
              Se déconnecter
            </button>
          </div>
        </div>
      </div>
    );
  }

  // User Rejected Access Guard Screen
  if (user.status === "REJECTED") {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center font-body p-6 text-center">
        <div className="max-w-md w-full bg-surface-container-lowest p-8 rounded-3xl card-shadow border border-outline-variant/30 flex flex-col items-center gap-5">
          <div className="w-16 h-16 rounded-full bg-error-container text-on-error-container flex items-center justify-center text-3xl font-headline font-extrabold">
            🚫
          </div>
          <span className="bg-error-container text-on-error-container font-mono text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
            Accès non approuvé
          </span>
          <h1 className="font-headline text-2xl font-extrabold text-on-surface">
            Accès restreint
          </h1>
          <p className="font-body text-sm text-on-surface-variant leading-relaxed">
            Désolé, votre compte n&apos;a pas été validé pour l&apos;accès aux ressources des mentors de CoderDojo Fianarantsoa.
          </p>
          <button
            onClick={() => logout()}
            className="w-full bg-primary text-on-primary font-mono text-xs font-bold py-3 rounded-xl transition-all mt-2"
          >
            Se déconnecter
          </button>
        </div>
      </div>
    );
  }

  return <AppShell>{children}</AppShell>;
}
