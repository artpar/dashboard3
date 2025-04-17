// components/VisualPermissionEditor.tsx
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PermissionAction, PermissionScope } from '@/features/entity/columns/PermissionTypes.ts';
import { PermissionScopeRow } from './components/PermissionScopeRow';

interface VisualPermissionEditorProps {
  permissionValue: number;
  togglePermission: (scope: PermissionScope, action: PermissionAction) => void;
  toggleAllForScope: (scope: PermissionScope, enabled: boolean) => void;
  disabled?: boolean;
}

/**
 * Main visual editor for permission management
 * Displays a table with permission scopes and actions
 */
export function VisualPermissionEditor({
  permissionValue,
  togglePermission,
  toggleAllForScope,
  disabled,
}: VisualPermissionEditorProps) {
  const scopes = [PermissionScope.Guest, PermissionScope.User];

  return (
    <div className="flex flex-col">
      <Card className="rounded-md border">
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Scope</TableHead>
                <TableHead className="w-[60%]">Permissions</TableHead>
                <TableHead className="w-[20%]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {scopes.map((scope) => (
                <PermissionScopeRow
                  key={scope}
                  scope={scope}
                  permissionValue={permissionValue}
                  togglePermission={togglePermission}
                  toggleAllForScope={toggleAllForScope}
                  disabled={disabled}
                />
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
