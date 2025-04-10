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
        variant={mode === 'groups' ? 'default' : 'outline'}
        className='rounded-none px-3'
        onClick={() => onChange('groups')}
        disabled={disabled}
      >
        Groups
      </Button>
    </div>
  )
}
