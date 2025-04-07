import React, { useState } from 'react'
import { Eye } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
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
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className='flex flex-wrap gap-1'>
          {/* Show summaries for each scope */}
          {summaries.map((summary) => {
            if (summary.isEmpty) return null

            const colors = PERMISSION_COLORS[summary.scope]

            return (
              <Badge
                key={summary.scope}
                variant='outline'
                className={`${colors.bg} ${colors.text} font-medium`}
              >
                {summary.scope}: {summary.granted}/{summary.total}
              </Badge>
            )
          })}

          {/* Show a badge when no permissions are set */}
          {!hasAnyPermissions && (
            <Badge variant='outline' className='bg-gray-100 text-gray-800'>
              No Permissions
            </Badge>
          )}

          {/* Show the preset name if it's not custom */}
          {presetName !== 'Custom' && (
            <Badge
              variant='outline'
              className='ml-1 bg-purple-100 text-purple-800'
            >
              {presetName}
            </Badge>
          )}
        </div>

        {/* Details dialog */}
        {showDetails && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant='ghost' size='icon' className='h-8 w-8'>
                <Eye className='h-4 w-4' />
                <span className='sr-only'>View Permissions</span>
              </Button>
            </DialogTrigger>
            <DialogContent className='max-w-xl'>
              <DialogHeader>
                <DialogTitle>Permission Details</DialogTitle>
              </DialogHeader>

              <div className='mt-4 space-y-4'>
                {/* Detail views for each scope */}
                {summaries.map((summary) => {
                  const colors = PERMISSION_COLORS[summary.scope]

                  return (
                    <div key={summary.scope} className='space-y-2'>
                      <h3
                        className={`flex items-center justify-between text-sm font-medium ${colors.text}`}
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
                    <p className='mt-1 text-sm'>
                      This is a predefined permission set.
                    </p>
                  </div>
                )}

                {/* Raw permission value */}
                <div className='text-muted-foreground mt-4 text-xs'>
                  <p>
                    Raw permission value:{' '}
                    <code className='font-mono'>{permissionValue}</code>
                  </p>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </>
  )
}
