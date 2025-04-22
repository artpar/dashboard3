// src/components/entity/columns/viewers/ForeignKeyColumnViewer.tsx
import React, { useEffect, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { AlertCircle, ExternalLink, FileIcon, ImageIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { ColumnViewerProps } from '../types'


export const DAPTIN_ENDPOINT = import.meta.env.VITE_DAPTIN_URL

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
  const [referenceData, setReferenceData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

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

      // try {
      //   // Attempt to fetch the referenced object using its ID
      //   const response = await daptinClient.jsonApi.find(namespace, referenceId)
      //   if (response.errors && response.errors.length) {
      //     throw new Error(
      //       response.errors[0].detail || 'Failed to load reference data'
      //     )
      //   }
      //
      //   setReferenceData(response.data)
      // } catch (err) {
      //   console.error('Error fetching foreign key data:', err)
      //   setError(
      //     err instanceof Error ? err.message : 'Failed to load reference data'
      //   )
      // } finally {
      //   setIsLoading(false)
      // }
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

    // Determine if it's an image based on column type
    const isImage =
      columnType.includes('png') ||
      columnType.includes('jpg') ||
      columnType.includes('jpeg') ||
      columnType.includes('webp') ||
      columnType.includes('gif')

    // If there are no files, return a placeholder
    if (fileDataArray.length === 0) {
      return <span className={className}>No {isImage ? 'images' : 'files'}</span>
    }

    // If there's only one file, display it as before but with improved styling
    if (fileDataArray.length === 1) {
      const fileData = fileDataArray[0]

      // Generate asset URL
      const assetUrl =
        DAPTIN_ENDPOINT +
        '/asset/' +
        entity['__type'] +
        '/' +
        entity.reference_id +
        '/' +
        column.ColumnName +
        '.png'

      // Get file name or use placeholder
      const fileName =
        typeof fileData === 'object' && fileData !== null && 'name' in fileData
          ? fileData.name
          : 'File'

      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge
                variant='outline'
                className={cn(
                  'flex h-auto items-center bg-gray-50 hover:bg-gray-100',
                  className
                )}
                onClick={() => {
                  // Handle file preview or download
                  if (
                    typeof fileData === 'object' &&
                    fileData !== null &&
                    'url' in fileData
                  ) {
                    window.open(fileData.url, '_blank')
                  }
                }}
              >
                {isImage ? (
                  <div className='flex flex-col items-center p-1'>
                    <img
                      className='h-24 w-24 object-contain'
                      alt={column.ColumnName + ' ' + (column.ColumnDescription || '')}
                      src={assetUrl}
                    />
                    <span className='mt-1 text-xs truncate max-w-24'>
                      {fileName}
                    </span>
                  </div>
                ) : (
                  <div className='flex items-center gap-2 p-2'>
                    <FileIcon className='h-4 w-4' />
                    <span className='truncate max-w-40'>
                      {fileName}
                    </span>
                  </div>
                )}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <div className='text-xs'>
                <p className='font-bold'>{isImage ? 'Image' : 'File'}</p>
                <p>{fileName}</p>
                {typeof fileData === 'object' &&
                  fileData !== null &&
                  'size' in fileData && (
                    <p>Size: {formatFileSize(fileData.size)}</p>
                  )}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )
    }

    // If there are multiple files, display them in a grid
    return (
      <div className={cn('flex flex-wrap gap-2 w-full', className)}>
        {fileDataArray.filter((val, index) => index < 3).map((fileData, index) => {
          // Generate a unique asset URL for each file if possible
          const fileAssetUrl = entity && column.ColumnName &&
            (typeof fileData === 'object' && fileData !== null && 'reference_id' in fileData
              ? `${DAPTIN_ENDPOINT}/asset/${entity.__type}/${entity.reference_id}/${column.ColumnName}.${isImage ? 'png' : 'file'}?index=${index}`
              : `${DAPTIN_ENDPOINT}/asset/${entity.__type}/${entity.reference_id}/${column.ColumnName}.png?index=${index}`)

          // Get file name or use placeholder
          const fileName =
            typeof fileData === 'object' && fileData !== null && 'name' in fileData
              ? fileData.name
              : `File ${index + 1}`

          // Get file size if available
          const fileSize =
            typeof fileData === 'object' && fileData !== null && 'size' in fileData
              ? formatFileSize(fileData.size as number)
              : ''

          return (
            <Badge
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
              {isImage ? (
                <div className='flex flex-col items-center p-1'>
                  <img
                    src={fileAssetUrl}
                    alt={fileName}
                    className='h-16 w-16 object-contain'
                  />
                  <span className='mt-1 text-xs truncate max-w-16'>
                          {fileName.length > 10 ? fileName.substring(0, 8) + '...' : fileName}
                        </span>
                </div>
              ) : (
                <div className='flex items-center gap-1 p-1'>
                  <FileIcon className='h-3 w-3' />
                  <span className='truncate max-w-24 text-xs'>
                          {fileName.length > 15 ? fileName.substring(0, 12) + '...' : fileName}
                        </span>
                </div>
              )}
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
      // Try to find a display name from the reference data
      // const displayName = Object.keys(referenceData)
      //   .map((columnName) => {
      //     if (["created_at", "updated_at", "type", "__type", "user_account_id"].includes(columnName)) {
      //       return null;
      //     }
      //     if (columnName.endsWith('_id') && columnName !== "id") {
      //       return null;
      //     }
      //     if (
      //       typeof referenceData[columnName] === 'string' &&
      //       referenceData[columnName].length < 50
      //     ) {
      //       return columnName + '\n' + referenceData[columnName]
      //     } else {
      //       return null
      //     }
      //   })
      //   .filter((e) => e !== null)
      //   .join('\n')

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
