'use client'

import Link from 'next/link'
import { LucideIcon } from 'lucide-react'

interface DashboardCardProps {
  title: string
  href: string
  icon: LucideIcon
  description: string
  color: string
}

export default function DashboardCard({ 
  title, 
  href, 
  icon: Icon, 
  description, 
  color 
}: DashboardCardProps) {
  return (
    <Link href={href} className="group">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
        <div className="flex items-center">
          <div className={`flex-shrink-0 p-3 rounded-lg ${color}`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
          <div className="ml-4 flex-1">
            <h3 className="text-lg font-medium text-gray-900 group-hover:text-blue-600">
              {title}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {description}
            </p>
          </div>
        </div>
      </div>
    </Link>
  )
}
