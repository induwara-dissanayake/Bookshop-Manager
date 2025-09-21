'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { ArrowLeft, Search, BookOpen, Clock, CheckCircle } from 'lucide-react'

interface Customer {
    id: number
    name: string
    contact: string
    registrationNo: string
    date: string
}

interface HistoryItem {
    orderId: number
    bookId: number
    bookName: string
    authorName: string
    status: number
    orderDate?: string
}

export default function CustomerHistoryPage({ params }: { params: { id: string } }) {
    const [search, setSearch] = useState('')
    const [loading, setLoading] = useState(false)
    const [customerLoading, setCustomerLoading] = useState(false)
    const [history, setHistory] = useState<HistoryItem[]>([])
    const [customer, setCustomer] = useState<Customer | null>(null)
    const [stats, setStats] = useState({
        totalBooks: 0,
        pendingBooks: 0,
        completedBooks: 0
    })

    const fetchCustomer = useCallback(async () => {
        setCustomerLoading(true)
        try {
            const res = await fetch(`/api/customers/${params.id}?t=${Date.now()}`, {
                headers: {
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache'
                }
            })
            if (res.ok) {
                const data = await res.json()
                setCustomer(data.customer)
            }
        } catch (error) {
            console.error('Error fetching customer:', error)
        } finally {
            setCustomerLoading(false)
        }
    }, [params.id])

    const fetchHistory = useCallback(async () => {
        setLoading(true)
        try {
            const res = await fetch(`/api/customers/${params.id}/history?search=${encodeURIComponent(search)}&t=${Date.now()}`, {
                headers: {
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache'
                }
            })
            const data = await res.json()
            const items = (data.history || []).map((d: any) => ({
                orderId: d.orderId,
                bookId: d.bookId,
                bookName: d.bookName,
                authorName: d.authorName,
                status: d.status,
                orderDate: d.order?.orderDate
            }))
            setHistory(items)
            
            // Calculate stats
            const totalBooks = items.length
            const pendingBooks = items.filter((item: HistoryItem) => item.status === 0).length
            const completedBooks = items.filter((item: HistoryItem) => item.status === 1).length
            
            setStats({
                totalBooks,
                pendingBooks,
                completedBooks
            })
        } catch (error) {
            console.error('Error fetching history:', error)
        } finally {
            setLoading(false)
        }
    }, [params.id, search])

    useEffect(() => {
        fetchCustomer()
    }, [fetchCustomer])

    useEffect(() => {
        const t = setTimeout(fetchHistory, 300)
        return () => clearTimeout(t)
    }, [fetchHistory])

    useEffect(() => {
        fetchHistory()
    }, [fetchHistory])

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Link 
                        href="/dashboard/customers" 
                        className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Customers
                    </Link>
                    <div className="border-l border-gray-300 h-6"></div>
                    <h1 className="text-2xl font-bold text-gray-900">Customer Book History</h1>
                </div>
            </div>

            {/* Customer Info Card */}
            {customerLoading ? (
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                        <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                    </div>
                </div>
            ) : customer ? (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow p-6 border border-blue-100">
                    <div className="flex items-start justify-between">
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900 mb-2">{customer.name}</h2>
                            <div className="space-y-1 text-sm text-gray-600">
                                <p><span className="font-medium">Contact:</span> {customer.contact}</p>
                                <p><span className="font-medium">Registration No:</span> {customer.registrationNo}</p>
                                <p><span className="font-medium">Member Since:</span> {new Date(customer.date).toLocaleDateString()}</p>
                            </div>
                        </div>
                    </div>
                </div>
            ) : null}

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
                    <div className="flex items-center">
                        <BookOpen className="w-8 h-8 text-blue-500" />
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Total Books</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.totalBooks}</p>
                        </div>
                    </div>
                </div>
                
                <div className="bg-white rounded-lg shadow p-6 border-l-4 border-yellow-500">
                    <div className="flex items-center">
                        <Clock className="w-8 h-8 text-yellow-500" />
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Currently Borrowed</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.pendingBooks}</p>
                        </div>
                    </div>
                </div>
                
                <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
                    <div className="flex items-center">
                        <CheckCircle className="w-8 h-8 text-green-500" />
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Returned Books</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.completedBooks}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Search Bar */}
            <div className="bg-white rounded-lg shadow p-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by book name or author..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>
                {search && (
                    <p className="mt-2 text-sm text-gray-600">
                        {loading ? 'Searching...' : `Found ${history.length} result(s) for "${search}"`}
                    </p>
                )}
            </div>

            {/* Books History Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">Book Borrowing History</h3>
                    <p className="text-sm text-gray-500 mt-1">Complete history of all books borrowed by this customer</p>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Book Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Author</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order Date</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center">
                                        <div className="flex items-center justify-center space-x-2">
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                            <span className="text-gray-500">Loading history...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : history.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center">
                                        <div className="flex flex-col items-center space-y-2">
                                            <BookOpen className="w-8 h-8 text-gray-400" />
                                            <p className="text-gray-500">
                                                {search ? 'No books found matching your search.' : 'This customer hasn\'t borrowed any books yet.'}
                                            </p>
                                            {search && (
                                                <button 
                                                    onClick={() => setSearch('')}
                                                    className="text-blue-600 hover:text-blue-800 text-sm"
                                                >
                                                    Clear search
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                history.map((h) => (
                                    <tr key={`${h.orderId}-${h.bookId}`} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            #{h.orderId}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                                            {h.bookName}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                            {h.authorName}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                h.status === 0 
                                                    ? 'bg-yellow-100 text-yellow-800' 
                                                    : 'bg-green-100 text-green-800'
                                            }`}>
                                                {h.status === 0 ? (
                                                    <>
                                                        <Clock className="w-3 h-3 mr-1" />
                                                        Currently Borrowed
                                                    </>
                                                ) : (
                                                    <>
                                                        <CheckCircle className="w-3 h-3 mr-1" />
                                                        Returned
                                                    </>
                                                )}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                            {h.orderDate ? (() => {
                                                const date = new Date(h.orderDate)
                                                const localDate = new Date(date.getTime() + (date.getTimezoneOffset() * 60000))
                                                return localDate.toLocaleDateString('en-LK', {
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric'
                                                })
                                            })() : '-'}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}


