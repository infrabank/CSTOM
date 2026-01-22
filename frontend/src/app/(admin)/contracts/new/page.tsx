"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createContract } from "../actions";

const SCOPES = [
  { value: "operation", label: "Operation" },
  { value: "construction", label: "Construction" },
  { value: "transition", label: "Transition" },
  { value: "pm", label: "PM" },
];

export default function NewContractPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true);
    setError("");

    const result = await createContract(formData);

    if (result.success) {
      router.push(`/contracts/${result.id}`);
    } else {
      setError(result.error || "Failed to create contract");
      setIsSubmitting(false);
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <Link href="/contracts" className="text-blue-600 hover:underline text-sm">
          Back to contracts
        </Link>
      </div>

      <div className="bg-white shadow-sm rounded-lg p-6 max-w-2xl">
        <h1 className="text-2xl font-bold mb-6">New Contract</h1>

        {error && (
          <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-md">
            {error}
          </div>
        )}

        <form action={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contract Name *
            </label>
            <input
              type="text"
              name="name"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Client Organization *
            </label>
            <input
              type="text"
              name="client_org"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date *
              </label>
              <input
                type="date"
                name="start_date"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date *
              </label>
              <input
                type="date"
                name="end_date"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contract Amount
            </label>
            <input
              type="text"
              name="contract_amount"
              placeholder="e.g., 100,000,000"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Scopes
            </label>
            <div className="flex flex-wrap gap-4">
              {SCOPES.map((scope) => (
                <label key={scope.value} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="scopes"
                    value={scope.value}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm">{scope.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Risk Flags
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="risk_pre_env"
                  className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                />
                <span className="text-sm">Pre-existing Environment</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="risk_prior_vendor"
                  className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                />
                <span className="text-sm">Prior Vendor Coordination Required</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="risk_docs_incomplete"
                  className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                />
                <span className="text-sm">Documentation Incomplete</span>
              </label>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Creating..." : "Create Contract"}
            </button>
            <Link
              href="/contracts"
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
