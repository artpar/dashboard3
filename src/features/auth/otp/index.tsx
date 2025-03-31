import { Link } from '@tanstack/react-router'
import { Card } from '@/components/ui/card'
import AuthLayout from '../auth-layout'
import { OtpForm } from './components/otp-form'
import { useAuth } from '@/stores/authStore'
import { useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'

export default function Otp() {
  const { emailForOtp } = useAuth()
  const navigate = useNavigate()

  // Redirect to sign-in if no email is set for OTP
  useEffect(() => {
    if (!emailForOtp) {
      navigate({ to: '/sign-in' })
    }
  }, [emailForOtp, navigate])

  return (
    <AuthLayout>
      <Card className='p-6'>
        <div className='mb-4 flex flex-col space-y-2 text-left'>
          <h1 className='text-xl font-semibold tracking-tight'>
            Verification Code
          </h1>
          <p className='text-muted-foreground text-sm'>
            Please enter the authentication code. <br /> 
            We have sent the verification code to {emailForOtp ? <span className="font-medium">{emailForOtp}</span> : 'your email'}.
          </p>
        </div>
        <OtpForm />
        <div className='text-muted-foreground mt-4 px-8 text-center text-sm'>
          <p className="mb-2">
            Haven't received it?{' '}
            <button
              onClick={() => {
                // This would trigger a resend OTP action
                // For now, we'll just show a message
                alert('A new code has been sent to your email.')
              }}
              className='hover:text-primary underline underline-offset-4'
            >
              Resend a new code
            </button>
          </p>
          <p>
            <Link
              to='/sign-in'
              className='hover:text-primary underline underline-offset-4'
            >
              Back to sign in
            </Link>
          </p>
        </div>
      </Card>
    </AuthLayout>
  )
}
