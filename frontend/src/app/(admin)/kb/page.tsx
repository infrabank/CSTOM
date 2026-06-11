import Link from "next/link";
import { cookies } from "next/headers";
import Pagination from "@/components/ui/pagination";
import ResponsiveTable, { type Column } from "@/components/responsive-table";
import StatusBadge from "@/components/status-badge";
import {
  DEFAULT_PAGE_SIZE,
  fetchPaginated,
  parsePageParam,
} from "@/lib/fetch-paginated";

interface KBArticle {
  id: number;
  title: string;
  category_name: string | null;
  author_name: string | null;
  view_count: number;
  helpful_count: number;
  is_published: boolean;
  updated_at: string;
}

interface PageProps {
  searchParams: Promise<{ page?: string; search?: string }>;
}

export default async function KBPage({ searchParams }: PageProps) {
  const { page: pageRaw, search } = await searchParams;
  const page = parsePageParam(pageRaw);
  const searchQuery = search || "";
  const cookieStore = await cookies();
  const token = cookieStore.get("cstom_access_token")?.value;

  const data = await fetchPaginated<KBArticle>("/v1/kb/articles/", {
    token,
    page,
    query: { search: searchQuery || undefined },
  });
  const articles = data.results;
  const totalPages = Math.max(1, Math.ceil(data.count / DEFAULT_PAGE_SIZE));

  const emptyMessage = searchQuery
    ? "검색 결과가 없습니다"
    : "등록된 아티클이 없습니다";

  function PublishedBadge({ isPublished }: { isPublished: boolean }) {
    return (
      <StatusBadge
        label={isPublished ? "공개" : "비공개"}
        colorClass={
          isPublished
            ? "bg-success-bg text-success"
            : "bg-surface-sunken text-text-muted"
        }
      />
    );
  }

  const columns: Column<KBArticle>[] = [
    {
      key: "title",
      header: "제목",
      render: (article) => (
        <Link
          href={`/kb/${article.id}`}
          className="text-accent hover:underline font-medium"
        >
          {article.title}
        </Link>
      ),
    },
    {
      key: "category_name",
      header: "카테고리",
      className: "text-text text-sm",
      render: (article) => article.category_name || "-",
    },
    {
      key: "author_name",
      header: "작성자",
      className: "text-text text-sm",
      render: (article) => article.author_name || "-",
    },
    {
      key: "view_count",
      header: "조회수",
      className: "text-text text-sm",
      render: (article) => article.view_count,
    },
    {
      key: "helpful_count",
      header: "유용함",
      className: "text-text text-sm",
      render: (article) => article.helpful_count,
    },
    {
      key: "is_published",
      header: "상태",
      render: (article) => <PublishedBadge isPublished={article.is_published} />,
    },
    {
      key: "updated_at",
      header: "최종 수정일",
      className: "text-text text-sm",
      render: (article) =>
        new Date(article.updated_at).toLocaleDateString("ko-KR"),
    },
  ];

  const renderMobileCard = (article: KBArticle) => (
    <div className="bg-surface rounded-lg shadow-card p-4 space-y-3">
      <Link
        href={`/kb/${article.id}`}
        className="font-medium text-accent block hover:underline"
      >
        {article.title}
      </Link>

      <div className="space-y-2 text-sm border-t border-border-light pt-3">
        <div className="flex justify-between">
          <span className="font-medium text-text">카테고리</span>
          <span className="text-text">{article.category_name || "-"}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-medium text-text">작성자</span>
          <span className="text-text">{article.author_name || "-"}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-medium text-text">조회수</span>
          <span className="text-text">{article.view_count}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-medium text-text">유용함</span>
          <span className="text-text">{article.helpful_count}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="font-medium text-text">상태</span>
          <PublishedBadge isPublished={article.is_published} />
        </div>
        <div className="flex justify-between">
          <span className="font-medium text-text">최종 수정일</span>
          <span className="text-text">
            {new Date(article.updated_at).toLocaleDateString("ko-KR")}
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">지식베이스</h1>
        <Link
          href="/kb/new"
          className="px-4 py-2 bg-accent text-white rounded-md hover:bg-accent-hover"
        >
          새 아티클 작성
        </Link>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <form method="get" action="/kb">
          <input
            type="text"
            name="search"
            defaultValue={searchQuery}
            placeholder="제목, 내용, 태그로 검색..."
            className="w-full px-4 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </form>
      </div>

      <ResponsiveTable
        columns={columns}
        rows={articles}
        rowKey={(article) => article.id}
        emptyMessage={emptyMessage}
        renderMobileCard={renderMobileCard}
      />

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        totalItems={data.count}
      />
    </div>
  );
}
