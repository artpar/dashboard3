import React, { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import {
  findPermissionPresetName,
  getPermissionSummary,
  PERMISSION_COLORS,
} from './../PermissionTypes'

interface PermissionColumnViewerProps {
  value: number
  showDetails?: boolean
  className?: string
}

/**
 * Component for displaying permission values in a human-readable format
 */
export default function PermissionColumnViewer({
  value,
  showDetails = true,
  className = '',
}: PermissionColumnViewerProps) {
  const [dialogOpen, setDialogOpen] = useState(false)

  // Parse permission value
  const permissionValue =
    typeof value === 'number'
      ? value
      : typeof value === 'string'
        ? parseInt(value, 10)
        : 0

  if (isNaN(permissionValue)) {
    return <span className={className}>Invalid permission</span>
  }

  // Get preset name if this matches a predefined permission set
  const presetName = findPermissionPresetName(permissionValue)

  // Get visual summaries for each scope
  const summaries = getPermissionSummary(permissionValue)

  // Check if there are any permissions
  const hasAnyPermissions = summaries.some((s) => !s.isEmpty)

  return (
    <>
      <div
        className={`flex w-full flex-col items-center space-x-2 ${className}`}
      >
        {/* Detail views for each scope */}
        {summaries.map((summary) => {
          const colors = PERMISSION_COLORS[summary.scope]

          return (
            <div key={summary.scope} className='flex w-full flex-col space-y-2'>
              <h3
                className={`flex items-center justify-between text-sm font-medium ${colors.text} pt-4 `}
              >
                <span>{summary.scope} Permissions</span>
                <Badge
                  variant='outline'
                  className={`${colors.bg} ${colors.text}`}
                >
                  {summary.granted}/{summary.total}
                </Badge>
              </h3>

              {summary.isEmpty ? (
                <p className='text-muted-foreground text-sm italic'>
                  No {summary.scope.toLowerCase()} permissions granted
                </p>
              ) : (
                <div className='grid grid-cols-2 gap-2'>
                  {summary.actions.map((action) => (
                    <div
                      key={action}
                      className={`rounded-md px-3 py-2 text-sm ${colors.bg} ${colors.text}`}
                    >
                      {action}
                    </div>
                  ))}
                </div>
              )}

              <div className='relative h-2 w-full overflow-hidden rounded-full bg-gray-200'>
                <div
                  className={`absolute top-0 left-0 h-full ${colors.bg}`}
                  style={{ width: `${summary.percent}%` }}
                />
              </div>
            </div>
          )
        })}

        {/* Preset info box */}
        {presetName !== 'Custom' && (
          <div className='mt-4 rounded-md bg-purple-50 p-3 text-purple-800'>
            <p className='font-medium'>Preset: {presetName}</p>
            <p className='mt-1 text-sm'>This is a predefined permission set.</p>
          </div>
        )}

        {/* Raw permission value */}
        <div className='flex text-muted-foreground mt-4 text-xs'>
          <p>
            Raw permission value:{' '}
            <code className='font-mono'>{permissionValue}</code>
          </p>
        </div>
      </div>
    </>
  )
}
