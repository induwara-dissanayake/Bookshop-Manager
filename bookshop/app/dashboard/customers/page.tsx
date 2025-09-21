'use client'

import { useState, useEffect, useCallback } from 'react'
import Navigation from '@/components/Navigation'
import CustomerForm from '@/components/customers/CustomerForm'
import CustomerList from '@/components/customers/CustomerList'
import { Plus, Search } from 'lucide-react'

interface Customer {
  id: number
  name: string
  contact: string
  registrationNo: string
  date: string
  orders: Array<{
    id: number
    status: number
  }>
  loans: Array<{
    amount: number
  }>
  _count: {
    orders: number
  }
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const fetchCustomers = useCallback(async (forceRefresh = false) => {
    try {
      let url = `/api/customers?page=${page}&limit=10&search=${encodeURIComponent(searchQuery)}`
      // Add timestamp to bypass cache when forcing refresh
      if (forceRefresh) {
        url += `&_t=${Date.now()}`
      }

      const response = await fetch(url, {
        headers: forceRefresh ? { 'Cache-Control': 'no-cache' } : {}
      })
      if (response.ok) {
        const data = await response.json()
        setCustomers(data.customers)
        setTotalPages(data.pagination.totalPages)
      }
    } catch (error) {
      console.error('Error fetching customers:', error)
    } finally {
      setLoading(false)
    }
  }, [page, searchQuery])

  useEffect(() => {
    fetchCustomers()
  }, [fetchCustomers])

  const handleSubmit = async (customerData: any) => {
    try {
      const url = editingCustomer ? `/api/customers/${editingCustomer.id}` : '/api/customers'
      const method = editingCustomer ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customerData),
      })

      if (response.ok) {
        await fetchCustomers(true) // Force refresh to bypass cache
        setShowForm(false)
        setEditingCustomer(null)
      } else {
        const error = await response.json()
        alert(error.error || 'Error saving customer')
      }
    } catch (error) {
      console.error('Error saving customer:', error)
      alert('Error saving customer')
    }
  }

  const handleDelete = async (customerId: number) => {
    if (!confirm('Are you sure you want to delete this customer?')) return

    try {
      const response = await fetch(`/api/customers/${customerId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await fetchCustomers(true) // Force refresh to bypass cache
      } else {
        const error = await response.json()
        alert(error.error || 'Error deleting customer')
      }
    } catch (error) {
      console.error('Error deleting customer:', error)
      alert('Error deleting customer')
    }
  }

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer)
    setShowForm(true)
  }

  const handleView = (customer: Customer) => {
    // Navigate to customer history page in the same window
    window.location.href = `/dashboard/customers/${customer.id}`
  }

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
    setPage(1)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Customers Management</h1>
            <button
              onClick={() => {
                setEditingCustomer(null)
                setShowForm(true)
              }}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              <span>Add Customer</span>
            </button>
          </div>

          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search customers by name, contact, or registration number..."
                value={searchQuery}
                onChange={handleSearch}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Customer Form Modal */}
          {showForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                <h2 className="text-xl font-bold mb-4">
                  {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
                </h2>
                <CustomerForm
                  customer={editingCustomer}
                  onSubmit={handleSubmit}
                  onCancel={() => {
                    setShowForm(false)
                    setEditingCustomer(null)
                  }}
                />
              </div>
            </div>
          )}

          {/* Customers List */}
          <CustomerList
            customers={customers}
            loading={loading}
            onEdit={handleEdit}
            onView={handleView}
            onDelete={handleDelete}
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>
      </main>
    </div>
  )
}
