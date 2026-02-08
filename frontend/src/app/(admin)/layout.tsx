import SidebarLayout from "@/components/ui/sidebar";
import Footer from "@/components/footer";
import ErrorBoundary from "@/components/error-boundary";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarLayout>
      <a href="#main-content" className="skip-link">
        본문으로 건너뛰기
      </a>
      <main id="main-content" className="flex-1 p-4 md:p-6">
        <ErrorBoundary>{children}</ErrorBoundary>
      </main>
      <Footer />
    </SidebarLayout>
  );
}
