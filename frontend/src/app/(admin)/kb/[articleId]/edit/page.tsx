'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getAccessToken } from '@/lib/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

interface Category {
  id: number;
  name: string;
}

interface KBArticle {
  id: number;
  title: string;
  content: string;
  category: number | null;
  category_name: string;
  author_name: string;
  tags: string;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export default function EditKBArticlePage() {
  const router = useRouter();
  const params = useParams();
  const articleId = params.articleId as string;

  const [article, setArticle] = useState<KBArticle | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    category: '',
    content: '',
    tags: '',
    is_published: true,
  });

  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch article
        const token = getAccessToken();
        const authHeaders: HeadersInit = {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        };

        const articleRes = await fetch(
          `${API_URL}/v1/kb/articles/${articleId}/`,
          { headers: authHeaders }
        );

        if (!articleRes.ok) {
          throw new Error('아티클을 불러오지 못했습니다');
        }

        const articleData: KBArticle = await articleRes.json();
        setArticle(articleData);
        setFormData({
          title: articleData.title,
          category: articleData.category?.toString() || '',
          content: articleData.content,
          tags: articleData.tags || '',
          is_published: articleData.is_published,
        });

        // Fetch categories
        const catRes = await fetch(`${API_URL}/v1/kb/categories/`, {
          headers: authHeaders,
        });

        if (catRes.ok) {
          const catData = await catRes.json();
          setCategories(catData.results || catData || []);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    if (articleId) {
      fetchData();
    }
  }, [articleId]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({
        ...prev,
        [name]: checked,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      if (!article) {
        throw new Error('아티클 정보를 찾을 수 없습니다');
      }

      const token = getAccessToken();
      const updateRes = await fetch(
        `${API_URL}/v1/kb/articles/${articleId}/`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
          },
          body: JSON.stringify({
            title: formData.title,
            content: formData.content,
            category: formData.category ? parseInt(formData.category, 10) : null,
            tags: formData.tags,
            is_published: formData.is_published,
          }),
        }
      );

      if (!updateRes.ok) {
        throw new Error('아티클 업데이트에 실패했습니다');
      }

      // Redirect to detail page
      router.push(`/kb/${articleId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : '저장에 실패했습니다');
      setIsSubmitting(false);
    }
  };

   if (loading) {
     return (
       <div className="p-6">
         <div className="text-center text-text-muted">로딩 중...</div>
       </div>
     );
   }

   if (error && !article) {
     return (
       <div className="p-6">
         <div className="mb-4 p-4 bg-danger-bg text-danger rounded-md">{error}</div>
         <Link href="/kb" className="text-accent hover:underline">
           지식베이스 목록으로
         </Link>
       </div>
     );
   }

   if (!article) {
     return (
       <div className="p-6">
         <div className="text-center text-text-muted">아티클을 찾을 수 없습니다</div>
       </div>
     );
   }

  return (
    <div className="p-6">
      {/* Back Button */}
       <div className="mb-6">
         <Link href={`/kb/${articleId}`} className="text-accent hover:underline text-sm">
          ← 아티클 상세로
        </Link>
      </div>

      {/* Main Content */}
       <div className="bg-surface shadow-card rounded-lg p-6 max-w-6xl">
        <h1 className="text-2xl font-bold mb-6">아티클 수정</h1>

        {error && (
          <div className="mb-4 p-4 bg-danger-bg text-danger rounded-md">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
           {/* Title Field */}
           <div>
             <label className="block text-sm font-medium text-text-secondary mb-1">
               제목 *
             </label>
             <input
               type="text"
               name="title"
               value={formData.title}
               onChange={handleInputChange}
               required
               className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent text-text"
             />
           </div>

           {/* Category Field */}
           <div>
             <label className="block text-sm font-medium text-text-secondary mb-1">
               카테고리
             </label>
             <select
               name="category"
               value={formData.category}
               onChange={handleInputChange}
               className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent text-text"
             >
              <option value="">카테고리를 선택하세요</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

           {/* Tags Field */}
           <div>
             <label className="block text-sm font-medium text-text-secondary mb-1">
               태그 (쉼표로 구분)
             </label>
             <input
               type="text"
               name="tags"
               value={formData.tags}
               onChange={handleInputChange}
               className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent text-text"
               placeholder="예: 네트워크, 장애, 해결방법"
             />
           </div>

           {/* Published Status */}
           <div className="flex items-center">
             <input
               id="is_published"
               type="checkbox"
               name="is_published"
               checked={formData.is_published}
               onChange={handleInputChange}
               className="w-4 h-4 text-accent border-border rounded focus:ring-accent"
             />
             <label htmlFor="is_published" className="ml-2 text-sm font-medium text-text-secondary">
               공개
             </label>
           </div>

           {/* Content Field with Preview */}
           <div>
             <div className="flex items-center justify-between mb-2">
               <label className="block text-sm font-medium text-text-secondary">
                 내용 *
               </label>
               <button
                 type="button"
                 onClick={() => setShowPreview(!showPreview)}
                 className="text-sm text-accent hover:underline"
               >
                {showPreview ? '편집' : '미리보기'}
              </button>
            </div>

             {!showPreview ? (
               <textarea
                 name="content"
                 value={formData.content}
                 onChange={handleInputChange}
                 required
                 rows={15}
                 placeholder="마크다운 형식으로 내용을 입력하세요"
                 className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent font-mono text-sm text-text"
               />
             ) : (
               <div className="w-full px-3 py-2 border border-border rounded-md bg-surface-sunken min-h-96">
                <div className="prose prose-sm max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {formData.content}
                  </ReactMarkdown>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-accent text-text-on-accent rounded-md hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? '저장 중...' : '저장'}
            </button>
             <Link
               href={`/kb/${articleId}`}
               className="px-4 py-2 border border-border text-text-secondary rounded-md hover:bg-surface-sunken transition-colors"
             >
              취소
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
