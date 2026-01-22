import Link from "next/link";
import Image from "next/image";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <Link href="/">
            <Image
              src="/images/ci_23.jpg"
              alt="KRIHS 국토연구원"
              width={150}
              height={33}
              priority
            />
          </Link>
          <nav className="flex gap-6">
            <Link
              href="/contracts"
              className="text-gray-600 hover:text-gray-900 font-medium"
            >
              사업 관리
            </Link>
            <Link
              href="/tasks"
              className="text-gray-600 hover:text-gray-900 font-medium"
            >
              작업 관리
            </Link>
            <Link
              href="/events"
              className="text-gray-600 hover:text-gray-900 font-medium"
            >
              변경/장애
            </Link>
            <Link
              href="/reports"
              className="text-gray-600 hover:text-gray-900 font-medium"
            >
              보고서
            </Link>
            <Link
              href="/users"
              className="text-gray-600 hover:text-gray-900 font-medium"
            >
              사용자
            </Link>
          </nav>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
