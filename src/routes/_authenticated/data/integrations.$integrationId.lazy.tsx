import { createLazyFileRoute, Link } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { DAPTIN_ENDPOINT } from '@/daptin'
import {
  ArrowLeft,
  Globe,
  FileJson,
  Key,
  Code,
  CheckCircle,
  XCircle,
  Loader2,
  Play,
  Settings,
  Copy,
  Send,
  ChevronDown,
  ChevronRight,
} from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/components/ui/use-toast'
import {
  getSpecificationLanguageById,
  getAuthenticationTypeById,
} from '@/features/integrations'
import { SingleEntityDataProvider } from '@/features/entity/providers/SingleEntityDataProvider'
import { useEntitySingleData } from '@/features/entity/hooks/useEntitySingleData'
import { SingleEntityAllFieldsViewComponent } from '@/features/entity/detail-view'
import PermissionColumnEditor from '@/features/entity/columns/editors/PermissionColumnEditor'
import { SingleEntityAllGroupsListWithPermission } from '@/features/entity/components/permission/SingleEntityAllGroupsListWithPermission'
import SingleEntityAllRelationsViewComponent from '@/features/entity/SingleEntityAllRelationsViewComponent'
import { EntityApiService } from '@/features/entity/services/EntityApiService'

type JsonRecord = Record<string, unknown>

interface IntegrationEntity {
  id?: string
  reference_id?: string
  name?: string
  specification?: string
  specification_format?: string
  specification_language?: string
  authentication_type?: string
  authentication_specification?: string
  enable?: boolean
  created_at?: string
  updated_at?: string
  permission?: number
  attributes?: JsonRecord
}

interface IntegrationOperationAuth {
  type?: string
  execution_field?: string
  required?: boolean
}

interface ParsedEndpoint {
  path: string
  method: string
  summary?: string
  operationId?: string
  description?: string
  auth?: IntegrationOperationAuth
  source: 'operations' | 'specification'
}

interface ExecuteEndpointState {
  endpoint: ParsedEndpoint | null
  pathParams: Record<string, string>
  queryParams: string
  requestBody: string
  authValue: string
  response: unknown | null
  isLoading: boolean
  error: string | null
}

interface OpenApiInfo {
  title?: string
  version?: string
  description?: string
}

interface OpenApiServer {
  url: string
}

interface OpenApiOperation {
  summary?: string
  description?: string
  operationId?: string
}

interface OpenApiSpec {
  info?: OpenApiInfo
  paths?: Record<string, Record<string, OpenApiOperation | unknown>>
  servers?: OpenApiServer[]
}

interface IntegrationOperationsDocument {
  provider?: string
  auth?: IntegrationOperationAuth
  operations?: Array<{
    operation_id?: string
    method?: string
    path?: string
    summary?: string
    description?: string
    auth?: IntegrationOperationAuth
  }>
}

interface EndpointTreeNode {
  label: string
  path: string
  children: EndpointTreeNode[]
  endpoints: ParsedEndpoint[]
}

const alphaCollator = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: 'base',
})

function normalizeIntegration(value: IntegrationEntity | null): IntegrationEntity | null {
  if (!value) return null
  if (value.attributes) {
    return {
      id: value.id,
      reference_id: value.attributes.reference_id || value.id,
      ...value.attributes,
    }
  }
  return value
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback
}

function getResponseError(body: unknown): string | undefined {
  if (!body || typeof body !== 'object') return undefined
  const error = (body as { error?: unknown }).error
  return typeof error === 'string' ? error : undefined
}

function getToken(): string | null {
  return localStorage.getItem('token')
}

