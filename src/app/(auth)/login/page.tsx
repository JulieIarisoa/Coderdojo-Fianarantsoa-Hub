"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { AlertCircle, Mail, Lock, Sparkles } from "lucide-react";

function formatAuthError(err: unknown): string {
  const error = err as { code?: string; message?: string };
  const code = error.code || "";
  const msg = error.message || "";

  if (code === "auth/invalid-credential" || code === "auth/user-not-found" || code === "auth/wrong-password") {
    return "Identifiants incorrects ou compte inexistant. Cliquez sur 'S'inscrire' ci-dessous pour créer votre compte.";
  }
  if (code === "auth/operation-not-allowed") {
    return "L'authentification par e-mail/mot de passe ou Google n'est pas encore activée dans la console Firebase (Étape: Firebase Console -> Authentication -> Sign-in method). Utilisez le bouton 'Accès Rapide (Démo)' ci-dessous.";
  }
  if (code === "auth/popup-closed-by-user") {
    return "La fenêtre de connexion Google a été fermée.";
  }
  if (code === "auth/unauthorized-domain") {
    return "Ce domaine de déploiement n'est pas autorisé dans votre console Firebase. (Allez dans Firebase Console -> Authentication -> Settings -> Domaines autorisés pour l'ajouter).";
  }
  return msg || "Erreur de connexion. Vérifiez vos identifiants ou utilisez l'accès démo.";
}

export default function LoginPage() {
  const router = useRouter();
  const { user, login, loginWithGoogle, demoLogin } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      router.push("/dashboard");
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      router.push("/dashboard");
    } catch (err: unknown) {
      setError(formatAuthError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setSubmitting(true);
    try {
      await loginWithGoogle();
      router.push("/dashboard");
    } catch (err: unknown) {
      setError(formatAuthError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDemoAccess = () => {
    demoLogin();
    router.push("/dashboard");
  };

  return (
    <div className="bg-surface text-on-surface antialiased min-h-screen flex items-center justify-center p-margin-mobile md:p-margin-desktop font-body">
      {/* Centered Main Form Container */}
      <main className="w-full max-w-lg mx-auto flex flex-col p-6 sm:p-12 bg-surface-container-lowest rounded-2xl shadow-ambient border border-outline-variant/30 relative z-10">
        {/* Logo & Brand Header */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <Image src="/logo.jpg" alt="CoderDojo Logo" width={48} height={48} className="w-12 h-12 rounded-xl object-cover shadow-md border border-outline-variant/30" />
          <span className="font-headline text-headline-md font-extrabold text-3xl bg-gradient-to-r from-primary to-surface-tint bg-clip-text text-transparent">
            CoderDojo
          </span>
        </div>

        {/* Welcome Text */}
        <div className="mb-8 text-center">
          <h1 className="font-headline text-2xl md:text-3xl font-bold text-on-surface mb-2">
            Bienvenue sur le CoderDojo Hub
          </h1>
          <p className="font-body text-sm text-on-surface-variant">
            Connectez-vous pour accéder au clubhouse des mentors
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-error-container text-on-error-container font-mono text-xs flex items-start gap-3 border border-error/20 leading-relaxed">
            <AlertCircle className="w-5 h-5 text-error shrink-0 mt-0.5" />
            <div>{error}</div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} suppressHydrationWarning className="flex flex-col gap-5">
          {/* Email Field */}
          <div>
            <label className="block font-mono text-xs font-semibold uppercase tracking-wider text-on-surface mb-2" htmlFor="email">
              Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-outline-variant">
                <Mail className="w-5 h-5" />
              </div>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nom@exemple.com"
                className="block w-full pl-10 pr-3 py-3 border border-outline-variant rounded-lg bg-surface-bright text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all font-body placeholder:text-outline/60"
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label className="block font-mono text-xs font-semibold uppercase tracking-wider text-on-surface mb-2" htmlFor="password">
              Mot de passe
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-outline-variant">
                <Lock className="w-5 h-5" />
              </div>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="block w-full pl-10 pr-3 py-3 border border-outline-variant rounded-lg bg-surface-bright text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all font-body placeholder:text-outline/60"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-4 mt-2">
            <button
              suppressHydrationWarning
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center py-3.5 px-8 bg-gradient-to-r from-primary to-surface-tint text-white dark:from-primary-container dark:to-inverse-primary dark:hover:from-inverse-primary dark:hover:to-primary-container rounded-lg font-headline text-[18px] leading-tight font-semibold hover:shadow-lg hover:from-surface-tint hover:to-primary transition-all duration-300 transform active:scale-95 disabled:opacity-50"
            >
              {submitting ? "Connexion..." : "Se connecter"}
            </button>

            {/* Divider */}
            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-outline-variant/50"></div>
              <span className="flex-shrink-0 mx-4 text-outline font-mono text-xs uppercase tracking-wider">Ou</span>
              <div className="flex-grow border-t border-outline-variant/50"></div>
            </div>

            {/* Google Button */}
            <button
              suppressHydrationWarning
              type="button"
              onClick={handleGoogleSignIn}
              disabled={submitting}
              className="w-full flex items-center justify-center gap-3 py-3.5 px-8 bg-surface-container-lowest border-[1.5px] border-primary text-primary rounded-lg font-headline text-[16px] leading-tight font-semibold hover:bg-surface-container-low transition-all duration-300 transform active:scale-95"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Continuer avec Google
            </button>

            {/* Quick Demo Access Button */}
            <button
              suppressHydrationWarning
              type="button"
              onClick={handleDemoAccess}
              className="w-full flex items-center justify-center gap-2 py-3 px-6 bg-surface-container-high hover:bg-surface-container text-primary rounded-lg font-mono text-xs font-bold border border-primary/30 transition-all"
            >
              <Sparkles className="w-4 h-4 text-primary" />
              Accès Rapide (Mode Démo / Test)
            </button>
          </div>
        </form>

        <p className="mt-8 text-center font-body text-sm text-on-surface-variant">
          Vous n&apos;avez pas de compte ?{" "}
          <Link href="/register" className="text-primary font-bold hover:underline">
            S&apos;inscrire
          </Link>
        </p>
      </main>
    </div>
  );
}
