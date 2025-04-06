import React from 'react';
import { format } from 'date-fns';
import { Edit, MoreHorizontal, Trash2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useEntityData } from './EntityContext';

export const EntityDataTable: React.FC = () => {
  const {
    data,
    columns,
    setSelectedItem,
    setShowEditDialog,
    setShowDeleteDialog,
    currentPage,
    pageSize,
  } = useEntityData();

  // Function to format cell value based on type
  const formatCellValue = (item: any, column: any) => {
    const value = item[column.key];

    if (value === null || value === undefined) {
      return '-';
    }

    // Handle different column types
    if (column.key === 'created_at' || column.key === 'updated_at') {
      try {
        return format(new Date(value), 'PPP');
      } catch (e) {
        return value;
      }
    }

    // Boolean values
    if (typeof value === 'boolean') {
      return value ? (
        <Badge variant="outline" className="bg-green-100">Yes</Badge>
      ) : (
        <Badge variant="outline" className="bg-red-100">No</Badge>
      );
    }

    // Status-like fields with common status values
    if (
      (column.key === 'status' || column.key.includes('status') || column.key.endsWith('_status')) &&
      typeof value === 'string'
    ) {
      const statusColors: { [key: string]: string } = {
        active: 'bg-green-100 text-green-800',
        inactive: 'bg-gray-100 text-gray-800',
        pending: 'bg-yellow-100 text-yellow-800',
        approved: 'bg-green-100 text-green-800',
        rejected: 'bg-red-100 text-red-800',
        completed: 'bg-blue-100 text-blue-800',
        failed: 'bg-red-100 text-red-800',
        paid: 'bg-green-100 text-green-800',
        unpaid: 'bg-red-100 text-red-800',
      };

      return (
        <Badge variant="outline" className={statusColors[value.toLowerCase()] || 'bg-gray-100'}>
          {value}
        </Badge>
      );
    }

    // Handle long text
    if (typeof value === 'string' && value.length > 50) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span>{value.substring(0, 50)}...</span>
            </TooltipTrigger>
            <TooltipContent className="max-w-md">
              <p>{value}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    // JSON or objects
    if (typeof value === 'object') {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span>[Object]</span>
            </TooltipTrigger>
            <TooltipContent className="max-w-md">
              <pre className="text-xs">{JSON.stringify(value, null, 2)}</pre>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    // Default case
    return value.toString();
  };

  // Handle edit action
  const handleEdit = (item: any) => {
    setSelectedItem(item);
    setShowEditDialog(true);
  };

  // Handle delete action
  const handleDelete = (item: any) => {
    setSelectedItem(item);
    setShowDeleteDialog(true);
  };

  // Get visible columns - limiting to keep UI clean
  const visibleColumns = columns
    .filter(col => !['reference_id', 'permission', 'created_by', 'updated_by'].includes(col.key))
    .slice(0, 5); // Show first 5 columns by default

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {visibleColumns.map((column) => (
              <TableHead key={column.key}>
                {column.name}
              </TableHead>
            ))}
            <TableHead>Created At</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={visibleColumns.length + 2} className="text-center py-6 text-muted-foreground">
                No data found
              </TableCell>
            </TableRow>
          ) : (
            data.map((item, index) => (
              <TableRow key={item.id || item.reference_id || index}>
                {visibleColumns.map((column) => (
                  <TableCell key={column.key}>
                    {formatCellValue(item, column)}
                  </TableCell>
                ))}
                <TableCell>
                  {formatCellValue(item, { key: 'created_at' })}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(item)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDelete(item)} className="text-red-600">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default EntityDataTable;
