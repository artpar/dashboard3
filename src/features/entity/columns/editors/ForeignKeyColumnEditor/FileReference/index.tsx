import React, { useState, useRef } from 'react'
import { cn } from '@/lib/utils'
import { FileDisplay } from './FileDisplay'
import { FileUploader } from './FileUploader'
import { DropZone } from './DropZone'
import { processFiles } from '../utils/fileProcessing'
import { FileReferenceEditorProps } from '../types'

export const FileReferenceEditor: React.FC<FileReferenceEditorProps> = ({
                                                                          value,
                                                                          onChange,
                                                                          onBlur,
                                                                          className,
                                                                          error,
                                                                          disabled,
                                                                          isImage,
                                                                          column,
                                                                          entity,
                                                                          assetUrl,
                                                                        }) => {
  const [uploadProgress, setUploadProgress] = useState<number>(0)
  const [isUploading, setIsUploading] = useState<boolean>(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Handle file upload
  const handleFilesSelected = async (files: FileList) => {
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
      const processedFiles = await processFiles(files, column.ColumnType || '')

      // Combine with existing files
      const newValue = [...value, ...processedFiles]

      // Update the value
      onChange(newValue)
      setUploadProgress(100)

      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      // Clean up and call onBlur
      setTimeout(() => {
        setIsUploading(false)
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

  // Handle removal of a single file
  const handleRemoveFile = (index: number) => {
    const newValue = [...value]
    newValue.splice(index, 1)
    onChange(newValue)
    if (onBlur) onBlur()
  }

  // Handle removal of all files
  const handleRemoveAllFiles = () => {
    onChange([])
    if (onBlur) onBlur()
  }

  // If there are files to display, show them with upload options
  if (value.length > 0) {
    return (
      <div className={cn('space-y-4', className)}>
        <FileDisplay
          files={value}
          onRemoveFile={handleRemoveFile}
          onRemoveAllFiles={handleRemoveAllFiles}
          isImage={isImage}
          disabled={disabled}
          error={error}
          className={className}
          entity={entity}
          column={column}
          assetUrl={assetUrl}
        />

        {!disabled && (
          <FileUploader
            onFilesSelected={handleFilesSelected}
            isImage={isImage}
            disabled={disabled}
            isUploading={isUploading}
            uploadProgress={uploadProgress}
            uploadError={uploadError}
          />
        )}
      </div>
    )
  }

  // If no files, just show the drop zone
  return (
    <div className={cn('space-y-2', className)}>
      <DropZone
        onDrop={handleFilesSelected}
        isImage={isImage}
        disabled={disabled || isUploading}
        className={cn(error && 'border-red-500')}
      >
        <div className="flex flex-col items-center justify-center gap-3">
          <p className="text-sm font-medium">
            Drag & drop {isImage ? 'images' : 'files'} here or click to browse
          </p>
          <p className="text-xs text-gray-500">
            Upload multiple {isImage ? 'images' : 'files'} at once
          </p>

          {isUploading && (
            <div className="mt-4 space-y-2 w-full">
              <div className="bg-secondary h-2 w-full overflow-hidden rounded-full">
                <div
                  className="bg-primary h-full transition-all duration-300 ease-in-out"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-muted-foreground text-center text-xs">
                {uploadProgress < 100 ? 'Uploading...' : 'Upload complete!'}
              </p>
            </div>
          )}

          {uploadError && (
            <p className="text-destructive mt-2 text-center text-xs">
              {uploadError}
            </p>
          )}
        </div>
      </DropZone>
    </div>
  )
}
