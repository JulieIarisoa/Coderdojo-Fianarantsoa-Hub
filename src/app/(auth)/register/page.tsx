"use client";

import Image from "next/image";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/providers/AuthProvider";
import { AlertCircle, User, Mail, Lock, Sparkles } from "lucide-react";
import { registerSchema } from "@/lib/validation/schemas";
import { FieldError } from "@/components/common/FieldError";

type RegisterFormValues = {
  name: string;
  email: string;
  password: string;
};

function formatRegisterError(err: unknown): string {
  const error = err as { code?: string; message?: string };
  const code = error.code || "";
  const msg = error.message || ""

  if (code === "auth/email-already-in-use") {
    return "Cet e-mail est déjà utilisé par un autre compte. Veuillez vous connecter.";
  }
  if (code === "auth/weak-password") {
    return "Le mot de passe doit contenir au moins 6 caractères.";
  }
  if (code === "auth/operation-not-allowed") {
    return "L'inscription par e-mail n'est pas encore activée dans la console Firebase (Étape: Firebase Console -> Authentication -> Sign-in method). Utilisez le bouton 'Accès Rapide (Démo)' ci-dessous.";
  }
  if (code === "auth/unauthorized-domain") {
    return "Ce domaine de déploiement n'est pas autorisé dans votre console Firebase. (Allez dans Firebase Console -> Authentication -> Settings -> Domaines autorisés pour l'ajouter).";
  }
  return msg || "Erreur lors de la création du compte.";
}

export default function RegisterPage() {
  const router = useRouter();
  const { register: registerAccount, demoLogin } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    mode: "onBlur",
  });

  const onSubmit = async (values: RegisterFormValues) => {
    setError(null);
    setSubmitting(true);
    try {
      await registerAccount(values.email, values.password, values.name);
      router.push("/dashboard");
    } catch (err: unknown) {
      setError(formatRegisterError(err));
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
      <main className="w-full max-w-lg mx-auto flex flex-col p-6 sm:p-12 bg-surface-container-lowest rounded-2xl shadow-ambient border border-outline-variant/30 relative z-10">
        <div className="flex items-center justify-center gap-3 mb-6">
          <Image src="/logo.jpg" alt="CoderDojo Logo" width={48} height={48} className="w-12 h-12 rounded-xl object-cover shadow-md border border-outline-variant/30" />
          <span className="font-headline text-headline-md font-extrabold text-3xl bg-gradient-to-r from-primary to-surface-tint bg-clip-text text-transparent">
            CoderDojo
          </span>
        </div>

        <div className="mb-6 text-center">
          <h1 className="font-headline text-2xl md:text-3xl font-bold text-on-surface mb-2">
            Créer ton compte Mentor
          </h1>
          <p className="font-body text-sm text-on-surface-variant">
            Rejoins notre espace d&apos;échange et d&apos;entraide
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-error-container text-on-error-container font-mono text-xs flex items-start gap-3 border border-error/20 leading-relaxed">
            <AlertCircle className="w-5 h-5 text-error shrink-0 mt-0.5" />
            <div>{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} suppressHydrationWarning className="flex flex-col gap-5">
          <div>
            <label className="block font-mono text-xs font-semibold uppercase tracking-wider text-on-surface mb-2">
              Nom complet
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-outline-variant">
                <User className="w-5 h-5" />
              </div>
              <input
                type="text"
                {...register("name")}
                placeholder="Ton nom et prénom"
                className="block w-full pl-10 pr-3 py-3 border border-outline-variant rounded-lg bg-surface-bright text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all font-body placeholder:text-outline/60"
              />
            </div>
            <FieldError message={errors.name?.message} />
          </div>

          <div>
            <label className="block font-mono text-xs font-semibold uppercase tracking-wider text-on-surface mb-2">
              Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-outline-variant">
                <Mail className="w-5 h-5" />
              </div>
              <input
                type="email"
                {...register("email")}
                placeholder="nom@exemple.com"
                className="block w-full pl-10 pr-3 py-3 border border-outline-variant rounded-lg bg-surface-bright text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all font-body placeholder:text-outline/60"
              />
            </div>
            <FieldError message={errors.email?.message} />
          </div>

          <div>
            <label className="block font-mono text-xs font-semibold uppercase tracking-wider text-on-surface mb-2">
              Mot de passe
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-outline-variant">
                <Lock className="w-5 h-5" />
              </div>
              <input
                type="password"
                {...register("password")}
                placeholder="Mot de passe sécurisé"
                className="block w-full pl-10 pr-3 py-3 border border-outline-variant rounded-lg bg-surface-bright text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all font-body placeholder:text-outline/60"
              />
            </div>
            <FieldError message={errors.password?.message} />
          </div>

          <div className="flex flex-col gap-3 mt-2">
            <button
              suppressHydrationWarning
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center py-3.5 px-8 bg-gradient-to-r from-primary to-surface-tint text-white dark:from-primary-container dark:to-inverse-primary dark:hover:from-inverse-primary dark:hover:to-primary-container rounded-lg font-headline text-[18px] leading-tight font-semibold hover:shadow-lg hover:from-surface-tint hover:to-primary transition-all duration-300 transform active:scale-95 disabled:opacity-50"
            >
              {submitting ? "Inscription..." : "S'inscrire"}
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
          Tu as déjà un compte ?{" "}
          <Link href="/login" className="text-primary font-bold hover:underline">
            Se connecter
          </Link>
        </p>
      </main>
    </div>
  );
}
