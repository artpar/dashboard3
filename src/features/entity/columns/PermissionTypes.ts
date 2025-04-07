// src/components/entity/permissions/PermissionTypes.ts

/**
 * Permission bit flags based on the backend auth.AuthPermission
 */
export enum PermissionFlag {
  None = 0,
  GuestPeek = 1 << 0,
  GuestRead = 1 << 1,
  GuestCreate = 1 << 2,
  GuestUpdate = 1 << 3,
  GuestDelete = 1 << 4,
  GuestExecute = 1 << 5,
  GuestRefer = 1 << 6,
  UserPeek = 1 << 7,
  UserRead = 1 << 8,
  UserCreate = 1 << 9,
  UserUpdate = 1 << 10,
  UserDelete = 1 << 11,
  UserExecute = 1 << 12,
  UserRefer = 1 << 13,
  GroupPeek = 1 << 14,
  GroupRead = 1 << 15,
  GroupCreate = 1 << 16,
  GroupUpdate = 1 << 17,
  GroupDelete = 1 << 18,
  GroupExecute = 1 << 19,
  GroupRefer = 1 << 20,
}

/**
 * Predefined permission combinations
 */
export const PermissionPresets = {
  None: 0,
  ReadOnly: PermissionFlag.GuestRead | PermissionFlag.UserRead | PermissionFlag.GroupRead,
  GuestCRUD: PermissionFlag.GuestPeek | PermissionFlag.GuestRead | PermissionFlag.GuestCreate |
    PermissionFlag.GuestUpdate | PermissionFlag.GuestDelete | PermissionFlag.GuestRefer,
  UserCRUD: PermissionFlag.UserPeek | PermissionFlag.UserRead | PermissionFlag.UserCreate |
    PermissionFlag.UserUpdate | PermissionFlag.UserDelete | PermissionFlag.UserRefer,
  GroupCRUD: PermissionFlag.GroupPeek | PermissionFlag.GroupRead | PermissionFlag.GroupCreate |
    PermissionFlag.GroupUpdate | PermissionFlag.GroupDelete | PermissionFlag.GroupRefer,
  DefaultPermission: 561443, // Common default permission in the system
  AllPermissions: 2097151, // All permission bits set (2^21 - 1)
} as const;

/**
 * Permission scopes for organization
 */
export enum PermissionScope {
  Guest = "Guest",
  User = "User",
  Group = "Group"
}

/**
 * Permission actions available
 */
export enum PermissionAction {
  Peek = "Peek",
  Read = "Read",
  Create = "Create",
  Update = "Update",
  Delete = "Delete",
  Execute = "Execute",
  Refer = "Refer"
}

/**
 * Mapping between permission presets and their human-readable names
 */
export const PERMISSION_PRESET_NAMES: Record<number, string> = {
  [PermissionPresets.None]: "No Access",
  [PermissionPresets.ReadOnly]: "Read Only",
  [PermissionPresets.GuestCRUD]: "Guest CRUD",
  [PermissionPresets.UserCRUD]: "User CRUD",
  [PermissionPresets.GroupCRUD]: "Group CRUD",
  [PermissionPresets.DefaultPermission]: "Default Permission",
  [PermissionPresets.AllPermissions]: "All Permissions",
};

/**
 * Mapping of permission actions to human readable descriptions
 */
export const PERMISSION_EXPLANATIONS: Record<string, string> = {
  "GuestPeek": "Allows unauthenticated users to see that this record exists (minimal info)",
  "GuestRead": "Allows unauthenticated users to read this record's details",
  "GuestCreate": "Allows unauthenticated users to create new records",
  "GuestUpdate": "Allows unauthenticated users to modify this record",
  "GuestDelete": "Allows unauthenticated users to delete this record",
  "GuestExecute": "Allows unauthenticated users to execute actions on this record",
  "GuestRefer": "Allows unauthenticated users to reference this record in relationships",
  "UserPeek": "Allows the owner to see that this record exists (minimal info)",
  "UserRead": "Allows the owner to read this record's details",
  "UserCreate": "Allows the owner to create new records",
  "UserUpdate": "Allows the owner to modify this record",
  "UserDelete": "Allows the owner to delete this record",
  "UserExecute": "Allows the owner to execute actions on this record",
  "UserRefer": "Allows the owner to reference this record in relationships",
  "GroupPeek": "Allows users in the same group to see that this record exists (minimal info)",
  "GroupRead": "Allows users in the same group to read this record's details",
  "GroupCreate": "Allows users in the same group to create new records",
  "GroupUpdate": "Allows users in the same group to modify this record",
  "GroupDelete": "Allows users in the same group to delete this record",
  "GroupExecute": "Allows users in the same group to execute actions on this record",
  "GroupRefer": "Allows users in the same group to reference this record in relationships",
};

