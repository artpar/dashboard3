import React from 'react'
import { FileIcon, Trash2, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FileDisplayProps } from '../types'
import { formatFileSize } from '../utils/formatters'
export const DAPTIN_ENDPOINT = import.meta.env.VITE_DAPTIN_URL

export const FileDisplay: React.FC<FileDisplayProps> = ({
  files,
  onRemoveFile,
  onRemoveAllFiles,
  isImage,
  disabled,
  error,
  className,
  entity,
  column,
  assetUrl,
}) => {
  return (
    <div className={cn('space-y-4', className)}>
      <div className='flex flex-wrap gap-2'>
        {files.map((fileData, index) => {
          const fileName =
            typeof fileData === 'object' &&
            fileData !== null &&
            'name' in fileData
              ? fileData.name
              : 'File'

          const fileSize =
            typeof fileData === 'object' &&
            fileData !== null &&
            'size' in fileData
              ? formatFileSize(fileData.size as number)
              : ''

          // Generate a unique asset URL for each file if possible
          const fileAssetUrl =
            entity && column.ColumnName && fileData.reference_id
              ? `${DAPTIN_ENDPOINT}/asset/${entity.__type}/${entity.reference_id}/${column.ColumnName}/${fileData.reference_id}.${isImage ? 'png' : 'file'}`
              : assetUrl

          return (
            <div key={index} className='group relative'>
              <Badge
                variant='outline'
                className={cn(
                  'flex h-auto items-center bg-gray-50 hover:bg-gray-100',
                  error && 'border-red-500'
                )}
              >
                {isImage ? (
                  <div className='flex flex-col items-center p-1'>
                    {fileData.contents ? (
                      <img
                        src={`data:image/${fileData.type.split('/')[1]};base64,${fileData.contents}`}
                        alt={fileName}
                        className='h-24 w-24 object-contain'
                      />
                    ) : (
                      <img
                        src={fileAssetUrl}
                        alt={fileName}
                        className='h-24 w-24 object-contain'
                      />
                    )}
                    <span className='mt-1 max-w-24 truncate text-xs'>
                      {fileName} {fileSize && `(${fileSize})`}
                    </span>
                  </div>
                ) : (
                  <div className='flex items-center gap-2 p-2'>
                    <FileIcon className='h-4 w-4' />
                    <span className='max-w-40 truncate'>
                      {fileName} {fileSize && `(${fileSize})`}
                    </span>
                  </div>
                )}
              </Badge>

              {!disabled && (
                <Button
                  variant='destructive'
                  size='icon'
                  onClick={() => onRemoveFile(index)}
                  className='absolute -top-2 -right-2 h-5 w-5 rounded-full opacity-0 transition-opacity group-hover:opacity-100'
                >
                  <X className='h-3 w-3' />
                </Button>
              )}
            </div>
          )
        })}
      </div>

      {!disabled && files.length > 0 && (
        <div className='flex items-center gap-2'>
          <Button
            variant='outline'
            size='sm'
            onClick={onRemoveAllFiles}
            className='text-destructive hover:bg-destructive hover:text-destructive-foreground'
          >
            <Trash2 className='mr-2 h-4 w-4' />
            Clear All
          </Button>
        </div>
      )}
    </div>
  )
}
