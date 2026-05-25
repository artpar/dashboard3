/* eslint-disable no-console */
import React, { useState, useCallback, useEffect, useRef } from 'react'
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
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useToast } from '@/components/ui/use-toast'
import { useCloudStoreActions } from '@/features/storage/hooks/useCloudStoreActions'
import {
  type FileInfo,
  useSiteActions,
} from '@/features/storage/hooks/useSiteActions'

interface FileBrowserProps {
  siteId: string
  cloudStoreId?: string
  rootPath?: string
  onFileSelect?: (file: FileInfo) => void
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const formatDate = (dateStr: string): string => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
}

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
      'js',
      'ts',
      'jsx',
      'tsx',
      'py',
      'go',
      'rs',
      'java',
      'c',
      'cpp',
      'h',
      'css',
      'scss',
      'html',
      'xml',
      'json',
      'yaml',
      'yml',
      'md',
    ].includes(ext || '')
  ) {
    return FileCode
  }
  if (['txt', 'doc', 'docx', 'pdf', 'rtf', 'odt'].includes(ext || '')) {
    return FileText
  }

  return File
}

function downloadFile(name: string, content: string, mimeType: string) {
  const binary = window.atob(content)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }
  const blob = new Blob([bytes], { type: mimeType })
  const url = window.URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = name
  anchor.click()
  window.URL.revokeObjectURL(url)
}

