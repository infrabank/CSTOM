/**
 * Event detail page.
 */

import Link from "next/link";
import { notFound } from "next/navigation";

interface Event {
  id: number;
  contract: number;
  contract_name: string;
  record_type: string;
  title: string;
  description: string;
  occurred_at: string;
  detected_at: string | null;
  resolved_at: string | null;
  customer_notified: boolean;
  customer_notified_at: string | null;
  related_event: number | null;
  related_event_title: string | null;
  summary_notice: string;
  audit_summary: string;
  created_at: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

async function getEvent(id: number): Promise<Event | null> {
  try {
    const res = await fetch(`${API_URL}/events/${id}/`, { cache: "no-store" });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

interface PageProps {
  params: Promise<{ eventId: string }>;
}

export default async function EventDetailPage({ params }: PageProps) {
  const { eventId } = await params;
  const id = parseInt(eventId, 10);

  if (isNaN(id)) {
    notFound();
  }

  const event = await getEvent(id);

  if (!event) {
    notFound();
  }

  const typeColor =
    event.record_type === "incident"
      ? "bg-red-100 text-red-700"
      : "bg-blue-100 text-blue-700";

  return (
    <div className="p-6">
      <div className="mb-6">
        <Link href="/events" className="text-blue-600 hover:underline text-sm">
          Back to events
        </Link>
      </div>

      <div className="bg-white shadow-sm rounded-lg p-6 mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className={`px-3 py-1 rounded text-sm font-medium ${typeColor}`}>
                {event.record_type}
              </span>
              <h1 className="text-2xl font-bold">{event.title}</h1>
            </div>
            <p className="text-gray-600">{event.contract_name}</p>
          </div>
          <div>
            {event.resolved_at ? (
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                Resolved
              </span>
            ) : (
              <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm">
                Open
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <h3 className="text-sm font-medium text-gray-500">Occurred</h3>
            <p>{new Date(event.occurred_at).toLocaleString()}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Detected</h3>
            <p>
              {event.detected_at
                ? new Date(event.detected_at).toLocaleString()
                : "-"}
            </p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Resolved</h3>
            <p>
              {event.resolved_at
                ? new Date(event.resolved_at).toLocaleString()
                : "-"}
            </p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">
              Customer Notified
            </h3>
            <p>
              {event.customer_notified
                ? event.customer_notified_at
                  ? new Date(event.customer_notified_at).toLocaleString()
                  : "Yes"
                : "No"}
            </p>
          </div>
        </div>

        {event.description && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-500 mb-1">
              Description
            </h3>
            <p className="text-gray-700 whitespace-pre-wrap">
              {event.description}
            </p>
          </div>
        )}

        {event.related_event && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-500 mb-1">
              Related Event
            </h3>
            <Link
              href={`/events/${event.related_event}`}
              className="text-blue-600 hover:underline"
            >
              {event.related_event_title}
            </Link>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white shadow-sm rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-3">Notice Summary</h2>
          <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans">
            {event.summary_notice || "No summary generated"}
          </pre>
        </div>

        <div className="bg-white shadow-sm rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-3">Audit Summary</h2>
          <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans">
            {event.audit_summary || "No summary generated"}
          </pre>
        </div>
      </div>

      <div className="mt-6 flex gap-3">
        <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
          Edit Event
        </button>
        <button className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">
          Link to Event
        </button>
      </div>
    </div>
  );
}
