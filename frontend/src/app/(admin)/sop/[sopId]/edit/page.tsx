'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

interface Category {
  id: number;
  name: string;
}

interface CurrentVersion {
  id: number;
  version_number: number;
  content: string;
  created_by_name: string;
  created_at: string;
}

interface SOPDocument {
  id: number;
  title: string;
  category: number;
  category_name: string;
  author_name: string;
  current_version: CurrentVersion;
  created_at: string;
  updated_at: string;
}

export default function EditSOPPage() {
  const router = useRouter();
  const params = useParams();
  const sopId = params.sopId as string;

  const [document, setDocument] = useState<SOPDocument | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    category: '',
    content: '',
  });

  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch document
        const docRes = await fetch(
          `${API_URL}/v1/sop/documents/${sopId}/`,
          {
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
          }
        );

        if (!docRes.ok) {
          throw new Error('SOP 문서를 불러오지 못했습니다');
        }

        const docData: SOPDocument = await docRes.json();
        setDocument(docData);
        setFormData({
          title: docData.title,
          category: docData.category.toString(),
          content: docData.current_version.content,
        });

        // Fetch categories
        const catRes = await fetch(`${API_URL}/v1/sop/categories/`, {
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
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

    if (sopId) {
      fetchData();
    }
  }, [sopId]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      if (!document) {
        throw new Error('문서 정보를 찾을 수 없습니다');
      }

      // Step 1: Update document title and category
      const updateRes = await fetch(
        `${API_URL}/v1/sop/documents/${sopId}/`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            title: formData.title,
            category: parseInt(formData.category, 10),
          }),
        }
      );

      if (!updateRes.ok) {
        throw new Error('문서 정보 업데이트에 실패했습니다');
      }

      // Step 2: Create new version
      const versionRes = await fetch(`${API_URL}/v1/sop/versions/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          document: parseInt(sopId, 10),
          version_number: document.current_version.version_number + 1,
          content: formData.content,
          created_by: document.author_name,
        }),
      });

      if (!versionRes.ok) {
        throw new Error('새 버전 생성에 실패했습니다');
      }

      // Redirect to detail page
      router.push(`/sop/${sopId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : '저장에 실패했습니다');
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-500">로딩 중...</div>
      </div>
    );
  }

  if (error && !document) {
    return (
      <div className="p-6">
        <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-md">{error}</div>
        <Link href="/sop" className="text-blue-600 hover:underline">
          SOP 목록으로
        </Link>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-500">문서를 찾을 수 없습니다</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Back Button */}
      <div className="mb-6">
        <Link href={`/sop/${sopId}`} className="text-blue-600 hover:underline text-sm">
          ← SOP 상세로
        </Link>
      </div>

      {/* Main Content */}
      <div className="bg-white shadow-sm rounded-lg p-6 max-w-6xl">
        <h1 className="text-2xl font-bold mb-6">SOP 수정</h1>

        {error && (
          <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-md">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              제목 *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            />
          </div>

          {/* Category Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              카테고리 *
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            >
              <option value="">카테고리를 선택하세요</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Content Field with Preview */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                내용 *
              </label>
              <button
                type="button"
                onClick={() => setShowPreview(!showPreview)}
                className="text-sm text-blue-600 hover:underline"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm text-gray-900"
              />
            ) : (
              <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 min-h-96">
                <div className="prose prose-sm max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {formData.content}
                  </ReactMarkdown>
                </div>
              </div>
            )}
          </div>

          {/* Version Info */}
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-sm text-gray-700">
              <span className="font-medium">현재 버전:</span> v{document.current_version.version_number}
            </p>
            <p className="text-sm text-gray-700 mt-1">
              <span className="font-medium">새 버전:</span> v{document.current_version.version_number + 1}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? '저장 중...' : '저장'}
            </button>
            <Link
              href={`/sop/${sopId}`}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              취소
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
