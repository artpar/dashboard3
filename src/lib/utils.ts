import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Validate a Daptin API response and throw if errors exist.
 * Reduces duplicate error checking across API service methods.
 */
export function validateDaptinResponse(
  response: { errors?: Array<{ detail?: string }> },
  defaultErrorMessage: string
): void {
  if (response.errors && response.errors.length) {
    throw new Error(response.errors[0].detail || defaultErrorMessage)
  }
}
