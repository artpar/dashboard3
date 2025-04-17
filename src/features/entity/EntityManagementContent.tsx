import React from 'react'
import { useNavigate } from '@tanstack/react-router'
import { AlertCircle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert.tsx'
import { Skeleton } from '@/components/ui/skeleton.tsx'
import { Main } from '@/components/layout/main.tsx'
import EntityHeader from '@/features/entity/components/EntityHeader.tsx'
import EntityFilterDialog from '@/features/entity/components/dialogs/EntityFilterDialog.tsx'
import EntityPagination from '@/features/entity/components/pagination/EntityPagination.tsx'
import EntityDataTable from '@/features/entity/components/table/EntityDataTable.tsx'
import { useEntityCollectionData } from '@/features/entity/hooks/useEntityCollectionData.tsx'

export interface EntityManagementProps {
  entityName: string
  title?: string
  description?: string
}

/**
 * Main entity management UI component
 */
export const EntityManagementContent: React.FC<EntityManagementProps> = ({
  entityName,
  title,
  description,
}) => {
  const {
    isLoading,
    error,
    currentPage,
    totalPages,
    pageSize,
    setCurrentPage,
    setPageSize,
    pagination,
    showFilterDialog,
    setShowFilterDialog,
    filters,
    setFilters,
  } = useEntityCollectionData()

  // Early return for error state
  if (error) {
    return (
      <>
        <Main>
          <div className='mb-6'>
            <h1 className='text-2xl font-bold tracking-tight'>{title}</h1>
            <p className='text-muted-foreground'>{description}</p>
          </div>
          <Alert variant='destructive'>
            <AlertCircle className='h-4 w-4' />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {error instanceof Error
                ? error.message
                : 'An error occurred while fetching data'}
            </AlertDescription>
          </Alert>
        </Main>
      </>
    )
  }

  const navigate = useNavigate()
  return (
    <>
      <Main className='flex h-full w-full flex-col overflow-hidden'>
        <div className='flex-shrink-0'>
          <EntityHeader
            title={
              title ||
              `${entityName.charAt(0).toUpperCase() + entityName.slice(1)} Management`
            }
            description={description || `Manage your ${entityName} records`}
            entityName={entityName}
          />
        </div>

        {/* Main content with data table */}
        {isLoading ? (
          <div className='space-y-4 p-6'>
            <Skeleton className='h-10 w-full' />
            <Skeleton className='h-64 w-full' />
          </div>
        ) : (
          <EntityDataTable />
        )}

        {/* Fixed pagination at the bottom */}
        <div className='mt-auto flex-shrink-0 border-t border-t-gray-300 pt-4'>
          <EntityPagination
            currentPage={currentPage}
            totalPages={pagination?.lastPage || totalPages}
            pageSize={pagination?.perPage || pageSize}
            totalItems={pagination?.total || 0}
            isLoading={isLoading}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
          />
        </div>

        {/* Filter Dialog */}
        <EntityFilterDialog
          open={showFilterDialog}
          onClose={() => setShowFilterDialog(false)}
          filters={filters}
          onApplyFilters={setFilters}
        />
      </Main>
    </>
  )
}
