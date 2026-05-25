import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'

/* eslint-disable @typescript-eslint/no-explicit-any */
import { createLazyFileRoute, useSearch } from '@tanstack/react-router'
import { daptinClient } from '@/daptin'
import { DAPTIN_ENDPOINT } from '@/daptin'
import { Braces, Play, Copy, RotateCcw, Clock, FileJson } from 'lucide-react'
import {
  daptinVisibleWorldEntityQuery,
  isVisibleDaptinWorldEntity,
} from '@/lib/daptin/world-entities'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'

interface WorldEntity {
  reference_id: string
  table_name: string
}

const EXAMPLE_QUERIES = {
  introspection: `{
  __schema {
    types {
      name
      kind
    }
  }
}`,
  allEntities: `{
  world {
    table_name
    reference_id
  }
}`,
  users: `{
  user_account {
    name
    email
    reference_id
  }
}`,
  customQuery: `# Enter your query here
{

}`,
}

function GraphQLPage() {
  const searchParams = useSearch({ strict: false }) as { entity?: string }
  const { toast } = useToast()
  const [query, setQuery] = useState(EXAMPLE_QUERIES.customQuery)
  const [variables, setVariables] = useState('{}')
  const [result, setResult] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [executionTime, setExecutionTime] = useState<number | null>(null)
  const [history, setHistory] = useState<Array<{ query: string; time: Date }>>(
    []
  )

  // Pre-populate query if entity param is provided
  useEffect(() => {
    if (searchParams?.entity) {
      setQuery(`{
  ${searchParams.entity} {
    reference_id
    created_at
    updated_at
  }
}`)
    }
  }, [searchParams?.entity])

  const { data: entities } = useQuery({
    queryKey: ['world-entities-graphql'],
    queryFn: async () => {
      const response = await daptinClient.jsonApi.findAll('world', {
        'page[size]': '200',
        query: JSON.stringify(daptinVisibleWorldEntityQuery()),
      })
      return ((response.data || []) as WorldEntity[]).filter(
        isVisibleDaptinWorldEntity
      )
    },
  })

  const graphqlEndpoint = `${DAPTIN_ENDPOINT}/graphql`

  const executeQuery = async () => {
    setIsLoading(true)
    setExecutionTime(null)
    const startTime = Date.now()

    try {
      let parsedVariables = {}
      if (variables.trim() && variables.trim() !== '{}') {
        try {
          parsedVariables = JSON.parse(variables)
        } catch {
          toast({
            variant: 'destructive',
            title: 'Invalid Variables',
            description: 'Variables must be valid JSON',
          })
          setIsLoading(false)
          return
        }
      }

      const token = localStorage.getItem('token')
      const response = await fetch(graphqlEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          query,
          variables: parsedVariables,
        }),
      })

      const data = await response.json()
      const endTime = Date.now()
      setExecutionTime(endTime - startTime)
      setResult(data)
      setHistory((prev) => [{ query, time: new Date() }, ...prev.slice(0, 9)])

      if (data.errors) {
        toast({
          variant: 'destructive',
          title: 'Query Error',
          description: data.errors[0]?.message || 'Query failed',
        })
      } else {
        toast({
          title: 'Query Executed',
          description: `Completed in ${endTime - startTime}ms`,
        })
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Execution Failed',
        description: String(error),
      })
      setResult({ error: String(error) })
    } finally {
      setIsLoading(false)
    }
  }

  const copyResult = () => {
    if (result) {
      navigator.clipboard.writeText(JSON.stringify(result, null, 2))
      toast({ title: 'Copied', description: 'Result copied to clipboard' })
    }
  }

  const loadExample = (key: keyof typeof EXAMPLE_QUERIES) => {
    setQuery(EXAMPLE_QUERIES[key])
  }

  const generateEntityQuery = (tableName: string) => {
    setQuery(`{
  ${tableName} {
    reference_id
    created_at
    updated_at
  }
}`)
  }

  const formatQuery = () => {
    // Basic query formatting - remove extra whitespace
    const formatted = query
      .replace(/\s+/g, ' ')
      .replace(/{\s*/g, '{\n  ')
      .replace(/\s*}/g, '\n}')
      .replace(/,\s*/g, '\n  ')
    setQuery(formatted)
  }

  return (
    <div className='p-6'>
      <div className='mb-6'>
        <h1 className='flex items-center gap-2 text-2xl font-bold'>
          <Braces className='h-6 w-6' />
          GraphQL Explorer
        </h1>
        <p className='text-muted-foreground'>
          Query the Daptin GraphQL API interactively
        </p>
      </div>

      <div className='grid gap-6 md:grid-cols-2'>
        {/* Query Editor */}
        <div className='space-y-4'>
          <Card>
            <CardHeader>
              <div className='flex items-center justify-between'>
                <CardTitle className='text-lg'>Query</CardTitle>
                <div className='flex gap-1'>
                  <Button variant='ghost' size='sm' onClick={formatQuery}>
                    <FileJson className='mr-1 h-4 w-4' />
                    Format
                  </Button>
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={() => setQuery(EXAMPLE_QUERIES.customQuery)}
                  >
                    <RotateCcw className='mr-1 h-4 w-4' />
                    Clear
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className='min-h-[300px] resize-y font-mono text-sm'
                placeholder='Enter your GraphQL query...'
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className='text-lg'>Variables</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={variables}
                onChange={(e) => setVariables(e.target.value)}
                className='min-h-[80px] font-mono text-sm'
                placeholder='{"id": "123"}'
              />
            </CardContent>
          </Card>

          <Button
            onClick={executeQuery}
            disabled={isLoading}
            className='w-full'
          >
            <Play className='mr-1 h-4 w-4' />
            {isLoading ? 'Executing...' : 'Execute Query'}
          </Button>
        </div>

        {/* Results & Tools */}
        <div className='space-y-4'>
          <Card>
            <CardHeader>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                  <CardTitle className='text-lg'>Result</CardTitle>
                  {executionTime !== null && (
                    <Badge variant='outline' className='gap-1'>
                      <Clock className='h-3 w-3' />
                      {executionTime}ms
                    </Badge>
                  )}
                </div>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={copyResult}
                  disabled={!result}
                >
                  <Copy className='h-4 w-4' />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className='bg-muted/30 max-h-[500px] min-h-[300px] overflow-auto rounded-lg border p-4'>
                {isLoading ? (
                  <div className='space-y-2'>
                    <Skeleton className='h-4 w-full' />
                    <Skeleton className='h-4 w-3/4' />
                    <Skeleton className='h-4 w-1/2' />
                  </div>
                ) : result ? (
                  <pre className='font-mono text-xs whitespace-pre-wrap'>
                    {JSON.stringify(result, null, 2)}
                  </pre>
                ) : (
                  <p className='text-muted-foreground py-8 text-center'>
                    Execute a query to see results
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Tools */}
          <Card>
            <CardHeader>
              <CardTitle className='text-lg'>Examples</CardTitle>
              <CardDescription>Load example queries</CardDescription>
            </CardHeader>
            <CardContent className='space-y-2'>
              <Button
                variant='outline'
                size='sm'
                className='w-full justify-start'
                onClick={() => loadExample('introspection')}
              >
                Schema Introspection
              </Button>
              <Button
                variant='outline'
                size='sm'
                className='w-full justify-start'
                onClick={() => loadExample('allEntities')}
              >
                List All Entities
              </Button>
              <Button
                variant='outline'
                size='sm'
                className='w-full justify-start'
                onClick={() => loadExample('users')}
              >
                Query Users
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className='text-lg'>Query Entity</CardTitle>
              <CardDescription>Generate query for an entity</CardDescription>
            </CardHeader>
            <CardContent>
              <Select onValueChange={generateEntityQuery}>
                <SelectTrigger>
                  <SelectValue placeholder='Select entity...' />
                </SelectTrigger>
                <SelectContent>
                  {entities?.map((entity) => (
                    <SelectItem
                      key={entity.reference_id}
                      value={entity.table_name}
                    >
                      {entity.table_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* History */}
          {history.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className='text-lg'>History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='max-h-32 space-y-1 overflow-auto'>
                  {history.map((item, i) => (
                    <button
                      key={i}
                      onClick={() => setQuery(item.query)}
                      className='hover:bg-muted w-full truncate rounded-lg p-2 text-left font-mono text-sm'
                    >
                      <span className='text-muted-foreground mr-2 text-xs'>
                        {item.time.toLocaleTimeString()}
                      </span>
                      {item.query.slice(0, 50)}...
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className='text-lg'>Endpoint</CardTitle>
            </CardHeader>
            <CardContent>
              <code className='bg-muted block rounded p-2 text-xs break-all'>
                {graphqlEndpoint}
              </code>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export const Route = createLazyFileRoute('/_authenticated/tools/graphql')({
  component: GraphQLPage,
})
