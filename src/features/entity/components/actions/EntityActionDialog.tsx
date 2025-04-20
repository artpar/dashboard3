import React, { useEffect, useState } from 'react'
import * as z from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { ActionField, EntityAction } from '../../hooks/useEntityActions'

interface EntityActionDialogProps {
  action: EntityAction
  isOpen: boolean
  isLoading: boolean
  onClose: () => void
  onExecute: (actionName: string, payload: Record<string, any>) => Promise<any>
}

export const EntityActionDialog: React.FC<EntityActionDialogProps> = ({
                                                                        action,
                                                                        isOpen,
                                                                        isLoading,
                                                                        onClose,
                                                                        onExecute,
                                                                      }) => {
  // Generate a dynamic schema based on action fields
  const [formSchema, setFormSchema] = useState<z.ZodObject<any>>(z.object({}))

  // Create the form schema dynamically based on action fields
  useEffect(() => {
    if (!action) return

    const schemaFields: Record<string, any> = {}

    if (action.InFields) {
      action.InFields.forEach((field: ActionField) => {
        let fieldSchema: any = z.string()

        // Handle different field types
        switch (field.ColumnType) {
          case 'truefalse':
            fieldSchema = z.boolean()
            break
          case 'measurement':
          case 'value':
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

        // Apply nullable constraint
        if (field.IsNullable) {
          fieldSchema = fieldSchema.optional()
        } else {
          fieldSchema = fieldSchema.min(1, {
            message: 'This field is required',
          })
        }

        schemaFields[field.ColumnName] = fieldSchema
      })
    }

    setFormSchema(z.object(schemaFields))
  }, [action]) // Only depend on action, not form

  // Initialize form with the schema
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {},
  })

  // Set default values when action changes
  useEffect(() => {
    if (!action || !action.InFields) return

    const defaultValues: Record<string, any> = {}

    action.InFields.forEach((field: ActionField) => {
      if (field.DefaultValue) {
        // Parse default values based on field type
        switch (field.ColumnType) {
          case 'truefalse':
            defaultValues[field.ColumnName] = field.DefaultValue === 'true'
            break
          case 'measurement':
          case 'value':
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
            defaultValues[field.ColumnName] = 0
            break
          default:
            defaultValues[field.ColumnName] = ''
        }
      }
    })

    // Only reset the form if there are actual changes in default values
    // This prevents unnecessary re-renders
    form.reset(defaultValues)
  }, [action, formSchema]) // Add formSchema as a dependency

  // Handle form submission
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await onExecute(action.ActionName, values)
      onClose()
    } catch (error) {
      console.error('Error executing action:', error)
    }
  }

  // Render field based on its type
  const renderField = (field: ActionField) => {
    switch (field.ColumnType) {
      case 'truefalse':
        return (
          <FormField
            key={field.ColumnName}
            control={form.control}
            name={field.ColumnName}
            render={({ field: formField }) => (
              <FormItem className='flex flex-row items-center justify-between rounded-lg border p-4'>
                <div className='space-y-0.5'>
                  <FormLabel className='text-base'>{field.Name}</FormLabel>
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
        return (
          <FormField
            key={field.ColumnName}
            control={form.control}
            name={field.ColumnName}
            render={({ field: formField }) => (
              <FormItem>
                <FormLabel>{field.Name}</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder={`Enter ${field.Name.toLowerCase()}`}
                    className='min-h-[100px] resize-y'
                    {...formField}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )

      case 'label':
      case 'email':
      case 'name':
      case 'alias':
      default:
        return (
          <FormField
            key={field.ColumnName}
            control={form.control}
            name={field.ColumnName}
            render={({ field: formField }) => (
              <FormItem>
                <FormLabel>{field.Name}</FormLabel>
                <FormControl>
                  <Input
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
    if (!action || !action.InFields) return <p>No input fields required</p>

    return action.InFields.length > 0
      ? action.InFields.map((field) => renderField(field))
      : <p>No input fields required</p>
  }, [action, form.formState])

  if (!action) return null

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-[500px]'>
        <DialogHeader>
          <DialogTitle>{action.Label}</DialogTitle>
          <DialogDescription>
            Fill in the required information to execute this action.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className='space-y-6 py-4'
          >
            {fieldElements}

            <DialogFooter>
              <Button type='button' variant='outline' onClick={onClose}>
                Cancel
              </Button>
              <Button type='submit' disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    Processing...
                  </>
                ) : (
                  'Execute'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export default EntityActionDialog
