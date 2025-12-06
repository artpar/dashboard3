import { useState, useEffect } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const PERMISSIONS = [
  { name: 'Peek', bit: 0, description: 'View existence' },
  { name: 'Read', bit: 1, description: 'Read data' },
  { name: 'Create', bit: 2, description: 'Create new' },
  { name: 'Update', bit: 3, description: 'Modify existing' },
  { name: 'Delete', bit: 4, description: 'Remove' },
  { name: 'Execute', bit: 5, description: 'Run actions' },
  { name: 'Refer', bit: 6, description: 'Reference in relations' },
]

const LEVELS = [
  { name: 'Guest', offset: 0, description: 'Unauthenticated users' },
  { name: 'User', offset: 7, description: 'Authenticated users' },
  { name: 'Group', offset: 14, description: 'Group members' },
]

const PRESETS = [
  { name: 'Public Read', value: 2097154, desc: 'Guest read, User CRUD' },
  { name: 'User Only', value: 2097152, desc: 'No guest access' },
  { name: 'Admin Only', value: 0, desc: 'No default access' },
  { name: 'Full Public', value: 2097279, desc: 'Everyone full access' },
]

interface PermissionEditorProps {
  value: number
  onChange: (value: number) => void
  readOnly?: boolean
}

export function PermissionEditor({
  value,
  onChange,
  readOnly = false,
}: PermissionEditorProps) {
  const [localValue, setLocalValue] = useState(value)

  useEffect(() => {
    setLocalValue(value)
  }, [value])

  const getBit = (permission: number, level: number): boolean => {
    const bitPosition = level + permission
    return (localValue & (1 << bitPosition)) !== 0
  }

  const setBit = (permission: number, level: number, checked: boolean) => {
    const bitPosition = level + permission
    let newValue: number
    if (checked) {
      newValue = localValue | (1 << bitPosition)
    } else {
      newValue = localValue & ~(1 << bitPosition)
    }
    setLocalValue(newValue)
    onChange(newValue)
  }

  const handlePresetChange = (presetValue: string) => {
    const numValue = parseInt(presetValue, 10)
    setLocalValue(numValue)
    onChange(numValue)
  }

  const handleDecimalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const numValue = parseInt(e.target.value, 10) || 0
    setLocalValue(numValue)
    onChange(numValue)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Label className="text-sm text-muted-foreground">Decimal:</Label>
          <Input
            type="number"
            value={localValue}
            onChange={handleDecimalChange}
            className="w-32"
            disabled={readOnly}
          />
        </div>
        {!readOnly && (
          <Select onValueChange={handlePresetChange}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Apply preset..." />
            </SelectTrigger>
            <SelectContent>
              {PRESETS.map((preset) => (
                <SelectItem key={preset.name} value={preset.value.toString()}>
                  {preset.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted">
              <th className="p-2 text-left font-medium">Permission</th>
              {LEVELS.map((level) => (
                <th key={level.name} className="p-2 text-center font-medium">
                  <div>{level.name}</div>
                  <div className="text-xs font-normal text-muted-foreground">
                    {level.description}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PERMISSIONS.map((perm) => (
              <tr key={perm.name} className="border-t">
                <td className="p-2">
                  <div className="font-medium">{perm.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {perm.description}
                  </div>
                </td>
                {LEVELS.map((level) => (
                  <td key={level.name} className="p-2 text-center">
                    <Checkbox
                      checked={getBit(perm.bit, level.offset)}
                      onCheckedChange={(checked) =>
                        setBit(perm.bit, level.offset, checked === true)
                      }
                      disabled={readOnly}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="text-xs text-muted-foreground">
        Binary: {localValue.toString(2).padStart(21, '0')}
      </div>
    </div>
  )
}

export default PermissionEditor
