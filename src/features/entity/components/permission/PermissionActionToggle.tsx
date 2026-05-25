// components/PermissionActionToggle.tsx
import { Info } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  PermissionAction,
  PermissionScope,
} from '@/features/entity/columns/PermissionTypes.ts'

interface PermissionActionToggleProps {
  scope: PermissionScope
  action: PermissionAction
  isChecked: boolean
  onToggle: () => void
  id?: string
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
  id,
  disabled,
  colors,
  explanation,
}: PermissionActionToggleProps) {
  const inputId = id || `${scope}-${action}`

  return (
    <div
      className={`flex min-h-10 items-center gap-3 rounded-md px-3 py-2 ${isChecked ? colors.selected : 'bg-background'} transition-colors`}
    >
      <Checkbox
        id={inputId}
        checked={isChecked}
        onCheckedChange={onToggle}
        disabled={disabled}
        className={isChecked ? colors.border : ''}
      />

      <label
        htmlFor={inputId}
        className='flex min-w-0 flex-1 cursor-pointer items-center gap-2 text-sm'
      >
        <span className='w-20 shrink-0 font-medium'>{action}</span>
        <span className='text-muted-foreground truncate font-normal'>
          {explanation}
        </span>
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
