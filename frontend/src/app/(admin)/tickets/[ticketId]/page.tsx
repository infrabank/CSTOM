'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Breadcrumb from "@/components/ui/breadcrumb";
import { getAccessToken } from "@/lib/auth";

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
  critical: "bg-danger-bg text-danger",
  high: "bg-warning-bg text-warning",
  medium: "bg-warning-bg text-warning",
  low: "bg-success-bg text-success",
};

const STATUS_COLORS: Record<string, string> = {
   open: "bg-info-bg text-info",
   in_progress: "bg-info-bg text-info",
   resolved: "bg-success-bg text-success",
   closed: "bg-surface-sunken text-text-muted",
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
        const token = getAccessToken();
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/v1/tickets/${ticketId}/`,
          {
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            },
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
      const token = getAccessToken();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/v1/tickets/${ticketId}/add_comment/`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            content: commentContent,
            is_internal: isInternal,
          }),
        }
      );

      if (response.ok) {
        // Re-fetch the full ticket to get updated comments list
        const ticketToken = getAccessToken();
        const ticketRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/v1/tickets/${ticketId}/`,
          {
            headers: {
              'Content-Type': 'application/json',
              ...(ticketToken ? { 'Authorization': `Bearer ${ticketToken}` } : {}),
            },
          }
        );
        if (ticketRes.ok) {
          const updatedTicket = await ticketRes.json();
          setTicket(updatedTicket);
        }
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
        <Link href="/tickets" className="text-accent hover:underline">
          티켓 목록으로
        </Link>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div>
        <Breadcrumb />
        <div className="text-center text-text-muted">티켓을 찾을 수 없습니다</div>
      </div>
    );
  }

  return (
    <div>
      <Breadcrumb />
      {/* Back Button */}
      <div className="mb-6">
        <Link href="/tickets" className="text-accent hover:underline text-sm">
          ← 티켓 목록으로
        </Link>
      </div>

      {/* Main Content */}
      <div className="bg-surface shadow-card rounded-lg p-6 mb-6">
        {/* Header */}
        <div className="mb-6 pb-6 border-b">
          <h1 className="text-3xl font-semibold text-text mb-4">{ticket.title}</h1>

           {/* Badges */}
           <div className="flex gap-2 mb-4">
             <span className={`px-3 py-1 rounded-full text-sm ${PRIORITY_COLORS[ticket.priority] || "bg-surface-sunken text-text-muted"}`}>
               {ticket.priority_display}
             </span>
             <span className={`px-3 py-1 rounded-full text-sm ${STATUS_COLORS[ticket.status] || "bg-surface-sunken text-text-muted"}`}>
               {ticket.status_display}
             </span>
           </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <h3 className="text-sm font-medium text-text-muted mb-1">요청자</h3>
              <p className="text-text">{ticket.requester_name}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-text-muted mb-1">담당자</h3>
              <p className="text-text">{ticket.assigned_to_name || "-"}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-text-muted mb-1">생성일</h3>
              <p className="text-text">
                {new Date(ticket.created_at).toLocaleString('ko-KR')}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-text-muted mb-1">최종 수정일</h3>
              <p className="text-text">
                {new Date(ticket.updated_at).toLocaleString('ko-KR')}
              </p>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">설명</h2>
          <div className="bg-surface-sunken rounded-lg p-6 whitespace-pre-wrap">
            {ticket.description}
          </div>
        </div>

        {/* Comments */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-4">코멘트 ({ticket.comments.length})</h2>
          
          {ticket.comments.length === 0 ? (
            <p className="text-text-muted text-center py-4">코멘트가 없습니다</p>
          ) : (
            <div className="space-y-4 mb-6">
              {ticket.comments.map((comment) => (
                <div
                  key={comment.id}
                  className={`border rounded-lg p-4 ${
                    comment.is_internal ? 'border-warning-border bg-warning-bg' : 'border-border-light bg-surface'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-text">{comment.created_by_name}</span>
                      {comment.is_internal && (
                        <span className="px-2 py-1 bg-warning-bg text-warning text-xs rounded-full">
                          내부
                        </span>
                      )}
                    </div>
                    <span className="text-sm text-text-muted">
                      {new Date(comment.created_at).toLocaleString('ko-KR')}
                    </span>
                  </div>
                  <p className="text-text-secondary whitespace-pre-wrap">{comment.content}</p>
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
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-3 focus:ring-accent/30 mb-3"
              placeholder="코멘트를 입력하세요..."
            />
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="is_internal"
                  type="checkbox"
                  checked={isInternal}
                  onChange={(e) => setIsInternal(e.target.checked)}
                  className="w-4 h-4 text-accent border-border rounded focus:ring-accent/30"
                />
                <label htmlFor="is_internal" className="ml-2 text-sm text-text-secondary">
                  내부 코멘트 (고객에게 표시 안 됨)
                </label>
              </div>
              <button
                type="submit"
                disabled={isSubmitting || !commentContent.trim()}
                className="px-4 py-2 bg-accent text-white rounded-md hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed"
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
            className="px-4 py-2 bg-accent text-white rounded-md hover:bg-accent-hover transition-colors"
          >
            수정
          </Link>
          <Link
            href="/tickets"
            className="px-4 py-2 border border-border text-text-secondary rounded-md hover:bg-surface-sunken transition-colors"
          >
            목록
          </Link>
        </div>
      </div>
    </div>
  );
}
