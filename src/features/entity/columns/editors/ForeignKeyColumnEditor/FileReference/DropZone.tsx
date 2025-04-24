import React, { useCallback, useRef, useState } from 'react'
import { FileIcon, ImageIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { DropZoneProps } from '../types'

export const DropZone: React.FC<DropZoneProps> = ({
                                                    onDrop,
                                                    children,
                                                    className,
                                                    isImage,
                                                    disabled,
                                                  }) => {
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Drag and drop handlers
  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled) {
      setIsDragging(true)
    }
  }, [disabled])

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

      if (!disabled && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        onDrop(e.dataTransfer.files)
      }
    },
    [disabled, onDrop]
  )

  const handleClick = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onDrop(e.target.files)
    }
  }

  return (
    <div
      className={cn(
        'cursor-pointer rounded-md border-2 border-dashed p-4 transition-colors',
        isDragging ? 'border-primary bg-primary/5' : 'border-gray-200',
        disabled && 'cursor-not-allowed opacity-60',
        className
      )}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <div className="flex flex-col items-center justify-center gap-2">
        {isImage ? (
          <ImageIcon className="h-12 w-12 text-gray-400" />
        ) : (
          <FileIcon className="h-12 w-12 text-gray-400" />
        )}

        {children}

        <Input
          ref={fileInputRef}
          type="file"
          multiple
          accept={isImage ? 'image/*' : undefined}
          onChange={handleFileInputChange}
          disabled={disabled}
          className="hidden"
        />
      </div>
    </div>
  )
}

export default DropZone
