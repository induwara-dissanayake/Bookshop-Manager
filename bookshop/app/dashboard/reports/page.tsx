'use client'

import { useState } from 'react'
import Navigation from '@/components/Navigation'
import { FileSpreadsheet, Download, Calendar, Filter, TrendingUp, Users, BookOpen, DollarSign } from 'lucide-react'

interface ReportFilters {
  reportType: 'orders' | 'customers' | 'books' | 'payments' | 'all'
  dateRange: 'daily' | 'monthly' | 'custom'
  startDate: string
  endDate: string
  includeReturned: boolean
  includePending: boolean
}

export default function ReportsPage() {
  const [filters, setFilters] = useState<ReportFilters>({
    reportType: 'all',
    dateRange: 'monthly',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    includeReturned: true,
    includePending: true
  })
  const [isGenerating, setIsGenerating] = useState(false)

  const handleFilterChange = (key: keyof ReportFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const generateReport = async () => {
    setIsGenerating(true)
    try {
      const queryParams = new URLSearchParams({
        reportType: filters.reportType,
        dateRange: filters.dateRange,
        startDate: filters.startDate,
        endDate: filters.endDate,
        includeReturned: filters.includeReturned.toString(),
        includePending: filters.includePending.toString()
      })

      const response = await fetch(`/api/reports/export?${queryParams}`)
      
      if (response.ok) {
        // Create download link
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `bookshop-report-${filters.reportType}-${new Date().toISOString().split('T')[0]}.xlsx`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to generate report')
      }
    } catch (error) {
      console.error('Error generating report:', error)
      alert('Failed to generate report')
    } finally {
      setIsGenerating(false)
    }
  }

  const reportTypeOptions = [
    { value: 'all', label: 'Complete Report', description: 'All data including orders, customers, books, and payments' },
    { value: 'orders', label: 'Orders Report', description: 'Order details with customer and book information' },
    { value: 'customers', label: 'Customers Report', description: 'Customer information and borrowing history' },
    { value: 'books', label: 'Books Report', description: 'Book inventory and borrowing statistics' },
    { value: 'payments', label: 'Payments Report', description: 'Payment records and revenue data' }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <TrendingUp className="w-8 h-8 mr-3 text-blue-600" />
              Reports & Export
            </h1>
          </div>

          {/* Report Configuration */}
          <div className="bg-white rounded-lg shadow mb-8">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <Filter className="w-5 h-5 mr-2" />
                Report Configuration
              </h3>
              <p className="text-sm text-gray-500 mt-1">Configure your report parameters and filters</p>
            </div>
            
            <div className="p-6">
              {/* Report Type Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">Report Type</label>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {reportTypeOptions.map((option) => (
                    <div
                      key={option.value}
                      className={`relative rounded-lg border p-4 cursor-pointer transition-colors ${
                        filters.reportType === option.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                      onClick={() => handleFilterChange('reportType', option.value)}
                    >
                      <div className="flex items-center">
                        <input
                          type="radio"
                          name="reportType"
                          value={option.value}
                          checked={filters.reportType === option.value}
                          onChange={() => handleFilterChange('reportType', option.value)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                        />
                        <div className="ml-3">
                          <label className="block text-sm font-medium text-gray-900 cursor-pointer">
                            {option.label}
                          </label>
                          <p className="text-xs text-gray-500 mt-1">{option.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Date Range */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">Date Range</label>
                <div className="flex flex-wrap gap-4 mb-4">
                  <button
                    onClick={() => handleFilterChange('dateRange', 'daily')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      filters.dateRange === 'daily'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Daily Report
                  </button>
                  <button
                    onClick={() => handleFilterChange('dateRange', 'monthly')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      filters.dateRange === 'monthly'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Monthly Report
                  </button>
                  <button
                    onClick={() => handleFilterChange('dateRange', 'custom')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      filters.dateRange === 'custom'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Custom Range
                  </button>
                </div>

                {filters.dateRange === 'custom' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Start Date</label>
                      <input
                        type="date"
                        value={filters.startDate}
                        onChange={(e) => handleFilterChange('startDate', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">End Date</label>
                      <input
                        type="date"
                        value={filters.endDate}
                        onChange={(e) => handleFilterChange('endDate', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Status Filters */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">Include Status</label>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="includeReturned"
                      checked={filters.includeReturned}
                      onChange={(e) => handleFilterChange('includeReturned', e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="includeReturned" className="ml-2 text-sm text-gray-700">
                      Include Returned Orders
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="includePending"
                      checked={filters.includePending}
                      onChange={(e) => handleFilterChange('includePending', e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="includePending" className="ml-2 text-sm text-gray-700">
                      Include Pending Orders
                    </label>
                  </div>
                </div>
              </div>

              {/* Generate Button */}
              <div className="flex justify-end">
                <button
                  onClick={generateReport}
                  disabled={isGenerating}
                  className={`flex items-center px-6 py-3 rounded-md text-sm font-medium transition-colors ${
                    isGenerating
                      ? 'bg-gray-400 text-white cursor-not-allowed'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  {isGenerating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Generating...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Generate & Download Excel Report
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Report Preview */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <FileSpreadsheet className="w-5 h-5 mr-2" />
                Report Preview
              </h3>
              <p className="text-sm text-gray-500 mt-1">Your report will include the following data based on selected filters</p>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Report Details</h4>
                  <dl className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <dt className="text-gray-600">Report Type:</dt>
                      <dd className="text-gray-900 font-medium">
                        {reportTypeOptions.find(opt => opt.value === filters.reportType)?.label}
                      </dd>
                    </div>
                    <div className="flex justify-between text-sm">
                      <dt className="text-gray-600">Date Range:</dt>
                      <dd className="text-gray-900 font-medium">
                        {filters.dateRange === 'custom' 
                          ? `${filters.startDate} to ${filters.endDate}`
                          : filters.dateRange.charAt(0).toUpperCase() + filters.dateRange.slice(1)
                        }
                      </dd>
                    </div>
                    <div className="flex justify-between text-sm">
                      <dt className="text-gray-600">Export Format:</dt>
                      <dd className="text-gray-900 font-medium">Excel (.xlsx)</dd>
                    </div>
                  </dl>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Included Data</h4>
                  <ul className="space-y-1 text-sm text-gray-600">
                    {filters.reportType === 'all' && (
                      <>
                        <li>• Complete order details</li>
                        <li>• Customer information</li>
                        <li>• Book inventory data</li>
                        <li>• Payment records</li>
                      </>
                    )}
                    {filters.reportType === 'orders' && (
                      <>
                        <li>• Order ID and dates</li>
                        <li>• Customer details</li>
                        <li>• Book information</li>
                        <li>• Order status</li>
                      </>
                    )}
                    {filters.reportType === 'customers' && (
                      <>
                        <li>• Customer profiles</li>
                        <li>• Registration details</li>
                        <li>• Borrowing history</li>
                        <li>• Contact information</li>
                      </>
                    )}
                    {filters.reportType === 'books' && (
                      <>
                        <li>• Book catalog</li>
                        <li>• Author information</li>
                        <li>• Borrowing statistics</li>
                        <li>• Availability status</li>
                      </>
                    )}
                    {filters.reportType === 'payments' && (
                      <>
                        <li>• Payment amounts</li>
                        <li>• Transaction dates</li>
                        <li>• Customer payments</li>
                        <li>• Revenue summary</li>
                      </>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
