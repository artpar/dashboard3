import React, { useCallback, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { daptinClient } from '@/daptin'
import { Layers } from 'lucide-react'
import { cn } from '@/lib/utils.ts'
import { Badge } from '@/components/ui/badge.tsx'
import { Button } from '@/components/ui/button.tsx'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card.tsx'
import { Skeleton } from '@/components/ui/skeleton.tsx'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table.tsx'

interface Relation {
  Subject: string
  SubjectName: string
  Object: string
  ObjectName: string
  Relation: string
}

interface RelatedRecordData {
  id: string
  reference_id: string

  [key: string]: any
}

interface SingleEntityRelatedRecordsProps {
  entityName: string
  relations: Relation[]
  entityId?: string
}

interface RelationData {
  data: RelatedRecordData[]
  isLoading: boolean
  isError: boolean
  error: Error | null
  refetch: () => void
}

export function SingleEntityRelatedRecordsComponent(
  props: SingleEntityRelatedRecordsProps
) {
  const { entityName, relations, entityId } = props
  const navigate = useNavigate()
  const [expandedRelations, setExpandedRelations] = useState<
    Record<string, boolean>
  >({})
  const [relatedData, setRelatedData] = useState<Record<string, RelationData>>(
    {}
  )

  // Get related entity name from relation
  const getRelatedEntityName = useCallback(
    (relation: Relation) => {
      return relation.Object === entityName ? relation.Subject : relation.Object
    },
    [entityName]
  )

  // Get relation key for queries and state management
  const getRelationKey = useCallback(
    (relation: Relation) => {
      return `${relation.Subject}-${relation.SubjectName}-${relation.Relation}-${relation.Object}-${relation.ObjectName}`
    },
    [getRelatedEntityName]
  )

  // Function to fetch data for a specific relation
  const fetchRelationData = useCallback(
    async (relation: Relation) => {
      console.log("fetchRelationData", entityId, relation)
      if (!entityId) return { data: [] }

      try {
        // Determine the correct query parameters based on relation direction
        let queryParams = {}

        if (relation.Object === entityName) {
          // This entity is the object, so we need to query the subject
          queryParams = {
            [relation.ObjectName || entityName]: entityId,
          }
        } else {
          // This entity is the subject, so we need to query the object
          queryParams = {
            [relation.SubjectName || entityName]: entityId,
          }
        }

        const response = await daptinClient.jsonApi.findAll(
          getRelatedEntityName(relation),
          queryParams
        )

        if (response.errors && response.errors.length) {
          throw new Error(
            response.errors[0].detail ||
              `Failed to fetch related ${getRelatedEntityName(relation)}`
          )
        }

        return response
      } catch (err) {
        console.error(
          `Error fetching related ${getRelatedEntityName(relation)}:`,
          err
        )
        throw err
      }
    },
    [entityId, entityName, getRelatedEntityName]
  )

  // Toggle relation expansion and load data if needed
  const toggleRelation = useCallback(
    (relation: Relation) => {
      console.log("toggleRelation", relation)
      const relationKey = getRelationKey(relation)

      setExpandedRelations((prev) => {
        const newState = {
          ...prev,
          [relationKey]: !prev[relationKey],
        }

        // If expanding and we don't have data, set a loading state
        if (newState[relationKey] && !relatedData[relationKey]) {
          setRelatedData((prevData) => ({
            ...prevData,
            [relationKey]: {
              data: [],
              isLoading: true,
              isError: false,
              error: null,
              refetch: () => {},
            },
          }))

          // Fetch the data
          fetchRelationData(relation)
            .then((response) => {
              setRelatedData((prevData) => ({
                ...prevData,
                [relationKey]: {
                  data: response.data || [],
                  isLoading: false,
                  isError: false,
                  error: null,
                  refetch: () =>
                    fetchRelationData(relation)
                      .then((newResponse) => {
                        setRelatedData((pd) => ({
                          ...pd,
                          [relationKey]: {
                            ...pd[relationKey],
                            data: newResponse.data || [],
                            isLoading: false,
                            isError: false,
                            error: null,
                          },
                        }))
                      })
                      .catch((error) => {
                        setRelatedData((pd) => ({
                          ...pd,
                          [relationKey]: {
                            ...pd[relationKey],
                            isLoading: false,
                            isError: true,
                            error,
                          },
                        }))
                      }),
                },
              }))
            })
            .catch((error) => {
              setRelatedData((prevData) => ({
                ...prevData,
                [relationKey]: {
                  data: [],
                  isLoading: false,
                  isError: true,
                  error,
                  refetch: () => {},
                },
              }))
            })
        }

        return newState
      })
    },
    [fetchRelationData, getRelationKey, relatedData]
  )

  // Handle view entity click
  const handleViewEntity = useCallback(
    (entityType: string, entityId: string) => {
      navigate({ to: `/${entityType}/${entityId}` })
    },
    [navigate]
  )

  // Get display fields for a related entity
  const getDisplayFields = useCallback((data: RelatedRecordData) => {
    // Priority fields to display if they exist
    const priorityFields = ['name', 'title', 'label']

    // Find the first available priority field
    for (const field of priorityFields) {
      if (data[field]) {
        return { [field]: data[field] }
      }
    }

    // If no priority fields, get first 3 non-system fields
    const systemFields = [
      'id',
      'reference_id',
      'type',
      '__type',
      'created_at',
      'updated_at',
      'permission',
    ]
    const displayFields: Record<string, any> = {}

    Object.entries(data)
      .filter(
        ([key, value]) =>
          !systemFields.includes(key) &&
          value !== null &&
          value !== undefined &&
          !key.endsWith('_id') &&
          typeof value !== 'object'
      )
      .slice(0, 3)
      .forEach(([key, value]) => {
        displayFields[key] = value
      })

    return displayFields
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Related Records</CardTitle>
        <CardDescription>
          Records connected to this {entityName}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className='space-y-6'>
          {relations.length === 0 ? (
            <p className='text-muted-foreground'>
              No relations defined for this entity.
            </p>
          ) : (
            <div className='space-y-4'>
              {relations.map((relation) => {
                const relationKey = getRelationKey(relation)
                const relatedEntity = getRelatedEntityName(relation)
                const isExpanded = expandedRelations[relationKey] || false
                const relationData = relatedData[relationKey]

                return (
                  <div key={relationKey} className='rounded-lg border p-4'>
                    <div className='flex items-center justify-between'>
                      <div className='flex items-center space-x-2'>
                        <Layers className='text-muted-foreground h-4 w-4' />
                        <h3
                          className={cn('font-medium', {
                            'text-xs': relation.Object === entityName,
                          })}
                        >
                          {relation.Object} ({relation.ObjectName || 'default'})
                          <span className='text-muted-foreground ml-2 text-sm'>
                            ({relation.Relation})
                          </span>
                        </h3>
                        <h3
                          className={cn('font-medium', {
                            'text-xs': relation.Subject === entityName,
                          })}
                        >
                          {relation.Subject} (
                          {relation.SubjectName || 'default'})
                        </h3>
                      </div>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => toggleRelation(relation)}
                      >
                        {isExpanded ? 'Hide' : 'View Related'}
                      </Button>
                    </div>

                    {isExpanded && (
                      <div className='mt-4'>
                        {relationData?.isLoading && (
                          <div className='space-y-2'>
                            <Skeleton className='h-8 w-full' />
                            <Skeleton className='h-8 w-full' />
                            <Skeleton className='h-8 w-full' />
                          </div>
                        )}

                        {relationData?.isError && (
                          <div className='rounded-md bg-red-50 p-4 text-sm text-red-500'>
                            Error loading related records:{' '}
                            {relationData.error instanceof Error
                              ? relationData.error.message
                              : 'Unknown error'}
                          </div>
                        )}

                        {relationData &&
                          !relationData.isLoading &&
                          !relationData.isError &&
                          relationData.data.length === 0 && (
                            <p className='text-muted-foreground text-sm'>
                              No related records found.
                            </p>
                          )}

                        {relationData &&
                          !relationData.isLoading &&
                          !relationData.isError &&
                          relationData.data.length > 0 && (
                            <div className='rounded-md border'>
                              <Table>
                                <TableHeader className='sticky-header-table'>
                                  <TableRow>
                                    <TableHead>ID</TableHead>
                                    <TableHead>Details</TableHead>
                                    <TableHead className='text-right'>
                                      Actions
                                    </TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {relationData.data.map(
                                    (item: RelatedRecordData) => {
                                      const displayFields =
                                        getDisplayFields(item)

                                      return (
                                        <TableRow key={item.reference_id}>
                                          <TableCell className='font-mono text-xs'>
                                            <Badge variant='outline'>
                                              {item.reference_id.substring(
                                                0,
                                                8
                                              )}
                                              ...
                                            </Badge>
                                          </TableCell>
                                          <TableCell>
                                            <div className='space-y-1'>
                                              {Object.entries(
                                                displayFields
                                              ).map(([key, value]) => (
                                                <div
                                                  key={key}
                                                  className='text-sm'
                                                >
                                                  <span className='text-muted-foreground font-medium'>
                                                    {key}:{' '}
                                                  </span>
                                                  <span>{String(value)}</span>
                                                </div>
                                              ))}
                                            </div>
                                          </TableCell>
                                          <TableCell className='text-right'>
                                            <Button
                                              variant='ghost'
                                              size='sm'
                                              onClick={() =>
                                                handleViewEntity(
                                                  relatedEntity,
                                                  item.reference_id
                                                )
                                              }
                                            >
                                              View
                                            </Button>
                                          </TableCell>
                                        </TableRow>
                                      )
                                    }
                                  )}
                                </TableBody>
                              </Table>
                            </div>
                          )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
