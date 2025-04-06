import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon, FilterX, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { useEntityData } from './EntityContext';

export const EntityFilterDialog: React.FC = () => {
  const {
    entityName,
    columns,
    filters,
    setFilters,
    showFilterDialog,
    setShowFilterDialog,
    refresh
  } = useEntityData();

  const [filterData, setFilterData] = useState<Record<string, any>>({});
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [isApplying, setIsApplying] = useState(false);

  // Initialize filter data when dialog opens
  useEffect(() => {
    if (showFilterDialog) {
      setFilterData(filters);
      setSelectedColumns(Object.keys(filters));
    }
  }, [showFilterDialog, filters]);

  // Handle adding a new filter column
  const handleAddColumn = (column: string) => {
    if (!selectedColumns.includes(column)) {
      setSelectedColumns([...selectedColumns, column]);
    }
  };

  // Handle removing a filter column
  const handleRemoveColumn = (column: string) => {
    setSelectedColumns(selectedColumns.filter(col => col !== column));
    setFilterData(prev => {
      const newData = { ...prev };
      delete newData[column];
      return newData;
    });
  };

  // Handle filter value change
  const handleFilterChange = (column: string, value: any) => {
    setFilterData(prev => ({ ...prev, [column]: value }));
  };

  // Apply filters
  const handleApplyFilters = () => {
    setIsApplying(true);

    // Remove empty/undefined values
    const cleanedFilters = Object.fromEntries(
      Object.entries(filterData)
        .filter(([key, value]) => selectedColumns.includes(key) && value !== undefined && value !== '')
    );

    setFilters(cleanedFilters);
    setShowFilterDialog(false);
    refresh();
    setIsApplying(false);
  };

  // Clear all filters
  const handleClearFilters = () => {
    setFilterData({});
    setSelectedColumns([]);
    setFilters({});
    setShowFilterDialog(false);
    refresh();
  };

  // Filter for columns that make sense to filter by
  const filterableColumns = columns.filter(col =>
    !['id', 'reference_id', 'permission', 'version'].includes(col.key)
  );

  // Render the appropriate filter input based on column type
  const renderFilterInput = (column: any) => {
    const key = column.key;
    const value = filterData[key];

    // Text-based filters
    if (['string', 'label', 'varchar', 'char', 'name', 'email', 'url', 'text', 'content'].includes(column.type)) {
      return (
        <Input
          placeholder={`Filter by ${column.name}`}
          value={value || ''}
          onChange={(e) => handleFilterChange(key, e.target.value)}
          className="w-full"
        />
      );
    }

    // Numeric filters
    if (['int', 'integer', 'number', 'float', 'double', 'decimal', 'measurement'].includes(column.type) ||
      (typeof column.type === 'string' && column.type.startsWith('int(')) ||
      (typeof column.type === 'string' && column.type.startsWith('decimal('))) {
      return (
        <Input
          type="number"
          placeholder={`Filter by ${column.name}`}
          value={value || ''}
          onChange={(e) => handleFilterChange(key, e.target.value === '' ? '' : Number(e.target.value))}
          className="w-full"
        />
      );
    }

    // Date filters
    if (['date', 'datetime', 'timestamp'].includes(column.type)) {
      return (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !value && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {value ? format(new Date(value), 'PPP') : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={value ? new Date(value) : undefined}
              onSelect={(date) => handleFilterChange(key, date)}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      );
    }

    // Boolean filters
    if (['boolean', 'checkbox'].includes(column.type)) {
      return (
        <div className="flex items-center space-x-2">
          <Switch
            checked={!!value}
            onCheckedChange={(checked) => handleFilterChange(key, checked)}
          />
          <span>{value ? 'Yes' : 'No'}</span>
        </div>
      );
    }

    // Enum/Select filters
    if (column.type === 'enum' && column.options) {
      return (
        <Select
          value={value?.toString() || ''}
          onValueChange={(val) => handleFilterChange(key, val)}
        >
          <SelectTrigger>
            <SelectValue placeholder={`Select ${column.name}`} />
          </SelectTrigger>
          <SelectContent>
            {column.options.map((option: any) => (
              <SelectItem key={option.value} value={option.value.toString()}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    // Default fallback
    return (
      <Input
        placeholder={`Filter by ${column.name}`}
        value={value || ''}
        onChange={(e) => handleFilterChange(key, e.target.value)}
        className="w-full"
      />
    );
  };

  return (
    <Dialog open={showFilterDialog} onOpenChange={setShowFilterDialog}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Filter {entityName}</DialogTitle>
          <DialogDescription>
            Add filters to narrow down results. Select columns to filter by and set filter values.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {/* Column selector */}
          <div className="mb-6">
            <Label htmlFor="column-select">Add filter column</Label>
            <div className="flex space-x-2 mt-1">
              <Select
                onValueChange={handleAddColumn}
                value=""
              >
                <SelectTrigger id="column-select" className="flex-1">
                  <SelectValue placeholder="Select column to filter" />
                </SelectTrigger>
                <SelectContent>
                  {filterableColumns
                    .filter(col => !selectedColumns.includes(col.key))
                    .map(column => (
                      <SelectItem key={column.key} value={column.key}>
                        {column.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Active filters */}
          <div className="space-y-4">
            {selectedColumns.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                No filters selected. Select columns above to add filters.
              </div>
            ) : (
              selectedColumns.map(columnKey => {
                const column = filterableColumns.find(col => col.key === columnKey);
                if (!column) return null;

                return (
                  <div key={columnKey} className="p-4 border rounded-md">
                    <div className="flex justify-between items-center mb-2">
                      <Label htmlFor={`filter-${columnKey}`} className="font-medium">
                        {column.name}
                      </Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveColumn(columnKey)}
                        className="h-8 w-8 p-0"
                      >
                        <FilterX className="h-4 w-4" />
                      </Button>
                    </div>
                    <div id={`filter-${columnKey}`}>
                      {renderFilterInput(column)}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <DialogFooter className="space-x-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleClearFilters}
          >
            Clear Filters
          </Button>
          <Button
            type="button"
            onClick={handleApplyFilters}
            disabled={isApplying}
          >
            {isApplying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Apply Filters
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EntityFilterDialog;
