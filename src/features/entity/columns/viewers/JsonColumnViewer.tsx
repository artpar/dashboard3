// src/features/entity/columns/viewers/JsonColumnViewer.tsx
import React, { useState } from 'react'
// Import syntax highlighting libraries
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vs, vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { cn } from '@/lib/utils'
import { ColumnViewerProps } from '../types'


/**
 * Component for displaying JSON values with syntax highlighting directly in the table cell
 */
export const JsonColumnViewer: React.FC<ColumnViewerProps> = ({
  value,
  className,
}) => {
  const [viewHeight, setViewHeight] = useState(158)
  const [isDarkTheme, setIsDarkTheme] = useState(false)

  // If the value is null or undefined
  if (value === null || value === undefined) {
    return <span className={className}>-</span>
  }

  // Parse JSON if it's a string
  let jsonValue: any
  let jsonString: string
  let isArray = false
  let objectSize = 0

  try {
    jsonValue = typeof value === 'string' ? JSON.parse(value) : value
    jsonString = JSON.stringify(jsonValue, null, 2)
    isArray = Array.isArray(jsonValue)
    objectSize = isArray ? jsonValue.length : Object.keys(jsonValue).length
  } catch (error) {
    console.error('Error parsing JSON:', error)
    return <span className={className}>{String(value)}</span>
  }
  return (
    <div className={cn('w-full max-w-[600px] overflow-hidden text-wrap', className)}>
      {/* Expanded view with tabs and controls */}
      {
        <div className='rounded-md border'>
          <div
            className={cn(
              'overflow-auto',
              'bg-background'
            )}
            style={{ height: `${viewHeight}px` }}
          >
            <SyntaxHighlighter
              language='json'
              style={isDarkTheme ? vscDarkPlus : vs}
              wrapLines={true}
              customStyle={{
                margin: 0,
                height: '100%',
                textWrap: 'normal',
                fontSize: '0.85rem',
                backgroundColor: 'transparent',
              }}
              showLineNumbers={true}
            >
              {jsonString}
            </SyntaxHighlighter>
          </div>
        </div>
      }
    </div>
  )
}

export default JsonColumnViewer
