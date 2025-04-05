import { HTMLAttributes, useState, useEffect } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from '@tanstack/react-router'
import { IconBrandFacebook, IconBrandGithub } from '@tabler/icons-react'
import { AlertCircle } from 'lucide-react'
import { useAuth } from '@/stores/authStore'
import { cn } from '@/lib/utils'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/use-toast'
import { PasswordInput } from '@/components/password-input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PinInput, PinInputField } from '@/components/pin-input'
import { Separator } from '@/components/ui/separator'

type UserAuthFormProps = HTMLAttributes<HTMLDivElement>

const passwordFormSchema = z.object({
  email: z
    .string()
    .min(1, { message: 'Please enter your email' })
    .email({ message: 'Invalid email address' }),
  password: z
    .string()
    .min(1, {
      message: 'Please enter your password',
    })
    .min(7, {
      message: 'Password must be at least 7 characters long',
    }),
})

const otpFormSchema = z.object({
  email: z
    .string()
    .min(1, { message: 'Please enter your email' })
    .email({ message: 'Invalid email address' }),
  otp: z.string().optional(),
})

export function UserAuthForm({ className, ...props }: UserAuthFormProps) {
  const { login, requestOtp, loginWithOtp, isLoading, error, isAuthenticated } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [formError, setFormError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<string>('password')
  const [otpRequested, setOtpRequested] = useState(false)
  const [otpDisabledBtn, setOtpDisabledBtn] = useState(true)

  const passwordForm = useForm<z.infer<typeof passwordFormSchema>>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const otpForm = useForm<z.infer<typeof otpFormSchema>>({
    resolver: zodResolver(otpFormSchema),
    defaultValues: {
      email: '',
      otp: '',
    },
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
    const passwordSubscription = passwordForm.watch(() => {
      if (formError) {
        setFormError(null)
      }
    })
    
    const otpSubscription = otpForm.watch(() => {
      if (formError) {
        setFormError(null)
      }
    })
    
    return () => {
      passwordSubscription.unsubscribe()
      otpSubscription.unsubscribe()
    }
  }, [passwordForm, otpForm, formError])

  async function onPasswordSubmit(data: z.infer<typeof passwordFormSchema>) {
    setFormError(null)
    try {
      await login(data.email, data.password)
    } catch (err: any) {
      // Error is handled by the auth store and will be displayed via the formError state
      console.error('Login error:', err)
    }
  }

  async function onOtpRequest(data: z.infer<typeof otpFormSchema>) {
    setFormError(null)
    try {
      await requestOtp(data.email)
      setOtpRequested(true)
      toast({
        title: "OTP Sent",
        description: `A verification code has been sent to ${data.email}`,
      })
    } catch (err: any) {
      console.error('OTP request error:', err)
    }
  }

  async function onOtpSubmit(data: z.infer<typeof otpFormSchema>) {
    if (!data.otp) {
      setFormError('Please enter the OTP code')
      return
    }
    
    setFormError(null)
    try {
      await loginWithOtp(data.email, data.otp)
    } catch (err: any) {
      console.error('OTP login error:', err)
    }
  }

  return (
    <div className={cn('grid gap-6', className)} {...props}>
      <Tabs defaultValue="password" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="password">Password</TabsTrigger>
          <TabsTrigger value="otp">OTP</TabsTrigger>
        </TabsList>
        
        {formError && (
          <Alert variant='destructive' className='mt-4 mb-2'>
            <AlertCircle className='h-4 w-4' />
            <AlertTitle>Authentication failed</AlertTitle>
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        )}
        
        <TabsContent value="password">
          <Form {...passwordForm}>
            <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4 mt-4">
              <FormField
                control={passwordForm.control}
                name='email'
                render={({ field }) => (
                  <FormItem className='space-y-1'>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder='name@example.com' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={passwordForm.control}
                name='password'
                render={({ field }) => (
                  <FormItem className='space-y-1'>
                    <div className='flex items-center justify-between'>
                      <FormLabel>Password</FormLabel>
                      <Link
                        to='/forgot-password'
                        className='text-muted-foreground text-sm font-medium hover:opacity-75'
                      >
                        Forgot password?
                      </Link>
                    </div>
                    <FormControl>
                      <PasswordInput placeholder='********' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button className='w-full' disabled={isLoading}>
                {isLoading ? 'Logging in...' : 'Login with Password'}
              </Button>
            </form>
          </Form>
        </TabsContent>
        
        <TabsContent value="otp">
          <Form {...otpForm}>
            <form className="space-y-4 mt-4">
              <FormField
                control={otpForm.control}
                name='email'
                render={({ field }) => (
                  <FormItem className='space-y-1'>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder='name@example.com' 
                        {...field} 
                        disabled={otpRequested && !formError}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {!otpRequested ? (
                <Button 
                  type="button"
                  className='w-full' 
                  disabled={isLoading || !otpForm.formState.isValid}
                  onClick={otpForm.handleSubmit(onOtpRequest)}
                >
                  {isLoading ? 'Sending...' : 'Send OTP'}
                </Button>
              ) : (
                <>
                  <FormField
                    control={otpForm.control}
                    name='otp'
                    render={({ field }) => (
                      <FormItem className='space-y-1'>
                        <FormLabel>Verification Code</FormLabel>
                        <FormControl>
                          <PinInput
                            {...field}
                            className='flex h-10 justify-between'
                            onComplete={() => setOtpDisabledBtn(false)}
                            onIncomplete={() => setOtpDisabledBtn(true)}
                          >
                            {Array.from({ length: 4 }, (_, i) => (
                              <PinInputField
                                key={i}
                                component={Input}
                                className={`${otpForm.getFieldState('otp').invalid ? 'border-red-500' : ''}`}
                              />
                            ))}
                          </PinInput>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex flex-col gap-2">
                    <Button 
                      type="button"
                      className='w-full' 
                      disabled={isLoading || otpDisabledBtn}
                      onClick={otpForm.handleSubmit(onOtpSubmit)}
                    >
                      {isLoading ? 'Verifying...' : 'Login with OTP'}
                    </Button>
                    
                    <Button 
                      type="button"
                      variant="outline"
                      className='w-full' 
                      onClick={() => {
                        setOtpRequested(false)
                        otpForm.reset({ email: otpForm.getValues().email, otp: '' })
                      }}
                    >
                      Request new OTP
                    </Button>
                  </div>
                </>
              )}
            </form>
          </Form>
        </TabsContent>
      </Tabs>

      <div className="text-center mt-2">
        <span className="text-sm text-muted-foreground">
          Don't have an account?{' '}
          <Link
            to='/sign-up'
            className='text-primary font-medium hover:underline'
          >
            Sign up
          </Link>
        </span>
      </div>

      <div className='relative my-2'>
        <div className='absolute inset-0 flex items-center'>
          <span className='w-full border-t' />
        </div>
        <div className='relative flex justify-center text-xs uppercase'>
          <span className='bg-background text-muted-foreground px-2'>
            Or continue with
          </span>
        </div>
      </div>

      <div className='flex items-center gap-2'>
        <Button
          variant='outline'
          className='w-full'
          type='button'
          disabled={isLoading}
        >
          <IconBrandGithub className='h-4 w-4' /> GitHub
        </Button>
        <Button
          variant='outline'
          className='w-full'
          type='button'
          disabled={isLoading}
        >
          <IconBrandFacebook className='h-4 w-4' /> Facebook
        </Button>
      </div>
    </div>
  )
}
