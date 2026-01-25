'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface KBArticle {
  id: number;
  title: string;
  content: string;
  category_name: string;
  author_name: string;
  tags: string;
  view_count: number;
  helpful_count: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export default function KBArticleDetailPage() {
  const params = useParams();
  const articleId = params.articleId as string;
  const [article, setArticle] = useState<KBArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/v1/kb/articles/${articleId}/`,
          {
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
          }
        );

        if (!response.ok) {
          throw new Error('아티클을 불러오지 못했습니다');
        }

        const data = await response.json();
        setArticle(data);

        // Increment view count
        await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/v1/kb/articles/${articleId}/increment_views/`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
          }
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    if (articleId) {
      fetchArticle();
    }
  }, [articleId]);

  const handleHelpfulVote = async () => {
    if (hasVoted) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/v1/kb/articles/${articleId}/mark_helpful/`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        }
      );

      if (response.ok) {
        setHasVoted(true);
        if (article) {
          setArticle({ ...article, helpful_count: article.helpful_count + 1 });
        }
      }
    } catch (err) {
      console.error('Failed to mark as helpful:', err);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-500">로딩 중...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-md">{error}</div>
        <Link href="/kb" className="text-blue-600 hover:underline">
          지식베이스 목록으로
        </Link>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-500">아티클을 찾을 수 없습니다</div>
      </div>
    );
  }

  const tags = article.tags ? article.tags.split(',').map(t => t.trim()).filter(Boolean) : [];

  return (
    <div className="p-6">
      {/* Back Button */}
      <div className="mb-6">
        <Link href="/kb" className="text-blue-600 hover:underline text-sm">
          ← 지식베이스 목록으로
        </Link>
      </div>

      {/* Main Content */}
      <div className="bg-white shadow-sm rounded-lg p-6 mb-6">
        {/* Header */}
        <div className="mb-6 pb-6 border-b">
          <h1 className="text-3xl font-bold mb-4">{article.title}</h1>

          {/* Metadata Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-600 mb-1">카테고리</h3>
              <p className="text-gray-900">{article.category_name || "-"}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-600 mb-1">작성자</h3>
              <p className="text-gray-900">{article.author_name || "-"}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-600 mb-1">조회수</h3>
              <p className="text-gray-900">{article.view_count}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-600 mb-1">유용함</h3>
              <p className="text-gray-900">{article.helpful_count}</p>
            </div>
          </div>

          {/* Tags */}
          {tags.length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-medium text-gray-600 mb-2">태그</h3>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Markdown Content */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">내용</h2>
          <div className="prose prose-sm max-w-none bg-gray-50 rounded-lg p-6">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {article.content}
            </ReactMarkdown>
          </div>
        </div>

        {/* Helpful Button */}
        <div className="mb-6 pb-6 border-b">
          <h2 className="text-lg font-semibold mb-3">이 아티클이 도움이 되었나요?</h2>
          <button
            onClick={handleHelpfulVote}
            disabled={hasVoted}
            className={`px-6 py-3 rounded-md font-medium transition-colors ${
              hasVoted
                ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {hasVoted ? '투표 완료' : '👍 유용함'}
          </button>
          {hasVoted && (
            <p className="mt-2 text-sm text-gray-600">피드백 감사합니다!</p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-6 border-t">
          <Link
            href={`/kb/${article.id}/edit`}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            수정
          </Link>
          <Link
            href="/kb"
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
          >
            목록
          </Link>
        </div>
      </div>
    </div>
  );
}
