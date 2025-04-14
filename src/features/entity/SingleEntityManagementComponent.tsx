import React, { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { daptinClient } from '@/daptin.ts'
import {
  ArrowLeft,
  ChevronRight,
  Clock,
  Edit,
  ExternalLink,
  FileText,
  Key,
  Layers,
  List,
  MoreHorizontal,
  Star,
  Trash2,
  User,
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar.tsx'
import { Badge } from '@/components/ui/badge.tsx'
import { Button } from '@/components/ui/button.tsx'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu.tsx'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs.tsx'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip.tsx'
import { Main } from '@/components/layout/main.tsx'
import SingleEntityAllRelationsViewComponent from '@/features/entity/SingleEntityAllRelationsViewComponent.tsx'
import { ErrorLoadingEntityPanel } from '@/features/entity/ErrorLoadingEntityPanel.tsx'
import { LoadingEntityPanel } from '@/features/entity/LoadingEntityPanel.tsx'
import { SingleEntitySummaryViewComponent } from '@/features/entity/SingleEntitySummaryViewComponent.tsx'
import PermissionColumnEditor from '@/features/entity/columns/editors/PermissionColumnEditor.tsx'
import { SingleEntityAllFieldsViewComponent } from '@/features/entity/detail-view'
import { useEntitySingleData } from '@/features/entity/hooks/useEntitySingleData.tsx'
import {
  formatDate,
  formatDateTime,
} from '@/features/entity/utils/entityFormatters.tsx'
import { safelySerializeData } from '@/features/entity/utils/serializer.ts'

interface EntityDetailsContentProps {
  entityName: string
  entityId: string
}

export const SingleEntityManagementComponent: React.FC<
  EntityDetailsContentProps
> = ({}) => {
  const navigate = useNavigate()
  const { columns, setSelectedItem, entityName, entityId, relations } =
    useEntitySingleData()

  const [activeTab, setActiveTab] = useState<string>('overview')

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
    navigate({
      to: '/' + entityName + '/' + entityId + '/edit',
    })
  }

  // Handle delete action
  const handleDelete = () => {
    alert('TODO: handleDelete')
    setSelectedItem(entityItem)
  }

  // Handle back navigation
  const handleBack = () => {
    navigate({ to: `/${entityName}` })
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

  // Early return for error state
  if (error) {
    return <ErrorLoadingEntityPanel entityName={entityName} error={error} />
  }

  // Loading state
  if (isLoading || !entityItem) {
    return <LoadingEntityPanel entityName={entityName} />
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

            <TabsTrigger value='permissions'>
              <Key className='mr-2 h-4 w-4' />
              Permissions
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
            <SingleEntitySummaryViewComponent
              columns={columns}
              entityItem={entityItem}
            />
          </TabsContent>

          {/* Details Tab (All Fields) */}
          <TabsContent
            value='details'
            className='flex flex-col space-y-6 overflow-y-auto pb-6'
          >
            <SingleEntityAllFieldsViewComponent columns={columns} entityItem={entityItem} />
          </TabsContent>
          <TabsContent
            value='permissions'
            className='flex flex-col space-y-6 overflow-y-auto pb-6'
          >
            <PermissionColumnEditor
              onChange={(v) => {
                console.log('Permission value changed', v)
              }}
              value={entityItem['permission']}
            />
          </TabsContent>

          {/* Relations Tab */}
          {relations.length > 0 && (
            <TabsContent
              value='relations'
              className='flex flex-col space-y-6 overflow-y-auto pb-6'
            >
              <SingleEntityAllRelationsViewComponent
                entityId={entityId}
                entityName={entityName}
                relations={relations}
              />
            </TabsContent>
          )}
        </Tabs>
      </Main>
    </>
  )
}
