// src/features/entity/relations/AddRelatedEntityDialog.tsx
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { PlusIcon, SearchIcon } from 'lucide-react'
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
import { TableRelation, RelationDirection } from './relations-utils'
import { RelationsApiService } from '@/features/entity/services/RelationsApiService'
import { useToast } from '@/components/ui/use-toast'
import { Loader2 } from 'lucide-react'
import { daptinClient } from '@/daptin'
import { validateDaptinResponse } from '@/lib/utils'

interface AddRelatedEntityDialogProps {
  entityName: string
  entityId: string
  relation: TableRelation
  direction: RelationDirection
  onSuccess: () => void
}

export function AddRelatedEntityDialog({
  entityName,
  entityId,
  relation,
  direction,
  onSuccess,
}: AddRelatedEntityDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [selectedEntity, setSelectedEntity] = useState<any | null>(null)
  const { toast } = useToast()

  const relatedEntityName =
    relation.Object === entityName ? relation.Subject : relation.Object

  // Form schema
  const formSchema = z.object({
    searchTerm: z.string().min(1, 'Please enter a search term'),
  })

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      searchTerm: '',
    },
  })

  const handleSearch = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsLoading(true)
      const response = await daptinClient.jsonApi.findAll(relatedEntityName, {
        filter: values.searchTerm,
      })
      validateDaptinResponse(response, 'Search failed')

      let data = response.data || []
      if (!(data instanceof Array)) {
        data = [data]
      }

      setSearchResults(data)
    } catch (error) {
      console.error('Error searching entities:', error)
      toast({
        title: 'Search Failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddRelation = async () => {
    if (!selectedEntity) return

    try {
      setIsLoading(true)

      // Determine source and target based on relation direction
      let sourceEntityName, sourceEntityId, targetEntityName, targetEntityId

      if (direction === RelationDirection.Outbound) {
        sourceEntityName = entityName
        sourceEntityId = entityId
        targetEntityName = relatedEntityName
        targetEntityId = selectedEntity.reference_id
      } else {
        sourceEntityName = relatedEntityName
        sourceEntityId = selectedEntity.reference_id
        targetEntityName = entityName
        targetEntityId = entityId
      }

      await RelationsApiService.createRelation(
        sourceEntityName,
        sourceEntityId,
        targetEntityName,
        targetEntityId,
        relation
      )

      toast({
        title: 'Relation Added',
        description: `Successfully added relation to ${relatedEntityName}`,
      })

      setOpen(false)
      setSelectedEntity(null)
      setSearchResults([])
      form.reset()
      onSuccess()
    } catch (error) {
      console.error('Error adding relation:', error)
      toast({
        title: 'Failed to Add Relation',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="ml-auto"
      >
        <PlusIcon className="mr-2 h-4 w-4" />
        Add {relatedEntityName}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Related {relatedEntityName}</DialogTitle>
            <DialogDescription>
              Search for a {relatedEntityName} to add to this relationship.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSearch)} className="space-y-4">
              <FormField
                control={form.control}
                name="searchTerm"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Search {relatedEntityName}</FormLabel>
                    <div className="flex space-x-2">
                      <FormControl>
                        <Input placeholder={`Search ${relatedEntityName}...`} {...field} />
                      </FormControl>
                      <Button type="submit" disabled={isLoading}>
                        {isLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <SearchIcon className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>

          {searchResults.length > 0 && (
            <div className="mt-4 max-h-[200px] overflow-y-auto rounded border">
              <div className="p-2">
                <h4 className="text-sm font-medium">Search Results</h4>
              </div>
              <div className="divide-y">
                {searchResults.map((entity) => (
                  <div
                    key={entity.reference_id}
                    className={`flex cursor-pointer items-center justify-between p-2 hover:bg-muted ${
                      selectedEntity?.reference_id === entity.reference_id
                        ? 'bg-muted'
                        : ''
                    }`}
                    onClick={() => setSelectedEntity(entity)}
                  >
                    <div>
                      <div className="font-medium">
                        {entity.name || entity.title || entity.reference_id.substring(0, 8)}
                      </div>
                      <div className="text-muted-foreground text-xs">
                        ID: {entity.reference_id.substring(0, 8)}...
                      </div>
                    </div>
                    <div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedEntity(entity)
                        }}
                      >
                        Select
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setOpen(false)
                setSelectedEntity(null)
                setSearchResults([])
                form.reset()
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddRelation}
              disabled={!selectedEntity || isLoading}
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <>Add Relation</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
