import Link from "next/link";
import { cookies } from "next/headers";

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
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">SOP 관리</h1>
        <Link
          href="/sop/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          새 SOP 작성
        </Link>
      </div>

      <div className="hidden md:block bg-white shadow-sm rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-medium text-black uppercase">
                제목
              </th>
              <th className="px-6 py-3 text-left text-sm font-medium text-black uppercase">
                카테고리
              </th>
              <th className="px-6 py-3 text-left text-sm font-medium text-black uppercase">
                작성자
              </th>
              <th className="px-6 py-3 text-left text-sm font-medium text-black uppercase">
                현재 버전
              </th>
              <th className="px-6 py-3 text-left text-sm font-medium text-black uppercase">
                최종 수정일
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {documents.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-black">
                  등록된 SOP가 없습니다
                </td>
              </tr>
            ) : (
              documents.map((doc) => (
                <tr key={doc.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <Link
                      href={`/sop/${doc.id}`}
                      className="text-blue-600 hover:underline font-medium"
                    >
                      {doc.title}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-black text-sm">
                    {doc.category_name || "-"}
                  </td>
                  <td className="px-6 py-4 text-black text-sm">
                    {doc.author_name || "-"}
                  </td>
                  <td className="px-6 py-4 text-black text-sm">
                    {doc.current_version_number ? `v${doc.current_version_number}` : "-"}
                  </td>
                  <td className="px-6 py-4 text-black text-sm">
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
          <div className="bg-white p-4 rounded-lg shadow-sm text-center text-black">
            등록된 SOP가 없습니다
          </div>
        ) : (
          documents.map((doc) => (
            <div key={doc.id} className="bg-white rounded-lg shadow-sm p-4 space-y-3">
              <Link
                href={`/sop/${doc.id}`}
                className="font-medium text-blue-600 block hover:underline"
              >
                {doc.title}
              </Link>

              <div className="space-y-2 text-sm border-t border-gray-100 pt-3">
                <div className="flex justify-between">
                  <span className="font-medium text-black">카테고리</span>
                  <span className="text-black">{doc.category_name || "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-black">작성자</span>
                  <span className="text-black">{doc.author_name || "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-black">현재 버전</span>
                  <span className="text-black">{doc.current_version_number ? `v${doc.current_version_number}` : "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-black">최종 수정일</span>
                  <span className="text-black">
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
