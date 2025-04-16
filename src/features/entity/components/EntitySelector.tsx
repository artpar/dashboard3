// src/features/entity/components/EntitySelector.tsx
import { useState, useEffect } from 'react'
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { daptinClient } from '@/daptin'

interface EntitySelectorProps {
  entityName: string
  onSelect: (value: string | null) => void
  initialSelectedId?: string
  placeholder?: string
  disabled?: boolean
}

/**
 * A reusable component for selecting entities
 */
export function EntitySelector({
  entityName,
  onSelect,
  initialSelectedId,
  placeholder = 'Select item...',
  disabled = false,
}: EntitySelectorProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [entities, setEntities] = useState<Array<{ id: string; name: string }>>([])
  const [selectedId, setSelectedId] = useState<string | null>(initialSelectedId || null)
  const [selectedName, setSelectedName] = useState<string>('')

  // Load entities
  useEffect(() => {
    const fetchEntities = async () => {
      if (!entityName) return

      setIsLoading(true)
      try {
        // Get the world model to determine display fields
        await daptinClient.worldManager.getWorldByName(entityName)
        
        // Fetch entities
        const response = await daptinClient.jsonApi.findAll(entityName, {
          'page[size]': '100',
          sort: '-created_at',
        })

        if (response.data) {
          const items = Array.isArray(response.data) ? response.data : [response.data]
          
          // Determine the display field (name, title, label, etc.)
          const displayFields = ['name', 'title', 'label', 'email', 'username']
          
          const formattedEntities = items.map((item: any) => {
            // Find the first available display field
            let displayName = item.reference_id
            for (const field of displayFields) {
              if (item[field]) {
                displayName = item[field]
                break
              }
            }
            
            return {
              id: item.reference_id,
              name: displayName,
            }
          })
          
          setEntities(formattedEntities)
          
          // Set the selected name if we have an initialSelectedId
          if (initialSelectedId) {
            const selected = formattedEntities.find((e: { id: string }) => e.id === initialSelectedId)
            if (selected) {
              setSelectedName(selected.name)
            }
          }
        }
      } catch (error) {
        console.error('Error fetching entities:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchEntities()
  }, [entityName, initialSelectedId])

  const handleSelect = (id: string, name: string) => {
    setSelectedId(id)
    setSelectedName(name)
    onSelect(id)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled || isLoading}
        >
          {isLoading ? (
            <div className="flex items-center">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading...
            </div>
          ) : selectedName || placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-[300px]">
        <Command>
          <CommandInput placeholder={`Search ${entityName}...`} />
          <CommandEmpty>No {entityName} found.</CommandEmpty>
          <CommandGroup className="max-h-[300px] overflow-y-auto">
            {entities.map((entity) => (
              <CommandItem
                key={entity.id}
                value={entity.id}
                onSelect={() => handleSelect(entity.id, entity.name)}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    selectedId === entity.id ? "opacity-100" : "opacity-0"
                  )}
                />
                {entity.name}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
