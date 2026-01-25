'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

interface Comment {
  id: number;
  content: string;
  is_internal: boolean;
  created_by_name: string;
  created_at: string;
}

interface Ticket {
  id: number;
  title: string;
  description: string;
  priority: string;
  priority_display: string;
  status: string;
  status_display: string;
  requester_name: string;
  assigned_to_name: string | null;
  comments: Comment[];
  created_at: string;
  updated_at: string;
}

const PRIORITY_COLORS: Record<string, string> = {
  critical: "bg-red-100 text-red-800",
  high: "bg-orange-100 text-orange-800",
  medium: "bg-yellow-100 text-yellow-800",
  low: "bg-green-100 text-green-800",
};

const STATUS_COLORS: Record<string, string> = {
  open: "bg-blue-100 text-blue-800",
  in_progress: "bg-purple-100 text-purple-800",
  resolved: "bg-green-100 text-green-800",
  closed: "bg-gray-100 text-gray-800",
};

export default function TicketDetailPage() {
  const params = useParams();
  const ticketId = params.ticketId as string;
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [commentContent, setCommentContent] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchTicket = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/v1/tickets/${ticketId}/`,
          {
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
          }
        );

        if (!response.ok) {
          throw new Error('티켓을 불러오지 못했습니다');
        }

        const data = await response.json();
        setTicket(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    if (ticketId) {
      fetchTicket();
    }
  }, [ticketId]);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentContent.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/v1/tickets/${ticketId}/add_comment/`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            content: commentContent,
            is_internal: isInternal,
          }),
        }
      );

      if (response.ok) {
        const updatedTicket = await response.json();
        setTicket(updatedTicket);
        setCommentContent("");
        setIsInternal(false);
      }
    } catch (err) {
      console.error('Failed to add comment:', err);
    } finally {
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

  if (error) {
    return (
      <div className="p-6">
        <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-md">{error}</div>
        <Link href="/tickets" className="text-blue-600 hover:underline">
          티켓 목록으로
        </Link>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-500">티켓을 찾을 수 없습니다</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Back Button */}
      <div className="mb-6">
        <Link href="/tickets" className="text-blue-600 hover:underline text-sm">
          ← 티켓 목록으로
        </Link>
      </div>

      {/* Main Content */}
      <div className="bg-white shadow-sm rounded-lg p-6 mb-6">
        {/* Header */}
        <div className="mb-6 pb-6 border-b">
          <h1 className="text-3xl font-bold mb-4">{ticket.title}</h1>

          {/* Badges */}
          <div className="flex gap-2 mb-4">
            <span className={`px-3 py-1 rounded-full text-sm ${PRIORITY_COLORS[ticket.priority] || "bg-gray-100 text-gray-800"}`}>
              {ticket.priority_display}
            </span>
            <span className={`px-3 py-1 rounded-full text-sm ${STATUS_COLORS[ticket.status] || "bg-gray-100 text-gray-800"}`}>
              {ticket.status_display}
            </span>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-600 mb-1">요청자</h3>
              <p className="text-gray-900">{ticket.requester_name}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-600 mb-1">담당자</h3>
              <p className="text-gray-900">{ticket.assigned_to_name || "-"}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-600 mb-1">생성일</h3>
              <p className="text-gray-900">
                {new Date(ticket.created_at).toLocaleString('ko-KR')}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-600 mb-1">최종 수정일</h3>
              <p className="text-gray-900">
                {new Date(ticket.updated_at).toLocaleString('ko-KR')}
              </p>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">설명</h2>
          <div className="bg-gray-50 rounded-lg p-6 whitespace-pre-wrap">
            {ticket.description}
          </div>
        </div>

        {/* Comments */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-4">코멘트 ({ticket.comments.length})</h2>
          
          {ticket.comments.length === 0 ? (
            <p className="text-gray-500 text-center py-4">코멘트가 없습니다</p>
          ) : (
            <div className="space-y-4 mb-6">
              {ticket.comments.map((comment) => (
                <div
                  key={comment.id}
                  className={`border rounded-lg p-4 ${
                    comment.is_internal ? 'border-yellow-200 bg-yellow-50' : 'border-gray-200 bg-white'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{comment.created_by_name}</span>
                      {comment.is_internal && (
                        <span className="px-2 py-1 bg-yellow-200 text-yellow-800 text-xs rounded-full">
                          내부
                        </span>
                      )}
                    </div>
                    <span className="text-sm text-gray-600">
                      {new Date(comment.created_at).toLocaleString('ko-KR')}
                    </span>
                  </div>
                  <p className="text-gray-700 whitespace-pre-wrap">{comment.content}</p>
                </div>
              ))}
            </div>
          )}

          {/* Add Comment Form */}
          <form onSubmit={handleAddComment} className="border-t pt-6">
            <h3 className="text-md font-semibold mb-3">코멘트 추가</h3>
            <textarea
              value={commentContent}
              onChange={(e) => setCommentContent(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
              placeholder="코멘트를 입력하세요..."
            />
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="is_internal"
                  type="checkbox"
                  checked={isInternal}
                  onChange={(e) => setIsInternal(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="is_internal" className="ml-2 text-sm text-gray-700">
                  내부 코멘트 (고객에게 표시 안 됨)
                </label>
              </div>
              <button
                type="submit"
                disabled={isSubmitting || !commentContent.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? '추가 중...' : '코멘트 추가'}
              </button>
            </div>
          </form>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-6 border-t">
          <Link
            href={`/tickets/${ticket.id}/edit`}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            수정
          </Link>
          <Link
            href="/tickets"
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
          >
            목록
          </Link>
        </div>
      </div>
    </div>
  );
}
