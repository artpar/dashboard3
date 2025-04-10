// components/PermissionPresetSelector.tsx
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PERMISSION_PRESET_OPTIONS } from '@/features/entity/columns/PermissionTypes.ts'

interface PermissionPresetSelectorProps {
  value: number;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  error?: string;
}

export function PermissionPresetSelector({
  value,
  onValueChange,
  disabled,
  error
}: PermissionPresetSelectorProps) {
  return (
    <Select
      value={value.toString()}
      onValueChange={onValueChange}
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
  );
}

