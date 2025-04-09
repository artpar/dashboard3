import React, { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { daptinClient } from '@/daptin'
import {
  AlertCircle,
  ArrowLeft,
  ChevronRight,
  Clock,
  Edit,
  ExternalLink,
  FileText,
  Info,
  Layers,
  List,
  MoreHorizontal,
  Star,
  Tag,
  Trash2,
  User,
} from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Main } from '@/components/layout/main'
import { FieldGroup } from '@/features/entity/FieldGroup.tsx'
import { getFieldLabel } from '@/features/entity/GetFieldLabel.tsx'
import { SingleEntityColumnValuesComponent } from '@/features/entity/SingleEntityColumnValuesComponent.tsx'
import { SingleEntityRelatedRecordsComponent } from '@/features/entity/SingleEntityRelatedRecordsComponent.tsx'
import { ColumnViewer } from '@/features/entity/columns'
import { safelySerializeData } from '@/features/entity/utils/serializer.ts'
import { EntityCollectionDataProvider } from './EntityCollectionContext'
import EntityDeleteDialog from './components/dialogs/EntityDeleteDialog'
import EntityEditorDialog from './components/dialogs/EntityEditDialog'
import { useEntityData } from './hooks/useEntityData'
import { formatDate, formatDateTime } from './utils/entityFormatters'

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
  const {
    schema,
    columns,
    setSelectedItem,
    showEditDialog,
    setShowEditDialog,
    showDeleteDialog,
    setShowDeleteDialog,
    relations,
  } = useEntityData()

  const [activeTab, setActiveTab] = useState<string>('overview')
  const [fieldGroups, setFieldGroups] = useState<FieldGroup[]>([])

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
        const response = await daptinClient.jsonApi.find(entityName, entityId, {
          included_relations: '*', // Try to fetch related data
        })

        if (response.errors && response.errors.length) {
          throw new Error(
            response.errors[0].detail || `Failed to fetch ${entityName} details`
          )
        }

        // Safely serialize the data to handle circular references
        return safelySerializeData(response.data)
      } catch (err) {
        console.error(`Error fetching ${entityName} details:`, err)
        throw err
      }
    },
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  })

  // Organize columns into field groups
  useEffect(() => {
    if (columns && columns.length > 0 && entityItem) {
      // Categorize fields into groups
      const basicFields = columns
        .filter(
          (col) =>
            !col.ColumnName.includes('_id') &&
            ![
              'id',
              'reference_id',
              'created_at',
              'updated_at',
              'permission',
              'version',
            ].includes(col.ColumnName) &&
            entityItem[col.ColumnName] !== null &&
            entityItem[col.ColumnName] !== undefined
        )
        .map((col) => col.ColumnName)

      console.log('columns', columns)
      const relationFields = columns
        .filter(
          (col) =>
            (col.ForeignKeyData &&
              col.ForeignKeyData.DataSource &&
              col.ForeignKeyData.DataSource.length > 0 &&
              col.ForeignKeyData.Namespace &&
              col.ForeignKeyData.Namespace.length > 0) ||
            (col.ColumnName.endsWith('_id') &&
              !['reference_id'].includes(col.ColumnName))
        )
        .map((col) => col.ColumnName)

      const metadataFields = ['reference_id', 'permission', 'version'].filter(
        (fieldName) =>
          entityItem[fieldName] !== null && entityItem[fieldName] !== undefined
      )

      const timeFields = ['created_at', 'updated_at'].filter(
        (fieldName) =>
          entityItem[fieldName] !== null && entityItem[fieldName] !== undefined
      )

      // Define groups
      const groups: FieldGroup[] = [
        {
          id: 'basic',
          title: 'Basic Information',
          icon: <Info className='h-4 w-4' />,
          fields: basicFields,
        },
      ]

      if (relationFields.length > 0) {
        groups.push({
          id: 'relations',
          title: 'Relations',
          icon: <Layers className='h-4 w-4' />,
          fields: relationFields,
        })
      }

      if (metadataFields.length > 0) {
        groups.push({
          id: 'metadata',
          title: 'Metadata',
          icon: <Tag className='h-4 w-4' />,
          fields: metadataFields,
        })
      }

      if (timeFields.length > 0) {
        groups.push({
          id: 'time',
          title: 'Time Information',
          icon: <Clock className='h-4 w-4' />,
          fields: timeFields,
        })
      }

      setFieldGroups(groups)
    }
  }, [columns, entityItem])

  // Reset state and refetch when entityName or entityId changes
  useEffect(() => {
    setSelectedItem(null)
    refetch()

    return () => {
      // Cleanup
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

  // Find a display name for the entity
  const getEntityDisplayName = () => {
    if (!entityItem) return 'Loading...'

    // Look for common name fields
    for (const field of ['name', 'title', 'label', 'display_name']) {
      if (entityItem[field]) return entityItem[field]
    }

    // Fall back to ID
    return `${entityName} #${entityItem.id || entityItem.reference_id}`
  }

  // Get entity icon
  const getEntityIcon = () => {
    const firstLetter = entityName.charAt(0).toUpperCase()
    return (
      <Avatar className='h-16 w-16'>
        <AvatarImage
          src={entityItem?.image_url || entityItem?.avatar || entityItem?.icon}
        />
        <AvatarFallback className='text-lg font-medium'>
          {firstLetter}
        </AvatarFallback>
      </Avatar>
    )
  }

  // Format field value for display
  const formatFieldValue = (fieldName: string, value: any) => {
    if (value === null || value === undefined) return '-'

    // Find the column definition
    const column = columns.find((col) => col.ColumnName === fieldName)

    // Handle different data types
    if (fieldName === 'created_at' || fieldName === 'updated_at') {
      return formatDateTime(value)
    }

    if (fieldName === 'reference_id') {
      return (
        <code className='bg-muted rounded px-1 py-0.5 font-mono text-sm'>
          {value}
        </code>
      )
    }

    if (typeof value === 'boolean') {
      return (
        <Badge variant={value ? 'default' : 'outline'}>
          {value ? 'Yes' : 'No'}
        </Badge>
      )
    }

    if (typeof value === 'number') {
      return value.toLocaleString()
    }

    if (typeof value === 'object') {
      return (
        <code className='bg-muted block max-h-24 overflow-auto rounded p-2 text-xs'>
          {value.reference_id}
        </code>
      )
    }

    // Handle status-like fields
    if (fieldName === 'status' || fieldName.endsWith('_status')) {
      return (
        <Badge className='capitalize' variant='outline'>
          {value}
        </Badge>
      )
    }

    // Handle long text
    if (typeof value === 'string' && value.length > 100) {
      return (
        <div className='max-h-24 overflow-auto rounded border p-2 text-sm'>
          {value}
        </div>
      )
    }

    return value.toString()
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
      <Main className='flex h-full w-full flex-col overflow-hidden'>
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
            <p className='text-muted-foreground'>Loading details...</p>
          </div>
        </div>
        <div className='space-y-6'>
          <div className='flex items-center space-x-4'>
            <Skeleton className='h-16 w-16 rounded-full' />
            <div className='space-y-2'>
              <Skeleton className='h-6 w-40' />
              <Skeleton className='h-4 w-24' />
            </div>
          </div>

          <Skeleton className='h-10 w-full max-w-md' />

          <div className='grid gap-6 md:grid-cols-2'>
            <Card>
              <CardHeader className='pb-2'>
                <Skeleton className='h-5 w-32' />
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='space-y-2'>
                  <Skeleton className='h-4 w-24' />
                  <Skeleton className='h-8 w-full' />
                </div>
                <div className='space-y-2'>
                  <Skeleton className='h-4 w-24' />
                  <Skeleton className='h-8 w-full' />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className='pb-2'>
                <Skeleton className='h-5 w-32' />
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='space-y-2'>
                  <Skeleton className='h-4 w-24' />
                  <Skeleton className='h-8 w-full' />
                </div>
                <div className='space-y-2'>
                  <Skeleton className='h-4 w-24' />
                  <Skeleton className='h-8 w-full' />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </Main>
    )
  }

  return (
    <>
      <Main className='flex h-screen w-full flex-col overflow-hidden'>
        <div className='flex-shrink-0'>
          <div className='flex items-start justify-between space-y-4'>
            <div className='flex items-center space-x-2'>
              <Button
                variant='ghost'
                size='icon'
                onClick={handleBack}
                className='h-8 w-8'
              >
                <ArrowLeft className='h-4 w-4' />
                <span className='sr-only'>Back</span>
              </Button>

              <div className='flex items-center'>
                <div className='breadcrumbs text-muted-foreground text-sm'>
                  <span
                    className='cursor-pointer hover:underline'
                    onClick={handleBack}
                  >
                    {entityName}
                  </span>
                  <ChevronRight className='mx-1 inline h-4 w-4' />
                  <span className='text-foreground font-medium'>Details</span>
                </div>
              </div>
            </div>

            <div className='flex space-x-2'>
              <Button variant='outline' size='sm' onClick={handleEdit}>
                <Edit className='mr-2 h-4 w-4' />
                Edit
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant='outline' size='icon' className='h-8 w-8'>
                    <MoreHorizontal className='h-4 w-4' />
                    <span className='sr-only'>More options</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align='end' className='w-56'>
                  <DropdownMenuItem onClick={handleEdit}>
                    <Edit className='mr-2 h-4 w-4' />
                    Edit details
                  </DropdownMenuItem>

                  <DropdownMenuItem>
                    <ExternalLink className='mr-2 h-4 w-4' />
                    Open in new tab
                  </DropdownMenuItem>

                  <DropdownMenuItem>
                    <Star className='mr-2 h-4 w-4' />
                    Add to favorites
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                    onClick={handleDelete}
                    className='text-red-600'
                  >
                    <Trash2 className='mr-2 h-4 w-4' />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Entity header with icon/avatar */}
        <div className='mb-4 flex items-start space-x-4'>
          {getEntityIcon()}

          <div className='space-y-1'>
            <h1 className='text-2xl font-bold tracking-tight'>
              {getEntityDisplayName()}
            </h1>

            <div className='text-muted-foreground flex flex-wrap items-center gap-2 text-sm'>
              <Badge variant='outline' className='font-normal'>
                {entityName}
              </Badge>

              {entityItem.status && (
                <Badge variant='secondary' className='capitalize'>
                  {entityItem.status}
                </Badge>
              )}

              {entityItem.created_at && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className='flex items-center space-x-1 text-xs'>
                        <Clock className='h-3 w-3' />
                        <span>Created {formatDate(entityItem.created_at)}</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Created at {formatDateTime(entityItem.created_at)}</p>
                      {entityItem.updated_at && (
                        <p>
                          Updated at {formatDateTime(entityItem.updated_at)}
                        </p>
                      )}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}

              {entityItem.user_id && (
                <div className='flex items-center space-x-1 text-xs'>
                  <User className='h-3 w-3' />
                  <span>
                    Owner: {entityItem.user_name || entityItem.user_id}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main content with tabs */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className='flex h-full w-full flex-col overflow-hidden'
        >
          <TabsList className='flex w-full justify-start'>
            <TabsTrigger value='overview' className='flex items-center'>
              <FileText className='mr-2 h-4 w-4' />
              Overview
            </TabsTrigger>

            <TabsTrigger value='details'>
              <List className='mr-2 h-4 w-4' />
              All Fields
            </TabsTrigger>

            {relations.length > 0 && (
              <TabsTrigger value='relations'>
                <Layers className='mr-2 h-4 w-4' />
                Relations
              </TabsTrigger>
            )}
          </TabsList>

          {/* Overview Tab */}
          <TabsContent
            value='overview'
            className='flex flex-col space-y-6 overflow-y-auto pb-6'
          >
            <div className='grid gap-6 md:grid-cols-2'>
              {fieldGroups.slice(0, 2).map((group) => (
                <Card key={group.id} className='h-fit'>
                  <CardHeader className='pb-2'>
                    <CardTitle className='flex items-center text-base'>
                      {group.icon}
                      <span className='ml-2'>{group.title}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className='space-y-4'>
                    {group.fields.slice(0, 5).map((fieldName) => (
                      <div key={fieldName} className='space-y-1 flex flex-col'>
                        <div className='flex text-muted-foreground text-sm font-medium'>
                          {getFieldLabel(columns, fieldName)}
                        </div>
                        <div className='flex text-sm justify-start'>
                          <ColumnViewer
                            column={
                              columns.filter(
                                (e) => e.ColumnName === fieldName
                              )[0]
                            }
                            value={entityItem[fieldName]}
                            entity={entityItem}
                          />
                        </div>
                      </div>
                    ))}

                    {group.fields.length > 5 && (
                      <Button
                        variant='link'
                        className='h-auto p-0 text-xs'
                        onClick={() => setActiveTab('details')}
                      >
                        Show {group.fields.length - 5} more fields
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

          </TabsContent>

          {/* Details Tab (All Fields) */}
          <TabsContent
            value='details'
            className='flex flex-col space-y-6 overflow-y-auto pb-6'
          >
            <Card>
              <CardHeader>
                <CardTitle>All Fields</CardTitle>
                <CardDescription>
                  Complete information about this {entityName}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SingleEntityColumnValuesComponent
                  fieldGroups={fieldGroups}
                  columns={columns}
                  entityItem={entityItem}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Relations Tab */}
          {relations.length > 0 && (
            <TabsContent
              value='relations'
              className='flex flex-col space-y-6 overflow-y-auto pb-6'
            >
              <SingleEntityRelatedRecordsComponent
                entityName={entityName}
                relations={relations}
              />
            </TabsContent>
          )}
        </Tabs>

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
      </Main>
    </>
  )
}

export default EntityDetailsComponent
