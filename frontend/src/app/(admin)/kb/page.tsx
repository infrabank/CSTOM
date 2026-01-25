import Link from "next/link";
import { cookies } from "next/headers";

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

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

async function getKBArticles(token?: string, search?: string): Promise<KBArticle[]> {
  try {
    const url = search 
      ? `${API_URL}/v1/kb/articles/?search=${encodeURIComponent(search)}`
      : `${API_URL}/v1/kb/articles/`;
    
    const res = await fetch(url, {
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

interface PageProps {
  searchParams: Promise<{ search?: string }>;
}

export default async function KBPage({ searchParams }: PageProps) {
  const cookieStore = await cookies();
  const token = cookieStore.get("cstom_access_token")?.value;
  const params = await searchParams;
  const searchQuery = params.search || "";
  
  const articles = await getKBArticles(token, searchQuery);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">지식베이스</h1>
        <Link
          href="/kb/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
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
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </form>
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
                조회수
              </th>
              <th className="px-6 py-3 text-left text-sm font-medium text-black uppercase">
                유용함
              </th>
              <th className="px-6 py-3 text-left text-sm font-medium text-black uppercase">
                상태
              </th>
              <th className="px-6 py-3 text-left text-sm font-medium text-black uppercase">
                최종 수정일
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {articles.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-black">
                  {searchQuery ? "검색 결과가 없습니다" : "등록된 아티클이 없습니다"}
                </td>
              </tr>
            ) : (
              articles.map((article) => (
                <tr key={article.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <Link
                      href={`/kb/${article.id}`}
                      className="text-blue-600 hover:underline font-medium"
                    >
                      {article.title}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-black text-sm">
                    {article.category_name || "-"}
                  </td>
                  <td className="px-6 py-4 text-black text-sm">
                    {article.author_name || "-"}
                  </td>
                  <td className="px-6 py-4 text-black text-sm">
                    {article.view_count}
                  </td>
                  <td className="px-6 py-4 text-black text-sm">
                    {article.helpful_count}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      article.is_published 
                        ? "bg-green-100 text-green-800" 
                        : "bg-gray-100 text-gray-800"
                    }`}>
                      {article.is_published ? "공개" : "비공개"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-black text-sm">
                    {new Date(article.updated_at).toLocaleDateString("ko-KR")}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="md:hidden space-y-4">
        {articles.length === 0 ? (
          <div className="bg-white p-4 rounded-lg shadow-sm text-center text-black">
            {searchQuery ? "검색 결과가 없습니다" : "등록된 아티클이 없습니다"}
          </div>
        ) : (
          articles.map((article) => (
            <div key={article.id} className="bg-white rounded-lg shadow-sm p-4 space-y-3">
              <Link
                href={`/kb/${article.id}`}
                className="font-medium text-blue-600 block hover:underline"
              >
                {article.title}
              </Link>

              <div className="space-y-2 text-sm border-t border-gray-100 pt-3">
                <div className="flex justify-between">
                  <span className="font-medium text-black">카테고리</span>
                  <span className="text-black">{article.category_name || "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-black">작성자</span>
                  <span className="text-black">{article.author_name || "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-black">조회수</span>
                  <span className="text-black">{article.view_count}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-black">유용함</span>
                  <span className="text-black">{article.helpful_count}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-black">상태</span>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    article.is_published 
                      ? "bg-green-100 text-green-800" 
                      : "bg-gray-100 text-gray-800"
                  }`}>
                    {article.is_published ? "공개" : "비공개"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-black">최종 수정일</span>
                  <span className="text-black">
                    {new Date(article.updated_at).toLocaleDateString("ko-KR")}
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
