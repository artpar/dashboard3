// components/AddEntityDialog.tsx
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X } from 'lucide-react';
import { EntityOption } from '../../hooks/useGroupData';

interface AddEntityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityType: string | null;
  entityOptions: EntityOption[];
  selectedEntities: EntityOption[];
  onSelectedEntitiesChange: (entities: EntityOption[]) => void;
  entityFilter: string;
  onEntityFilterChange: (filter: string) => void;
  onFilterSubmit: () => void;
  onAddEntities: () => void;
}

export function AddEntityDialog({
  open,
  onOpenChange,
  entityType,
  entityOptions,
  selectedEntities,
  onSelectedEntitiesChange,
  entityFilter,
  onEntityFilterChange,
  onFilterSubmit,
  onAddEntities
}: AddEntityDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add {entityType}</DialogTitle>
          <DialogDescription>
            Select entities to add to the group
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4 py-4'>
          <Input
            placeholder='Search...'
            value={entityFilter}
            onChange={(e) => {
              onEntityFilterChange(e.target.value);
              onFilterSubmit();
            }}
          />

          <Select
            value={selectedEntities.length > 0 ? 'selected' : ''}
            onValueChange={() => {}}
          >
            <SelectTrigger>
              <SelectValue
                placeholder={`${selectedEntities.length} entities selected`}
              />
            </SelectTrigger>
            <SelectContent>
              {entityOptions &&
                entityOptions.map((option) => (
                  <SelectItem
                    key={option.value}
                    value={option.value}
                    onSelect={() => {
                      if (!selectedEntities.some((e) => e.value === option.value)) {
                        onSelectedEntitiesChange([...selectedEntities, option]);
                      }
                    }}
                  >
                    {option.label}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>

          {selectedEntities.length > 0 && (
            <div className='mt-2 flex flex-wrap gap-1'>
              {selectedEntities.map((entity) => (
                <Badge
                  key={entity.value}
                  variant='secondary'
                  className='flex items-center gap-1'
                >
                  {entity.label}
                  <Button
                    variant='ghost'
                    size='sm'
                    className='h-4 w-4 p-0'
                    onClick={() =>
                      onSelectedEntitiesChange(
                        selectedEntities.filter((e) => e.value !== entity.value)
                      )
                    }
                  >
                    <span className='sr-only'>Remove</span>
                    <X className='h-3 w-3' />
                  </Button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant='outline'
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={onAddEntities}
            disabled={selectedEntities.length === 0}
          >
            Add
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}