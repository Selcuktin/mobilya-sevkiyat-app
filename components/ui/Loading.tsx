'use client'

import { Package, Loader2 } from 'lucide-react'

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg'
  text?: string
  fullScreen?: boolean
}

export function Loading({ size = 'md', text = 'Yükleniyor...', fullScreen = false }: LoadingProps) {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  }

  const textSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  }

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="text-center">
          <div className="relative">
            <Package className={`${sizes[size]} text-blue-600 mx-auto mb-4 animate-pulse`} />
            <Loader2 className={`${sizes[size]} text-blue-400 absolute inset-0 mx-auto animate-spin`} />
          </div>
          <p className={`${textSizes[size]} text-gray-600 dark:text-gray-400 font-medium`}>{text}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center p-8">
      <div className="text-center">
        <div className="relative">
          <Package className={`${sizes[size]} text-blue-600 mx-auto mb-2 animate-pulse`} />
          <Loader2 className={`${sizes[size]} text-blue-400 absolute inset-0 mx-auto animate-spin`} />
        </div>
        <p className={`${textSizes[size]} text-gray-600 dark:text-gray-400 font-medium`}>{text}</p>
      </div>
    </div>
  )
}

export function ButtonLoading({ children, loading, ...props }: any) {
  return (
    <button {...props} disabled={loading || props.disabled}>
      <div className="flex items-center justify-center">
        {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
        {children}
      </div>
    </button>
  )
}