// components/PermissionActionToggle.tsx
import { Info } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { PermissionAction, PermissionScope } from '@/features/entity/columns/PermissionTypes.ts'

interface PermissionActionToggleProps {
  scope: PermissionScope
  action: PermissionAction
  isChecked: boolean
  onToggle: () => void
  disabled?: boolean
  colors: {
    selected: string
    text: string
    border: string
  }
  explanation: string
}

export function PermissionActionToggle({
  scope,
  action,
  isChecked,
  onToggle,
  disabled,
  colors,
  explanation,
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
  )
}
