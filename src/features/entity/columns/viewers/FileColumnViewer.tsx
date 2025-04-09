// src/components/entity/columns/viewers/FileColumnViewer.tsx
import React, { useState } from 'react'
import { Eye, FileIcon, ImageIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ColumnViewerProps } from '../types'

interface FileData {
  name?: string
  path?: string
  type?: string
  size?: number
  md5?: string
}

/**
 * Component for displaying file attachments and images
 */
export const FileColumnViewer: React.FC<ColumnViewerProps> = ({
  value,
  column,
  className,
}) => {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<FileData | null>(null)

  // If the value is null or undefined
  if (value === null || value === undefined) {
    return <span className={className}>-</span>
  }

  // Parse file data
  let fileList: FileData[] = []

  try {
    if (typeof value === 'string') {
      fileList = JSON.parse(value)
    } else if (Array.isArray(value)) {
      fileList = value
    } else {
      fileList = [value as FileData]
    }
  } catch (error) {
    console.error('Error parsing file data:', error)
    return <span className={className}>{String(value)}</span>
  }

  if (fileList.length === 0) {
    return <span className={className}>No files</span>
  }

  // Check if we have image files
  const isImageFile = (file: FileData) => {
    const fileType = file.type || ''
    return (
      fileType.startsWith('image/') ||
      (file.name && /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(file.name))
    )
  }

  const handleViewFile = (file: FileData) => {
    setSelectedFile(file)
    setDialogOpen(true)
  }

  // Determine if all files are image types
  const allImages = fileList.every(isImageFile)

  // For a single image file, show a thumbnail preview
  if (fileList.length === 1 && allImages) {
    const file = fileList[0]
    const fileUrl = file.path || ''

    return (
      <>
        <div className={cn('flex items-center space-x-2', className)}>
          <div
            className='bg-muted flex h-8 w-8 items-center justify-center overflow-hidden rounded'
            onClick={() => handleViewFile(file)}
            style={{ cursor: 'pointer' }}
          >
            {fileUrl ? (
              <img
                src={fileUrl}
                alt={file.name || 'File'}
                className='h-full w-full object-cover'
              />
            ) : (
              <ImageIcon className='text-muted-foreground h-4 w-4' />
            )}
          </div>
          <span className='max-w-xs truncate'>{file.name || 'Image'}</span>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className='max-w-3xl'>
            <DialogHeader>
              <DialogTitle>{selectedFile?.name || 'Image Preview'}</DialogTitle>
            </DialogHeader>
            <div className='mt-4 flex justify-center'>
              {selectedFile && selectedFile.path && (
                <img
                  src={selectedFile.path}
                  alt={selectedFile.name || 'Image'}
                  className='max-h-[60vh] object-contain'
                />
              )}
            </div>
          </DialogContent>
        </Dialog>
      </>
    )
  }

  // For multiple files or non-image files
  return (
    <div className={cn('space-y-1', className)}>
      {fileList.map((file, index) => (
        <div key={index} className='flex items-center space-x-2'>
          <div className='flex h-5 w-5 items-center justify-center'>
            {isImageFile(file) ? (
              <ImageIcon className='h-4 w-4 text-blue-500' />
            ) : (
              <FileIcon className='h-4 w-4 text-gray-500' />
            )}
          </div>
          <span className='max-w-xs truncate text-sm'>
            {file.name || `File ${index + 1}`}
          </span>
          <Button
            variant='ghost'
            size='sm'
            onClick={() => handleViewFile(file)}
            className='ml-auto h-6 w-6 p-0'
          >
            <Eye className='h-3 w-3' />
            <span className='sr-only'>View File</span>
          </Button>
        </div>
      ))}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className='max-w-3xl'>
          <DialogHeader>
            <DialogTitle>{selectedFile?.name || 'File Preview'}</DialogTitle>
          </DialogHeader>
          <div className='mt-4'>
            {selectedFile && isImageFile(selectedFile) && selectedFile.path ? (
              <div className='flex justify-center'>
                <img
                  src={selectedFile.path}
                  alt={selectedFile.name || 'Image'}
                  className='max-h-[60vh] object-contain'
                />
              </div>
            ) : (
              <div className='bg-muted flex flex-col items-center justify-center rounded-md p-8'>
                <FileIcon className='text-muted-foreground mb-4 h-12 w-12' />
                <p>File: {selectedFile?.name}</p>
                {selectedFile?.size && (
                  <p className='text-muted-foreground text-sm'>
                    Size: {(selectedFile.size / 1024).toFixed(2)} KB
                  </p>
                )}
                {selectedFile?.path && (
                  <Button
                    variant='outline'
                    className='mt-4'
                    onClick={() => window.open(selectedFile.path)}
                  >
                    Download File
                  </Button>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default FileColumnViewer
