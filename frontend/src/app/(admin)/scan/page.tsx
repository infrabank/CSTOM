'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

const QRScanner = dynamic(() => import('@/components/QRScanner'), {
  ssr: false,
  loading: () => <Skeleton className="h-[300px] w-full rounded-lg" />,
});

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
         <Link href="/equipments" className="text-accent hover:underline text-sm">
          ← 장비 목록으로
        </Link>
      </div>

      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-2 text-center">QR 코드 스캔</h1>
         <p className="text-text-muted mb-6 text-center">
          장비의 QR 코드를 스캔하여 상세 정보를 확인하세요
        </p>

         <div className="bg-surface shadow-card rounded-lg p-6 mb-6">
          <QRScanner onScan={handleScan} onError={handleError} />
        </div>

        {scannedData && (
          <div className="bg-success-bg border border-success-border rounded-lg p-4">
            <h3 className="font-medium text-success mb-2">스캔 성공</h3>
            <p className="text-sm text-success break-all">{scannedData}</p>
          </div>
        )}

        {error && (
          <div className="bg-warning-bg border border-warning-border rounded-lg p-4">
            <h3 className="font-medium text-warning mb-2">카메라 권한 필요</h3>
            <p className="text-sm text-warning">
              QR 코드를 스캔하려면 카메라 접근 권한이 필요합니다. 
              브라우저 설정에서 카메라 권한을 허용해주세요.
            </p>
          </div>
        )}

         <div className="mt-6 p-4 bg-surface-sunken rounded-lg">
           <h3 className="font-medium text-text mb-2">사용 방법</h3>
           <ol className="text-sm text-text-muted space-y-1 list-decimal list-inside">
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
