import React, { useState, useCallback, useEffect, useRef } from 'react'
import { daptinClient } from '@/daptin'
import {
  Folder,
  File,
  FileText,
  FileImage,
  FileVideo,
  FileAudio,
  FileArchive,
  FileCode,
  ChevronRight,
  ChevronUp,
  Trash2,
  RefreshCw,
  Download,
  MoreHorizontal,
  RefreshCcw,
  Upload,
  FolderPlus,
  Loader2,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useToast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'

interface FileInfo {
  name: string
  path: string
  size: number
  isDir: boolean
  modTime: string
  mimeType?: string
}

interface FileBrowserProps {
  siteId: string
  rootPath?: string
  onFileSelect?: (file: FileInfo) => void
}

// Format file size
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Format date
const formatDate = (dateStr: string): string => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
}

// Get icon for file type
const getFileIcon = (file: FileInfo) => {
  if (file.isDir) return Folder

  const ext = file.name.split('.').pop()?.toLowerCase()
  const mimeType = file.mimeType?.toLowerCase() || ''

  if (
    mimeType.startsWith('image/') ||
    ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext || '')
  ) {
    return FileImage
  }
  if (
    mimeType.startsWith('video/') ||
    ['mp4', 'avi', 'mov', 'wmv', 'mkv', 'webm'].includes(ext || '')
  ) {
    return FileVideo
  }
  if (
    mimeType.startsWith('audio/') ||
    ['mp3', 'wav', 'ogg', 'flac', 'aac'].includes(ext || '')
  ) {
    return FileAudio
  }
  if (['zip', 'rar', '7z', 'tar', 'gz', 'bz2'].includes(ext || '')) {
    return FileArchive
  }
  if (
    [
      'js', 'ts', 'jsx', 'tsx', 'py', 'go', 'rs', 'java', 'c', 'cpp', 'h',
      'css', 'scss', 'html', 'xml', 'json', 'yaml', 'yml', 'md',
    ].includes(ext || '')
  ) {
    return FileCode
  }
  if (['txt', 'doc', 'docx', 'pdf', 'rtf', 'odt'].includes(ext || '')) {
    return FileText
  }

  return File
}

