"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";

interface Category {
  id: number;
  name: string;
}

interface Template {
  id: number;
  name: string;
  incident_type: string;
  incident_type_display: string;
  template_content: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export default function NewKBArticlePage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [isPublished, setIsPublished] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");

  // Fetch categories and templates on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = document.cookie
          .split("; ")
          .find((row) => row.startsWith("cstom_access_token="))
          ?.split("=")[1];

        const [catRes, tempRes] = await Promise.all([
          fetch(`${API_URL}/v1/kb/categories/`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          }),
          fetch(`${API_URL}/v1/kb/templates/`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          }),
        ]);

        if (catRes.ok) {
          const catData = await catRes.json();
          setCategories(catData.results || []);
        }

        if (tempRes.ok) {
          const tempData = await tempRes.json();
          setTemplates(tempData.results || []);
        }
      } catch (err) {
        setError("데이터를 불러올 수 없습니다");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleTemplateSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const templateId = e.target.value;
    setSelectedTemplate(templateId);

    if (templateId) {
      const template = templates.find(t => t.id.toString() === templateId);
      if (template) {
        setContent(template.template_content);
      }
    }
  };

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

      const res = await fetch(`${API_URL}/v1/kb/articles/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          content,
          category: categoryId ? parseInt(categoryId) : null,
          tags,
          is_published: isPublished,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "아티클 생성에 실패했습니다");
      }

      const data = await res.json();
      router.push(`/kb/${data.id}`);
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
        <Link href="/kb" className="text-blue-600 hover:underline text-sm">
          지식베이스 목록으로
        </Link>
      </div>

      <div className="bg-white shadow-sm rounded-lg p-6 max-w-6xl">
        <h1 className="text-2xl font-bold mb-6">새 아티클 작성</h1>

        {error && (
          <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-md">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Template Selector */}
          <div>
            <label htmlFor="template" className="block text-sm font-medium text-black mb-1">
              템플릿 선택 (선택사항)
            </label>
            <select
              id="template"
              value={selectedTemplate}
              onChange={handleTemplateSelect}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">템플릿 없이 작성</option>
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name} ({template.incident_type_display})
                </option>
              ))}
            </select>
          </div>

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
              placeholder="아티클 제목을 입력하세요"
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

          {/* Tags */}
          <div>
            <label htmlFor="tags" className="block text-sm font-medium text-black mb-1">
              태그 (쉼표로 구분)
            </label>
            <input
              id="tags"
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="예: 네트워크, 장애, 해결방법"
            />
          </div>

          {/* Published Status */}
          <div className="flex items-center">
            <input
              id="is_published"
              type="checkbox"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="is_published" className="ml-2 text-sm font-medium text-black">
              공개
            </label>
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
                <ReactMarkdown>
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
              href="/kb"
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
