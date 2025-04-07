import React from 'react';
import { TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Edit, Eye, MoreHorizontal, Trash2 } from 'lucide-react';

interface EntityTableActionsProps {
  item: any;
  onEdit: (item: any) => void;
  onDelete: (item: any) => void;
  onViewDetails: (item: any) => void;
  relations: any[];
}

/**
 * Component for rendering row action buttons/dropdown
 */
export const EntityTableActions: React.FC<EntityTableActionsProps> = ({
                                                                        item,
                                                                        onEdit,
                                                                        onDelete,
                                                                        onViewDetails,
                                                                        relations
                                                                      }) => {
  return (
    <TableCell className="text-right">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {/* View details option */}
          <DropdownMenuItem onClick={() => onViewDetails(item)}>
            <Eye className="mr-2 h-4 w-4" />
            View Details
          </DropdownMenuItem>

          {/* Standard CRUD operations */}
          <DropdownMenuItem onClick={() => onEdit(item)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => onDelete(item)}
            className="text-red-600"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>

          {/* Relations as submenus */}
          {relations.length > 0 && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  View Relations
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <pre className="text-xs p-2 max-h-60 overflow-auto">
                    {JSON.stringify(relations, null, 2)}
                  </pre>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </TableCell>
  );
};

export default EntityTableActions;
