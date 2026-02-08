import Link from "next/link";
import { cookies } from "next/headers";
import Breadcrumb from "@/components/ui/breadcrumb";

interface SOPDocument {
  id: number;
  title: string;
  category_name: string | null;
  author_name: string | null;
  current_version_number: number | null;
  updated_at: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

async function getSOPDocuments(token?: string): Promise<SOPDocument[]> {
  try {
    const res = await fetch(`${API_URL}/v1/sop/documents/`, {
      cache: "no-store",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.results || [];
  } catch {
    return [];
  }
}

export default async function SOPPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("cstom_access_token")?.value;
  
  const documents = await getSOPDocuments(token);

  return (
    <div>
      <Breadcrumb />

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-text">SOP 관리</h1>
        <Link
          href="/sop/new"
          className="px-4 py-2 bg-accent text-text-on-accent rounded-md hover:bg-accent-hover transition-colors cursor-pointer text-sm font-medium"
        >
          새 SOP 작성
        </Link>
      </div>

      <div className="hidden md:block bg-surface shadow-card rounded-lg overflow-hidden border border-border-light">
        <table className="min-w-full divide-y divide-border-light">
          <thead className="bg-surface-sunken">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                제목
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                카테고리
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                작성자
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                현재 버전
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                최종 수정일
              </th>
            </tr>
          </thead>
          <tbody className="bg-surface divide-y divide-border-light">
            {documents.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-text-muted">
                  등록된 SOP가 없습니다
                </td>
              </tr>
            ) : (
              documents.map((doc) => (
                <tr key={doc.id} className="hover:bg-surface-sunken transition-colors">
                  <td className="px-6 py-4">
                    <Link
                      href={`/sop/${doc.id}`}
                      className="text-accent hover:underline font-medium text-sm"
                    >
                      {doc.title}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-text-secondary text-sm">
                    {doc.category_name || "-"}
                  </td>
                  <td className="px-6 py-4 text-text-secondary text-sm">
                    {doc.author_name || "-"}
                  </td>
                  <td className="px-6 py-4 text-text-secondary text-sm">
                    {doc.current_version_number ? `v${doc.current_version_number}` : "-"}
                  </td>
                  <td className="px-6 py-4 text-text-secondary text-sm">
                    {new Date(doc.updated_at).toLocaleDateString("ko-KR")}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="md:hidden space-y-4">
        {documents.length === 0 ? (
          <div className="bg-surface p-6 rounded-lg shadow-card border border-border-light text-center text-text-muted">
            등록된 SOP가 없습니다
          </div>
        ) : (
          documents.map((doc) => (
            <div key={doc.id} className="bg-surface rounded-lg shadow-card border border-border-light p-4 space-y-3">
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
                  <span className="text-text-muted">{doc.current_version_number ? `v${doc.current_version_number}` : "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-text-secondary">최종 수정일</span>
                  <span className="text-text-muted">
                    {new Date(doc.updated_at).toLocaleDateString("ko-KR")}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
