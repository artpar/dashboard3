// components/EntityTable.tsx
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2 } from 'lucide-react';
import { PermissionFlag } from '../PermissionTypes';

interface EntityTableProps {
  table: any;
  objects: any[];
  onAddClick: () => void;
  onRemoveEntity: (tableName: string, object: any) => void;
  onTogglePermission: (object: any, permissionBit: number) => void;
}

export function EntityTable({
  table,
  objects,
  onAddClick,
  onRemoveEntity,
  onTogglePermission
}: EntityTableProps) {
  return (
    <Card key={table.table_name}>
      <CardHeader className='pb-2'>
        <div className='flex items-center justify-between'>
          <CardTitle className='text-sm'>
            {table.table_name}
            <Badge variant='outline' className='ml-2'>
              {objects.length}
            </Badge>
          </CardTitle>
          <Button
            variant='outline'
            size='sm'
            onClick={onAddClick}
          >
            <Plus className='mr-1 h-4 w-4' />
            Add
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {objects.length === 0 ? (
          <p className='text-muted-foreground text-sm italic'>
            No items
          </p>
        ) : (
          <Table className='sticky-header-table'>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Read</TableHead>
                <TableHead>Create</TableHead>
                <TableHead>Update</TableHead>
                <TableHead>Delete</TableHead>
                <TableHead>Execute</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {objects.map((object: any) => (
                <TableRow key={object.reference_id}>
                  <TableCell className='font-medium'>
                    {object.__label}
                  </TableCell>
                  <TableCell>
                    <Checkbox
                      checked={(object.permission & PermissionFlag.GroupRead) === PermissionFlag.GroupRead}
                      onCheckedChange={() => onTogglePermission(object, PermissionFlag.GroupRead)}
                      size='sm'
                    />
                  </TableCell>
                  <TableCell>
                    <Checkbox
                      checked={(object.permission & PermissionFlag.GroupCreate) === PermissionFlag.GroupCreate}
                      onCheckedChange={() => onTogglePermission(object, PermissionFlag.GroupCreate)}
                      size='sm'
                    />
                  </TableCell>
                  <TableCell>
                    <Checkbox
                      checked={(object.permission & PermissionFlag.GroupUpdate) === PermissionFlag.GroupUpdate}
                      onCheckedChange={() => onTogglePermission(object, PermissionFlag.GroupUpdate)}
                      size='sm'
                    />
                  </TableCell>
                  <TableCell>
                    <Checkbox
                      checked={(object.permission & PermissionFlag.GroupDelete) === PermissionFlag.GroupDelete}
                      onCheckedChange={() => onTogglePermission(object, PermissionFlag.GroupDelete)}
                      size='sm'
                    />
                  </TableCell>
                  <TableCell>
                    <Checkbox
                      checked={(object.permission & PermissionFlag.GroupExecute) === PermissionFlag.GroupExecute}
                      onCheckedChange={() => onTogglePermission(object, PermissionFlag.GroupExecute)}
                      size='sm'
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={() => onRemoveEntity(table.table_name, object)}
                    >
                      <Trash2 className='h-4 w-4' />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

