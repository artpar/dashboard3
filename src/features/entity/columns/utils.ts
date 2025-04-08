// src/components/entity/columns/utils.ts
// src/components/entity/columns/utils/permissionUtils.ts
import { getPermissionFlag, hasPermission, PermissionAction, PermissionPresets, PermissionScope } from './PermissionTypes';
import { ColumnDefinition, ColumnType } from './types';


/**
 * Get the appropriate ColumnType for a column
 */
export function getColumnType(column: ColumnDefinition): ColumnType {
  if (!column) return ColumnType.Unknown

  if (column.ColumnName === 'reference_id') {
    return ColumnType.Id
  }

  // Handle special cases
  if (column.IsForeignKey || column.ColumnName.endsWith('_id')) {
    return ColumnType.ForeignKey
  }

  // Handle special cases
  if (column.ColumnName === 'permission') {
    return ColumnType.Permission
  }

  // Try to map directly first
  const directType = column.ColumnType as ColumnType
  if (Object.values(ColumnType).includes(directType)) {
    return directType
  }

  // Handle various file types
  if (
    column.ColumnType &&
    (column.ColumnType.startsWith('file.') || column.ColumnType === 'file.*')
  ) {
    return ColumnType.File
  }

  // Check data type for numeric types
  if (column.DataType) {
    if (
      column.DataType.startsWith('int(') ||
      column.DataType === 'INTEGER' ||
      column.DataType === 'smallint'
    ) {
      return ColumnType.NumberInt
    } else if (
      column.DataType.startsWith('decimal(') ||
      column.DataType.startsWith('float')
    ) {
      return ColumnType.NumberFloat
    }
  }

  // Map string-type column types
  switch (column.ColumnType) {
    case 'string':
    case 'varchar':
    case 'char':
    case 'label':
      return ColumnType.Text
    case 'email':
      return ColumnType.Email
    case 'password':
    case 'bcrypt':
    case 'md5-bcrypt':
      return ColumnType.Password
    case 'text':
    case 'longtext':
    case 'mediumtext':
    case 'content':
      return ColumnType.Content
    case 'boolean':
    case 'checkbox':
    case 'truefalse':
      return ColumnType.Boolean
    case 'datetime':
      return ColumnType.DateTime
    case 'date':
      return ColumnType.Date
    case 'time':
      return ColumnType.Time
    case 'timestamp':
      return ColumnType.Timestamp
    case 'json':
      return ColumnType.Json
    case 'measurement':
      return ColumnType.Measurement
    case 'namespace':
      return ColumnType.Namespace
    default:
      // Check name matches for specific types
      if (column.ColumnName.includes('latitude')) {
        return ColumnType.Latitude
      } else if (column.ColumnName.includes('longitude')) {
        return ColumnType.Longitude
      } else if (column.ColumnName.includes('city')) {
        return ColumnType.City
      } else if (column.ColumnName.includes('country')) {
        return ColumnType.Country
      } else if (column.ColumnName.includes('state')) {
        return ColumnType.State
      } else if (
        column.ColumnName.includes('pincode') ||
        column.ColumnName.includes('zipcode')
      ) {
        return ColumnType.Pincode
      } else if (column.ColumnName.includes('continent')) {
        return ColumnType.Continent
      } else if (
        column.ColumnName === 'id' ||
        column.ColumnName === 'reference_id'
      ) {
        return ColumnType.Id
      }

      return ColumnType.Text // Default to text for unknown types
  }
}

/**
 * Checks if a column should be visible in tables by default
 */
export function isColumnVisibleByDefault(column: ColumnDefinition): boolean {
  const hiddenColumns = [
    'id',
    'permission',
    'reference_id',
    'created_at',
    'updated_at',
  ]

  return !column.ExcludeFromApi && !hiddenColumns.includes(column.ColumnName)
}

/**
 * Get a human-readable name for a column
 */
export function getColumnDisplayName(column: ColumnDefinition): string {
  if (!column) return ''

  // If there's a specific display name provided, use it
  if (column.Name && column.Name !== column.ColumnName) {
    return column.Name
  }

  // Otherwise, format the column name
  const name = column.ColumnName
  return name
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
}

/**
 * Determine if a column is editable in forms
 */
export function isColumnEditable(column: ColumnDefinition): boolean {
  const nonEditableColumns = [
    'id',
    'reference_id',
    'created_at',
    'updated_at',
    'version',
  ]

  return (
    !column.ExcludeFromApi && !nonEditableColumns.includes(column.ColumnName)
  )
}

/**
 * Generate a placeholder for a column editor
 */
