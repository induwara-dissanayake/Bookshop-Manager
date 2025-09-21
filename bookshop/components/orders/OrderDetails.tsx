'use client'

import { useState, useEffect, useCallback } from 'react'
import { X } from 'lucide-react'

interface OrderDetail {
  bookId: number
  bookName: string
  authorName: string
  status: number
  book: {
    id: number
    name: string
    price: number
  }
}

interface OrderDetailsData {
  id: number
  customerId: number
  customerName: string
  orderDate: string
  returnDate?: string
  status: number
  customer: {
    id: number
    name: string
    contact: string
  }
  orderDetails: OrderDetail[]
  totalPayment: number
  currentPayment: number
}

interface OrderDetailsProps {
  isOpen: boolean
  onClose: () => void
  orderId: number | null
}

export default function OrderDetails({ isOpen, onClose, orderId }: OrderDetailsProps) {
  const [orderData, setOrderData] = useState<OrderDetailsData | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedBooks, setSelectedBooks] = useState<number[]>([])
  const [selectAll, setSelectAll] = useState(false)
  const [completing, setCompleting] = useState(false)

  const fetchOrderDetails = useCallback(async () => {
    if (!orderId) return

    setLoading(true)
    try {
      const response = await fetch(`/api/orders/${orderId}`)
      if (response.ok) {
        const data = await response.json()
        setOrderData(data.order)
        // Reset selections when new order is loaded
        setSelectedBooks([])
        setSelectAll(false)
      } else {
        console.error('Failed to fetch order details')
      }
    } catch (error) {
      console.error('Error fetching order details:', error)
    } finally {
      setLoading(false)
    }
  }, [orderId])

  useEffect(() => {
    if (isOpen && orderId) {
      fetchOrderDetails()
    }
  }, [isOpen, orderId, fetchOrderDetails])


  const calculateCurrentPayment = () => {
    if (!orderData || selectedBooks.length === 0) return 0
    const pendingBooks = orderData.orderDetails.filter(detail => detail.status === 0)
    const paymentPerBook = orderData.totalPayment / pendingBooks.length
    return paymentPerBook * selectedBooks.length
  }

  const handleBookSelection = (bookId: number, checked: boolean) => {
    if (checked) {
      setSelectedBooks(prev => [...prev, bookId])
    } else {
      setSelectedBooks(prev => prev.filter(id => id !== bookId))
      setSelectAll(false)
    }
  }

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked)
    if (checked && orderData) {
      const pendingBookIds = orderData.orderDetails
        .filter(detail => detail.status === 0)
        .map(detail => detail.bookId)
      setSelectedBooks(pendingBookIds)
    } else {
      setSelectedBooks([])
    }
  }

  const handleCompletePayment = async () => {
    if (!orderData || selectedBooks.length === 0) return

    setCompleting(true)
    
    // Optimistic update - immediately update the UI
    const optimisticOrderData = {
      ...orderData,
      orderDetails: orderData.orderDetails.map(detail => ({
        ...detail,
        status: selectedBooks.includes(detail.bookId) ? 1 : detail.status
      }))
    }
    setOrderData(optimisticOrderData)
    
    // Reset selections immediately
    setSelectedBooks([])
    setSelectAll(false)

    try {
      const response = await fetch(`/api/orders/${orderId}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          selectedBooks,
          currentPayment: calculateCurrentPayment()
        }),
      })

      if (response.ok) {
        const result = await response.json()
        
        // Show success message
        const completedCount = selectedBooks.length
        const message = result.orderFullyCompleted 
          ? `Order completed! All ${completedCount} books processed.`
          : `${completedCount} book(s) processed. ${result.remainingPendingBooks} remaining.`
        
        // You can replace this alert with a toast notification later
        alert(message)
        
        // Check if order is fully completed
        if (result.orderFullyCompleted) {
          // Order is complete, close modal and let parent refresh
          onClose()
        }
        // If partial completion, stay open with updated UI
      } else {
        // Revert optimistic update on error
        await fetchOrderDetails()
        const error = await response.json()
        alert(error.error || 'Failed to complete payment')
      }
    } catch (error) {
      // Revert optimistic update on error
      await fetchOrderDetails()
      console.error('Error completing payment:', error)
      alert('Failed to complete payment')
    } finally {
      setCompleting(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const pendingBooks = orderData?.orderDetails.filter(detail => detail.status === 0) || []
  const currentPayment = calculateCurrentPayment()

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-6xl shadow-lg rounded-md bg-white max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-gray-900">Order Details</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
          >
            <X size={24} />
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Loading order details...</p>
          </div>
        ) : orderData ? (
          <div className="space-y-6">
            {/* Order Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 bg-gray-50 p-4 rounded-lg">
              <div>
                <h4 className="font-semibold text-gray-700">Customer Name</h4>
                <p className="text-gray-900">{orderData.customerName}</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-700">Order Date</h4>
                <p className="text-gray-900">{formatDate(orderData.orderDate)}</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-700">Total Books</h4>
                <p className="text-gray-900">{pendingBooks.length}</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-700">Total Payment</h4>
                <p className="text-gray-900">Rs. {orderData.totalPayment.toFixed(2)}</p>
              </div>
            </div>

            {/* Current Payment Display */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-700">Current Payment: Rs. {currentPayment.toFixed(2)}</h4>
            </div>

            {/* Books Table */}
            {pendingBooks.length > 0 ? (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <input
                            type="checkbox"
                            checked={selectAll}
                            onChange={(e) => handleSelectAll(e.target.checked)}
                            className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                          />
                          <span className="ml-2">Select All</span>
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Book ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Book Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Author Name
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {pendingBooks.map((detail) => (
                        <tr key={detail.bookId} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={selectedBooks.includes(detail.bookId)}
                              onChange={(e) => handleBookSelection(detail.bookId, e.target.checked)}
                              className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {detail.bookId}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {detail.bookName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {detail.authorName}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">All books have been returned for this order.</p>
              </div>
            )}

            {/* Actions */}
            {pendingBooks.length > 0 && (
              <div className="flex justify-end space-x-4">
                <button
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCompletePayment}
                  disabled={selectedBooks.length === 0 || completing}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {completing && (
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                  <span>{completing ? 'Processing Payment...' : `Complete Payment ($${currentPayment.toFixed(2)})`}</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">Failed to load order details.</p>
          </div>
        )}
      </div>
    </div>
  )
}
