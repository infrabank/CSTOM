import { cookies } from "next/headers";
import { Suspense } from "react";
import Pagination from "@/components/ui/pagination";
import { TableSkeleton } from "@/components/ui/skeleton";
import ResponsiveTable, { type Column } from "@/components/responsive-table";
import {
  DEFAULT_PAGE_SIZE,
  fetchPaginated,
  parsePageParam,
} from "@/lib/fetch-paginated";
import {
  CategoryFormIsland,
  CategoryDeleteButton,
} from "./categories-client";

interface SOPCategory {
  id: number;
  name: string;
  description: string;
  parent: number | null;
  created_at: string;
}

interface PageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function SOPCategoriesPage({ searchParams }: PageProps) {
  const { page: pageRaw } = await searchParams;
  const page = parsePageParam(pageRaw);
  const cookieStore = await cookies();
  const token = cookieStore.get("cstom_access_token")?.value;

  const [data, allCategoriesPage] = await Promise.all([
    fetchPaginated<SOPCategory>("/v1/sop/categories/", { token, page }),
    // Full list (parent dropdown options + parent-name lookup) independent of
    // the table's current page.
    fetchPaginated<SOPCategory>("/v1/sop/categories/", {
      token,
      page: 1,
      pageSize: 100,
    }),
  ]);

  const categories = data.results;
  const totalPages = Math.max(1, Math.ceil(data.count / DEFAULT_PAGE_SIZE));
  const allCategories = allCategoriesPage.results;
  const nameById = new Map(allCategories.map((c) => [c.id, c.name]));

  const parentName = (parentId: number | null): string => {
    if (!parentId) return "-";
    return nameById.get(parentId) ?? "-";
  };

  const columns: Column<SOPCategory>[] = [
    {
      key: "name",
      header: "이름",
      className: "text-text font-medium text-sm",
      render: (cat) => cat.name,
    },
    {
      key: "description",
      header: "설명",
      className: "text-text-secondary text-sm",
      render: (cat) => cat.description || "-",
    },
    {
      key: "parent",
      header: "상위 카테고리",
      className: "text-text-secondary text-sm",
      render: (cat) => parentName(cat.parent),
    },
    {
      key: "actions",
      header: "작업",
      render: (cat) => <CategoryDeleteButton id={cat.id} name={cat.name} />,
    },
  ];

  const renderMobileCard = (cat: SOPCategory) => (
    <div className="bg-surface rounded-lg shadow-card border border-border-light p-4 space-y-3">
      <div className="flex justify-between items-start">
        <span className="font-medium text-text text-sm">{cat.name}</span>
        <CategoryDeleteButton id={cat.id} name={cat.name} />
      </div>
      {cat.description && (
        <p className="text-sm text-text-secondary">{cat.description}</p>
      )}
      {cat.parent && (
        <div className="text-xs text-text-muted">
          상위: {parentName(cat.parent)}
        </div>
      )}
    </div>
  );

  return (
    <div className="p-6">
      <CategoryFormIsland parentOptions={allCategories} />

      <Suspense fallback={<TableSkeleton rows={5} columns={4} />}>
        <ResponsiveTable
          columns={columns}
          rows={categories}
          rowKey={(cat) => cat.id}
          emptyMessage="등록된 카테고리가 없습니다"
          renderMobileCard={renderMobileCard}
        />
      </Suspense>

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        totalItems={data.count}
      />
    </div>
  );
}
