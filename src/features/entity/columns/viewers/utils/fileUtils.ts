import {
  File,
  FileText,
  Music,
  Image,
  Video,
  FileCode,
  FileSpreadsheet,
  FileArchive,
} from 'lucide-react'

export interface FileTypeInfo {
  category: 'image' | 'video' | 'audio' | 'pdf' | 'document' | 'spreadsheet' | 'code' | 'archive' | 'file'
  icon: any
  canPreview: boolean
  displayName: string
}

export const getFileTypeInfo = (fileData: any): FileTypeInfo => {
  if (!fileData || typeof fileData !== 'object' || !fileData.type) {
    return { category: 'file', icon: File, canPreview: false, displayName: 'File' }
  }
  
  const mimeType = fileData.type.toLowerCase()
  
  // Image files
  if (mimeType.startsWith('image/')) {
    return { category: 'image', icon: Image, canPreview: true, displayName: 'Image' }
  }
  
  // Video files
  if (mimeType.startsWith('video/')) {
    return { category: 'video', icon: Video, canPreview: true, displayName: 'Video' }
  }
  
  // Audio files
  if (mimeType.startsWith('audio/')) {
    return { category: 'audio', icon: Music, canPreview: true, displayName: 'Audio' }
  }
  
  // PDF files
  if (mimeType.includes('pdf')) {
    return { category: 'pdf', icon: FileText, canPreview: false, displayName: 'PDF' }
  }
  
  // Spreadsheet files
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel') || 
      mimeType.includes('csv') || fileData.name?.match(/\.(xlsx?|csv|ods)$/i)) {
    return { category: 'spreadsheet', icon: FileSpreadsheet, canPreview: false, displayName: 'Spreadsheet' }
  }
  
  // Code files
  if (mimeType.includes('javascript') || mimeType.includes('json') || 
      mimeType.includes('xml') || mimeType.includes('html') ||
      fileData.name?.match(/\.(js|jsx|ts|tsx|json|xml|html|css|py|java|cpp|c|h)$/i)) {
    return { category: 'code', icon: FileCode, canPreview: false, displayName: 'Code' }
  }
  
  // Archive files
  if (mimeType.includes('zip') || mimeType.includes('rar') || 
      mimeType.includes('tar') || mimeType.includes('gz') ||
      fileData.name?.match(/\.(zip|rar|tar|gz|7z|bz2)$/i)) {
    return { category: 'archive', icon: FileArchive, canPreview: false, displayName: 'Archive' }
  }
  
  // Word/Document files
  if (mimeType.includes('word') || mimeType.includes('document') ||
      mimeType.includes('text') || fileData.name?.match(/\.(docx?|odt|rtf|txt)$/i)) {
    return { category: 'document', icon: FileText, canPreview: false, displayName: 'Document' }
  }
  
  // Default
  return { category: 'file', icon: File, canPreview: false, displayName: 'File' }
}

export const downloadFile = async (
  url: string,
  fileName: string,
  onError: (message: string) => void
) => {
  try {
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(
        `Failed to download file: ${response.status} ${response.statusText}`
      )
    }

    const blob = await response.blob()
    const downloadUrl = window.URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    // Clean up the URL object
    setTimeout(() => window.URL.revokeObjectURL(downloadUrl), 100)
  } catch (error) {
    console.error('Error downloading file:', error)
    onError(error instanceof Error ? error.message : 'Failed to download file')
  }
}

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export interface ProcessedFileInfo {
  fileData: any
  typeInfo: FileTypeInfo
  fileName: string
  size: number | null
}

export const processFileInfo = (fileDataArray: any[]): ProcessedFileInfo[] => {
  return fileDataArray.map((fileData, index) => {
    const typeInfo = getFileTypeInfo(fileData)
    const fileName = typeof fileData === 'object' && fileData !== null && 'name' in fileData
      ? fileData.name
      : `${typeInfo.displayName} ${index + 1}`
    const size = typeof fileData === 'object' && fileData !== null && 'size' in fileData
      ? fileData.size
      : null
    return { fileData, typeInfo, fileName, size }
  })
}