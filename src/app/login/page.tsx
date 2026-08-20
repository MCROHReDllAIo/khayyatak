"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Logo } from "@/components/shared/Logo";
import { BRAND } from "@/lib/constants/brand";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useLocale } from "@/lib/context/locale-context";
import { useAuth } from "@/lib/context/app-context";
import { signInWithPassword, signUp } from "@/lib/actions/auth";
import type { UserRole } from "@/types";
import { Suspense } from "react";

function LoginForm() {
  const { t } = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshProfile, authConfigured, isAuthenticated, authLoading, role: userRole } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<UserRole>("customer");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const redirect = searchParams.get("redirect") ?? "/";

  const roleHome: Record<UserRole, string> = {
    customer: "/customer",
    tailor: "/tailor/dashboard",
    admin: "/admin",
  };

  useEffect(() => {
    if (authLoading || !isAuthenticated || !userRole) return;
    const dest = redirect !== "/" ? redirect : roleHome[userRole];
    router.replace(dest);
  }, [authLoading, isAuthenticated, userRole, redirect, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!authConfigured) {
      setError(t("نظام الدخول غير مُعد بعد", "Authentication is not configured yet"));
      setLoading(false);
      return;
    }

    let nextRole: UserRole = role;

    if (mode === "login") {
      const result = await signInWithPassword(email, password);
      if (result.error) {
        setError(result.error);
        setLoading(false);
        return;
      }
      if (result.role) nextRole = result.role;
    } else {
      const result = await signUp(email, password, fullName, role);
      if (result.error) {
        setError(result.error);
        setLoading(false);
        return;
      }
    }

    await refreshProfile();
    setLoading(false);
    const dest = redirect !== "/" ? redirect : roleHome[nextRole];
    router.push(dest);
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-omani-cream flex flex-col">
      <header className="p-4 flex items-center justify-between">
        <Logo showTagline />
        <LanguageSwitcher />
      </header>

      <div className="flex-1 flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-navy">{t("تسجيل الدخول", "Sign In")}</h1>
            <p className="text-muted-foreground mt-2 text-sm">
              {t(`${BRAND.nameAr} — حسابك الآمن`, `${BRAND.nameEn} — your secure account`)}
            </p>
          </div>

          {!authConfigured && process.env.NODE_ENV === "development" && (
            <Card className="mb-4 border-amber-300 bg-amber-50">
              <CardContent className="p-4 text-sm text-amber-900 space-y-2">
                <p>
                  {t(
                    "أضف DATABASE_URL أو مفاتيح Supabase في .env.local",
                    "Add DATABASE_URL or Supabase keys in .env.local"
                  )}
                </p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="p-6">
              <div className="flex gap-2 mb-6">
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium ${mode === "login" ? "bg-primary text-white" : "bg-muted"}`}
                >
                  {t("دخول", "Login")}
                </button>
                <button
                  type="button"
                  onClick={() => setMode("signup")}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium ${mode === "signup" ? "bg-primary text-white" : "bg-muted"}`}
                >
                  {t("إنشاء حساب", "Sign Up")}
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === "signup" && (
                  <>
                    <Input
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder={t("الاسم الكامل", "Full name")}
                      required
                    />
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value as UserRole)}
                      className="w-full h-10 rounded-md border px-3 text-sm"
                    >
                      <option value="customer">{t("عميل", "Customer")}</option>
                      <option value="tailor">{t("خياط", "Tailor")}</option>
                    </select>
                  </>
                )}
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("البريد الإلكتروني", "Email")}
                  required
                  autoComplete="email"
                />
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t("كلمة المرور", "Password")}
                  required
                  minLength={6}
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                />
                {error && <p className="text-sm text-red-600">{error}</p>}
                <Button type="submit" className="w-full" disabled={loading || !authConfigured}>
                  {loading ? t("جاري...", "Loading...") : mode === "login" ? t("دخول", "Sign In") : t("إنشاء حساب", "Create Account")}
                </Button>
              </form>
            </CardContent>
          </Card>

          <p className="text-center text-xs text-muted-foreground mt-6">
            <Link href="/" className="hover:text-primary">{t("العودة للرئيسية", "Back to home")}</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">...</div>}>
      <LoginForm />
    </Suspense>
  );
}
