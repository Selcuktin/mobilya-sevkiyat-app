export interface PaginationParams {
  page: number
  limit: number
  search?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

export function getPaginationParams(searchParams: URLSearchParams): PaginationParams {
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10')))
  const search = searchParams.get('search') || undefined
  const sortBy = searchParams.get('sortBy') || undefined
  const sortOrder = (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc'

  return { page, limit, search, sortBy, sortOrder }
}

export function createPaginatedResponse<T>(
  data: T[],
  total: number,
  params: PaginationParams
): PaginatedResponse<T> {
  const totalPages = Math.ceil(total / params.limit)
  
  return {
    data,
    pagination: {
      page: params.page,
      limit: params.limit,
      total,
      totalPages,
      hasNext: params.page < totalPages,
      hasPrev: params.page > 1
    }
  }
}

export function getPrismaSkipTake(params: PaginationParams) {
  return {
    skip: (params.page - 1) * params.limit,
    take: params.limit
  }
}

// Enhanced pagination utilities with advanced features

export interface AdvancedPaginationParams extends PaginationParams {
  filters?: Record<string, any>
}

export interface AdvancedPaginatedResponse<T> extends PaginatedResponse<T> {
  filters?: Record<string, any>
  search?: string
}

// Create Prisma orderBy from pagination params
export function getPrismaOrderBy(params: PaginationParams, defaultSortBy: string = 'createdAt') {
  const sortBy = params.sortBy || defaultSortBy
  const sortOrder = params.sortOrder || 'desc'
  
  return { [sortBy]: sortOrder }
}

// Search helper for Prisma
export function createSearchCondition(search: string, searchFields: string[]) {
  if (!search || !searchFields.length) return {}
  
  return {
    OR: searchFields.map(field => ({
      [field]: {
        contains: search,
        mode: 'insensitive' as const
      }
    }))
  }
}

// Filter helper for Prisma
export function createFilterConditions(filters: Record<string, any>) {
  if (!filters) return {}
  
  const conditions: Record<string, any> = {}
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      // Handle different filter types
      if (key.endsWith('_gte')) {
        const field = key.replace('_gte', '')
        conditions[field] = { gte: parseFloat(value) }
      } else if (key.endsWith('_lte')) {
        const field = key.replace('_lte', '')
        conditions[field] = { lte: parseFloat(value) }
      } else if (key.endsWith('_in')) {
        const field = key.replace('_in', '')
        conditions[field] = { in: Array.isArray(value) ? value : [value] }
      } else {
        conditions[key] = value
      }
    }
  })
  
  return conditions
}

// Complete Prisma query builder
export function buildPaginatedQuery(
  params: AdvancedPaginationParams,
  searchFields: string[] = [],
  defaultSortBy: string = 'createdAt'
) {
  const { skip, take } = getPrismaSkipTake(params)
  const orderBy = getPrismaOrderBy(params, defaultSortBy)
  
  let where: any = {}
  
  // Add search conditions
  if (params.search) {
    const searchCondition = createSearchCondition(params.search, searchFields)
    where = { ...where, ...searchCondition }
  }
  
  // Add filter conditions
  if (params.filters) {
    const filterConditions = createFilterConditions(params.filters)
    where = { ...where, ...filterConditions }
  }
  
  return {
    where: Object.keys(where).length > 0 ? where : undefined,
    orderBy,
    skip,
    take
  }
}

// Frontend pagination component helpers
export function generatePageNumbers(currentPage: number, totalPages: number, maxVisible: number = 5) {
  const pages: (number | string)[] = []
  
  if (totalPages <= maxVisible) {
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i)
    }
  } else {
    const halfVisible = Math.floor(maxVisible / 2)
    let start = Math.max(1, currentPage - halfVisible)
    let end = Math.min(totalPages, start + maxVisible - 1)
    
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1)
    }
    
    if (start > 1) {
      pages.push(1)
      if (start > 2) pages.push('...')
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i)
    }
    
    if (end < totalPages) {
      if (end < totalPages - 1) pages.push('...')
      pages.push(totalPages)
    }
  }
  
  return pages
}

// URL helper for pagination
export function createPaginationUrl(
  baseUrl: string,
  params: AdvancedPaginationParams,
  newPage?: number
): string {
  const url = new URL(baseUrl, 'http://localhost') // Base URL for parsing
  
  url.searchParams.set('page', (newPage || params.page).toString())
  url.searchParams.set('limit', params.limit.toString())
  
  if (params.sortBy) url.searchParams.set('sortBy', params.sortBy)
  if (params.sortOrder) url.searchParams.set('sortOrder', params.sortOrder)
  if (params.search) url.searchParams.set('search', params.search)
  
  if (params.filters) {
    Object.entries(params.filters).forEach(([key, value]) => {
      url.searchParams.set(`filter_${key}`, value.toString())
    })
  }
  
  return url.pathname + url.search
}

// Pagination component for React
export interface PaginationComponentProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  maxVisible?: number
  showFirstLast?: boolean
  showPrevNext?: boolean
}