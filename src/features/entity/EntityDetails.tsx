import React, { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { daptinClient } from '@/daptin'
import { AlertCircle, ArrowLeft, Edit, Trash2 } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Main } from '@/components/layout/main'
import { EntityCollectionDataProvider } from './EntityCollectionContext.tsx'
import EntityDeleteDialog from './components/dialogs/EntityDeleteDialog'
import EntityEditorDialog from './components/dialogs/EntityEditDialog'
import { useEntityData } from './hooks/useEntityData'

interface EntityDetailsContentProps {
  entityName: string
  entityId: string
}

export const EntityDetailsComponent: React.FC<{
  entityName: string
  referenceId: string
}> = ({ entityName, referenceId }) => {
  return (
    <EntityCollectionDataProvider entityName={entityName}>
      <EntityDetailsContent entityName={entityName} entityId={referenceId} />
    </EntityCollectionDataProvider>
  )
}

const EntityDetailsContent: React.FC<EntityDetailsContentProps> = ({
  entityName,
  entityId,
}) => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const {
    schema,
    columns,
    setSelectedItem,
    showEditDialog,
    setShowEditDialog,
    showDeleteDialog,
    setShowDeleteDialog,
  } = useEntityData()

  // Fetch the specific entity item
  const {
    data: entityItem,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: [`entity-${entityName}-details`, entityId],
    queryFn: async () => {
      try {
        const response = await daptinClient.jsonApi.findById(
          entityName,
          entityId
        )
        if (response.errors && response.errors.length) {
          throw new Error(
            response.errors[0].detail || `Failed to fetch ${entityName} details`
          )
        }
        return response.data
      } catch (err) {
        console.error(`Error fetching ${entityName} details:`, err)
        throw err
      }
    },
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  })

  // Reset state and refetch when entityName or entityId changes
  useEffect(() => {
    // Reset any state that needs to be cleared when navigating between entities
    setSelectedItem(null)

    // Explicitly refetch data when component mounts or entityName/entityId changes
    refetch()

    // Return cleanup function
    return () => {
      // Any cleanup needed when unmounting
    }
  }, [entityName, entityId, refetch, setSelectedItem])

  // Set the selected item when data is loaded
  useEffect(() => {
    if (entityItem) {
      setSelectedItem(entityItem)
    }
  }, [entityItem, setSelectedItem])

  // Handle edit action
  const handleEdit = () => {
    setSelectedItem(entityItem)
    setShowEditDialog(true)
  }

  // Handle delete action
  const handleDelete = () => {
    setSelectedItem(entityItem)
    setShowDeleteDialog(true)
  }

  // Handle back navigation
  const handleBack = () => {
    navigate({ to: `/_authenticated/${entityName}` })
  }

  // Early return for error state
  if (error) {
    return (
      <Main>
        <div className='mb-6 flex items-center'>
          <Button
            variant='ghost'
            size='sm'
            className='mr-2'
            onClick={handleBack}
          >
            <ArrowLeft className='mr-2 h-4 w-4' />
            Back
          </Button>
          <div>
            <h1 className='text-2xl font-bold tracking-tight'>
              {entityName} Details
            </h1>
            <p className='text-muted-foreground'>
              View details for this {entityName}
            </p>
          </div>
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
    )
  }

  // Loading state
  if (isLoading || !entityItem) {
    return (
      <Main>
        <div className='mb-6 flex items-center'>
          <Button
            variant='ghost'
            size='sm'
            className='mr-2'
            onClick={handleBack}
          >
            <ArrowLeft className='mr-2 h-4 w-4' />
            Back
          </Button>
          <div>
            <h1 className='text-2xl font-bold tracking-tight'>
              {entityName} Details
            </h1>
            <p className='text-muted-foreground'>
              View details for this {entityName}
            </p>
          </div>
        </div>
        <div className='space-y-4 p-6'>
          <Skeleton className='h-10 w-full' />
          <Skeleton className='h-64 w-full' />
        </div>
      </Main>
    )
  }

  // Group columns by category
  const basicColumns = columns.filter(
    (col) =>
      !col.ColumnName.startsWith('_') &&
      col.ColumnType !== 'datetime' &&
      !['created_at', 'updated_at', 'reference_id'].includes(col.ColumnName)
  )

  const auditColumns = columns.filter(
    (col) =>
      col.ColumnType === 'datetime' ||
      ['created_at', 'updated_at', 'reference_id'].includes(col.ColumnName)
  )

  return (
    <>
      <Main>
        <div className='mb-6 flex items-center justify-between'>
          <div className='flex items-center'>
            <Button
              variant='ghost'
              size='sm'
              className='mr-2'
              onClick={handleBack}
            >
              <ArrowLeft className='mr-2 h-4 w-4' />
              Back
            </Button>
            <div>
              <h1 className='text-2xl font-bold tracking-tight'>
                {entityItem.name || entityItem.title || `${entityName} Details`}
              </h1>
              <p className='text-muted-foreground'>
                ID: {entityItem.id || entityItem.reference_id}
              </p>
            </div>
          </div>
          <div className='flex space-x-2'>
            <Button variant='outline' size='sm' onClick={handleEdit}>
              <Edit className='mr-2 h-4 w-4' />
              Edit
            </Button>
            <Button variant='destructive' size='sm' onClick={handleDelete}>
              <Trash2 className='mr-2 h-4 w-4' />
              Delete
            </Button>
          </div>
        </div>

        <Tabs defaultValue='details' className='w-full'>
          <TabsList>
            <TabsTrigger value='details'>Details</TabsTrigger>
            <TabsTrigger value='audit'>Audit Information</TabsTrigger>
            {/* Additional tabs could be added for relations, etc. */}
          </TabsList>

          <TabsContent value='details' className='mt-4 space-y-4'>
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>
                  Details about this {entityName}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                  {basicColumns.map((column) => {
                    const value = entityItem[column.ColumnName]
                    if (value === undefined || value === null) return null

                    return (
                      <div key={column.ColumnName} className='space-y-1'>
                        <p className='text-muted-foreground text-sm font-medium'>
                          {column.ColumnLabel || column.ColumnName}
                        </p>
                        <p className='text-base'>
                          {typeof value === 'object'
                            ? JSON.stringify(value)
                            : String(value)}
                        </p>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value='audit' className='mt-4 space-y-4'>
            <Card>
              <CardHeader>
                <CardTitle>Audit Information</CardTitle>
                <CardDescription>
                  System information about this record
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                  {auditColumns.map((column) => {
                    const value = entityItem[column.ColumnName]
                    if (value === undefined || value === null) return null

                    return (
                      <div key={column.ColumnName} className='space-y-1'>
                        <p className='text-muted-foreground text-sm font-medium'>
                          {column.ColumnLabel || column.ColumnName}
                        </p>
                        <p className='text-base'>
                          {column.ColumnType === 'datetime' && value
                            ? new Date(value).toLocaleString()
                            : String(value)}
                        </p>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </Main>

      {/* Edit Dialog */}
      <EntityEditorDialog
        entityName={entityName}
        setShowCreateDialog={() => {}}
        setShowEditDialog={setShowEditDialog}
        showCreateDialog={false}
        showEditDialog={showEditDialog}
      />

      {/* Delete Confirmation Dialog */}
      <EntityDeleteDialog onDeleted={handleBack} />
    </>
  )
}

export default EntityDetailsComponent
