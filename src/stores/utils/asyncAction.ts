/**
 * Utility to wrap async store actions with consistent loading and error handling
 */

type SetState<T> = (partial: Partial<T> | ((state: T) => Partial<T>)) => void

interface AsyncActionState {
  isLoading: boolean
  error: string | null
}

/**
 * Extracts error message from various error formats
 */
export function extractErrorMessage(error: unknown, defaultMessage: string): string {
  if (error && typeof error === 'object') {
    const err = error as Record<string, unknown>
    if (typeof err.error === 'string') return err.error
    if (typeof err.message === 'string') return err.message
  }
  if (error instanceof Error) return error.message
  return defaultMessage
}

/**
 * Creates an async action wrapper with loading state and error handling
 *
 * @example
 * ```typescript
 * login: createAsyncAction(set, async (email, password) => {
 *   await sendMessageToBackgroundScript({ type: 'signIn', email, password })
 * }, 'Failed to login')
 * ```
 */
export function createAsyncAction<TState extends AsyncActionState, TArgs extends unknown[], TResult>(
  set: SetState<TState>,
  action: (...args: TArgs) => Promise<TResult>,
  defaultErrorMessage: string
) {
  return async (...args: TArgs): Promise<TResult | undefined> => {
    try {
      set({ isLoading: true, error: null } as Partial<TState>)
      const result = await action(...args)
      set({ isLoading: false } as Partial<TState>)
      return result
    } catch (error) {
      set({
        isLoading: false,
        error: extractErrorMessage(error, defaultErrorMessage),
      } as Partial<TState>)
      return undefined
    }
  }
}
