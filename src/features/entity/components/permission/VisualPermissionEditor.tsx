// components/VisualPermissionEditor.tsx
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  PermissionAction,
  PermissionScope,
  PERMISSION_COLORS,
  hasPermission,
  getPermissionFlag,
  PERMISSION_EXPLANATIONS,
} from '@/features/entity/columns/PermissionTypes.ts'
import { PermissionActionToggle } from './PermissionPresetSelector'


interface VisualPermissionEditorProps {
  permissionValue: number
  togglePermission: (scope: PermissionScope, action: PermissionAction) => void
  toggleAllForScope: (scope: PermissionScope, enabled: boolean) => void
  disabled?: boolean
}

export function VisualPermissionEditor({
  permissionValue,
  togglePermission,
  toggleAllForScope,
  disabled,
}: VisualPermissionEditorProps) {
  const [activeTab, setActiveTab] = useState<PermissionScope>(
    PermissionScope.Guest
  )

  return (
    <div className='rounded-md border p-4'>
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as PermissionScope)}
      >
        <TabsList className='mb-4 grid grid-cols-3'>
          {Object.values(PermissionScope).map((scope) => {
            const colors = PERMISSION_COLORS[scope]
            return (
              <TabsTrigger
                key={scope}
                value={scope}
                className={`data-[state=active]:${colors.selected} data-[state=active]:${colors.text}`}
              >
                {scope}
              </TabsTrigger>
            )
          })}
        </TabsList>

        {Object.values(PermissionScope).map((scope) => {
          const colors = PERMISSION_COLORS[scope]

          return (
            <TabsContent key={scope} value={scope} className='space-y-4'>
              <div className='mb-2 flex items-center justify-between'>
                <h3 className={`text-sm font-medium ${colors.text}`}>
                  {scope} Permissions
                </h3>

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
              </div>

              <div className='grid grid-cols-1 gap-2'>
                {Object.values(PermissionAction).map((action) => {
                  const flag = getPermissionFlag(scope, action)
                  const isChecked = hasPermission(permissionValue, flag)
                  const permissionKey = `${scope}${action}`
                  const explanation =
                    PERMISSION_EXPLANATIONS[permissionKey] ||
                    `Allows ${scope.toLowerCase()}s to ${action.toLowerCase()} this resource`

                  return (
                    <PermissionActionToggle
                      key={action}
                      scope={scope}
                      action={action}
                      isChecked={isChecked}
                      onToggle={() => togglePermission(scope, action)}
                      disabled={disabled}
                      colors={colors}
                      explanation={explanation}
                    />
                  )
                })}
              </div>
            </TabsContent>
          )
        })}
      </Tabs>
    </div>
  )
}
