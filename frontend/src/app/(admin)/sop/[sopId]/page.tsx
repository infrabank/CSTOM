'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Version {
  id: number;
  version_number: number;
  created_by_name: string;
  created_at: string;
}

interface CurrentVersion extends Version {
  content: string;
}

interface SOPDocument {
  id: number;
  title: string;
  category_name: string;
  author_name: string;
  current_version: CurrentVersion;
  versions: Version[];
  created_at: string;
  updated_at: string;
}

export default function SOPDetailPage() {
  const params = useParams();
  const sopId = params.sopId as string;
  const [document, setDocument] = useState<SOPDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedVersions, setExpandedVersions] = useState(false);

  useEffect(() => {
    const fetchDocument = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/v1/sop/documents/${sopId}/`,
          {
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
          }
        );

        if (!response.ok) {
          throw new Error('SOP 문서를 불러오지 못했습니다');
        }

        const data = await response.json();
        setDocument(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    if (sopId) {
      fetchDocument();
    }
  }, [sopId]);

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
        <Link href="/sop" className="text-blue-600 hover:underline">
          SOP 목록으로
        </Link>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-500">문서를 찾을 수 없습니다</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Back Button */}
      <div className="mb-6">
        <Link href="/sop" className="text-blue-600 hover:underline text-sm">
          ← SOP 목록으로
        </Link>
      </div>

      {/* Main Content */}
      <div className="bg-white shadow-sm rounded-lg p-6 mb-6">
        {/* Header */}
        <div className="mb-6 pb-6 border-b">
          <h1 className="text-3xl font-bold mb-4">{document.title}</h1>

          {/* Metadata Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-600 mb-1">카테고리</h3>
              <p className="text-gray-900">{document.category_name}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-600 mb-1">작성자</h3>
              <p className="text-gray-900">{document.author_name}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-600 mb-1">등록일</h3>
              <p className="text-gray-900">
                {new Date(document.created_at).toLocaleString('ko-KR')}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-600 mb-1">수정일</h3>
              <p className="text-gray-900">
                {new Date(document.updated_at).toLocaleString('ko-KR')}
              </p>
            </div>
          </div>
        </div>

        {/* Current Version Info */}
        <div className="mb-6 pb-6 border-b">
          <h2 className="text-lg font-semibold mb-3">현재 버전</h2>
          <div className="bg-blue-50 rounded-lg p-4 mb-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-600 mb-1">버전</h3>
                <p className="text-gray-900 font-semibold">
                  v{document.current_version.version_number}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-600 mb-1">작성자</h3>
                <p className="text-gray-900">{document.current_version.created_by_name}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-600 mb-1">작성일</h3>
                <p className="text-gray-900">
                  {new Date(document.current_version.created_at).toLocaleString('ko-KR')}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Markdown Content */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">내용</h2>
          <div className="prose prose-sm max-w-none bg-gray-50 rounded-lg p-6">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {document.current_version.content}
            </ReactMarkdown>
          </div>
        </div>

        {/* Version History */}
        <div className="mb-6">
          <button
            onClick={() => setExpandedVersions(!expandedVersions)}
            className="flex items-center gap-2 text-lg font-semibold mb-4 hover:text-blue-600 transition-colors"
          >
            <span>버전 히스토리</span>
            <span className={`transform transition-transform ${expandedVersions ? 'rotate-180' : ''}`}>
              ▼
            </span>
          </button>

          {expandedVersions && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">버전</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">작성자</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">작성일</th>
                  </tr>
                </thead>
                <tbody>
                  {document.versions.map((version) => (
                    <tr key={version.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <span className="font-semibold text-gray-900">
                          v{version.version_number}
                        </span>
                        {version.id === document.current_version.id && (
                          <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                            현재
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-700">{version.created_by_name}</td>
                      <td className="px-4 py-3 text-gray-700">
                        {new Date(version.created_at).toLocaleString('ko-KR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-6 border-t">
          <Link
            href={`/sop/${document.id}/edit`}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            수정
          </Link>
          <Link
            href="/sop"
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
          >
            목록
          </Link>
        </div>
      </div>
    </div>
  );
}
