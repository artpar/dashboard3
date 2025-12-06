import { createLazyFileRoute } from '@tanstack/react-router'
import { useState, useEffect, useRef, useCallback } from 'react'
import { DAPTIN_ENDPOINT } from '@/daptin'
import { useToast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Textarea } from '@/components/ui/textarea'
import {
  Radio,
  Wifi,
  WifiOff,
  Play,
  Square,
  Send,
  Trash2,
  Copy,
  Download,
} from 'lucide-react'

interface WebSocketMessage {
  id: string
  type: 'sent' | 'received' | 'system'
  data: string
  timestamp: Date
  parsed?: any
}

function WebSocketPage() {
  const { toast } = useToast()
  const [isConnected, setIsConnected] = useState(false)
  const [messages, setMessages] = useState<WebSocketMessage[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [topic, setTopic] = useState('')
  const [subscribedTopics, setSubscribedTopics] = useState<string[]>([])
  const wsRef = useRef<WebSocket | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const wsUrl = DAPTIN_ENDPOINT?.replace('http://', 'ws://').replace('https://', 'wss://') + '/live'

  const addMessage = useCallback((type: WebSocketMessage['type'], data: string) => {
    let parsed
    try {
      parsed = JSON.parse(data)
    } catch {
      // Not JSON
    }

    setMessages(prev => [...prev, {
      id: Date.now().toString() + Math.random(),
      type,
      data,
      timestamp: new Date(),
      parsed,
    }])
  }, [])

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return
    }

    try {
      const token = localStorage.getItem('token')
      const urlWithToken = token ? `${wsUrl}?token=${token}` : wsUrl
      const ws = new WebSocket(urlWithToken)

      ws.onopen = () => {
        setIsConnected(true)
        addMessage('system', 'Connected to WebSocket server')
        toast({ title: 'Connected', description: 'WebSocket connection established' })
      }

      ws.onmessage = (event) => {
        addMessage('received', event.data)
      }

      ws.onerror = (error) => {
        addMessage('system', `Error: ${error.type || 'Connection error'}`)
        toast({ variant: 'destructive', title: 'WebSocket Error', description: 'Connection error occurred' })
      }

      ws.onclose = (event) => {
        setIsConnected(false)
        setSubscribedTopics([])
        addMessage('system', `Disconnected: ${event.code} ${event.reason || 'Connection closed'}`)
        toast({ title: 'Disconnected', description: 'WebSocket connection closed' })
      }

      wsRef.current = ws
    } catch (error) {
      toast({ variant: 'destructive', title: 'Connection Failed', description: String(error) })
    }
  }, [wsUrl, addMessage, toast])

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
  }, [])

  const sendMessage = useCallback((message: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(message)
      addMessage('sent', message)
    }
  }, [addMessage])

  const subscribe = useCallback(() => {
    if (!topic.trim()) return
    const message = JSON.stringify({
      type: 'subscribe',
      topic: topic.trim(),
    })
    sendMessage(message)
    setSubscribedTopics(prev => [...new Set([...prev, topic.trim()])])
    setTopic('')
  }, [topic, sendMessage])

  const unsubscribe = useCallback((topicName: string) => {
    const message = JSON.stringify({
      type: 'unsubscribe',
      topic: topicName,
    })
    sendMessage(message)
    setSubscribedTopics(prev => prev.filter(t => t !== topicName))
  }, [sendMessage])

  const handleSendCustom = () => {
    if (!inputMessage.trim()) return
    sendMessage(inputMessage)
    setInputMessage('')
  }

  const clearMessages = () => {
    setMessages([])
  }

  const copyMessages = () => {
    const text = messages.map(m =>
      `[${m.timestamp.toISOString()}] ${m.type.toUpperCase()}: ${m.data}`
    ).join('\n')
    navigator.clipboard.writeText(text)
    toast({ title: 'Copied', description: 'Messages copied to clipboard' })
  }

  const downloadMessages = () => {
    const text = JSON.stringify(messages, null, 2)
    const blob = new Blob([text], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `websocket-log-${new Date().toISOString()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [])

  const getMessageColor = (type: WebSocketMessage['type']) => {
    switch (type) {
      case 'sent': return 'text-blue-600'
      case 'received': return 'text-green-600'
      case 'system': return 'text-yellow-600'
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour12: false })
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Radio className="h-6 w-6" />
          WebSocket Monitor
        </h1>
        <p className="text-muted-foreground">
          Real-time event monitoring and subscription management
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          {/* Connection Status & Messages */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CardTitle className="text-lg">Messages</CardTitle>
                  <Badge variant={isConnected ? 'default' : 'secondary'} className="gap-1">
                    {isConnected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                    {isConnected ? 'Connected' : 'Disconnected'}
                  </Badge>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={copyMessages} title="Copy">
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={downloadMessages} title="Download">
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={clearMessages} title="Clear">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96 border rounded-lg bg-muted/30" ref={scrollRef}>
                <div className="p-4 font-mono text-sm space-y-1">
                  {messages.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      No messages yet. Connect to start receiving events.
                    </p>
                  ) : (
                    messages.map((msg) => (
                      <div key={msg.id} className="flex gap-2">
                        <span className="text-muted-foreground shrink-0">
                          [{formatTime(msg.timestamp)}]
                        </span>
                        <span className={`shrink-0 uppercase text-xs font-medium ${getMessageColor(msg.type)}`}>
                          {msg.type}:
                        </span>
                        <span className="break-all">
                          {msg.parsed ? (
                            <code className="text-xs">{JSON.stringify(msg.parsed)}</code>
                          ) : (
                            msg.data
                          )}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Send Custom Message */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Send Message</CardTitle>
              <CardDescription>Send a custom message to the WebSocket server</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder='{"type": "subscribe", "topic": "entity.user_account"}'
                  className="font-mono text-sm min-h-[80px]"
                  disabled={!isConnected}
                />
              </div>
              <Button
                onClick={handleSendCustom}
                disabled={!isConnected || !inputMessage.trim()}
                className="mt-2"
              >
                <Send className="h-4 w-4 mr-1" />
                Send
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Connection Control */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Connection</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Endpoint</Label>
                <code className="text-xs block p-2 bg-muted rounded break-all">{wsUrl}</code>
              </div>

              {isConnected ? (
                <Button variant="destructive" className="w-full" onClick={disconnect}>
                  <Square className="h-4 w-4 mr-1" />
                  Disconnect
                </Button>
              ) : (
                <Button className="w-full" onClick={connect}>
                  <Play className="h-4 w-4 mr-1" />
                  Connect
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Topic Subscription */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Subscribe to Topic</CardTitle>
              <CardDescription>Listen to specific event channels</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="entity.user_account"
                  disabled={!isConnected}
                  onKeyDown={(e) => e.key === 'Enter' && subscribe()}
                />
                <Button onClick={subscribe} disabled={!isConnected || !topic.trim()}>
                  Subscribe
                </Button>
              </div>

              {subscribedTopics.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Active Subscriptions</Label>
                  <div className="flex flex-wrap gap-2">
                    {subscribedTopics.map((t) => (
                      <Badge key={t} variant="secondary" className="gap-1 pr-1">
                        {t}
                        <button
                          onClick={() => unsubscribe(t)}
                          className="ml-1 hover:text-destructive"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Topics */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Subscribe</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {['entity.*', 'action.*', 'user_account.*', 'world.*'].map((t) => (
                <Button
                  key={t}
                  variant="outline"
                  size="sm"
                  className="w-full justify-start font-mono text-xs"
                  disabled={!isConnected || subscribedTopics.includes(t)}
                  onClick={() => {
                    setTopic(t)
                    setTimeout(subscribe, 0)
                  }}
                >
                  {t}
                </Button>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export const Route = createLazyFileRoute('/_authenticated/communication/websocket')({
  component: WebSocketPage,
})
