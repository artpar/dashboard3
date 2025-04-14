// src/features/entity/components/relations/RelationsEmpty.tsx
import { LinkIcon } from 'lucide-react'

interface RelationsEmptyProps {
  entityName: string
}

/**
 * Component shown when no relations are available
 */
export function RelationsEmpty({ entityName }: RelationsEmptyProps) {
  return (
    <div className='flex flex-col items-center justify-center py-8 text-center'>
      <div className='bg-muted/30 flex h-20 w-20 items-center justify-center rounded-full'>
        <LinkIcon
          className='text-muted-foreground/60 h-10 w-10'
          strokeWidth={1.5}
        />
      </div>
      <h3 className='mt-4 text-lg font-medium'>No Relations Found</h3>
      <p className='text-muted-foreground mt-2 max-w-sm'>
        This {entityName} doesn't have any relations yet.
      </p>
    </div>
  )
}