export const FileBrowser: React.FC<FileBrowserProps> = ({
  siteId,
  cloudStoreId,
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

  const {
    listFiles,
    getFile,
    deleteFile: deleteSiteFile,
    syncStorage: syncSiteStorage,
  } = useSiteActions(siteId)
  const { uploadFile, createFolder } = useCloudStoreActions(cloudStoreId || '')
  const canWriteViaCloudStore = Boolean(cloudStoreId)

  useEffect(() => {
    let cancelled = false

    const fetchFiles = async () => {
      if (!siteId) return

      console.info('[storage.fileBrowser] list:start', { siteId, currentPath })
      setIsLoadingFiles(true)
      setError(null)

      try {
        const fileList = await listFiles(currentPath)

        if (cancelled) return

        console.info('[storage.fileBrowser] list:success', {
          siteId,
          currentPath,
          count: fileList.length,
        })
        setFiles(fileList)
      } catch (err: unknown) {
        if (cancelled) return
        console.error('[storage.fileBrowser] list:failed', {
          siteId,
          currentPath,
          error: err,
        })
        setError(err instanceof Error ? err.message : 'Failed to fetch files')
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
  }, [siteId, currentPath, refreshTrigger, listFiles])

  const refreshFiles = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1)
  }, [])

  const deleteFile = useCallback(
    async (path: string) => {
      setIsActionsLoading(true)
      console.info('[storage.fileBrowser] delete:start', { siteId, path })
      try {
        await deleteSiteFile(path)
        toast({
          title: 'File deleted',
          description: `Deleted ${path.split('/').pop()}`,
        })
        console.info('[storage.fileBrowser] delete:success', { siteId, path })
        refreshFiles()
      } catch (err: unknown) {
        console.error('[storage.fileBrowser] delete:failed', {
          siteId,
          path,
          error: err,
        })
        toast({
          title: 'Delete failed',
          description:
            err instanceof Error ? err.message : 'Could not delete file',
          variant: 'destructive',
        })
      } finally {
        setIsActionsLoading(false)
      }
    },
    [deleteSiteFile, siteId, refreshFiles, toast]
  )

  const syncStorage = useCallback(async () => {
    setIsActionsLoading(true)
    console.info('[storage.fileBrowser] sync:start', { siteId })
    try {
      await syncSiteStorage()
      refreshFiles()
      console.info('[storage.fileBrowser] sync:success', { siteId })
      toast({
        title: 'Sync complete',
        description: 'Storage synchronized successfully',
      })
    } catch (err: unknown) {
      console.error('[storage.fileBrowser] sync:failed', { siteId, error: err })
      toast({
        title: 'Sync failed',
        description:
          err instanceof Error ? err.message : 'Failed to sync storage',
        variant: 'destructive',
      })
    } finally {
      setIsActionsLoading(false)
    }
  }, [syncSiteStorage, siteId, refreshFiles, toast])

  const handleFileUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const uploadFiles = event.target.files
      if (!uploadFiles || uploadFiles.length === 0) return

      if (!cloudStoreId) {
        console.warn('[storage.fileBrowser] upload:blocked:no-cloud-store', {
          siteId,
          currentPath,
        })
        toast({
          title: 'Upload unavailable',
          description: 'This site is not linked to a cloud store.',
          variant: 'destructive',
        })
        return
      }

      setIsUploading(true)
      console.info('[storage.fileBrowser] upload:start', {
        siteId,
        cloudStoreId,
        currentPath,
        count: uploadFiles.length,
      })
      try {
        for (const file of Array.from(uploadFiles)) {
          await uploadFile({
            path: currentPath,
            file,
          })
        }
        toast({
          title: 'Upload complete',
          description: `${uploadFiles.length} file(s) uploaded`,
        })
        console.info('[storage.fileBrowser] upload:success', {
          siteId,
          cloudStoreId,
          currentPath,
          count: uploadFiles.length,
        })
        refreshFiles()
      } catch (err: unknown) {
        console.error('[storage.fileBrowser] upload:failed', {
          siteId,
          cloudStoreId,
          currentPath,
          error: err,
        })
        toast({
          title: 'Upload failed',
          description:
            err instanceof Error ? err.message : 'Failed to upload file',
          variant: 'destructive',
        })
      } finally {
        setIsUploading(false)
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      }
    },
    [cloudStoreId, currentPath, refreshFiles, siteId, toast, uploadFile]
  )

  const handleCreateFolder = useCallback(async () => {
    if (!newFolderName.trim()) return

    if (!cloudStoreId) {
      console.warn(
        '[storage.fileBrowser] create-folder:blocked:no-cloud-store',
        {
          siteId,
          currentPath,
        }
      )
      toast({
        title: 'Folder creation unavailable',
        description: 'This site is not linked to a cloud store.',
        variant: 'destructive',
      })
      return
    }

    setIsActionsLoading(true)
    console.info('[storage.fileBrowser] create-folder:start', {
      siteId,
      cloudStoreId,
      currentPath,
      name: newFolderName.trim(),
    })
    try {
      await createFolder({
        path: currentPath,
        name: newFolderName.trim(),
      })
      toast({
        title: 'Folder created',
        description: `Created folder "${newFolderName}"`,
      })
      setShowNewFolderDialog(false)
      setNewFolderName('')
      console.info('[storage.fileBrowser] create-folder:success', {
        siteId,
        cloudStoreId,
        currentPath,
      })
      refreshFiles()
    } catch (err: unknown) {
      console.error('[storage.fileBrowser] create-folder:failed', {
        siteId,
        cloudStoreId,
        currentPath,
        error: err,
      })
      toast({
        title: 'Failed to create folder',
        description:
          err instanceof Error ? err.message : 'Could not create folder',
        variant: 'destructive',
      })
    } finally {
      setIsActionsLoading(false)
    }
  }, [
    cloudStoreId,
    createFolder,
    currentPath,
    newFolderName,
    refreshFiles,
    siteId,
    toast,
  ])

  const downloadFileFromSite = useCallback(
    async (file: FileInfo) => {
      console.info('[storage.fileBrowser] download:start', {
        siteId,
        path: file.path,
      })
      try {
        const result = await getFile(file.path)
        downloadFile(file.name, result.content, result.mimeType)
        console.info('[storage.fileBrowser] download:success', {
          siteId,
          path: file.path,
        })
      } catch (err: unknown) {
        console.error('[storage.fileBrowser] download:failed', {
          siteId,
          path: file.path,
          error: err,
        })
        toast({
          title: 'Download failed',
          description:
            err instanceof Error ? err.message : 'Could not download file',
          variant: 'destructive',
        })
      }
    },
    [getFile, siteId, toast]
  )

  const navigateToPath = useCallback((path: string) => {
    setCurrentPath(path)
    setSelectedFiles(new Set())
  }, [])

  const navigateUp = useCallback(() => {
    const parts = currentPath.split('/').filter(Boolean)
    parts.pop()
    const newPath = '/' + parts.join('/')
    navigateToPath(newPath || '/')
  }, [currentPath, navigateToPath])

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

  const handleDeleteSelected = async () => {
    const count = selectedFiles.size
    setIsActionsLoading(true)
    console.info('[storage.fileBrowser] delete-selected:start', {
      siteId,
      count,
    })
    try {
      for (const path of selectedFiles) {
        await deleteSiteFile(path)
      }
      toast({ title: 'Files deleted', description: `Deleted ${count} item(s)` })
      setSelectedFiles(new Set())
      console.info('[storage.fileBrowser] delete-selected:success', {
        siteId,
        count,
      })
      refreshFiles()
    } catch (err: unknown) {
      console.error('[storage.fileBrowser] delete-selected:failed', {
        siteId,
        count,
        error: err,
      })
      toast({
        title: 'Delete failed',
        description:
          err instanceof Error ? err.message : 'Could not delete some files',
        variant: 'destructive',
      })
    } finally {
      setIsActionsLoading(false)
    }
  }

  const breadcrumbItems = currentPath.split('/').filter(Boolean)

  return (
    <div className='flex h-full w-full flex-col'>
      <div className='flex items-center justify-between gap-2 border-b p-3'>
        <div className='flex min-w-0 items-center gap-2'>
          <Button
            variant='outline'
            size='sm'
            onClick={navigateUp}
            disabled={currentPath === '/' || currentPath === rootPath}
          >
            <ChevronUp className='h-4 w-4' />
          </Button>

          <nav className='flex min-w-0 items-center overflow-x-auto text-sm'>
            <button
              className='text-muted-foreground hover:text-foreground'
              onClick={() => navigateToPath('/')}
            >
              Root
            </button>
            {breadcrumbItems.map((item, index) => {
              const path = '/' + breadcrumbItems.slice(0, index + 1).join('/')
              const isLast = index === breadcrumbItems.length - 1
              return (
                <React.Fragment key={path}>
                  <ChevronRight className='text-muted-foreground mx-1 h-4 w-4 shrink-0' />
                  {isLast ? (
                    <span className='truncate font-medium'>{item}</span>
                  ) : (
                    <button
                      className='text-muted-foreground hover:text-foreground'
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

        <div className='flex items-center gap-2'>
          <input
            type='file'
            ref={fileInputRef}
            className='hidden'
            multiple
            onChange={handleFileUpload}
          />
          <Button
            variant='outline'
            size='sm'
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading || !canWriteViaCloudStore}
            title={
              canWriteViaCloudStore
                ? 'Upload files'
                : 'Uploads require a linked cloud store'
            }
          >
            {isUploading ? (
              <Loader2 className='mr-1 h-4 w-4 animate-spin' />
            ) : (
              <Upload className='mr-1 h-4 w-4' />
            )}
            Upload
          </Button>
          <Button
            variant='outline'
            size='sm'
            onClick={() => setShowNewFolderDialog(true)}
            disabled={isActionsLoading || !canWriteViaCloudStore}
            title={
              canWriteViaCloudStore
                ? 'Create folder'
                : 'Folder creation requires a linked cloud store'
            }
          >
            <FolderPlus className='mr-1 h-4 w-4' />
            New Folder
          </Button>
          <Button
            variant='outline'
            size='sm'
            onClick={refreshFiles}
            disabled={isLoadingFiles}
          >
            <RefreshCw
              className={`h-4 w-4 ${isLoadingFiles ? 'animate-spin' : ''}`}
            />
          </Button>
          <Button
            variant='outline'
            size='sm'
            onClick={syncStorage}
            disabled={isActionsLoading}
          >
            <RefreshCcw
              className={`mr-1 h-4 w-4 ${isActionsLoading ? 'animate-spin' : ''}`}
            />
            Sync
          </Button>
          {selectedFiles.size > 0 && (
            <Button
              variant='destructive'
              size='sm'
              onClick={handleDeleteSelected}
              disabled={isActionsLoading}
            >
              <Trash2 className='mr-1 h-4 w-4' />
              Delete ({selectedFiles.size})
            </Button>
          )}
        </div>
      </div>

      <Dialog open={showNewFolderDialog} onOpenChange={setShowNewFolderDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
            <DialogDescription>
              Enter a name for the new folder in{' '}
              {currentPath === '/' ? 'root' : currentPath}
            </DialogDescription>
          </DialogHeader>
          <div className='py-4'>
            <Label htmlFor='folderName'>Folder Name</Label>
            <Input
              id='folderName'
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder='New folder'
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleCreateFolder()
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setShowNewFolderDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateFolder}
              disabled={
                !newFolderName.trim() ||
                isActionsLoading ||
                !canWriteViaCloudStore
              }
            >
              {isActionsLoading ? (
                <Loader2 className='mr-1 h-4 w-4 animate-spin' />
              ) : (
                <FolderPlus className='mr-1 h-4 w-4' />
              )}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className='flex-1 overflow-auto'>
        {isLoadingFiles ? (
          <div className='space-y-2 p-4'>
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className='h-12 w-full' />
            ))}
          </div>
        ) : error ? (
          <div className='text-destructive flex h-64 flex-col items-center justify-center'>
            <p className='text-lg font-medium'>Error loading files</p>
            <p className='text-sm'>{error}</p>
            <Button
              variant='outline'
              size='sm'
              className='mt-4'
              onClick={refreshFiles}
            >
              Try Again
            </Button>
          </div>
        ) : files.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className='w-12'></TableHead>
                <TableHead>Name</TableHead>
                <TableHead className='w-24 text-right'>Size</TableHead>
                <TableHead className='w-40'>Modified</TableHead>
                <TableHead className='w-12'></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {files.map((file) => {
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
                        type='checkbox'
                        checked={isSelected}
                        onChange={() => {}}
                        className='h-4 w-4'
                      />
                    </TableCell>
                    <TableCell>
                      <div className='flex items-center gap-2'>
                        <Icon
                          className={`h-5 w-5 ${file.isDir ? 'text-blue-500' : 'text-gray-500'}`}
                        />
                        <span className={file.isDir ? 'font-medium' : ''}>
                          {file.name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className='text-muted-foreground text-right'>
                      {file.isDir ? '-' : formatFileSize(file.size)}
                    </TableCell>
                    <TableCell className='text-muted-foreground'>
                      {formatDate(file.modTime)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant='ghost'
                            size='sm'
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreHorizontal className='h-4 w-4' />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align='end'>
                          {!file.isDir && (
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                downloadFileFromSite(file)
                              }}
                            >
                              <Download className='mr-2 h-4 w-4' />
                              Download
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className='text-destructive'
                            onClick={(e) => {
                              e.stopPropagation()
                              deleteFile(file.path)
                            }}
                          >
                            <Trash2 className='mr-2 h-4 w-4' />
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
          <div className='text-muted-foreground flex h-64 flex-col items-center justify-center'>
            <Folder className='mb-4 h-12 w-12' />
            <p className='text-lg font-medium'>This folder is empty</p>
            <p className='text-sm'>No files found at this path</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default FileBrowser
