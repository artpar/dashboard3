import React from 'react';
import { Server, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { HostStats } from './SystemTypes';
import { formatUptime } from './SystemUtils';

interface HostInfoProps {
  hostStats: HostStats | null;
  isLoading: boolean;
}

export const HostInfo: React.FC<HostInfoProps> = ({ hostStats, isLoading }) => {
  const formatBootTime = (timestamp: number) => {
    if (!timestamp) return 'Unknown';
    return new Date(timestamp * 1000).toLocaleString();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base flex items-center">
          <Server className="h-4 w-4 text-blue-500 mr-2" />
          Host Information
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center justify-between py-1 border-b">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-40" />
              </div>
            ))}
          </>
        ) : hostStats?.info ? (
          <div className="space-y-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div className="flex items-center justify-between py-1 border-b">
                <div className="flex items-center">
                  <Clock className="h-4 w-4 text-green-500 mr-2" />
                  <span className="text-sm font-medium">Uptime</span>
                </div>
                <span className="text-sm">{formatUptime(hostStats.info.uptime)}</span>
              </div>

              <div className="flex items-center justify-between py-1 border-b">
                <span className="text-sm font-medium">Hostname</span>
                <span className="text-xs font-mono">{hostStats.info.hostname}</span>
              </div>

              <div className="flex items-center justify-between py-1 border-b">
                <span className="text-sm font-medium">OS</span>
                <span className="text-sm">
                  {hostStats.info.os} {hostStats.info.platformVersion}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b">
                <span className="text-sm font-medium">Architecture</span>
                <span className="text-sm">{hostStats.info.kernelArch}</span>
              </div>

              <div className="flex items-center justify-between py-1 border-b">
                <span className="text-sm font-medium">Kernel</span>
                <span className="text-sm">{hostStats.info.kernelVersion}</span>
              </div>

              <div className="flex items-center justify-between py-1 border-b">
                <span className="text-sm font-medium">Platform</span>
                <span className="text-sm">{hostStats.info.platformFamily}</span>
              </div>

              <div className="flex items-center justify-between py-1 border-b">
                <span className="text-sm font-medium">Boot Time</span>
                <span className="text-sm">{formatBootTime(hostStats.info.bootTime)}</span>
              </div>

              <div className="flex items-center justify-between py-1 border-b">
                <span className="text-sm font-medium">Processes</span>
                <span className="text-sm">{hostStats.info.procs}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-4 text-center text-sm text-muted-foreground">
            No host information available
          </div>
        )}
      </CardContent>
    </Card>
  );
};
