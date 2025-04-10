import React from 'react'
import { AlertCircle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { Main } from '@/components/layout/main'
import { useEntityCollectionData } from '@/features/entity/hooks/useEntityCollectionData.tsx'
import { CollectionEntityDataProvider } from '@/features/entity/providers/CollectionEntityDataProvider.tsx'
import EntityHeader from './components/EntityHeader'
import EntityFilterDialog from './components/dialogs/EntityFilterDialog'
import EntityPagination from './components/pagination/EntityPagination'
import EntityDataTable from './components/table/EntityDataTable'

interface EntityManagementProps {
  entityName: string
  title?: string
  description?: string
}

/**
 * Container component that wraps the data provider
 */
export const CollectionEntityManagementComponent: React.FC<EntityManagementProps> = ({
  entityName,
  title,
  description,
}) => {
  return (
    <CollectionEntityDataProvider entityName={entityName}>
      <EntityManagementContent
        entityName={entityName}
        title={
          title ||
          `${entityName.charAt(0).toUpperCase() + entityName.slice(1)} Management`
        }
        description={description || `Manage your ${entityName} records`}
      />
    </CollectionEntityDataProvider>
  )
}

/**
 * Main entity management UI component
 */
const EntityManagementContent: React.FC<EntityManagementProps> = ({
  entityName,
  title,
  description,
}) => {
  const {
    data,
    isLoading,
    error,
    refresh,
    currentPage,
    totalPages,
    pageSize,
    setCurrentPage,
    setPageSize,
    showCreateDialog,
    setShowCreateDialog,
    showEditDialog,
    setShowEditDialog,
    showFilterDialog,
    setShowFilterDialog,
    filters,
    setFilters,
    availableActions,
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

  return (
    <>
      <Main className='flex h-full w-full flex-col overflow-hidden'>
        <div className='flex-shrink-0'>
          <EntityHeader
            title={title || ''}
            description={description || ''}
            availableActions={availableActions}
            onRefresh={refresh}
            onCreateNew={() => setShowCreateDialog(true)}
            onShowFilters={() => setShowFilterDialog(true)}
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
            totalPages={totalPages}
            pageSize={pageSize}
            totalItems={data?.length || 0}
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

export default CollectionEntityManagementComponent
