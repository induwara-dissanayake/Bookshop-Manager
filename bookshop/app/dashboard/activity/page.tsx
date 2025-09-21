'use client'

import Navigation from '@/components/Navigation'

export default function ActivityPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Activity Log</h1>
          <p className="mt-2 text-gray-600">Track system activities and user actions</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-500">This page is under development.</p>
          <p className="text-sm text-gray-400 mt-2">
            Here you will be able to view system logs, user activities, and audit trails.
          </p>
        </div>
      </div>
    </div>
  )
}
