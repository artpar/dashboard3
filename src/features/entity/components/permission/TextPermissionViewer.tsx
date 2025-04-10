import { HelpCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  PermissionScope, 
  PermissionAction, 
  PERMISSION_COLORS,
  findPermissionPresetName,
  getPermissionFlag,
  hasPermission
} from '../PermissionTypes';

interface TextPermissionViewerProps {
  permissionValue: number;
}

export function TextPermissionViewer({ permissionValue }: TextPermissionViewerProps) {
  const presetName = findPermissionPresetName(permissionValue);

  return (
    <div className='rounded-md border p-4'>
      <div className='space-y-4'>
        <div className='flex items-center justify-between'>
          <div>
            <h3 className='text-sm font-medium'>Permission Value</h3>
            <p className='text-muted-foreground text-xs'>
              The current permission setting is:{' '}
              <span className='font-mono'>{permissionValue}</span>
            </p>
          </div>
          <div>
            {presetName !== 'Custom' && (
              <span className='rounded-full bg-purple-100 px-2 py-1 text-xs font-medium text-purple-800'>
                {presetName}
              </span>
            )}
          </div>
        </div>

        {Object.values(PermissionScope).map((scope) => {
          const colors = PERMISSION_COLORS[scope];
          const actionBits = Object.values(PermissionAction).map(
            (action) => {
              const flag = getPermissionFlag(scope, action);
              const isGranted = hasPermission(permissionValue, flag);

              return { action, isGranted };
            }
          );

          const grantedActions = actionBits.filter((a) => a.isGranted);
          const hasPermissions = grantedActions.length > 0;

          return (
            <div
              key={scope}
              className={`rounded-md p-3 ${hasPermissions ? colors.bg : 'bg-gray-50'}`}
            >
              <h4 className={`mb-2 text-sm font-medium ${colors.text}`}>
                {scope}
              </h4>

              {!hasPermissions && (
                <p className='text-sm text-gray-500 italic'>
                  No permissions granted
                </p>
              )}

              {hasPermissions && (
                <div className='flex flex-wrap gap-1'>
                  {grantedActions.map(({ action }) => (
                    <span
                      key={`${scope}-${action}`}
                      className={`rounded-full px-2 py-1 text-xs font-medium ${colors.bg} ${colors.text} border ${colors.border}`}
                    >
                      {action}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        <TooltipProvider>
          <div className='text-muted-foreground mt-4 flex items-center text-xs'>
            <span>
              Permission value is stored as a bitmask in the database
            </span>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className='ml-1 h-3 w-3' />
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  Each permission is represented by a bit in the permission
                  value.
                </p>
                <p>
                  This makes it efficient to store and check multiple
                  permissions.
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      </div>
    </div>
  );
}