import React, { useCallback, useEffect, useState } from 'react'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  FileText,
  Grid3x3,
  Search,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { formatFileSize, ProcessedFileInfo } from '../utils/fileUtils'

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

const scrollbarStyles = `
  .file-list-scroll::-webkit-scrollbar {
    width: 8px;
  }
  .file-list-scroll::-webkit-scrollbar-track {
    background: #374151;
    border-radius: 4px;
  }
  .file-list-scroll::-webkit-scrollbar-thumb {
    background: #6b7280;
    border-radius: 4px;
  }
  .file-list-scroll::-webkit-scrollbar-thumb:hover {
    background: #9ca3af;
  }
`

export const FilePreviewDialog: React.FC<FilePreviewDialogProps> = ({
  open,
  onOpenChange,
  fileInfoArray,
  imageAssetUrls,
  currentIndex,
  onPrevious,
  onNext,
  isDownloading,
  onDownload,
}) => {
  const [showFileBrowser, setShowFileBrowser] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [drawerWidth, setDrawerWidth] = useState(320)
  const [isResizing, setIsResizing] = useState(false)
  const [fileTextContent, setFileTextContent] = useState<string | null>(null)
  const [isLoadingText, setIsLoadingText] = useState(false)
  const [textLoadError, setTextLoadError] = useState<string | null>(null)

  const currentFile = fileInfoArray[currentIndex]
  const currentFileUrl = imageAssetUrls[currentIndex]

  const filteredFiles = fileInfoArray.filter((file) =>
    file.fileName.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Optimized file selection that directly calls navigation functions
  const handleFileSelect = useCallback(
    (targetIndex: number) => {
      const originalIndex = fileInfoArray.findIndex(
        (file) => file === filteredFiles[targetIndex]
      )
      if (originalIndex !== -1 && originalIndex !== currentIndex) {
        const diff = originalIndex - currentIndex
        const mockEvent = {
          stopPropagation: () => {},
        } as React.MouseEvent

        if (diff > 0) {
          // Navigate forward
          for (let i = 0; i < diff; i++) {
            onNext(mockEvent)
          }
        } else {
          // Navigate backward
          for (let i = 0; i < Math.abs(diff); i++) {
            onPrevious(mockEvent)
          }
        }
      }
      // setShowFileBrowser(false)
    },
    [fileInfoArray, filteredFiles, currentIndex, onNext, onPrevious]
  )

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isDownloading) return
    onDownload(currentFileUrl, currentFile.fileName)
  }

  // Function to fetch file content as text
  const fetchFileContent = useCallback(async (url: string) => {
    setIsLoadingText(true)
    setTextLoadError(null)
    setFileTextContent(null)

    try {
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(
          `Failed to fetch file: ${response.status} ${response.statusText}`
        )
      }

      const text = await response.text()
      setFileTextContent(text)
    } catch (error) {
      console.error('Error fetching file content:', error)
      setTextLoadError(
        error instanceof Error ? error.message : 'Failed to load file content'
      )
    } finally {
      setIsLoadingText(false)
    }
  }, [])

  // Copy file content to clipboard
  const handleCopyContent = useCallback(async () => {
    if (fileTextContent) {
      try {
        await navigator.clipboard.writeText(fileTextContent)
        // Could add a toast notification here if available
      } catch (error) {
        console.error('Failed to copy content:', error)
      }
    }
  }, [fileTextContent])

  // Handle drawer resizing
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return
      const newWidth = Math.max(200, Math.min(600, e.clientX))
      setDrawerWidth(newWidth)
    }

    const handleMouseUp = () => {
      setIsResizing(false)
    }

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizing])

  // Load file content when current file changes and it's not previewable
  useEffect(() => {
    if (currentFile && currentFileUrl && !currentFile.typeInfo.canPreview) {
      fetchFileContent(currentFileUrl)
    } else {
      setFileTextContent(null)
      setTextLoadError(null)
      setIsLoadingText(false)
    }
  }, [currentFile, currentFileUrl, fetchFileContent])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault()
          onPrevious({
            stopPropagation: () => {},
          } as React.MouseEvent)
          break
        case 'ArrowRight':
          e.preventDefault()
          onNext({
            stopPropagation: () => {},
          } as React.MouseEvent)
          break
        case 'Escape':
          if (showFileBrowser) {
            setShowFileBrowser(false)
          } else {
            onOpenChange(false)
          }
          break
        case 'b':
        case 'B':
          if (!showFileBrowser) {
            setShowFileBrowser(true)
          }
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, showFileBrowser, onPrevious, onNext, onOpenChange])

  // Render text content editor
  const renderTextContent = () => {
    if (isLoadingText) {
      return (
        <div className='flex flex-col items-center gap-4 text-white'>
          <div className='flex h-32 w-32 items-center justify-center rounded-lg bg-white/10'>
            <span className='h-8 w-8 animate-spin rounded-full border-2 border-white border-t-transparent' />
          </div>
          <p className='text-lg'>Loading file content...</p>
        </div>
      )
    }

    if (textLoadError) {
      return (
        <div className='flex flex-col items-center gap-4 text-white'>
          <div className='flex h-32 w-32 items-center justify-center rounded-lg bg-red-500/20'>
            <AlertCircle className='h-16 w-16 text-red-400' />
          </div>
          <div className='text-center'>
            <p className='text-lg font-medium text-red-400'>
              Failed to load file content
            </p>
            <p className='mt-1 text-sm text-gray-400'>{textLoadError}</p>
          </div>
          <Button
            variant='secondary'
            onClick={() => fetchFileContent(currentFileUrl)}
            className='mt-2'
          >
            Try Again
          </Button>
        </div>
      )
    }

    if (fileTextContent) {
      return (
        <div className='mx-auto flex h-full w-full max-w-6xl flex-col text-white'>
          {/* Header with file info and copy button */}
          <div className='flex items-center justify-between rounded-t-lg border-b border-gray-700 bg-gray-900/50 p-4'>
            <div className='flex items-center gap-3'>
              {React.createElement(currentFile.typeInfo.icon, {
                className: 'h-5 w-5 text-gray-400',
              })}
              <div>
                <p className='font-medium'>{currentFile.fileName}</p>
                <p className='text-sm text-gray-400'>
                  {currentFile.typeInfo.displayName}
                  {currentFile.size && ` • ${formatFileSize(currentFile.size)}`}
                </p>
              </div>
            </div>
            <Button
              variant='ghost'
              size='sm'
              onClick={handleCopyContent}
              className='text-gray-400 hover:text-white'
              title='Copy content to clipboard'
            >
              <Copy className='h-4 w-4' />
            </Button>
          </div>

          {/* Text content area */}
          <div className='flex-1 overflow-hidden'>
            <textarea
              value={fileTextContent}
              readOnly
              className='scrollbar-thin scrollbar-track-gray-800 scrollbar-thumb-gray-600 h-full w-full resize-none border-0 bg-gray-950 p-4 font-mono text-sm text-gray-100 outline-none'
              style={{
                minHeight: '400px',
                fontFamily:
                  'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
              }}
              spellCheck={false}
            />
          </div>
        </div>
      )
    }

    return null
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
          <div className='flex flex-col items-center gap-6'>
            <div className='flex h-32 w-32 items-center justify-center rounded-full bg-white/10'>
              {React.createElement(currentFile.typeInfo.icon, {
                className: 'h-16 w-16 text-white',
              })}
            </div>
            <audio
              src={currentFileUrl}
              controls
              autoPlay
              className='w-full max-w-md'
            >
              Your browser does not support the audio tag.
            </audio>
            <div className='text-center'>
              <p className='text-lg font-medium text-white'>
                {currentFile.fileName}
              </p>
              {currentFile.size && (
                <p className='text-sm text-gray-300'>
                  {formatFileSize(currentFile.size)}
                </p>
              )}
            </div>
          </div>
        )
      default:
        // Try to show text content for non-previewable files
        const textContent = renderTextContent()
        if (textContent) {
          return textContent
        }

        // Fallback to the original "cannot be previewed" message
        return (
          <div className='flex flex-col items-center gap-6 text-white'>
            <div className='flex h-32 w-32 items-center justify-center rounded-lg bg-white/10'>
              {React.createElement(currentFile.typeInfo.icon, {
                className: 'h-16 w-16 text-white',
              })}
            </div>
            <div className='text-center'>
              <p className='text-xl font-medium'>{currentFile.fileName}</p>
              {currentFile.size && (
                <p className='mt-1 text-sm text-gray-300'>
                  {formatFileSize(currentFile.size)}
                </p>
              )}
              <p className='mt-2 text-sm text-gray-400'>
                This file cannot be previewed
              </p>
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

  const renderFileBrowser = () => (
    <div
      className='relative h-full border-r border-gray-700 bg-gray-900/95 backdrop-blur-sm'
      style={{ width: `${drawerWidth}px` }}
    >
      <div className='flex h-full flex-col'>
        {/* Browser Header */}
        <div className='flex flex-shrink-0 items-center justify-between border-b border-gray-700 p-4'>
          <div className='flex items-center gap-3'>
            <FileText className='h-5 w-5 text-white' />
            <h3 className='text-lg font-semibold text-white'>
              Files ({fileInfoArray.length})
            </h3>
          </div>
        </div>

        {/* Search and View Controls */}
        <div className='flex-shrink-0 border-b border-gray-700 p-4'>
          <div className='space-y-3'>
            <div className='relative'>
              <Search className='absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400' />
              <Input
                placeholder='Search files...'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className='border-gray-600 bg-gray-800 pl-10 text-white placeholder:text-gray-400'
              />
            </div>
          </div>
        </div>

        {/* File List - Scrollable Area */}
        <div className='relative min-h-0 flex-1'>
          <div
            className='file-list-scroll absolute inset-0 overflow-y-scroll p-4'
            style={{
              scrollbarWidth: 'auto',
              scrollbarColor: '#6b7280 #374151',
            }}
          >
            <div className='min-h-full'>
              {filteredFiles.length === 0 ? (
                <div className='py-8 text-center text-gray-400'>
                  No files found matching "{searchTerm}"
                </div>
              ) : (
                <div className='space-y-1 pb-4'>
                  {filteredFiles.map((file, index) => {
                    const originalIndex = fileInfoArray.findIndex(
                      (f) => f === file
                    )
                    const isActive = originalIndex === currentIndex
                    return (
                      <button
                        key={index}
                        onClick={() => handleFileSelect(index)}
                        className={`flex w-full items-center gap-3 rounded-lg p-3 text-left transition-all ${isActive ? 'bg-blue-400/20 text-blue-400' : 'text-white hover:bg-gray-800'}`}
                      >
                        <div className='flex-shrink-0'>
                          {React.createElement(file.typeInfo.icon, {
                            className: 'h-4 w-4',
                          })}
                        </div>
                        <div className='flex-1 truncate'>
                          <div className='truncate text-sm font-medium'>
                            {file.fileName}
                          </div>
                          <div className='flex items-center gap-2 text-xs text-gray-400'>
                            <span>{file.typeInfo.displayName}</span>
                            {file.size && (
                              <span>{formatFileSize(file.size)}</span>
                            )}
                          </div>
                        </div>
                        {isActive && (
                          <div className='h-2 w-2 flex-shrink-0 rounded-full bg-blue-400'></div>
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Browser Footer */}
        <div className='flex-shrink-0 border-t border-gray-700 p-3 text-center text-sm text-gray-400'>
          {filteredFiles.length} of {fileInfoArray.length} files
          {searchTerm && ` matching "${searchTerm}"`}
        </div>
      </div>

      {/* Resize Handle */}
      <div
        className='group absolute top-0 right-0 bottom-0 w-1 cursor-col-resize bg-gray-600 transition-colors hover:bg-gray-500'
        onMouseDown={() => setIsResizing(true)}
        title='Drag to resize'
      >
        <div className='absolute inset-y-0 -right-1 -left-1 group-hover:bg-gray-500/20'></div>
      </div>
    </div>
  )

  return (
    <>
      <style>{scrollbarStyles}</style>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <VisuallyHidden>
          <DialogTitle>File Preview</DialogTitle>
          <DialogDescription>
            Preview and navigate through files. Use arrow keys to navigate or
            press B to browse all files.
          </DialogDescription>
        </VisuallyHidden>
        <DialogContent className='fixed inset-4 top-[5vh] right-[2.5vw] bottom-[5vh] left-[2.5vw] h-auto w-auto max-w-none gap-0 overflow-hidden p-0'>
          <div className='relative flex h-full w-full bg-black'>
            {/* File Browser Sidebar */}
            {showFileBrowser && renderFileBrowser()}

            {/* Main Content Area */}
            <div className='flex flex-1 flex-col'>
              {/* Header */}
              <div className='flex items-center justify-between border-b border-gray-800 bg-gray-900/90 p-4'>
                <div className='flex items-center gap-4'>
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={() => setShowFileBrowser(!showFileBrowser)}
                    className='text-white hover:bg-white/20'
                    title='Toggle file browser (B)'
                  >
                    {showFileBrowser ? (
                      <X className='mr-2 h-4 w-4' />
                    ) : (
                      <Grid3x3 className='mr-2 h-4 w-4' />
                    )}
                    {showFileBrowser ? 'Hide' : 'Browse'}
                  </Button>
                  <div className='text-sm text-gray-300'>
                    {currentIndex + 1} of {imageAssetUrls.length}
                  </div>
                  <div className='max-w-xs truncate text-sm text-gray-400'>
                    {currentFile.fileName}
                  </div>
                </div>

                <div className='flex items-center gap-2'>
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={handleDownload}
                    disabled={isDownloading}
                    className='text-white hover:bg-white/20'
                    title='Download file'
                  >
                    {isDownloading ? (
                      <span className='h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent' />
                    ) : (
                      <Download className='h-4 w-4' />
                    )}
                  </Button>
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={() => onOpenChange(false)}
                    className='text-white hover:bg-white/20'
                  >
                    <X className='h-4 w-4' />
                  </Button>
                </div>
              </div>

              {/* Main Preview Area */}
              <div className='relative flex flex-1 items-center justify-center p-4'>
                {/* Navigation Buttons */}
                {imageAssetUrls.length > 1 && (
                  <>
                    <button
                      onClick={onPrevious}
                      className='absolute top-1/2 left-4 z-10 -translate-y-1/2 rounded-full bg-black/50 p-3 text-white transition-colors hover:bg-black/70'
                      title='Previous file (←)'
                    >
                      <ChevronLeft className='h-6 w-6' />
                    </button>
                    <button
                      onClick={onNext}
                      className='absolute top-1/2 right-4 z-10 -translate-y-1/2 rounded-full bg-black/50 p-3 text-white transition-colors hover:bg-black/70'
                      title='Next file (→)'
                    >
                      <ChevronRight className='h-6 w-6' />
                    </button>
                  </>
                )}

                {/* File Preview */}
                <div className='flex h-full w-full items-center justify-center'>
                  {renderFilePreview()}
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
