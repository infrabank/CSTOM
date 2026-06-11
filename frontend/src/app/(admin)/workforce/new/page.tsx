"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  workforceClient,
  type WorkforceUser as User,
  type WorkforceEngineerRef as ExistingEngineer,
} from "../api";

export default function NewEngineerPage() {
  const router = useRouter();
  const [userId, setUserId] = useState("");
  const [skillsInput, setSkillsInput] = useState("");
  const [specializationsInput, setSpecializationsInput] = useState("");

  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch all users + existing engineer profiles (to exclude
        // already-registered users) in parallel.
        const [usersData, engineersData] = await Promise.all([
          workforceClient.listUsers(),
          workforceClient.listEngineers(),
        ]);
        const allUsers: User[] = Array.isArray(usersData)
          ? usersData
          : usersData.results || [];
        const existingEngineers: ExistingEngineer[] = Array.isArray(engineersData)
          ? engineersData
          : engineersData.results || [];

        const registeredUserIds = new Set(existingEngineers.map((e) => e.user));
        setAvailableUsers(allUsers.filter((u) => !registeredUserIds.has(u.id)));
      } catch (err) {
        console.error("Failed to fetch data:", err);
        setError("데이터를 불러올 수 없습니다");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const getUserDisplayName = (user: User) => {
    const name = user.display_name || user.username;
    return `${name} (${user.email})`;
  };

  const parseCommaSeparated = (input: string): string[] => {
    return input
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const skills = parseCommaSeparated(skillsInput);
      const specializations = parseCommaSeparated(specializationsInput);

      await workforceClient.createEngineer({
        user: parseInt(userId),
        skills,
        specializations,
      });

      router.push("/workforce");
    } catch (err) {
      setError(err instanceof Error ? err.message : "등록에 실패했습니다");
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center text-text-muted">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <Link href="/workforce" className="text-accent hover:underline text-sm">
          인력 관리로
        </Link>
      </div>

      <div className="bg-surface shadow-card rounded-lg p-6 max-w-2xl border border-border-light">
        <h1 className="text-2xl font-bold mb-6">엔지니어 등록</h1>

        {error && (
          <div className="mb-4 p-4 bg-danger-bg text-danger rounded-md">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* User Selection */}
          <div>
            <label
              htmlFor="user"
              className="block text-sm font-medium text-text mb-1"
            >
              사용자 <span className="text-danger">*</span>
            </label>
            <select
              id="user"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              required
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="">사용자 선택</option>
              {availableUsers.map((user) => (
                <option key={user.id} value={user.id}>
                  {getUserDisplayName(user)}
                </option>
              ))}
            </select>
            {availableUsers.length === 0 && (
              <p className="mt-1 text-xs text-text-muted">
                등록 가능한 사용자가 없습니다. 모든 사용자가 이미 엔지니어로 등록되어 있습니다.
              </p>
            )}
          </div>

          {/* Skills */}
          <div>
            <label
              htmlFor="skills"
              className="block text-sm font-medium text-text mb-1"
            >
              기술스택
            </label>
            <input
              type="text"
              id="skills"
              value={skillsInput}
              onChange={(e) => setSkillsInput(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
              placeholder="예: Linux, Docker, Kubernetes (쉼표로 구분)"
            />
            <p className="mt-1 text-xs text-text-muted">
              쉼표(,)로 구분하여 입력하세요
            </p>
          </div>

          {/* Specializations */}
          <div>
            <label
              htmlFor="specializations"
              className="block text-sm font-medium text-text mb-1"
            >
              전문분야
            </label>
            <input
              type="text"
              id="specializations"
              value={specializationsInput}
              onChange={(e) => setSpecializationsInput(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
              placeholder="예: 네트워크, 서버관리, 보안 (쉼표로 구분)"
            />
            <p className="mt-1 text-xs text-text-muted">
              쉼표(,)로 구분하여 입력하세요
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={isSubmitting || !userId}
              className="px-4 py-2 bg-accent text-text-on-accent rounded-md hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {isSubmitting ? "등록 중..." : "등록"}
            </button>
            <Link
              href="/workforce"
              className="px-4 py-2 border border-border rounded-md hover:bg-surface-sunken text-text-secondary text-sm"
            >
              취소
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
