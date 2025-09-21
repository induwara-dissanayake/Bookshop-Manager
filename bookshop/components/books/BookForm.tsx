'use client'

import { useState, useEffect, useCallback } from 'react'
import SearchableSelect from '../shared/SearchableSelect'

interface Author {
  id: number
  name: string
}

interface Book {
  id: number
  name: string
  authorId: number
  authorName: string
  isbn: string
  price: number
  qty: number
}

interface BookFormProps {
  book?: Book | null
  authors: Author[]
  onSubmit: (data: any) => void
  onCancel: () => void
}

export default function BookForm({ book, authors, onSubmit, onCancel }: BookFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    authorId: '',
    isbn: '',
    price: '',
    qty: '',
  })

  const [allAuthors, setAllAuthors] = useState<Author[]>(Array.isArray(authors) ? authors : [])
  const [selectedAuthor, setSelectedAuthor] = useState<Author | null>(null)
  const [isLoadingAuthors, setIsLoadingAuthors] = useState(false)
  const [nameSuggestions, setNameSuggestions] = useState<Book[]>([])
  const [isSearchingNames, setIsSearchingNames] = useState(false)

  useEffect(() => {
    if (book) {
      setFormData({
        name: book.name,
        authorId: book.authorId.toString(),
        isbn: book.isbn,
        price: book.price.toString(),
        qty: book.qty.toString(),
      })

      // Find and set the selected author
      if (Array.isArray(authors)) {
        const author = authors.find(a => a.id === book.authorId)
        if (author) {
          setSelectedAuthor(author)
        }
      }
    }
  }, [book, authors])

  useEffect(() => {
    setAllAuthors(Array.isArray(authors) ? authors : [])
  }, [authors])

  const fetchAuthors = useCallback(async (search?: string) => {
    try {
      setIsLoadingAuthors(true)
      const url = search ? `/api/authors?search=${encodeURIComponent(search)}` : '/api/authors'
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setAllAuthors(data.authors || [])
      }
    } catch (error) {
      console.error('Error fetching authors:', error)
    } finally {
      setIsLoadingAuthors(false)
    }
  }, [])

  const handleAuthorSearch = useCallback((query: string) => {
    if (query.trim()) {
      fetchAuthors(query)
    }
  }, [fetchAuthors])

  const handleAuthorChange = (author: Author | null) => {
    setSelectedAuthor(author)
    setFormData(prev => ({
      ...prev,
      authorId: author ? author.id.toString() : ''
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.authorId || !formData.isbn || !formData.price) {
      alert('Please fill in all required fields')
      return
    }

    onSubmit({
      name: formData.name.trim(),
      authorId: parseInt(formData.authorId),
      isbn: formData.isbn.trim(),
      price: parseInt(formData.price),
      qty: parseInt(formData.qty) || 0,
    })
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  // Live name suggestions for existing books
  useEffect(() => {
    const q = formData.name.trim()
    if (!q) {
      setNameSuggestions([])
      return
    }
    const t = setTimeout(async () => {
      try {
        setIsSearchingNames(true)
        const res = await fetch(`/api/books?page=1&limit=5&search=${encodeURIComponent(q)}&t=${Date.now()}`, { 
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
          }
        })
        if (res.ok) {
          const data = await res.json()
          setNameSuggestions(Array.isArray(data.books) ? data.books : [])
        }
      } catch (err) {
        // ignore
      } finally {
        setIsSearchingNames(false)
      }
    }, 300)
    return () => clearTimeout(t)
  }, [formData.name])

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Book Name *
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
        {/* Live suggestions */}
        {formData.name.trim() && (
          <div className="mt-2 bg-white border rounded shadow-sm max-h-40 overflow-auto">
            {isSearchingNames ? (
              <div className="px-3 py-2 text-sm text-gray-500">Searching...</div>
            ) : nameSuggestions.length > 0 ? (
              nameSuggestions.map((b) => (
                <div key={b.id} className="px-3 py-2 text-sm text-gray-700 flex justify-between hover:bg-gray-50">
                  <span>{b.name}</span>
                  <span className="text-xs text-gray-500">by {b.authorName}</span>
                </div>
              ))
            ) : (
              <div className="px-3 py-2 text-sm text-gray-400">No similar books found</div>
            )}
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Author *
        </label>
        <SearchableSelect
          options={allAuthors}
          value={selectedAuthor}
          onChange={handleAuthorChange}
          placeholder="Search and select an author"
          searchPlaceholder="Type author name..."
          isLoading={isLoadingAuthors}
          onSearch={handleAuthorSearch}
          getOptionId={(author) => author.id}
        />
      </div>

      <div>
        <label htmlFor="isbn" className="block text-sm font-medium text-gray-700">
          ISBN *
        </label>
        <input
          type="text"
          id="isbn"
          name="isbn"
          value={formData.isbn}
          onChange={handleChange}
          required
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label htmlFor="price" className="block text-sm font-medium text-gray-700">
          Price *
        </label>
        <input
          type="number"
          id="price"
          name="price"
          value={formData.price}
          onChange={handleChange}
          required
          min="0"
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label htmlFor="qty" className="block text-sm font-medium text-gray-700">
          Quantity
        </label>
        <input
          type="number"
          id="qty"
          name="qty"
          value={formData.qty}
          onChange={handleChange}
          min="0"
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div className="flex space-x-3 pt-4">
        <button
          type="submit"
          className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {book ? 'Update' : 'Create'} Book
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
