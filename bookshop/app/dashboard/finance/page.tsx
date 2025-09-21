'use client'

import { useState, useEffect, useCallback } from 'react'
import Navigation from '@/components/Navigation'
import { Calendar, DollarSign, TrendingUp, BarChart3, Eye } from 'lucide-react'

interface PaymentData {
  date: string
  totalPayments: number
  orderCount: number
  customerCount: number
}

interface MonthlyData {
  month: number
  year: number
  totalPayments: number
  orderCount: number
  customerCount: number
}

export default function FinancePage() {
  const [activeTab, setActiveTab] = useState<'daily' | 'monthly'>('daily')
  const [dailyData, setDailyData] = useState<PaymentData[]>([])
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  
  const fetchDailyData = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/finance/daily?month=${selectedMonth}&year=${selectedYear}`)
      const data = await response.json()
      setDailyData(data.payments || [])
    } catch (error) {
      console.error('Error fetching daily data:', error)
    } finally {
      setLoading(false)
    }
  }, [selectedMonth, selectedYear])

  const fetchMonthlyData = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/finance/monthly?year=${selectedYear}`)
      const data = await response.json()
      setMonthlyData(data.payments || [])
    } catch (error) {
      console.error('Error fetching monthly data:', error)
    } finally {
      setLoading(false)
    }
  }, [selectedYear])

  useEffect(() => {
    if (activeTab === 'daily') {
      fetchDailyData()
    } else {
      fetchMonthlyData()
    }
  }, [activeTab, fetchDailyData, fetchMonthlyData])

  const formatCurrency = (amount: number) => {
    return `Rs. ${amount.toFixed(2)}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getMonthName = (monthNum: number) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return months[monthNum - 1]
  }

  const totalPayments = activeTab === 'daily' 
    ? dailyData.reduce((sum, item) => sum + item.totalPayments, 0)
    : monthlyData.reduce((sum, item) => sum + item.totalPayments, 0)

  const totalOrders = activeTab === 'daily'
    ? dailyData.reduce((sum, item) => sum + item.orderCount, 0)
    : monthlyData.reduce((sum, item) => sum + item.orderCount, 0)

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <DollarSign className="w-8 h-8 mr-3 text-green-600" />
              Finance Dashboard
            </h1>
            <p className="mt-2 text-gray-600">Track payments and revenue by day and month</p>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
              <div className="flex items-center">
                <DollarSign className="w-8 h-8 text-green-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalPayments)}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
              <div className="flex items-center">
                <BarChart3 className="w-8 h-8 text-blue-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Orders</p>
                  <p className="text-2xl font-bold text-gray-900">{totalOrders}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
              <div className="flex items-center">
                <TrendingUp className="w-8 h-8 text-purple-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Avg per Order</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {totalOrders > 0 ? formatCurrency(totalPayments / totalOrders) : 'Rs. 0.00'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="bg-white rounded-lg shadow mb-6">
            <div className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                {/* Tab Buttons */}
                <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setActiveTab('daily')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      activeTab === 'daily'
                        ? 'bg-white text-blue-600 shadow'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <Calendar className="w-4 h-4 inline mr-2" />
                    Daily View
                  </button>
                  <button
                    onClick={() => setActiveTab('monthly')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      activeTab === 'monthly'
                        ? 'bg-white text-blue-600 shadow'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <BarChart3 className="w-4 h-4 inline mr-2" />
                    Monthly View
                  </button>
                </div>

                {/* Date Filters */}
                <div className="flex space-x-4">
                  {activeTab === 'daily' && (
                    <select
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(Number(e.target.value))}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {Array.from({ length: 12 }, (_, i) => (
                        <option key={i + 1} value={i + 1}>
                          {getMonthName(i + 1)}
                        </option>
                      ))}
                    </select>
                  )}
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {Array.from({ length: 5 }, (_, i) => {
                      const year = new Date().getFullYear() - 2 + i
                      return (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      )
                    })}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Data Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                {activeTab === 'daily' ? `Daily Payments - ${getMonthName(selectedMonth)} ${selectedYear}` : `Monthly Payments - ${selectedYear}`}
              </h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {activeTab === 'daily' ? 'Date' : 'Month'}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Payments
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Orders
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customers
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Avg per Order
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                          <span className="text-gray-500">Loading...</span>
                        </div>
                      </td>
                    </tr>
                  ) : (activeTab === 'daily' ? dailyData : monthlyData).length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                        No payment data available for this period
                      </td>
                    </tr>
                  ) : (
                    (activeTab === 'daily' ? dailyData : monthlyData).map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {activeTab === 'daily' 
                            ? formatDate((item as PaymentData).date) 
                            : `${getMonthName((item as MonthlyData).month)} ${(item as MonthlyData).year}`
                          }
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                          {formatCurrency(item.totalPayments)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.orderCount}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.customerCount}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {item.orderCount > 0 ? formatCurrency(item.totalPayments / item.orderCount) : 'Rs. 0.00'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
