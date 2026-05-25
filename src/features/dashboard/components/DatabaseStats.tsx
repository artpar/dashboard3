/* eslint-disable no-console, @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react'
import { daptinClient } from '@/daptin'
import { Database, Table, ArrowUpDown, AlertCircle } from 'lucide-react'
import {
  daptinVisibleWorldEntityQuery,
  isVisibleDaptinWorldEntity,
} from '@/lib/daptin/world-entities'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table as UITable,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useToast } from '@/components/ui/use-toast'

interface TableStat {
  tableName: string
  recordCount: number
  lastUpdated: string
  isSystem: boolean
}

export const DatabaseStats: React.FC = () => {
  const { toast } = useToast()
  const [sortColumn, setSortColumn] = useState<'tableName' | 'recordCount'>(
    'recordCount'
  )
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [worldEntities, setWorldEntities] = useState<any[]>([])
  const [tableStats, setTableStats] = useState<TableStat[]>([])
  const [isLoadingWorld, setIsLoadingWorld] = useState(true)
  const [loadingTables, setLoadingTables] = useState<Set<string>>(new Set())

  // Fetch world entities
  useEffect(() => {
    const fetchWorldEntities = async () => {
      try {
        setIsLoadingWorld(true)
        const response = await daptinClient.jsonApi.findAll('world', {
          'page[size]': '500',
          sort: 'table_name',
          query: JSON.stringify(daptinVisibleWorldEntityQuery()),
        })

        if (!response.data) {
          throw new Error('Failed to fetch world entities')
        }

        const filteredEntities = response.data.filter(
          isVisibleDaptinWorldEntity
        )

        setWorldEntities(filteredEntities)

        // Initialize table stats with loading state
        const initialStats = filteredEntities.map((entity) => {
          const isSystem =
            entity.table_name.startsWith('_') ||
            [
              'world',
              'action',
              'user_account',
              'usergroup',
              'smd',
              'oauth_connect',
              'oauth_token',
            ].includes(entity.table_name)

          return {
            tableName: entity.table_name,
            recordCount: 0,
            lastUpdated: new Date().toISOString(),
            isSystem,
          }
        })

        setTableStats(initialStats)

        // Mark all tables as loading
        const tables = new Set(filteredEntities.map((e) => e.table_name))
        setLoadingTables(tables)
      } catch (error) {
        console.error('Error fetching world entities:', error)
        toast({
          title: 'Error',
          description: 'Failed to load world entities',
          variant: 'destructive',
        })
      } finally {
        setIsLoadingWorld(false)
      }
    }

    fetchWorldEntities()
  }, [toast])

  // Fetch table counts sequentially
  useEffect(() => {
    if (worldEntities.length === 0 || isLoadingWorld) return

    const fetchTableCounts = async () => {
      // Process entities sequentially
      for (const entity of worldEntities) {
        try {
          // Use the aggregate endpoint to get count for this table
          const result = await daptinClient.aggregateClient
            .entity(entity.table_name)
            .count()
            .execute()

          // Update the table stats for this entity
          setTableStats((prevStats) => {
            return prevStats.map((stat) => {
              if (stat.tableName === entity.table_name) {
                return {
                  ...stat,
                  recordCount:
                    result && result.length > 0
                      ? result[0].attributes.count
                      : 0,
                }
              }
              return stat
            })
          })

          // Remove this table from loading set
          setLoadingTables((prev) => {
            const newSet = new Set(prev)
            newSet.delete(entity.table_name)
            return newSet
          })
        } catch (error) {
          console.error(
            `Failed to fetch count for ${entity.table_name}:`,
            error
          )

          // Still update the loading state even if there was an error
          setLoadingTables((prev) => {
            const newSet = new Set(prev)
            newSet.delete(entity.table_name)
            return newSet
          })
        }
      }
    }

    fetchTableCounts()
  }, [worldEntities, isLoadingWorld])

  // Determine if we're loading
  const isLoading = isLoadingWorld || loadingTables.size > 0

  // Sort table stats
  const sortedTableStats = [...tableStats].sort((a, b) => {
    if (sortColumn === 'tableName') {
      return sortDirection === 'asc'
        ? a.tableName.localeCompare(b.tableName)
        : b.tableName.localeCompare(a.tableName)
    } else {
      return sortDirection === 'asc'
        ? a.recordCount - b.recordCount
        : b.recordCount - a.recordCount
    }
  })

  // Toggle sort
  const toggleSort = (column: 'tableName' | 'recordCount') => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center'>
          <Database className='mr-2 h-5 w-5' />
          Database Statistics
        </CardTitle>
        <CardDescription>
          Record counts and statistics for database tables
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className='space-y-2'>
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className='h-10 w-full' />
            ))}
          </div>
        ) : tableStats.length === 0 ? (
          <div className='flex items-center justify-center p-4 text-center'>
            <div>
              <AlertCircle className='mx-auto h-8 w-8 text-yellow-500' />
              <p className='mt-2 text-sm'>No table statistics available</p>
            </div>
          </div>
        ) : (
          <div className='rounded-md border'>
            <UITable>
              <TableHeader>
                <TableRow>
                  <TableHead
                    className='w-[50%] cursor-pointer'
                    onClick={() => toggleSort('tableName')}
                  >
                    <div className='flex items-center'>
                      Table Name
                      {sortColumn === 'tableName' && (
                        <ArrowUpDown
                          className={`ml-2 h-4 w-4 ${sortDirection === 'asc' ? 'rotate-180' : ''}`}
                        />
                      )}
                    </div>
                  </TableHead>
                  <TableHead
                    className='cursor-pointer text-right'
                    onClick={() => toggleSort('recordCount')}
                  >
                    <div className='flex items-center justify-end'>
                      Records
                      {sortColumn === 'recordCount' && (
                        <ArrowUpDown
                          className={`ml-2 h-4 w-4 ${sortDirection === 'asc' ? 'rotate-180' : ''}`}
                        />
                      )}
                    </div>
                  </TableHead>
                  <TableHead className='text-right'>Type</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedTableStats.slice(0, 10).map((stat) => (
                  <TableRow key={stat.tableName}>
                    <TableCell className='font-medium'>
                      <div className='flex items-center'>
                        <Table className='mr-2 h-4 w-4' />
                        <span className='capitalize'>
                          {stat.tableName.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className='text-right'>
                      {stat.recordCount.toLocaleString()}
                    </TableCell>
                    <TableCell className='text-right'>
                      <Badge variant={stat.isSystem ? 'secondary' : 'default'}>
                        {stat.isSystem ? 'System' : 'User'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </UITable>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
