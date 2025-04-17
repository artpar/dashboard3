// src/components/entity/columns/viewers/TextColumnViewer.tsx
import React from 'react'
import { formatText, shouldUseTextarea } from '../formatters'
import { ColumnViewerProps } from '../types'

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Checks if a string is a valid UUID
 */
const isUUID = (value: string): boolean => {
  return UUID_REGEX.test(value)
}

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

  // Check if the value is a UUID
  const isUuidValue = isUUID(stringValue)

  // Combine provided className with font-mono if UUID
  const displayClassName = isUuidValue
    ? `${className || ''} font-mono text-xs`
    : className

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
    return <div className={displayClassName}>{stringValue}</div>
  }

  // For medium-length content, show a summary
  return <div className={displayClassName}>{stringValue.substring(0, 100)}...</div>
}

export default TextColumnViewer
