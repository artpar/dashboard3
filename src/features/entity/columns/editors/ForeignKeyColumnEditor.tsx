// src/components/entity/columns/editors/ForeignKeyColumnEditor.tsx
import React, { useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { daptinClient } from '@/daptin'
import {
  Check,
  ChevronsUpDown,
  FileIcon,
  Loader2,
  Upload,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { ColumnEditorProps } from '../types'


export const DAPTIN_ENDPOINT = import.meta.env.VITE_DAPTIN_URL

/**
 * Helper function to format file size
 */
const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) {
    return bytes + ' B'
  } else if (bytes < 1024 * 1024) {
    return (bytes / 1024).toFixed(1) + ' KB'
  } else if (bytes < 1024 * 1024 * 1024) {
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  } else {
    return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB'
  }
}

// Extend ColumnEditorProps to include entity
interface ForeignKeyColumnEditorProps extends ColumnEditorProps {
  entity?: any
}

/**
 * Component for editing foreign key values
 */
export const ForeignKeyColumnEditor: React.FC<ForeignKeyColumnEditorProps> = ({
                                                                                value,
                                                                                column,
                                                                                onChange,
                                                                                onBlur,
                                                                                className,
                                                                                error,
                                                                                entity,
                                                                                disabled,
                                                                                placeholder,
                                                                              }) => {
  const [open, setOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [uploadProgress, setUploadProgress] = useState<number>(0)
  const [isUploading, setIsUploading] = useState<boolean>(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Get the referenced entity from the column's ForeignKeyData
  const referencedEntity = column.ForeignKeyData?.Namespace || ''
  const dataSource = column.ForeignKeyData?.DataSource || ''
  const columnType = column.ColumnType || ''

  // Determine if this is a file reference column
  const isFileReference =
    dataSource === 'cloud_store' || columnType.startsWith('file.')

  // Determine if it's an image based on column type
  const isImage =
    columnType.includes('png') ||
    columnType.includes('jpg') ||
    columnType.includes('jpeg') ||
    columnType.includes('webp') ||
    columnType.includes('gif')

  // File references should always be arrays
  // If we receive a non-array value, we'll normalize it
  const normalizedValue = Array.isArray(value) ? value : (value ? [value] : [])

  // Extract file data for display (first item in the array)
  const fileData = normalizedValue.length > 0 ? normalizedValue[0] : null

  // Get asset URL for displaying current image
  const assetUrl =
    entity && column.ColumnName
      ? `${DAPTIN_ENDPOINT}/asset/${entity.__type}/${entity.reference_id}/${column.ColumnName}.png`
      : ''

  // Handle file upload
  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    const file = files[0]
    setIsUploading(true)
    setUploadError(null)
    setUploadProgress(0)

    try {
      // Create file metadata object
      const fileObject = {
        __type: columnType,
        name: file.name,
        type: file.type,
        size: file.size,
        reference_id: file.name,
      }

      // Convert file to base64 for the 'contents' field
      const reader = new FileReader()
      reader.onload = async (e) => {
        try {
          const base64Content =
            (e.target?.result as string)?.split(',')[1] || ''

          // Add contents to file object
          const fileWithContents = {
            ...fileObject,
            contents: base64Content,
          }

          // Always use array for file/image type columns
          const newValue = [fileWithContents]

          // Update the value
          onChange(newValue)
          setUploadProgress(100)

          // Reset the file input
          if (fileInputRef.current) {
            fileInputRef.current.value = ''
          }

          // Close the popover after successful upload
          setTimeout(() => {
            setIsUploading(false)
            setOpen(false)
            if (onBlur) onBlur()
          }, 500)
        } catch (error) {
          console.error('Error processing file:', error)
          setUploadError('Failed to process file')
          setIsUploading(false)
        }
      }

      reader.onerror = () => {
        setUploadError('Failed to read file')
        setIsUploading(false)
      }

      // Simulate progress
      const interval = setInterval(() => {
        setUploadProgress((prev) => {
          const newProgress = prev + Math.random() * 10
          return newProgress < 90 ? newProgress : 90
        })
      }, 200)

      // Read file as data URL
      reader.readAsDataURL(file)

      // Clean up interval
      return () => clearInterval(interval)
    } catch (error) {
      console.error('Error uploading file:', error)
      setUploadError('Failed to upload file')
      setIsUploading(false)
    }
  }

  // Handle file removal
  const handleRemoveFile = () => {
    // Always use array for file/image type columns
    onChange([])
    if (onBlur) onBlur()
  }

  // Query to fetch options from the referenced entity (for non-file references)
  const { data: options, isLoading } = useQuery({
    queryKey: ['foreignKeyOptions', referencedEntity, searchTerm],
    queryFn: async () => {
      if (!referencedEntity || isFileReference) return []

      try {
        // Build query parameters
        const queryParams: Record<string, any> = {
          'page[size]': '50',
          sort: '-created_at',
        }

        // Add search term if provided
        if (searchTerm) {
          queryParams.query = JSON.stringify([
            {
              column: 'reference_id',
              operator: 'like',
              value: `%${searchTerm}%`,
            },
          ])
        }

        // Fetch data from the referenced entity
        const response = await daptinClient.jsonApi.findAll(
          referencedEntity,
          queryParams
        )

        // Map the response to options
        if (response.data && Array.isArray(response.data)) {
          return response.data.map((item) => ({
            id: item.id,
            reference_id: item.reference_id,
            label: item.name || item.title || item.label || item.reference_id,
          }))
        }

        return []
      } catch (error) {
        console.error(`Error fetching ${referencedEntity} options:`, error)
        return []
      }
    },
    enabled: !!referencedEntity && !isFileReference,
  })

  // Find the selected option based on the current value (for non-file references)
  const selectedOption =
    options?.find((option) => option.reference_id === value) || null

  // Render file reference editor
  if (isFileReference) {
    // Display current file if exists
    if (fileData) {
      const fileName =
        typeof fileData === 'object' && fileData !== null && 'name' in fileData
          ? fileData.name
          : 'File'

      const fileSize =
        typeof fileData === 'object' && fileData !== null && 'size' in fileData
          ? formatFileSize(fileData.size as number)
          : ''

      return (
        <div className={cn('space-y-2', className)}>
          <div className='flex items-center gap-2 w-full'>
            <Badge
              variant='outline'
              className={cn(
                'flex h-auto items-center bg-gray-50 hover:bg-gray-100 w-full',
                error && 'border-red-500'
              )}
            >
              {isImage ? (
                <div className='flex flex-col items-center'>
                  <img
                    src={assetUrl}
                    alt={fileName}
                    className='h-38 w-40 object-contain'
                  />
                  <span className='mt-1 text-xs'>
                    {fileName} {fileSize && `(${fileSize})`}
                  </span>
                </div>
              ) : (
                <div className='flex items-center gap-2'>
                  <FileIcon className='h-4 w-4' />
                  <span>
                    {fileName} {fileSize && `(${fileSize})`}
                  </span>
                </div>
              )}
            </Badge>

            {!disabled && (
              <Button
                variant='ghost'
                size='sm'
                onClick={handleRemoveFile}
                className='h-8 w-8 p-0'
              >
                <X className='h-4 w-4' />
              </Button>
            )}
          </div>

          {!disabled && (
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button variant='outline' size='sm' className='text-xs'>
                  Change {isImage ? 'Image' : 'File'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className='w-80'>
                <div className='space-y-4'>
                  <h4 className='font-medium'>
                    Upload {isImage ? 'Image' : 'File'}
                  </h4>

                  <Input
                    ref={fileInputRef}
                    type='file'
                    accept={isImage ? 'image/*' : undefined}
                    onChange={handleFileUpload}
                    disabled={isUploading}
                  />

                  {isUploading && (
                    <div className='space-y-2'>
                      <div className='bg-secondary h-2 w-full overflow-hidden rounded-full'>
                        <div
                          className='bg-primary h-full transition-all duration-300 ease-in-out'
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                      <p className='text-muted-foreground text-center text-xs'>
                        {uploadProgress < 100
                          ? 'Uploading...'
                          : 'Upload complete!'}
                      </p>
                    </div>
                  )}

                  {uploadError && (
                    <p className='text-destructive text-xs'>{uploadError}</p>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>
      )
    }

    // Display upload button if no file exists
    return (
      <div className={cn('space-y-2', className)}>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant='outline'
              className={cn('w-full justify-center', error && 'border-red-500')}
              disabled={disabled}
            >
              <Upload className='mr-2 h-4 w-4' />
              Upload {isImage ? 'Image' : 'File'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className='w-80'>
            <div className='space-y-4'>
              <h4 className='font-medium'>
                Upload {isImage ? 'Image' : 'File'}
              </h4>

              <Input
                ref={fileInputRef}
                type='file'
                accept={isImage ? 'image/*' : undefined}
                onChange={handleFileUpload}
                disabled={isUploading}
              />

              {isUploading && (
                <div className='space-y-2'>
                  <div className='bg-secondary h-2 w-full overflow-hidden rounded-full'>
                    <div
                      className='bg-primary h-full transition-all duration-300 ease-in-out'
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className='text-muted-foreground text-center text-xs'>
                    {uploadProgress < 100 ? 'Uploading...' : 'Upload complete!'}
                  </p>
                </div>
              )}

              {uploadError && (
                <p className='text-destructive text-xs'>{uploadError}</p>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>
    )
  }

  // Render standard foreign key selector (for non-file references)
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant='outline'
          role='combobox'
          aria-expanded={open}
          className={cn(
            'w-full justify-between',
            !value && 'text-muted-foreground',
            error && 'border-red-500',
            className
          )}
          disabled={disabled || !referencedEntity}
        >
          {value && selectedOption
            ? selectedOption.label
            : placeholder || `Select ${referencedEntity}`}
          <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-full p-0'>
        <Command>
          <CommandInput
            placeholder={`Search ${referencedEntity}...`}
            onValueChange={setSearchTerm}
          />
          <CommandList>
            {isLoading ? (
              <div className='flex items-center justify-center p-4'>
                <Loader2 className='h-4 w-4 animate-spin' />
                <span className='ml-2'>Loading...</span>
              </div>
            ) : (
              <>
                <CommandEmpty>No {referencedEntity} found.</CommandEmpty>
                <CommandGroup>
                  {options?.map((option) => (
                    <CommandItem
                      key={option.reference_id}
                      value={option.reference_id}
                      onSelect={(currentValue) => {
                        onChange(currentValue)
                        setOpen(false)
                        if (onBlur) onBlur()
                      }}
                    >
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4',
                          value === option.reference_id
                            ? 'opacity-100'
                            : 'opacity-0'
                        )}
                      />
                      {option.label}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

export default ForeignKeyColumnEditor
