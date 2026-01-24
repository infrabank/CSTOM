"use client";

interface PdfDownloadButtonProps {
  reportTitle: string;
}

export default function PdfDownloadButton({ reportTitle }: PdfDownloadButtonProps) {
  const handleDownload = () => {
    // Use browser print dialog with PDF option
    const printWindow = window;
    const originalTitle = document.title;
    document.title = reportTitle;
    
    printWindow.print();
    
    // Restore original title after print dialog closes
    setTimeout(() => {
      document.title = originalTitle;
    }, 1000);
  };

  return (
    <button
      onClick={handleDownload}
      className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 flex items-center gap-2"
    >
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
      PDF 다운로드
    </button>
  );
}
