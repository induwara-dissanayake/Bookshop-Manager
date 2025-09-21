'use client'

import { useState, useEffect } from 'react'
import Navigation from '@/components/Navigation'
import BookForm from '@/components/books/BookForm'
import BookList from '@/components/books/BookList'
import { Plus, Search } from 'lucide-react'

interface Book {
  id: number
  name: string
  authorId: number
  authorName: string
  isbn: string
  price: number
  qty: number
  author: {
    id: number
    name: string
  }
}

interface Author {
  id: number
  name: string
}

export default function BooksPage() {
  const [books, setBooks] = useState<Book[]>([])
  const [authors, setAuthors] = useState<Author[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingBook, setEditingBook] = useState<Book | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    fetchBooks()
    fetchAuthors()
  }, [page, searchQuery])

  const fetchBooks = async (forceRefresh = false) => {
    try {
      let url = `/api/books?page=${page}&limit=10&search=${encodeURIComponent(searchQuery)}`
      // Add timestamp to bypass cache when forcing refresh
      if (forceRefresh) {
        url += `&_t=${Date.now()}`
      }

      const response = await fetch(url, {
        headers: forceRefresh ? { 'Cache-Control': 'no-cache' } : {}
      })
      if (response.ok) {
        const data = await response.json()
        setBooks(data.books)
        setTotalPages(data.pagination.totalPages)
      }
    } catch (error) {
      console.error('Error fetching books:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAuthors = async () => {
    try {
      const response = await fetch(`/api/authors?t=${Date.now()}`, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      })
      if (response.ok) {
        const data = await response.json()
        setAuthors(data)
      }
    } catch (error) {
      console.error('Error fetching authors:', error)
    }
  }

  const handleSubmit = async (bookData: any) => {
    try {
      const url = editingBook ? `/api/books/${editingBook.id}` : '/api/books'
      const method = editingBook ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookData),
      })

      if (response.ok) {
        await fetchBooks(true) // Force refresh to bypass cache
        setShowForm(false)
        setEditingBook(null)
      } else {
        const error = await response.json()
        alert(error.error || 'Error saving book')
      }
    } catch (error) {
      console.error('Error saving book:', error)
      alert('Error saving book')
    }
  }

  const handleDelete = async (bookId: number) => {
    if (!confirm('Are you sure you want to delete this book?')) return

    try {
      const response = await fetch(`/api/books/${bookId}?t=${Date.now()}`, {
        method: 'DELETE',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      })

      if (response.ok) {
        await fetchBooks(true) // Force refresh to bypass cache
      } else {
        const error = await response.json()
        alert(error.error || 'Error deleting book')
      }
    } catch (error) {
      console.error('Error deleting book:', error)
      alert('Error deleting book')
    }
  }

  const handleEdit = (book: Book) => {
    setEditingBook(book)
    setShowForm(true)
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
            <h1 className="text-3xl font-bold text-gray-900">Books Management</h1>
            <button
              onClick={() => {
                setEditingBook(null)
                setShowForm(true)
              }}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              <span>Add Book</span>
            </button>
          </div>

          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search books by name, author, or ISBN..."
                value={searchQuery}
                onChange={handleSearch}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Book Form Modal */}
          {showForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                <h2 className="text-xl font-bold mb-4">
                  {editingBook ? 'Edit Book' : 'Add New Book'}
                </h2>
                <BookForm
                  book={editingBook}
                  authors={authors}
                  onSubmit={handleSubmit}
                  onCancel={() => {
                    setShowForm(false)
                    setEditingBook(null)
                  }}
                />
              </div>
            </div>
          )}

          {/* Books List */}
          <BookList
            books={books}
            loading={loading}
            onEdit={handleEdit}
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
