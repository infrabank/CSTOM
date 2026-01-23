import Image from "next/image";
import AdminHeader from "@/components/admin-header";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <AdminHeader />
      <main className="flex-1">{children}</main>
      <footer className="border-t bg-white mt-auto">
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-center items-center">
          <Image
            src="/images/2-4.png"
            alt="CSTOM"
            width={120}
            height={27}
          />
        </div>
      </footer>
    </div>
  );
}
