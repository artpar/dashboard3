// hooks/usePermissionValue.ts
// hooks/useGroupData.ts
import { useEffect, useState } from 'react';
import { addPermission, getPermissionFlag, hasPermission, PermissionAction, PermissionScope, removePermission } from '@/features/entity/columns/PermissionTypes.ts';


export function usePermissionValue(
  initialValue: any,
  onChange: (value: number) => void
) {
  // Parse initial permission value
  const parsePermissionValue = (input: any): number => {
    if (typeof input === 'number') return input
    if (typeof input === 'string') {
      const parsed = parseInt(input, 10)
      return isNaN(parsed) ? 0 : parsed
    }
    return 0
  }

  const [permissionValue, setPermissionValue] = useState<number>(
    parsePermissionValue(initialValue)
  )

  // Update internal state when props change
  useEffect(() => {
    setPermissionValue(parsePermissionValue(initialValue))
  }, [initialValue])

  // Toggle a specific permission
  const togglePermission = (
    scope: PermissionScope,
    action: PermissionAction
  ) => {
    console.log('togglePermission', scope, action)
    const flag = getPermissionFlag(scope, action)
    const newValue = hasPermission(permissionValue, flag)
      ? removePermission(permissionValue, flag)
      : addPermission(permissionValue, flag)

    setPermissionValue(newValue)
    onChange(newValue)
  }

  // Toggle all permissions for a scope
  const toggleAllForScope = (scope: PermissionScope, enabled: boolean) => {
    let newValue = permissionValue

    Object.values(PermissionAction).forEach((action) => {
      const flag = getPermissionFlag(scope, action)
      newValue = enabled
        ? addPermission(newValue, flag)
        : removePermission(newValue, flag)
    })

    setPermissionValue(newValue)
    onChange(newValue)
  }

  // Handle preset selection
  const handlePresetChange = (presetValue: string) => {
    const newValue = parseInt(presetValue, 10)
    setPermissionValue(newValue)
    onChange(newValue)
  }

  return {
    permissionValue,
    togglePermission,
    toggleAllForScope,
    handlePresetChange,
  }
}
