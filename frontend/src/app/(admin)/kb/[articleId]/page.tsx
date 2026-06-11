'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Breadcrumb from "@/components/ui/breadcrumb";
import ConfirmModal from "@/components/confirm-modal";

const MarkdownRenderer = dynamic(() => import('@/components/markdown-renderer'), {
  loading: () => <div className="animate-pulse h-20 bg-surface-sunken rounded" />,
});
import { getAccessToken } from "@/lib/auth";

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
  const router = useRouter();
  const articleId = params.articleId as string;
  const [article, setArticle] = useState<KBArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        setLoading(true);
        const token = getAccessToken();
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        };
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/v1/kb/articles/${articleId}/`,
          { headers }
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
            headers,
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
      const token = getAccessToken();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/v1/kb/articles/${articleId}/mark_helpful/`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
          },
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

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const token = getAccessToken();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/v1/kb/articles/${articleId}/`,
        {
          method: 'DELETE',
          headers: {
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        }
      );
      if (!response.ok) {
        throw new Error('삭제에 실패했습니다');
      }
      router.push('/kb');
    } catch (err) {
      setError(err instanceof Error ? err.message : '삭제에 실패했습니다');
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div>
        <Breadcrumb />
        <div className="text-center text-text-muted">로딩 중...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <Breadcrumb />
        <div className="mb-4 p-4 bg-danger-bg text-danger rounded-md">{error}</div>
        <Link href="/kb" className="text-accent hover:underline">
          지식베이스 목록으로
        </Link>
      </div>
    );
  }

  if (!article) {
    return (
      <div>
        <Breadcrumb />
        <div className="text-center text-text-muted">아티클을 찾을 수 없습니다</div>
      </div>
    );
  }

  const tags = article.tags ? article.tags.split(',').map(t => t.trim()).filter(Boolean) : [];

  return (
    <div className="p-6">
       {/* Back Button */}
       <div className="mb-6">
         <Link href="/kb" className="text-accent hover:underline text-sm">
           ← 지식베이스 목록으로
         </Link>
       </div>

       {/* Main Content */}
       <div className="bg-surface shadow-card rounded-lg p-6 mb-6">
        {/* Header */}
        <div className="mb-6 pb-6 border-b">
          <h1 className="text-3xl font-bold mb-4">{article.title}</h1>

           {/* Metadata Grid */}
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
             <div>
               <h3 className="text-sm font-medium text-text-muted mb-1">카테고리</h3>
               <p className="text-text">{article.category_name || "-"}</p>
             </div>
             <div>
               <h3 className="text-sm font-medium text-text-muted mb-1">작성자</h3>
               <p className="text-text">{article.author_name || "-"}</p>
             </div>
             <div>
               <h3 className="text-sm font-medium text-text-muted mb-1">조회수</h3>
               <p className="text-text">{article.view_count}</p>
             </div>
             <div>
               <h3 className="text-sm font-medium text-text-muted mb-1">유용함</h3>
               <p className="text-text">{article.helpful_count}</p>
             </div>
           </div>

           {/* Tags */}
           {tags.length > 0 && (
             <div className="mt-4">
               <h3 className="text-sm font-medium text-text-muted mb-2">태그</h3>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-info-bg text-info rounded-full text-sm"
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
           <div className="prose prose-sm max-w-none bg-surface-sunken rounded-lg p-6">
            <MarkdownRenderer>
              {article.content}
            </MarkdownRenderer>
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
                 ? 'bg-surface-sunken text-text-muted cursor-not-allowed'
                 : 'bg-success text-text-on-accent hover:bg-success/90'
             }`}
           >
             {hasVoted ? '투표 완료' : '👍 유용함'}
           </button>
           {hasVoted && (
             <p className="mt-2 text-sm text-text-muted">피드백 감사합니다!</p>
           )}
        </div>

         {/* Action Buttons */}
         <div className="flex gap-3 pt-6 border-t">
           <Link
             href={`/kb/${article.id}/edit`}
              className="px-4 py-2 bg-accent text-text-on-accent rounded-md hover:bg-accent-hover transition-colors"
           >
             수정
           </Link>
           <button
             onClick={() => setShowDeleteConfirm(true)}
             disabled={isDeleting}
             className="px-4 py-2 bg-danger text-text-on-accent rounded-md hover:bg-danger/90 transition-colors disabled:opacity-50"
           >
             {isDeleting ? '삭제 중...' : '삭제'}
           </button>
           <Link
             href="/kb"
             className="px-4 py-2 border border-border text-text-secondary rounded-md hover:bg-surface-sunken transition-colors"
           >
             목록
           </Link>
         </div>
      </div>
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="아티클 삭제"
        message="이 아티클을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
        confirmText="삭제"
        isDestructive
        isLoading={isDeleting}
      />
    </div>
  );
}
