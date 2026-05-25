import { Link, useNavigate } from '@tanstack/react-router'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Server } from 'lucide-react'
import { useForm } from 'react-hook-form'
import * as z from 'zod'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
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
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/components/ui/use-toast'
import { EntityApiService } from '@/features/entity/services/EntityApiService'

const formSchema = z.object({
  hostname: z.string().min(1, 'Hostname is required'),
  listen_interface: z.string().min(1, 'Listen interface is required'),
  is_enabled: z.boolean().default(true),
  always_on_tls: z.boolean().default(true),
  authentication_required: z.boolean().default(true),
  xclient_on: z.boolean().default(false),
  max_clients: z.coerce.number().int().min(1),
  max_size: z.coerce.number().int().min(1),
})

type FormData = z.infer<typeof formSchema>

export function MailServerForm() {
  const navigate = useNavigate()
  const { toast } = useToast()

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      hostname: '',
      listen_interface: '0.0.0.0:465',
      is_enabled: true,
      always_on_tls: true,
      authentication_required: true,
      xclient_on: false,
      max_clients: 20,
      max_size: 10000,
    },
  })

  async function onSubmit(data: FormData) {
    console.log('Native mail_server create start', data)
    try {
      await EntityApiService.createEntity('mail_server', data)
      console.log('Native mail_server create complete', {
        hostname: data.hostname,
        listen_interface: data.listen_interface,
      })
      toast({
        title: 'Mail server created',
        description:
          'Run Sync Mail Servers, then restart Daptin if this is the first mail server.',
      })
      navigate({ to: '/mail/servers' })
    } catch (error) {
      console.error('Native mail_server create failed', error)
      toast({
        title: 'Error creating mail server',
        description:
          error instanceof Error
            ? error.message
            : 'Daptin rejected the mail server row',
        variant: 'destructive',
      })
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className='max-w-3xl space-y-6 pb-8'
      >
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2 text-base'>
              <Server className='h-4 w-4' />
              Native SMTP listener
            </CardTitle>
            <CardDescription>
              This creates a Daptin <code>mail_server</code> row. It is not a
              third-party SMTP provider integration.
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-5'>
            <FormField
              control={form.control}
              name='hostname'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hostname</FormLabel>
                  <FormControl>
                    <Input placeholder='mail.example.com' {...field} />
                  </FormControl>
                  <FormDescription>
                    Domain handled by Daptin for native SMTP mail.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='listen_interface'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Listen interface</FormLabel>
                  <FormControl>
                    <Input placeholder='0.0.0.0:465' {...field} />
                  </FormControl>
                  <FormDescription>
                    Bind address and port used by Daptin SMTP.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='max_clients'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Max clients</FormLabel>
                  <FormControl>
                    <Input type='number' min={1} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='max_size'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Max message size</FormLabel>
                  <FormControl>
                    <Input type='number' min={1} {...field} />
                  </FormControl>
                  <FormDescription>
                    Native Daptin <code>max_size</code> value for accepted
                    messages.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className='text-base'>Runtime flags</CardTitle>
            <CardDescription>
              These fields map directly to Daptin <code>mail_server</code>
              columns.
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-5'>
            {[
              {
                name: 'is_enabled' as const,
                label: 'Enabled',
                description: 'Allow this server row to be loaded by Daptin.',
              },
              {
                name: 'always_on_tls' as const,
                label: 'Always on TLS',
                description: 'Require TLS for the native SMTP listener.',
              },
              {
                name: 'authentication_required' as const,
                label: 'Authentication required',
                description:
                  'Authenticate SMTP users against Daptin mail accounts.',
              },
              {
                name: 'xclient_on' as const,
                label: 'XCLIENT enabled',
                description:
                  'Enable XCLIENT behavior for trusted upstream SMTP traffic.',
              },
            ].map((item) => (
              <FormField
                key={item.name}
                control={form.control}
                name={item.name}
                render={({ field }) => (
                  <FormItem className='flex items-center justify-between gap-4 rounded-md border p-4'>
                    <div className='space-y-1'>
                      <FormLabel>{item.label}</FormLabel>
                      <FormDescription>{item.description}</FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            ))}
          </CardContent>
        </Card>

        <div className='flex items-center gap-3'>
          <Button type='submit' disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? (
              <Loader2 className='mr-2 h-4 w-4 animate-spin' />
            ) : (
              <Server className='mr-2 h-4 w-4' />
            )}
            Create mail server
          </Button>
          <Button asChild type='button' variant='outline'>
            <Link to='/mail/servers'>Cancel</Link>
          </Button>
        </div>
      </form>
    </Form>
  )
}
