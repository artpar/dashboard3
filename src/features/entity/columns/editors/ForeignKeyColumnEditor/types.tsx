import { ColumnEditorProps } from '../../types'


// Extend ColumnEditorProps to include entity
export interface ForeignKeyColumnEditorProps extends ColumnEditorProps {
  entity?: any
}

// File-specific props
export interface FileReferenceEditorProps {
  value: any[]
  onChange: (value: any) => void
  onBlur?: () => void
  className?: string
  error?: string
  disabled?: boolean
  isImage: boolean
  column: any
  entity?: any
  assetUrl: string
}

// Individual file display props
export interface FileDisplayProps {
  files: any[]
  onRemoveFile: (index: number) => void
  onRemoveAllFiles: () => void
  isImage: boolean
  disabled?: boolean
  error?: string
  className?: string
  entity?: any
  column: any
  assetUrl: string
}

// File uploader props
export interface FileUploaderProps {
  onFilesSelected: (files: FileList) => void
  isImage: boolean
  disabled?: boolean
  isUploading: boolean
  uploadProgress: number
  uploadError: string | null
}

// Drop zone props
export interface DropZoneProps {
  onDrop: (files: FileList) => void
  children: React.ReactNode
  className?: string
  isImage: boolean
  disabled?: boolean
}

// Entity reference props
export interface EntityReferenceEditorProps {
  value: any
  onChange: (value: any) => void
  onBlur?: () => void
  className?: string
  error?: string
  disabled?: boolean
  placeholder?: string
  referencedEntity: string
  labelColumn: string | null
}

// Entity select props
export interface EntitySelectProps {
  value: any
  onChange: (value: any) => void
  onBlur?: () => void
  options: any[]
  isLoading: boolean
  error?: string
  disabled?: boolean
  placeholder?: string
  onSearchChange: (term: string) => void
  getItemLabel: (item: any) => string
  referencedEntity: string
}
