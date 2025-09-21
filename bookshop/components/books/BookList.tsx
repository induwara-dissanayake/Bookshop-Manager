'use client'

import { Edit, Trash2, Package } from 'lucide-react'

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

interface BookListProps {
  books: Book[]
  loading: boolean
  onEdit: (book: Book) => void
  onDelete: (bookId: number) => void
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}

export default function BookList({ 
  books, 
  loading, 
  onEdit, 
  onDelete, 
  page, 
  totalPages, 
  onPageChange 
}: BookListProps) {
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (books.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No books found</h3>
        <p className="mt-1 text-sm text-gray-500">Get started by adding a new book.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Books Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {books.map((book) => (
          <div key={book.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">{book.name}</h3>
                <p className="text-sm text-gray-600">by {book.authorName}</p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => onEdit(book)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-md"
                  title="Edit book"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => onDelete(book.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                  title="Delete book"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">ISBN:</span>
                <span className="font-medium">{book.isbn}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Price:</span>
                <span className="font-medium">Rs. {book.price.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Available:</span>
                <span className={`font-medium ${
                  book.qty > 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {book.qty} copies
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2 mt-8">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page === 1}
            className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          
          <div className="flex space-x-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
              <button
                key={pageNum}
                onClick={() => onPageChange(pageNum)}
                className={`px-3 py-2 text-sm font-medium rounded-md ${
                  page === pageNum
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {pageNum}
              </button>
            ))}
          </div>
          
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page === totalPages}
            className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}
