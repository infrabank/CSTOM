import AdminHeader from "@/components/admin-header";
import Footer from "@/components/footer";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <AdminHeader />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
