// components/permission/components/PermissionScopeRow.tsx
import { Button } from '@/components/ui/button'
import { TableCell, TableRow } from '@/components/ui/table'
import {
  PERMISSION_COLORS,
  PERMISSION_EXPLANATIONS,
  PermissionAction,
  PermissionScope,
  getPermissionFlag,
  hasPermission,
} from '@/features/entity/columns/PermissionTypes.ts'
import { PermissionActionToggle } from '@/features/entity/components/permission/PermissionActionToggle'

interface PermissionScopeRowProps {
  scope: PermissionScope
  permissionValue: number
  togglePermission: (scope: PermissionScope, action: PermissionAction) => void
  toggleAllForScope?: (scope: PermissionScope, enabled: boolean) => void
  disabled?: boolean
  hideActions?: boolean
  title?: string
  description?: string
}

/**
 * Row component for a specific permission scope (Guest or User)
 * Displays the scope name, permission toggles, and action buttons
 */
export function PermissionScopeRow({
  scope,
  permissionValue,
  togglePermission,
  toggleAllForScope,
  disabled,
  hideActions,
  title,
  description,
}: PermissionScopeRowProps) {
  const colors = PERMISSION_COLORS[scope]
  const scopeTitle = title || scope
  const scopeDescription = description || (
    scope === PermissionScope.Guest
      ? 'Unauthenticated users'
      : scope === PermissionScope.User
      ? 'Authenticated users'
      : 'Users in the same group')

  return (
    <TableRow>
      <TableCell>
        <div className={`font-medium ${colors.text}`}>{scopeTitle}</div>
        <div className='text-muted-foreground text-xs'>{scopeDescription}</div>
      </TableCell>
      <TableCell>
        <div className='grid grid-cols-2 gap-y-2 grid-rows-3 gap-2'>
          {Object.values(PermissionAction).map((action) => {
            const flag = getPermissionFlag(scope, action)
            const isChecked = hasPermission(permissionValue, flag)
            const colors = PERMISSION_COLORS[scope]
            const explanationKey = `${scope}${action}` as keyof typeof PERMISSION_EXPLANATIONS
            const explanation = PERMISSION_EXPLANATIONS[explanationKey] || `${scope} can ${action}`
            
            return (
              <PermissionActionToggle
                key={action}
                scope={scope}
                action={action}
                isChecked={isChecked}
                onToggle={() => togglePermission(scope, action)}
                disabled={disabled}
                colors={{
                  selected: colors.selected,
                  text: colors.text,
                  border: colors.border
                }}
                explanation={explanation}
              />
            )
          })}
        </div>
      </TableCell>
      {!hideActions && toggleAllForScope && (
        <TableCell>
          <div className='flex items-center space-x-2'>
            <Button
              type='button'
              variant='outline'
              size='sm'
              onClick={() => toggleAllForScope(scope, true)}
              disabled={disabled}
              className={`h-8 text-xs ${colors.border}`}
            >
              Select All
            </Button>
            <Button
              type='button'
              variant='outline'
              size='sm'
              onClick={() => toggleAllForScope(scope, false)}
              disabled={disabled}
              className='h-8 text-xs'
            >
              Clear All
            </Button>
          </div>
        </TableCell>
      )}
    </TableRow>
  )
}