export function getEditorPlaceholder(column: ColumnDefinition): string {
  if (column.ColumnDescription) {
    return column.ColumnDescription
  }

  const type = getColumnType(column)

  switch (type) {
    case ColumnType.Email:
      return 'Enter email address'
    case ColumnType.Date:
      return 'Select date'
    case ColumnType.DateTime:
      return 'Select date and time'
    case ColumnType.Time:
      return 'Select time'
    case ColumnType.NumberInt:
      return 'Enter number'
    case ColumnType.NumberFloat:
      return 'Enter decimal number'
    case ColumnType.Money:
      return 'Enter amount'
    default:
      return `Enter ${getColumnDisplayName(column).toLowerCase()}`
  }
}

/**
 * Maps permission scope and action to a descriptive label
 */
export const permissionDescriptions = {
  [PermissionScope.Guest]: {
    [PermissionAction.Peek]: 'View item in lists',
    [PermissionAction.Read]: 'View item details',
    [PermissionAction.Create]: 'Create new items',
    [PermissionAction.Update]: 'Edit existing items',
    [PermissionAction.Delete]: 'Delete items',
    [PermissionAction.Execute]: 'Execute actions',
    [PermissionAction.Refer]: 'Reference in relationships',
  },
  [PermissionScope.User]: {
    [PermissionAction.Peek]: 'View owned items in lists',
    [PermissionAction.Read]: 'View owned item details',
    [PermissionAction.Create]: 'Create new owned items',
    [PermissionAction.Update]: 'Edit owned items',
    [PermissionAction.Delete]: 'Delete owned items',
    [PermissionAction.Execute]: 'Execute actions on owned items',
    [PermissionAction.Refer]: 'Reference owned items in relationships',
  },
  [PermissionScope.Group]: {
    [PermissionAction.Peek]: 'View group items in lists',
    [PermissionAction.Read]: 'View group item details',
    [PermissionAction.Create]: 'Create new group items',
    [PermissionAction.Update]: 'Edit group items',
    [PermissionAction.Delete]: 'Delete group items',
    [PermissionAction.Execute]: 'Execute actions on group items',
    [PermissionAction.Refer]: 'Reference group items in relationships',
  },
}

/**
 * Color schemes for different permission scopes
 */
export const permissionColors = {
  [PermissionScope.Guest]: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-800',
    hover: 'hover:bg-yellow-200',
    border: 'border-yellow-300',
    selected: 'bg-yellow-200',
  },
  [PermissionScope.User]: {
    bg: 'bg-blue-100',
    text: 'text-blue-800',
    hover: 'hover:bg-blue-200',
    border: 'border-blue-300',
    selected: 'bg-blue-200',
  },
  [PermissionScope.Group]: {
    bg: 'bg-green-100',
    text: 'text-green-800',
    hover: 'hover:bg-green-200',
    border: 'border-green-300',
    selected: 'bg-green-200',
  },
}

/**
 * Preset options for permissions dropdown
 */
export const permissionPresetOptions = [
  {
    label: 'No Permissions',
    value: PermissionPresets.None,
  },
  {
    label: 'Default Permissions',
    value: PermissionPresets.DefaultPermission,
  },
  {
    label: 'Default Permissions (No Admin)',
    value: PermissionPresets.DefaultPermissionWhenNoAdmin,
  },
  { label: 'Guest CRUD', value: PermissionPresets.GuestCRUD },
  {
    label: 'User CRUD',
    value: PermissionPresets.UserCRUD,
  },
  { label: 'Group CRUD', value: PermissionPresets.GroupCRUD },
  {
    label: 'All Permissions',
    value: PermissionPresets.AllowAllPermissions,
  },
]

/**
 * Get a summary of permissions for a scope
 */
export const getScopeSummary = (
  permissionValue: number,
  scope: PermissionScope
): {
  granted: PermissionAction[]
  total: number
} => {
  const actions = Object.values(PermissionAction)
  const granted = actions.filter((action) => {
    const flag = getPermissionFlag(scope, action)
    return hasPermission(permissionValue, flag)
  })

  return {
    granted,
    total: actions.length,
  }
}

/**
 * Get a visual summary description of the current permission value
 */
export const getVisualPermissionSummary = (permissionValue: number) => {
  const scopes = Object.values(PermissionScope)

  return scopes.map((scope) => {
    const { granted, total } = getScopeSummary(permissionValue, scope)
    const percent = Math.round((granted.length / total) * 100)

    return {
      scope,
      granted: granted.length,
      total,
      percent,
      isEmpty: granted.length === 0,
      isFull: granted.length === total,
      actions: granted,
    }
  })
}

/**
 * Find the closest preset that matches the current permission value
 */
export const findMatchingPreset = (permissionValue: number): string => {
  for (const [name, value] of Object.entries(PermissionPresets)) {
    if (permissionValue === value) {
      return name
    }
  }

  return 'Custom'
}

/**
 * Get permission explanation text
 */
export const getPermissionExplanation = (
  scope: PermissionScope,
  action: PermissionAction
): string => {
  return permissionDescriptions[scope][action]
}
