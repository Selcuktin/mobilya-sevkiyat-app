'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Package, BarChart3, Users, Truck, FileText, Home } from 'lucide-react'

const navigationItems = [
  {
    name: 'Ana Sayfa',
    href: '/',
    icon: Home,
    color: 'text-blue-600'
  },
  {
    name: 'Sevkiyat',
    href: '/sevkiyat',
    icon: Truck,
    color: 'text-orange-600'
  },
  {
    name: 'Katalog & Stok',
    href: '/katalog',
    icon: Package,
    color: 'text-blue-600'
  },
  {
    name: 'Müşteriler',
    href: '/musteriler',
    icon: Users,
    color: 'text-purple-600'
  },
  {
    name: 'Raporlar',
    href: '/raporlar',
    icon: FileText,
    color: 'text-indigo-600'
  }
]

export default function Navigation() {
  const pathname = usePathname()

  return (
    <nav className="bg-white/90 backdrop-blur-md dark:bg-gray-800/90 border-b border-blue-100 dark:border-gray-700 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-2 overflow-x-auto py-2">
          {navigationItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`
                  flex items-center px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-300 whitespace-nowrap transform hover:scale-105
                  ${isActive 
                    ? `bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg` 
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100/80 dark:hover:bg-gray-700/50'
                  }
                `}
              >
                <Icon className={`h-4 w-4 mr-2 ${isActive ? 'text-white' : 'text-gray-500 dark:text-gray-400'}`} />
                {item.name}
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}