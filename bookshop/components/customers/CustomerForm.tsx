'use client'

import { useState, useEffect } from 'react'

interface CustomerFormProps {
  customer?: any
  onSubmit: (customerData: any) => void
  onCancel: () => void
}

export default function CustomerForm({ customer, onSubmit, onCancel }: CustomerFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    contact: '',
    registrationNo: '',
    date: new Date().toISOString().split('T')[0]
  })

  const [errors, setErrors] = useState<{[key: string]: string}>({})

  useEffect(() => {
    if (customer) {
      setFormData({
        name: customer.name || '',
        contact: customer.contact || '',
        registrationNo: customer.registrationNo || '',
        date: customer.date ? customer.date.split('T')[0] : new Date().toISOString().split('T')[0]
      })
    } else {
      setFormData({
        name: '',
        contact: '',
        registrationNo: '',
        date: new Date().toISOString().split('T')[0]
      })
    }
    setErrors({})
  }, [customer])

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    }

    if (!formData.contact.trim()) {
      newErrors.contact = 'Contact is required'
    }

    if (!formData.registrationNo.trim()) {
      newErrors.registrationNo = 'Registration number is required'
    }

    if (!formData.date) {
      newErrors.date = 'Date is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    onSubmit({
      name: formData.name.trim(),
      contact: formData.contact.trim(),
      registrationNo: formData.registrationNo.trim(),
      date: new Date(formData.date).toISOString()
    })
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Customer Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter customer's name"
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contact *
            </label>
            <input
              type="text"
              value={formData.contact}
              onChange={(e) => handleInputChange('contact', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.contact ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Phone number or email"
            />
            {errors.contact && (
              <p className="text-red-500 text-sm mt-1">{errors.contact}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Registration Number *
            </label>
            <input
              type="text"
              value={formData.registrationNo}
              onChange={(e) => handleInputChange('registrationNo', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.registrationNo ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Unique registration number"
            />
            {errors.registrationNo && (
              <p className="text-red-500 text-sm mt-1">{errors.registrationNo}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Registration Date *
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => handleInputChange('date', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.date ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.date && (
              <p className="text-red-500 text-sm mt-1">{errors.date}</p>
            )}
          </div>

          <div className="flex gap-2 pt-4">
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {customer ? 'Update Customer' : 'Add Customer'}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Cancel
            </button>
          </div>
        </form>
  )
}
