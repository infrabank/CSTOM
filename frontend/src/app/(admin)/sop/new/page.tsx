"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { sopClient, type SOPCategory as Category } from "../api";

const MarkdownRenderer = dynamic(() => import("@/components/markdown-renderer"), {
  loading: () => <div className="animate-pulse h-20 bg-surface-sunken rounded" />,
});

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
        const data = await sopClient.listCategories();
        setCategories(Array.isArray(data) ? data : data.results || []);
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
      // Step 1: Create document
      const docData = await sopClient.createDocument({
        title,
        category: categoryId ? parseInt(categoryId) : null,
      });
      const documentId = docData.id;

      // Step 2: Create version via document's custom action
      await sopClient.createVersion(documentId, content);

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
         <div className="text-center text-text-muted">로딩 중...</div>
       </div>
     );
   }

  return (
    <div className="p-6">
       <div className="mb-6">
         <Link href="/sop" className="text-accent hover:underline text-sm">
           SOP 목록으로
         </Link>
       </div>

       <div className="bg-surface shadow-card rounded-lg p-6 max-w-6xl">
        <h1 className="text-2xl font-bold mb-6">새 SOP 작성</h1>

         {error && (
           <div className="mb-4 p-4 bg-danger-bg text-danger rounded-md">
             {error}
           </div>
         )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
             <label htmlFor="title" className="block text-sm font-medium text-text mb-1">
               제목 *
             </label>
             <input
               id="title"
               type="text"
               value={title}
               onChange={(e) => setTitle(e.target.value)}
               required
               className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
               placeholder="SOP 제목을 입력하세요"
             />
          </div>

          {/* Category */}
          <div>
             <label htmlFor="category" className="block text-sm font-medium text-text mb-1">
               카테고리
             </label>
             <select
               id="category"
               value={categoryId}
               onChange={(e) => setCategoryId(e.target.value)}
               className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
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
             <label className="block text-sm font-medium text-text mb-2">
               내용 *
             </label>

             {/* Tabs */}
             <div className="flex gap-2 mb-3 border-b border-border-light">
              <button
                type="button"
                onClick={() => setActiveTab("edit")}
                 className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                   activeTab === "edit"
                     ? "border-accent text-accent"
                     : "border-transparent text-text-muted hover:text-text"
                 }`}
              >
                편집
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("preview")}
                 className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                   activeTab === "preview"
                     ? "border-accent text-accent"
                     : "border-transparent text-text-muted hover:text-text"
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
                 className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent font-mono text-sm"
                 placeholder="마크다운 형식으로 내용을 입력하세요"
               />
            )}

            {/* Preview Tab */}
            {activeTab === "preview" && (
               <div className="min-h-96 p-4 border border-border rounded-md bg-surface-sunken prose prose-sm max-w-none">
                <MarkdownRenderer
                  components={{
                    h1: (props) => (
                      <h1 className="text-2xl font-bold mt-4 mb-2" {...props} />
                    ),
                    h2: (props) => (
                      <h2 className="text-xl font-bold mt-3 mb-2" {...props} />
                    ),
                    h3: (props) => (
                      <h3 className="text-lg font-bold mt-2 mb-1" {...props} />
                    ),
                    p: (props) => (
                      <p className="mb-2 text-text-secondary" {...props} />
                    ),
                    ul: (props) => (
                      <ul className="list-disc list-inside mb-2 text-text-secondary" {...props} />
                    ),
                    ol: (props) => (
                      <ol className="list-decimal list-inside mb-2 text-text-secondary" {...props} />
                    ),
                    li: (props) => (
                      <li className="mb-1" {...props} />
                    ),
                    code: (props) =>
                      'inline' in props && props.inline ? (
                        <code className="bg-surface-sunken px-1 py-0.5 rounded text-sm" {...props} />
                      ) : (
                        <code className="block bg-surface-sunken p-2 rounded mb-2 overflow-x-auto" {...props} />
                      ),
                    blockquote: (props) => (
                       <blockquote className="border-l-4 border-border pl-4 italic text-text-muted mb-2" {...props} />
                    ),
                    table: (props) => (
                       <table className="border-collapse border border-border mb-2" {...props} />
                    ),
                    th: (props) => (
                       <th className="border border-border px-2 py-1 bg-surface-sunken" {...props} />
                    ),
                    td: (props) => (
                       <td className="border border-border px-2 py-1" {...props} />
                    ),
                  }}
                >
                  {content || "내용을 입력하면 여기에 미리보기가 표시됩니다"}
                </MarkdownRenderer>
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={isSubmitting || !title || !content}
              className="px-4 py-2 bg-accent text-text-on-accent rounded-md hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "저장 중..." : "저장"}
            </button>
             <Link
               href="/sop"
               className="px-4 py-2 border border-border rounded-md hover:bg-surface-sunken text-text-secondary"
             >
               취소
             </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
