import React, { useEffect, useState } from 'react'
import { HelpCircle, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  addPermission,
  findPermissionPresetName,
  getPermissionFlag,
  hasPermission,
  PERMISSION_COLORS,
  PERMISSION_EXPLANATIONS,
  PERMISSION_PRESET_OPTIONS,
  PermissionAction,
  PermissionScope,
  removePermission,
} from './../PermissionTypes'

interface PermissionColumnEditorProps {
  value: number
  onChange: (value: number) => void
  onBlur?: () => void
  className?: string
  error?: string
  disabled?: boolean
}

/**
 * Component for editing permission values with human-readable labels
 */
export default function PermissionColumnEditor({
  value,
  onChange,
  onBlur,
  className,
  error,
  disabled,
}: PermissionColumnEditorProps) {
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
    parsePermissionValue(value)
  )
  const [activeTab, setActiveTab] = useState<PermissionScope>(
    PermissionScope.Guest
  )
  const [displayMode, setDisplayMode] = useState<'visual' | 'text'>('visual')

  // Update internal state when props change
  useEffect(() => {
    setPermissionValue(parsePermissionValue(value))
  }, [value])

  // Toggle a specific permission
  const togglePermission = (
    scope: PermissionScope,
    action: PermissionAction
  ) => {
    const flag = getPermissionFlag(scope, action)
    const newValue = hasPermission(permissionValue, flag)
      ? removePermission(permissionValue, flag)
      : addPermission(permissionValue, flag)

    setPermissionValue(newValue)
    onChange(newValue)
  }

  // Handle preset selection
  const handlePresetChange = (presetValue: string) => {
    const newValue = parseInt(presetValue, 10)
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

  // Get preset name
  const presetName = findPermissionPresetName(permissionValue)

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Preset selector and view toggle */}
      <div className='flex items-center space-x-2'>
        <Select
          value={permissionValue.toString()}
          onValueChange={handlePresetChange}
          disabled={disabled}
        >
          <SelectTrigger
            className={`w-full ${error ? 'border-red-500' : ''} ${disabled ? 'opacity-50' : ''}`}
          >
            <SelectValue placeholder='Select permission preset' />
          </SelectTrigger>
          <SelectContent>
            {PERMISSION_PRESET_OPTIONS.map((preset) => (
              <SelectItem key={preset.value} value={preset.value.toString()}>
                {preset.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className='flex overflow-hidden rounded-md border'>
          <Button
            type='button'
            variant={displayMode === 'visual' ? 'default' : 'outline'}
            className='rounded-none px-3'
            onClick={() => setDisplayMode('visual')}
            disabled={disabled}
          >
            Visual
          </Button>
          <Button
            type='button'
            variant={displayMode === 'text' ? 'default' : 'outline'}
            className='rounded-none px-3'
            onClick={() => setDisplayMode('text')}
            disabled={disabled}
          >
            Text
          </Button>
        </div>
      </div>

      {/* Visual editor */}
      {displayMode === 'visual' && (
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
                        <div
                          key={action}
                          className={`flex items-center space-x-2 rounded-md p-2 ${isChecked ? colors.selected : 'bg-gray-50'} transition-colors`}
                        >
                          <Checkbox
                            id={`${scope}-${action}`}
                            checked={isChecked}
                            onCheckedChange={() =>
                              togglePermission(scope, action)
                            }
                            disabled={disabled}
                            className={isChecked ? colors.border : ''}
                          />

                          <label
                            htmlFor={`${scope}-${action}`}
                            className='flex-1 cursor-pointer text-sm font-medium'
                          >
                            {action}
                          </label>

                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Info className='text-muted-foreground h-4 w-4' />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{explanation}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      )
                    })}
                  </div>
                </TabsContent>
              )
            })}
          </Tabs>
        </div>
      )}

      {/* Text mode */}
      {displayMode === 'text' && (
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
              const colors = PERMISSION_COLORS[scope]
              const actionBits = Object.values(PermissionAction).map(
                (action) => {
                  const flag = getPermissionFlag(scope, action)
                  const isGranted = hasPermission(permissionValue, flag)

                  return { action, isGranted }
                }
              )

              const grantedActions = actionBits.filter((a) => a.isGranted)
              const hasPermissions = grantedActions.length > 0

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
              )
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
      )}

      {error && <p className='text-sm text-red-500'>{error}</p>}
    </div>
  )
}
