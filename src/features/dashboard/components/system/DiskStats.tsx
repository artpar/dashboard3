import React from 'react';
import { HardDrive } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { DiskStats as DiskStatsType } from './SystemTypes';
import { formatBytes } from './SystemUtils';

interface DiskStatsProps {
  diskStats: DiskStatsType | null;
  isLoading: boolean;
}

export const DiskStats: React.FC<DiskStatsProps> = ({ diskStats, isLoading }) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base flex items-center">
          <HardDrive className="h-4 w-4 text-purple-500 mr-2" />
          Disk I/O
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-16 w-full mt-2" />
          </>
        ) : diskStats && Object.keys(diskStats.io).length > 0 ? (
          <div className="space-y-4">
            {Object.entries(diskStats.io).map(([diskName, diskData]) => (
              <div key={diskName} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{diskName}</span>
                  {diskData.label && (
                    <span className="text-xs text-muted-foreground">{diskData.label}</span>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">Read</div>
                    <div className="text-sm font-medium">{formatBytes(diskData.readBytes)}</div>
                    <div className="text-xs text-muted-foreground">
                      {diskData.readCount.toLocaleString()} operations
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">Write</div>
                    <div className="text-sm font-medium">{formatBytes(diskData.writeBytes)}</div>
                    <div className="text-xs text-muted-foreground">
                      {diskData.writeCount.toLocaleString()} operations
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 pt-1">
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">Read Time</div>
                    <div className="text-sm">
                      {(diskData.readTime / 1000).toFixed(2)}s
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">Write Time</div>
                    <div className="text-sm">
                      {(diskData.writeTime / 1000).toFixed(2)}s
                    </div>
                  </div>
                </div>
                
                <div className="text-xs text-muted-foreground pt-1">
                  Total I/O Time: {(diskData.ioTime / 1000).toFixed(2)}s
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-4 text-center text-sm text-muted-foreground">
            No disk I/O data available
          </div>
        )}
      </CardContent>
    </Card>
  );
};
