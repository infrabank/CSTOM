import Link from "next/link";
import { cookies } from "next/headers";
import Breadcrumb from "@/components/ui/breadcrumb";
import Pagination from "@/components/ui/pagination";
import ResponsiveTable, { type Column } from "@/components/responsive-table";
import {
  DEFAULT_PAGE_SIZE,
  fetchPaginated,
  parsePageParam,
} from "@/lib/fetch-paginated";

interface SOPDocument {
  id: number;
  title: string;
  category_name: string | null;
  author_name: string | null;
  current_version_number: number | null;
  updated_at: string;
}

interface PageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function SOPPage({ searchParams }: PageProps) {
  const { page: pageRaw } = await searchParams;
  const page = parsePageParam(pageRaw);
  const cookieStore = await cookies();
  const token = cookieStore.get("cstom_access_token")?.value;

  const data = await fetchPaginated<SOPDocument>("/v1/sop/documents/", {
    token,
    page,
  });
  const documents = data.results;
  const totalPages = Math.max(1, Math.ceil(data.count / DEFAULT_PAGE_SIZE));

  const columns: Column<SOPDocument>[] = [
    {
      key: "title",
      header: "제목",
      render: (doc) => (
        <Link
          href={`/sop/${doc.id}`}
          className="text-accent hover:underline font-medium text-sm"
        >
          {doc.title}
        </Link>
      ),
    },
    {
      key: "category_name",
      header: "카테고리",
      className: "text-text-secondary text-sm",
      render: (doc) => doc.category_name || "-",
    },
    {
      key: "author_name",
      header: "작성자",
      className: "text-text-secondary text-sm",
      render: (doc) => doc.author_name || "-",
    },
    {
      key: "current_version_number",
      header: "현재 버전",
      className: "text-text-secondary text-sm",
      render: (doc) =>
        doc.current_version_number ? `v${doc.current_version_number}` : "-",
    },
    {
      key: "updated_at",
      header: "최종 수정일",
      className: "text-text-secondary text-sm",
      render: (doc) => new Date(doc.updated_at).toLocaleDateString("ko-KR"),
    },
  ];

  const renderMobileCard = (doc: SOPDocument) => (
    <div className="bg-surface rounded-lg shadow-card border border-border-light p-4 space-y-3">
      <Link
        href={`/sop/${doc.id}`}
        className="font-medium text-accent block hover:underline text-sm"
      >
        {doc.title}
      </Link>

      <div className="space-y-2 text-sm border-t border-border-light pt-3">
        <div className="flex justify-between">
          <span className="font-medium text-text-secondary">카테고리</span>
          <span className="text-text-muted">{doc.category_name || "-"}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-medium text-text-secondary">작성자</span>
          <span className="text-text-muted">{doc.author_name || "-"}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-medium text-text-secondary">현재 버전</span>
          <span className="text-text-muted">
            {doc.current_version_number ? `v${doc.current_version_number}` : "-"}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="font-medium text-text-secondary">최종 수정일</span>
          <span className="text-text-muted">
            {new Date(doc.updated_at).toLocaleDateString("ko-KR")}
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <Breadcrumb />

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-text">SOP 관리</h1>
        <div className="flex gap-2">
          <Link
            href="/sop/categories"
            className="px-4 py-2 border border-border rounded-md hover:bg-surface-sunken transition-colors cursor-pointer text-sm font-medium text-text-secondary"
          >
            카테고리 관리
          </Link>
          <Link
            href="/sop/new"
            className="px-4 py-2 bg-accent text-text-on-accent rounded-md hover:bg-accent-hover transition-colors cursor-pointer text-sm font-medium"
          >
            새 SOP 작성
          </Link>
        </div>
      </div>

      <ResponsiveTable
        columns={columns}
        rows={documents}
        rowKey={(doc) => doc.id}
        emptyMessage="등록된 SOP가 없습니다"
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
