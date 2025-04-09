// src/components/entity/columns/editors/BooleanColumnEditor.tsx
import React from 'react'
import { cn } from '@/lib/utils'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { ColumnEditorProps } from '../types'


/**
 * Component for editing boolean values
 */
export const BooleanColumnEditor: React.FC<ColumnEditorProps> = ({
  value,
  column,
  onChange,
  onBlur,
  className,
  error,
  disabled,
}) => {
  // Convert various representations to boolean
  const boolValue =
    value === true ||
    value === 1 ||
    value === '1' ||
    value === 'true' ||
    value === 'yes'

  return (
    <div className={cn('flex items-center space-x-2', className)}>
      <Switch
        id={column.ColumnName}
        checked={boolValue}
        onCheckedChange={(checked) => {
          onChange(checked)
          if (onBlur) onBlur()
        }}
        disabled={disabled}
        className={error ? 'border-red-500' : ''}
      />
      <Label htmlFor={column.ColumnName} className='cursor-pointer'>
        {boolValue ? 'Yes' : 'No'}
      </Label>
    </div>
  )
}

export default BooleanColumnEditor
