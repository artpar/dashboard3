import { createLazyFileRoute, Link, useNavigate, useSearch } from '@tanstack/react-router'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { daptinClient } from '@/daptin'
import { useToast } from '@/components/ui/use-toast'
import { ActionExecuteComponent, ActionSchema } from '@/features/entity/components/actions/ActionExecuteComponent'
import { EntityApiService } from '@/features/entity/services/EntityApiService'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  Zap,
  ArrowLeft,
  Play,
  Code,
  FileJson,
  Database,
  AlertCircle,
  CheckCircle,
  XCircle,
  RefreshCw,
} from 'lucide-react'
import { SingleEntityDataProvider } from '@/features/entity/providers/SingleEntityDataProvider'
import { useEntitySingleData } from '@/features/entity/hooks/useEntitySingleData'
import { SingleEntityAllFieldsViewComponent } from '@/features/entity/detail-view'
import PermissionColumnEditor from '@/features/entity/columns/editors/PermissionColumnEditor'
import { SingleEntityAllGroupsListWithPermission } from '@/features/entity/components/permission/SingleEntityAllGroupsListWithPermission'
import SingleEntityAllRelationsViewComponent from '@/features/entity/SingleEntityAllRelationsViewComponent'

interface ActionEntity {
  id?: string
  reference_id?: string
  action_name?: string
  label?: string
  world_id?: string
  action_schema?: string
  instance_optional?: boolean
  permission?: number
}

interface EntityInstance {
  id: string
  reference_id: string
  [key: string]: any
}

const ACTION_DETAIL_LOG_PREFIX = '[ActionDetail]'

const getObjectKeys = (value: unknown) => {
  if (!value || typeof value !== 'object') return []
  return Object.keys(value as Record<string, unknown>)
}

const summarizeApiResponse = (response: any) => ({
  responseKeys: getObjectKeys(response),
  dataType: Array.isArray(response?.data) ? 'array' : typeof response?.data,
  dataLength: Array.isArray(response?.data) ? response.data.length : undefined,
  dataKeys: getObjectKeys(response?.data),
  links: response?.links,
  meta: response?.meta,
  errorCount: Array.isArray(response?.errors) ? response.errors.length : undefined,
  errors: response?.errors,
})

const summarizeError = (error: any) => ({
  name: error?.name,
  message: error?.message,
  status: error?.response?.status,
  statusText: error?.response?.statusText,
  responseKeys: getObjectKeys(error?.response),
  responseData: error?.response?.data,
  requestUrl: error?.config?.url,
  requestMethod: error?.config?.method,
  requestParams: error?.config?.params,
})

function ActionDetailRoute() {
  const { actionId } = Route.useParams()

  return (
    <SingleEntityDataProvider entityName="action" entityId={actionId} entity={null}>
      <ActionDetailPage />
    </SingleEntityDataProvider>
  )
}

