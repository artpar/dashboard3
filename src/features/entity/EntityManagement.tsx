import React from 'react'
import { AlertCircle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { useEntityData } from '@/features/entity/hooks/useEntityData.tsx'
import { EntityDataProvider } from './EntityContext'
import EntityForm from './components/EntityForm'
import EntityHeader from './components/EntityHeader'
import EntityDeleteDialog from './components/dialogs/EntityDeleteDialog'
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
export const EntityManagementComponent: React.FC<EntityManagementProps> = ({
  entityName,
  title,
  description,
}) => {
  return (
    <EntityDataProvider entityName={entityName}>
      <EntityManagementContent
        entityName={entityName}
        title={
          title ||
          `${entityName.charAt(0).toUpperCase() + entityName.slice(1)} Management`
        }
        description={description || `Manage your ${entityName} records`}
      />
    </EntityDataProvider>
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
  } = useEntityData()

  // Early return for error state
  if (error) {
    return (
      <>
        <Header>
          <Search />
          <div className='ml-auto flex items-center space-x-4'>
            <ThemeSwitch />
            <ProfileDropdown />
          </div>
        </Header>
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

        {/* Create/Edit Dialog */}
        <Dialog
          open={showCreateDialog || showEditDialog}
          onOpenChange={(open) => {
            if (!open) {
              setShowCreateDialog(false)
              setShowEditDialog(false)
            }
          }}
        >
          <DialogContent className='max-h-[80vh] max-w-2xl overflow-y-auto'>
            <DialogHeader>
              <DialogTitle>
                {showCreateDialog
                  ? `Create New ${entityName}`
                  : `Edit ${entityName}`}
              </DialogTitle>
              <DialogDescription>
                {showCreateDialog
                  ? `Fill out the form below to create a new ${entityName}.`
                  : `Update the ${entityName} information.`}
              </DialogDescription>
            </DialogHeader>

            <EntityForm
              mode={showCreateDialog ? 'create' : 'edit'}
              onClose={() => {
                setShowCreateDialog(false)
                setShowEditDialog(false)
              }}
            />
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <EntityDeleteDialog />

        {/* Filter Dialog */}
        <EntityFilterDialog
          open={showFilterDialog}
          onClose={() => setShowFilterDialog(false)}
          columns={[]} // This should be passed from EntityContext
          filters={filters}
          onApplyFilters={setFilters}
        />
      </Main>
    </>
  )
}

export default EntityManagementComponent
