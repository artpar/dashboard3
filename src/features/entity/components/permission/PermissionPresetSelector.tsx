// components/PermissionPresetSelector.tsx
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PERMISSION_PRESET_OPTIONS } from '../PermissionTypes';

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

// components/DisplayModeToggle.tsx
import { Button } from '@/components/ui/button';

type DisplayMode = 'visual' | 'text' | 'groups';

interface DisplayModeToggleProps {
  mode: DisplayMode;
  onChange: (mode: DisplayMode) => void;
  disabled?: boolean;
}

export function DisplayModeToggle({ 
  mode, 
  onChange, 
  disabled 
}: DisplayModeToggleProps) {
  return (
    <div className='flex overflow-hidden rounded-md border'>
      <Button
        type='button'
        variant={mode === 'visual' ? 'default' : 'outline'}
        className='rounded-none px-3'
        onClick={() => onChange('visual')}
        disabled={disabled}
      >
        Visual
      </Button>
      <Button
        type='button'
        variant={mode === 'text' ? 'default' : 'outline'}
        className='rounded-none px-3'
        onClick={() => onChange('text')}
        disabled={disabled}
      >
        Text
      </Button>
      <Button
        type='button'
        variant={mode === 'groups' ? 'default' : 'outline'}
        className='rounded-none px-3'
        onClick={() => onChange('groups')}
        disabled={disabled}
      >
        Groups
      </Button>
    </div>
  );
}

// components/PermissionActionToggle.tsx
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';
import { PermissionAction, PermissionScope } from '../PermissionTypes';

interface PermissionActionToggleProps {
  scope: PermissionScope;
  action: PermissionAction;
  isChecked: boolean;
  onToggle: () => void;
  disabled?: boolean;
  colors: {
    selected: string;
    text: string;
    border: string;
  };
  explanation: string;
}

export function PermissionActionToggle({
  scope,
  action,
  isChecked,
  onToggle,
  disabled,
  colors,
  explanation
}: PermissionActionToggleProps) {
  return (
    <div
      className={`flex items-center space-x-2 rounded-md p-2 ${isChecked ? colors.selected : 'bg-background'} transition-colors`}
    >
      <Checkbox
        id={`${scope}-${action}`}
        checked={isChecked}
        onCheckedChange={onToggle}
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
  );
}