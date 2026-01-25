"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";

interface Category {
  id: number;
  name: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export default function NewSOPPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [content, setContent] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const token = document.cookie
          .split("; ")
          .find((row) => row.startsWith("cstom_access_token="))
          ?.split("=")[1];

        const res = await fetch(`${API_URL}/v1/sop/categories/`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (!res.ok) throw new Error("Failed to fetch categories");
        const data = await res.json();
        setCategories(data.results || []);
      } catch (err) {
        setError("카테고리를 불러올 수 없습니다");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("cstom_access_token="))
        ?.split("=")[1];

      if (!token) {
        setError("인증 토큰이 없습니다");
        setIsSubmitting(false);
        return;
      }

      // Step 1: Create document
      const docRes = await fetch(`${API_URL}/v1/sop/documents/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          category: categoryId ? parseInt(categoryId) : null,
        }),
      });

      if (!docRes.ok) {
        const errData = await docRes.json();
        throw new Error(errData.detail || "문서 생성에 실패했습니다");
      }

      const docData = await docRes.json();
      const documentId = docData.id;

      // Step 2: Create version
      const versionRes = await fetch(`${API_URL}/v1/sop/versions/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          document: documentId,
          version_number: 1,
          content,
          created_by: null, // API will use authenticated user
        }),
      });

      if (!versionRes.ok) {
        const errData = await versionRes.json();
        throw new Error(errData.detail || "버전 생성에 실패했습니다");
      }

      // Redirect to document view
      router.push(`/sop/${documentId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "저장에 실패했습니다");
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-600">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <Link href="/sop" className="text-blue-600 hover:underline text-sm">
          SOP 목록으로
        </Link>
      </div>

      <div className="bg-white shadow-sm rounded-lg p-6 max-w-6xl">
        <h1 className="text-2xl font-bold mb-6">새 SOP 작성</h1>

        {error && (
          <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-md">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-black mb-1">
              제목 *
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="SOP 제목을 입력하세요"
            />
          </div>

          {/* Category */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-black mb-1">
              카테고리
            </label>
            <select
              id="category"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">카테고리 선택</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Content Editor with Preview */}
          <div>
            <label className="block text-sm font-medium text-black mb-2">
              내용 *
            </label>

            {/* Tabs */}
            <div className="flex gap-2 mb-3 border-b border-gray-200">
              <button
                type="button"
                onClick={() => setActiveTab("edit")}
                className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                  activeTab === "edit"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-600 hover:text-gray-900"
                }`}
              >
                편집
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("preview")}
                className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                  activeTab === "preview"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-600 hover:text-gray-900"
                }`}
              >
                미리보기
              </button>
            </div>

            {/* Editor Tab */}
            {activeTab === "edit" && (
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                rows={15}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                placeholder="마크다운 형식으로 내용을 입력하세요"
              />
            )}

            {/* Preview Tab */}
            {activeTab === "preview" && (
              <div className="min-h-96 p-4 border border-gray-300 rounded-md bg-gray-50 prose prose-sm max-w-none">
                <ReactMarkdown
                  components={{
                    h1: ({ node, ...props }) => (
                      <h1 className="text-2xl font-bold mt-4 mb-2" {...props} />
                    ),
                    h2: ({ node, ...props }) => (
                      <h2 className="text-xl font-bold mt-3 mb-2" {...props} />
                    ),
                    h3: ({ node, ...props }) => (
                      <h3 className="text-lg font-bold mt-2 mb-1" {...props} />
                    ),
                    p: ({ node, ...props }) => (
                      <p className="mb-2 text-gray-700" {...props} />
                    ),
                    ul: ({ node, ...props }) => (
                      <ul className="list-disc list-inside mb-2 text-gray-700" {...props} />
                    ),
                    ol: ({ node, ...props }) => (
                      <ol className="list-decimal list-inside mb-2 text-gray-700" {...props} />
                    ),
                    li: ({ node, ...props }) => (
                      <li className="mb-1" {...props} />
                    ),
                    code: ({ node, ...props }: any) =>
                      props.inline ? (
                        <code className="bg-gray-200 px-1 py-0.5 rounded text-sm" {...props} />
                      ) : (
                        <code className="block bg-gray-200 p-2 rounded mb-2 overflow-x-auto" {...props} />
                      ),
                    blockquote: ({ node, ...props }) => (
                      <blockquote className="border-l-4 border-gray-300 pl-4 italic text-gray-600 mb-2" {...props} />
                    ),
                    table: ({ node, ...props }) => (
                      <table className="border-collapse border border-gray-300 mb-2" {...props} />
                    ),
                    th: ({ node, ...props }) => (
                      <th className="border border-gray-300 px-2 py-1 bg-gray-100" {...props} />
                    ),
                    td: ({ node, ...props }) => (
                      <td className="border border-gray-300 px-2 py-1" {...props} />
                    ),
                  }}
                >
                  {content || "내용을 입력하면 여기에 미리보기가 표시됩니다"}
                </ReactMarkdown>
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={isSubmitting || !title || !content}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "저장 중..." : "저장"}
            </button>
            <Link
              href="/sop"
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-gray-700"
            >
              취소
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
