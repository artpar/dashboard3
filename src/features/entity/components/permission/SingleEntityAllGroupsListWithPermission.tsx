import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Plus, Search, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  getPermissionFlag,
  PermissionAction,
  PermissionScope,
} from '@/features/entity/columns/PermissionTypes'
import { useEntityGroupRelations } from '@/features/entity/hooks/useEntityGroupRelations'
import { PermissionScopeRow } from '@/features/entity/components/permission/components/PermissionScopeRow'

interface SingleEntityAllGroupsListWithPermissionProps {
  entityName: string
  entityId: string
  className?: string
  disabled?: boolean
}

/**
 * Component that displays all groups an entity belongs to and allows managing permissions
 */
export function SingleEntityAllGroupsListWithPermission({
  entityName,
  entityId,
  className,
  disabled,
}: SingleEntityAllGroupsListWithPermissionProps) {
  console.log('SingleEntityAllGroupsListWithPermission props:', {
    entityName,
    entityId,
  })
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [searchInput, setSearchInput] = useState('')
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null)

  const {
    entityGroups,
    isLoadingGroups,
    isLoadingAllGroups,
    isUpdating,
    addEntityToGroup,
    removeEntityFromGroup,
    toggleGroupPermission,
    getAvailableGroups,
    setGroupSearchQuery,
  } = useEntityGroupRelations(entityName, entityId)

  const handleSearchChange = useCallback((value: string) => {
    setSearchInput(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setGroupSearchQuery(value)
    }, 300)
  }, [setGroupSearchQuery])

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  const handleAddToGroup = async (groupId: string) => {
    const success = await addEntityToGroup(groupId)
    if (success) {
      setAddDialogOpen(false)
      setSearchInput('')
      setGroupSearchQuery('')
    }
  }

  // Handle removing entity from a group
  const handleRemoveFromGroup = async (relationId: string) => {
    if (disabled) return
    if (
      confirm('Are you sure you want to remove this entity from this group?')
    ) {
      await removeEntityFromGroup(relationId)
    }
  }

  // Get available groups for adding
  const availableGroups = getAvailableGroups()

  return (
    <Card className={className + " h-full"}>
      <CardHeader className='pb-3'>
        <div className='flex items-center justify-between'>
          <div>
            <CardTitle>Group Memberships</CardTitle>
            <CardDescription>
              Groups this {entityName} belongs to and their permissions
            </CardDescription>
          </div>
          <Dialog open={addDialogOpen} onOpenChange={(open) => {
            setAddDialogOpen(open)
            if (!open) {
              setSearchInput('')
              setGroupSearchQuery('')
            }
          }}>
            <DialogTrigger asChild>
              <Button
                size='sm'
                variant='outline'
                className='gap-1'
                disabled={disabled || isUpdating}
              >
                <Plus className='h-4 w-4' />
                Add to Group
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add to Group</DialogTitle>
                <DialogDescription>
                  Select a group to add this {entityName} to
                </DialogDescription>
              </DialogHeader>

              <div className='relative'>
                <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
                <Input
                  placeholder='Search groups...'
                  value={searchInput}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className='pl-9'
                  autoFocus
                />
              </div>

              <ScrollArea className='max-h-[240px]'>
                {isLoadingAllGroups ? (
                  <div className='flex items-center justify-center py-6'>
                    <Loader2 className='h-5 w-5 animate-spin text-muted-foreground' />
                  </div>
                ) : availableGroups.length > 0 ? (
                  <div className='space-y-1'>
                    {availableGroups.map((group: any) => (
                      <button
                        key={group.reference_id}
                        className='w-full text-left px-3 py-2 rounded-md hover:bg-accent text-sm transition-colors disabled:opacity-50'
                        onClick={() => handleAddToGroup(group.reference_id)}
                        disabled={isUpdating}
                      >
                        {group.name}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className='text-center py-6 text-sm text-muted-foreground'>
                    {searchInput ? 'No groups found' : 'No available groups'}
                  </div>
                )}
              </ScrollArea>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent>
        {isLoadingGroups ? (
          <div className='space-y-2'>
            <Skeleton className='h-10 w-full' />
            <Skeleton className='h-10 w-full' />
            <Skeleton className='h-10 w-full' />
          </div>
        ) : entityGroups && entityGroups.length > 0 ? (
          <ScrollArea className='h-full'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Group</TableHead>
                  <TableHead className='w-[60%]'>Permissions</TableHead>
                  <TableHead className='w-[100px]'>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entityGroups.map((relatedUserGroup: any) => {
                  // Create a custom toggle function for this specific group
                  const handleTogglePermission = (scope: PermissionScope, action: PermissionAction) => {
                    const flag = getPermissionFlag(scope, action)
                    toggleGroupPermission(
                      relatedUserGroup.reference_id,
                      flag,
                      relatedUserGroup.permission || 0
                    )
                  }

                  return (
                    <React.Fragment key={relatedUserGroup.reference_id}>
                      <PermissionScopeRow
                        scope={PermissionScope.Group}
                        permissionValue={relatedUserGroup.permission || 0}
                        togglePermission={handleTogglePermission}
                        disabled={disabled || isUpdating}
                        hideActions={true}
                        title={relatedUserGroup.name}
                        description={relatedUserGroup.usergroup_id}
                      />
                      <TableRow>
                        <TableCell colSpan={2}></TableCell>
                        <TableCell>
                          <Button
                            variant='ghost'
                            size='sm'
                            className='text-destructive hover:text-destructive/90 hover:bg-destructive/10'
                            onClick={() =>
                              handleRemoveFromGroup(relatedUserGroup.relation_reference_id)
                            }
                            disabled={disabled || isUpdating}
                          >
                            Remove
                          </Button>
                        </TableCell>
                      </TableRow>
                    </React.Fragment>
                  )
                })}
              </TableBody>
            </Table>
          </ScrollArea>
        ) : (
          <div className='text-muted-foreground flex h-[100px] items-center justify-center'>
            This {entityName} is not a member of any groups
          </div>
        )}
      </CardContent>
    </Card>
  )
}
