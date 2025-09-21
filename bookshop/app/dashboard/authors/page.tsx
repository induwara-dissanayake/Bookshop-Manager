'use client'

import { useState, useEffect, useCallback } from 'react'
import Navigation from '@/components/Navigation'
import AuthorForm from '@/components/authors/AuthorForm'
import AuthorList from '@/components/authors/AuthorList'
import { Plus, Search } from 'lucide-react'

interface Author {
  id: number
  name: string
  email: string
  biography: string
  birthDate: string
  nationality: string
  _count?: {
    books: number
  }
}

export default function AuthorsPage() {
  const [authors, setAuthors] = useState<Author[]>([])
  const [filteredAuthors, setFilteredAuthors] = useState<Author[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingAuthor, setEditingAuthor] = useState<Author | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const authorsPerPage = 10

  const fetchAuthors = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true)
      let url = `/api/authors?page=${currentPage}&limit=${authorsPerPage}`
      // Add timestamp to bypass cache when forcing refresh
      if (forceRefresh) {
        url += `&_t=${Date.now()}`
      }

      const response = await fetch(url, {
        headers: forceRefresh ? { 'Cache-Control': 'no-cache' } : {}
      })

      if (response.ok) {
        const data = await response.json()
        setAuthors(data.authors || [])
        setTotalPages(Math.ceil((data.total || 0) / authorsPerPage))
      } else {
        console.error('Failed to fetch authors')
      }
    } catch (error) {
      console.error('Error fetching authors:', error)
    } finally {
      setLoading(false)
    }
  }, [currentPage, authorsPerPage])

  const filterAuthors = useCallback(() => {
    if (!searchTerm) {
      setFilteredAuthors(authors)
    } else {
      const filtered = authors.filter(author =>
        author.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        author.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        author.nationality?.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredAuthors(filtered)
    }
  }, [authors, searchTerm])

  useEffect(() => {
    fetchAuthors()
  }, [fetchAuthors])

  useEffect(() => {
    filterAuthors()
  }, [filterAuthors])

  const handleAddAuthor = async (authorData: Omit<Author, 'id' | '_count'>) => {
    try {
      const response = await fetch('/api/authors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(authorData),
      })

      if (response.ok) {
        await fetchAuthors(true) // Force refresh to bypass cache
        setShowForm(false)
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to add author')
      }
    } catch (error) {
      console.error('Error adding author:', error)
      alert('Failed to add author')
    }
  }

  const handleEditAuthor = async (authorData: Omit<Author, 'id' | '_count'>) => {
    if (!editingAuthor) return

    try {
      const response = await fetch(`/api/authors/${editingAuthor.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(authorData),
      })

      if (response.ok) {
        await fetchAuthors(true) // Force refresh to bypass cache
        setEditingAuthor(null)
        setShowForm(false)
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to update author')
      }
    } catch (error) {
      console.error('Error updating author:', error)
      alert('Failed to update author')
    }
  }

  const handleDeleteAuthor = async (id: number) => {
    try {
      const response = await fetch(`/api/authors/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await fetchAuthors(true) // Force refresh to bypass cache
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to delete author')
      }
    } catch (error) {
      console.error('Error deleting author:', error)
      alert('Failed to delete author')
    }
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const openEditForm = (author: Author) => {
    setEditingAuthor(author)
    setShowForm(true)
  }

  const closeForm = () => {
    setShowForm(false)
    setEditingAuthor(null)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Authors Management</h1>
          <p className="mt-2 text-gray-600">Manage your bookshop&apos;s authors</p>
        </div>

        {/* Search and Add Section */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search authors by name, email, or nationality..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Author
          </button>
        </div>

        {/* Authors List */}
        {loading ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Loading authors...</p>
          </div>
        ) : (
          <>
            <AuthorList
              authors={filteredAuthors}
              loading={false}
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              onEdit={openEditForm}
              onDelete={handleDeleteAuthor}
              onRefresh={fetchAuthors}
            />

            {/* Pagination */}
            {!searchTerm && totalPages > 1 && (
              <div className="mt-6 flex justify-center">
                <div className="flex space-x-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span className="px-3 py-2 text-sm font-medium text-gray-700">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Author Form Modal */}
        <AuthorForm
          isOpen={showForm}
          onClose={closeForm}
          onSubmit={editingAuthor ? handleEditAuthor : handleAddAuthor}
          author={editingAuthor}
        />
      </div>
    </div>
  )
}
