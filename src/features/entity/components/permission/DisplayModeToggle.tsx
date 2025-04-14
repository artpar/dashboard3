// components/DisplayModeToggle.tsx
import { Button } from '@/components/ui/button'

type DisplayMode = 'visual' | 'groups'

interface DisplayModeToggleProps {
  mode: DisplayMode
  onChange: (mode: DisplayMode) => void
  disabled?: boolean
}

export function DisplayModeToggle({
  mode,
  onChange,
  disabled,
}: DisplayModeToggleProps) {
  return (
    <div className='flex flex-wrap w-full max-w-full'>
      <Button
        type='button'
        variant={mode === 'visual' ? 'default' : 'outline'}
        className='flex-1 rounded-l-md rounded-r-none px-2 min-w-0'
        onClick={() => onChange('visual')}
        disabled={disabled}
      >
        Visual
      </Button>
      <Button
        type='button'
        variant={mode === 'groups' ? 'default' : 'outline'}
        className='flex-1 rounded-r-md rounded-l-none px-2 min-w-0'
        onClick={() => onChange('groups')}
        disabled={disabled}
      >
        Groups
      </Button>
    </div>
  )
}
