// src/components/entity/columns/editors/ForeignKeyColumnEditor.tsx
import React, { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { daptinClient } from '@/daptin'
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react'
import { ReactFilesPreview } from 'react-files-preview'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { ColumnEditorProps } from '../types'


export const DAPTIN_ENDPOINT = import.meta.env.VITE_DAPTIN_URL

// Extend ColumnEditorProps to include entity
interface ForeignKeyColumnEditorProps extends ColumnEditorProps {
  entity?: any
}

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
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [files, setFiles] = useState<File[]>([])
  const [fileObjects, setFileObjects] = useState<any[]>([])

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
  const normalizedValue = Array.isArray(value) ? value : value ? [value] : []

  // Extract file data for display (first item in the array)
  const fileData = normalizedValue.length > 0 ? normalizedValue[0] : null

  // Get asset URL for displaying current image
  const assetUrl =
    entity && column.ColumnName
      ? `${DAPTIN_ENDPOINT}/asset/${entity.__type}/${entity.reference_id}/${column.ColumnName}.png`
      : ''

  // Initialize files from existing value
  useEffect(() => {
    if (fileData && isFileReference) {
      // If we already have a file object with file data, we'll create a placeholder File object
      // for react-files-preview to display
      if (assetUrl && fileData.name) {
        // Since we can't directly convert back from a stored file to a File object,
        // we'll fetch the file from the server if needed
        setFileObjects([fileData])
      }
    }
  }, [fileData, assetUrl, isFileReference])

  // Handle file change from ReactFilesPreview
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null)

    if (!e.target.files || e.target.files.length === 0) return

    const newFiles = Array.from(e.target.files)
    setFiles(newFiles)

    // Process the first file (since our component expects a single file)
    const file = newFiles[0]

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
      const base64Content = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = (e) => {
          const result = (e.target?.result as string)?.split(',')[1] || ''
          resolve(result)
        }
        reader.onerror = () => reject(new Error('Failed to read file'))
        reader.readAsDataURL(file)
      })

      // Add contents to file object
      const fileWithContents = {
        ...fileObject,
        contents: base64Content,
      }

      // Always use array for file/image type columns
      const newValue = [fileWithContents]

      // Update the value
      onChange(newValue)
      setFileObjects([fileWithContents])

      // Close the popover after successful upload
      setTimeout(() => {
        setOpen(false)
        if (onBlur) onBlur()
      }, 500)
    } catch (error) {
      console.error('Error processing file:', error)
      setUploadError('Failed to process file')
    }
  }

  // Handle file removal
  const handleRemoveFile = (removedFile: File) => {
    setFiles([])
    setFileObjects([])
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
    // Prepare props for ReactFilesPreview
    const previewProps = {
      files: files,
      onChange: handleFileChange,
      onRemove: handleRemoveFile,
      disabled: disabled,
      multiple: false,
      accept: isImage ? 'image/*' : undefined,
      fileWidth: 'rfp-w-40',
      fileHeight: 'rfp-h-30',
      removeFile: !disabled && files.length > 0,
      showFileSize: true,
      showSliderCount: false,
      onError: (error: string) => setUploadError(error),
    }

    // If we have existing file data and a URL, pass the URL to the preview
    const urlProp =
      fileData && assetUrl && fileObjects.length === 0 ? { url: assetUrl } : {}

    return (
      <div className={cn('space-y-2', className, error && 'border-red-500')}>
        {uploadError && (
          <p className='text-destructive text-xs'>{uploadError}</p>
        )}
        <div className='min-h-60 overflow-hidden rounded-md flex flex-row'>
          <ReactFilesPreview {...previewProps} {...urlProp} />
        </div>
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
