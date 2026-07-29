import { ChevronLeft, ChevronRight } from 'lucide-react'

import { Button } from '@/components/ui/button'

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  isDisabled?: boolean
}

export function Pagination({ currentPage, totalPages, onPageChange, isDisabled }: PaginationProps) {
  return (
    <div className="flex items-center justify-end space-x-2 py-4">
      <div className="text-sm text-muted-foreground mr-4">
        Page {currentPage} of {Math.max(1, totalPages)}
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1 || isDisabled}
      >
        <ChevronLeft className="h-4 w-4 mr-1" />
        Previous
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages || isDisabled}
      >
        Next
        <ChevronRight className="h-4 w-4 ml-1" />
      </Button>
    </div>
  )
}
