import React from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useToast } from '@/components/ui/use-toast'
import EntityForm from '@/features/entity/components/EntityForm'

interface EntityCreateFormProps {
  entityName: string
}

/**
 * Container component for entity creation form
 * This component wraps the EntityForm and handles navigation and toast notifications
 */
export const EntityCreateForm: React.FC<EntityCreateFormProps> = ({
  entityName,
}) => {
  const navigate = useNavigate()
  const { toast } = useToast()

  return (
    <div className="flex-1 overflow-auto">
      <EntityForm
        mode='create'
        onClose={() => {
          toast({
            title: 'Success',
            description: `${entityName} created successfully`,
          })
          navigate({
            to: `/${entityName}`
          })
        }}
      />
    </div>
  )
}

export default EntityCreateForm
