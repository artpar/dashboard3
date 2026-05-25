/* eslint-disable no-console */
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createLazyFileRoute } from '@tanstack/react-router'
import { Link } from '@tanstack/react-router'
import { daptinClient } from '@/daptin'
import type { DaptinCloudStoreEntity, DaptinSiteEntity } from 'daptin-client'
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FileBrowser } from '@/features/storage/components/FileBrowser'
import { useSiteActions } from '@/features/storage/hooks/useSiteActions'

function SiteDetailPage() {
  const { siteId } = Route.useParams()
  const [activeTab, setActiveTab] = useState('files')

  const { syncStorage, isLoading: isActionsLoading } = useSiteActions(siteId)

  // Fetch site data
  const { data: site, isLoading } = useQuery({
    queryKey: ['site', siteId],
    queryFn: async () => {
      console.info('[storage.siteRoute] fetch-site:start', { siteId })
      const response = await daptinClient.jsonApi.find<DaptinSiteEntity>(
        'site',
        siteId
      )
      if (!response.data) {
        throw new Error('Site not found')
      }
      console.info('[storage.siteRoute] fetch-site:success', { siteId })
      return response.data as DaptinSiteEntity
    },
    enabled: !!siteId,
  })

  // Fetch related cloud store
  const { data: cloudStore } = useQuery({
    queryKey: ['site-cloud-store', site?.cloud_store_id],
    queryFn: async () => {
      if (!site?.cloud_store_id) return null
      try {
        console.info('[storage.siteRoute] fetch-cloud-store:start', {
          siteId,
          cloudStoreId: site.cloud_store_id,
        })
        const response =
          await daptinClient.jsonApi.find<DaptinCloudStoreEntity>(
            'cloud_store',
            site.cloud_store_id
          )
        console.info('[storage.siteRoute] fetch-cloud-store:success', {
          siteId,
          cloudStoreId: site.cloud_store_id,
          found: Boolean(response.data),
        })
        return response.data as DaptinCloudStoreEntity | null
      } catch (error) {
        console.error('[storage.siteRoute] fetch-cloud-store:failed', {
          siteId,
          cloudStoreId: site.cloud_store_id,
          error,
        })
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
      <div className='w-full space-y-4 p-6'>
        <Skeleton className='h-8 w-64' />
        <Skeleton className='h-4 w-96' />
        <Skeleton className='h-96 w-full' />
      </div>
    )
  }

  if (!site) {
    return (
      <div className='w-full p-6'>
        <Alert variant='destructive'>
          <XCircle className='h-4 w-4' />
          <AlertTitle>Not Found</AlertTitle>
          <AlertDescription>Site not found</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className='flex h-full w-full flex-col'>
      {/* Header */}
      <div className='border-b p-6'>
        <Link
          to='/storage/sites'
          className='text-muted-foreground hover:text-foreground mb-2 inline-flex items-center gap-1 text-sm'
        >
          <ArrowLeft className='h-4 w-4' />
          Back to Sites
        </Link>
        <div className='flex items-start justify-between'>
          <div>
            <h1 className='flex items-center gap-2 text-2xl font-bold'>
              <Globe className='h-6 w-6' />
              {site.hostname}
            </h1>
            <div className='mt-1 flex items-center gap-2'>
              <Badge variant='outline'>{site.site_type || 'static'}</Badge>
              <Badge variant={site.enable ? 'default' : 'secondary'}>
                {site.enable ? 'Enabled' : 'Disabled'}
              </Badge>
              {site.ftp_enabled && (
                <Badge variant='outline'>
                  <Server className='mr-1 h-3 w-3' />
                  FTP
                </Badge>
              )}
            </div>
          </div>
          <div className='flex gap-2'>
            <Button
              variant='outline'
              size='sm'
              onClick={handleSync}
              disabled={isActionsLoading}
            >
              {isActionsLoading ? (
                <Loader2 className='mr-1 h-4 w-4 animate-spin' />
              ) : (
                <RefreshCcw className='mr-1 h-4 w-4' />
              )}
              Sync Storage
            </Button>
            <Link to={`/site/${siteId}`}>
              <Button variant='outline' size='sm'>
                <Settings className='mr-1 h-4 w-4' />
                Edit
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className='flex-1 overflow-hidden'>
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className='flex h-full flex-col'
        >
          <div className='border-b px-6'>
            <TabsList>
              <TabsTrigger value='files'>Files</TabsTrigger>
              <TabsTrigger value='info'>Information</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value='files' className='m-0 flex-1 overflow-hidden'>
            <FileBrowser
              siteId={siteId}
              cloudStoreId={site.cloud_store_id || undefined}
              rootPath='/'
            />
          </TabsContent>

          <TabsContent value='info' className='overflow-auto p-6'>
            <div className='grid gap-6 md:grid-cols-2'>
              <Card>
                <CardHeader>
                  <CardTitle>Site Configuration</CardTitle>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <div className='grid grid-cols-2 gap-2'>
                    <span className='text-muted-foreground'>Hostname</span>
                    <span className='font-medium'>{site.hostname}</span>
                  </div>
                  <Separator />
                  <div className='grid grid-cols-2 gap-2'>
                    <span className='text-muted-foreground'>Path</span>
                    <span className='font-mono text-sm'>
                      {site.path || '/'}
                    </span>
                  </div>
                  <Separator />
                  <div className='grid grid-cols-2 gap-2'>
                    <span className='text-muted-foreground'>Site Type</span>
                    <span className='font-medium capitalize'>
                      {site.site_type || 'static'}
                    </span>
                  </div>
                  <Separator />
                  <div className='grid grid-cols-2 gap-2'>
                    <span className='text-muted-foreground'>Status</span>
                    <span className='flex items-center gap-1'>
                      {site.enable ? (
                        <>
                          <CheckCircle className='h-4 w-4 text-green-500' />
                          <span className='text-green-600'>Enabled</span>
                        </>
                      ) : (
                        <>
                          <X className='h-4 w-4 text-red-500' />
                          <span className='text-red-600'>Disabled</span>
                        </>
                      )}
                    </span>
                  </div>
                  <Separator />
                  <div className='grid grid-cols-2 gap-2'>
                    <span className='text-muted-foreground'>FTP Access</span>
                    <span className='flex items-center gap-1'>
                      {site.ftp_enabled ? (
                        <>
                          <CheckCircle className='h-4 w-4 text-green-500' />
                          <span className='text-green-600'>Enabled</span>
                        </>
                      ) : (
                        <>
                          <X className='text-muted-foreground h-4 w-4' />
                          <span className='text-muted-foreground'>
                            Disabled
                          </span>
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
                    <div className='space-y-4'>
                      <div className='bg-muted flex items-center gap-3 rounded-lg p-3'>
                        <Cloud className='text-muted-foreground h-8 w-8' />
                        <div className='flex-1'>
                          <div className='font-medium'>{cloudStore.name}</div>
                          <div className='text-muted-foreground text-sm'>
                            {cloudStore.store_provider} -{' '}
                            {cloudStore.store_type}
                          </div>
                        </div>
                        <Link
                          to={`/storage/cloud-stores/${cloudStore.reference_id || cloudStore.id}`}
                        >
                          <Button variant='ghost' size='sm'>
                            <ExternalLink className='h-4 w-4' />
                          </Button>
                        </Link>
                      </div>
                      <div className='grid grid-cols-2 gap-2 text-sm'>
                        <span className='text-muted-foreground'>Root Path</span>
                        <span className='font-mono'>
                          {cloudStore.root_path}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className='text-muted-foreground py-8 text-center'>
                      <Folder className='mx-auto mb-2 h-12 w-12 opacity-50' />
                      <p>No cloud store linked</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Metadata</CardTitle>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <div className='grid grid-cols-2 gap-2'>
                    <span className='text-muted-foreground'>Created</span>
                    <span className='font-medium'>
                      {site.created_at
                        ? new Date(site.created_at).toLocaleString()
                        : '-'}
                    </span>
                  </div>
                  <Separator />
                  <div className='grid grid-cols-2 gap-2'>
                    <span className='text-muted-foreground'>Updated</span>
                    <span className='font-medium'>
                      {site.updated_at
                        ? new Date(site.updated_at).toLocaleString()
                        : '-'}
                    </span>
                  </div>
                  <Separator />
                  <div className='grid grid-cols-2 gap-2'>
                    <span className='text-muted-foreground'>Reference ID</span>
                    <span className='font-mono text-xs'>
                      {site.reference_id}
                    </span>
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
                <CardContent className='space-y-2'>
                  <Button
                    variant='outline'
                    className='w-full justify-start'
                    onClick={handleSync}
                    disabled={isActionsLoading}
                  >
                    {isActionsLoading ? (
                      <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    ) : (
                      <RefreshCcw className='mr-2 h-4 w-4' />
                    )}
                    Sync with Cloud Storage
                  </Button>
                  {site.enable && (
                    <Button
                      variant='outline'
                      className='w-full justify-start'
                      asChild
                    >
                      <a
                        href={`http://${site.hostname}`}
                        target='_blank'
                        rel='noopener noreferrer'
                      >
                        <ExternalLink className='mr-2 h-4 w-4' />
                        Visit Site
                      </a>
                    </Button>
                  )}
                  {cloudStore && (
                    <Button
                      variant='outline'
                      className='w-full justify-start'
                      asChild
                    >
                      <Link
                        to={`/storage/cloud-stores/${cloudStore.reference_id || cloudStore.id}`}
                      >
                        <Cloud className='mr-2 h-4 w-4' />
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

export const Route = createLazyFileRoute(
  '/_authenticated/storage/sites/$siteId'
)({
  component: SiteDetailPage,
})
