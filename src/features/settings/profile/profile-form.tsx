import { useEffect, useState } from 'react'
import { z } from 'zod'
import { useFieldArray, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { sendMessageToBackgroundScript } from '@/background'
import { Loader2 } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'

const profileFormSchema = z.object({
  username: z
    .string()
    .min(2, {
      message: 'Username must be at least 2 characters.',
    })
    .max(30, {
      message: 'Username must not be longer than 30 characters.',
    }),
  email: z
    .string({
      required_error: 'Please select an email to display.',
    })
    .email(),
  bio: z.string().max(160).min(4),
  urls: z
    .array(
      z.object({
        value: z.string().url({ message: 'Please enter a valid URL.' }),
      })
    )
    .optional(),
})

type ProfileFormValues = z.infer<typeof profileFormSchema>

export default function ProfileForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userProfile, setUserProfile] = useState<any>(null)

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      username: '',
      email: '',
      bio: '',
      urls: [{ value: '' }],
    },
    mode: 'onChange',
  })

  const { fields, append } = useFieldArray({
    name: 'urls',
    control: form.control,
  })

  // Fetch user profile data
  useEffect(() => {
    const fetchUserProfile = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const authData = await sendMessageToBackgroundScript({
          type: 'getAuth',
        })
        console.log('authData', authData)

        if (authData && authData.user) {
          // Get more detailed creator profile if available
          let userAccount = authData.user

          setUserProfile({ ...authData })

          // Set form values
          form.reset({
            username: userAccount?.name || '',
            email: userAccount?.email || '',
            bio: userAccount?.bio || 'I own a computer.',
            urls: userAccount?.urls
              ? JSON.parse(userAccount.urls).map((url: string) => ({
                  value: url,
                }))
              : [{ value: 'https://example.com' }],
          })
        }
      } catch (err) {
        console.error('Error fetching user profile:', err)
        setError('Failed to load profile data. Please try again.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserProfile()
  }, [form])

  async function onSubmit(data: ProfileFormValues) {
    setIsLoading(true)
    try {
      // Prepare the payload
      const payload = {
        creator_id: userProfile?.creatorProfile?.reference_id,
        customer_id: userProfile?.customer?.reference_id,
        name: data.username,
        bio: data.bio,
        urls: JSON.stringify(data.urls.map((url) => url.value)),
      }

      // Determine which API to call based on whether creator profile exists
      const apiType = userProfile?.creatorProfile?.reference_id
        ? 'updateCreatorInfo'
        : 'addCreatorProfile'

      const response = await sendMessageToBackgroundScript({
        type: apiType,
        payload,
      })

      toast({
        title: 'Profile updated successfully',
        description: 'Your profile information has been updated.',
      })

      // Update local state with new data
      setUserProfile({
        ...userProfile,
        creatorProfile: response,
      })
    } catch (error: any) {
      console.error('Error updating profile:', error)
      toast({
        title: 'Failed to update profile',
        description: error.message || 'An unexpected error occurred',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading && !userProfile) {
    return (
      <div className='flex h-64 items-center justify-center'>
        <Loader2 className='text-primary h-8 w-8 animate-spin' />
        <span className='ml-2'>Loading profile data...</span>
      </div>
    )
  }

  if (error && !userProfile) {
    return (
      <div className='rounded-md border border-red-300 bg-red-50 p-4 text-red-800'>
        <h3 className='font-semibold'>Error</h3>
        <p>{error}</p>
        <Button
          variant='outline'
          className='mt-2'
          onClick={() => window.location.reload()}
        >
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-8'>
        <FormField
          control={form.control}
          name='username'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder='Enter your name' {...field} />
              </FormControl>
              <FormDescription>
                This is your public display name. It can be your real name or a
                pseudonym.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='email'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input disabled {...field} />
              </FormControl>
              <FormDescription>
                This is your verified email address. Contact support to change
                it.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        {/*<FormField*/}
        {/*  control={form.control}*/}
        {/*  name='bio'*/}
        {/*  render={({ field }) => (*/}
        {/*    <FormItem>*/}
        {/*      <FormLabel>Bio</FormLabel>*/}
        {/*      <FormControl>*/}
        {/*        <Textarea*/}
        {/*          placeholder='Tell us a little bit about yourself'*/}
        {/*          className='resize-none'*/}
        {/*          {...field}*/}
        {/*        />*/}
        {/*      </FormControl>*/}
        {/*      <FormDescription>*/}
        {/*        You can <span>@mention</span> other users and organizations to*/}
        {/*        link to them.*/}
        {/*      </FormDescription>*/}
        {/*      <FormMessage />*/}
        {/*    </FormItem>*/}
        {/*  )}*/}
        {/*/>*/}
        {/*<div>*/}
        {/*  {fields.map((field, index) => (*/}
        {/*    <FormField*/}
        {/*      control={form.control}*/}
        {/*      key={field.id}*/}
        {/*      name={`urls.${index}.value`}*/}
        {/*      render={({ field }) => (*/}
        {/*        <FormItem>*/}
        {/*          <FormLabel className={cn(index !== 0 && 'sr-only')}>*/}
        {/*            URLs*/}
        {/*          </FormLabel>*/}
        {/*          <FormDescription className={cn(index !== 0 && 'sr-only')}>*/}
        {/*            Add links to your website, blog, or social media profiles.*/}
        {/*          </FormDescription>*/}
        {/*          <FormControl>*/}
        {/*            <Input {...field} />*/}
        {/*          </FormControl>*/}
        {/*          <FormMessage />*/}
        {/*        </FormItem>*/}
        {/*      )}*/}
        {/*    />*/}
        {/*  ))}*/}
        {/*  <Button*/}
        {/*    type='button'*/}
        {/*    variant='outline'*/}
        {/*    size='sm'*/}
        {/*    className='mt-2'*/}
        {/*    onClick={() => append({ value: '' })}*/}
        {/*  >*/}
        {/*    Add URL*/}
        {/*  </Button>*/}
        {/*</div>*/}
        <Button type='submit' disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              Updating...
            </>
          ) : (
            'Update profile'
          )}
        </Button>
      </form>
    </Form>
  )
}
