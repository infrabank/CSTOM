import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900">CSTOM</h1>
          <nav className="flex gap-4">
            <Link
              href="/contracts"
              className="text-gray-600 hover:text-gray-900"
            >
              Contracts
            </Link>
            <Link href="/events" className="text-gray-600 hover:text-gray-900">
              Events
            </Link>
            <Link href="/reports" className="text-gray-600 hover:text-gray-900">
              Reports
            </Link>
            <Link href="/users" className="text-gray-600 hover:text-gray-900">
              Users
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            IT Maintenance Tracking System
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Track contracts, tasks, incidents, and generate reports for public
            IT maintenance operations.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Link
            href="/contracts"
            className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="text-blue-600 mb-3">
              <svg
                className="w-8 h-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Contracts
            </h3>
            <p className="text-gray-600 text-sm">
              Manage maintenance contracts with status tracking and risk flags.
            </p>
          </Link>

          <Link
            href="/events"
            className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="text-orange-600 mb-3">
              <svg
                className="w-8 h-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Events</h3>
            <p className="text-gray-600 text-sm">
              Track changes and incidents with linked event history.
            </p>
          </Link>

          <Link
            href="/reports"
            className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="text-green-600 mb-3">
              <svg
                className="w-8 h-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Reports
            </h3>
            <p className="text-gray-600 text-sm">
              Generate monthly, incident, and audit reports automatically.
            </p>
          </Link>

          <Link
            href="/users"
            className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="text-purple-600 mb-3">
              <svg
                className="w-8 h-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Users</h3>
            <p className="text-gray-600 text-sm">
              Manage users with role-based access control.
            </p>
          </Link>
        </div>
      </main>

      <footer className="border-t bg-white mt-16">
        <div className="max-w-7xl mx-auto px-4 py-6 text-center text-gray-500 text-sm">
          CSTOM - IT Maintenance Tracking System
        </div>
      </footer>
    </div>
  );
}
