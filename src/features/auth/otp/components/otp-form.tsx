import { HTMLAttributes, useState, useEffect } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate, Link } from '@tanstack/react-router'
import { AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/stores/authStore'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { PinInput, PinInputField } from '@/components/pin-input'

type OtpFormProps = HTMLAttributes<HTMLDivElement>

const formSchema = z.object({
  otp: z.string().min(1, { message: 'Please enter your OTP code.' }),
})

export function OtpForm({ className, ...props }: OtpFormProps) {
  const navigate = useNavigate()
  const { loginWithOtp, isLoading, error, isAuthenticated, emailForOtp } = useAuth()
  const [disabledBtn, setDisabledBtn] = useState(true)
  const [formError, setFormError] = useState<string | null>(null)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { otp: '' },
  })

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate({ to: '/' })
    }
  }, [isAuthenticated, navigate])

  // Update local form error state when auth store error changes
  useEffect(() => {
    if (error) {
      setFormError(error)
    }
  }, [error])

  // Clear form error when form values change
  useEffect(() => {
    const subscription = form.watch(() => {
      if (formError) {
        setFormError(null)
      }
    })
    return () => subscription.unsubscribe()
  }, [form, formError])

  // Redirect to sign-in if no email is set for OTP
  useEffect(() => {
    if (!emailForOtp) {
      navigate({ to: '/sign-in' })
    }
  }, [emailForOtp, navigate])

  async function onSubmit(data: z.infer<typeof formSchema>) {
    setFormError(null)
    if (!emailForOtp) {
      setFormError('Email not found. Please go back to sign-in.')
      return
    }
    
    try {
      await loginWithOtp(emailForOtp, data.otp)
    } catch (err: any) {
      console.error('OTP verification error:', err)
    }
  }

  return (
    <div className={cn('grid gap-6', className)} {...props}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className='grid gap-2'>
            {formError && (
              <Alert variant='destructive' className='mb-2'>
                <AlertCircle className='h-4 w-4' />
                <AlertTitle>Verification failed</AlertTitle>
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            )}
            
            {emailForOtp && (
              <p className="text-sm text-muted-foreground mb-2">
                Verifying OTP for: <span className="font-medium">{emailForOtp}</span>
              </p>
            )}
            
            <FormField
              control={form.control}
              name='otp'
              render={({ field }) => (
                <FormItem className='space-y-1'>
                  <FormControl>
                    <PinInput
                      {...field}
                      className='flex h-10 justify-between'
                      onComplete={() => setDisabledBtn(false)}
                      onIncomplete={() => setDisabledBtn(true)}
                    >
                      {Array.from({ length: 7 }, (_, i) => {
                        if (i === 3)
                          return <Separator key={i} orientation='vertical' />
                        return (
                          <PinInputField
                            key={i}
                            component={Input}
                            className={`${form.getFieldState('otp').invalid ? 'border-red-500' : ''}`}
                          />
                        )
                      })}
                    </PinInput>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button className='mt-2' disabled={disabledBtn || isLoading}>
              {isLoading ? 'Verifying...' : 'Verify'}
            </Button>
            
            <div className="mt-4 text-center">
              <Link
                to='/sign-in'
                className='text-sm text-muted-foreground hover:text-primary'
              >
                Back to sign-in
              </Link>
            </div>
          </div>
        </form>
      </Form>
    </div>
  )
}
