// src/components/entity/columns/editors/ForeignKeyColumnEditor.tsx
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { daptinClient } from '@/daptin'
import { FileIcon, ImageIcon, Trash2, Upload, X } from 'lucide-react'
import Select from 'react-select'
import { cn } from '@/lib/utils'
import { useWorldEntities } from '@/hooks/use-world-entities'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
  const dropZoneRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState<boolean>(false)
  const [labelColumn, setLabelColumn] = useState<string | null>(null)
  const { entities } = useWorldEntities()

  // Get the referenced entity from the column's ForeignKeyData
  const referencedEntity = column.ForeignKeyData?.Namespace || ''
  const dataSource = column.ForeignKeyData?.DataSource || ''
  const columnType = column.ColumnType || ''

  // Determine if this is a file reference column
  const isFileReference =
    dataSource === 'cloud_store' || columnType.startsWith('file.')

  // Find label column for the referenced entity
  useEffect(() => {
    if (!referencedEntity) return

    // Find the entity in world entities
    const entityMetadata = entities.find(
      (e) => e.table_name === referencedEntity
    )
    if (!entityMetadata || !entityMetadata.world_schema_json) return

    try {
      // Parse the schema to find a label column
      const schema = JSON.parse(entityMetadata.world_schema_json)
      if (!schema || !schema.Columns) return

      // First look for a column with ColumnType 'label'
      let labelCol = schema.Columns.find((col) => col.ColumnType === 'label')
      // Found a label column with ColumnType 'label'

      // If no label column found, look for name, title, or other common label fields
      if (!labelCol) {
        const commonLabelFields = ['name', 'title', 'label', 'display_name']
        for (const fieldName of commonLabelFields) {
          labelCol = schema.Columns.find(
            (col) => col.ColumnName.toLowerCase() === fieldName.toLowerCase()
          )
          if (labelCol) break
        }
      }

      // Set the label column name if found
      setLabelColumn(labelCol ? labelCol.ColumnName : null)
    } catch (err) {
      console.error('Error parsing schema for label column:', err)
    }
  }, [referencedEntity, entities])

  // Determine if it's an image based on column type
  const isImage =
    columnType.includes('png') ||
    columnType.includes('jpg') ||
    columnType.includes('jpeg') ||
    columnType.includes('webp') ||
    columnType.includes('gif')

  // File references should always be arrays
  // If we receive a non-array value, we'll normalize it
  const normalizedValue = Array.isArray(value) ? value : value ? [value] : []

  // Get asset URL for displaying current image
  const assetUrl =
    entity && column.ColumnName
      ? `${DAPTIN_ENDPOINT}/asset/${entity.__type}/${entity.reference_id}/${column.ColumnName}.png`
      : ''

  // Process a single file and return a promise with the file object
  const processFile = (file: File): Promise<any> => {
    return new Promise((resolve, reject) => {
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
      reader.onload = (e) => {
        try {
          const base64Content =
            (e.target?.result as string)?.split(',')[1] || ''

          // Add contents to file object
          const fileWithContents = {
            ...fileObject,
            contents: base64Content,
          }

          resolve(fileWithContents)
        } catch (error) {
          console.error('Error processing file:', error)
          reject(error)
        }
      }

      reader.onerror = () => {
        reject(new Error('Failed to read file'))
      }

      // Read file as data URL
      reader.readAsDataURL(file)
    })
  }

  // Handle file upload from input element
  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    setIsUploading(true)
    setUploadError(null)
    setUploadProgress(0)

    try {
      // Simulate progress
      const interval = setInterval(() => {
        setUploadProgress((prev) => {
          const newProgress = prev + Math.random() * 10
          return newProgress < 90 ? newProgress : 90
        })
      }, 200)

      // Process all selected files
      const filePromises = Array.from(files).map(processFile)
      const processedFiles = await Promise.all(filePromises)

      // Combine with existing files
      const newValue = [...normalizedValue, ...processedFiles]

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

      // Clean up interval
      clearInterval(interval)
    } catch (error) {
      console.error('Error uploading files:', error)
      setUploadError('Failed to upload files')
      setIsUploading(false)
    }
  }

  // Handle files from drag and drop
  const handleDroppedFiles = async (files: FileList) => {
    if (!files || files.length === 0) return

    setIsUploading(true)
    setUploadError(null)
    setUploadProgress(0)

    try {
      // Simulate progress
      const interval = setInterval(() => {
        setUploadProgress((prev) => {
          const newProgress = prev + Math.random() * 10
          return newProgress < 90 ? newProgress : 90
        })
      }, 200)

      // Process all dropped files
      const filePromises = Array.from(files).map(processFile)
      const processedFiles = await Promise.all(filePromises)

      // Combine with existing files
      const newValue = [...normalizedValue, ...processedFiles]

      // Update the value
      onChange(newValue)
      setUploadProgress(100)

      // Close the popover after successful upload
      setTimeout(() => {
        setIsUploading(false)
        setOpen(false)
        if (onBlur) onBlur()
      }, 500)

      // Clean up interval
      clearInterval(interval)
    } catch (error) {
      console.error('Error uploading dropped files:', error)
      setUploadError('Failed to upload files')
      setIsUploading(false)
    }
  }

  // Handle removal of a single file
  const handleRemoveFile = (index: number) => {
    const newValue = [...normalizedValue]
    newValue.splice(index, 1)
    onChange(newValue)
    if (onBlur) onBlur()
  }

  // Handle removal of all files
  const handleRemoveAllFiles = () => {
    onChange([])
    if (onBlur) onBlur()
  }

  // Drag and drop handlers
  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleDroppedFiles(e.dataTransfer.files)
      }
    },
    [handleDroppedFiles]
  )

  const [options, setOptions] = useState<any[]>([])

  // Query to fetch options from the referenced entity (for non-file references)
  const { data, isLoading, isFetching } = useQuery({
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
          queryParams.filter = searchTerm
        }

        // Fetch data from the referenced entity
        const response = await daptinClient.jsonApi.findAll(
          referencedEntity,
          queryParams
        )

        // Process the response data
        console.log(`Received ${response.data?.length || 0} results from API`)

        // Map the response to options
        if (response.data && Array.isArray(response.data)) {
          return response.data
        } else {
          console.warn('Response data is not an array:', response.data)
          return []
        }
      } catch (error) {
        console.error(`Error fetching ${referencedEntity} options:`, error)
        return []
      }
    },
    enabled: !!referencedEntity && !isFileReference,
  })

  useEffect(() => {
    if (data && Array.isArray(data)) {
      // Preserve the original data structure but add a computed label property
      const processedOptions = data.map((row) => ({
        ...row, // Keep all original properties
        _computedLabel:
          labelColumn && row[labelColumn]
            ? row[labelColumn]
            : row.name || row.title || row.label || row.reference_id,
      }))
      setOptions(processedOptions)

      // Debug output to help diagnose issues
      console.log(
        `Processed ${processedOptions.length} options from ${data.length} data items`
      )
    } else {
      // Reset options if no data
      setOptions([])
    }
  }, [data, labelColumn])

  const getItemLabel = useCallback(
    (item: any) => {
      // First check if we have a pre-computed label
      if (item._computedLabel) {
        return item._computedLabel
      }
      // Otherwise compute it on the fly
      if (labelColumn && item[labelColumn]) {
        return item[labelColumn]
      } else {
        return item.name || item.title || item.label || item.reference_id
      }
    },
    [labelColumn]
  )

  // Convert options for react-select
  const selectOptions = options.map((option) => ({
    value: option.reference_id,
    label: getItemLabel(option),
    data: option,
  }))

  // Find the currently selected option
  const selectedOption = value
    ? {
        value: value.reference_id,
        label: getItemLabel(value),
        data: value,
      }
    : null

  // Handle select change
  const handleSelectChange = (selected: any) => {
    if (selected) {
      onChange({
        type: referencedEntity,
        label: selected.label,
        id: selected.value,
        reference_id: selected.value,
        ...selected.data, // Include all original data
      })
      if (onBlur) onBlur()
    } else {
      onChange(null)
      if (onBlur) onBlur()
    }
  }

  // Render file reference editor
  if (isFileReference) {
    // Display files if they exist
    if (normalizedValue.length > 0) {
      return (
        <div className={cn('space-y-4', className)}>
          <div className='flex flex-wrap gap-2'>
            {normalizedValue.map((fileData, index) => {
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
                            onError={(e) => {
                              // If image fails to load, show placeholder
                              ;(e.target as HTMLImageElement).src = ''
                              ;(e.target as HTMLImageElement).style.display =
                                'none'
                              e.currentTarget.parentElement?.appendChild(
                                Object.assign(document.createElement('div'), {
                                  className:
                                    'h-24 w-24 flex items-center justify-center bg-gray-100',
                                  innerHTML:
                                    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" ' +
                                    'strokeLinecap="round" strokeLinejoin="round" class="lucide lucide-image">' +
                                    '<rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/>' +
                                    '<path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>',
                                })
                              )
                            }}
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
                      onClick={() => handleRemoveFile(index)}
                      className='absolute -top-2 -right-2 h-5 w-5 rounded-full opacity-0 transition-opacity group-hover:opacity-100'
                    >
                      <X className='h-3 w-3' />
                    </Button>
                  )}
                </div>
              )
            })}
          </div>

          {!disabled && (
            <div className='flex items-center gap-2'>
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <Button variant='outline' size='sm'>
                    <Upload className='mr-2 h-4 w-4' />
                    Add More {isImage ? 'Images' : 'Files'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className='w-80'>
                  <div
                    ref={dropZoneRef}
                    className={cn(
                      'space-y-4 rounded-md border-2 border-dashed p-4 transition-colors',
                      isDragging
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-200'
                    )}
                    onDragEnter={handleDragEnter}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <h4 className='text-center font-medium'>
                      Upload {isImage ? 'Images' : 'Files'}
                    </h4>

                    <div className='flex flex-col items-center justify-center gap-2 py-4'>
                      {isImage ? (
                        <ImageIcon className='h-10 w-10 text-gray-400' />
                      ) : (
                        <FileIcon className='h-10 w-10 text-gray-400' />
                      )}
                      <p className='text-sm text-gray-500'>
                        Drag & drop {isImage ? 'images' : 'files'} here or click
                        to browse
                      </p>
                    </div>

                    <Input
                      ref={fileInputRef}
                      type='file'
                      multiple
                      accept={isImage ? 'image/*' : undefined}
                      onChange={handleFileUpload}
                      disabled={isUploading}
                      className='cursor-pointer'
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

              <Button
                variant='outline'
                size='sm'
                onClick={handleRemoveAllFiles}
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

    // Display upload button if no files exist
    return (
      <div className={cn('space-y-2', className)}>
        <div
          ref={dropZoneRef}
          className={cn(
            'cursor-pointer rounded-md border-2 border-dashed p-8 transition-colors',
            isDragging ? 'border-primary bg-primary/5' : 'border-gray-200',
            error && 'border-red-500'
          )}
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className='flex flex-col items-center justify-center gap-3'>
            {isImage ? (
              <ImageIcon className='h-12 w-12 text-gray-400' />
            ) : (
              <FileIcon className='h-12 w-12 text-gray-400' />
            )}
            <p className='text-sm font-medium'>
              Drag & drop {isImage ? 'images' : 'files'} here or click to browse
            </p>
            <p className='text-xs text-gray-500'>
              Upload multiple {isImage ? 'images' : 'files'} at once
            </p>

            <Input
              ref={fileInputRef}
              type='file'
              multiple
              accept={isImage ? 'image/*' : undefined}
              onChange={handleFileUpload}
              disabled={isUploading || disabled}
              className='hidden'
            />
          </div>

          {isUploading && (
            <div className='mt-4 space-y-2'>
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
            <p className='text-destructive mt-2 text-center text-xs'>
              {uploadError}
            </p>
          )}
        </div>
      </div>
    )
  }

  // Render React Select component for foreign key selection
  return (
    <div className="min-h-48">
      <Select
        isDisabled={disabled}
        options={selectOptions}
        value={selectedOption}
        onChange={handleSelectChange}
        placeholder={placeholder || `Select ${referencedEntity || 'item'}...`}
        onInputChange={setSearchTerm}
        isLoading={isLoading}
        isClearable
        className={cn('w-full z-50', error ? 'react-select-error' : '')}
        classNamePrefix='react-select'
        formatOptionLabel={(option: any) => (
          <div className='flex flex-col'>
            <span>{option.label}</span>
            <span className='text-xs text-gray-400'>{option.value}</span>
          </div>
        )}
        styles={{
          control: (provided, state) => ({
            ...provided,
            borderColor: error ? 'red' : provided.borderColor,
            boxShadow: error ? '0 0 0 1px red' : provided.boxShadow,
            '&:hover': {
              borderColor: error
                ? 'red'
                : state.isFocused
                  ? 'var(--primary-color)'
                  : 'var(--border-color)',
            },
          }),
        }}
        noOptionsMessage={() => `No ${referencedEntity || 'items'} found`}
      />
      {error && <div className='mt-1 text-xs text-red-500'>{error}</div>}
    </div>
  )
}

export default ForeignKeyColumnEditor
