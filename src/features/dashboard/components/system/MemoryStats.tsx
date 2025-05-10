import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { MemoryStats as MemoryStatsType } from './SystemTypes';
import { formatBytes, getProgressColor } from './SystemUtils';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faMemory } from '@fortawesome/free-solid-svg-icons/faMemory'

interface MemoryStatsProps {
  memoryStats: MemoryStatsType | null;
  isLoading: boolean;
}

export const MemoryStats: React.FC<MemoryStatsProps> = ({ memoryStats, isLoading }) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base flex items-center">
          <FontAwesomeIcon  icon={faMemory} className="h-4 w-4 text-green-500 mr-2" />
          Memory Usage
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-2 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-2 w-full" />
          </>
        ) : memoryStats ? (
          <>
            {/* Virtual Memory */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">RAM</span>
                <span className="text-sm text-muted-foreground">
                  {formatBytes(memoryStats.virtual.used)} / {formatBytes(memoryStats.virtual.total)}
                </span>
              </div>
              <Progress
                value={memoryStats.virtual.usedPercent}
                className="h-2"
                indicatorClassName={getProgressColor(memoryStats.virtual.usedPercent)}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>
                  {memoryStats.virtual.usedPercent.toFixed(1)}% used
                </span>
                <span>
                  {formatBytes(memoryStats.virtual.available)} available
                </span>
              </div>
            </div>

            {/* Swap Memory */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Swap</span>
                <span className="text-sm text-muted-foreground">
                  {formatBytes(memoryStats.swap.used)} / {formatBytes(memoryStats.swap.total)}
                </span>
              </div>
              <Progress
                value={memoryStats.swap.usedPercent}
                className="h-2"
                indicatorClassName={getProgressColor(memoryStats.swap.usedPercent)}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>
                  {memoryStats.swap.usedPercent.toFixed(1)}% used
                </span>
                <span>
                  {formatBytes(memoryStats.swap.free)} free
                </span>
              </div>
            </div>

            {/* Memory Distribution */}
            <div className="pt-2">
              <h4 className="text-sm font-medium mb-2">Memory Distribution</h4>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-muted p-2 rounded-sm">
                  <div className="text-xs font-medium">Active</div>
                  <div className="text-sm">{formatBytes(memoryStats.virtual.active)}</div>
                </div>
                <div className="bg-muted p-2 rounded-sm">
                  <div className="text-xs font-medium">Inactive</div>
                  <div className="text-sm">{formatBytes(memoryStats.virtual.inactive)}</div>
                </div>
                <div className="bg-muted p-2 rounded-sm">
                  <div className="text-xs font-medium">Wired</div>
                  <div className="text-sm">{formatBytes(memoryStats.virtual.wired)}</div>
                </div>
                <div className="bg-muted p-2 rounded-sm">
                  <div className="text-xs font-medium">Free</div>
                  <div className="text-sm">{formatBytes(memoryStats.virtual.free)}</div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="py-4 text-center text-sm text-muted-foreground">
            No memory data available
          </div>
        )}
      </CardContent>
    </Card>
  );
};
