import { createLazyFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { daptinClient } from '@/daptin'
import {
  ArrowLeft,
  GitBranch,
  Play,
  Circle,
  ArrowRight,
  Settings,
  XCircle,
  CheckCircle,
  Loader2,
  Code,
  Copy,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/components/ui/use-toast'

interface SMDEntity {
  id: string
  reference_id: string
  name: string
  label: string
  initial_state: string
  events: string
  created_at: string
  updated_at: string
}

interface StateEvent {
  Name: string
  Label?: string
  Src: string[]
  Dst: string
}

interface ParsedStateMachine {
  events: StateEvent[]
  states: string[]
  initialState: string
}

function StateMachineDetailPage() {
  const { smdId } = Route.useParams()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState('overview')

  // Fetch SMD data
  const { data: smd, isLoading, error } = useQuery({
    queryKey: ['smd', smdId],
    queryFn: async () => {
      const response = await daptinClient.jsonApi.findAll('smd', {})
      const smds = response.data as any[]
      const found = smds.find(
        (s) =>
          s.id === smdId ||
          s.reference_id === smdId ||
          s.attributes?.reference_id === smdId
      )
      if (found) {
        if (found.attributes) {
          return {
            id: found.id,
            reference_id: found.attributes.reference_id || found.id,
            ...found.attributes,
          } as SMDEntity
        }
        return found as SMDEntity
      }
      throw new Error('State Machine not found')
    },
    enabled: !!smdId,
  })

  // Parse events JSON to extract states and transitions
  const parsedMachine: ParsedStateMachine | null = (() => {
    if (!smd?.events) return null
    try {
      const events: StateEvent[] = JSON.parse(smd.events)
      if (!Array.isArray(events)) return null

      // Extract all unique states
      const statesSet = new Set<string>()
      events.forEach((event) => {
        if (event.Src) {
          event.Src.forEach((src) => statesSet.add(src))
        }
        if (event.Dst) {
          statesSet.add(event.Dst)
        }
      })
      if (smd.initial_state) {
        statesSet.add(smd.initial_state)
      }

      return {
        events,
        states: Array.from(statesSet).sort(),
        initialState: smd.initial_state || '',
      }
    } catch {
      return null
    }
  })()

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({ title: 'Copied to clipboard' })
  }

  if (isLoading) {
    return (
      <div className="p-6 space-y-4 w-full">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  if (error || !smd) {
    return (
      <div className="p-6 w-full">
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertTitle>Not Found</AlertTitle>
          <AlertDescription>State Machine not found</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full w-full">
      {/* Header */}
      <div className="p-6 border-b">
        <Link
          to="/admin/state-machines"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm mb-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to State Machines
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <GitBranch className="h-6 w-6" />
              {smd.label || smd.name}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline">{smd.name}</Badge>
              {parsedMachine && (
                <>
                  <Badge variant="secondary">
                    {parsedMachine.states.length} states
                  </Badge>
                  <Badge variant="secondary">
                    {parsedMachine.events.length} transitions
                  </Badge>
                </>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Link to={`/smd/${smdId}`}>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-1" />
                Edit
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex flex-col h-full"
        >
          <div className="border-b px-6">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="states">
                States {parsedMachine && `(${parsedMachine.states.length})`}
              </TabsTrigger>
              <TabsTrigger value="transitions">
                Transitions {parsedMachine && `(${parsedMachine.events.length})`}
              </TabsTrigger>
              <TabsTrigger value="diagram">Diagram</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview" className="p-6 overflow-auto">
            <div className="grid gap-6 md:grid-cols-2">
              {/* State Machine Info */}
              <Card>
                <CardHeader>
                  <CardTitle>State Machine Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    <span className="text-muted-foreground">Name</span>
                    <span className="font-mono">{smd.name}</span>
                  </div>
                  <Separator />
                  <div className="grid grid-cols-2 gap-2">
                    <span className="text-muted-foreground">Label</span>
                    <span className="font-medium">{smd.label || '-'}</span>
                  </div>
                  <Separator />
                  <div className="grid grid-cols-2 gap-2">
                    <span className="text-muted-foreground">Initial State</span>
                    <Badge variant="default" className="w-fit">
                      <Circle className="h-3 w-3 mr-1 fill-current" />
                      {smd.initial_state || '-'}
                    </Badge>
                  </div>
                  <Separator />
                  <div className="grid grid-cols-2 gap-2">
                    <span className="text-muted-foreground">Total States</span>
                    <span className="font-medium">
                      {parsedMachine?.states.length || 0}
                    </span>
                  </div>
                  <Separator />
                  <div className="grid grid-cols-2 gap-2">
                    <span className="text-muted-foreground">Total Transitions</span>
                    <span className="font-medium">
                      {parsedMachine?.events.length || 0}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Metadata */}
              <Card>
                <CardHeader>
                  <CardTitle>Metadata</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    <span className="text-muted-foreground">Created</span>
                    <span className="font-medium">
                      {smd.created_at
                        ? new Date(smd.created_at).toLocaleString()
                        : '-'}
                    </span>
                  </div>
                  <Separator />
                  <div className="grid grid-cols-2 gap-2">
                    <span className="text-muted-foreground">Updated</span>
                    <span className="font-medium">
                      {smd.updated_at
                        ? new Date(smd.updated_at).toLocaleString()
                        : '-'}
                    </span>
                  </div>
                  <Separator />
                  <div className="grid grid-cols-2 gap-2">
                    <span className="text-muted-foreground">Reference ID</span>
                    <span className="font-mono text-xs">{smd.reference_id}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Raw Events JSON */}
              <Card className="md:col-span-2">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Code className="h-5 w-5" />
                      Events Definition
                    </CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(smd.events || '')}
                    >
                      <Copy className="h-4 w-4 mr-1" />
                      Copy
                    </Button>
                  </div>
                  <CardDescription>
                    JSON definition of state transitions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <pre className="bg-muted p-4 rounded-lg text-xs overflow-auto max-h-[300px] font-mono">
                    {parsedMachine
                      ? JSON.stringify(parsedMachine.events, null, 2)
                      : smd.events || 'No events defined'}
                  </pre>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="states" className="p-6 overflow-auto">
            <Card>
              <CardHeader>
                <CardTitle>States</CardTitle>
                <CardDescription>
                  All states in this state machine
                </CardDescription>
              </CardHeader>
              <CardContent>
                {parsedMachine && parsedMachine.states.length > 0 ? (
                  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {parsedMachine.states.map((state) => {
                      const isInitial = state === parsedMachine.initialState
                      const incomingTransitions = parsedMachine.events.filter(
                        (e) => e.Dst === state
                      )
                      const outgoingTransitions = parsedMachine.events.filter(
                        (e) => e.Src?.includes(state)
                      )

                      return (
                        <div
                          key={state}
                          className={`p-4 border rounded-lg ${
                            isInitial ? 'border-primary bg-primary/5' : ''
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <Circle
                              className={`h-4 w-4 ${
                                isInitial
                                  ? 'fill-primary text-primary'
                                  : 'text-muted-foreground'
                              }`}
                            />
                            <span className="font-medium">{state}</span>
                            {isInitial && (
                              <Badge variant="default" className="text-xs">
                                Initial
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground space-y-1">
                            <div>
                              {incomingTransitions.length} incoming ·{' '}
                              {outgoingTransitions.length} outgoing
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Circle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No states defined</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="transitions" className="p-6 overflow-auto">
            <Card>
              <CardHeader>
                <CardTitle>Transitions</CardTitle>
                <CardDescription>
                  Events that trigger state changes
                </CardDescription>
              </CardHeader>
              <CardContent>
                {parsedMachine && parsedMachine.events.length > 0 ? (
                  <div className="space-y-3">
                    {parsedMachine.events.map((event, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50"
                      >
                        <Badge variant="outline" className="font-mono">
                          {event.Name}
                        </Badge>
                        <div className="flex items-center gap-2 flex-1">
                          <div className="flex flex-wrap gap-1">
                            {event.Src?.map((src) => (
                              <Badge key={src} variant="secondary">
                                {src}
                              </Badge>
                            ))}
                          </div>
                          <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <Badge variant="default">{event.Dst}</Badge>
                        </div>
                        {event.Label && (
                          <span className="text-sm text-muted-foreground">
                            {event.Label}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <ArrowRight className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No transitions defined</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="diagram" className="p-6 overflow-auto">
            <Card>
              <CardHeader>
                <CardTitle>State Diagram</CardTitle>
                <CardDescription>
                  Visual representation of the state machine
                </CardDescription>
              </CardHeader>
              <CardContent>
                {parsedMachine && parsedMachine.states.length > 0 ? (
                  <div className="bg-muted rounded-lg p-6">
                    {/* Simple text-based diagram */}
                    <div className="font-mono text-sm space-y-4">
                      {/* Initial state indicator */}
                      <div className="flex items-center gap-2 text-primary">
                        <span>●</span>
                        <ArrowRight className="h-4 w-4" />
                        <span className="px-2 py-1 border rounded bg-background">
                          {parsedMachine.initialState}
                        </span>
                        <span className="text-muted-foreground text-xs">
                          (initial state)
                        </span>
                      </div>

                      <Separator />

                      {/* Transitions */}
                      <div className="space-y-2">
                        <div className="text-muted-foreground text-xs mb-2">
                          Transitions:
                        </div>
                        {parsedMachine.events.map((event, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <span className="text-muted-foreground w-24 truncate">
                              [{event.Name}]
                            </span>
                            <span className="px-2 py-0.5 border rounded bg-background">
                              {event.Src?.join(' | ')}
                            </span>
                            <span className="text-muted-foreground">→</span>
                            <span className="px-2 py-0.5 border rounded bg-primary/10 text-primary">
                              {event.Dst}
                            </span>
                          </div>
                        ))}
                      </div>

                      <Separator />

                      {/* State summary */}
                      <div className="text-xs text-muted-foreground">
                        Total: {parsedMachine.states.length} states,{' '}
                        {parsedMachine.events.length} transitions
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <GitBranch className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No state machine data to visualize</p>
                    <p className="text-xs mt-1">
                      Add events to see the state diagram
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export const Route = createLazyFileRoute(
  '/_authenticated/admin/state-machines/$smdId'
)({
  component: StateMachineDetailPage,
})