export const FileBrowser: React.FC<FileBrowserProps> = ({
  siteId,
  rootPath = '/',
  onFileSelect,
}) => {
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [currentPath, setCurrentPath] = useState(rootPath)
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set())
  const [files, setFiles] = useState<FileInfo[]>([])
  const [isLoadingFiles, setIsLoadingFiles] = useState(false)
  const [isActionsLoading, setIsActionsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')

  // Fetch files on mount and path change
  useEffect(() => {
    let cancelled = false

    const fetchFiles = async () => {
      if (!siteId) return

      setIsLoadingFiles(true)
      setError(null)

      try {
        const response = await daptinClient.actionManager.doAction(
          'site',
          'list_files',
          { site_id: siteId, path: currentPath }
        )

        if (cancelled) return

        // Parse the response - Daptin action response format
        let fileList: FileInfo[] = []

        // Check for action response format: [{ResponseType, Attributes: {list: [...]}}]
        const actionResponse = response?.[0]
        const rawFiles = actionResponse?.Attributes?.list ||
                         actionResponse?.Attributes?.files ||
                         (Array.isArray(response) && !response[0]?.ResponseType ? response : null)

        if (Array.isArray(rawFiles)) {
          fileList = rawFiles.map((item: any) => {
            const name = item.Name || item.name || ''
            // Construct full path from current path + file name
            // API doesn't return path, only name
            const filePath = currentPath === '/' || currentPath === ''
              ? `/${name}`
              : `${currentPath}/${name}`
            return {
              name,
              path: item.Path || item.path || filePath,
              size: item.Size || item.size || 0,
              isDir: item.IsDir || item.isDir || item.is_dir || false,
              modTime: item.ModTime || item.modTime || item.mod_time || '',
              mimeType: item.MimeType || item.mimeType || item.mime_type,
            }
          })
        }

        setFiles(fileList)
      } catch (err: any) {
        if (cancelled) return
        console.error('Error fetching files:', err)
        setError(err?.message || 'Failed to fetch files')
        setFiles([])
      } finally {
        if (!cancelled) {
          setIsLoadingFiles(false)
        }
      }
    }

    fetchFiles()

    return () => {
      cancelled = true
    }
  }, [siteId, currentPath, refreshTrigger])

  // Refresh files
  const refreshFiles = useCallback(() => {
    setRefreshTrigger(prev => prev + 1)
  }, [])

  // Delete file
  const deleteFile = useCallback(async (path: string) => {
    setIsActionsLoading(true)
    try {
      await daptinClient.actionManager.doAction(
        'site',
        'delete_file',
        { site_id: siteId, path }
      )
      toast({ title: 'File deleted', description: `Deleted ${path.split('/').pop()}` })
      refreshFiles()
    } catch (err: any) {
      console.error('Error deleting file:', err)
      toast({ title: 'Delete failed', description: err?.message || 'Could not delete file', variant: 'destructive' })
    } finally {
      setIsActionsLoading(false)
    }
  }, [siteId, refreshFiles, toast])

  // Sync storage
  const syncStorage = useCallback(async () => {
    setIsActionsLoading(true)
    try {
      await daptinClient.actionManager.doAction(
        'site',
        'sync_site_storage',
        { site_id: siteId }
      )
      refreshFiles()
      toast({ title: 'Sync complete', description: 'Storage synchronized successfully' })
    } catch (err: any) {
      console.error('Error syncing storage:', err)
      toast({ title: 'Sync failed', description: err?.message || 'Failed to sync storage', variant: 'destructive' })
    } finally {
      setIsActionsLoading(false)
    }
  }, [siteId, refreshFiles, toast])

  // Upload file(s)
  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadFiles = event.target.files
    if (!uploadFiles || uploadFiles.length === 0) return

    setIsUploading(true)
    try {
      for (const file of Array.from(uploadFiles)) {
        // Convert file to base64 for upload
        const reader = new FileReader()
        const fileData = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string)
          reader.onerror = reject
          reader.readAsDataURL(file)
        })

        // Upload file via action
        await daptinClient.actionManager.doAction(
          'site',
          'upload_file',
          {
            site_id: siteId,
            path: currentPath === '/' ? `/${file.name}` : `${currentPath}/${file.name}`,
            file: fileData,
            filename: file.name,
          }
        )
      }
      toast({ title: 'Upload complete', description: `${uploadFiles.length} file(s) uploaded` })
      refreshFiles()
    } catch (err: any) {
      console.error('Error uploading file:', err)
      toast({ title: 'Upload failed', description: err?.message || 'Failed to upload file', variant: 'destructive' })
    } finally {
      setIsUploading(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }, [siteId, currentPath, refreshFiles, toast])

  // Create folder
  const handleCreateFolder = useCallback(async () => {
    if (!newFolderName.trim()) return

    setIsActionsLoading(true)
    try {
      const folderPath = currentPath === '/'
        ? `/${newFolderName.trim()}`
        : `${currentPath}/${newFolderName.trim()}`

      await daptinClient.actionManager.doAction(
        'site',
        'create_folder',
        { site_id: siteId, path: folderPath }
      )
      toast({ title: 'Folder created', description: `Created folder "${newFolderName}"` })
      setShowNewFolderDialog(false)
      setNewFolderName('')
      refreshFiles()
    } catch (err: any) {
      console.error('Error creating folder:', err)
      toast({ title: 'Failed to create folder', description: err?.message || 'Could not create folder', variant: 'destructive' })
    } finally {
      setIsActionsLoading(false)
    }
  }, [siteId, currentPath, newFolderName, refreshFiles, toast])

  // Navigate to a directory
  const navigateToPath = useCallback((path: string) => {
    setCurrentPath(path)
    setSelectedFiles(new Set())
  }, [])

  // Navigate up one level
  const navigateUp = useCallback(() => {
    const parts = currentPath.split('/').filter(Boolean)
    parts.pop()
    const newPath = '/' + parts.join('/')
    navigateToPath(newPath || '/')
  }, [currentPath, navigateToPath])

  // Handle file/folder click
  const handleItemClick = useCallback(
    (file: FileInfo) => {
      if (file.isDir) {
        navigateToPath(file.path)
      } else if (onFileSelect) {
        onFileSelect(file)
      }
    },
    [navigateToPath, onFileSelect]
  )

  // Handle file selection
  const toggleFileSelection = useCallback((path: string) => {
    setSelectedFiles((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(path)) {
        newSet.delete(path)
      } else {
        newSet.add(path)
      }
      return newSet
    })
  }, [])

  // Delete selected files
  const handleDeleteSelected = async () => {
    const count = selectedFiles.size
    setIsActionsLoading(true)
    try {
      for (const path of selectedFiles) {
        await daptinClient.actionManager.doAction(
          'site',
          'delete_file',
          { site_id: siteId, path }
        )
      }
      toast({ title: 'Files deleted', description: `Deleted ${count} item(s)` })
      setSelectedFiles(new Set())
      refreshFiles()
    } catch (err: any) {
      console.error('Error deleting files:', err)
      toast({ title: 'Delete failed', description: err?.message || 'Could not delete some files', variant: 'destructive' })
    } finally {
      setIsActionsLoading(false)
    }
  }

  // Parse breadcrumb from current path
  const breadcrumbItems = currentPath.split('/').filter(Boolean)

  // Sort files: directories first, then alphabetically
  const sortedFiles = [...files].sort((a, b) => {
    if (a.isDir && !b.isDir) return -1
    if (!a.isDir && b.isDir) return 1
    return a.name.localeCompare(b.name)
  })

  return (
    <div className="flex flex-col h-full w-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2 p-3 border-b">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={navigateUp}
            disabled={currentPath === '/' || currentPath === rootPath}
          >
            <ChevronUp className="h-4 w-4" />
          </Button>

          {/* Path breadcrumb */}
          <nav className="flex items-center text-sm">
            <button
              className="text-muted-foreground hover:text-foreground"
              onClick={() => navigateToPath('/')}
            >
              Root
            </button>
            {breadcrumbItems.map((item, index) => {
              const path = '/' + breadcrumbItems.slice(0, index + 1).join('/')
              const isLast = index === breadcrumbItems.length - 1
              return (
                <React.Fragment key={path}>
                  <ChevronRight className="h-4 w-4 mx-1 text-muted-foreground" />
                  {isLast ? (
                    <span className="font-medium">{item}</span>
                  ) : (
                    <button
                      className="text-muted-foreground hover:text-foreground"
                      onClick={() => navigateToPath(path)}
                    >
                      {item}
                    </button>
                  )}
                </React.Fragment>
              )
            })}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {/* Hidden file input for uploads */}
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            multiple
            onChange={handleFileUpload}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Upload className="h-4 w-4 mr-1" />
            )}
            Upload
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowNewFolderDialog(true)}
            disabled={isActionsLoading}
          >
            <FolderPlus className="h-4 w-4 mr-1" />
            New Folder
          </Button>
          <Button variant="outline" size="sm" onClick={refreshFiles} disabled={isLoadingFiles}>
            <RefreshCw className={`h-4 w-4 ${isLoadingFiles ? 'animate-spin' : ''}`} />
          </Button>
          <Button variant="outline" size="sm" onClick={syncStorage} disabled={isActionsLoading}>
            <RefreshCcw className={`h-4 w-4 mr-1 ${isActionsLoading ? 'animate-spin' : ''}`} />
            Sync
          </Button>
          {selectedFiles.size > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteSelected}
              disabled={isActionsLoading}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete ({selectedFiles.size})
            </Button>
          )}
        </div>
      </div>

      {/* New Folder Dialog */}
      <Dialog open={showNewFolderDialog} onOpenChange={setShowNewFolderDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
            <DialogDescription>
              Enter a name for the new folder in {currentPath === '/' ? 'root' : currentPath}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="folderName">Folder Name</Label>
            <Input
              id="folderName"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="New folder"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleCreateFolder()
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewFolderDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateFolder} disabled={!newFolderName.trim() || isActionsLoading}>
              {isActionsLoading ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <FolderPlus className="h-4 w-4 mr-1" />
              )}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* File list */}
      <div className="flex-1 overflow-auto">
        {isLoadingFiles ? (
          <div className="p-4 space-y-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-64 text-destructive">
            <p className="text-lg font-medium">Error loading files</p>
            <p className="text-sm">{error}</p>
            <Button variant="outline" size="sm" className="mt-4" onClick={refreshFiles}>
              Try Again
            </Button>
          </div>
        ) : sortedFiles.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="w-24 text-right">Size</TableHead>
                <TableHead className="w-40">Modified</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedFiles.map((file) => {
                const Icon = getFileIcon(file)
                const isSelected = selectedFiles.has(file.path)

                return (
                  <TableRow
                    key={file.path}
                    className={`cursor-pointer ${isSelected ? 'bg-muted' : ''}`}
                    onClick={() => handleItemClick(file)}
                  >
                    <TableCell
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleFileSelection(file.path)
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        className="h-4 w-4"
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Icon
                          className={`h-5 w-5 ${file.isDir ? 'text-blue-500' : 'text-gray-500'}`}
                        />
                        <span className={file.isDir ? 'font-medium' : ''}>
                          {file.name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {file.isDir ? '-' : formatFileSize(file.size)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(file.modTime)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {!file.isDir && (
                            <DropdownMenuItem>
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={(e) => {
                              e.stopPropagation()
                              deleteFile(file.path)
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
            <Folder className="h-12 w-12 mb-4" />
            <p className="text-lg font-medium">This folder is empty</p>
            <p className="text-sm">No files found at this path</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default FileBrowser
