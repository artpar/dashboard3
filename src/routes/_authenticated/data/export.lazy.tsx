import { createLazyFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { daptinClient } from '@/daptin'
import { EntityApiService } from '@/features/entity/services/EntityApiService'
import { useToast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Download, FileJson, FileSpreadsheet, Database } from 'lucide-react'

interface WorldEntity {
  reference_id: string
  table_name: string
}

function ExportPage() {
  const { toast } = useToast()
  const [selectedEntities, setSelectedEntities] = useState<string[]>([])
  const [format, setFormat] = useState<'json' | 'csv'>('json')
  const [exportAll, setExportAll] = useState(false)

  const { data: entities, isLoading } = useQuery({
    queryKey: ['world-entities-export'],
    queryFn: async () => {
      const response = await daptinClient.jsonApi.findAll('world', {
        'page[size]': '200',
      })
      return ((response.data || []) as WorldEntity[]).filter(
        (e) => !e.table_name.includes('_has_')
      )
    },
  })

  const exportMutation = useMutation({
    mutationFn: async () => {
      // Execute export_data action on world entity
      const tablesToExport = exportAll
        ? entities?.map(e => e.table_name) || []
        : selectedEntities

      if (tablesToExport.length === 0) {
        throw new Error('Please select at least one entity to export')
      }

      return EntityApiService.executeAction('world', 'export_data', {
        table_names: tablesToExport,
        format: format,
      })
    },
    onSuccess: (result) => {
      // Handle file download from action response
      if (Array.isArray(result)) {
        result.forEach((item: any) => {
          if (item.ResponseType === 'client.file.download') {
            const { content, contentType, name } = item.Attributes
            const binaryString = window.atob(content)
            const bytes = new Uint8Array(binaryString.length)
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i)
            }
            const blob = new Blob([bytes], { type: contentType })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = name
            document.body.appendChild(a)
            a.click()
            setTimeout(() => {
              document.body.removeChild(a)
              URL.revokeObjectURL(url)
            }, 100)
          }
        })
      }
      toast({ title: 'Export complete', description: 'Data exported successfully' })
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Export failed', description: error.message })
    },
  })

  const handleEntityToggle = (tableName: string) => {
    setSelectedEntities(prev =>
      prev.includes(tableName)
        ? prev.filter(e => e !== tableName)
        : [...prev, tableName]
    )
  }

  const handleSelectAll = () => {
    if (selectedEntities.length === entities?.length) {
      setSelectedEntities([])
    } else {
      setSelectedEntities(entities?.map(e => e.table_name) || [])
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Download className="h-6 w-6" />
          Export Data
        </h1>
        <p className="text-muted-foreground">
          Export entity data to JSON or CSV format
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Database className="h-5 w-5" />
                Select Entities
              </CardTitle>
              <CardDescription>
                Choose which entities to export
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="export-all"
                    checked={exportAll}
                    onCheckedChange={(checked) => setExportAll(checked === true)}
                  />
                  <Label htmlFor="export-all" className="font-medium">Export all entities</Label>
                </div>
                {!exportAll && (
                  <Button variant="outline" size="sm" onClick={handleSelectAll}>
                    {selectedEntities.length === entities?.length ? 'Deselect All' : 'Select All'}
                  </Button>
                )}
              </div>

              {isLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-8 w-full" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-96 overflow-y-auto border rounded-lg p-3">
                  {entities?.map((entity) => (
                    <div key={entity.reference_id} className="flex items-center gap-2">
                      <Checkbox
                        id={entity.table_name}
                        checked={exportAll || selectedEntities.includes(entity.table_name)}
                        disabled={exportAll}
                        onCheckedChange={() => handleEntityToggle(entity.table_name)}
                      />
                      <Label
                        htmlFor={entity.table_name}
                        className="text-sm cursor-pointer"
                      >
                        {entity.table_name}
                      </Label>
                    </div>
                  ))}
                </div>
              )}

              {!exportAll && selectedEntities.length > 0 && (
                <p className="text-sm text-muted-foreground mt-2">
                  {selectedEntities.length} entities selected
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Export Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Format</Label>
                <Select value={format} onValueChange={(v: 'json' | 'csv') => setFormat(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="json">
                      <span className="flex items-center gap-2">
                        <FileJson className="h-4 w-4" />
                        JSON
                      </span>
                    </SelectItem>
                    <SelectItem value="csv">
                      <span className="flex items-center gap-2">
                        <FileSpreadsheet className="h-4 w-4" />
                        CSV
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                className="w-full"
                onClick={() => exportMutation.mutate()}
                disabled={exportMutation.isPending || (!exportAll && selectedEntities.length === 0)}
              >
                {exportMutation.isPending ? 'Exporting...' : 'Export Data'}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Export</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => {
                  setExportAll(true)
                  setFormat('json')
                  setTimeout(() => exportMutation.mutate(), 100)
                }}
                disabled={exportMutation.isPending}
              >
                <FileJson className="h-4 w-4 mr-2" />
                Export All as JSON
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => {
                  setExportAll(true)
                  setFormat('csv')
                  setTimeout(() => exportMutation.mutate(), 100)
                }}
                disabled={exportMutation.isPending}
              >
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Export All as CSV
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export const Route = createLazyFileRoute('/_authenticated/data/export')({
  component: ExportPage,
})
