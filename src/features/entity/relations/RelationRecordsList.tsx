// src/features/entity/components/relations/RelationRecordsList.tsx
import React from 'react'
import { useNavigate } from '@tanstack/react-router'
import { CornerDownRightIcon, ExternalLinkIcon, Loader2Icon, XCircleIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge.tsx'
import { Button } from '@/components/ui/button.tsx'
import { Skeleton } from '@/components/ui/skeleton.tsx'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table.tsx'
import {
  RelatedRecord,
  getDisplayFields
} from './relations-utils.ts'
import { RelationActionsMenu } from './RelationActionsMenu.tsx'

interface RelationRecordsListProps {
  data: RelatedRecord[]
  isLoading: boolean
  isError: boolean
  error: Error | null
  relatedEntityName: string
  onRefresh: () => void
}

/**
 * Component to display list of related records
 */
export function RelationRecordsList({
                                      data,
                                      isLoading,
                                      isError,
                                      error,
                                      relatedEntityName,
                                      onRefresh,
                                    }: RelationRecordsListProps) {
  const navigate = useNavigate()

  // Handle viewing a related entity
  const handleViewEntity = (entityType: string, entityId: string) => {
    navigate({ to: `/${entityType}/${entityId}` })
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="space-y-3 py-4">
        <div className="flex items-center justify-center">
          <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
          <span>Loading related records...</span>
        </div>
        <div className="space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    )
  }

  // Show error state
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center space-y-3 py-6">
        <XCircleIcon className="h-10 w-10 text-red-400" />
        <p className="text-sm text-red-600">{error?.message || 'Failed to load related records'}</p>
        <Button variant="outline" size="sm" onClick={onRefresh}>
          Try Again
        </Button>
      </div>
    )
  }

  // Show empty state
  if (!data?.length) {
    return (
      <div className="flex flex-col items-center justify-center space-y-2 py-6">
        <CornerDownRightIcon className="h-10 w-10 text-muted-foreground/60" strokeWidth={1.5} />
        <p className="text-muted-foreground text-sm">No related records found</p>
      </div>
    )
  }

  // Show records
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-64">Identifier</TableHead>
            <TableHead>Details</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item) => {
            const displayFields = getDisplayFields(item)

            return (
              <TableRow key={item.reference_id} className="group">
                <TableCell className="font-mono">
                  <div className="flex flex-col space-y-1">
                    <Badge variant="outline" className="w-fit">
                      {item.reference_id.substring(0, 8)}...
                    </Badge>
                    <span className="text-muted-foreground text-xs">
                      {new Date(item.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-2">
                    {Object.entries(displayFields).map(([key, value]) => (
                      <div key={key} className="text-sm">
                        <span className="text-muted-foreground font-medium">
                          {key}:{' '}
                        </span>
                        <span>{String(value)}</span>
                      </div>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="group-hover:opacity-100 text-right">
                  <div className="flex items-center justify-end space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewEntity(relatedEntityName, item.reference_id)}
                      className="group-hover:opacity-100 opacity-0 transition-opacity"
                    >
                      <ExternalLinkIcon className="mr-1 h-3.5 w-3.5" />
                      View
                    </Button>

                    <RelationActionsMenu
                      relatedEntityName={relatedEntityName}
                      record={item}
                    />
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>

      {/* Load more button - uncomment when implementing pagination
      <div className="flex items-center justify-center p-2 border-t">
        <Button variant="ghost" size="sm">
          Load More Records
        </Button>
      </div>
      */}
    </div>
  )
}
