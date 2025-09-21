'use client'

import { useState, useEffect, useRef } from 'react'
import { ChevronDown, X } from 'lucide-react'

interface SearchableSelectProps<T> {
  options: T[]
  value?: T | null
  onChange: (option: T | null) => void
  placeholder?: string
  searchPlaceholder?: string
  isLoading?: boolean
  onSearch?: (query: string) => void
  displayField?: keyof T
  renderOption?: (option: T) => React.ReactNode
  getOptionId: (option: T) => string | number
}

export default function SearchableSelect<T extends Record<string, any>>({
  options,
  value,
  onChange,
  placeholder = "Select an option",
  searchPlaceholder = "Search...",
  isLoading = false,
  onSearch,
  displayField = 'name' as keyof T,
  renderOption,
  getOptionId
}: SearchableSelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredOptions, setFilteredOptions] = useState<T[]>(options)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (Array.isArray(options)) {
      setFilteredOptions(options)
    } else {
      setFilteredOptions([])
    }
  }, [options])

  useEffect(() => {
    if (!Array.isArray(options)) {
      setFilteredOptions([])
      return
    }

    if (searchQuery.trim() === '') {
      setFilteredOptions(options)
    } else {
      const filtered = options.filter(option =>
        String(option[displayField]).toLowerCase().includes(searchQuery.toLowerCase())
      )
      setFilteredOptions(filtered)
    }
  }, [searchQuery, options, displayField])

  useEffect(() => {
    if (onSearch && searchQuery.trim() !== '') {
      const timeoutId = setTimeout(() => {
        onSearch(searchQuery)
      }, 500) // Increased debounce time
      return () => clearTimeout(timeoutId)
    }
  }, [searchQuery, onSearch])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleToggle = () => {
    setIsOpen(!isOpen)
    if (!isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus()
      }, 100)
    }
  }

  const handleOptionSelect = (option: T) => {
    onChange(option)
    setIsOpen(false)
    setSearchQuery('')
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange(null)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <div
        className="w-full px-3 py-2 border border-gray-300 rounded-md cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white flex items-center justify-between"
        onClick={handleToggle}
      >
        <span className={value ? 'text-gray-900' : 'text-gray-500'}>
          {value ? String(value[displayField]) : placeholder}
        </span>
        <div className="flex items-center gap-1">
          {value && (
            <button
              onClick={handleClear}
              className="text-gray-400 hover:text-gray-600 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-hidden">
          <div className="p-2 border-b border-gray-200">
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          
          <div className="max-h-40 overflow-y-auto">
            {isLoading ? (
              <div className="py-2 px-3 text-gray-500 text-sm">Loading...</div>
            ) : filteredOptions.length === 0 ? (
              <div className="py-2 px-3 text-gray-500 text-sm">No options found</div>
            ) : (
              filteredOptions.map((option) => (
                <div
                  key={getOptionId(option)}
                  className="py-2 px-3 hover:bg-gray-100 cursor-pointer text-sm"
                  onClick={() => handleOptionSelect(option)}
                >
                  {renderOption ? renderOption(option) : String(option[displayField])}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
