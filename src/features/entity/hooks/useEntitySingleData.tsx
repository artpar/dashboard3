// Custom hook to use the single entity context
import React from 'react'
import { SingleEntityContext } from '@/features/entity/SingleEntityDataProvider.tsx'

export const useEntitySingleEntity = () => {
  const context = React.useContext(SingleEntityContext)
  if (context === undefined) {
    throw new Error(
      'useSingleEntity must be used within a SingleEntityProvider'
    )
  }
  return context
}
