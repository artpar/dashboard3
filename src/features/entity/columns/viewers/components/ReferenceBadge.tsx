import React from 'react'
import { useNavigate } from '@tanstack/react-router'
import { ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface ReferenceBadgeProps {
  value: string
  namespace?: string
  className?: string
  withTooltip?: boolean
}

export const UuidReferenceBadge: React.FC<ReferenceBadgeProps> = ({
  value,
  namespace,
  className,
  withTooltip = true
}) => {
  const navigate = useNavigate()

  const handleClick = () => {
    if (namespace) {
      navigate({
        to: `/${namespace}/${value}`,
        params: { entityId: value },
      })
    }
  }

  const badgeContent = (
    <Badge
      variant='outline'
      className={cn(
        'flex cursor-pointer items-center bg-blue-50 text-blue-800 hover:bg-blue-100',
        className
      )}
      onClick={handleClick}
    >
      {withTooltip ? (
        <pre className='mr-1 max-w-[300px]'>{`${namespace}\n${value}`}</pre>
      ) : (
        <span className='max-w-[100px] truncate'>{value}</span>
      )}
      <ExternalLink className={cn('h-3 w-3', withTooltip ? '' : 'ml-1')} />
    </Badge>
  )

  if (!withTooltip) {
    return badgeContent
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {badgeContent}
        </TooltipTrigger>
        <TooltipContent>
          <div className='text-xs'>
            <p className='font-bold'>{namespace}</p>
            <p>ID: {value}</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

interface ObjectReferenceBadgeProps {
  value: { reference_id: string }
  namespace?: string
  className?: string
  withTooltip?: boolean
}

export const ObjectReferenceBadge: React.FC<ObjectReferenceBadgeProps> = ({
  value,
  namespace,
  className,
  withTooltip = true
}) => {
  const navigate = useNavigate()

  const handleClick = () => {
    if (namespace) {
      navigate({
        to: `/${namespace}/${value.reference_id}`,
        params: { entityId: value.reference_id },
      })
    }
  }

  const badgeContent = (
    <Badge
      variant='outline'
      className={cn(
        'flex cursor-pointer items-center bg-blue-50 text-blue-800 hover:bg-blue-100',
        className
      )}
      onClick={handleClick}
    >
      {withTooltip ? (
        <pre className='mr-1 max-w-[300px]'>{`${namespace}\n${value.reference_id}`}</pre>
      ) : (
        <span className='max-w-[100px] truncate'>{value.reference_id}</span>
      )}
      <ExternalLink className={cn('h-3 w-3', withTooltip ? '' : 'ml-1')} />
    </Badge>
  )

  if (!withTooltip) {
    return badgeContent
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {badgeContent}
        </TooltipTrigger>
        <TooltipContent>
          <div className='text-xs'>
            <p className='font-bold'>{namespace}</p>
            <p>ID: {value.reference_id}</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

interface GenericBadgeProps {
  value: any
  namespace?: string
  className?: string
}

export const GenericBadge: React.FC<GenericBadgeProps> = ({
  value,
  namespace,
  className
}) => {
  return (
    <Badge
      variant='outline'
      className={cn('bg-gray-100 text-gray-800', className)}
    >
      {namespace
        ? `${namespace}:${JSON.stringify(value)}`
        : JSON.stringify(value)}
    </Badge>
  )
}