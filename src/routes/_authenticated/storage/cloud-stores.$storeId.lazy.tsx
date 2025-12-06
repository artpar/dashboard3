import { createLazyFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import {
  ArrowLeft,
  Cloud,
  HardDrive,
  Server,
  Folder,
  Database,
  Globe,
  FolderPlus,
  Upload,
  Settings,
  XCircle,
  Loader2,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { FileBrowser } from '@/features/storage/components/FileBrowser'
import { useCloudStoreActions } from '@/features/storage/hooks/useCloudStoreActions'
import { getProviderById } from '@/features/storage/config/providers'

interface CloudStoreEntity {
  id: string
  reference_id: string
  name: string
  store_provider: string
  store_type: string
  root_path: string
  store_parameters: string
  created_at: string
  updated_at: string
}

interface SiteEntity {
  id: string
  reference_id: string
  hostname: string
  path: string
  site_type: string
  cloud_store_id: string
}

// Get provider icon
const getProviderIcon = (providerId: string) => {
  const provider = getProviderById(providerId)
  if (provider) return provider.icon

  // Fallback icons
  switch (providerId) {
    case 'local':
      return HardDrive
    case 's3':
    case 'gcs':
    case 'azure':
      return Cloud
    case 'ftp':
    case 'sftp':
      return Server
    case 'b2':
      return Database
    default:
      return Folder
  }
}

function CloudStoreDetailPage() {
  const { storeId } = Route.useParams()
  const [activeTab, setActiveTab] = useState('sites')
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null)
  const [showCreateSite, setShowCreateSite] = useState(false)
  const [showCreateFolder, setShowCreateFolder] = useState(false)
  const [showUpload, setShowUpload] = useState(false)
  const [siteHostname, setSiteHostname] = useState('')
  const [sitePath, setSitePath] = useState('/')
  const [siteType, setSiteType] = useState('static')
  const [newFolderPath, setNewFolderPath] = useState('/')
  const [newFolderName, setNewFolderName] = useState('')

  const { createSite, createFolder, uploadFile, isLoading: isActionsLoading } =
    useCloudStoreActions(storeId)

  // Fetch cloud store data
  const { data: cloudStore, isLoading } = useQuery({
    queryKey: ['cloud-store', storeId],
    queryFn: async () => {
      const response = await daptinClient.jsonApi.findAll('cloud_store', {})
      const stores = response.data as any[]
      if (stores && stores.length > 0) {
        const store = stores.find(s =>
          s.id === storeId ||
          s.reference_id === storeId ||
          s.attributes?.reference_id === storeId
        )
        if (store) {
          if (store.attributes) {
            return {
              id: store.id,
              reference_id: store.attributes.reference_id || store.id,
              ...store.attributes
            } as CloudStoreEntity
          }
          return store as CloudStoreEntity
        }
      }
      throw new Error('Cloud store not found')
    },
    enabled: !!storeId,
  })

  // Fetch related sites
  const { data: relatedSites, refetch: refetchSites } = useQuery({
    queryKey: ['cloud-store-sites', storeId],
    queryFn: async () => {
      try {
        const response = await daptinClient.jsonApi.findAll('site', {})
        const sites = response.data as any[]
        // Filter sites that belong to this cloud store
        return sites
          .filter(s => {
            const cloudStoreRef = s.cloud_store_id || s.attributes?.cloud_store_id
            return cloudStoreRef === storeId
          })
          .map(s => {
            if (s.attributes) {
              return {
                id: s.id,
                reference_id: s.attributes.reference_id || s.id,
                ...s.attributes
              } as SiteEntity
            }
            return s as SiteEntity
          })
      } catch {
        return []
      }
    },
    enabled: !!storeId,
  })

  // Handle create site
  const handleCreateSite = async () => {
    if (!siteHostname.trim()) return
    await createSite({
      hostname: siteHostname.trim(),
      path: sitePath,
      siteType: siteType,
    })
    setShowCreateSite(false)
    setSiteHostname('')
    setSitePath('/')
    setSiteType('static')
    refetchSites()
  }

  // Handle create folder
  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return
    await createFolder({
      path: newFolderPath,
      name: newFolderName.trim(),
    })
    setShowCreateFolder(false)
    setNewFolderPath('/')
    setNewFolderName('')
  }

  // Handle file upload
  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    for (const file of Array.from(files)) {
      await uploadFile({
        path: '/',
        file,
      })
    }
    setShowUpload(false)
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

  if (!cloudStore) {
    return (
      <div className="p-6 w-full">
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertTitle>Not Found</AlertTitle>
          <AlertDescription>Cloud store not found</AlertDescription>
        </Alert>
      </div>
    )
  }

  const ProviderIcon = getProviderIcon(cloudStore.store_provider)
  const providerConfig = getProviderById(cloudStore.store_provider)
  const storeParameters = cloudStore.store_parameters
    ? JSON.parse(cloudStore.store_parameters)
    : {}

  return (
    <div className="flex flex-col h-full w-full">
      {/* Header */}
      <div className="p-6 border-b">
        <Link
          to="/storage/cloud-stores"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm mb-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Cloud Stores
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <ProviderIcon className="h-6 w-6" />
              {cloudStore.name}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline">
                {providerConfig?.label || cloudStore.store_provider}
              </Badge>
              <Badge
                variant={cloudStore.store_type === 'cached' ? 'secondary' : 'outline'}
              >
                {cloudStore.store_type}
              </Badge>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCreateFolder(true)}
            >
              <FolderPlus className="h-4 w-4 mr-1" />
              New Folder
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowUpload(true)}
            >
              <Upload className="h-4 w-4 mr-1" />
              Upload
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCreateSite(true)}
            >
              <Globe className="h-4 w-4 mr-1" />
              Create Site
            </Button>
            <Link to={`/cloud_store/${storeId}`}>
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
              <TabsTrigger value="sites">Sites & Files</TabsTrigger>
              <TabsTrigger value="info">Information</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="sites" className="flex-1 overflow-hidden m-0">
            <div className="flex h-full">
              {/* Sites list sidebar */}
              <div className="w-64 border-r overflow-auto">
                <div className="p-4">
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Sites
                  </h3>
                  {relatedSites && relatedSites.length > 0 ? (
                    <div className="space-y-1">
                      {relatedSites.map((site) => (
                        <button
                          key={site.reference_id || site.id}
                          className={`w-full text-left px-3 py-2 rounded-md text-sm ${
                            selectedSiteId === (site.reference_id || site.id)
                              ? 'bg-primary text-primary-foreground'
                              : 'hover:bg-muted'
                          }`}
                          onClick={() => setSelectedSiteId(site.reference_id || site.id)}
                        >
                          <div className="font-medium truncate">{site.hostname}</div>
                          <div className="text-xs opacity-70">{site.path || '/'}</div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Globe className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No sites yet</p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={() => setShowCreateSite(true)}
                      >
                        Create Site
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* File browser for selected site */}
              <div className="flex-1 overflow-hidden">
                {selectedSiteId ? (
                  <FileBrowser
                    siteId={selectedSiteId}
                    rootPath="/"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                    <Folder className="h-16 w-16 mb-4 opacity-50" />
                    <p className="text-lg font-medium">Select a site to browse files</p>
                    <p className="text-sm mt-1">
                      File browsing is available through sites linked to this cloud store
                    </p>
                    {(!relatedSites || relatedSites.length === 0) && (
                      <Button
                        variant="outline"
                        className="mt-4"
                        onClick={() => setShowCreateSite(true)}
                      >
                        <Globe className="h-4 w-4 mr-2" />
                        Create Your First Site
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="info" className="p-6 overflow-auto">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Storage Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    <span className="text-muted-foreground">Provider</span>
                    <span className="font-medium">
                      {providerConfig?.label || cloudStore.store_provider}
                    </span>
                  </div>
                  <Separator />
                  <div className="grid grid-cols-2 gap-2">
                    <span className="text-muted-foreground">Store Type</span>
                    <span className="font-medium capitalize">
                      {cloudStore.store_type}
                    </span>
                  </div>
                  <Separator />
                  <div className="grid grid-cols-2 gap-2">
                    <span className="text-muted-foreground">Root Path</span>
                    <span className="font-mono text-sm break-all">
                      {cloudStore.root_path}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {Object.keys(storeParameters).length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Provider Parameters</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {Object.entries(storeParameters).map(([key, value]) => (
                      <div key={key} className="grid grid-cols-2 gap-2">
                        <span className="text-muted-foreground capitalize">
                          {key.replace(/_/g, ' ')}
                        </span>
                        <span className="font-medium">
                          {typeof value === 'boolean'
                            ? value
                              ? 'Yes'
                              : 'No'
                            : String(value)}
                        </span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle>Metadata</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    <span className="text-muted-foreground">Created</span>
                    <span className="font-medium">
                      {new Date(cloudStore.created_at).toLocaleString()}
                    </span>
                  </div>
                  <Separator />
                  <div className="grid grid-cols-2 gap-2">
                    <span className="text-muted-foreground">Updated</span>
                    <span className="font-medium">
                      {new Date(cloudStore.updated_at).toLocaleString()}
                    </span>
                  </div>
                  <Separator />
                  <div className="grid grid-cols-2 gap-2">
                    <span className="text-muted-foreground">Reference ID</span>
                    <span className="font-mono text-xs">
                      {cloudStore.reference_id}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>
                    Common operations for this cloud store
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => setShowCreateFolder(true)}
                  >
                    <FolderPlus className="h-4 w-4 mr-2" />
                    Create Folder
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => setShowUpload(true)}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload File
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => setShowCreateSite(true)}
                  >
                    <Globe className="h-4 w-4 mr-2" />
                    Create Static Site
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Create Site Dialog */}
      <Dialog open={showCreateSite} onOpenChange={setShowCreateSite}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Site from Cloud Store</DialogTitle>
            <DialogDescription>
              Host a static website from this cloud store
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="hostname">Hostname</Label>
              <Input
                id="hostname"
                placeholder="example.com"
                value={siteHostname}
                onChange={(e) => setSiteHostname(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                The domain name that will serve files from this cloud store
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="path">Root Path</Label>
              <Input
                id="path"
                placeholder="/"
                value={sitePath}
                onChange={(e) => setSitePath(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                The path within the cloud store to serve
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="siteType">Site Type</Label>
              <Select value={siteType} onValueChange={setSiteType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="static">Static (HTML/CSS/JS)</SelectItem>
                  <SelectItem value="hugo">Hugo</SelectItem>
                  <SelectItem value="jekyll">Jekyll</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateSite(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateSite}
              disabled={!siteHostname.trim() || isActionsLoading}
            >
              {isActionsLoading && (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              )}
              Create Site
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Folder Dialog */}
      <Dialog open={showCreateFolder} onOpenChange={setShowCreateFolder}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Folder</DialogTitle>
            <DialogDescription>
              Create a new folder in the cloud store
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="folderPath">Parent Path</Label>
              <Input
                id="folderPath"
                placeholder="/"
                value={newFolderPath}
                onChange={(e) => setNewFolderPath(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="folderName">Folder Name</Label>
              <Input
                id="folderName"
                placeholder="my-folder"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateFolder(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateFolder}
              disabled={!newFolderName.trim() || isActionsLoading}
            >
              {isActionsLoading && (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              )}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upload Dialog */}
      <Dialog open={showUpload} onOpenChange={setShowUpload}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Files</DialogTitle>
            <DialogDescription>
              Upload files to the cloud store
            </DialogDescription>
          </DialogHeader>
          <div className="border-2 border-dashed rounded-lg p-8 text-center">
            <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Click to select files or drag and drop
            </p>
            <Input
              type="file"
              multiple
              className="mt-4"
              onChange={(e) => handleFileUpload(e.target.files)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUpload(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export const Route = createLazyFileRoute(
  '/_authenticated/storage/cloud-stores/$storeId'
)({
  component: CloudStoreDetailPage,
})
