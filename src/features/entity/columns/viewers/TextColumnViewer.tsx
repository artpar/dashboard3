// src/components/entity/columns/viewers/TextColumnViewer.tsx
import React from 'react'
import { formatText, shouldUseTextarea } from '../formatters'
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

  // Use textarea only for JSON or text with more than 8 lines
  if (shouldUseTextarea(value)) {
    return (
      <textarea
        className='h-40 w-full min-w-80 rounded border border-black p-2 font-mono text-xs'
        defaultValue={stringValue}
        readOnly
      ></textarea>
    )
  }

  // For shorter content (less than 100 chars), show it completely
  if (stringValue.length < 100) {
    return <div className={className}>{stringValue}</div>
  }

  // For medium-length content, show a summary
  return <div className={className}>{stringValue.substring(0, 100)}...</div>
}

export default TextColumnViewer
