'use client'

import { useState, useEffect, useCallback } from 'react'
import Navigation from '@/components/Navigation'
import OrderForm from '@/components/orders/OrderForm'
import OrderList from '@/components/orders/OrderList'
import OrderDetails from '@/components/orders/OrderDetails'
import { Plus, Search } from 'lucide-react'

interface Order {
  id: number
  quantity: number
  totalAmount: number
  status: string
  orderDate: string
  returnDate?: string
  customer: {
    name: string
    email: string
  }
  book: {
    title: string
    price: number
  }
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [showOrderDetails, setShowOrderDetails] = useState(false)
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const fetchOrders = useCallback(async (forceRefresh = false) => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
      })

      if (searchQuery) params.append('search', searchQuery)
      if (statusFilter) params.append('status', statusFilter)
      // Add timestamp to bypass cache when forcing refresh
      if (forceRefresh) {
        params.append('_t', Date.now().toString())
      }

      const response = await fetch(`/api/orders?${params}&t=${Date.now()}`, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      })
      if (response.ok) {
        const data = await response.json()
        setOrders(data.orders)
        setTotalPages(data.pagination.totalPages)
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }, [page, searchQuery, statusFilter])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  const handleOrderClick = (orderId: number) => {
    setSelectedOrderId(orderId)
    setShowOrderDetails(true)
  }

  const handleCreateOrder = async (orderData: any) => {
    try {
      const response = await fetch(`/api/orders?t=${Date.now()}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        },
        body: JSON.stringify(orderData),
      })

      if (response.ok) {
        await fetchOrders(true) // Force refresh to bypass cache
        setShowForm(false)
      } else {
        const error = await response.json()
        alert(error.error || 'Error creating order')
      }
    } catch (error) {
      console.error('Error creating order:', error)
      alert('Error creating order')
    }
  }

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
    setPage(1)
  }

  const handleStatusFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value)
    setPage(1)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Orders Management</h1>
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              <span>New Order</span>
            </button>
          </div>

          {/* Filters */}
          <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search by customer name or order ID..."
                value={searchQuery}
                onChange={handleSearch}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <select
              value={statusFilter}
              onChange={handleStatusFilter}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Orders</option>
              <option value="0">Pending</option>
              <option value="1">Completed</option>
            </select>
          </div>

          {/* Order Form Modal */}
          {showForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-6xl mx-4 max-h-[95vh] overflow-y-auto">
                <h2 className="text-xl font-bold mb-4">Create New Order</h2>
                <OrderForm
                  onSubmit={handleCreateOrder}
                  onCancel={() => setShowForm(false)}
                />
              </div>
            </div>
          )}

          {/* Orders List */}
          <OrderList
            orders={orders}
            loading={loading}
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            onRefresh={fetchOrders}
            onOrderClick={handleOrderClick}
          />

          {/* Order Details Modal */}
          <OrderDetails
            isOpen={showOrderDetails}
            onClose={async () => {
              setShowOrderDetails(false)
              setSelectedOrderId(null)
              // Refresh orders list when modal closes to show updated status
              await fetchOrders(true)
            }}
            orderId={selectedOrderId}
          />
        </div>
      </main>
    </div>
  )
}
