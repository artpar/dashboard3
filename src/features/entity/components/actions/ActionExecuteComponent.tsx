import React, { useEffect, useState } from 'react'
import * as z from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'

// Define the field interface based on the action schema
export interface ActionSchemaField {
  Name: string
  ColumnName: string
  ColumnType: string
  ColumnDescription?: string
  IsNullable: boolean
  DefaultValue?: string
  Options?: any
  IsPrimaryKey?: boolean
  IsAutoIncrement?: boolean
  IsIndexed?: boolean
  IsUnique?: boolean
  Permission?: number
  IsForeignKey?: boolean
  ExcludeFromApi?: boolean
  ForeignKeyData?: {
    DataSource: string
    Namespace: string
    KeyName: string
  }
  DataType?: string
}

// Define the action schema interface
export interface ActionSchema {
  Name: string
  Label: string
  OnType: string
  InstanceOptional: boolean
  RequestSubjectRelations?: any
  ReferenceId: string
  InFields: ActionSchemaField[]
  OutFields: any[]
  Validations?: any[]
  Conformations?: any[]
}

interface ActionExecuteComponentProps {
  actionSchema: ActionSchema
  onExecute: (actionName: string, payload: Record<string, any>) => Promise<any>
  className?: string
  isLoading?: boolean
  variant?: 'default' | 'compact'
}

