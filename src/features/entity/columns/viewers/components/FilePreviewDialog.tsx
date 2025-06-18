import React from 'react'
import { X, ChevronLeft, ChevronRight, Download, Music } from 'lucide-react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { ProcessedFileInfo, downloadFile, formatFileSize } from '../utils/fileUtils'

interface FilePreviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  fileInfoArray: ProcessedFileInfo[]
  imageAssetUrls: string[]
  currentIndex: number
  onPrevious: (e: React.MouseEvent) => void
  onNext: (e: React.MouseEvent) => void
  isDownloading: boolean
  onDownload: (url: string, fileName: string) => void
}

export const FilePreviewDialog: React.FC<FilePreviewDialogProps> = ({
  open,
  onOpenChange,
  fileInfoArray,
  imageAssetUrls,
  currentIndex,
  onPrevious,
  onNext,
  isDownloading,
  onDownload
}) => {
  const { toast } = useToast()
  const currentFile = fileInfoArray[currentIndex]
  const currentFileUrl = imageAssetUrls[currentIndex]

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isDownloading) return
    onDownload(currentFileUrl, currentFile.fileName)
  }

  const renderFilePreview = () => {
    switch (currentFile.typeInfo.category) {
      case 'image':
        return (
          <img
            src={currentFileUrl}
            alt={currentFile.fileName}
            className='max-h-full max-w-full object-contain'
          />
        )
      case 'video':
        return (
          <video
            src={currentFileUrl}
            controls
            autoPlay
            className='max-h-full max-w-full object-contain'
          >
            Your browser does not support the video tag.
          </video>
        )
      case 'audio':
        return (
          <div className='flex flex-col items-center gap-4'>
            <div className='flex h-32 w-32 items-center justify-center rounded-full bg-white/10'>
              <Music className='h-16 w-16 text-white' />
            </div>
            <audio
              src={currentFileUrl}
              controls
              autoPlay
              className='w-full max-w-md'
            >
              Your browser does not support the audio tag.
            </audio>
            <p className='text-lg font-medium text-white'>{currentFile.fileName}</p>
            {currentFile.size && (
              <p className='text-sm text-gray-300'>{formatFileSize(currentFile.size)}</p>
            )}
          </div>
        )
      default:
        // Non-previewable files
        return (
          <div className='flex flex-col items-center gap-4 text-white'>
            <div className='flex h-32 w-32 items-center justify-center rounded-lg bg-white/10'>
              {React.createElement(currentFile.typeInfo.icon, {
                className: 'h-16 w-16 text-white'
              })}
            </div>
            <div className='text-center'>
              <p className='text-xl font-medium'>{currentFile.fileName}</p>
              {currentFile.size && (
                <p className='text-sm text-gray-300 mt-1'>{formatFileSize(currentFile.size)}</p>
              )}
              <p className='text-sm text-gray-400 mt-2'>This file cannot be previewed in browser</p>
            </div>
            <Button
              variant='secondary'
              size='lg'
              onClick={handleDownload}
              disabled={isDownloading}
            >
              {isDownloading ? (
                <>
                  <span className='mr-2 h-4 w-4 animate-spin rounded-full border-2 border-gray-500 border-t-transparent' />
                  Downloading...
                </>
              ) : (
                <>
                  <Download className='mr-2 h-4 w-4' />
                  Download {currentFile.typeInfo.displayName}
                </>
              )}
            </Button>
          </div>
        )
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-4xl p-0 sm:rounded-lg'>
        <div className='relative flex h-full max-h-[80vh] w-full flex-col items-center justify-center bg-black/90 p-4'>
          {/* Close button */}
          <button
            onClick={() => onOpenChange(false)}
            className='absolute right-2 top-2 z-50 rounded-full bg-black/50 p-1 text-white hover:bg-black/70'
          >
            <X className='h-5 w-5' />
          </button>

          {/* Navigation buttons */}
          {imageAssetUrls.length > 1 && (
            <>
              <button
                onClick={onPrevious}
                className='absolute left-2 top-1/2 z-50 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white hover:bg-black/70'
              >
                <ChevronLeft className='h-6 w-6' />
              </button>
              <button
                onClick={onNext}
                className='absolute right-2 top-1/2 z-50 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white hover:bg-black/70'
              >
                <ChevronRight className='h-6 w-6' />
              </button>
            </>
          )}

          {/* File preview */}
          <div className='flex h-full w-full items-center justify-center'>
            {renderFilePreview()}
          </div>

          {/* Footer with download button */}
          <div className='mt-4 flex w-full items-center justify-between px-4'>
            <div className='flex-1 text-center'>
              <p className='text-sm text-white'>
                {currentIndex + 1} of {imageAssetUrls.length} files
              </p>
            </div>
            {/* Universal download button */}
            <Button
              variant='ghost'
              size='sm'
              className='text-white hover:bg-white/20'
              onClick={handleDownload}
              disabled={isDownloading}
              title='Download current file'
            >
              {isDownloading ? (
                <span className='h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent' />
              ) : (
                <Download className='h-4 w-4' />
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}