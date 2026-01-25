import Link from "next/link";
import { cookies } from "next/headers";

interface EngineerProfile {
  id: number;
  user_name: string;
  user_email: string;
  skills: string;
  specialization: string;
  availability_status: string;
  availability_status_display: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

const STATUS_COLORS: Record<string, string> = {
  available: "bg-green-100 text-green-800",
  busy: "bg-yellow-100 text-yellow-800",
  on_leave: "bg-gray-100 text-gray-800",
  unavailable: "bg-red-100 text-red-800",
};

async function getEngineers(token?: string): Promise<EngineerProfile[]> {
  try {
    const res = await fetch(`${API_URL}/v1/workforce/engineers/`, {
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

export default async function WorkforcePage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("cstom_access_token")?.value;
  
  const engineers = await getEngineers(token);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">인력 관리</h1>
        <Link
          href="/workforce/schedule"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          일정 관리
        </Link>
      </div>

      <div className="hidden md:block bg-white shadow-sm rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-medium text-black uppercase">
                이름
              </th>
              <th className="px-6 py-3 text-left text-sm font-medium text-black uppercase">
                이메일
              </th>
              <th className="px-6 py-3 text-left text-sm font-medium text-black uppercase">
                전문분야
              </th>
              <th className="px-6 py-3 text-left text-sm font-medium text-black uppercase">
                기술스택
              </th>
              <th className="px-6 py-3 text-left text-sm font-medium text-black uppercase">
                상태
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {engineers.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-black">
                  등록된 엔지니어가 없습니다
                </td>
              </tr>
            ) : (
              engineers.map((engineer) => (
                <tr key={engineer.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <Link
                      href={`/workforce/${engineer.id}`}
                      className="text-blue-600 hover:underline font-medium"
                    >
                      {engineer.user_name}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-black text-sm">
                    {engineer.user_email}
                  </td>
                  <td className="px-6 py-4 text-black text-sm">
                    {engineer.specialization || "-"}
                  </td>
                  <td className="px-6 py-4 text-black text-sm">
                    {engineer.skills || "-"}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${STATUS_COLORS[engineer.availability_status] || "bg-gray-100 text-gray-800"}`}>
                      {engineer.availability_status_display}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="md:hidden space-y-4">
        {engineers.length === 0 ? (
          <div className="bg-white p-4 rounded-lg shadow-sm text-center text-black">
            등록된 엔지니어가 없습니다
          </div>
        ) : (
          engineers.map((engineer) => (
            <div key={engineer.id} className="bg-white rounded-lg shadow-sm p-4 space-y-3">
              <Link
                href={`/workforce/${engineer.id}`}
                className="font-medium text-blue-600 block hover:underline"
              >
                {engineer.user_name}
              </Link>

              <div className="flex gap-2">
                <span className={`px-2 py-1 rounded-full text-xs ${STATUS_COLORS[engineer.availability_status] || "bg-gray-100 text-gray-800"}`}>
                  {engineer.availability_status_display}
                </span>
              </div>

              <div className="space-y-2 text-sm border-t border-gray-100 pt-3">
                <div className="flex justify-between">
                  <span className="font-medium text-black">이메일</span>
                  <span className="text-black">{engineer.user_email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-black">전문분야</span>
                  <span className="text-black">{engineer.specialization || "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-black">기술스택</span>
                  <span className="text-black">{engineer.skills || "-"}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
