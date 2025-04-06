import React from 'react'
import { AlertCircle, Filter, Plus, RefreshCw } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { EntityDataProvider, useEntityData } from './EntityContext'
import { EntityDataTable } from './EntityDataTable'
import { EntityDeleteDialog } from './EntityDeleteDialog'
import { EntityFilterDialog } from './EntityFilterDialog'
import { EntityForm } from './EntityForm'

interface EntityManagementProps {
  entityName: string
  title?: string
  description?: string
}

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

const EntityManagementContent: React.FC<EntityManagementProps> = ({
  entityName,
  title,
  description,
}) => {
  const {
    data,
    isLoading,
    error,
    fetchData,
    currentPage,
    totalPages,
    pageSize,
    setCurrentPage,
    setPageSize,
    selectedItem,
    setSelectedItem,
    showCreateDialog,
    setShowCreateDialog,
    showEditDialog,
    setShowEditDialog,
    showDeleteDialog,
    setShowDeleteDialog,
    showFilterDialog,
    setShowFilterDialog,
    filters,
    setFilters,
    schema,
    columns,
    refresh,
  } = useEntityData()

  const { toast } = useToast()

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
      <Header>
        <Search />
        <div className='ml-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main>
        <div className='mb-6 flex items-center justify-between'>
          <div>
            <h1 className='text-2xl font-bold tracking-tight'>{title}</h1>
            <p className='text-muted-foreground'>{description}</p>
          </div>
          <div className='flex space-x-2'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => setShowFilterDialog(true)}
            >
              <Filter className='mr-2 h-4 w-4' />
              Filter
            </Button>
            <Button variant='outline' size='sm' onClick={refresh}>
              <RefreshCw className='mr-2 h-4 w-4' />
              Refresh
            </Button>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className='mr-2 h-4 w-4' />
              Add {entityName}
            </Button>
          </div>
        </div>

        {/* Main content with data table */}
        <Card className='mb-6'>
          <CardContent className='p-0'>
            {isLoading ? (
              <div className='space-y-4 p-6'>
                <Skeleton className='h-10 w-full' />
                <Skeleton className='h-64 w-full' />
              </div>
            ) : (
              <EntityDataTable />
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        <div className='flex items-center justify-between'>
          <div className='flex items-center space-x-2'>
            <Select
              value={pageSize.toString()}
              onValueChange={(value) => setPageSize(parseInt(value))}
            >
              <SelectTrigger className='w-[120px]'>
                <SelectValue placeholder='Rows per page' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='10'>10 rows</SelectItem>
                <SelectItem value='20'>20 rows</SelectItem>
                <SelectItem value='50'>50 rows</SelectItem>
                <SelectItem value='100'>100 rows</SelectItem>
              </SelectContent>
            </Select>
            <p className='text-muted-foreground text-sm'>
              Showing {isLoading ? '...' : (currentPage - 1) * pageSize + 1}-
              {isLoading
                ? '...'
                : Math.min(currentPage * pageSize, data?.length || 0)}{' '}
              of {isLoading ? '...' : data?.length || 0} items
            </p>
          </div>

          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  className={
                    currentPage <= 1 ? 'pointer-events-none opacity-50' : ''
                  }
                />
              </PaginationItem>

              {/* Show page numbers with ellipsis for many pages */}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = i + 1
                return (
                  <PaginationItem key={pageNum}>
                    <PaginationLink
                      onClick={() => setCurrentPage(pageNum)}
                      isActive={currentPage === pageNum}
                    >
                      {pageNum}
                    </PaginationLink>
                  </PaginationItem>
                )
              })}

              {totalPages > 5 && (
                <>
                  <PaginationItem>
                    <PaginationEllipsis />
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationLink
                      onClick={() => setCurrentPage(totalPages)}
                      isActive={currentPage === totalPages}
                    >
                      {totalPages}
                    </PaginationLink>
                  </PaginationItem>
                </>
              )}

              <PaginationItem>
                <PaginationNext
                  onClick={() =>
                    setCurrentPage(Math.min(totalPages, currentPage + 1))
                  }
                  className={
                    currentPage >= totalPages
                      ? 'pointer-events-none opacity-50'
                      : ''
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
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
        <EntityFilterDialog />
      </Main>
    </>
  )
}

export default EntityManagementComponent
