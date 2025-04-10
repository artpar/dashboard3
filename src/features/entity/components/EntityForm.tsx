import React, { useEffect, useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { DialogFooter } from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ColumnEditor } from '@/features/entity/columns/ColumnComponentManager'
import { ColumnDefinition } from '@/features/entity/columns/types'
import { useEntityData } from '@/features/entity/hooks/useEntityData'
import { useQuery } from '@tanstack/react-query'
import { daptinClient } from '@/daptin.ts'
import { safelySerializeData } from '@/features/entity/utils/serializer.ts'

interface EntityFormProps {
  mode: 'create' | 'edit'
  entityId: string | undefined
  onClose: () => void
}

export const EntityForm: React.FC<EntityFormProps> = ({ mode, entityId, onClose }) => {
  const { entityName, columns, schema, selectedItem, setSelectedItem, createItem, updateItem } =
    useEntityData()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState('basic')
  const [originalValues, setOriginalValues] = useState<Record<string, any>>({})
  const { toast } = useToast()
  const columnMap = {}
  columns.map((column) => {
    columnMap[column.ColumnName] = column
  })

  // Group columns for tab organization
  const [localColumns, setLocalColumns] = useState<ColumnDefinition[]>(
    columns || []
  )

  // Update local columns when columns from context change and are not empty
  useEffect(() => {
    if (columns && columns.length > 0) {
      setLocalColumns(
        columns.sort((a, b) => a.ColumnName.localeCompare(b.ColumnName))
      )
    }
  }, [columns]);

  // Fetch the specific entity item
  const {
    data: entityItem,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: [`entity-${entityName}-details`, entityId],
    queryFn: async () => {
      try {
        const response = await daptinClient.jsonApi.find(entityName, entityId, {
          included_relations: '*', // Try to fetch related data
        })

        if (response.errors && response.errors.length) {
          throw new Error(
            response.errors[0].detail || `Failed to fetch ${entityName} details`
          )
        }

        // Safely serialize the data to handle circular references
        return safelySerializeData(response.data)
      } catch (err) {
        console.error(`Error fetching ${entityName} details:`, err)
        throw err
      }
    },
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });

  // Set the selected item when data is loaded
  useEffect(() => {
    if (entityItem) {
      setSelectedItem(entityItem)
    }
  }, [entityItem, setSelectedItem])



  // Identify column groups for tabs
  const basicColumns = localColumns.filter(
    (col) =>
      !col.ColumnName.endsWith('_id') &&
      ![
        'id',
        'reference_id',
        'created_at',
        'updated_at',
        'permission',
        'version',
      ].includes(col.ColumnName) &&
      !(
        col.ForeignKeyData &&
        col.ForeignKeyData.DataSource &&
        col.ForeignKeyData.DataSource.length > 0
      )
  )

  const relationshipColumns = localColumns.filter(
    (col) =>
      col.ForeignKeyData &&
      col.ForeignKeyData.DataSource &&
      col.ForeignKeyData.DataSource.length > 0
  )

  const advancedColumns = localColumns.filter(
    (col) =>
      !basicColumns.includes(col) &&
      !relationshipColumns.includes(col) &&
      ![
        'id',
        'reference_id',
        'created_at',
        'updated_at',
        'version',
        'permission',
      ].includes(col.ColumnName)
  )

  // Create a dynamic schema based on columns
  const createFormSchema = () => {
    const schemaFields: Record<string, any> = {}

    localColumns.forEach((column) => {
      if (
        ![
          'id',
          'reference_id',
          'created_at',
          'updated_at',
          'version',
          'permission',
        ].includes(column.ColumnName)
      ) {
        let fieldSchema = z.any()

        // Add validation based on column properties
        if (!column.IsNullable && !column.DefaultValue) {
          fieldSchema = z.any().optional().nullable()
        }

        schemaFields[column.ColumnName] = fieldSchema
      }
    })

    return z.object(schemaFields)
  }

  const formSchema = createFormSchema()
  type FormValues = z.infer<typeof formSchema>

  // Initialize form with react-hook-form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: async () => {
      // Initialize with default values or current values when editing
      const initialValues: Record<string, any> = {}

      if (mode === 'edit') {
        if (selectedItem) {
          // In edit mode, initialize with current values
          localColumns.forEach((column) => {
            if (
              ![
                'id',
                'reference_id',
                'created_at',
                'updated_at',
                'version',
                'permission',
              ].includes(column.ColumnName)
            ) {
              initialValues[column.ColumnName] = selectedItem[column.ColumnName]
            }
          })
          // Store original values for comparison during update
          setOriginalValues(initialValues)
        }
      } else {
        // In create mode, initialize with default values
        localColumns.forEach((column) => {
          if (column.DefaultValue && column.DefaultValue !== 'null') {
            // Remove quotes if string default value
            let defaultValue = column.DefaultValue
            if (
              typeof defaultValue === 'string' &&
              defaultValue.startsWith("'") &&
              defaultValue.endsWith("'")
            ) {
              defaultValue = defaultValue.slice(1, -1)
            }
            initialValues[column.ColumnName] = defaultValue
          } else if (
            column.ColumnType === 'boolean' ||
            column.ColumnType === 'checkbox'
          ) {
            initialValues[column.ColumnName] = false
          }
        })
      }

      return initialValues
    },
  })

  // Helper function to check if a value has changed
  const hasValueChanged = (
    key: string,
    newValue: any,
    originalValue: any
  ): boolean => {
    // Handle null/undefined cases
    if (newValue === null && originalValue === null) return false
    if (newValue === undefined && originalValue === undefined) return false
    if (newValue === null && originalValue === undefined) return false
    if (newValue === undefined && originalValue === null) return false

    // Handle array and object comparisons
    if (typeof newValue === 'object' && newValue !== null) {
      try {
        const newValueStr = JSON.stringify(newValue)
        const originalValueStr = JSON.stringify(originalValue)
        return newValueStr !== originalValueStr
      } catch (e) {
        // If JSON stringify fails, fall back to simple comparison
        return newValue !== originalValue
      }
    }

    // Simple value comparison for primitives
    return newValue !== originalValue
  }

  // Handle form submission
  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true)

    try {
      if (mode === 'create') {
        await createItem(data)
      } else {
        // For updates, only send changed fields
        const changedFields: Record<string, any> = {}

        // Compare each field with its original value
        Object.keys(data).forEach((key) => {
          if (hasValueChanged(key, data[key], originalValues[key])) {
            const columnInfo = columnMap[key]
            if (
              columnInfo.ForeignKeyData &&
              columnInfo.ForeignKeyData.DataSource
            ) {
              // todo fill in for other types
              if (columnInfo.ForeignKeyData.DataSource === 'self') {
                changedFields[key] = {
                  type: columnInfo.ForeignKeyData.Namespace,
                  id: data[key],
                }
              }
            } else {
              changedFields[key] = data[key]
            }
          }
        })

        // Only proceed with update if there are changed fields
        if (Object.keys(changedFields).length > 0) {
          await updateItem(
            selectedItem.id || selectedItem.reference_id,
            changedFields
          )
        } else {
          // No changes detected
          toast({
            title: 'No changes',
            description: 'No changes were detected to update',
          })
        }
      }
      onClose()
    } catch (error) {
      console.error('Form submission error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Render form fields for a group of columns
  const renderColumnFields = (columns: ColumnDefinition[]) => {
    return columns.map((column) => (
      <FormField
        key={column.ColumnName}
        control={form.control}
        name={column.ColumnName}
        render={({ field }) => (
          <FormItem className='mb-4'>
            <FormLabel>{column.Name || column.ColumnName}</FormLabel>
            <FormControl>
              <ColumnEditor
                column={column}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                error={form.formState.errors[column.ColumnName]?.message}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    ))
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className='flex w-full flex-col space-y-6 overflow-y-auto pb-6 p-4'
      >
        <Tabs value={activeTab} onValueChange={setActiveTab} className='w-full'>
          <TabsList className='mb-4 grid grid-cols-3'>
            <TabsTrigger value='basic'>Basic Information</TabsTrigger>
            {relationshipColumns.length > 0 && (
              <TabsTrigger value='relationships'>Relationships</TabsTrigger>
            )}
            {advancedColumns.length > 0 && (
              <TabsTrigger value='advanced'>Advanced</TabsTrigger>
            )}
            <TabsTrigger value='permission'>Permission</TabsTrigger>
          </TabsList>

          <TabsContent value='basic' className='space-y-4'>
            <div className='grid grid-cols-1 gap-4 lg:grid-cols-1'>
              {renderColumnFields(basicColumns)}
            </div>
          </TabsContent>

          <TabsContent value='permission' className='space-y-4'>
            <div className='grid grid-cols-1 gap-4 lg:grid-cols-1'>
              {renderColumnFields(
                columns.filter((col) => col.ColumnName === 'permission')
              )}
            </div>
          </TabsContent>

          {relationshipColumns.length > 0 && (
            <TabsContent value='relationships' className='space-y-4'>
              <div className='grid grid-cols-1 gap-4'>
                {renderColumnFields(relationshipColumns)}
              </div>
            </TabsContent>
          )}

          {advancedColumns.length > 0 && (
            <TabsContent value='advanced' className='space-y-4'>
              <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                {renderColumnFields(advancedColumns)}
              </div>
            </TabsContent>
          )}
        </Tabs>

        <DialogFooter className={cn('pt-4', isSubmitting && 'opacity-50')}>
          <Button
            type='button'
            variant='outline'
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type='submit' disabled={isSubmitting}>
            {isSubmitting && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
            {mode === 'create' ? 'Create' : 'Update'} {entityName}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  )
}

export default EntityForm
