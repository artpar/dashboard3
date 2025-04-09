// src/components/entity/columns/editors/TextColumnEditor.tsx
import React from 'react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ColumnEditorProps, ColumnType } from '../types'
import { getColumnType, getEditorPlaceholder } from '../utils'


/**
 * Component for editing text values
 */
export const TextColumnEditor: React.FC<ColumnEditorProps> = ({
  value,
  column,
  onChange,
  onBlur,
  className,
  error,
  disabled,
  placeholder,
}) => {
  const columnType = getColumnType(column)
  const defaultPlaceholder = placeholder || getEditorPlaceholder(column)

  // For long-form text content, use a textarea
  if (columnType === ColumnType.Content) {
    return (
      <Textarea
        id={column.ColumnName}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder={defaultPlaceholder}
        className={cn(error && 'border-red-500', className)}
        disabled={disabled}
        rows={4}
      />
    )
  }

  // For email inputs, use an email input type
  if (columnType === ColumnType.Email) {
    return (
      <Input
        id={column.ColumnName}
        type='email'
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder={defaultPlaceholder}
        className={cn(error && 'border-red-500', className)}
        disabled={disabled}
      />
    )
  }

  // For password inputs, use a password input type
  if (columnType === ColumnType.Password) {
    return (
      <Input
        id={column.ColumnName}
        type='password'
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder={defaultPlaceholder}
        className={cn(error && 'border-red-500', className)}
        disabled={disabled}
      />
    )
  }

  // For color inputs, use a color input type
  if (columnType === ColumnType.Color) {
    return (
      <div className='flex items-center space-x-2'>
        <Input
          id={column.ColumnName}
          type='color'
          value={value || '#000000'}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          className={cn('h-8 w-12 p-1', error && 'border-red-500', className)}
          disabled={disabled}
        />
        <Input
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          placeholder={defaultPlaceholder}
          className={cn(error && 'border-red-500')}
          disabled={disabled}
        />
      </div>
    )
  }

  // Default text input
  return (
    <Input
      id={column.ColumnName}
      type='text'
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      placeholder={defaultPlaceholder}
      className={cn(error && 'border-red-500', className)}
      disabled={disabled}
    />
  )
}

export default TextColumnEditor
