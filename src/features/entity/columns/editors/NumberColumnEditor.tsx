// src/components/entity/columns/editors/NumberColumnEditor.tsx
import React from 'react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { ColumnEditorProps, ColumnType } from '../types'
import { getColumnType, getEditorPlaceholder } from '../utils'


/**
 * Component for editing numeric values
 */
export const NumberColumnEditor: React.FC<ColumnEditorProps> = ({
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

  // Convert value to numeric
  const numValue =
    value !== null && value !== undefined && value !== ''
      ? typeof value === 'string'
        ? parseFloat(value)
        : value
      : ''

  // Handle slider-based editors for ratings
  if (
    [ColumnType.Rating5, ColumnType.Rating10, ColumnType.Rating100].includes(
      columnType
    )
  ) {
    // Define max value based on rating type
    let max = 5
    if (columnType === ColumnType.Rating10) max = 10
    if (columnType === ColumnType.Rating100) max = 100

    // Default value for slider
    const sliderValue = numValue !== '' ? [numValue] : [0]

    return (
      <div className='space-y-2'>
        <div className='flex items-center space-x-4'>
          {/*<Slider*/}
          {/*  defaultValue={sliderValue}*/}
          {/*  max={max}*/}
          {/*  step={columnType === ColumnType.Rating100 ? 5 : 1}*/}
          {/*  onValueChange={(newValue) => onChange(newValue[0])}*/}
          {/*  disabled={disabled}*/}
          {/*  className={cn("flex-1", error && "border-red-500")}*/}
          {/*/>*/}
          <span className='w-12 text-center font-medium'>
            {numValue !== '' ? numValue : 0}
            {columnType === ColumnType.Rating100 && '%'}
          </span>
        </div>
        <Input
          type='number'
          value={numValue}
          onChange={(e) => {
            const val = e.target.value === '' ? '' : Number(e.target.value)
            onChange(val)
          }}
          onBlur={onBlur}
          min={0}
          max={max}
          step={columnType === ColumnType.Rating100 ? 5 : 1}
          placeholder={defaultPlaceholder}
          className={cn(error && 'border-red-500')}
          disabled={disabled}
        />
      </div>
    )
  }

  // For money inputs, add a currency symbol
  if (columnType === ColumnType.Money) {
    return (
      <div className='relative'>
        <span className='text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2'>
          $
        </span>
        <Input
          type='number'
          value={numValue}
          onChange={(e) => {
            const val = e.target.value === '' ? '' : Number(e.target.value)
            onChange(val)
          }}
          onBlur={onBlur}
          step='0.01'
          placeholder={defaultPlaceholder}
          className={cn('pl-8', error && 'border-red-500', className)}
          disabled={disabled}
        />
      </div>
    )
  }

  // For decimal numbers
  if (
    columnType === ColumnType.NumberFloat ||
    columnType === ColumnType.Latitude ||
    columnType === ColumnType.Longitude
  ) {
    return (
      <Input
        type='number'
        value={numValue}
        onChange={(e) => {
          const val = e.target.value === '' ? '' : Number(e.target.value)
          onChange(val)
        }}
        onBlur={onBlur}
        step='0.01'
        placeholder={defaultPlaceholder}
        className={cn(error && 'border-red-500', className)}
        disabled={disabled}
      />
    )
  }

  // Default number input for integers
  return (
    <Input
      type='number'
      value={numValue}
      onChange={(e) => {
        const val = e.target.value === '' ? '' : Number(e.target.value)
        onChange(val)
      }}
      onBlur={onBlur}
      step='1'
      placeholder={defaultPlaceholder}
      className={cn(error && 'border-red-500', className)}
      disabled={disabled}
    />
  )
}

export default NumberColumnEditor
