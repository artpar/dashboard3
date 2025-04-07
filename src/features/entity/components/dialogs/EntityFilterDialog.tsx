import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { X } from 'lucide-react';
import { ColumnDefinition } from '../hooks/useEntityColumns';

interface EntityFilterDialogProps {
  open: boolean;
  onClose: () => void;
  columns: ColumnDefinition[];
  filters: Record<string, any>;
  onApplyFilters: (filters: Record<string, any>) => void;
}

/**
 * Component for filtering entity data
 */
export const EntityFilterDialog: React.FC<EntityFilterDialogProps> = ({
                                                                        open,
                                                                        onClose,
                                                                        columns,
                                                                        filters,
                                                                        onApplyFilters,
                                                                      }) => {
  const [localFilters, setLocalFilters] = useState<Record<string, any>>(filters);

  // Reset local filters when dialog opens
  useEffect(() => {
    if (open) {
      setLocalFilters({ ...filters });
    }
  }, [open, filters]);

  // Handle input change
  const handleFilterChange = (key: string, value: any) => {
    setLocalFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Clear a single filter
  const clearFilter = (key: string) => {
    setLocalFilters(prev => {
      const newFilters = { ...prev };
      delete newFilters[key];
      return newFilters;
    });
  };

  // Clear all filters
  const clearAllFilters = () => {
    setLocalFilters({});
  };

  // Apply filters and close dialog
  const handleApply = () => {
    onApplyFilters(localFilters);
    onClose();
  };

  // Get filterable columns (exclude audit columns and certain types)
  const filterableColumns = columns.filter(col =>
    !['id', 'reference_id', 'created_at', 'updated_at', 'permission'].includes(col.ColumnName)
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Filter Data</DialogTitle>
          <DialogDescription>
            Set criteria to filter the data table.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {Object.keys(localFilters).length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {Object.entries(localFilters).map(([key, value]) => {
                if (value !== undefined && value !== '') {
                  const column = columns.find(col => col.ColumnName === key);
                  return (
                    <div
                      key={key}
                      className="flex items-center bg-muted px-2 py-1 rounded-md text-sm"
                    >
                      <span>{column?.name || key}: {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : value}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-4 w-4 ml-1"
                        onClick={() => clearFilter(key)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  );
                }
                return null;
              })}
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground text-xs"
                onClick={clearAllFilters}
              >
                Clear all
              </Button>
            </div>
          )}

          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-4">
            {filterableColumns.map(column => (
              <div key={column.ColumnName} className="grid grid-cols-4 items-center gap-2">
                <Label htmlFor={`filter-${column.ColumnName}`} className="text-right">
                  {column.name}
                </Label>

                {(() => {
                  // Render appropriate input based on column type

                  // Boolean columns
                  if (column.type === 'boolean' || column.type === 'checkbox') {
                    return (
                      <div className="col-span-3 flex items-center space-x-2">
                        <Switch
                          id={`filter-${column.ColumnName}`}
                          checked={!!localFilters[column.ColumnName]}
                          onCheckedChange={(checked) => handleFilterChange(column.ColumnName, checked)}
                        />
                        <Label htmlFor={`filter-${column.ColumnName}`}>
                          {localFilters[column.ColumnName] ? 'Yes' : 'No'}
                        </Label>
                      </div>
                    );
                  }

                  // Enum/select columns
                  if (column.type === 'enum' && column.options) {
                    return (
                      <div className="col-span-3">
                        <Select
                          value={localFilters[column.ColumnName] || ''}
                          onValueChange={(value) => handleFilterChange(column.ColumnName, value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={`Select ${column.name}`} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">Any</SelectItem>
                            {column.options.map((option: any) => (
                              <SelectItem key={option.value} value={option.value.toString()}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    );
                  }

                  // Default text input for other types
                  return (
                    <Input
                      id={`filter-${column.ColumnName}`}
                      className="col-span-3"
                      placeholder={`Filter by ${column.name}`}
                      value={localFilters[column.ColumnName] || ''}
                      onChange={(e) => handleFilterChange(column.ColumnName, e.target.value)}
                    />
                  );
                })()}
              </div>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleApply}>
            Apply Filters
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EntityFilterDialog;