function ActionDetailPage() {
  const { actionId } = Route.useParams()
  const navigate = useNavigate()
  const searchParams = useSearch({ strict: false }) as { tab?: string }
  const { toast } = useToast()
  const {
    selectedItem,
    columns,
    relations,
    entityName,
    entityId,
    isLoading,
    error,
    fetchData,
    updateItem,
  } = useEntitySingleData()
  const actionEntity = selectedItem as ActionEntity | null
  const [actionResult, setActionResult] = useState<any>(null)
  const [showSchema, setShowSchema] = useState(false)
  const [selectedInstanceId, setSelectedInstanceId] = useState<string>('')
  const [activeTab, setActiveTab] = useState<string>(searchParams?.tab || 'execute')

  const handleTabChange = useCallback(
    (value: string) => {
      setActiveTab(value)
      navigate({
        search: (prev) => ({
          ...prev,
          tab: value,
        }),
        replace: true,
      })
    },
    [navigate]
  )

  useEffect(() => {
    if (searchParams?.tab && searchParams.tab !== activeTab) {
      setActiveTab(searchParams.tab)
    }
  }, [activeTab, searchParams?.tab])

  const actionReferenceId = actionEntity?.reference_id || actionId

  const {
    data: actionSchema,
    isLoading: loadingSchema,
    error: schemaError,
  } = useQuery({
    queryKey: ['action-schema', actionReferenceId],
    queryFn: async () => {
      console.groupCollapsed(`${ACTION_DETAIL_LOG_PREFIX} fetch action schema`)
      console.info(`${ACTION_DETAIL_LOG_PREFIX} schema request payload`, {
        entityName: 'action',
        actionName: 'get_action_schema',
        payload: { action_id: actionReferenceId },
      })
      try {
        const result = await EntityApiService.executeAction('action', 'get_action_schema', {
          action_id: actionReferenceId,
        })

        console.info(`${ACTION_DETAIL_LOG_PREFIX} schema raw result`, {
          resultType: Array.isArray(result) ? 'array' : typeof result,
          resultLength: Array.isArray(result) ? result.length : undefined,
          firstItemKeys: getObjectKeys(Array.isArray(result) ? result[0] : result),
          firstAttributesKeys: getObjectKeys(Array.isArray(result) ? result[0]?.Attributes : undefined),
          result,
        })

        if (result && result[0]?.Attributes?.content) {
          const decoded = atob(result[0].Attributes.content)
          const schema = JSON.parse(decoded) as ActionSchema
          console.info(`${ACTION_DETAIL_LOG_PREFIX} decoded action schema`, {
            schemaKeys: getObjectKeys(schema),
            name: schema.Name,
            label: schema.Label,
            onType: schema.OnType,
            instanceOptional: schema.InstanceOptional,
            inFieldsCount: schema.InFields?.length,
            schema,
          })
          return schema
        }
        throw new Error('Failed to get action schema')
      } catch (error) {
        console.error(`${ACTION_DETAIL_LOG_PREFIX} failed to fetch/parse action schema`, {
          actionId: actionReferenceId,
          error: summarizeError(error),
          rawError: error,
        })
        throw error
      } finally {
        console.groupEnd()
      }
    },
    enabled: !!actionReferenceId,
  })

  const requiresInstance = !!actionSchema && !actionSchema.InstanceOptional
  const targetEntityName = actionSchema?.OnType

  const { data: entityInstances = [], isLoading: loadingInstances, refetch: refetchInstances } = useQuery({
    queryKey: ['entity-instances-for-action', actionReferenceId, targetEntityName, requiresInstance],
    queryFn: async () => {
      if (!targetEntityName) return []
      console.groupCollapsed(`${ACTION_DETAIL_LOG_PREFIX} fetch target entity instances`)
      console.info(`${ACTION_DETAIL_LOG_PREFIX} instance request context`, {
        actionId: actionReferenceId,
        targetEntityName,
        requiresInstance,
      })
      try {
        const response = await daptinClient.jsonApi.findAll(targetEntityName, {
          page: { number: 1, size: 100 }
        })
        const instances = response.data as any[]
        console.info(`${ACTION_DETAIL_LOG_PREFIX} target entity response`, summarizeApiResponse(response))
        console.info(`${ACTION_DETAIL_LOG_PREFIX} target entity row samples`, {
          sampleRows: Array.isArray(instances)
            ? instances.slice(0, 10).map((instance) => ({
              topLevelKeys: getObjectKeys(instance),
              attributeKeys: getObjectKeys(instance?.attributes),
              id: instance?.id,
              reference_id: instance?.reference_id,
              attributes_reference_id: instance?.attributes?.reference_id,
            }))
            : instances,
        })
        if (!Array.isArray(instances)) {
          console.warn(`${ACTION_DETAIL_LOG_PREFIX} expected target entity response.data to be an array`, {
            targetEntityName,
            dataType: typeof response.data,
            data: response.data,
          })
          return []
        }

        return instances.map(i => {
          if (i.attributes) {
            return { id: i.id, reference_id: i.attributes.reference_id || i.id, ...i.attributes }
          }
          return i
        }) as EntityInstance[]
      } catch (error) {
        console.error(`${ACTION_DETAIL_LOG_PREFIX} failed to fetch target entity instances`, {
          actionId: actionReferenceId,
          targetEntityName,
          error: summarizeError(error),
          rawError: error,
        })
        throw error
      } finally {
        console.groupEnd()
      }
    },
    enabled: !!targetEntityName && requiresInstance,
  })

  const getInstanceLabel = (instance: EntityInstance): string => {
    const nameFields = ['name', 'title', 'label', 'email', 'username', 'display_name']
    for (const field of nameFields) {
      if (instance[field]) {
        return `${instance[field]} (${instance.reference_id?.slice(0, 8)}...)`
      }
    }
    return instance.reference_id || instance.id
  }

  const getInstanceValue = (instance: EntityInstance): string | undefined =>
    instance.reference_id || instance.id || undefined

  const executeMutation = useMutation({
    mutationFn: async (payload: Record<string, any>) => {
      if (!actionSchema) throw new Error('Action schema not loaded')

      if (requiresInstance && selectedInstanceId) {
        payload.reference_id = selectedInstanceId
      }

      console.groupCollapsed(`${ACTION_DETAIL_LOG_PREFIX} execute action`)
      console.info(`${ACTION_DETAIL_LOG_PREFIX} execution request`, {
        actionId: actionReferenceId,
        actionName: actionSchema.Name,
        onType: actionSchema.OnType,
        requiresInstance,
        selectedInstanceId,
        payload,
      })
      try {
        const result = await EntityApiService.executeAction(actionSchema.OnType, actionSchema.Name, payload)
        console.info(`${ACTION_DETAIL_LOG_PREFIX} execution result`, {
          resultType: Array.isArray(result) ? 'array' : typeof result,
          resultLength: Array.isArray(result) ? result.length : undefined,
          result,
        })
        return result
      } catch (error) {
        console.error(`${ACTION_DETAIL_LOG_PREFIX} execution failed`, {
          actionId: actionReferenceId,
          actionName: actionSchema.Name,
          onType: actionSchema.OnType,
          payload,
          error: summarizeError(error),
          rawError: error,
        })
        throw error
      } finally {
        console.groupEnd()
      }
    },
    onSuccess: (result) => {
      setActionResult(result)
      toast({ title: 'Action executed', description: `${actionSchema?.Label} completed successfully` })
    },
    onError: (error: any) => {
      toast({ variant: 'destructive', title: 'Execution failed', description: error?.message || 'Unknown error' })
    },
  })

  const canExecute = useMemo(() => {
    if (!actionSchema) return false
    if (requiresInstance && !selectedInstanceId) return false
    return true
  }, [actionSchema, requiresInstance, selectedInstanceId])

  const updatePermission = async (permission: number) => {
    await updateItem({ permission })
    fetchData()
  }

  if (isLoading) {
    return (
      <div className="p-6 space-y-4 w-full">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 w-full">
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertTitle>Not Found</AlertTitle>
          <AlertDescription>Action not found</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!actionEntity) {
    return (
      <div className="p-6 space-y-4 w-full">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  return (
    <div className="flex h-full w-full flex-col">
        <Link to="/admin/actions" className="text-muted-foreground hover:text-foreground mb-2 inline-flex items-center gap-1 text-sm">
          <ArrowLeft className="h-4 w-4" />
          Back to Actions
        </Link>
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <Zap className="h-6 w-6" />
            {actionSchema?.Label || actionEntity.label || actionEntity.action_name || 'Action'}
          </h1>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <Badge variant="outline">{actionSchema?.OnType || 'unknown'}</Badge>
            {actionSchema && (
              <Badge variant={actionSchema.InstanceOptional ? 'secondary' : 'default'}>
                {actionSchema.InstanceOptional ? 'Entity-level' : 'Instance-level'}
              </Badge>
            )}
            {actionSchema?.InFields && actionSchema.InFields.length > 0 && (
              <Badge variant="outline">{actionSchema.InFields.length} input{actionSchema.InFields.length !== 1 ? 's' : ''}</Badge>
            )}
          </div>
        </div>

      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="flex min-h-0 flex-1 flex-col"
      >
        <div className="border-b px-6 py-3">
          <TabsList className="flex w-full justify-start">
            <TabsTrigger value="execute">Execute</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="permissions">Permissions</TabsTrigger>
            <TabsTrigger value="groups">Groups</TabsTrigger>
            {relations.length > 0 && (
              <TabsTrigger value="relations">Relations</TabsTrigger>
            )}
            <TabsTrigger value="schema">Schema</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="execute" className="m-0 flex-1 overflow-auto p-6">
          {loadingSchema ? (
            <div className="space-y-4">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-96" />
              <Skeleton className="h-64 w-full" />
            </div>
          ) : schemaError ? (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertTitle>Schema not available</AlertTitle>
              <AlertDescription>
                {schemaError instanceof Error ? schemaError.message : 'Failed to load action schema'}
              </AlertDescription>
            </Alert>
          ) : (
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="space-y-6 lg:col-span-2">
                {requiresInstance && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Database className="h-5 w-5" />
                        Select {actionSchema?.OnType} Instance
                      </CardTitle>
                      <CardDescription>
                        This action requires a specific {actionSchema?.OnType} instance to operate on
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Select
                          value={selectedInstanceId}
                          onValueChange={setSelectedInstanceId}
                        >
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder={`Select a ${actionSchema?.OnType} instance...`} />
                          </SelectTrigger>
                          <SelectContent>
                            {loadingInstances ? (
                              <div className="text-muted-foreground px-2 py-1.5 text-sm">
                                Loading instances...
                              </div>
                            ) : entityInstances.length > 0 ? (
                              entityInstances.map((instance) => {
                                const instanceValue = getInstanceValue(instance)
                                if (!instanceValue) return null

                                return (
                                  <SelectItem key={instanceValue} value={instanceValue}>
                                    {getInstanceLabel(instance)}
                                  </SelectItem>
                                )
                              })
                            ) : (
                              <div className="text-muted-foreground px-2 py-1.5 text-sm">
                                No {actionSchema?.OnType} instances found
                              </div>
                            )}
                          </SelectContent>
                        </Select>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => refetchInstances()}
                          disabled={loadingInstances}
                        >
                          <RefreshCw className={`h-4 w-4 ${loadingInstances ? 'animate-spin' : ''}`} />
                        </Button>
                      </div>

                      {!selectedInstanceId && (
                        <Alert>
                          <AlertCircle className="h-4 w-4" />
                          <AlertTitle>Instance Required</AlertTitle>
                          <AlertDescription>
                            Please select an instance before executing this action
                          </AlertDescription>
                        </Alert>
                      )}

                      {selectedInstanceId && (
                        <div className="text-muted-foreground flex items-center gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          Instance selected: <code className="bg-muted rounded px-1">{selectedInstanceId.slice(0, 8)}...</code>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {actionSchema && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Play className="h-5 w-5" />
                        Execute Action
                      </CardTitle>
                      <CardDescription>
                        {actionSchema.InFields?.length > 0
                          ? 'Fill in the required fields and execute this action'
                          : 'This action has no input fields - click Execute to run it'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {!canExecute && requiresInstance && (
                        <div className="bg-muted text-muted-foreground mb-4 rounded-lg p-4 text-center">
                          Select an instance above to enable execution
                        </div>
                      )}
                      <ActionExecuteComponent
                        actionSchema={actionSchema}
                        onExecute={(payload) => {
                          if (!canExecute) {
                            toast({ variant: 'destructive', title: 'Cannot execute', description: 'Please select an instance first' })
                            return Promise.reject(new Error('Instance required'))
                          }
                          return executeMutation.mutateAsync(payload)
                        }}
                        isLoading={executeMutation.isPending}
                        variant="compact"
                      />
                    </CardContent>
                  </Card>
                )}

                {actionResult && (
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <CheckCircle className="h-5 w-5 text-green-500" />
                          Execution Result
                        </CardTitle>
                        <Button variant="ghost" size="sm" onClick={() => setActionResult(null)}>
                          Clear
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <pre className="bg-muted max-h-96 overflow-auto rounded-lg p-4 font-mono text-sm">
                        {JSON.stringify(actionResult, null, 2)}
                      </pre>
                    </CardContent>
                  </Card>
                )}
              </div>

              <ActionSchemaSummary
                actionSchema={actionSchema}
                showSchema={showSchema}
                setShowSchema={setShowSchema}
              />
            </div>
          )}
        </TabsContent>

        <TabsContent value="details" className="m-0 flex-1 overflow-auto p-6">
          <SingleEntityAllFieldsViewComponent
            columns={columns}
            entityItem={actionEntity}
          />
        </TabsContent>

        <TabsContent value="permissions" className="m-0 flex-1 overflow-auto p-6">
          <PermissionColumnEditor
            onChange={updatePermission}
            value={actionEntity.permission || 0}
            entityType={entityName}
            entityId={entityId}
          />
        </TabsContent>

        <TabsContent value="groups" className="m-0 flex-1 overflow-auto p-6">
          <SingleEntityAllGroupsListWithPermission
            entityName={entityName}
            entityId={entityId}
            disabled={false}
          />
        </TabsContent>

        {relations.length > 0 && (
          <TabsContent value="relations" className="m-0 flex-1 overflow-auto p-6">
            <SingleEntityAllRelationsViewComponent
              entityId={entityId}
              entityName={entityName}
              relations={relations}
            />
          </TabsContent>
        )}

        <TabsContent value="schema" className="m-0 flex-1 overflow-auto p-6">
          <div className="max-w-5xl">
            <ActionSchemaSummary
              actionSchema={actionSchema}
              showSchema={true}
              setShowSchema={setShowSchema}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function ActionSchemaSummary({
  actionSchema,
  showSchema,
  setShowSchema,
}: {
  actionSchema?: ActionSchema
  showSchema: boolean
  setShowSchema: (showSchema: boolean) => void
}) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Action Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Action Name</span>
            <code className="bg-muted rounded px-2 py-0.5 text-xs">{actionSchema?.Name}</code>
          </div>
          <Separator />
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Entity</span>
            <Badge variant="outline">{actionSchema?.OnType}</Badge>
          </div>
          <Separator />
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Instance Required</span>
            <Badge variant={actionSchema?.InstanceOptional ? 'secondary' : 'default'}>
              {actionSchema?.InstanceOptional ? 'No' : 'Yes'}
            </Badge>
          </div>
          <Separator />
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Input Fields</span>
            <span>{actionSchema?.InFields?.length || 0}</span>
          </div>
          <Separator />
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Output Fields</span>
            <span>{actionSchema?.OutFields?.length || 0}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileJson className="h-5 w-5" />
              Schema
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setShowSchema(!showSchema)}>
              <Code className="h-4 w-4" />
              {showSchema ? 'Hide' : 'Show'}
            </Button>
          </div>
        </CardHeader>
        {showSchema && (
          <CardContent>
            <pre className="bg-muted max-h-96 overflow-auto rounded-lg p-3 font-mono text-xs">
              {JSON.stringify(actionSchema, null, 2)}
            </pre>
          </CardContent>
        )}
      </Card>

      {actionSchema?.InFields && actionSchema.InFields.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Input Fields</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {actionSchema.InFields.map((field) => (
                <li key={field.ColumnName} className="flex items-center justify-between text-sm">
                  <div>
                    <span className="font-medium">{field.Name}</span>
                    {field.ColumnDescription && (
                      <p className="text-muted-foreground text-xs">{field.ColumnDescription}</p>
                    )}
                  </div>
                  <Badge variant="outline" className="ml-2 shrink-0 text-xs">{field.ColumnType}</Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export const Route = createLazyFileRoute('/_authenticated/admin/actions/$actionId')({
  component: ActionDetailRoute,
})
