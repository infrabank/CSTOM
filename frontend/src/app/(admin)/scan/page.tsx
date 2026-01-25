'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import QRScanner from '@/components/QRScanner';

export default function ScanPage() {
  const router = useRouter();
  const [scannedData, setScannedData] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleScan = (decodedText: string) => {
    setScannedData(decodedText);
    setError(null);

    // Try to extract equipment ID from URL
    const match = decodedText.match(/\/equipments\/(\d+)/);
    if (match) {
      const equipmentId = match[1];
      // Navigate to equipment detail page
      router.push(`/equipments/${equipmentId}`);
    }
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <Link href="/equipments" className="text-blue-600 hover:underline text-sm">
          ← 장비 목록으로
        </Link>
      </div>

      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-2 text-center">QR 코드 스캔</h1>
        <p className="text-gray-600 mb-6 text-center">
          장비의 QR 코드를 스캔하여 상세 정보를 확인하세요
        </p>

        <div className="bg-white shadow-sm rounded-lg p-6 mb-6">
          <QRScanner onScan={handleScan} onError={handleError} />
        </div>

        {scannedData && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-medium text-green-800 mb-2">스캔 성공</h3>
            <p className="text-sm text-green-700 break-all">{scannedData}</p>
          </div>
        )}

        {error && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-medium text-yellow-800 mb-2">카메라 권한 필요</h3>
            <p className="text-sm text-yellow-700">
              QR 코드를 스캔하려면 카메라 접근 권한이 필요합니다. 
              브라우저 설정에서 카메라 권한을 허용해주세요.
            </p>
          </div>
        )}

        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-medium text-gray-800 mb-2">사용 방법</h3>
          <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
            <li>스캔 시작 버튼을 클릭합니다</li>
            <li>카메라 권한을 허용합니다</li>
            <li>장비의 QR 코드를 카메라에 비춥니다</li>
            <li>자동으로 장비 상세 페이지로 이동합니다</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
