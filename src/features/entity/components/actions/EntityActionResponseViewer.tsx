import React from 'react'
import { ActionResponse } from '../../hooks/useEntityActions'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Download, ExternalLink } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

interface EntityActionResponseViewerProps {
  responses: ActionResponse[]
}

export const EntityActionResponseViewer: React.FC<EntityActionResponseViewerProps> = ({
  responses,
  actionName,
}) => {
  if (!responses || responses.length === 0) {
    return null
  }

  // Handle file download response
  const handleDownload = (content: string, filename: string, contentType: string) => {
    // Decode base64 content if needed
    let fileContent = content
    if (content.indexOf(';base64,') === -1) {
      fileContent = `data:${contentType};base64,${content}`
    }

    const link = document.createElement('a')
    link.href = fileContent
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Handle redirect response
  const handleRedirect = (location: string, windowTarget: string, delay: number) => {
    if (windowTarget === 'new') {
      window.open(location, '_blank')
    } else {
      setTimeout(() => {
        window.location.href = location
      }, delay || 0)
    }
  }

  return (
    <div className="space-y-4 mt-4">
      <h3 className="text-lg font-medium">Action Results</h3>
      
      {responses.map((response, index) => {
        // Handle different response types
        switch (response.ResponseType) {
          case 'client.file.download':
            return (
              <Card key={index}>
                <CardHeader>
                  <CardTitle>File Download</CardTitle>
                  <CardDescription>
                    {response.Attributes.message || 'File ready for download'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p>Filename: {response.Attributes.name}</p>
                  <p>Type: {response.Attributes.contentType}</p>
                </CardContent>
                <CardFooter>
                  <Button 
                    onClick={() => 
                      handleDownload(
                        response.Attributes.content,
                        response.Attributes.name,
                        response.Attributes.contentType
                      )
                    }
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                </CardFooter>
              </Card>
            )
          
          case 'client.notify':
            return (
              <Alert 
                key={index} 
                variant={response.Attributes.type === 'error' ? 'destructive' : 'default'}
              >
                <AlertTitle>{response.Attributes.title || 'Notification'}</AlertTitle>
                <AlertDescription>
                  {response.Attributes.message}
                </AlertDescription>
              </Alert>
            )
          
          case 'client.redirect':
            return (
              <Card key={index}>
                <CardHeader>
                  <CardTitle>Redirect</CardTitle>
                  <CardDescription>
                    You will be redirected to another page
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p>Location: {response.Attributes.location}</p>
                  {response.Attributes.delay > 0 && (
                    <p>Delay: {response.Attributes.delay}ms</p>
                  )}
                </CardContent>
                <CardFooter>
                  <Button 
                    onClick={() => 
                      handleRedirect(
                        response.Attributes.location,
                        response.Attributes.window || 'self',
                        response.Attributes.delay || 0
                      )
                    }
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Go Now
                  </Button>
                </CardFooter>
              </Card>
            )
          
          default:
            // For other response types, display as JSON
            return (
              <Card key={index}>
                <CardHeader>
                  <CardTitle>{response.ResponseType}</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="bg-muted p-4 rounded-md overflow-auto max-h-[300px]">
                    {JSON.stringify(response.Attributes, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            )
        }
      })}
    </div>
  )
}

export default EntityActionResponseViewer