/**
 * UI Colors for permission scope components
 */
export const PERMISSION_COLORS: Record<PermissionScope, {
  bg: string;
  text: string;
  selected: string;
  border: string;
}> = {
  [PermissionScope.Guest]: {
    bg: "bg-blue-50",
    text: "text-blue-800",
    selected: "bg-blue-100",
    border: "border-blue-600",
  },
  [PermissionScope.User]: {
    bg: "bg-green-50",
    text: "text-green-800",
    selected: "bg-green-100",
    border: "border-green-600",
  },
  [PermissionScope.Group]: {
    bg: "bg-purple-50",
    text: "text-purple-800",
    selected: "bg-purple-100",
    border: "border-purple-600",
  },
};

/**
 * Options for permission presets to be used in dropdowns
 */
export const PERMISSION_PRESET_OPTIONS = [
  { label: "No Access", value: PermissionPresets.None },
  { label: "Read Only", value: PermissionPresets.ReadOnly },
  { label: "Guest: Full Access", value: PermissionPresets.GuestCRUD },
  { label: "User: Full Access", value: PermissionPresets.UserCRUD },
  { label: "Group: Full Access", value: PermissionPresets.GroupCRUD },
  { label: "Default Permission", value: PermissionPresets.DefaultPermission },
  { label: "All Permissions", value: PermissionPresets.AllPermissions },
];

/**
 * Helper function to check if a permission is set in the bitmask
 */
export function hasPermission(permissionValue: number, flag: PermissionFlag): boolean {
  return (permissionValue & flag) === flag;
}

/**
 * Helper function to add a permission to the bitmask
 */
export function addPermission(permissionValue: number, flag: PermissionFlag): number {
  return permissionValue | flag;
}

/**
 * Helper function to remove a permission from the bitmask
 */
export function removePermission(permissionValue: number, flag: PermissionFlag): number {
  return permissionValue & ~flag;
}

/**
 * Get the permission flag for a specific scope and action
 */
export function getPermissionFlag(scope: PermissionScope, action: PermissionAction): PermissionFlag {
  const key = `${scope}${action}` as keyof typeof PermissionFlag;
  return PermissionFlag[key];
}

/**
 * Helper to find if a permission value matches a known preset
 */
export function findPermissionPresetName(permissionValue: number): string {
  return PERMISSION_PRESET_NAMES[permissionValue] || "Custom";
}

/**
 * Helper to generate a summary for each permission scope
 */
export interface PermissionSummary {
  scope: PermissionScope;
  granted: number;
  total: number;
  percent: number;
  isEmpty: boolean;
  actions: PermissionAction[];
}

export function getPermissionSummary(permissionValue: number): PermissionSummary[] {
  return Object.values(PermissionScope).map(scope => {
    const actions = Object.values(PermissionAction);
    const grantedActions = actions.filter(action => {
      const flag = getPermissionFlag(scope, action);
      return hasPermission(permissionValue, flag);
    });

    return {
      scope,
      granted: grantedActions.length,
      total: actions.length,
      percent: (grantedActions.length / actions.length) * 100,
      isEmpty: grantedActions.length === 0,
      actions: grantedActions
    };
  });
}

/**
 * Get a human-readable list of permissions from a permission value
 */
export function getPermissionNames(permissionValue: number): string[] {
  if (permissionValue === 0) return ["No permissions"];

  const permissionNames: string[] = [];

  Object.values(PermissionScope).forEach(scope => {
    Object.values(PermissionAction).forEach(action => {
      const flag = getPermissionFlag(scope, action);
      if (hasPermission(permissionValue, flag)) {
        permissionNames.push(`${scope} ${action}`);
      }
    });
  });

  return permissionNames;
}
