import { useCallback, useEffect, useRef, useState } from 'react'
import type { DaptinObjectUsergroupAccess } from 'daptin-client'
import { Loader2, Plus, Search } from 'lucide-react'
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
  PERMISSION_COLORS,
  PERMISSION_EXPLANATIONS,
  PermissionAction,
  PermissionScope,
  getPermissionFlag,
  hasPermission,
} from '@/features/entity/columns/PermissionTypes'
import EntityPagination from '@/features/entity/components/pagination/EntityPagination'
import { PermissionActionToggle } from '@/features/entity/components/permission/PermissionActionToggle'
import { useEntityGroupRelations } from '@/features/entity/hooks/useEntityGroupRelations'

interface SingleEntityAllGroupsListWithPermissionProps {
  entityName: string
  entityId: string
  className?: string
  disabled?: boolean
}

type UsergroupListRow = {
  id?: string
  reference_id?: string
  name?: string
}

export function SingleEntityAllGroupsListWithPermission({
  entityName,
  entityId,
  className,
  disabled,
}: SingleEntityAllGroupsListWithPermissionProps) {
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [searchInput, setSearchInput] = useState('')
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null)

  const {
    allGroups,
    allGroupsPagination,
    allGroupsPage,
    allGroupsPageSize,
    entityGroups,
    entityGroupsPagination,
    groupsPage,
    groupsPageSize,
    isLoadingGroups,
    isLoadingAllGroups,
    isUpdating,
    addEntityToGroup,
    removeEntityFromGroup,
    toggleGroupPermission,
    isGroupAlreadyRelated,
    setGroupSearchQuery,
    setAllGroupsPage,
    setAllGroupsPageSize,
    setGroupsPage,
    setGroupsPageSize,
  } = useEntityGroupRelations(entityName, entityId)

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchInput(value)
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        setGroupSearchQuery(value)
        setAllGroupsPage(1)
      }, 300)
    },
    [setAllGroupsPage, setGroupSearchQuery]
  )

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

  const handleRemoveFromGroup = async (groupId: string) => {
    if (disabled) return
    if (confirm('Remove this entity from this group?')) {
      await removeEntityFromGroup(groupId)
    }
  }

  const totalItems = entityGroupsPagination.total || entityGroups.length
  const totalPages = entityGroupsPagination.last_page || 1
  const allGroupsTotalItems = allGroupsPagination.total || allGroups.length
  const allGroupsTotalPages = allGroupsPagination.last_page || 1
  const colors = PERMISSION_COLORS[PermissionScope.Group]

  return (
    <Card className={`${className || ''} h-full`}>
      <CardHeader className='pb-3'>
        <div className='flex flex-wrap items-start justify-between gap-3'>
          <div>
            <CardTitle>Group Memberships</CardTitle>
            <CardDescription>
              Daptin usergroup relations and relation-row permissions for this{' '}
              {entityName}.
            </CardDescription>
          </div>
          <Dialog
            open={addDialogOpen}
            onOpenChange={(open) => {
              setAddDialogOpen(open)
              if (!open) {
                setSearchInput('')
                setGroupSearchQuery('')
              }
            }}
          >
            <DialogTrigger asChild>
              <Button
                size='sm'
                variant='outline'
                className='gap-1'
                disabled={disabled || isUpdating}
              >
                <Plus className='h-4 w-4' />
                Add Group
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Group</DialogTitle>
                <DialogDescription>
                  Search Daptin usergroups and attach one to this {entityName}.
                </DialogDescription>
              </DialogHeader>

              <div className='relative'>
                <Search className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2' />
                <Input
                  placeholder='Search groups...'
                  value={searchInput}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className='pl-9'
                  autoFocus
                />
              </div>

              <ScrollArea className='max-h-[280px]'>
                {isLoadingAllGroups ? (
                  <div className='flex items-center justify-center py-6'>
                    <Loader2 className='text-muted-foreground h-5 w-5 animate-spin' />
                  </div>
                ) : allGroups.length > 0 ? (
                  <div className='space-y-1'>
                    {allGroups.map((group: UsergroupListRow) => {
                      const groupReferenceId = group.reference_id || group.id
                      if (!groupReferenceId) return null
                      const alreadyRelated =
                        isGroupAlreadyRelated(groupReferenceId)

                      return (
                        <button
                          key={groupReferenceId}
                          className='hover:bg-accent w-full rounded-md px-3 py-2 text-left text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50'
                          onClick={() => handleAddToGroup(groupReferenceId)}
                          disabled={isUpdating || alreadyRelated}
                        >
                          <span className='font-medium'>
                            {group.name || groupReferenceId}
                          </span>
                          {alreadyRelated && (
                            <span className='text-muted-foreground ml-2 text-xs'>
                              already attached
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                ) : (
                  <div className='text-muted-foreground py-6 text-center text-sm'>
                    {searchInput ? 'No groups found' : 'No groups returned'}
                  </div>
                )}
              </ScrollArea>

              <EntityPagination
                currentPage={allGroupsPage}
                totalPages={allGroupsTotalPages}
                pageSize={allGroupsPageSize}
                totalItems={allGroupsTotalItems}
                isLoading={isLoadingAllGroups}
                onPageChange={setAllGroupsPage}
                onPageSizeChange={(size) => {
                  setAllGroupsPageSize(size)
                  setAllGroupsPage(1)
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent className='space-y-4'>
        {isLoadingGroups ? (
          <div className='space-y-2'>
            <Skeleton className='h-12 w-full' />
            <Skeleton className='h-12 w-full' />
            <Skeleton className='h-12 w-full' />
          </div>
        ) : entityGroups.length > 0 ? (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className='w-[24%]'>Group</TableHead>
                  <TableHead>Relation Permissions</TableHead>
                  <TableHead className='w-[120px]'>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entityGroups.map(
                  (relatedUserGroup: DaptinObjectUsergroupAccess) => {
                    const permissionValue = relatedUserGroup.permission || 0

                    return (
                      <TableRow key={relatedUserGroup.relationReferenceId}>
                        <TableCell className='align-top'>
                          <div className='font-medium'>
                            {relatedUserGroup.group.name ||
                              relatedUserGroup.groupReferenceId}
                          </div>
                          <div className='text-muted-foreground text-xs break-all'>
                            {relatedUserGroup.groupReferenceId}
                          </div>
                          <div className='text-muted-foreground mt-1 text-xs break-all'>
                            Relation: {relatedUserGroup.relationReferenceId}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className='grid gap-2 sm:grid-cols-2 lg:grid-cols-4'>
                            {Object.values(PermissionAction).map((action) => {
                              const flag = getPermissionFlag(
                                PermissionScope.Group,
                                action
                              )
                              const isChecked = hasPermission(
                                permissionValue,
                                flag
                              )
                              const explanationKey =
                                `${PermissionScope.Group}${action}` as keyof typeof PERMISSION_EXPLANATIONS
                              const explanation =
                                PERMISSION_EXPLANATIONS[explanationKey] ||
                                `Group can ${action.toLowerCase()} this record`

                              return (
                                <PermissionActionToggle
                                  key={`${relatedUserGroup.relationReferenceId}-${action}`}
                                  scope={PermissionScope.Group}
                                  action={action}
                                  isChecked={isChecked}
                                  onToggle={() =>
                                    toggleGroupPermission(
                                      relatedUserGroup.relationReferenceId,
                                      flag,
                                      permissionValue
                                    )
                                  }
                                  disabled={disabled || isUpdating}
                                  colors={{
                                    selected: colors.selected,
                                    text: colors.text,
                                    border: colors.border,
                                  }}
                                  explanation={explanation}
                                />
                              )
                            })}
                          </div>
                        </TableCell>
                        <TableCell className='align-top'>
                          <Button
                            variant='ghost'
                            size='sm'
                            className='text-destructive hover:text-destructive/90 hover:bg-destructive/10'
                            onClick={() =>
                              handleRemoveFromGroup(
                                relatedUserGroup.groupReferenceId
                              )
                            }
                            disabled={disabled || isUpdating}
                          >
                            Remove
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  }
                )}
              </TableBody>
            </Table>

            <EntityPagination
              currentPage={groupsPage}
              totalPages={totalPages}
              pageSize={groupsPageSize}
              totalItems={totalItems}
              isLoading={isLoadingGroups}
              onPageChange={setGroupsPage}
              onPageSizeChange={(size) => {
                setGroupsPageSize(size)
                setGroupsPage(1)
              }}
            />
          </>
        ) : (
          <div className='text-muted-foreground flex min-h-[120px] items-center justify-center rounded-md border'>
            This {entityName} is not attached to any groups.
          </div>
        )}
      </CardContent>
    </Card>
  )
}
