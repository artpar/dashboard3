import React from 'react';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface EntityPaginationProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  isLoading: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

/**
 * Component for entity list pagination controls
 */
export const EntityPagination: React.FC<EntityPaginationProps> = ({
                                                                    currentPage,
                                                                    totalPages,
                                                                    pageSize,
                                                                    totalItems,
                                                                    isLoading,
                                                                    onPageChange,
                                                                    onPageSizeChange,
                                                                  }) => {
  return (
    <div className="flex items-start justify-end">

      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
              className={currentPage <= 1 ? "pointer-events-none opacity-50" : ""}
            />
          </PaginationItem>

          {/* Show page numbers with ellipsis for many pages */}
          {(() => {
            // Logic to determine which page numbers to show
            const pages = [];
            const maxVisible = 5;

            if (totalPages <= maxVisible) {
              // Show all pages if there are 5 or fewer
              for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
              }
            } else {
              // Always show page 1
              pages.push(1);

              if (currentPage > 3) {
                pages.push(null); // ellipsis placeholder
              }

              // Show current page and siblings
              for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
                pages.push(i);
              }

              if (currentPage < totalPages - 2) {
                pages.push(null); // ellipsis placeholder
              }

              // Always show last page
              if (totalPages > 1) {
                pages.push(totalPages);
              }
            }

            return pages.map((page, index) => {
              if (page === null) {
                // Render ellipsis
                return (
                  <PaginationItem key={`ellipsis-${index}`}>
                    <PaginationEllipsis />
                  </PaginationItem>
                );
              }

              // Render page number
              return (
                <PaginationItem key={`page-${page}`}>
                  <PaginationLink
                    onClick={() => onPageChange(page)}
                    isActive={currentPage === page}
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              );
            });
          })()}

          <PaginationItem>
            <PaginationNext
              onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
              className={currentPage >= totalPages ? "pointer-events-none opacity-50" : ""}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
      <div className="flex items-center space-x-2">
        <Select
          value={pageSize.toString()}
          onValueChange={(value) => onPageSizeChange(parseInt(value))}
        >
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="Rows per page" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="10">10 rows</SelectItem>
            <SelectItem value="20">20 rows</SelectItem>
            <SelectItem value="50">50 rows</SelectItem>
            <SelectItem value="100">100 rows</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground">
          Showing {isLoading ? '...' : ((currentPage - 1) * pageSize + 1)}-
          {isLoading ? '...' : Math.min(currentPage * pageSize, totalItems)} of{' '}
          {isLoading ? '...' : totalItems} items
        </p>
      </div>
    </div>
  );
};

export default EntityPagination;
