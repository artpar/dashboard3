// src/components/entity/columns/ColumnUsageExamples.tsx
import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ColumnEditor, ColumnViewer } from '@/components/entity/columns'


/**
 * Example of how to use the column components
 */
export const ColumnUsageExample: React.FC = () => {
  // Sample column definitions for demonstration
  const textColumn = {
    ColumnName: 'title',
    Name: 'Title',
    ColumnType: ColumnType.Text,
    IsNullable: false,
  }

  const contentColumn = {
    ColumnName: 'description',
    Name: 'Description',
    ColumnType: ColumnType.Content,
    IsNullable: true,
  }

  const dateColumn = {
    ColumnName: 'created_at',
    Name: 'Created At',
    ColumnType: ColumnType.DateTime,
    IsNullable: false,
  }

  const numberColumn = {
    ColumnName: 'price',
    Name: 'Price',
    ColumnType: ColumnType.Money,
    IsNullable: false,
  }

  const booleanColumn = {
    ColumnName: 'is_active',
    Name: 'Is Active',
    ColumnType: ColumnType.Boolean,
    IsNullable: false,
  }

  const ratingColumn = {
    ColumnName: 'rating',
    Name: 'Rating',
    ColumnType: ColumnType.Rating5,
    IsNullable: true,
  }

  const jsonColumn = {
    ColumnName: 'settings',
    Name: 'Settings',
    ColumnType: ColumnType.Json,
    IsNullable: true,
  }

  const fileColumn = {
    ColumnName: 'attachments',
    Name: 'Attachments',
    ColumnType: 'file.png|jpg|jpeg|pdf',
    IsNullable: true,
  }

  const foreignKeyColumn = {
    ColumnName: 'user_id',
    Name: 'User',
    ColumnType: ColumnType.ForeignKey,
    IsForeignKey: true,
    ForeignKeyData: {
      DataSource: 'self',
      Namespace: 'user_account',
      KeyName: 'user',
    },
    IsNullable: false,
  }

  // Sample values for the columns
  const [values, setValues] = useState({
    title: 'Sample Product',
    description:
      'This is a sample product description with multiple lines of text to demonstrate the content field type.',
    created_at: new Date(),
    price: 99.99,
    is_active: true,
    rating: 4,
    settings: { theme: 'dark', notifications: true, language: 'en' },
    attachments: [
      {
        name: 'sample.jpg',
        type: 'image/jpeg',
        size: 12345,
        path: '/api/placeholder/400/300',
      },
    ],
    user_id: '95f8c3e7-c607-4691-8a59-bd9ca2d1f5ca',
  })

  // Handle a column value change
  const handleValueChange = (columnName: string, value: any) => {
    setValues((prev) => ({
      ...prev,
      [columnName]: value,
    }))
  }

  const columns = [
    { column: textColumn, value: values.title },
    { column: contentColumn, value: values.description },
    { column: dateColumn, value: values.created_at },
    { column: numberColumn, value: values.price },
    { column: booleanColumn, value: values.is_active },
    { column: ratingColumn, value: values.rating },
    { column: jsonColumn, value: values.settings },
    { column: fileColumn, value: values.attachments },
    { column: foreignKeyColumn, value: values.user_id },
  ]

  return (
    <div className='container py-8'>
      <h1 className='mb-4 text-3xl font-bold'>Column Components</h1>
      <p className='text-muted-foreground mb-8'>
        Examples of how to use the column components in your application
      </p>

      <Tabs defaultValue='view'>
        <TabsList className='mb-4'>
          <TabsTrigger value='view'>View Mode</TabsTrigger>
          <TabsTrigger value='edit'>Edit Mode</TabsTrigger>
          <TabsTrigger value='combined'>Combined Mode</TabsTrigger>
        </TabsList>

        {/* View Mode */}
        <TabsContent value='view'>
          <Card>
            <CardHeader>
              <CardTitle>View Mode</CardTitle>
              <CardDescription>
                Display column values in read-only mode
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='space-y-6'>
                {columns.map(({ column, value }) => (
                  <div key={column.ColumnName} className='space-y-1'>
                    <h3 className='text-sm font-medium'>{column.Name}</h3>
                    <div className='rounded border p-2'>
                      <ColumnViewer column={column} value={value} />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Edit Mode */}
        <TabsContent value='edit'>
          <Card>
            <CardHeader>
              <CardTitle>Edit Mode</CardTitle>
              <CardDescription>
                Edit column values with the appropriate editors
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='space-y-6'>
                {columns.map(({ column, value }) => (
                  <div key={column.ColumnName} className='space-y-1'>
                    <h3 className='text-sm font-medium'>{column.Name}</h3>
                    <ColumnEditor
                      column={column}
                      value={value}
                      onChange={(newValue) =>
                        handleValueChange(column.ColumnName, newValue)
                      }
                    />
                  </div>
                ))}

                <Button
                  variant='outline'
                  onClick={() => console.log('Form values:', values)}
                >
                  Log Form Values
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Combined Mode */}
        <TabsContent value='combined'>
          <Card>
            <CardHeader>
              <CardTitle>Combined Mode</CardTitle>
              <CardDescription>View and edit side by side</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='space-y-6'>
                {columns.map(({ column, value }) => (
                  <div key={column.ColumnName} className='space-y-1'>
                    <h3 className='text-sm font-medium'>{column.Name}</h3>
                    <div className='grid grid-cols-2 gap-4'>
                      <div className='space-y-1'>
                        <p className='text-muted-foreground text-xs'>View</p>
                        <div className='flex min-h-12 items-center rounded border p-2'>
                          <ColumnViewer column={column} value={value} />
                        </div>
                      </div>
                      <div className='space-y-1'>
                        <p className='text-muted-foreground text-xs'>Edit</p>
                        <ColumnEditor
                          column={column}
                          value={value}
                          onChange={(newValue) =>
                            handleValueChange(column.ColumnName, newValue)
                          }
                        />
                      </div>
                    </div>
                    <Separator className='my-2' />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default ColumnUsageExample
