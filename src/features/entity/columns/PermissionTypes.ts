import {
  DaptinPermissionFlags,
  DaptinPermissionSets,
  addPermission as sdkAddPermission,
  hasPermission as sdkHasPermission,
  removePermission as sdkRemovePermission,
} from 'daptin-client'

export const PermissionFlag = DaptinPermissionFlags
export type PermissionFlag =
  (typeof PermissionFlag)[keyof typeof PermissionFlag]

export const PermissionPresets = {
  None: 0,
  ReadOnly:
    DaptinPermissionFlags.GuestRead |
    DaptinPermissionFlags.UserRead |
    DaptinPermissionFlags.GroupRead,
  GuestCRUD: DaptinPermissionSets.GuestCrud,
  UserCRUD: DaptinPermissionSets.UserCrud,
  GroupCRUD: DaptinPermissionSets.GroupCrud,
  DefaultPermission: DaptinPermissionSets.Default,
  DefaultPermissionWhenNoAdmin: DaptinPermissionSets.AllowAll,
  AllPermissions: DaptinPermissionSets.AllowAll,
  AllowAllPermissions: DaptinPermissionSets.AllowAll,
} as const

export enum PermissionScope {
  Guest = 'Guest',
  User = 'User',
  Group = 'Group',
}

export enum PermissionAction {
  Peek = 'Peek',
  Read = 'Read',
  Create = 'Create',
  Update = 'Update',
  Delete = 'Delete',
  Execute = 'Execute',
  Refer = 'Refer',
}

export const PERMISSION_PRESET_NAMES: Record<number, string> = {
  [PermissionPresets.None]: 'No Access',
  [PermissionPresets.ReadOnly]: 'Read Only',
  [PermissionPresets.GuestCRUD]: 'Guest CRUD',
  [PermissionPresets.UserCRUD]: 'User CRUD',
  [PermissionPresets.GroupCRUD]: 'Group CRUD',
  [PermissionPresets.DefaultPermission]: 'Default Permission',
  [PermissionPresets.AllPermissions]: 'All Permissions',
}

export const PERMISSION_EXPLANATIONS: Record<string, string> = {
  GuestPeek:
    'Allows unauthenticated users to see that this record exists (minimal info)',
  GuestRead: "Allows unauthenticated users to read this record's details",
  GuestCreate: 'Allows unauthenticated users to create new records',
  GuestUpdate: 'Allows unauthenticated users to modify this record',
  GuestDelete: 'Allows unauthenticated users to delete this record',
  GuestExecute:
    'Allows unauthenticated users to execute actions on this record',
  GuestRefer:
    'Allows unauthenticated users to reference this record in relationships',
  UserPeek: 'Allows the owner to see that this record exists (minimal info)',
  UserRead: "Allows the owner to read this record's details",
  UserCreate: 'Allows the owner to create new records',
  UserUpdate: 'Allows the owner to modify this record',
  UserDelete: 'Allows the owner to delete this record',
  UserExecute: 'Allows the owner to execute actions on this record',
  UserRefer: 'Allows the owner to reference this record in relationships',
  GroupPeek:
    'Allows users in the same group to see that this record exists (minimal info)',
  GroupRead: "Allows users in the same group to read this record's details",
  GroupCreate: 'Allows users in the same group to create new records',
  GroupUpdate: 'Allows users in the same group to modify this record',
  GroupDelete: 'Allows users in the same group to delete this record',
  GroupExecute:
    'Allows users in the same group to execute actions on this record',
  GroupRefer:
    'Allows users in the same group to reference this record in relationships',
}

export const PERMISSION_COLORS: Record<
  PermissionScope,
  {
    bg: string
    text: string
    selected: string
    border: string
  }
> = {
  [PermissionScope.Guest]: {
    bg: 'bg-blue-50',
    text: 'text-blue-800',
    selected: 'bg-blue-100',
    border: 'border-blue-600',
  },
  [PermissionScope.User]: {
    bg: 'bg-green-50',
    text: 'text-green-800',
    selected: 'bg-green-100',
    border: 'border-green-600',
  },
  [PermissionScope.Group]: {
    bg: 'bg-purple-50',
    text: 'text-purple-800',
    selected: 'bg-purple-100',
    border: 'border-purple-600',
  },
}

export const PERMISSION_PRESET_OPTIONS = [
  { label: 'No Access', value: PermissionPresets.None },
  { label: 'Read Only', value: PermissionPresets.ReadOnly },
  { label: 'Guest: Full Access', value: PermissionPresets.GuestCRUD },
  { label: 'User: Full Access', value: PermissionPresets.UserCRUD },
  { label: 'Group: Full Access', value: PermissionPresets.GroupCRUD },
  { label: 'Default Permission', value: PermissionPresets.DefaultPermission },
  { label: 'All Permissions', value: PermissionPresets.AllPermissions },
]

export function hasPermission(
  permissionValue: number | string | null | undefined,
  flag: number
): boolean {
  return sdkHasPermission(permissionValue, flag)
}

export function addPermission(
  permissionValue: number | string | null | undefined,
  flag: number
): number {
  return sdkAddPermission(permissionValue, flag)
}

export function removePermission(
  permissionValue: number | string | null | undefined,
  flag: number
): number {
  return sdkRemovePermission(permissionValue, flag)
}

export function getPermissionFlag(
  scope: PermissionScope,
  action: PermissionAction
): PermissionFlag {
  const key = `${scope}${action}` as keyof typeof DaptinPermissionFlags
  return DaptinPermissionFlags[key]
}

export function getPermissionPresetName(value: number): string {
  return PERMISSION_PRESET_NAMES[value] || 'Custom'
}

export function findPermissionPresetName(value: number): string {
  return getPermissionPresetName(value)
}

export function getPermissionSummary(permissionValue: number) {
  return Object.values(PermissionScope).map((scope) => {
    const grantedActions = Object.values(PermissionAction).filter((action) =>
      hasPermission(permissionValue, getPermissionFlag(scope, action))
    )
    const total = Object.values(PermissionAction).length

    return {
      scope,
      granted: grantedActions.length,
      total,
      percent: Math.round((grantedActions.length / total) * 100),
      isEmpty: grantedActions.length === 0,
      isFull: grantedActions.length === total,
      actions: grantedActions,
    }
  })
}
