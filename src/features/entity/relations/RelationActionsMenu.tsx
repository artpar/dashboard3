// src/features/entity/components/relations/RelationActionsMenu.tsx
import React from 'react'
import { useNavigate } from '@tanstack/react-router'
import {
  CopyIcon,
  ExternalLinkIcon,
  MoreHorizontalIcon,
  PencilIcon,
  TrashIcon
} from 'lucide-react'
import { toast } from '@/hooks/use-toast.ts'
import { Button } from '@/components/ui/button.tsx'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu.tsx'
import { RelatedRecord } from './relations-utils.ts'

interface RelationActionsMenuProps {
  relatedEntityName: string
  record: RelatedRecord
}

/**
 * Dropdown menu with actions for a related record
 */
export function RelationActionsMenu({
                                      relatedEntityName,
                                      record
                                    }: RelationActionsMenuProps) {
  const navigate = useNavigate()

  const handleViewEntity = () => {
    navigate({ to: `/${relatedEntityName}/${record.reference_id}` })
  }

  const handleEditEntity = () => {
    navigate({ to: `/${relatedEntityName}/${record.reference_id}/edit` })
  }

  const handleCopyId = () => {
    navigator.clipboard.writeText(record.reference_id)
    toast({
      title: 'ID Copied',
      description: 'The record ID has been copied to your clipboard.',
      duration: 2000,
    })
  }

  // This would be implemented with a dialog confirmation in a real app
  const handleDeleteEntity = () => {
    toast({
      title: 'Delete Operation',
      description: 'This operation would delete the record (not implemented).',
      variant: 'destructive',
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="group-hover:opacity-100 opacity-0 transition-opacity h-8 w-8"
        >
          <MoreHorizontalIcon className="h-4 w-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[180px]">
        <DropdownMenuItem onClick={handleViewEntity}>
          <ExternalLinkIcon className="mr-2 h-4 w-4" />
          View Details
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleEditEntity}>
          <PencilIcon className="mr-2 h-4 w-4" />
          Edit Record
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleCopyId}>
          <CopyIcon className="mr-2 h-4 w-4" />
          Copy ID
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleDeleteEntity}
          className="text-red-600 focus:text-red-600"
        >
          <TrashIcon className="mr-2 h-4 w-4" />
          Delete Record
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
