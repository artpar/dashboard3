import { createLazyFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { daptinClient } from '@/daptin'
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
  ExternalLink,
} from 'lucide-react'
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
  SPECIFICATION_LANGUAGES,
} from '@/features/integrations'

interface IntegrationEntity {
  id: string
  reference_id: string
  name: string
  specification: string
  specification_format: string
  specification_language: string
  authentication_type: string
  authentication_specification: string
  enable: boolean
  created_at: string
  updated_at: string
}

interface ParsedEndpoint {
  path: string
  method: string
  summary?: string
  operationId?: string
}

function IntegrationDetailPage() {
  const { integrationId } = Route.useParams()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState('overview')
  const [showRawSpec, setShowRawSpec] = useState(false)

  // Fetch integration data
  const { data: integration, isLoading, error } = useQuery({
    queryKey: ['integration', integrationId],
    queryFn: async () => {
      const response = await daptinClient.jsonApi.findAll('integration', {})
      const integrations = response.data as any[]
      const found = integrations.find(
        (i) =>
          i.id === integrationId ||
          i.reference_id === integrationId ||
          i.attributes?.reference_id === integrationId
      )
      if (found) {
        if (found.attributes) {
          return {
            id: found.id,
            reference_id: found.attributes.reference_id || found.id,
            ...found.attributes,
          } as IntegrationEntity
        }
        return found as IntegrationEntity
      }
      throw new Error('Integration not found')
    },
    enabled: !!integrationId,
  })

  // Parse OpenAPI spec to extract endpoints
  const parsedSpec = (() => {
    if (!integration?.specification) return null
    try {
      const spec = JSON.parse(integration.specification)
      return spec
    } catch {
      return null
    }
  })()

  // Extract endpoints from OpenAPI spec
  const endpoints: ParsedEndpoint[] = (() => {
    if (!parsedSpec?.paths) return []
    const paths = parsedSpec.paths
    const result: ParsedEndpoint[] = []

    Object.entries(paths).forEach(([path, methods]: [string, any]) => {
      Object.entries(methods).forEach(([method, details]: [string, any]) => {
        if (['get', 'post', 'put', 'patch', 'delete', 'options', 'head'].includes(method)) {
          result.push({
            path,
            method: method.toUpperCase(),
            summary: details.summary || details.description,
            operationId: details.operationId,
          })
        }
      })
    })
    return result
  })()

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({ title: 'Copied to clipboard' })
  }

  const specLanguage = getSpecificationLanguageById(integration?.specification_language || '')
  const authType = getAuthenticationTypeById(integration?.authentication_type || '')

  if (isLoading) {
    return (
      <div className="p-6 space-y-4 w-full">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  if (error || !integration) {
    return (
      <div className="p-6 w-full">
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertTitle>Not Found</AlertTitle>
          <AlertDescription>Integration not found</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full w-full">
      {/* Header */}
      <div className="p-6 border-b">
        <Link
          to="/data/integrations"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm mb-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Integrations
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Globe className="h-6 w-6" />
              {integration.name}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline">
                {specLanguage?.label || integration.specification_language}
              </Badge>
              <Badge variant="outline">{integration.specification_format}</Badge>
              <Badge variant={integration.enable ? 'default' : 'secondary'}>
                {integration.enable ? 'Enabled' : 'Disabled'}
              </Badge>
              {authType && authType.id !== 'none' && (
                <Badge variant="outline">
                  <Key className="h-3 w-3 mr-1" />
                  {authType.label}
                </Badge>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Link to={`/integration/${integrationId}`}>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-1" />
                Edit
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex flex-col h-full"
        >
          <div className="border-b px-6">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="endpoints">
                Endpoints {endpoints.length > 0 && `(${endpoints.length})`}
              </TabsTrigger>
              <TabsTrigger value="specification">Specification</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview" className="p-6 overflow-auto">
            <div className="grid gap-6 md:grid-cols-2">
              {/* API Info */}
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
                            <span className="text-muted-foreground block mb-1">Description</span>
                            <p className="text-sm">{parsedSpec.info.description}</p>
                          </div>
                          <Separator />
                        </>
                      )}
                    </>
                  )}
                  <div className="grid grid-cols-2 gap-2">
                    <span className="text-muted-foreground">Spec Language</span>
                    <span className="font-medium">{specLanguage?.label || integration.specification_language}</span>
                  </div>
                  <Separator />
                  <div className="grid grid-cols-2 gap-2">
                    <span className="text-muted-foreground">Format</span>
                    <span className="font-medium uppercase">{integration.specification_format}</span>
                  </div>
                  <Separator />
                  <div className="grid grid-cols-2 gap-2">
                    <span className="text-muted-foreground">Endpoints</span>
                    <span className="font-medium">{endpoints.length}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Authentication */}
              <Card>
                <CardHeader>
                  <CardTitle>Authentication</CardTitle>
                  <CardDescription>
                    How this integration authenticates with the API
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                    {authType ? (
                      <>
                        <authType.icon className="h-8 w-8 text-muted-foreground" />
                        <div className="flex-1">
                          <div className="font-medium">{authType.label}</div>
                          <div className="text-sm text-muted-foreground">
                            {authType.description}
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <Globe className="h-8 w-8 text-muted-foreground" />
                        <div className="flex-1">
                          <div className="font-medium">No Authentication</div>
                          <div className="text-sm text-muted-foreground">
                            Public API access
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Servers */}
              {parsedSpec?.servers && parsedSpec.servers.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Servers</CardTitle>
                    <CardDescription>Base URLs for API requests</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {parsedSpec.servers.map((server: any, index: number) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 bg-muted rounded"
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

              {/* Metadata */}
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
                    <span className="font-mono text-xs">{integration.reference_id}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="endpoints" className="p-6 overflow-auto">
            {endpoints.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>API Endpoints</CardTitle>
                  <CardDescription>
                    {endpoints.length} endpoints found in the specification
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {endpoints.map((endpoint, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50"
                      >
                        <Badge
                          variant="outline"
                          className={
                            endpoint.method === 'GET'
                              ? 'bg-green-100 text-green-800 border-green-200'
                              : endpoint.method === 'POST'
                              ? 'bg-blue-100 text-blue-800 border-blue-200'
                              : endpoint.method === 'PUT' || endpoint.method === 'PATCH'
                              ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
                              : endpoint.method === 'DELETE'
                              ? 'bg-red-100 text-red-800 border-red-200'
                              : ''
                          }
                        >
                          {endpoint.method}
                        </Badge>
                        <code className="text-sm font-medium flex-1">{endpoint.path}</code>
                        {endpoint.summary && (
                          <span className="text-sm text-muted-foreground truncate max-w-[300px]">
                            {endpoint.summary}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                <FileJson className="h-12 w-12 mb-4" />
                <p className="text-lg font-medium">No endpoints found</p>
                <p className="text-sm">
                  {parsedSpec
                    ? 'The specification does not contain any paths'
                    : 'Unable to parse the specification'}
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="specification" className="p-6 overflow-auto">
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
                    onClick={() => copyToClipboard(integration.specification)}
                  >
                    <Copy className="h-4 w-4 mr-1" />
                    Copy
                  </Button>
                </div>
                <CardDescription>
                  {integration.specification_format.toUpperCase()} format,{' '}
                  {(integration.specification?.length || 0).toLocaleString()} characters
                </CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="bg-muted p-4 rounded-lg text-xs overflow-auto max-h-[600px] font-mono">
                  {parsedSpec
                    ? JSON.stringify(parsedSpec, null, 2)
                    : integration.specification}
                </pre>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export const Route = createLazyFileRoute(
  '/_authenticated/data/integrations/$integrationId'
)({
  component: IntegrationDetailPage,
})