export const ActionExecuteComponent: React.FC<ActionExecuteComponentProps> = ({
  actionSchema,
  onExecute,
  onCancel,
  className,
  isLoading = false,
  variant = 'default',
}) => {
  // Generate a dynamic schema based on action fields
  const [formSchema, setFormSchema] = useState<z.ZodObject<any>>(z.object({}))

  // Create the form schema dynamically based on action fields
  useEffect(() => {
    if (!actionSchema) return

    const schemaFields: Record<string, any> = {}

    if (actionSchema.InFields) {
      actionSchema.InFields.forEach((field: ActionSchemaField) => {
        let fieldSchema: any = z.string()

        // Handle different field types
        switch (field.ColumnType) {
          case 'truefalse':
            fieldSchema = z.boolean()
            break
          case 'measurement':
          case 'value':
          case 'number':
            fieldSchema = z.coerce.number()
            break
          case 'json':
            fieldSchema = z.string().refine(
              (val) => {
                try {
                  JSON.parse(val)
                  return true
                } catch (e) {
                  return false
                }
              },
              { message: 'Invalid JSON format' }
            )
            break
          case 'email':
            fieldSchema = z.string().email({ message: 'Invalid email address' })
            break
          case 'password':
            fieldSchema = z
              .string()
              .min(8, { message: 'Password must be at least 8 characters' })
            break
          case 'file':
          case 'file.json':
          case 'file.yaml':
          case 'file.toml':
          case 'file.hcl':
          case 'file.csv':
          case 'file.xls':
          case 'file.xlsx':
            // For file fields, we'll handle them specially
            fieldSchema = z.any().optional()
            break
          default:
            fieldSchema = z.string()
        }

        fieldSchema = fieldSchema.optional()
        schemaFields[field.ColumnName] = fieldSchema
      })
    }

    // Add special validation for password confirmation if it exists
    const schema = z.object(schemaFields)
    const passwordField = actionSchema.InFields.find(
      (f) => f.ColumnName === 'password'
    )
    const passwordConfirmField = actionSchema.InFields.find(
      (f) => f.ColumnName === 'passwordConfirm'
    )

    if (passwordField && passwordConfirmField) {
      setFormSchema(
        schema.refine((data) => data.password === data.passwordConfirm, {
          message: "Passwords don't match",
          path: ['passwordConfirm'],
        })
      )
    } else {
      setFormSchema(schema)
    }
  }, [actionSchema])

  // Initialize form with the schema
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {},
  })

  // Set default values when action changes
  useEffect(() => {
    if (!actionSchema || !actionSchema.InFields) return

    const defaultValues: Record<string, any> = {}

    actionSchema.InFields.forEach((field: ActionSchemaField) => {
      if (field.DefaultValue) {
        // Parse default values based on field type
        switch (field.ColumnType) {
          case 'truefalse':
            defaultValues[field.ColumnName] = field.DefaultValue === 'true'
            break
          case 'measurement':
          case 'value':
          case 'number':
            defaultValues[field.ColumnName] = parseFloat(field.DefaultValue)
            break
          default:
            defaultValues[field.ColumnName] = field.DefaultValue
        }
      } else {
        // Set empty defaults based on field type
        switch (field.ColumnType) {
          case 'truefalse':
            defaultValues[field.ColumnName] = false
            break
          case 'measurement':
          case 'value':
          case 'number':
            defaultValues[field.ColumnName] = 0
            break
          default:
            defaultValues[field.ColumnName] = ''
        }
      }
    })

    form.reset(defaultValues)
  }, [actionSchema, formSchema])

  // Handle form submission
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await onExecute(values)
      form.reset() // Reset form after successful submission
    } catch (error) {
      console.error('Error executing action:', error)
    }
  }

  // Render field based on its type
  const renderField = (field: ActionSchemaField) => {
    const isCompact = variant === 'compact'

    switch (field.ColumnType) {
      case 'truefalse':
        return (
          <FormField
            key={field.ColumnName}
            control={form.control}
            name={field.ColumnName}
            render={({ field: formField }) => (
              <FormItem
                className={cn(
                  'flex flex-row items-center justify-between',
                  isCompact ? 'p-2' : 'rounded-lg border p-4'
                )}
              >
                <div className='space-y-0.5'>
                  <FormLabel className={isCompact ? 'text-sm' : 'text-base'}>
                    {field.Name}
                    {field.ColumnDescription && (
                      <span className='text-muted-foreground ml-1 text-xs'>
                        ({field.ColumnDescription})
                      </span>
                    )}
                  </FormLabel>
                </div>
                <FormControl>
                  <Switch
                    checked={formField.value}
                    onCheckedChange={formField.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )

      case 'content':
      case 'json':
      case 'description':
        return (
          <FormField
            key={field.ColumnName}
            control={form.control}
            name={field.ColumnName}
            render={({ field: formField }) => (
              <FormItem className={isCompact ? 'space-y-1' : 'space-y-2'}>
                <FormLabel>
                  {field.Name}
                  {field.IsNullable && (
                    <span className='text-muted-foreground ml-1'>
                      (Optional)
                    </span>
                  )}
                </FormLabel>
                {field.ColumnDescription && (
                  <p className='text-muted-foreground text-xs'>
                    {field.ColumnDescription}
                  </p>
                )}
                <FormControl>
                  <Textarea
                    placeholder={`Enter ${field.Name.toLowerCase()}`}
                    className={cn(
                      'resize-y',
                      isCompact ? 'min-h-[80px]' : 'min-h-[100px]'
                    )}
                    {...formField}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )

      case 'password':
        return (
          <FormField
            key={field.ColumnName}
            control={form.control}
            name={field.ColumnName}
            render={({ field: formField }) => (
              <FormItem className={isCompact ? 'space-y-1' : 'space-y-2'}>
                <FormLabel>
                  {field.Name}
                  {field.IsNullable && (
                    <span className='text-muted-foreground ml-1'>
                      (Optional)
                    </span>
                  )}
                </FormLabel>
                {field.ColumnDescription && (
                  <p className='text-muted-foreground text-xs'>
                    {field.ColumnDescription}
                  </p>
                )}
                <FormControl>
                  <Input
                    type='password'
                    placeholder={`Enter ${field.Name.toLowerCase()}`}
                    {...formField}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )

      case 'email':
      case 'label':
      case 'name':
      case 'alias':
      default:
        return (
          <FormField
            key={field.ColumnName}
            control={form.control}
            name={field.ColumnName}
            render={({ field: formField }) => (
              <FormItem className={isCompact ? 'space-y-1' : 'space-y-2'}>
                <FormLabel>
                  {field.Name}
                  {field.IsNullable && (
                    <span className='text-muted-foreground ml-1'>
                      (Optional)
                    </span>
                  )}
                </FormLabel>
                {field.ColumnDescription && (
                  <p className='text-muted-foreground text-xs'>
                    {field.ColumnDescription}
                  </p>
                )}
                <FormControl>
                  <Input
                    type={field.ColumnType === 'email' ? 'email' : 'text'}
                    placeholder={`Enter ${field.Name.toLowerCase()}`}
                    {...formField}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )
    }
  }

  // Memoize the rendered fields to prevent unnecessary re-renders
  const fieldElements = React.useMemo(() => {
    if (!actionSchema || !actionSchema.InFields)
      return <p>No input fields required</p>

    return actionSchema.InFields.length > 0 ? (
      actionSchema.InFields.map((field) => renderField(field))
    ) : (
      <p>No input fields required</p>
    )
  }, [actionSchema, renderField])

  if (!actionSchema) return null

  // Render as a card for default variant
  if (variant === 'default') {
    return (
      <Card className={cn('w-full border-0 shadow-none', className)}>
        <CardHeader>
          <CardTitle>{actionSchema.Label}</CardTitle>
          <CardDescription>
            Fill in the required information to execute this action.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              id={`action-form-${actionSchema.Name}`}
              onSubmit={form.handleSubmit(onSubmit)}
              className='space-y-4'
            >
              {fieldElements}
            </form>
          </Form>
        </CardContent>
        <CardFooter className='flex justify-end space-x-2'>
          <Button
            onClick={() => {
              onCancel()
            }}
            type='reset'
            form={`action-form-${actionSchema.Name}`}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                Processing...
              </>
            ) : (
              'Cancel'
            )}
          </Button>
          <Button
            type='submit'
            form={`action-form-${actionSchema.Name}`}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                Processing...
              </>
            ) : (
              'Execute'
            )}
          </Button>
        </CardFooter>
      </Card>
    )
  }

  // Render as a compact form for compact variant
  return (
    <div className={cn('w-full', className)}>
      <Form {...form}>
        <form
          id={`action-form-${actionSchema.Name}`}
          onSubmit={form.handleSubmit(onSubmit)}
          className='space-y-3'
        >
          <div className='mb-3'>
            <h3 className='text-lg font-medium'>{actionSchema.Label}</h3>
            <p className='text-muted-foreground text-sm'>
              Fill in the required information to execute this action.
            </p>
          </div>

          {fieldElements}

          <div className='flex justify-end pt-2'>
            <Button type='submit' disabled={isLoading} size='sm'>
              {isLoading ? (
                <>
                  <Loader2 className='mr-2 h-3 w-3 animate-spin' />
                  Processing...
                </>
              ) : (
                'Execute'
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}

export default ActionExecuteComponent
