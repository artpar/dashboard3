// src/features/entity/components/detail-view/EntityViewHeader.tsx
import React from 'react'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

interface EntityViewHeaderProps {
  title: string
  entityItem: any
  subtitle?: string
  className?: string
  actions?: React.ReactNode
  metadata?: React.ReactNode
}

/**
 * Header component for the entity detail view
 */
export function EntityViewHeader({
                                   title,
                                   entityItem,
                                   subtitle,
                                   className,
                                   actions,
                                   metadata
                                 }: EntityViewHeaderProps) {
  // Function to get a suitable display title
  const getDisplayTitle = () => {
    // Try to get a meaningful title from common identifier fields
    const titleFields = ['name', 'title', 'label', 'display_name', 'reference_id']

    for (const field of titleFields) {
      if (entityItem && entityItem[field]) {
        return entityItem[field]
      }
    }

    // Fallback to reference_id or just the title
    return entityItem?.reference_id
      ? `${title} (${entityItem.reference_id.substring(0, 8)}...)`
      : title
  }

  const displayTitle = getDisplayTitle()

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{displayTitle}</h1>

          {subtitle && (
            <p className="text-muted-foreground mt-1 text-sm">
              {subtitle}
            </p>
          )}

          {metadata && (
            <div className="text-muted-foreground mt-2 text-xs">
              {metadata}
            </div>
          )}
        </div>

        {actions && (
          <div className="flex flex-shrink-0 items-center gap-2">
            {actions}
          </div>
        )}
      </div>

      <Separator />
    </div>
  )
}
