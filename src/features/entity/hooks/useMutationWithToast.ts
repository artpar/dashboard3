import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/components/ui/use-toast'

interface MutationWithToastOptions<TData, TVariables> {
  mutationFn: (variables: TVariables) => Promise<TData>
  invalidateKey?: string[]
  successMessage: string
  errorMessage: string
  onSuccess?: (data: TData) => void
  onError?: (error: Error) => void
}

/**
 * A wrapper around useMutation that automatically handles toast notifications
 * for success and error states, and invalidates query cache on success.
 */
export function useMutationWithToast<TData = unknown, TVariables = unknown>({
  mutationFn,
  invalidateKey,
  successMessage,
  errorMessage,
  onSuccess,
  onError,
}: MutationWithToastOptions<TData, TVariables>) {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn,
    onSuccess: (data) => {
      if (invalidateKey) {
        queryClient.invalidateQueries({ queryKey: invalidateKey })
      }
      toast({
        title: 'Success',
        description: successMessage,
      })
      onSuccess?.(data)
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: errorMessage,
        description: error.message || 'An error occurred',
      })
      onError?.(error)
    },
  })
}
