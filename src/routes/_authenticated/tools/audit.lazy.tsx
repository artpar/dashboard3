import { createLazyFileRoute, useSearch } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { daptinClient } from '@/daptin'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  History,
  Search,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Eye,
  User,
  Calendar,
} from 'lucide-react'

interface AuditLog {
  reference_id: string
  entity_name: string
  action_type: string
  user_account_id: string
  row_reference_id: string
  previous_state: string
  new_state: string
  created_at: string
}

interface WorldEntity {
  reference_id: string
  table_name: string
}

function AuditPage() {
  const searchParams = useSearch({ strict: false }) as { entity?: string }
  const [search, setSearch] = useState('')
  const [entityFilter, setEntityFilter] = useState<string>(searchParams?.entity || '')
  const [actionFilter, setActionFilter] = useState<string>('')
  const [page, setPage] = useState(1)
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)
  const pageSize = 25

  // Update filter when URL param changes
  useEffect(() => {
    if (searchParams?.entity) {
      setEntityFilter(searchParams.entity)
    }
  }, [searchParams?.entity])

  const { data: entities } = useQuery({
    queryKey: ['world-entities-audit'],
    queryFn: async () => {
      const response = await daptinClient.jsonApi.findAll('world', {
        'page[size]': '200',
      })
      return ((response.data || []) as WorldEntity[]).filter(
        (e) => !e.table_name.includes('_has_')
      )
    },
  })

  const { data: auditData, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['audit-logs', page, entityFilter, actionFilter, search],
    queryFn: async () => {
      const params: Record<string, string> = {
        'page[size]': String(pageSize),
        'page[number]': String(page),
        'sort': '-created_at',
      }

      // Build filters
      const filters: string[] = []
      if (entityFilter) {
        filters.push(`entity_name eq '${entityFilter}'`)
      }
      if (actionFilter) {
        filters.push(`action_type eq '${actionFilter}'`)
      }
      if (search) {
        filters.push(`row_reference_id contains '${search}'`)
      }
      if (filters.length > 0) {
        params.filter = filters.join(' and ')
      }

      const response = await daptinClient.jsonApi.findAll('audit_log', params)
      return {
        logs: (response.data || []) as AuditLog[],
        total: (response.meta as any)?.total_count || 0,
      }
    },
  })

  const getActionBadge = (action: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      create: 'default',
      update: 'secondary',
      delete: 'destructive',
      execute: 'outline',
    }
    return (
      <Badge variant={variants[action?.toLowerCase()] || 'secondary'}>
        {action || 'unknown'}
      </Badge>
    )
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-'
    const date = new Date(dateStr)
    return date.toLocaleString()
  }

  const parseJsonSafe = (str: string) => {
    if (!str) return null
    try {
      return JSON.parse(str)
    } catch {
      return str
    }
  }

  const totalPages = Math.ceil((auditData?.total || 0) / pageSize)

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <History className="h-6 w-6" />
          Audit Logs
        </h1>
        <p className="text-muted-foreground">
          Track all data changes and system events
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Event Log</CardTitle>
              <CardDescription>
                {auditData?.total || 0} total events
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className={`h-4 w-4 mr-1 ${isFetching ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex gap-4 mb-4 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by reference ID..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="pl-9"
              />
            </div>
            <div className="w-48">
              <Select value={entityFilter || '__all__'} onValueChange={(v) => { setEntityFilter(v === '__all__' ? '' : v); setPage(1); }}>
                <SelectTrigger>
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="All entities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All entities</SelectItem>
                  {entities?.map((e) => (
                    <SelectItem key={e.reference_id} value={e.table_name}>
                      {e.table_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-40">
              <Select value={actionFilter || '__all__'} onValueChange={(v) => { setActionFilter(v === '__all__' ? '' : v); setPage(1); }}>
                <SelectTrigger>
                  <SelectValue placeholder="All actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All actions</SelectItem>
                  <SelectItem value="create">Create</SelectItem>
                  <SelectItem value="update">Update</SelectItem>
                  <SelectItem value="delete">Delete</SelectItem>
                  <SelectItem value="execute">Execute</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-40">Time</TableHead>
                  <TableHead className="w-32">Entity</TableHead>
                  <TableHead className="w-24">Action</TableHead>
                  <TableHead>Reference ID</TableHead>
                  <TableHead className="w-20">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 10 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                    </TableRow>
                  ))
                ) : auditData?.logs?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      No audit logs found
                    </TableCell>
                  </TableRow>
                ) : (
                  auditData?.logs?.map((log) => (
                    <TableRow key={log.reference_id}>
                      <TableCell className="text-sm">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {formatDate(log.created_at)}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {log.entity_name}
                      </TableCell>
                      <TableCell>
                        {getActionBadge(log.action_type)}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {log.row_reference_id || '-'}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setSelectedLog(log)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Audit Log Details
              {selectedLog && getActionBadge(selectedLog.action_type)}
            </DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <ScrollArea className="max-h-[60vh]">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-muted-foreground">Entity</Label>
                    <p className="font-mono">{selectedLog.entity_name}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Action</Label>
                    <p>{selectedLog.action_type}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Row Reference</Label>
                    <p className="font-mono text-sm">{selectedLog.row_reference_id || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Timestamp</Label>
                    <p className="text-sm">{formatDate(selectedLog.created_at)}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground flex items-center gap-1">
                      <User className="h-3 w-3" />
                      User
                    </Label>
                    <p className="font-mono text-sm">{selectedLog.user_account_id || '-'}</p>
                  </div>
                </div>

                {selectedLog.previous_state && (
                  <div>
                    <Label className="text-sm text-muted-foreground">Previous State</Label>
                    <pre className="mt-1 p-3 bg-muted rounded-lg text-xs overflow-auto max-h-48 font-mono">
                      {JSON.stringify(parseJsonSafe(selectedLog.previous_state), null, 2)}
                    </pre>
                  </div>
                )}

                {selectedLog.new_state && (
                  <div>
                    <Label className="text-sm text-muted-foreground">New State</Label>
                    <pre className="mt-1 p-3 bg-muted rounded-lg text-xs overflow-auto max-h-48 font-mono">
                      {JSON.stringify(parseJsonSafe(selectedLog.new_state), null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export const Route = createLazyFileRoute('/_authenticated/tools/audit')({
  component: AuditPage,
})
