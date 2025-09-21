'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Navigation from '@/components/Navigation'
import DashboardCard from '@/components/DashboardCard'
import { 
  BookOpen, 
  Users, 
  ShoppingCart, 
  UserCheck, 
  Package, 
  DollarSign,
  TrendingUp,
  Calendar
} from 'lucide-react'

export default function DashboardPage() {
  const router = useRouter()

  useEffect(() => {
    // Check authentication
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/check')
        if (!response.ok) {
          router.push('/login')
        }
      } catch (error) {
        router.push('/login')
      }
    }
    
    checkAuth()
  }, [router])

  const dashboardCards = [
    {
      title: 'Orders',
      href: '/dashboard/orders',
      icon: ShoppingCart,
      description: 'Manage customer orders',
      color: 'bg-blue-500'
    },
    {
      title: 'Books',
      href: '/dashboard/books',
      icon: BookOpen,
      description: 'Manage book inventory',
      color: 'bg-green-500'
    },
    {
      title: 'Customers',
      href: '/dashboard/customers',
      icon: Users,
      description: 'Manage customer information',
      color: 'bg-purple-500'
    },
    {
      title: 'Authors',
      href: '/dashboard/authors',
      icon: UserCheck,
      description: 'Manage author information',
      color: 'bg-yellow-500'
    },
    {
      title: 'Finance',
      href: '/dashboard/finance',
      icon: DollarSign,
      description: 'View payments by days and months',
      color: 'bg-red-500'
    },
    {
      title: 'Reports',
      href: '/dashboard/reports',
      icon: TrendingUp,
      description: 'Export daily and monthly reports',
      color: 'bg-teal-500'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="mt-2 text-gray-600">Welcome to the Bookshop Management System</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {dashboardCards.map((card) => (
              <DashboardCard
                key={card.title}
                title={card.title}
                href={card.href}
                icon={card.icon}
                description={card.description}
                color={card.color}
              />
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
