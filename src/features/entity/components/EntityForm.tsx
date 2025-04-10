import React, { useCallback, useEffect, useMemo, useState } from 'react'
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
import { useEntitySingleEntity } from '@/features/entity/hooks/useEntitySingleData.tsx'
import { SYSTEM_COLUMNS } from '@/features/entity/types.ts'

interface EntityFormProps {
  mode: 'create' | 'edit'
  entityId: string | undefined
  entity: string | undefined
  onClose: () => void
}

export const EntityForm: React.FC<EntityFormProps> = ({ mode, onClose }) => {
  const {
    entityName,
    columns,
    selectedItem,
    setSelectedItem,
    createItem,
    updateItem,
  } = useEntitySingleEntity()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState('basic')
  const [originalValues, setOriginalValues] = useState<Record<string, any>>({})
  const [columnMap, setColumnMap] = useState<Record<string, ColumnDefinition>>(
    {}
  )
  const { toast } = useToast()

  // Group columns for tab organization
  const [localColumns, setLocalColumns] = useState<ColumnDefinition[]>(
    columns || []
  )

  // Log only when entityName or selectedItem changes
  useEffect(() => {
    console.log('EntityForm.selectedItem', entityName, selectedItem)
  }, [entityName, selectedItem])

  // Update local columns when columns from context change and are not empty
  useEffect(() => {
    if (columns && columns.length > 0) {
      setLocalColumns(
        columns.sort((a, b) => a.ColumnName.localeCompare(b.ColumnName))
      )

      // Build column map
      const newColumnMap: Record<string, ColumnDefinition> = {}
      columns.forEach((column) => {
        newColumnMap[column.ColumnName] = column
      })
      setColumnMap(newColumnMap)
    }
  }, [columns])

  // Set original values when selectedItem changes
  useEffect(() => {
    if (selectedItem) {
      setOriginalValues(selectedItem)
    }
  }, [selectedItem])

  // Memoize column groups for tabs to prevent recalculation on every render
  const basicColumns = useMemo(
    () =>
      localColumns.filter(
        (col) =>
          !col.ColumnName.endsWith('_id') &&
          !SYSTEM_COLUMNS.includes(col.ColumnName) &&
          !(
            col.ForeignKeyData &&
            col.ForeignKeyData.DataSource &&
            col.ForeignKeyData.DataSource.length > 0
          )
      ),
    [localColumns]
  )

  const relationshipColumns = useMemo(
    () =>
      localColumns.filter(
        (col) =>
          col.ForeignKeyData &&
          col.ForeignKeyData.DataSource &&
          col.ForeignKeyData.DataSource.length > 0
      ),
    [localColumns]
  )

  const advancedColumns = useMemo(
    () =>
      localColumns.filter(
        (col) =>
          !basicColumns.includes(col) &&
          !relationshipColumns.includes(col) &&
          !SYSTEM_COLUMNS.includes(col.ColumnName)
      ),
    [localColumns, basicColumns, relationshipColumns]
  )

  // Create a dynamic schema based on columns
  const createFormSchema = useCallback(() => {
    const schemaFields: Record<string, any> = {}

    localColumns.forEach((column) => {
      if (!SYSTEM_COLUMNS.includes(column.ColumnName)) {
        let fieldSchema = z.any()

        // Add validation based on column properties
        if (!column.IsNullable && !column.DefaultValue) {
          fieldSchema = z.any().optional().nullable()
        }

        schemaFields[column.ColumnName] = fieldSchema
      }
    })

    return z.object(schemaFields)
  }, [localColumns])

  const formSchema = createFormSchema()
  type FormValues = z.infer<typeof formSchema>

  // Initialize form with react-hook-form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: async () => {
      return getInitialValues()
    },
  })

  // Function to get initial values based on mode and selectedItem
  const getInitialValues = useCallback(() => {
    const initialValues: Record<string, any> = {}

    if (mode === 'edit' && selectedItem) {
      // In edit mode, initialize with current values
      localColumns.forEach((column) => {
        if (!SYSTEM_COLUMNS.includes(column.ColumnName)) {
          initialValues[column.ColumnName] = selectedItem[column.ColumnName]
        }
      })
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
  }, [mode, selectedItem, localColumns])

  // Reset form values when selectedItem changes
  useEffect(() => {
    if (mode === 'edit' && selectedItem) {
      const values = getInitialValues()
      form.reset(values)
      setOriginalValues({ ...values })
    }
  }, [selectedItem, mode, getInitialValues])

  // Helper function to check if a value has changed
  const hasValueChanged = useCallback(
    (key: string, newValue: any, originalValue: any): boolean => {
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
    },
    []
  )

  // Handle form submission
  const onSubmit = useCallback(
    async (data: FormValues) => {
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
                columnInfo &&
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
            await updateItem({
              id: selectedItem.id || selectedItem.reference_id,
              ...changedFields,
            })
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
    },
    [
      mode,
      createItem,
      updateItem,
      selectedItem,
      columnMap,
      originalValues,
      onClose,
      toast,
      hasValueChanged,
    ]
  )

  // Render form fields for a group of columns
  const renderColumnFields = useCallback(
    (columns: ColumnDefinition[]) => {
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
    },
    [form.control, form.formState.errors]
  )

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className='flex w-full flex-col space-y-6 overflow-y-auto p-4 pb-6'
      >
        <Tabs value={activeTab} onValueChange={setActiveTab} className='w-full'>
          <TabsList className='mb-4 grid grid-cols-6'>
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
