// components/permission/components/PermissionScopeRow.tsx
import { Button } from '@/components/ui/button';
import { TableCell, TableRow } from '@/components/ui/table';
import { 
  PermissionAction, 
  PermissionScope, 
  PERMISSION_COLORS
} from '@/features/entity/columns/PermissionTypes.ts';
import { PermissionActionToggle } from './PermissionActionToggle';

interface PermissionScopeRowProps {
  scope: PermissionScope;
  permissionValue: number;
  togglePermission: (scope: PermissionScope, action: PermissionAction) => void;
  toggleAllForScope: (scope: PermissionScope, enabled: boolean) => void;
  disabled?: boolean;
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
}: PermissionScopeRowProps) {
  const colors = PERMISSION_COLORS[scope];
  const scopeDescription = scope === PermissionScope.Guest 
    ? 'Unauthenticated users' 
    : 'Authenticated users';

  return (
    <TableRow>
      <TableCell>
        <div className={`font-medium ${colors.text}`}>{scope}</div>
        <div className="text-muted-foreground text-xs">
          {scopeDescription}
        </div>
      </TableCell>
      <TableCell>
        <div className="flex flex-wrap gap-2">
          {Object.values(PermissionAction).map((action) => (
            <PermissionActionToggle
              key={action}
              scope={scope}
              action={action}
              permissionValue={permissionValue}
              togglePermission={togglePermission}
              disabled={disabled}
            />
          ))}
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center space-x-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => toggleAllForScope(scope, true)}
            disabled={disabled}
            className={`h-8 text-xs ${colors.border}`}
          >
            Select All
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => toggleAllForScope(scope, false)}
            disabled={disabled}
            className="h-8 text-xs"
          >
            Clear All
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
