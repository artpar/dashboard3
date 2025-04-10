// Base hook for common entity data operations
import { useContext } from 'react'
import { BaseEntityContextType } from '../providers/BaseEntityDataProvider'

export const useEntityData = <T extends BaseEntityContextType>(
  context: React.Context<T | undefined>,
  errorMessage: string
) => {
  const contextData = useContext(context)
  if (contextData === undefined) {
    throw new Error(errorMessage)
  }
  return contextData
}