// components/permission/components/PermissionActionToggle.tsx
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  PermissionAction, 
  PermissionScope, 
  PERMISSION_EXPLANATIONS, 
  getPermissionFlag, 
  hasPermission 
} from '@/features/entity/columns/PermissionTypes.ts';

interface PermissionActionToggleProps {
  scope: PermissionScope;
  action: PermissionAction;
  permissionValue: number;
  togglePermission: (scope: PermissionScope, action: PermissionAction) => void;
  disabled?: boolean;
}

/**
 * Toggle component for a specific permission action
 * Displays a switch with a label and tooltip explanation
 */
export function PermissionActionToggle({
  scope,
  action,
  permissionValue,
  togglePermission,
  disabled,
}: PermissionActionToggleProps) {
  const flag = getPermissionFlag(scope, action);
  const isChecked = hasPermission(permissionValue, flag);
  const permissionKey = `${scope}${action}`;
  const explanation = PERMISSION_EXPLANATIONS[permissionKey] || 
    `Allows ${scope.toLowerCase()}s to ${action.toLowerCase()} this resource`;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center space-x-2">
            <Switch
              id={`${scope}-${action}`}
              checked={isChecked}
              onCheckedChange={() => togglePermission(scope, action)}
              disabled={disabled}
            />
            <Label
              htmlFor={`${scope}-${action}`}
              className="text-xs"
            >
              {action}
            </Label>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="max-w-xs text-xs">{explanation}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
