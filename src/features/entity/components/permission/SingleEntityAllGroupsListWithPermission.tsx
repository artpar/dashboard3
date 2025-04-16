import { useState } from 'react'
import { Plus } from 'lucide-react'
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
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
  hasPermission,
  PermissionAction,
  PermissionScope,
} from '@/features/entity/columns/PermissionTypes'
import { useEntityGroupRelations } from '@/features/entity/hooks/useEntityGroupRelations'

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
  const [selectedGroupToAdd, setSelectedGroupToAdd] = useState<string>('')

  const {
    entityGroups,
    isLoadingGroups,
    isUpdating,
    addEntityToGroup,
    removeEntityFromGroup,
    toggleGroupPermission,
    getAvailableGroups,
  } = useEntityGroupRelations(entityName, entityId)

  console.log('useEntityGroupRelations hook results:', {
    entityGroups,
    isLoadingGroups,
    availableGroups: getAvailableGroups()?.length,
  })

  // Handle adding entity to a group
  const handleAddToGroup = async () => {
    if (!selectedGroupToAdd) return

    const success = await addEntityToGroup(selectedGroupToAdd)
    if (success) {
      setAddDialogOpen(false)
      setSelectedGroupToAdd('')
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
    <Card className={className}>
      <CardHeader className='pb-3'>
        <div className='flex items-center justify-between'>
          <div>
            <CardTitle>Group Memberships</CardTitle>
            <CardDescription>
              Groups this {entityName} belongs to and their permissions
            </CardDescription>
          </div>
          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button
                size='sm'
                variant='outline'
                className='gap-1'
                disabled={
                  disabled || isUpdating || availableGroups.length === 0
                }
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

              <div className='py-4'>
                <Select
                  value={selectedGroupToAdd}
                  onValueChange={setSelectedGroupToAdd}
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Select a group' />
                  </SelectTrigger>
                  <SelectContent>
                    {availableGroups.map((group: any) => (
                      <SelectItem
                        key={group.reference_id}
                        value={group.reference_id}
                      >
                        {group.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <DialogFooter>
                <Button
                  variant='outline'
                  onClick={() => setAddDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddToGroup}
                  disabled={!selectedGroupToAdd || isUpdating}
                >
                  Add
                </Button>
              </DialogFooter>
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
          <ScrollArea className='h-[300px]'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Group</TableHead>
                  <TableHead>Permissions</TableHead>
                  <TableHead className='w-[100px]'>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entityGroups.map((relatedUserGroup: any) => (
                  <TableRow key={relatedUserGroup.reference_id}>
                    <TableCell>
                      <div className='font-medium'>{relatedUserGroup.name}</div>
                      <div className='text-muted-foreground text-xs'>
                        {relatedUserGroup.usergroup_id}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className='flex flex-wrap gap-2'>
                        {Object.values(PermissionAction).map((action) => {
                          const flag = getPermissionFlag(
                            PermissionScope.Group,
                            action
                          )
                          const hasPermissionValue = hasPermission(
                            relatedUserGroup.permission || 0,
                            flag
                          )

                          return (
                            <div
                              key={action}
                              className='flex items-center space-x-2'
                            >
                              <Switch
                                id={`${relatedUserGroup.reference_id}-${action}`}
                                checked={hasPermissionValue}
                                onCheckedChange={() =>
                                  toggleGroupPermission(
                                    relatedUserGroup.reference_id,
                                    flag,
                                    relatedUserGroup.permission || 0
                                  )
                                }
                                disabled={disabled || isUpdating}
                              />
                              <Label
                                htmlFor={`${relatedUserGroup.reference_id}-${action}`}
                                className='text-xs'
                              >
                                {action}
                              </Label>
                            </div>
                          )
                        })}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant='ghost'
                        size='sm'
                        className='text-destructive hover:text-destructive/90 hover:bg-destructive/10'
                        onClick={() =>
                          handleRemoveFromGroup(relatedUserGroup.reference_id)
                        }
                        disabled={disabled || isUpdating}
                      >
                        Remove
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
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
