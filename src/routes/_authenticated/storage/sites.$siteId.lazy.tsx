import { createLazyFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import {
  ArrowLeft,
  Globe,
  Folder,
  RefreshCcw,
  Settings,
  XCircle,
  Loader2,
  Server,
  Cloud,
  ExternalLink,
  CheckCircle,
  X,
} from 'lucide-react'
import { daptinClient } from '@/daptin'
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
import { FileBrowser } from '@/features/storage/components/FileBrowser'
import { useSiteActions } from '@/features/storage/hooks/useSiteActions'

interface SiteEntity {
  id: string
  reference_id: string
  hostname: string
  path: string
  site_type: string
  cloud_store_id: string
  enable: boolean
  ftp_enabled: boolean
  created_at: string
  updated_at: string
}

interface CloudStoreEntity {
  id: string
  reference_id: string
  name: string
  store_provider: string
  store_type: string
  root_path: string
}

function SiteDetailPage() {
  const { siteId } = Route.useParams()
  const [activeTab, setActiveTab] = useState('files')

  const { syncStorage, isLoading: isActionsLoading } = useSiteActions(siteId)

  // Fetch site data
  const { data: site, isLoading } = useQuery({
    queryKey: ['site', siteId],
    queryFn: async () => {
      const response = await daptinClient.jsonApi.findAll('site', {})
      const sites = response.data as any[]
      if (sites && sites.length > 0) {
        const found = sites.find(
          (s) =>
            s.id === siteId ||
            s.reference_id === siteId ||
            s.attributes?.reference_id === siteId
        )
        if (found) {
          if (found.attributes) {
            return {
              id: found.id,
              reference_id: found.attributes.reference_id || found.id,
              ...found.attributes,
            } as SiteEntity
          }
          return found as SiteEntity
        }
      }
      throw new Error('Site not found')
    },
    enabled: !!siteId,
  })

  // Fetch related cloud store
  const { data: cloudStore } = useQuery({
    queryKey: ['site-cloud-store', site?.cloud_store_id],
    queryFn: async () => {
      if (!site?.cloud_store_id) return null
      try {
        const response = await daptinClient.jsonApi.findAll('cloud_store', {})
        const stores = response.data as any[]
        const found = stores.find(
          (s) =>
            s.id === site.cloud_store_id ||
            s.reference_id === site.cloud_store_id ||
            s.attributes?.reference_id === site.cloud_store_id
        )
        if (found) {
          if (found.attributes) {
            return {
              id: found.id,
              reference_id: found.attributes.reference_id || found.id,
              ...found.attributes,
            } as CloudStoreEntity
          }
          return found as CloudStoreEntity
        }
        return null
      } catch {
        return null
      }
    },
    enabled: !!site?.cloud_store_id,
  })

  // Handle sync
  const handleSync = async () => {
    await syncStorage()
  }

  if (isLoading) {
    return (
      <div className="p-6 space-y-4 w-full">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  if (!site) {
    return (
      <div className="p-6 w-full">
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertTitle>Not Found</AlertTitle>
          <AlertDescription>Site not found</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full w-full">
      {/* Header */}
      <div className="p-6 border-b">
        <Link
          to="/storage/sites"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm mb-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Sites
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Globe className="h-6 w-6" />
              {site.hostname}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline">{site.site_type || 'static'}</Badge>
              <Badge variant={site.enable ? 'default' : 'secondary'}>
                {site.enable ? 'Enabled' : 'Disabled'}
              </Badge>
              {site.ftp_enabled && (
                <Badge variant="outline">
                  <Server className="h-3 w-3 mr-1" />
                  FTP
                </Badge>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSync}
              disabled={isActionsLoading}
            >
              {isActionsLoading ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <RefreshCcw className="h-4 w-4 mr-1" />
              )}
              Sync Storage
            </Button>
            <Link to={`/site/${siteId}`}>
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
              <TabsTrigger value="files">Files</TabsTrigger>
              <TabsTrigger value="info">Information</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="files" className="flex-1 overflow-hidden m-0">
            <FileBrowser siteId={siteId} rootPath={site?.path || '/'} />
          </TabsContent>

          <TabsContent value="info" className="p-6 overflow-auto">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Site Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    <span className="text-muted-foreground">Hostname</span>
                    <span className="font-medium">{site.hostname}</span>
                  </div>
                  <Separator />
                  <div className="grid grid-cols-2 gap-2">
                    <span className="text-muted-foreground">Path</span>
                    <span className="font-mono text-sm">{site.path || '/'}</span>
                  </div>
                  <Separator />
                  <div className="grid grid-cols-2 gap-2">
                    <span className="text-muted-foreground">Site Type</span>
                    <span className="font-medium capitalize">
                      {site.site_type || 'static'}
                    </span>
                  </div>
                  <Separator />
                  <div className="grid grid-cols-2 gap-2">
                    <span className="text-muted-foreground">Status</span>
                    <span className="flex items-center gap-1">
                      {site.enable ? (
                        <>
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-green-600">Enabled</span>
                        </>
                      ) : (
                        <>
                          <X className="h-4 w-4 text-red-500" />
                          <span className="text-red-600">Disabled</span>
                        </>
                      )}
                    </span>
                  </div>
                  <Separator />
                  <div className="grid grid-cols-2 gap-2">
                    <span className="text-muted-foreground">FTP Access</span>
                    <span className="flex items-center gap-1">
                      {site.ftp_enabled ? (
                        <>
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-green-600">Enabled</span>
                        </>
                      ) : (
                        <>
                          <X className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Disabled</span>
                        </>
                      )}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Cloud Storage</CardTitle>
                  <CardDescription>
                    The storage backend for this site
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {cloudStore ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                        <Cloud className="h-8 w-8 text-muted-foreground" />
                        <div className="flex-1">
                          <div className="font-medium">{cloudStore.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {cloudStore.store_provider} - {cloudStore.store_type}
                          </div>
                        </div>
                        <Link
                          to={`/storage/cloud-stores/${cloudStore.reference_id || cloudStore.id}`}
                        >
                          <Button variant="ghost" size="sm">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <span className="text-muted-foreground">Root Path</span>
                        <span className="font-mono">{cloudStore.root_path}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Folder className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No cloud store linked</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Metadata</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    <span className="text-muted-foreground">Created</span>
                    <span className="font-medium">
                      {site.created_at
                        ? new Date(site.created_at).toLocaleString()
                        : '-'}
                    </span>
                  </div>
                  <Separator />
                  <div className="grid grid-cols-2 gap-2">
                    <span className="text-muted-foreground">Updated</span>
                    <span className="font-medium">
                      {site.updated_at
                        ? new Date(site.updated_at).toLocaleString()
                        : '-'}
                    </span>
                  </div>
                  <Separator />
                  <div className="grid grid-cols-2 gap-2">
                    <span className="text-muted-foreground">Reference ID</span>
                    <span className="font-mono text-xs">{site.reference_id}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>
                    Common operations for this site
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={handleSync}
                    disabled={isActionsLoading}
                  >
                    {isActionsLoading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <RefreshCcw className="h-4 w-4 mr-2" />
                    )}
                    Sync with Cloud Storage
                  </Button>
                  {site.enable && (
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      asChild
                    >
                      <a
                        href={`http://${site.hostname}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Visit Site
                      </a>
                    </Button>
                  )}
                  {cloudStore && (
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      asChild
                    >
                      <Link
                        to={`/storage/cloud-stores/${cloudStore.reference_id || cloudStore.id}`}
                      >
                        <Cloud className="h-4 w-4 mr-2" />
                        View Cloud Store
                      </Link>
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export const Route = createLazyFileRoute('/_authenticated/storage/sites/$siteId')(
  {
    component: SiteDetailPage,
  }
)
