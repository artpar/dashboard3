import { useEffect, useState } from 'react'
import { FieldValues, UseFormReturn } from 'react-hook-form'

/**
 * Hook for managing form error state with external error synchronization
 * and automatic clearing when form values change.
 *
 * @param forms - Single form or array of forms to watch for changes
 * @param externalError - External error state (e.g., from auth store)
 */
export function useFormErrorHandler<T extends FieldValues>(
  forms: UseFormReturn<T> | UseFormReturn<T>[],
  externalError: string | null
) {
  const [formError, setFormError] = useState<string | null>(null)

  // Sync external error to local state
  useEffect(() => {
    if (externalError) {
      setFormError(externalError)
    }
  }, [externalError])

  // Clear form error when any form values change
  useEffect(() => {
    const formArray = Array.isArray(forms) ? forms : [forms]
    const subscriptions = formArray.map((form) =>
      form.watch(() => {
        if (formError) {
          setFormError(null)
        }
      })
    )

    return () => {
      subscriptions.forEach((sub) => sub.unsubscribe())
    }
  }, [forms, formError])

  return {
    formError,
    setFormError,
    clearFormError: () => setFormError(null),
  }
}
