import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { useEntityData } from './EntityContext';

interface EntityFormProps {
  mode: 'create' | 'edit';
  onClose: () => void;
}

export const EntityForm: React.FC<EntityFormProps> = ({ mode, onClose }) => {
  const {
    entityName,
    columns,
    schema,
    selectedItem,
    createItem,
    updateItem
  } = useEntityData();

  const [formData, setFormData] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState('basic');

  // Group columns for tab organization
  const basicColumns = columns.filter(col =>
    !col.key.includes('_id') &&
    !col.key.includes('permission') &&
    !['id', 'reference_id', 'created_at', 'updated_at', 'version'].includes(col.key)
  ).slice(0, 10); // First 10 basic columns

  const relationshipColumns = columns.filter(col =>
    col.key.includes('_id') &&
    !['id', 'reference_id', 'created_by', 'updated_by'].includes(col.key)
  );

  const advancedColumns = columns.filter(col =>
    !basicColumns.includes(col) &&
    !relationshipColumns.includes(col) &&
    !['id', 'reference_id', 'created_at', 'updated_at', 'version', 'permission'].includes(col.key)
  );

  // Initialize form data with current values when editing
  useEffect(() => {
    if (mode === 'edit' && selectedItem) {
      const initialData: Record<string, any> = {};
      columns.forEach(column => {
        if (!['id', 'reference_id', 'created_at', 'updated_at', 'version', 'permission'].includes(column.key)) {
          initialData[column.key] = selectedItem[column.key];
        }
      });
      setFormData(initialData);
    } else {
      // In create mode, initialize with default values from schema
      const initialData: Record<string, any> = {};
      columns.forEach(column => {
        if (column.defaultValue && column.defaultValue !== 'null') {
          // Remove quotes if string default value
          let defaultValue = column.defaultValue;
          if (typeof defaultValue === 'string' && defaultValue.startsWith("'") && defaultValue.endsWith("'")) {
            defaultValue = defaultValue.slice(1, -1);
          }
          initialData[column.key] = defaultValue;
        } else if (column.type === 'boolean' || column.type === 'checkbox') {
          initialData[column.key] = false;
        }
      });
      setFormData(initialData);
    }
  }, [mode, selectedItem, columns]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validate required fields
      const validationErrors: Record<string, string> = {};
      columns.forEach(column => {
        if (!column.isNullable && !formData[column.key] &&
          !['id', 'reference_id', 'created_at', 'updated_at', 'version', 'permission'].includes(column.key) &&
          column.defaultValue === undefined) {
          validationErrors[column.key] = 'This field is required';
        }
      });

      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        setIsSubmitting(false);
        return;
      }

      if (mode === 'create') {
        await createItem(formData);
      } else {
        await updateItem(selectedItem.id || selectedItem.reference_id, formData);
      }

      onClose();
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle form input changes
  const handleChange = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    // Clear error for this field if it was previously set
    if (errors[key]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[key];
        return newErrors;
      });
    }
  };

  // Render the appropriate input for a column based on its type
  const renderInput = (column: any) => {
    const key = column.key;
    const value = formData[key] !== undefined ? formData[key] : '';
    const hasError = !!errors[key];

    // Standard text input for most types
    if (['string', 'label', 'varchar', 'char', 'name', 'email', 'url', 'password'].includes(column.type)) {
      const inputType =
        column.type === 'email' ? 'email' :
          column.type === 'password' ? 'password' :
            column.type === 'url' ? 'url' : 'text';

      return (
        <Input
          id={key}
          type={inputType}
          value={value || ''}
          onChange={(e) => handleChange(key, e.target.value)}
          className={hasError ? 'border-red-500' : ''}
        />
      );
    }

    // Text area for larger text fields
    if (['text', 'content', 'longtext', 'mediumtext'].includes(column.type)) {
      return (
        <Textarea
          id={key}
          value={value || ''}
          onChange={(e) => handleChange(key, e.target.value)}
          className={hasError ? 'border-red-500' : ''}
          rows={4}
        />
      );
    }

    // Numeric inputs
    if (['int', 'integer', 'number', 'float', 'double', 'decimal', 'measurement'].includes(column.type) ||
      (typeof column.type === 'string' && column.type.startsWith('int(')) ||
      (typeof column.type === 'string' && column.type.startsWith('decimal('))) {
      return (
        <Input
          id={key}
          type="number"
          value={value || ''}
          onChange={(e) => handleChange(key, e.target.value === '' ? '' : Number(e.target.value))}
          className={hasError ? 'border-red-500' : ''}
        />
      );
    }

    // Date picker for date types
    if (['date', 'datetime', 'timestamp'].includes(column.type)) {
      return (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !value && "text-muted-foreground",
                hasError ? 'border-red-500' : ''
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
              onSelect={(date) => handleChange(key, date)}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      );
    }

    // Boolean/checkbox inputs
    if (['boolean', 'checkbox'].includes(column.type)) {
      return (
        <div className="flex items-center space-x-2">
          <Switch
            id={key}
            checked={!!value}
            onCheckedChange={(checked) => handleChange(key, checked)}
          />
          <Label htmlFor={key} className="cursor-pointer">
            {checked ? 'Yes' : 'No'}
          </Label>
        </div>
      );
    }

    // Enum/Select inputs
    if (column.type === 'enum' && column.options) {
      return (
        <Select
          value={value?.toString() || ''}
          onValueChange={(val) => handleChange(key, val)}
        >
          <SelectTrigger className={hasError ? 'border-red-500' : ''}>
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

    // Foreign key / relationship inputs
    if (column.isForeignKey && column.key.endsWith('_id')) {
      // We would ideally fetch options for this relationship
      // For now, fallback to a simple input for the ID
      return (
        <Input
          id={key}
          value={value || ''}
          onChange={(e) => handleChange(key, e.target.value)}
          className={hasError ? 'border-red-500' : ''}
          placeholder="Enter ID"
        />
      );
    }

    // Default fallback for any other types
    return (
      <Input
        id={key}
        value={value || ''}
        onChange={(e) => handleChange(key, e.target.value)}
        className={hasError ? 'border-red-500' : ''}
      />
    );
  };

  return (
    <form onSubmit={handleSubmit}>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="basic">Basic Information</TabsTrigger>
          {relationshipColumns.length > 0 && (
            <TabsTrigger value="relationships">Relationships</TabsTrigger>
          )}
          {advancedColumns.length > 0 && (
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="basic" className="space-y-4">
          {basicColumns.map((column) => (
            <div key={column.key} className="space-y-2">
              <Label htmlFor={column.key} className="flex items-center">
                {column.name}
                {!column.isNullable && <span className="text-red-500 ml-1">*</span>}
              </Label>
              {renderInput(column)}
              {errors[column.key] && (
                <p className="text-red-500 text-sm">{errors[column.key]}</p>
              )}
            </div>
          ))}
        </TabsContent>

        {relationshipColumns.length > 0 && (
          <TabsContent value="relationships" className="space-y-4">
            {relationshipColumns.map((column) => (
              <div key={column.key} className="space-y-2">
                <Label htmlFor={column.key} className="flex items-center">
                  {column.name}
                  {!column.isNullable && <span className="text-red-500 ml-1">*</span>}
                </Label>
                {renderInput(column)}
                {errors[column.key] && (
                  <p className="text-red-500 text-sm">{errors[column.key]}</p>
                )}
              </div>
            ))}
          </TabsContent>
        )}

        {advancedColumns.length > 0 && (
          <TabsContent value="advanced" className="space-y-4">
            {advancedColumns.map((column) => (
              <div key={column.key} className="space-y-2">
                <Label htmlFor={column.key} className="flex items-center">
                  {column.name}
                  {!column.isNullable && <span className="text-red-500 ml-1">*</span>}
                </Label>
                {renderInput(column)}
                {errors[column.key] && (
                  <p className="text-red-500 text-sm">{errors[column.key]}</p>
                )}
              </div>
            ))}
          </TabsContent>
        )}
      </Tabs>

      <DialogFooter className="mt-6">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {mode === 'create' ? 'Create' : 'Update'}
        </Button>
      </DialogFooter>
    </form>
  );
};

export default EntityForm;
