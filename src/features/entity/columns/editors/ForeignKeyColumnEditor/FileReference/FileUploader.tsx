import React, { useRef } from 'react'
import { Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { DropZone } from './DropZone'
import { FileUploaderProps } from '../types'

export const FileUploader: React.FC<FileUploaderProps> = ({
                                                            onFilesSelected,
                                                            isImage,
                                                            disabled,
                                                            isUploading,
                                                            uploadProgress,
                                                            uploadError,
                                                          }) => {
  const [open, setOpen] = React.useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files && files.length > 0) {
      onFilesSelected(files)
      // Close popover after successful selection
      setTimeout(() => setOpen(false), 500)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" disabled={disabled}>
          <Upload className="mr-2 h-4 w-4" />
          Add More {isImage ? 'Images' : 'Files'}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <DropZone
          onDrop={(files) => {
            onFilesSelected(files)
            setTimeout(() => setOpen(false), 500)
          }}
          isImage={isImage}
          disabled={disabled || isUploading}
        >
          <div className="flex flex-col items-center justify-center gap-2 py-4">
            <p className="text-sm text-gray-500">
              Drag & drop {isImage ? 'images' : 'files'} here or click to browse
            </p>
          </div>

          <Input
            ref={fileInputRef}
            type="file"
            multiple
            accept={isImage ? 'image/*' : undefined}
            onChange={handleFileInputChange}
            disabled={isUploading || disabled}
            className="cursor-pointer"
          />

          {isUploading && (
            <div className="space-y-2 mt-4">
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
            <p className="text-destructive text-xs mt-2">{uploadError}</p>
          )}
        </DropZone>
      </PopoverContent>
    </Popover>
  )
}
