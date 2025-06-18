import React from 'react'
import { cn } from '@/lib/utils'
import { ProcessedFileInfo } from '../utils/fileUtils'

interface FileStackedCardsProps {
  fileInfoArray: ProcessedFileInfo[]
  imageAssetUrls: string[]
  className?: string
  onPreview: () => void
}

export const FileStackedCards: React.FC<FileStackedCardsProps> = ({
  fileInfoArray,
  imageAssetUrls,
  className,
  onPreview
}) => {
  const maxVisibleCards = 3
  const visibleFiles = fileInfoArray.slice(0, Math.min(maxVisibleCards, fileInfoArray.length))

  return (
    <div
      className={cn('relative flex h-28 w-auto cursor-pointer', className)}
      onClick={onPreview}
    >
      {/* Display stacked cards (limited to max 3 visible) */}
      {visibleFiles.map((fileInfo, index) => {
        const fileAssetUrl = imageAssetUrls[index]
        const offset = index * 4 // Offset for stacked effect

        return (
          <div
            key={fileAssetUrl}
            className={cn(
              'absolute rounded-md border border-gray-200 bg-white shadow-sm transition-all',
              {
                'z-30 rotate-0': index === 0,
                'z-20 -rotate-3': index === 1,
                'z-10 -rotate-6': index === 2
              }
            )}
            style={{
              left: `${offset}px`,
              top: `${offset}px`,
            }}
          >
            <div className='flex flex-col items-center p-1'>
              {fileInfo.typeInfo.category === 'image' ? (
                <img
                  src={fileAssetUrl}
                  alt={fileInfo.fileName}
                  className='h-16 w-16 object-contain'
                />
              ) : (
                <div className='flex h-16 w-16 items-center justify-center rounded bg-gray-100'>
                  {React.createElement(fileInfo.typeInfo.icon, {
                    className: 'h-8 w-8 text-gray-600'
                  })}
                </div>
              )}
              <span className='mt-1 max-w-16 truncate text-xs'>
                {fileInfo.fileName.length > 10 
                  ? fileInfo.fileName.substring(0, 8) + '...' 
                  : fileInfo.fileName}
              </span>
            </div>
          </div>
        )
      })}

      {/* Show count badge if more than 3 files */}
      {fileInfoArray.length > maxVisibleCards && (
        <div className='absolute bottom-1 right-1 z-40 rounded-full bg-blue-500 px-1.5 py-0.5 text-xs font-medium text-white'>
          +{fileInfoArray.length - maxVisibleCards}
        </div>
      )}
    </div>
  )
}