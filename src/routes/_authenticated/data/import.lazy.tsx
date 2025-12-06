import { createLazyFileRoute } from '@tanstack/react-router'
import { useState, useCallback, useRef } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { daptinClient } from '@/daptin'
import { EntityApiService } from '@/features/entity/services/EntityApiService'
import { useToast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { Upload, FileUp, FileJson, FileSpreadsheet, File, X, AlertCircle, CheckCircle2 } from 'lucide-react'

interface WorldEntity {
  reference_id: string
  table_name: string
}

interface UploadedFile {
  file: File
  preview?: string[][]
  rowCount?: number
}

function ImportPage() {
  const { toast } = useToast()
  const [selectedEntity, setSelectedEntity] = useState<string>('')
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { data: entities, isLoading } = useQuery({
    queryKey: ['world-entities-import'],
    queryFn: async () => {
      const response = await daptinClient.jsonApi.findAll('world', {
        'page[size]': '200',
      })
      return ((response.data || []) as WorldEntity[]).filter(
        (e) => !e.table_name.includes('_has_')
      )
    },
  })

  const importMutation = useMutation({
    mutationFn: async () => {
      if (!uploadedFile || !selectedEntity) {
        throw new Error('Please select an entity and upload a file')
      }

      // Convert file to base64
      const reader = new FileReader()
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string
          // Extract base64 part from data URL
          const base64 = result.split(',')[1]
          resolve(base64)
        }
        reader.onerror = reject
      })
      reader.readAsDataURL(uploadedFile.file)
      const fileContent = await base64Promise

      // Determine format from file extension
      const ext = uploadedFile.file.name.split('.').pop()?.toLowerCase()
      let format = 'json'
      if (ext === 'csv') format = 'csv'
      else if (ext === 'xlsx' || ext === 'xls') format = 'xlsx'

      return EntityApiService.executeAction('world', 'import_data', {
        table_name: selectedEntity,
        file_content: fileContent,
        file_name: uploadedFile.file.name,
        format: format,
      })
    },
    onSuccess: (result) => {
      toast({ title: 'Import complete', description: 'Data imported successfully' })
      setUploadedFile(null)
      setSelectedEntity('')
      // Handle any response messages
      if (Array.isArray(result)) {
        result.forEach((item: any) => {
          if (item.ResponseType === 'client.notify') {
            toast({
              title: item.Attributes?.title || 'Notice',
              description: item.Attributes?.message,
            })
          }
        })
      }
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Import failed', description: error.message })
    },
  })

  const handleFiles = useCallback(async (files: FileList) => {
    const file = files[0]
    if (!file) return

    const validTypes = [
      'application/json',
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ]
    const ext = file.name.split('.').pop()?.toLowerCase()
    const validExts = ['json', 'csv', 'xlsx', 'xls']

    if (!validTypes.includes(file.type) && !validExts.includes(ext || '')) {
      toast({
        variant: 'destructive',
        title: 'Invalid file type',
        description: 'Please upload a JSON, CSV, or Excel file',
      })
      return
    }

    // Try to preview CSV/JSON files
    let preview: string[][] | undefined
    let rowCount: number | undefined

    if (ext === 'csv' || file.type === 'text/csv') {
      try {
        const text = await file.text()
        const lines = text.split('\n').filter(line => line.trim())
        rowCount = lines.length - 1 // Exclude header
        preview = lines.slice(0, 6).map(line => {
          // Simple CSV parsing (doesn't handle quoted commas)
          return line.split(',').map(cell => cell.trim().replace(/^"|"$/g, ''))
        })
      } catch {
        // Preview failed, continue without it
      }
    } else if (ext === 'json' || file.type === 'application/json') {
      try {
        const text = await file.text()
        const data = JSON.parse(text)
        if (Array.isArray(data)) {
          rowCount = data.length
          const headers = data.length > 0 ? Object.keys(data[0]) : []
          preview = [headers]
          data.slice(0, 5).forEach(row => {
            preview!.push(headers.map(h => String(row[h] ?? '')))
          })
        }
      } catch {
        // Preview failed, continue without it
      }
    }

    setUploadedFile({ file, preview, rowCount })
  }, [toast])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files)
    }
  }, [handleFiles])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase()
    if (ext === 'json') return <FileJson className="h-8 w-8 text-blue-500" />
    if (ext === 'csv') return <FileSpreadsheet className="h-8 w-8 text-green-500" />
    if (ext === 'xlsx' || ext === 'xls') return <FileSpreadsheet className="h-8 w-8 text-green-600" />
    return <File className="h-8 w-8 text-gray-500" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Upload className="h-6 w-6" />
          Import Data
        </h1>
        <p className="text-muted-foreground">
          Import data from CSV, Excel, or JSON files
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          {/* File Upload Area */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileUp className="h-5 w-5" />
                Upload File
              </CardTitle>
              <CardDescription>
                Drag and drop or click to upload a data file
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!uploadedFile ? (
                <div
                  className={cn(
                    'cursor-pointer rounded-lg border-2 border-dashed p-8 transition-colors',
                    isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-muted-foreground/50'
                  )}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="flex flex-col items-center justify-center gap-4">
                    <div className="flex gap-2">
                      <FileJson className="h-10 w-10 text-muted-foreground" />
                      <FileSpreadsheet className="h-10 w-10 text-muted-foreground" />
                    </div>
                    <div className="text-center">
                      <p className="font-medium">Drop your file here</p>
                      <p className="text-sm text-muted-foreground">
                        or click to browse (JSON, CSV, XLSX)
                      </p>
                    </div>
                  </div>
                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept=".json,.csv,.xlsx,.xls"
                    onChange={(e) => e.target.files && handleFiles(e.target.files)}
                    className="hidden"
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  {/* File Info */}
                  <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      {getFileIcon(uploadedFile.file.name)}
                      <div>
                        <p className="font-medium">{uploadedFile.file.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatFileSize(uploadedFile.file.size)}
                          {uploadedFile.rowCount !== undefined && ` • ${uploadedFile.rowCount} rows`}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setUploadedFile(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Preview Table */}
                  {uploadedFile.preview && uploadedFile.preview.length > 0 && (
                    <div className="border rounded-lg overflow-hidden">
                      <div className="text-sm font-medium p-2 bg-muted">Preview</div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-muted/50">
                            <tr>
                              {uploadedFile.preview[0].map((header, i) => (
                                <th key={i} className="px-3 py-2 text-left font-medium truncate max-w-32">
                                  {header}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {uploadedFile.preview.slice(1).map((row, i) => (
                              <tr key={i} className="border-t">
                                {row.map((cell, j) => (
                                  <td key={j} className="px-3 py-2 truncate max-w-32">
                                    {cell}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {uploadedFile.rowCount && uploadedFile.rowCount > 5 && (
                        <div className="text-sm text-muted-foreground p-2 bg-muted/50 text-center">
                          ... and {uploadedFile.rowCount - 5} more rows
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Import Options */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Import Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Target Entity</Label>
                {isLoading ? (
                  <Skeleton className="h-10 w-full" />
                ) : (
                  <Select value={selectedEntity} onValueChange={setSelectedEntity}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select entity..." />
                    </SelectTrigger>
                    <SelectContent>
                      {entities?.map((entity) => (
                        <SelectItem key={entity.reference_id} value={entity.table_name}>
                          {entity.table_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <Button
                className="w-full"
                onClick={() => importMutation.mutate()}
                disabled={importMutation.isPending || !uploadedFile || !selectedEntity}
              >
                {importMutation.isPending ? 'Importing...' : 'Import Data'}
              </Button>
            </CardContent>
          </Card>

          {/* Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Status</CardTitle>
            </CardHeader>
            <CardContent>
              {!uploadedFile && !selectedEntity && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm">Upload a file to get started</span>
                </div>
              )}
              {uploadedFile && !selectedEntity && (
                <div className="flex items-center gap-2 text-yellow-600">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm">Select a target entity</span>
                </div>
              )}
              {uploadedFile && selectedEntity && (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="text-sm">Ready to import</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Supported Formats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Supported Formats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <FileJson className="h-4 w-4 text-blue-500" />
                <span>JSON (array of objects)</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <FileSpreadsheet className="h-4 w-4 text-green-500" />
                <span>CSV (comma-separated)</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <FileSpreadsheet className="h-4 w-4 text-green-600" />
                <span>Excel (XLSX, XLS)</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export const Route = createLazyFileRoute('/_authenticated/data/import')({
  component: ImportPage,
})
