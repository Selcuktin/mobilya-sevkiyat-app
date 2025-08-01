'use client'

import { useSession, signOut } from 'next-auth/react'
import { Package, LogOut, User, Sun, Moon } from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'

export default function Header() {
  const { data: session } = useSession()
  const { theme, toggleTheme } = useTheme()

  return (
    <header className="bg-white/95 backdrop-blur-sm shadow-lg border-b border-blue-100 dark:bg-gray-900/95 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-18">
          <div className="flex items-center">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
              <Package className="h-8 w-8 text-white" />
            </div>
            <div className="ml-3">
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Mobilya Sevkiyat
              </span>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Yönetim Sistemi</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={toggleTheme}
              className="p-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
              title={theme === 'light' ? 'Karanlık Moda Geç' : 'Aydınlık Moda Geç'}
            >
              {theme === 'light' ? (
                <Moon className="h-5 w-5 text-gray-700" />
              ) : (
                <Sun className="h-5 w-5 text-yellow-500" />
              )}
            </button>
            <div className="flex items-center bg-gray-50 dark:bg-gray-800 rounded-full px-4 py-2 border border-gray-200 dark:border-gray-700">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mr-3">
                <User className="h-4 w-4 text-white" />
              </div>
              <div className="text-sm">
                <p className="font-medium text-gray-900 dark:text-gray-100">Hoş geldin,</p>
                <p className="text-gray-600 dark:text-gray-400 text-xs">{session?.user?.name || session?.user?.email}</p>
              </div>
            </div>
            <button 
              onClick={() => signOut({ callbackUrl: '/auth/signin' })}
              className="bg-gradient-to-r from-red-500 to-red-600 text-white px-5 py-2.5 rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-200 flex items-center shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Çıkış
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}