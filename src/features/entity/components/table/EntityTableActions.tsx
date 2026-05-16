import React from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Edit, Eye, MoreHorizontal, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useEntityCollectionData } from '@/features/entity/hooks/useEntityCollectionData.tsx'
import { EntityRecord, getEntityId } from '@/features/entity/utils/entityIdentity'

type EntityTableItem = EntityRecord & Record<string, unknown>

interface EntityTableActionsProps {
  item: EntityTableItem
  onEdit: (item: EntityTableItem) => void
  onDelete: (item: EntityTableItem) => void
  onViewDetails: (item: EntityTableItem) => void
  relations: unknown[]
}

/**
 * Component for rendering row action buttons/dropdown
 */
export const EntityTableActions: React.FC<EntityTableActionsProps> = ({
  item,
  onEdit,
  onDelete,
  onViewDetails,
  relations,
}) => {
  const navigate = useNavigate()
  const { entityName } = useEntityCollectionData()

  const handleViewDetails = () => {
    const itemId = getEntityId(item)
    navigate({ to: `/${entityName}/$entityId`, params: { entityId: itemId } })
    // Also call the original handler for any additional logic
    onViewDetails(item)
  }

  const handleEditDetails = () => {
    const itemId = getEntityId(item)
    navigate({ to: `/${entityName}/$entityId/edit`, params: { entityId: itemId } })
    // Also call the original handler for any additional logic
    onEdit(item)
  }

  return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant='ghost' size='icon'>
            <MoreHorizontal className='h-4 w-4' />
            <span className='sr-only'>Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end'>
          {/* View details option */}
          <DropdownMenuItem onClick={handleViewDetails}>
            <Eye className='mr-2 h-4 w-4' />
            View Details
          </DropdownMenuItem>

          {/* Standard CRUD operations */}
          <DropdownMenuItem onClick={() => handleEditDetails()}>
            <Edit className='mr-2 h-4 w-4' />
            Edit
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => onDelete(item)}
            className='text-red-600'
          >
            <Trash2 className='mr-2 h-4 w-4' />
            Delete
          </DropdownMenuItem>

          {/* Relations as submenus */}
          {relations.length > 0 && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>View Relations</DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <pre className='max-h-60 overflow-auto p-2 text-xs'>
                    {JSON.stringify(relations, null, 2)}
                  </pre>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
  )
}

export default EntityTableActions
