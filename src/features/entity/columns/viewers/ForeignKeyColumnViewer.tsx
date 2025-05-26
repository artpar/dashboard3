// src/components/entity/columns/viewers/ForeignKeyColumnViewer.tsx
import React, { useEffect, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { AlertCircle, Download, ExternalLink, X, ChevronLeft, ChevronRight, PlayCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useToast } from '@/components/ui/use-toast'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { ColumnViewerProps } from '../types'


export const DAPTIN_ENDPOINT = import.meta.env.VITE_DAPTIN_URL

// Helper function to download a file from a URL
const downloadFile = async (
  url: string,
  fileName: string,
  onError: (message: string) => void
) => {
  try {
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(
        `Failed to download file: ${response.status} ${response.statusText}`
      )
    }

    const blob = await response.blob()
    const downloadUrl = window.URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    // Clean up the URL object
    setTimeout(() => window.URL.revokeObjectURL(downloadUrl), 100)
  } catch (error) {
    console.error('Error downloading file:', error)
    onError(error instanceof Error ? error.message : 'Failed to download file')
  }
}

/**
 * Component for displaying foreign key values with reference data
 */
export const ForeignKeyColumnViewer: React.FC<ColumnViewerProps> = ({
  value,
  column,
  className,
  entity,
}) => {
  // console.log('ForeignKeyColumnViewer', value, column)
  const navigate = useNavigate()
  const { toast } = useToast()
  const [referenceData, setReferenceData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [isDownloading, setIsDownloading] = useState<boolean>(false)

  // Extract necessary information from the column
  const foreignKeyData = column.ForeignKeyData
  const namespace = foreignKeyData?.Namespace
  const dataSource = foreignKeyData?.DataSource
  const keyName = foreignKeyData?.KeyName
  const columnType = column.ColumnType || ''

  // If the value is null or undefined, show a placeholder
  if (value === null || value === undefined) {
    return <span className={className}>-</span>
  }

  // Determine the type of foreign key value
  const isFileReference =
    dataSource === 'cloud_store' || columnType.startsWith('file.')
  const isUuidReference =
    typeof value === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      value
    )
  const isArrayReference = Array.isArray(value)

  // Load reference data if available
  useEffect(() => {
    // Don't fetch for file references
    if (isFileReference) return

    // Don't fetch if we don't have necessary data
    if (!namespace || !value) return

    // Skip if not a self reference
    if (dataSource !== 'self') return

    if (typeof value === 'object') {
      setReferenceData(value)
      return
    }

    // Get the reference ID based on the type of value
    const referenceId = isUuidReference
      ? value
      : typeof value === 'object' && value !== null && 'reference_id' in value
        ? value.reference_id
        : null

    if (!referenceId) return

    const fetchReferenceData = async () => {
      // setIsLoading(true)
      // setError(null)
      setReferenceData({
        __type: namespace,
        reference_id: referenceId,
      })

    }

    fetchReferenceData()
  }, [namespace, value, dataSource, isFileReference, isUuidReference])

  // Display skeleton loader while fetching
  if (isLoading) {
    return <Skeleton className={cn('h-4 w-32', className)} />
  }

  // Display error if any
  if (error) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={cn('flex items-center text-red-500', className)}>
              <AlertCircle className='mr-1 h-3 w-3' />
              <span>Error loading reference</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{error}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  // Handle file references (cloud_store or file.* column types)
  if (isFileReference) {
    // Normalize value to always be an array
    const fileDataArray = isArrayReference ? value : [value]

    // Helper function to check if a file is an image based on MIME type
    const isImageFile = (fileData: any) => {
      if (typeof fileData === 'object' && fileData !== null && 'type' in fileData) {
        const mimeType = fileData.type.toLowerCase()
        return mimeType.startsWith('image/')
      }
      return false
    }

    // Helper function to check if a file is a video based on MIME type
    const isVideoFile = (fileData: any) => {
      if (typeof fileData === 'object' && fileData !== null && 'type' in fileData) {
        const mimeType = fileData.type.toLowerCase()
        return mimeType.startsWith('video/')
      }
      return false
    }

    // Check if all files are images or videos
    const hasImages = fileDataArray.some(isImageFile)
    const hasVideos = fileDataArray.some(isVideoFile)

    // If there are no files, return a placeholder
    if (fileDataArray.length === 0) {
      return (
        <span className={className}>No files</span>
      )
    }
    const tokenString = '?token=' + localStorage.getItem('token')


    // If there are media files (images or videos), handle with preview dialog
    if (hasImages || hasVideos) {
      // For images/videos, implement stacked card viewer with preview dialog
      const [showPreview, setShowPreview] = useState(false)
      const [currentImageIndex, setCurrentImageIndex] = useState(0)

      // Generate asset URLs for all images/videos
      const imageAssetUrls = fileDataArray.map((fileData, index) => {
        return entity && column.ColumnName
          ? `${DAPTIN_ENDPOINT}/asset/${entity.__type}/${entity.reference_id}/${column.ColumnName}${tokenString}&index=${index}`
          : ''
      })

      // Get file names for all media files
      const fileNames = fileDataArray.map((fileData, index) => {
        return typeof fileData === 'object' && fileData !== null && 'name' in fileData
          ? fileData.name
          : isVideoFile(fileData) ? `Video ${index + 1}` : `Image ${index + 1}`
      })

      // Navigate to previous media item
      const goToPrevious = (e: React.MouseEvent) => {
        e.stopPropagation()
        setCurrentImageIndex((prev) => (prev === 0 ? imageAssetUrls.length - 1 : prev - 1))
      }

      // Navigate to next media item
      const goToNext = (e: React.MouseEvent) => {
        e.stopPropagation()
        setCurrentImageIndex((prev) => (prev === imageAssetUrls.length - 1 ? 0 : prev + 1))
      }

      return (
        <>
          <div
            className={cn('relative flex h-28 w-auto cursor-pointer', className)}
            onClick={() => {
              setCurrentImageIndex(0)
              setShowPreview(true)
            }}
          >
            {/* Display stacked cards (limited to max 3 visible) */}
            {fileDataArray.slice(0, Math.min(3, fileDataArray.length)).map((fileData, index) => {
              const fileAssetUrl = imageAssetUrls[index]
              const fileName = fileNames[index]
              const offset = index * 4 // Offset for stacked effect

              return (
                <div
                  key={fileAssetUrl}
                  className={cn(
                    'absolute rounded-md border border-gray-200 bg-white shadow-sm transition-all',
                    {
                      'z-30 rotate-0': index === 0,
                      'z-20 -rotate-3': index === 1,
                      'z-10 -rotate-6': index === 2
                    }
                  )}
                  style={{
                    left: `${offset}px`,
                    top: `${offset}px`,
                  }}
                >
                  <div className='flex flex-col items-center p-1'>
                    {isVideoFile(fileData) ? (
                      <div className='flex h-16 w-16 items-center justify-center rounded bg-gray-100'>
                        <PlayCircle className='h-8 w-8 text-gray-600' />
                      </div>
                    ) : (
                      <img
                        src={fileAssetUrl}
                        alt={fileName}
                        className='h-16 w-16 object-contain'
                      />
                    )}
                    <span className='mt-1 max-w-16 truncate text-xs'>
                      {fileName.length > 10 ? fileName.substring(0, 8) + '...' : fileName}
                    </span>
                  </div>
                </div>
              )
            })}

            {/* Show count badge if more than 3 images/videos */}
            {fileDataArray.length > 3 && (
              <div className='absolute bottom-1 right-1 z-40 rounded-full bg-blue-500 px-1.5 py-0.5 text-xs font-medium text-white'>
                +{fileDataArray.length - 3}
              </div>
            )}
          </div>

          {/* Image/Video Preview Dialog */}
          <Dialog open={showPreview} onOpenChange={setShowPreview}>
            <DialogContent className='max-w-4xl p-0 sm:rounded-lg'>
              <div className='relative flex h-full max-h-[80vh] w-full flex-col items-center justify-center bg-black/90 p-4'>
                {/* Close button */}
                <button
                  onClick={() => setShowPreview(false)}
                  className='absolute right-2 top-2 z-50 rounded-full bg-black/50 p-1 text-white hover:bg-black/70'
                >
                  <X className='h-5 w-5' />
                </button>

                {/* Navigation buttons */}
                {imageAssetUrls.length > 1 && (
                  <>
                    <button
                      onClick={goToPrevious}
                      className='absolute left-2 top-1/2 z-50 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white hover:bg-black/70'
                    >
                      <ChevronLeft className='h-6 w-6' />
                    </button>
                    <button
                      onClick={goToNext}
                      className='absolute right-2 top-1/2 z-50 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white hover:bg-black/70'
                    >
                      <ChevronRight className='h-6 w-6' />
                    </button>
                  </>
                )}

                {/* Current image or video */}
                <div className='flex h-full w-full items-center justify-center'>
                  {isVideoFile(fileDataArray[currentImageIndex]) ? (
                    <video
                      src={imageAssetUrls[currentImageIndex]}
                      controls
                      autoPlay
                      className='max-h-full max-w-full object-contain'
                    >
                      Your browser does not support the video tag.
                    </video>
                  ) : (
                    <img
                      src={imageAssetUrls[currentImageIndex]}
                      alt={fileNames[currentImageIndex]}
                      className='max-h-full max-w-full object-contain'
                    />
                  )}
                </div>

                {/* Media info footer */}
                <div className='mt-2 w-full text-center text-sm text-white'>
                  <p>{fileNames[currentImageIndex]}</p>
                  <p className='text-xs text-gray-300'>
                    {currentImageIndex + 1} of {imageAssetUrls.length}
                  </p>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </>
      )
    }

      let assetUrl =
        DAPTIN_ENDPOINT +
        '/asset/' +
        entity['__type'] +
        '/' +
        entity.reference_id +
        '/' +
        column.ColumnName + tokenString


    // For non-image files, display them in a grid as before
    return (
      <div className={cn('flex w-full flex-wrap gap-2', className)}>
        {fileDataArray
          .filter((val, index) => index < 3)
          .map((fileData, index) => {
            // Generate a unique asset URL for each file if possible
            const fileAssetUrl =assetUrl;
            // Get file name or use placeholder
            const fileName =
              typeof fileData === 'object' &&
              fileData !== null &&
              'name' in fileData
                ? fileData.name
                : `File ${index + 1}`

            return (
              <Badge
                key={fileAssetUrl}
                variant='outline'
                className='flex h-auto items-center bg-gray-50 hover:bg-gray-100'
                onClick={() => {
                  // Handle file preview or download
                  if (
                    typeof fileData === 'object' &&
                    fileData !== null &&
                    'url' in fileData
                  ) {
                    window.open(fileData.url, '_blank')
                  } else {
                    window.open(fileAssetUrl, '_blank')
                  }
                }}
              >
                <div
                  className='flex cursor-pointer items-center gap-1 p-1'
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    if (isDownloading) return

                    setIsDownloading(true)
                    downloadFile(fileAssetUrl, fileName, (errorMessage) => {
                      toast({
                        variant: 'destructive',
                        title: 'Download failed',
                        description: errorMessage,
                      })
                      setIsDownloading(false)
                    }).finally(() => {
                      setIsDownloading(false)
                    })
                  }}
                >
                  {isDownloading ? (
                    <span className='mr-1 h-3 w-3 animate-spin rounded-full border-2 border-gray-500 border-t-transparent'></span>
                  ) : (
                    <Download className='h-3 w-3' />
                  )}
                  <span className='max-w-24 truncate text-xs'>
                    {fileName.length > 15
                      ? fileName.substring(0, 12) + '...'
                      : fileName}
                  </span>
                </div>
              </Badge>
            )
          })}
      </div>
    )
  }

  // Handle UUID references
  if (isUuidReference) {
    // If we have reference data, use it
    if (referenceData) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge
                variant='outline'
                className={cn(
                  'flex cursor-pointer items-center bg-blue-50 text-blue-800 hover:bg-blue-100',
                  className
                )}
                onClick={() => {
                  navigate({
                    to: `/${namespace}/${value}`,
                    params: { entityId: value },
                  })
                }}
              >
                <pre className='mr-1 max-w-[300px]'>{`${namespace}\n${value}`}</pre>
                <ExternalLink className='h-3 w-3' />
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <div className='text-xs'>
                <p className='font-bold'>{namespace}</p>
                <p>ID: {value}</p>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )
    }

    // If we don't have reference data yet, show a simplified badge
    return (
      <Badge
        variant='outline'
        className={cn(
          'flex cursor-pointer items-center bg-blue-50 text-blue-800 hover:bg-blue-100',
          className
        )}
        onClick={() => {
          navigate({
            to: `/${namespace}/${value}`,
            params: { entityId: value },
          })
        }}
      >
        <span className='max-w-[100px] truncate'>{value}</span>
        <ExternalLink className='ml-1 h-3 w-3' />
      </Badge>
    )
  }

  // Handle object references with reference_id
  if (typeof value === 'object' && 'reference_id' in value) {
    if (referenceData) {
      // Try to find a display name from the reference data
      // const displayName =
      //   referenceData.name ||
      //   referenceData.title ||
      //   referenceData.label ||
      //   (referenceData.attributes &&
      //     (referenceData.attributes.name ||
      //       referenceData.attributes.title ||
      //       referenceData.attributes.label)) ||
      //   `${namespace}:${value.reference_id}`

      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge
                variant='outline'
                className={cn(
                  'flex cursor-pointer items-center bg-blue-50 text-blue-800 hover:bg-blue-100',
                  className
                )}
                onClick={() => {
                  navigate({
                    to: `/${namespace}/${value.reference_id}`,
                    params: { entityId: value.reference_id },
                  })
                }}
              >
                <pre className='mr-1 max-w-[300px]'>{`${namespace}\n${value.reference_id}`}</pre>

                <ExternalLink className='h-3 w-3' />
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <div className='text-xs'>
                <p className='font-bold'>{namespace}</p>
                <p>ID: {value.reference_id}</p>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )
    }

    // If we don't have reference data yet, show a simplified badge
    return (
      <Badge
        variant='outline'
        className={cn(
          'flex cursor-pointer items-center bg-blue-50 text-blue-800 hover:bg-blue-100',
          className
        )}
        onClick={() => {
          navigate({
            to: `/${namespace}/${value.reference_id}`,
            params: { entityId: value.reference_id },
          })
        }}
      >
        <span className='max-w-[100px] truncate'>{value.reference_id}</span>
        <ExternalLink className='ml-1 h-3 w-3' />
      </Badge>
    )
  }

  // Fallback: just show the raw value with the namespace
  return (
    <Badge
      variant='outline'
      className={cn('bg-gray-100 text-gray-800', className)}
    >
      {namespace
        ? `${namespace}:${JSON.stringify(value)}`
        : JSON.stringify(value)}
    </Badge>
  )
}

// Helper function to format file size
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export default ForeignKeyColumnViewer
