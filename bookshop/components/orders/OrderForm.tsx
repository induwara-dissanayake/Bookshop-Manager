'use client'

import { useState, useEffect, useCallback } from 'react'
import SearchableSelect from '../shared/SearchableSelect'

interface Customer {
  id: number
  name: string
  contact: string
}

interface Book {
  id: number
  name: string
  price: number
  qty: number
  authorName: string
}

interface Author {
  id: number
  name: string
}

interface OrderFormProps {
  onSubmit: (orderData: any) => void
  onCancel: () => void
}

export default function OrderForm({ onSubmit, onCancel }: OrderFormProps) {
  const [formData, setFormData] = useState({
    customerId: '',
    books: [] as Array<{ bookId: number; quantity: number }>
  })

  const [customers, setCustomers] = useState<Customer[]>([])
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [allBooks, setAllBooks] = useState<Book[]>([]) // Store all books for selected books lookup
  const [books, setBooks] = useState<Book[]>([]) // Current search results
  const [authors, setAuthors] = useState<Author[]>([])
  const [filteredBooks, setFilteredBooks] = useState<Book[]>([])
  const [selectedBook, setSelectedBook] = useState<Book | null>(null)
  const [selectedAuthor, setSelectedAuthor] = useState<Author | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [isLoadingBooks, setIsLoadingBooks] = useState(false)
  const [isLoadingAuthors, setIsLoadingAuthors] = useState(false)

  const fetchCustomers = useCallback(async (search?: string) => {
    try {
      setIsLoadingCustomers(true)
      const url = search ? `/api/customers?search=${encodeURIComponent(search)}&limit=50` : '/api/customers?limit=50'
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setCustomers(data.customers || [])
      }
    } catch (error) {
      console.error('Error fetching customers:', error)
    } finally {
      setIsLoadingCustomers(false)
    }
  }, [])

  const fetchBooks = useCallback(async (search?: string) => {
    try {
      setIsLoadingBooks(true)
      const url = search ? `/api/books?search=${encodeURIComponent(search)}&limit=50` : '/api/books?limit=50'
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        const fetchedBooks = data.books || []
        setBooks(fetchedBooks) // Current search results
        // Only update allBooks if we're fetching all books (no search)
        if (!search) {
          setAllBooks(fetchedBooks)
        }
      }
    } catch (error) {
      console.error('Error fetching books:', error)
    } finally {
      setIsLoadingBooks(false)
    }
  }, [])

  const fetchAuthors = useCallback(async (search?: string) => {
    try {
      setIsLoadingAuthors(true)
      const url = search ? `/api/authors?search=${encodeURIComponent(search)}&limit=50` : '/api/authors?limit=50'
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setAuthors(data.authors || [])
      }
    } catch (error) {
      console.error('Error fetching authors:', error)
    } finally {
      setIsLoadingAuthors(false)
    }
  }, [])

  useEffect(() => {
    fetchCustomers()
    fetchBooks()
    fetchAuthors()
  }, [fetchCustomers, fetchBooks, fetchAuthors])

  useEffect(() => {
    if (selectedAuthor) {
      const authorBooks = books.filter(book => book.authorName.toLowerCase().includes(selectedAuthor.name.toLowerCase()))
      setFilteredBooks(authorBooks)
    } else {
      setFilteredBooks(books)
    }
  }, [selectedAuthor, books])

  const handleBookSearch = useCallback((query: string) => {
    if (query.trim()) {
      fetchBooks(query)
    }
  }, [fetchBooks])

  // Update allBooks when a book is selected from search results
  const handleBookSelect = (book: Book | null) => {
    setSelectedBook(book)
    if (book) {
      // Add the selected book to allBooks if it's not already there
      setAllBooks(prev => {
        const exists = prev.find(b => b.id === book.id)
        if (!exists) {
          return [...prev, book]
        } else {
          // Update existing book with latest data
          return prev.map(b => b.id === book.id ? book : b)
        }
      })
    }
  }

  const handleAuthorSearch = useCallback((query: string) => {
    if (query.trim()) {
      fetchAuthors(query)
    }
  }, [fetchAuthors])

  const handleCustomerSearch = useCallback((query: string) => {
    if (query.trim()) {
      fetchCustomers(query)
    }
  }, [fetchCustomers])

  const handleCustomerChange = (customer: Customer | null) => {
    setSelectedCustomer(customer)
    setFormData(prev => ({
      ...prev,
      customerId: customer ? customer.id.toString() : ''
    }))
  }

  const addBook = () => {
    if (!selectedBook || quantity <= 0) {
      alert('Please select a book and valid quantity')
      return
    }

    // Get the book from allBooks to ensure we have the latest stock data
    const bookFromAllBooks = allBooks.find(b => b.id === selectedBook.id) || selectedBook

    if (bookFromAllBooks.qty < quantity) {
      alert(`Only ${bookFromAllBooks.qty} copies available in stock`)
      return
    }

    const bookId = selectedBook.id
    const existingIndex = formData.books.findIndex(b => b.bookId === bookId)

    if (existingIndex >= 0) {
      const updatedBooks = [...formData.books]
      const newQuantity = updatedBooks[existingIndex].quantity + quantity

      if (bookFromAllBooks.qty < newQuantity) {
        alert(`Only ${bookFromAllBooks.qty} copies available in stock`)
        return
      }

      updatedBooks[existingIndex].quantity = newQuantity
      setFormData(prev => ({ ...prev, books: updatedBooks }))
    } else {
      setFormData(prev => ({
        ...prev,
        books: [...prev.books, { bookId, quantity }]
      }))
    }

    setSelectedBook(null)
    setQuantity(1)
  }

  const removeBook = (bookId: number) => {
    setFormData(prev => ({
      ...prev,
      books: prev.books.filter(b => b.bookId !== bookId)
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.customerId || formData.books.length === 0) {
      alert('Please select a customer and add at least one book')
      return
    }

    onSubmit({
      customerId: parseInt(formData.customerId),
      books: formData.books
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Customer *
        </label>
        <SearchableSelect<Customer>
          options={customers}
          value={selectedCustomer}
          onChange={handleCustomerChange}
          placeholder="Select a customer"
          searchPlaceholder="Search customers..."
          isLoading={isLoadingCustomers}
          onSearch={handleCustomerSearch}
          getOptionId={(customer) => customer.id}
          renderOption={(customer) => (
            <div>
              <div className="font-medium">{customer.name}</div>
              <div className="text-sm text-gray-500">{customer.contact}</div>
            </div>
          )}
        />
      </div>

      <div className="border rounded-lg p-4">
        <h3 className="text-lg font-medium mb-4">Add Books</h3>

        <div className="grid grid-cols-1 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search Author (Optional)
            </label>
            <SearchableSelect
              options={authors}
              value={selectedAuthor}
              onChange={setSelectedAuthor}
              placeholder="Search and select author to filter books"
              searchPlaceholder="Type author name..."
              isLoading={isLoadingAuthors}
              onSearch={handleAuthorSearch}
              getOptionId={(author) => author.id}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Book *
            </label>
            <SearchableSelect
              options={filteredBooks}
              value={selectedBook}
              onChange={handleBookSelect}
              placeholder="Search and select a book"
              searchPlaceholder="Type book name..."
              isLoading={isLoadingBooks}
              onSearch={handleBookSearch}
              getOptionId={(book) => book.id}
              renderOption={(book) => (
                <div>
                  <div className="font-medium">{book.name}</div>
                  <div className="text-xs text-gray-500">
                    by {book.authorName} • Stock: {book.qty}
                  </div>
                </div>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quantity
              </label>
              <input
                type="number"
                min="1"
                max={selectedBook?.qty || 999}
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {selectedBook && (
                <p className="text-xs text-gray-500 mt-1">Available: {selectedBook.qty}</p>
              )}
            </div>

            <div className="flex items-end">
              <button
                type="button"
                onClick={addBook}
                disabled={!selectedBook}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Add Book
              </button>
            </div>
          </div>
        </div>

        {formData.books.length > 0 && (
          <div>
            <h4 className="font-medium mb-2">Selected Books:</h4>
            <div className="space-y-2">
              {formData.books.map((item, index) => {
                const book = allBooks.find(b => b.id === item.bookId)
                return (
                  <div key={index} className="flex justify-between items-center bg-gray-50 p-3 rounded">
                    <div>
                      <div className="font-medium">{book?.name}</div>
                      <div className="text-sm text-gray-600">
                        by {book?.authorName} • Qty: {item.quantity}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeBook(item.bookId)}
                      className="text-red-600 hover:text-red-800 px-2 py-1 rounded"
                    >
                      Remove
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-4">
        <button
          type="submit"
          className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Create Order
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
