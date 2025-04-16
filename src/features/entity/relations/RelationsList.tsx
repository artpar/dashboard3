// src/features/entity/relations/RelationsList.tsx
import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { UserIcon, UsersIcon, ShieldIcon } from 'lucide-react'
import { getRelationKey, RelationDirection } from './relations-utils'
import { RelationGroup } from './RelationGroup'
import { useEntityRelations } from '../hooks/useEntityRelations'
import { daptinClient } from '@/daptin'

interface RelationsListProps {
  entityName: string
  entityId?: string
}

/**
 * Enhanced list of entity relations, with special handling for user_account and usergroup
 */
export function RelationsList({ entityName, entityId }: RelationsListProps) {
  const [activeTab, setActiveTab] = useState<string>('all')
  const [userAccountInfo, setUserAccountInfo] = useState<any>(null)
  const [userGroups, setUserGroups] = useState<any[]>([])
  const [isLoadingUserData, setIsLoadingUserData] = useState(false)

  const {
    relations,
    inboundRelations,
    outboundRelations,
    isLoading
  } = useEntityRelations()

  // Fetch user account info if the entity is not a user_account itself
  useEffect(() => {
    if (entityId && entityName !== 'user_account') {
      fetchUserAccountInfo()
    }
  }, [entityId, entityName])

  // Fetch user groups if we have a user account
  useEffect(() => {
    if (userAccountInfo?.reference_id) {
      fetchUserGroups(userAccountInfo.reference_id)
    }
  }, [userAccountInfo])

  // Fetch the user_account associated with this entity
  const fetchUserAccountInfo = async () => {
    if (!entityId) return
    
    try {
      setIsLoadingUserData(true)
      
      // Find the user_account relation
      const userAccountRelation = relations.find(rel => 
        rel.Object === 'user_account' || rel.Subject === 'user_account'
      )
      
      if (!userAccountRelation) return
      
      // Determine if this entity belongs to user_account or user_account belongs to this entity
      const isUserAccountOwner = userAccountRelation.Object === 'user_account'
      
      // Query parameters depend on the relation direction
      const queryParams = isUserAccountOwner
        ? { [entityName + '_id']: entityId }
        : { 'reference_id': userAccountRelation.Subject === 'user_account' ? entityId : '' }
      
      const response = await daptinClient.jsonApi.findAll('user_account', {
        query: JSON.stringify([{
          column: Object.keys(queryParams)[0],
          operator: 'eq',
          value: Object.values(queryParams)[0]
        }])
      })
      
      if (response.data && response.data.length > 0) {
        setUserAccountInfo(response.data[0])
      }
    } catch (error) {
      console.error('Error fetching user account info:', error)
    } finally {
      setIsLoadingUserData(false)
    }
  }
  
  // Fetch usergroups for a user account
  const fetchUserGroups = async (userAccountId: string) => {
    try {
      setIsLoadingUserData(true)
      
      const response = await daptinClient.jsonApi
        .one('user_account', userAccountId)
        .relationships('usergroup')
        .get()
      
      if (response.data) {
        // Fetch full usergroup details
        const groupIds = response.data.map((item: any) => item.id)
        
        if (groupIds.length > 0) {
          const groupsResponse = await daptinClient.jsonApi.findAll('usergroup', {
            query: JSON.stringify([{
              column: 'reference_id',
              operator: 'in',
              value: groupIds
            }])
          })
          
          if (groupsResponse.data) {
            setUserGroups(Array.isArray(groupsResponse.data) ? 
              groupsResponse.data : [groupsResponse.data])
          }
        } else {
          setUserGroups([])
        }
      }
    } catch (error) {
      console.error('Error fetching user groups:', error)
    } finally {
      setIsLoadingUserData(false)
    }
  }

  if (isLoading) {
    return <div className="py-4 text-center">Loading relations...</div>
  }

  // Show user account and group information if available
  const showUserInfo = userAccountInfo || (entityName === 'user_account' && entityId)

  return (
    <div className="space-y-6">
      {/* User Account and Groups Section */}
      {showUserInfo && (
        <Card className="border-blue-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center">
              <UserIcon className="mr-2 h-4 w-4" />
              User Account & Permissions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* User Account Info */}
              {userAccountInfo && (
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="px-2 py-1">
                    <UserIcon className="mr-2 h-3 w-3" />
                    {userAccountInfo.name || userAccountInfo.email || userAccountInfo.reference_id.substring(0, 8)}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {userAccountInfo.email}
                  </span>
                </div>
              )}
              
              {/* User Groups */}
              <div>
                <h4 className="text-sm font-medium mb-2 flex items-center">
                  <UsersIcon className="mr-2 h-3 w-3" />
                  Groups
                </h4>
                
                {isLoadingUserData ? (
                  <p className="text-xs text-muted-foreground">Loading groups...</p>
                ) : userGroups.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {userGroups.map(group => (
                      <Badge key={group.reference_id} variant="secondary" className="flex items-center">
                        <ShieldIcon className="mr-1 h-3 w-3" />
                        {group.name}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">No groups assigned</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Standard Relations Tabs */}
      <Tabs
        defaultValue="all"
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
        <div className="flex items-center justify-between">
          <TabsList className="grid w-auto grid-cols-3">
            <TabsTrigger value="all" className="px-4">
              All Relations
              <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs">
                {relations.length}
              </span>
            </TabsTrigger>
            <TabsTrigger value="inbound" className="px-4">
              Inbound
              <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs">
                {inboundRelations.length}
              </span>
            </TabsTrigger>
            <TabsTrigger value="outbound" className="px-4">
              Outbound
              <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs">
                {outboundRelations.length}
              </span>
            </TabsTrigger>
          </TabsList>
        </div>

        <Separator className="my-4" />

        <TabsContent value="all" className="space-y-4">
          {relations.length > 0 ? (
            relations.map((relation) => (
              <RelationGroup
                key={getRelationKey(relation)}
                entityName={entityName}
                entityId={entityId}
                relation={relation}
                direction={relation.direction}
              />
            ))
          ) : (
            <p className="text-muted-foreground py-4 text-center">
              No relations available
            </p>
          )}
        </TabsContent>

        <TabsContent value="inbound" className="space-y-4">
          {inboundRelations.length > 0 ? (
            inboundRelations.map((relation) => (
              <RelationGroup
                key={getRelationKey(relation)}
                entityName={entityName}
                entityId={entityId}
                relation={relation}
                direction={relation.direction}
              />
            ))
          ) : (
            <p className="text-muted-foreground py-4 text-center">
              No inbound relations available
            </p>
          )}
        </TabsContent>

        <TabsContent value="outbound" className="space-y-4">
          {outboundRelations.length > 0 ? (
            outboundRelations.map((relation) => (
              <RelationGroup
                key={getRelationKey(relation)}
                entityName={entityName}
                entityId={entityId}
                relation={relation}
                direction={relation.direction}
              />
            ))
          ) : (
            <p className="text-muted-foreground py-4 text-center">
              No outbound relations available
            </p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
