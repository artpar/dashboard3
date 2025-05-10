import React from 'react';
import { Database } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { DbStats } from './SystemTypes';
import { getProgressColor } from './SystemUtils';

interface DbConnectionStatsProps {
  dbStats: DbStats | null;
  isLoading: boolean;
}

export const DbConnectionStats: React.FC<DbConnectionStatsProps> = ({ dbStats, isLoading }) => {
  // Calculate connection usage percentage
  const connectionUsagePercent = dbStats 
    ? (dbStats.OpenConnections / dbStats.MaxOpenConnections) * 100
    : 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base flex items-center">
          <Database className="h-4 w-4 text-orange-500 mr-2" />
          Database Connections
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-2 w-full" />
            <Skeleton className="h-16 w-full" />
          </>
        ) : dbStats ? (
          <>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Connection Pool</span>
                <span className="text-sm text-muted-foreground">
                  {dbStats.OpenConnections} / {dbStats.MaxOpenConnections}
                </span>
              </div>
              <Progress 
                value={connectionUsagePercent} 
                className="h-2"
                indicatorClassName={getProgressColor(connectionUsagePercent)}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>
                  {connectionUsagePercent.toFixed(1)}% used
                </span>
                <span>
                  {dbStats.MaxOpenConnections - dbStats.OpenConnections} available
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-muted p-3 rounded-sm">
                <div className="text-xs text-muted-foreground">In Use</div>
                <div className="text-lg font-medium">{dbStats.InUse}</div>
              </div>
              
              <div className="bg-muted p-3 rounded-sm">
                <div className="text-xs text-muted-foreground">Idle</div>
                <div className="text-lg font-medium">{dbStats.Idle}</div>
              </div>
              
              <div className="bg-muted p-3 rounded-sm">
                <div className="text-xs text-muted-foreground">Wait Count</div>
                <div className="text-lg font-medium">{dbStats.WaitCount}</div>
              </div>
              
              <div className="bg-muted p-3 rounded-sm">
                <div className="text-xs text-muted-foreground">Wait Duration</div>
                <div className="text-lg font-medium">{dbStats.WaitDuration}ms</div>
              </div>
            </div>
            
            <div className="pt-2">
              <h4 className="text-sm font-medium mb-2">Connection Closures</h4>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-muted p-2 rounded-sm">
                  <div className="text-xs text-muted-foreground">Max Idle</div>
                  <div className="text-sm font-medium">{dbStats.MaxIdleClosed}</div>
                </div>
                <div className="bg-muted p-2 rounded-sm">
                  <div className="text-xs text-muted-foreground">Max Idle Time</div>
                  <div className="text-sm font-medium">{dbStats.MaxIdleTimeClosed}</div>
                </div>
                <div className="bg-muted p-2 rounded-sm">
                  <div className="text-xs text-muted-foreground">Max Lifetime</div>
                  <div className="text-sm font-medium">{dbStats.MaxLifetimeClosed}</div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="py-4 text-center text-sm text-muted-foreground">
            No database connection data available
          </div>
        )}
      </CardContent>
    </Card>
  );
};
