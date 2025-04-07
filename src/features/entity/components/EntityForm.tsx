import React, { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { CalendarIcon, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'

import { useEntityData } from '@/features/entity/hooks/useEntityData.tsx'

interface EntityFormProps {
  mode: 'create' | 'edit'
  onClose: () => void
}

export const EntityForm: React.FC<EntityFormProps> = ({ mode, onClose }) => {
  const { entityName, columns, schema, selectedItem, createItem, updateItem } =
    useEntityData()

  const [formData, setFormData] = useState<Record<string, any>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [activeTab, setActiveTab] = useState('basic')

  // Group columns for tab organization
  const basicColumns = columns
    .filter(
      (col) =>
        !col.key.includes('_id') &&
        !col.key.includes('permission') &&
        !['id', 'reference_id', 'created_at', 'updated_at', 'version'].includes(
          col.key
        ) &&
        !col.excludeFromApi &&
        col.type !== 'file.*' // File columns go to advanced tab
    )
    .slice(0, 10) // First 10 basic columns

  const relationshipColumns = columns.filter(
    (col) =>
      (col.key.includes('_id') || col.isForeignKey) &&
      !['id', 'reference_id', 'created_by', 'updated_by'].includes(col.key) &&
      !col.excludeFromApi
  )

  const advancedColumns = columns.filter(
    (col) =>
      !basicColumns.includes(col) &&
      !relationshipColumns.includes(col) &&
      ![
        'id',
        'reference_id',
        'created_at',
        'updated_at',
        'version',
        'permission',
      ].includes(col.key) &&
      !col.excludeFromApi &&
      (col.type === 'file.*' || !col.key.includes('_id'))
  )

  // Initialize form data with current values when editing
  useEffect(() => {
    if (mode === 'edit' && selectedItem) {
      const initialData: Record<string, any> = {}
      columns.forEach((column) => {
        if (
          ![
            'id',
            'reference_id',
            'created_at',
            'updated_at',
            'version',
            'permission',
          ].includes(column.key)
        ) {
          initialData[column.key] = selectedItem[column.key]
        }
      })
      setFormData(initialData)
    } else {
      // In create mode, initialize with default values from schema
      const initialData: Record<string, any> = {}
      columns.forEach((column) => {
        if (column.defaultValue && column.defaultValue !== 'null') {
          // Remove quotes if string default value
          let defaultValue = column.defaultValue
          if (
            typeof defaultValue === 'string' &&
            defaultValue.startsWith("'") &&
            defaultValue.endsWith("'")
          ) {
            defaultValue = defaultValue.slice(1, -1)
          }
          initialData[column.key] = defaultValue
        } else if (column.type === 'boolean' || column.type === 'checkbox') {
          initialData[column.key] = false
        }
      })
      setFormData(initialData)
    }
  }, [mode, selectedItem, columns])

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Validate required fields
      const validationErrors: Record<string, string> = {}
      columns.forEach((column) => {
        if (
          !column.isNullable &&
          !formData[column.key] &&
          ![
            'id',
            'reference_id',
            'created_at',
            'updated_at',
            'version',
            'permission',
          ].includes(column.key) &&
          column.defaultValue === undefined
        ) {
          validationErrors[column.key] = 'This field is required'
        }
      })

      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors)
        setIsSubmitting(false)
        return
      }

      if (mode === 'create') {
        await createItem(formData)
      } else {
        await updateItem(selectedItem.id || selectedItem.reference_id, formData)
      }

      onClose()
    } catch (error) {
      console.error('Form submission error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle form input changes
  const handleChange = (key: string, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }))
    // Clear error for this field if it was previously set
    if (errors[key]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[key]
        return newErrors
      })
    }
  }

  // Render the appropriate input for a column based on its type
  const renderInput = (column: any) => {
    const key = column.key
    const value = formData[key] !== undefined ? formData[key] : ''
    const hasError = !!errors[key]

    // Handle foreign keys with special selectors when possible
    if (
      column.isForeignKey &&
      column.foreignKeyData &&
      column.foreignKeyData.KeyName
    ) {
      // This would ideally show a selector with options from the related entity
      // For now, we'll show a simple input with a helper text
      return (
        <div className='space-y-1'>
          <Input
            id={key}
            value={value || ''}
            onChange={(e) => handleChange(key, e.target.value)}
            className={hasError ? 'border-red-500' : ''}
            placeholder={`Enter ${column.foreignKeyData.Namespace}.${column.foreignKeyData.KeyName} ID`}
          />
          <p className='text-muted-foreground text-xs'>
            References {column.foreignKeyData.Namespace}
          </p>
        </div>
      )
    }

    // File inputs
    if (
      column.type &&
      (column.type.startsWith('file.') || column.type === 'file')
    ) {
      // Get allowed file extensions from column type (e.g., file.png|jpg|jpeg)
      const fileTypeMatch = column.type.match(/file\.(.*)/)
      const fileTypes = fileTypeMatch ? fileTypeMatch[1] : ''
      const acceptValue = fileTypes
        ? fileTypes
            .split('|')
            .map((ext: string) => `.${ext}`)
            .join(',')
        : ''

      return (
        <div className='space-y-1'>
          <Input
            id={key}
            type='file'
            onChange={(e) => {
              // File handling would typically involve converting to base64 or similar
              // For demo purposes, we'll just store the file name
              if (e.target.files && e.target.files[0]) {
                const file = e.target.files[0]
                handleChange(key, file.name) // In production, handle the actual file upload
              }
            }}
            accept={acceptValue}
            className={hasError ? 'border-red-500' : ''}
          />
          {column.foreignKeyData && (
            <p className='text-muted-foreground text-xs'>
              Stored in {column.foreignKeyData.DataSource}/
              {column.foreignKeyData.Namespace}/{column.foreignKeyData.KeyName}
            </p>
          )}
        </div>
      )
    }

    // Standard text input for most types
    if (
      [
        'string',
        'label',
        'varchar',
        'char',
        'name',
        'email',
        'url',
        'password',
        'alias',
      ].includes(column.type)
    ) {
      const inputType =
        column.type === 'email'
          ? 'email'
          : column.type === 'password'
            ? 'password'
            : column.type === 'url'
              ? 'url'
              : 'text'

      return (
        <Input
          id={key}
          type={inputType}
          value={value || ''}
          onChange={(e) => handleChange(key, e.target.value)}
          className={hasError ? 'border-red-500' : ''}
          placeholder={column.columnDescription || ''}
        />
      )
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
          placeholder={column.columnDescription || ''}
        />
      )
    }

    // Numeric inputs
    if (
      [
        'int',
        'integer',
        'number',
        'float',
        'double',
        'decimal',
        'measurement',
      ].includes(column.type) ||
      (typeof column.dataType === 'string' &&
        column.dataType.startsWith('int(')) ||
      (typeof column.dataType === 'string' &&
        column.dataType.startsWith('decimal(')) ||
      (typeof column.dataType === 'string' && column.dataType === 'smallint') ||
      (typeof column.dataType === 'string' && column.dataType === 'INTEGER')
    ) {
      return (
        <Input
          id={key}
          type='number'
          value={value || ''}
          onChange={(e) =>
            handleChange(
              key,
              e.target.value === '' ? '' : Number(e.target.value)
            )
          }
          className={hasError ? 'border-red-500' : ''}
          placeholder={column.columnDescription || ''}
        />
      )
    }

    // Date picker for date types
    if (
      ['date', 'datetime', 'timestamp'].includes(column.type) ||
      (typeof column.dataType === 'string' && column.dataType === 'timestamp')
    ) {
      return (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant='outline'
              className={cn(
                'w-full justify-start text-left font-normal',
                !value && 'text-muted-foreground',
                hasError ? 'border-red-500' : ''
              )}
            >
              <CalendarIcon className='mr-2 h-4 w-4' />
              {value ? (
                format(new Date(value), 'PPP')
              ) : (
                <span>Pick a date</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className='w-auto p-0'>
            <Calendar
              mode='single'
              selected={value ? new Date(value) : undefined}
              onSelect={(date) => handleChange(key, date)}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      )
    }

    // Boolean/checkbox inputs
    if (['boolean', 'checkbox'].includes(column.type)) {
      return (
        <div className='flex items-center space-x-2'>
          <Switch
            id={key}
            checked={!!value}
            onCheckedChange={(checked) => handleChange(key, checked)}
          />
          <Label htmlFor={key} className='cursor-pointer'>
            {value ? 'Yes' : 'No'}
          </Label>
        </div>
      )
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
      )
    }

    // Default fallback for any other types
    return (
      <Input
        id={key}
        value={value || ''}
        onChange={(e) => handleChange(key, e.target.value)}
        className={hasError ? 'border-red-500' : ''}
        placeholder={column.columnDescription || ''}
      />
    )
  }

  return (
    <form onSubmit={handleSubmit}>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className='mb-4'>
          <TabsTrigger value='basic'>Basic Information</TabsTrigger>
          {relationshipColumns.length > 0 && (
            <TabsTrigger value='relationships'>Relationships</TabsTrigger>
          )}
          {advancedColumns.length > 0 && (
            <TabsTrigger value='advanced'>Advanced</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value='basic' className='space-y-4'>
          {basicColumns.map((column) => (
            <div key={column.key} className='space-y-2'>
              <Label htmlFor={column.key} className='flex items-center'>
                {column.name}
                {!column.isNullable && (
                  <span className='ml-1 text-red-500'>*</span>
                )}
              </Label>
              {renderInput(column)}
              {errors[column.key] && (
                <p className='text-sm text-red-500'>{errors[column.key]}</p>
              )}
            </div>
          ))}
        </TabsContent>

        {relationshipColumns.length > 0 && (
          <TabsContent value='relationships' className='space-y-4'>
            {relationshipColumns.map((column) => (
              <div key={column.key} className='space-y-2'>
                <Label htmlFor={column.key} className='flex items-center'>
                  {column.name}
                  {!column.isNullable && (
                    <span className='ml-1 text-red-500'>*</span>
                  )}
                </Label>
                {renderInput(column)}
                {errors[column.key] && (
                  <p className='text-sm text-red-500'>{errors[column.key]}</p>
                )}
              </div>
            ))}
          </TabsContent>
        )}

        {advancedColumns.length > 0 && (
          <TabsContent value='advanced' className='space-y-4'>
            {advancedColumns.map((column) => (
              <div key={column.key} className='space-y-2'>
                <Label htmlFor={column.key} className='flex items-center'>
                  {column.name}
                  {!column.isNullable && (
                    <span className='ml-1 text-red-500'>*</span>
                  )}
                </Label>
                {renderInput(column)}
                {errors[column.key] && (
                  <p className='text-sm text-red-500'>{errors[column.key]}</p>
                )}
              </div>
            ))}
          </TabsContent>
        )}
      </Tabs>

      <DialogFooter className='mt-6'>
        <Button type='button' variant='outline' onClick={onClose}>
          Cancel
        </Button>
        <Button type='submit' disabled={isSubmitting}>
          {isSubmitting && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
          {mode === 'create' ? 'Create' : 'Update'}
        </Button>
      </DialogFooter>
    </form>
  )
}

export default EntityForm
