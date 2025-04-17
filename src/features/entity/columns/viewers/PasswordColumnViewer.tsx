// src/features/entity/columns/viewers/PasswordColumnViewer.tsx
import React from 'react'
import { ColumnViewerProps } from '../types'

/**
 * Component for displaying password values
 * Always masks the actual password value for security
 */
export const PasswordColumnViewer: React.FC<ColumnViewerProps> = ({
  value,
  className,
}) => {
  // If no value, show empty state
  if (!value) {
    return <div className={className}>—</div>
  }

  // Always display a masked value for security
  return (
    <div className={className}>
      <span className="text-muted-foreground">••••••••</span>
      <span className="ml-2 text-xs text-muted-foreground">[password hidden]</span>
    </div>
  )
}

export default PasswordColumnViewer
