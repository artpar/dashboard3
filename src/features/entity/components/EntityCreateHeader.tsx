import React from 'react'
import { useNavigate } from '@tanstack/react-router'
import { ArrowLeft, ChevronRight, Clock, User } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { formatDateTime } from '@/features/entity/utils/entityFormatters'
import { useToast } from '@/components/ui/use-toast'

interface EntityCreateHeaderProps {
  entityName: string
  isSubmitting?: boolean
}

/**
 * Header component for entity creation page
 */
export const EntityCreateHeader: React.FC<EntityCreateHeaderProps> = ({
  entityName,
  isSubmitting = false,
}) => {
  const navigate = useNavigate()
  const { toast } = useToast()

  function handleBack(): void {
    navigate({
      to: `/${entityName}`
    })
  }

  function handleCancel(): void {
    toast({
      title: 'Creation cancelled',
      description: 'You have cancelled creating a new item',
    })
    navigate({
      to: `/${entityName}`
    })
  }

  // Get entity icon
  const getEntityIcon = () => {
    const firstLetter = entityName.charAt(0).toUpperCase()
    return (
      <Avatar className='h-16 w-16'>
        <AvatarFallback className='text-lg font-medium'>
          {firstLetter}
        </AvatarFallback>
      </Avatar>
    )
  }

  return (
    <div className="flex-shrink-0">
      {/* Header with back button and breadcrumbs */}
      <div className='mb-4'>
        <div className='flex items-start justify-between'>
          <div className='flex items-center space-x-2'>
            <Button
              variant='ghost'
              size='icon'
              onClick={handleBack}
              className='h-8 w-8'
            >
              <ArrowLeft className='h-4 w-4' />
              <span className='sr-only'>Back</span>
            </Button>

            <div className='flex items-center'>
              <div className='breadcrumbs text-muted-foreground text-sm'>
                <span
                  className='cursor-pointer hover:underline'
                  onClick={handleBack}
                >
                  {entityName}
                </span>
                <ChevronRight className='mx-1 inline h-4 w-4' />
                <span className='text-foreground font-medium'>New</span>
              </div>
            </div>
          </div>

          {/* Action buttons in header */}
          <div className='flex space-x-2'>
            <Button 
              variant='outline' 
              size='sm'
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>

      {/* Entity header with icon/avatar */}
      <div className='mb-6 flex items-start space-x-4'>
        {getEntityIcon()}

        <div className='space-y-1'>
          <h1 className='text-2xl font-bold tracking-tight'>
            New {entityName}
          </h1>

          <div className='text-muted-foreground flex flex-wrap items-center gap-2 text-sm'>
            <Badge variant='outline' className='font-normal'>
              {entityName}
            </Badge>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className='flex items-center space-x-1 text-xs'>
                    <Clock className='h-3 w-3' />
                    <span>Creating now</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Being created at {formatDateTime(new Date())}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <div className='flex items-center space-x-1 text-xs'>
              <User className='h-3 w-3' />
              <span>Owner: You</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EntityCreateHeader
