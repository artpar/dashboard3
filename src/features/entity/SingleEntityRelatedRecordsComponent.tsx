import { Layers } from 'lucide-react'
import { cn } from '@/lib/utils.ts'
import { Button } from '@/components/ui/button.tsx'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card.tsx'

export function SingleEntityRelatedRecordsComponent(props: {
  entityName: any
  relations: any[]
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Related Records</CardTitle>
        <CardDescription>
          Records connected to this {props.entityName}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className='space-y-6'>
          {props.relations.length === 0 ? (
            <p className='text-muted-foreground'>
              No relations defined for this entity.
            </p>
          ) : (
            <div className='space-y-4'>
              {props.relations.map((relation, index) => (
                <div key={index} className='rounded-lg border p-4'>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center space-x-2'>
                      <Layers className='text-muted-foreground h-4 w-4' />
                      <h3
                        className={cn('font-medium', {
                          'text-xs': relation.Object === props.entityName,
                        })}
                      >
                        {relation.Object}
                        <span className='text-muted-foreground ml-2 text-sm'>
                          ({relation.Relation})
                        </span>
                      </h3>
                      <h3
                        className={cn('font-medium', {
                          'text-xs': relation.Subject === props.entityName,
                        })}
                      >
                        {relation.Subject}
                      </h3>
                    </div>
                    <Button variant='outline' size='sm'>
                      View Related
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
