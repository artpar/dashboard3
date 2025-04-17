// src/features/entity/columns/editors/PasswordColumnEditor.tsx
import React, { useState } from 'react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Eye, EyeOff } from 'lucide-react'
import { ColumnEditorProps } from '../types'
import { getEditorPlaceholder } from '../utils'

/**
 * Component for editing password values with show/hide functionality
 */
export const PasswordColumnEditor: React.FC<ColumnEditorProps> = ({
  value,
  column,
  onChange,
  onBlur,
  className,
  error,
  disabled,
  placeholder,
}) => {
  const [showPassword, setShowPassword] = useState(false)
  const defaultPlaceholder = placeholder || getEditorPlaceholder(column)

  return (
    <div className="relative w-full">
      <Input
        id={column.ColumnName}
        type={showPassword ? 'text' : 'password'}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder={defaultPlaceholder}
        className={cn(error && 'border-red-500', className)}
        disabled={disabled}
      />
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
        onClick={() => setShowPassword(!showPassword)}
        tabIndex={-1}
      >
        {showPassword ? (
          <EyeOff className="h-4 w-4 text-muted-foreground" />
        ) : (
          <Eye className="h-4 w-4 text-muted-foreground" />
        )}
        <span className="sr-only">
          {showPassword ? 'Hide password' : 'Show password'}
        </span>
      </Button>
    </div>
  )
}

export default PasswordColumnEditor