function authHeaders(): HeadersInit {
  const token = getToken()
  return {
    Accept: 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

function parseJsonSpecification(integration: IntegrationEntity | null): OpenApiSpec | null {
  if (!integration?.specification) return null
  if ((integration.specification_format || '').toLowerCase() !== 'json') return null

  try {
    const parsed = JSON.parse(integration.specification) as unknown
    if (!parsed || typeof parsed !== 'object') return null
    return parsed as OpenApiSpec
  } catch {
    return null
  }
}

function endpointsFromSpec(parsedSpec: OpenApiSpec | null): ParsedEndpoint[] {
  if (!parsedSpec?.paths) return []
  const endpoints: ParsedEndpoint[] = []

  Object.entries(parsedSpec.paths).forEach(([path, methods]) => {
    Object.entries(methods || {}).forEach(([method, details]) => {
      if (['get', 'post', 'put', 'patch', 'delete', 'options', 'head'].includes(method)) {
        const operation = details as OpenApiOperation
        endpoints.push({
          path,
          method: method.toUpperCase(),
          summary: operation.summary || operation.description,
          description: operation.description,
          operationId: operation.operationId,
          source: 'specification',
        })
      }
    })
  })

  return endpoints
}

function endpointsFromOperations(document?: IntegrationOperationsDocument): ParsedEndpoint[] {
  if (!Array.isArray(document?.operations)) return []

  return document.operations
    .filter((operation) => operation.operation_id && operation.method && operation.path)
    .map((operation) => ({
      path: operation.path as string,
      method: (operation.method as string).toUpperCase(),
      summary: operation.summary || operation.description,
      description: operation.description,
      operationId: operation.operation_id,
      auth: operation.auth || document.auth,
      source: 'operations',
    }))
}

function parseQueryParams(queryString: string): Record<string, string> {
  if (!queryString.trim()) return {}
  const params = new URLSearchParams(queryString.trim())
  const result: Record<string, string> = {}
  params.forEach((value, key) => {
    result[key] = value
  })
  return result
}

function pathSegments(path: string): string[] {
  const segments = path
    .split('/')
    .map((segment) => segment.trim())
    .filter(Boolean)

  return segments.length > 0 ? segments : ['/']
}

function buildEndpointTree(endpoints: ParsedEndpoint[]): EndpointTreeNode[] {
  const root: EndpointTreeNode = {
    label: '',
    path: '',
    children: [],
    endpoints: [],
  }

  endpoints.forEach((endpoint) => {
    let current = root
    let currentPath = ''

    pathSegments(endpoint.path).forEach((segment) => {
      currentPath = segment === '/'
        ? '/'
        : `${currentPath}/${segment}`.replace(/\/+/g, '/')

      let child = current.children.find((node) => node.label === segment)
      if (!child) {
        child = {
          label: segment,
          path: currentPath,
          children: [],
          endpoints: [],
        }
        current.children.push(child)
      }
      current = child
    })

    current.endpoints.push(endpoint)
  })

  sortEndpointTree(root.children)
  return root.children
}

function sortEndpointTree(nodes: EndpointTreeNode[]) {
  nodes.sort((a, b) => alphaCollator.compare(a.label, b.label))
  nodes.forEach((node) => {
    node.endpoints.sort((a, b) => {
      const aName = a.operationId || a.summary || a.path
      const bName = b.operationId || b.summary || b.path
      const nameSort = alphaCollator.compare(aName, bName)
      if (nameSort !== 0) return nameSort
      return alphaCollator.compare(a.method, b.method)
    })
    sortEndpointTree(node.children)
  })
}

function collectEndpointTreePaths(nodes: EndpointTreeNode[]): string[] {
  return nodes.flatMap((node) => [
    node.path,
    ...collectEndpointTreePaths(node.children),
  ])
}

function IntegrationDetailRoute() {
  const { integrationId } = Route.useParams()

  return (
    <SingleEntityDataProvider entityName="integration" entityId={integrationId} entity={null}>
      <IntegrationDetailPage />
    </SingleEntityDataProvider>
  )
}

function IntegrationDetailPage() {
  const { integrationId } = Route.useParams()
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
  const integration = normalizeIntegration(selectedItem as IntegrationEntity | null)
  const [activeTab, setActiveTab] = useState('overview')
  const [showExecuteDialog, setShowExecuteDialog] = useState(false)
  const [executeState, setExecuteState] = useState<ExecuteEndpointState>({
    endpoint: null,
    pathParams: {},
    queryParams: '',
    requestBody: '{}',
    authValue: '',
    response: null,
    isLoading: false,
    error: null,
  })

  const parsedSpec = useMemo(() => parseJsonSpecification(integration), [integration])
  const specEndpoints = useMemo(() => endpointsFromSpec(parsedSpec), [parsedSpec])

  const {
    data: operationsDocument,
    isLoading: operationsLoading,
    error: operationsError,
    refetch: refetchOperations,
  } = useQuery({
    queryKey: ['integration-operations', integration?.name],
    queryFn: async () => {
      if (!integration?.name) {
        throw new Error('Integration provider name is missing')
      }

      const providerName = encodeURIComponent(integration.name)
      const response = await fetch(`${DAPTIN_ENDPOINT}/integration/${providerName}/operations`, {
        headers: authHeaders(),
      })
      const body = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(getResponseError(body) || `Failed to load operations (${response.status})`)
      }

      return body as IntegrationOperationsDocument
    },
    enabled: !!integration?.name,
    retry: false,
  })

  const operationEndpoints = useMemo(
    () => endpointsFromOperations(operationsDocument),
    [operationsDocument]
  )
  const endpoints = operationEndpoints.length > 0 ? operationEndpoints : specEndpoints
  const endpointTree = useMemo(() => buildEndpointTree(endpoints), [endpoints])
  const endpointsSource = operationEndpoints.length > 0 ? 'installed operations' : 'saved specification'

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text || '')
    toast({ title: 'Copied to clipboard' })
  }

  const getPathParams = (path: string): string[] => {
    const matches = path.match(/\{([^}]+)\}/g)
    return matches ? matches.map((match) => match.slice(1, -1)) : []
  }

  const openExecuteDialog = (endpoint: ParsedEndpoint) => {
    const pathParams: Record<string, string> = {}
    getPathParams(endpoint.path).forEach((param) => {
      pathParams[param] = ''
    })
    setExecuteState({
      endpoint,
      pathParams,
      queryParams: '',
      requestBody: '{}',
      authValue: '',
      response: null,
      isLoading: false,
      error: null,
    })
    setShowExecuteDialog(true)
  }

  const executeApiCall = async () => {
    if (!executeState.endpoint || !integration?.name || !executeState.endpoint.operationId) return

    setExecuteState((prev) => ({ ...prev, isLoading: true, error: null, response: null }))

    try {
      const input = {
        ...executeState.pathParams,
        ...parseQueryParams(executeState.queryParams),
      }

      if (executeState.requestBody.trim()) {
        Object.assign(input, JSON.parse(executeState.requestBody))
      }

      const requestBody: JsonRecord = { input }
      const authField = executeState.endpoint.auth?.execution_field
      if (authField && executeState.authValue.trim()) {
        requestBody[authField] = executeState.authValue.trim()
      }

      const providerName = encodeURIComponent(integration.name)
      const operationId = encodeURIComponent(executeState.endpoint.operationId)
      const response = await fetch(`${DAPTIN_ENDPOINT}/integration/${providerName}/${operationId}`, {
        method: 'POST',
        headers: {
          ...authHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })
      const body = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(getResponseError(body) || `API call failed (${response.status})`)
      }

      setExecuteState((prev) => ({
        ...prev,
        isLoading: false,
        response: body,
      }))
      toast({
        title: 'API call executed',
        description: `${integration.name}/${executeState.endpoint.operationId}`,
      })
    } catch (err: unknown) {
      setExecuteState((prev) => ({
        ...prev,
        isLoading: false,
        error: getErrorMessage(err, 'API call failed'),
      }))
      toast({
        title: 'API call failed',
        description: getErrorMessage(err, 'Error executing request'),
        variant: 'destructive',
      })
    }
  }

  const installIntegration = async () => {
    if (!integration?.reference_id) return

    try {
      await EntityApiService.executeAction('integration', 'install_integration', {
        integration_id: integration.reference_id,
      })
      toast({ title: 'Integration installed', description: 'Refreshing operations list' })
      refetchOperations()
    } catch (err: unknown) {
      toast({
        title: 'Failed to install integration',
        description: getErrorMessage(err, 'Install action failed'),
        variant: 'destructive',
      })
    }
  }

  const updatePermission = async (permission: number) => {
    await updateItem({ permission })
    fetchData()
  }

  const specLanguage = getSpecificationLanguageById(integration?.specification_language || '')
  const authType = getAuthenticationTypeById(integration?.authentication_type || '')
  const operationsErrorMessage = operationsError instanceof Error ? operationsError.message : null

  if (isLoading) {
    return (
      <div className="w-full space-y-4 p-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  if (error || !integration) {
    return (
      <div className="w-full p-6">
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertTitle>Not Found</AlertTitle>
          <AlertDescription>Integration not found</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="flex h-full w-full flex-col">
      <div className="border-b p-6">
        <Link
          to="/data/integrations"
          className="text-muted-foreground hover:text-foreground mb-2 inline-flex items-center gap-1 text-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Integrations
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold">
              <Globe className="h-6 w-6" />
              {integration.name || 'Integration'}
            </h1>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <Badge variant="outline">
                {specLanguage?.label || integration.specification_language || 'Specification'}
              </Badge>
              {integration.specification_format && (
                <Badge variant="outline">{integration.specification_format}</Badge>
              )}
              <Badge variant={integration.enable ? 'default' : 'secondary'}>
                {integration.enable ? 'Enabled' : 'Disabled'}
              </Badge>
              {authType && authType.id !== 'none' && (
                <Badge variant="outline">
                  <Key className="mr-1 h-3 w-3" />
                  {authType.label}
                </Badge>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Link to={`/integration/${integrationId}/edit`}>
              <Button variant="outline" size="sm">
                <Settings className="mr-1 h-4 w-4" />
                Edit
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex h-full flex-col"
        >
          <div className="border-b px-6">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="endpoints">
                Endpoints {endpoints.length > 0 && `(${endpoints.length})`}
              </TabsTrigger>
              <TabsTrigger value="specification">Specification</TabsTrigger>
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="permissions">Permissions</TabsTrigger>
              <TabsTrigger value="groups">Groups</TabsTrigger>
              {relations.length > 0 && (
                <TabsTrigger value="relations">Relations</TabsTrigger>
              )}
            </TabsList>
          </div>

          <TabsContent value="overview" className="m-0 flex-1 overflow-auto p-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>API Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {parsedSpec?.info && (
                    <>
                      <div className="grid grid-cols-2 gap-2">
                        <span className="text-muted-foreground">Title</span>
                        <span className="font-medium">{parsedSpec.info.title || '-'}</span>
                      </div>
                      <Separator />
                      <div className="grid grid-cols-2 gap-2">
                        <span className="text-muted-foreground">Version</span>
                        <span className="font-medium">{parsedSpec.info.version || '-'}</span>
                      </div>
                      <Separator />
                      {parsedSpec.info.description && (
                        <>
                          <div>
                            <span className="text-muted-foreground mb-1 block">Description</span>
                            <p className="text-sm">{parsedSpec.info.description}</p>
                          </div>
                          <Separator />
                        </>
                      )}
                    </>
                  )}
                  <div className="grid grid-cols-2 gap-2">
                    <span className="text-muted-foreground">Provider</span>
                    <span className="font-medium">{integration.name || '-'}</span>
                  </div>
                  <Separator />
                  <div className="grid grid-cols-2 gap-2">
                    <span className="text-muted-foreground">Spec Language</span>
                    <span className="font-medium">
                      {specLanguage?.label || integration.specification_language || '-'}
                    </span>
                  </div>
                  <Separator />
                  <div className="grid grid-cols-2 gap-2">
                    <span className="text-muted-foreground">Format</span>
                    <span className="font-medium uppercase">
                      {integration.specification_format || '-'}
                    </span>
                  </div>
                  <Separator />
                  <div className="grid grid-cols-2 gap-2">
                    <span className="text-muted-foreground">Endpoints</span>
                    <span className="font-medium">
                      {operationsLoading ? 'Loading...' : `${endpoints.length} from ${endpointsSource}`}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Authentication</CardTitle>
                  <CardDescription>
                    How this integration authenticates with the API
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted flex items-center gap-3 rounded-lg p-3">
                    {authType ? (
                      <>
                        <authType.icon className="text-muted-foreground h-8 w-8" />
                        <div className="flex-1">
                          <div className="font-medium">{authType.label}</div>
                          <div className="text-muted-foreground text-sm">
                            {authType.description}
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <Globe className="text-muted-foreground h-8 w-8" />
                        <div className="flex-1">
                          <div className="font-medium">No Authentication</div>
                          <div className="text-muted-foreground text-sm">Public API access</div>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>

              {parsedSpec?.servers && parsedSpec.servers.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Servers</CardTitle>
                    <CardDescription>Base URLs for API requests</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {parsedSpec.servers.map((server, index) => (
                        <div
                          key={index}
                          className="bg-muted flex items-center justify-between rounded p-2"
                        >
                          <code className="text-sm">{server.url}</code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(server.url)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle>Metadata</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    <span className="text-muted-foreground">Status</span>
                    <span className="flex items-center gap-1">
                      {integration.enable ? (
                        <>
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-green-600">Enabled</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-4 w-4 text-red-500" />
                          <span className="text-red-600">Disabled</span>
                        </>
                      )}
                    </span>
                  </div>
                  <Separator />
                  <div className="grid grid-cols-2 gap-2">
                    <span className="text-muted-foreground">Created</span>
                    <span className="font-medium">
                      {integration.created_at
                        ? new Date(integration.created_at).toLocaleString()
                        : '-'}
                    </span>
                  </div>
                  <Separator />
                  <div className="grid grid-cols-2 gap-2">
                    <span className="text-muted-foreground">Updated</span>
                    <span className="font-medium">
                      {integration.updated_at
                        ? new Date(integration.updated_at).toLocaleString()
                        : '-'}
                    </span>
                  </div>
                  <Separator />
                  <div className="grid grid-cols-2 gap-2">
                    <span className="text-muted-foreground">Reference ID</span>
                    <span className="font-mono text-xs">{integration.reference_id || '-'}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="endpoints" className="m-0 flex-1 overflow-auto p-6">
            {operationsErrorMessage && operationEndpoints.length === 0 && (
              <Alert className="mb-4">
                <FileJson className="h-4 w-4" />
                <AlertTitle>Installed operations unavailable</AlertTitle>
                <AlertDescription>
                  {operationsErrorMessage}. The page will use the saved JSON specification if it can.
                </AlertDescription>
              </Alert>
            )}

            {endpoints.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>API Endpoints</CardTitle>
                  <CardDescription>
                    {endpoints.length} endpoints from {endpointsSource}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <EndpointTree
                    nodes={endpointTree}
                    integrationName={integration.name}
                    onExecute={openExecuteDialog}
                  />
                </CardContent>
              </Card>
            ) : (
              <div className="text-muted-foreground flex h-64 flex-col items-center justify-center">
                <FileJson className="mb-4 h-12 w-12" />
                <p className="text-lg font-medium">No endpoints found</p>
                <p className="max-w-md text-center text-sm">
                  {operationsLoading
                    ? 'Loading installed integration operations...'
                    : integration.specification_format === 'json'
                      ? 'No installed operations were returned and the saved specification has no paths.'
                      : 'No installed operations were returned. Install the integration to expose provider-scoped operations.'}
                </p>
                <div className="mt-4 flex gap-2">
                  <Button variant="outline" onClick={() => refetchOperations()}>
                    Refresh
                  </Button>
                  <Button onClick={installIntegration} disabled={!integration.reference_id}>
                    Install Integration
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="specification" className="m-0 flex-1 overflow-auto p-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Code className="h-5 w-5" />
                    Raw Specification
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(integration.specification || '')}
                  >
                    <Copy className="mr-1 h-4 w-4" />
                    Copy
                  </Button>
                </div>
                <CardDescription>
                  {(integration.specification_format || 'unknown').toUpperCase()} format,{' '}
                  {(integration.specification?.length || 0).toLocaleString()} characters
                </CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="bg-muted max-h-[600px] overflow-auto rounded-lg p-4 font-mono text-xs">
                  {parsedSpec ? JSON.stringify(parsedSpec, null, 2) : integration.specification}
                </pre>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="details" className="m-0 flex-1 overflow-auto p-6">
            <SingleEntityAllFieldsViewComponent
              columns={columns}
              entityItem={integration}
            />
          </TabsContent>

          <TabsContent value="permissions" className="m-0 flex-1 overflow-auto p-6">
            <PermissionColumnEditor
              onChange={updatePermission}
              value={integration.permission || 0}
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
        </Tabs>
      </div>

      <Dialog open={showExecuteDialog} onOpenChange={setShowExecuteDialog}>
        <DialogContent className="flex max-h-[80vh] flex-col overflow-hidden sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Play className="h-5 w-5" />
              Test API Endpoint
            </DialogTitle>
            <DialogDescription>
              {executeState.endpoint && (
                <div className="mt-2 flex items-center gap-2">
                  <Badge variant="outline" className={methodBadgeClass(executeState.endpoint.method)}>
                    {executeState.endpoint.method}
                  </Badge>
                  <code className="text-sm">{executeState.endpoint.operationId || executeState.endpoint.path}</code>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 space-y-4 overflow-auto py-4">
            {executeState.endpoint && getPathParams(executeState.endpoint.path).length > 0 && (
              <div className="space-y-3">
                <Label className="text-sm font-medium">Path Parameters</Label>
                {getPathParams(executeState.endpoint.path).map((param) => (
                  <div key={param} className="flex items-center gap-2">
                    <Label className="text-muted-foreground w-32 text-sm">{`{${param}}`}</Label>
                    <Input
                      placeholder={`Enter ${param}`}
                      value={executeState.pathParams[param] || ''}
                      onChange={(e) =>
                        setExecuteState((prev) => ({
                          ...prev,
                          pathParams: { ...prev.pathParams, [param]: e.target.value },
                        }))
                      }
                    />
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-sm font-medium">Query Parameters</Label>
              <Input
                placeholder="key1=value1&key2=value2"
                value={executeState.queryParams}
                onChange={(e) =>
                  setExecuteState((prev) => ({ ...prev, queryParams: e.target.value }))
                }
              />
              <p className="text-muted-foreground text-xs">Optional query string without leading ?</p>
            </div>

            {executeState.endpoint?.auth?.execution_field && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  {executeState.endpoint.auth.execution_field}
                  {executeState.endpoint.auth.required ? ' *' : ''}
                </Label>
                <Input
                  placeholder={`Enter ${executeState.endpoint.auth.execution_field}`}
                  value={executeState.authValue}
                  onChange={(e) =>
                    setExecuteState((prev) => ({ ...prev, authValue: e.target.value }))
                  }
                />
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-sm font-medium">Input JSON</Label>
              <Textarea
                placeholder='{"key": "value"}'
                className="min-h-[120px] font-mono text-sm"
                value={executeState.requestBody}
                onChange={(e) =>
                  setExecuteState((prev) => ({ ...prev, requestBody: e.target.value }))
                }
              />
            </div>

            {executeState.error && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{executeState.error}</AlertDescription>
              </Alert>
            )}

            {executeState.response && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Response</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(JSON.stringify(executeState.response, null, 2))}
                  >
                    <Copy className="mr-1 h-3 w-3" />
                    Copy
                  </Button>
                </div>
                <pre className="bg-muted max-h-[200px] overflow-auto rounded-lg p-3 font-mono text-xs">
                  {JSON.stringify(executeState.response, null, 2)}
                </pre>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExecuteDialog(false)}>
              Close
            </Button>
            <Button
              onClick={executeApiCall}
              disabled={
                executeState.isLoading ||
                !executeState.endpoint?.operationId ||
                !!(
                  executeState.endpoint?.auth?.required &&
                  executeState.endpoint?.auth?.execution_field &&
                  !executeState.authValue.trim()
                )
              }
            >
              {executeState.isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Executing...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Execute
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function methodBadgeClass(method: string): string {
  if (method === 'GET') return 'bg-green-100 text-green-800 border-green-200'
  if (method === 'POST') return 'bg-blue-100 text-blue-800 border-blue-200'
  if (method === 'PUT' || method === 'PATCH') return 'bg-yellow-100 text-yellow-800 border-yellow-200'
  if (method === 'DELETE') return 'bg-red-100 text-red-800 border-red-200'
  return ''
}

function EndpointTree({
  nodes,
  integrationName,
  onExecute,
}: {
  nodes: EndpointTreeNode[]
  integrationName?: string
  onExecute: (endpoint: ParsedEndpoint) => void
}) {
  const allNodePaths = useMemo(() => collectEndpointTreePaths(nodes), [nodes])
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(
    () => new Set(allNodePaths)
  )

  useEffect(() => {
    setExpandedPaths(new Set(allNodePaths))
  }, [allNodePaths])

  const togglePath = (path: string) => {
    setExpandedPaths((previous) => {
      const next = new Set(previous)
      if (next.has(path)) {
        next.delete(path)
      } else {
        next.add(path)
      }
      return next
    })
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setExpandedPaths(new Set(allNodePaths))}
        >
          Expand all
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setExpandedPaths(new Set())}
        >
          Collapse all
        </Button>
      </div>
      <div className="space-y-1">
        {nodes.map((node) => (
          <EndpointTreeBranch
            key={node.path || node.label}
            node={node}
            depth={0}
            integrationName={integrationName}
            expandedPaths={expandedPaths}
            onTogglePath={togglePath}
            onExecute={onExecute}
          />
        ))}
      </div>
    </div>
  )
}

function EndpointTreeBranch({
  node,
  depth,
  integrationName,
  expandedPaths,
  onTogglePath,
  onExecute,
}: {
  node: EndpointTreeNode
  depth: number
  integrationName?: string
  expandedPaths: Set<string>
  onTogglePath: (path: string) => void
  onExecute: (endpoint: ParsedEndpoint) => void
}) {
  const hasChildren = node.children.length > 0
  const isExpanded = expandedPaths.has(node.path)
  const showContents = !hasChildren || isExpanded

  return (
    <div className={depth > 0 ? 'border-muted ml-4 border-l pl-3' : ''}>
      <div className="bg-muted/50 flex min-h-9 items-center gap-2 rounded px-3 py-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={() => onTogglePath(node.path)}
          disabled={!hasChildren}
          aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${node.label}`}
        >
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )
          ) : (
            <span className="h-4 w-4" />
          )}
        </Button>
        <code className="text-sm font-medium">{node.label}</code>
        {node.endpoints.length > 0 && (
          <Badge variant="secondary">
            {node.endpoints.length} {node.endpoints.length === 1 ? 'operation' : 'operations'}
          </Badge>
        )}
      </div>

      {showContents && node.endpoints.length > 0 && (
        <div className="mt-1 space-y-1">
          {node.endpoints.map((endpoint) => (
            <EndpointTreeRow
              key={`${endpoint.operationId || endpoint.path}-${endpoint.method}`}
              endpoint={endpoint}
              integrationName={integrationName}
              onExecute={onExecute}
            />
          ))}
        </div>
      )}

      {showContents && hasChildren && (
        <div className="mt-1 space-y-1">
          {node.children.map((child) => (
            <EndpointTreeBranch
              key={child.path || child.label}
              node={child}
              depth={depth + 1}
              integrationName={integrationName}
              expandedPaths={expandedPaths}
              onTogglePath={onTogglePath}
              onExecute={onExecute}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function EndpointTreeRow({
  endpoint,
  integrationName,
  onExecute,
}: {
  endpoint: ParsedEndpoint
  integrationName?: string
  onExecute: (endpoint: ParsedEndpoint) => void
}) {
  return (
    <div className="hover:bg-muted/50 flex items-center gap-3 rounded-lg border p-3">
      <Badge variant="outline" className={methodBadgeClass(endpoint.method)}>
        {endpoint.method}
      </Badge>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <code className="text-sm font-medium">{endpoint.path}</code>
          {endpoint.operationId && (
            <Badge variant="secondary">{endpoint.operationId}</Badge>
          )}
        </div>
        {(endpoint.summary || endpoint.description) && (
          <p className="text-muted-foreground mt-1 truncate text-sm">
            {endpoint.summary || endpoint.description}
          </p>
        )}
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onExecute(endpoint)}
        disabled={!endpoint.operationId || !integrationName}
      >
        <Play className="mr-1 h-3 w-3" />
        Test
      </Button>
    </div>
  )
}

export const Route = createLazyFileRoute(
  '/_authenticated/data/integrations/$integrationId'
)({
  component: IntegrationDetailRoute,
})
