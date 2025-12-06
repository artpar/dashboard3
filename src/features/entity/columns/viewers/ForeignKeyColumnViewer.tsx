// src/components/entity/columns/viewers/ForeignKeyColumnViewer.tsx
import React, { useEffect, useState } from 'react'
import { ColumnViewerProps } from '../types'
import { useToast } from '@/components/ui/use-toast'
import { processFileInfo, downloadFile } from './utils/fileUtils'
import { FileStackedCards } from './components/FileStackedCards'
import { FilePreviewDialog } from './components/FilePreviewDialog'
import { UuidReferenceBadge, ObjectReferenceBadge, GenericBadge } from './components/ReferenceBadge'


export const DAPTIN_ENDPOINT = import.meta.env.VITE_DAPTIN_URL

/**
 * Component for displaying foreign key values with reference data
 */
export const ForeignKeyColumnViewer: React.FC<ColumnViewerProps> = ({
  value,
  column,
  className,
  entity,
}) => {
  const { toast } = useToast()
  const [referenceData, setReferenceData] = useState<any>(null)
  const [isDownloading, setIsDownloading] = useState<boolean>(false)
  const [showPreview, setShowPreview] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  // Extract necessary information from the column
  const foreignKeyData = column.ForeignKeyData
  const namespace = foreignKeyData?.Namespace
  const dataSource = foreignKeyData?.DataSource
  const columnType = column.ColumnType || ''

  // If the value is null or undefined, show a placeholder
  if (value === null || value === undefined) {
    return <span className={className}>-</span>
  }

  // Determine the type of foreign key value
  const isFileReference =
    dataSource === 'cloud_store' || columnType.startsWith('file.')
  const isUuidReference =
    typeof value === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      value
    )
  const isArrayReference = Array.isArray(value)

  // Load reference data if available
  useEffect(() => {
    // Don't fetch for file references
    if (isFileReference) return

    // Don't fetch if we don't have necessary data
    if (!namespace || !value) return

    // Skip if not a self reference
    if (dataSource !== 'self') return

    if (typeof value === 'object') {
      setReferenceData(value)
      return
    }

    // Get the reference ID based on the type of value
    const referenceId = isUuidReference
      ? value
      : typeof value === 'object' && value !== null && 'reference_id' in value
        ? value.reference_id
        : null

    if (!referenceId) return

    const fetchReferenceData = async () => {
      setReferenceData({
        __type: namespace,
        reference_id: referenceId,
      })

    }

    fetchReferenceData()
  }, [namespace, value, dataSource, isFileReference, isUuidReference])

  // Handle file references (cloud_store or file.* column types)
  if (isFileReference) {
    // Normalize value to always be an array
    const fileDataArray = isArrayReference ? value : [value]

    // Process file information for all files
    const fileInfoArray = processFileInfo(fileDataArray)

    // If there are no files, return a placeholder
    if (fileDataArray.length === 0) {
      return (
        <span className={className}>No files</span>
      )
    }
    
    const tokenString = '?token=' + localStorage.getItem('token')

    // Generate asset URLs for all files
    const imageAssetUrls = fileDataArray.map((fileData, index) => {
      return entity && column.ColumnName
        ? `${DAPTIN_ENDPOINT}/asset/${entity.__type}/${entity.reference_id}/${column.ColumnName}${tokenString}&index=${index}`
        : ''
    })

    // Navigate to previous media item
    const goToPrevious = (e: React.MouseEvent) => {
      e.stopPropagation()
      setCurrentImageIndex((prev) => (prev === 0 ? imageAssetUrls.length - 1 : prev - 1))
    }

    // Navigate to next media item
    const goToNext = (e: React.MouseEvent) => {
      e.stopPropagation()
      setCurrentImageIndex((prev) => (prev === imageAssetUrls.length - 1 ? 0 : prev + 1))
    }

    // Handle download for current file
    const handleDownload = (url: string, fileName: string) => {
      setIsDownloading(true)
      downloadFile(url, fileName, (errorMessage) => {
        toast({
          variant: 'destructive',
          title: 'Download failed',
          description: errorMessage,
        })
      }).finally(() => {
        setIsDownloading(false)
      })
    }

    return (
      <>
        <FileStackedCards
          fileInfoArray={fileInfoArray}
          imageAssetUrls={imageAssetUrls}
          className={className}
          onPreview={() => {
            setCurrentImageIndex(0)
            setShowPreview(true)
          }}
        />

        <FilePreviewDialog
          open={showPreview}
          onOpenChange={setShowPreview}
          fileInfoArray={fileInfoArray}
          imageAssetUrls={imageAssetUrls}
          currentIndex={currentImageIndex}
          onPrevious={goToPrevious}
          onNext={goToNext}
          isDownloading={isDownloading}
          onDownload={handleDownload}
        />
      </>
    )
  }

  // Handle UUID references
  if (isUuidReference) {
    return (
      <UuidReferenceBadge
        value={value}
        namespace={namespace}
        className={className}
        withTooltip={!!referenceData}
      />
    )
  }

  // Handle object references with reference_id
  if (typeof value === 'object' && 'reference_id' in value) {
    return (
      <ObjectReferenceBadge
        value={value}
        namespace={namespace}
        className={className}
        withTooltip={!!referenceData}
      />
    )
  }

  // Fallback: just show the raw value with the namespace
  return (
    <GenericBadge
      value={value}
      namespace={namespace}
      className={className}
    />
  )
}

export default ForeignKeyColumnViewer
