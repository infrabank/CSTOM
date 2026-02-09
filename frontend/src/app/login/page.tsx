"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { authApi } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      await authApi.login({ email, password });
      router.push("/dashboard");
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : "로그인에 실패했습니다";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-surface-raised">
      {/* Left - Branding panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary flex-col items-center justify-center p-12 relative overflow-hidden">
        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 opacity-5">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        <div className="relative z-10 text-center max-w-md">
          <div className="mb-8 bg-white rounded-lg px-6 py-3 inline-block">
            <Image
              src="/images/ci_21.jpg"
              alt="KRIHS 국토연구원"
              width={280}
              height={56}
              priority
              className="h-14 w-auto mx-auto"
            />
          </div>
          <h1 className="text-3xl font-bold text-text-on-primary mb-4">
            전산통합유지보수 관리시스템
          </h1>
          <p className="text-text-on-primary/70 text-lg leading-relaxed">
            CSTOM - Computer System Total Operations Management
          </p>
          <div className="mt-12 flex items-center gap-6 justify-center text-text-on-primary/50 text-sm">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
              <span>보안 인증</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15z" />
              </svg>
              <span>통합 유지보수</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right - Login form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex justify-center mb-8 lg:hidden">
            <Image
              src="/images/ci_21.jpg"
              alt="KRIHS 국토연구원"
              width={200}
              height={40}
              priority
              className="h-10 w-auto"
            />
          </div>

          <div className="lg:hidden text-center mb-6">
            <h1 className="text-xl font-bold text-text">전산통합유지보수 관리시스템</h1>
            <p className="text-sm text-text-muted mt-1">CSTOM</p>
          </div>

          <div className="hidden lg:block mb-8">
            <h2 className="text-2xl font-bold text-text">로그인</h2>
            <p className="text-text-muted mt-1">계정 정보를 입력해 주세요</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-danger-bg text-danger rounded-md border border-danger-border text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-text-secondary mb-1.5">
                이메일
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2.5 border border-border rounded-md bg-surface text-text placeholder:text-text-muted focus:outline-none focus:ring-3 focus:ring-accent/30 focus:border-accent transition-colors"
                placeholder="example@krihs.re.kr"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-text-secondary mb-1.5">
                비밀번호
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2.5 border border-border rounded-md bg-surface text-text placeholder:text-text-muted focus:outline-none focus:ring-3 focus:ring-accent/30 focus:border-accent transition-colors"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-accent hover:bg-accent-hover text-text-on-accent font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer min-h-[44px]"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  로그인 중...
                </span>
              ) : (
                "로그인"
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-xs text-text-muted">
            국토연구원 전산통합유지보수 관리시스템
          </p>
        </div>
      </div>
    </div>
  );
}
