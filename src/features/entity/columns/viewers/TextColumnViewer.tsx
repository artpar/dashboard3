// src/components/entity/columns/viewers/TextColumnViewer.tsx
import React from 'react'
import { formatText } from '../formatters'
import { ColumnViewerProps } from '../types'


/**
 * Component for displaying text values
 */
export const TextColumnViewer: React.FC<ColumnViewerProps> = ({
  value,
  column,
  className,
}) => {
  const displayValue = formatText(value)
  const stringValue = String(displayValue)

  return (
    <span className={className}>
      <textarea
        className='h-40 w-full rounded border border-black p-2 font-mono text-xs'
        defaultValue={stringValue}
      ></textarea>
    </span>
  )
}

export default TextColumnViewer
