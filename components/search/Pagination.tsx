'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa'

interface PaginationProps {
  currentPage: number
  totalPages: number
  hasMore: boolean
  hasPrevious: boolean
  searchParams: Record<string, string | undefined>
}

export function Pagination({
  currentPage,
  totalPages,
  hasMore,
  hasPrevious,
  searchParams,
}: PaginationProps) {
  const router = useRouter()

  const buildPageUrl = (page: number) => {
    const params = new URLSearchParams()

    // Preserve all existing search params
    Object.entries(searchParams).forEach(([key, value]) => {
      if (value && key !== 'page') {
        params.set(key, value)
      }
    })

    // Set new page
    params.set('page', page.toString())

    return `/listings?${params.toString()}`
  }

  const handlePageChange = (page: number) => {
    router.push(buildPageUrl(page))
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    const maxPagesToShow = 5

    if (totalPages <= maxPagesToShow) {
      // Show all pages
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Show first page
      pages.push(1)

      if (currentPage > 3) {
        pages.push('...')
      }

      // Show pages around current page
      const start = Math.max(2, currentPage - 1)
      const end = Math.min(totalPages - 1, currentPage + 1)

      for (let i = start; i <= end; i++) {
        pages.push(i)
      }

      if (currentPage < totalPages - 2) {
        pages.push('...')
      }

      // Show last page
      pages.push(totalPages)
    }

    return pages
  }

  if (totalPages <= 1) {
    return null
  }

  return (
    <div className="flex items-center justify-center gap-2 mt-8">
      {/* Previous Button */}
      <Button
        variant="outline"
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={!hasPrevious}
        className="gap-2"
      >
        <FaChevronLeft className="w-4 h-4" />
        Previous
      </Button>

      {/* Page Numbers */}
      <div className="hidden md:flex items-center gap-2">
        {getPageNumbers().map((page, index) => {
          if (page === '...') {
            return (
              <span key={`ellipsis-${index}`} className="px-2 text-gray-500">
                ...
              </span>
            )
          }

          const pageNum = page as number
          const isCurrentPage = pageNum === currentPage

          return (
            <Button
              key={pageNum}
              variant={isCurrentPage ? 'default' : 'outline'}
              onClick={() => handlePageChange(pageNum)}
              className={`min-w-[40px] ${
                isCurrentPage ? 'pointer-events-none' : ''
              }`}
            >
              {pageNum}
            </Button>
          )
        })}
      </div>

      {/* Mobile: Just show page X of Y */}
      <div className="md:hidden">
        <span className="text-sm text-gray-600">
          Page {currentPage} of {totalPages}
        </span>
      </div>

      {/* Next Button */}
      <Button
        variant="outline"
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={!hasMore}
        className="gap-2"
      >
        Next
        <FaChevronRight className="w-4 h-4" />
      </Button>
    </div>
  )
}
