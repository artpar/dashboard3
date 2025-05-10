import React from 'react';
import { Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { LoadStats as LoadStatsType } from './SystemTypes';
import { getUsageColor } from './SystemUtils';

interface LoadStatsProps {
  loadStats: LoadStatsType | null;
  isLoading: boolean;
}

export const LoadStats: React.FC<LoadStatsProps> = ({ loadStats, isLoading }) => {
  // Get color based on load average
  const getLoadColor = (load: number, cores: number = 10) => {
    // Load per core
    const loadPerCore = load / cores;
    if (loadPerCore >= 1.5) return 'text-red-500';
    if (loadPerCore >= 1.0) return 'text-orange-500';
    if (loadPerCore >= 0.7) return 'text-yellow-500';
    return 'text-green-500';
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base flex items-center">
          <Activity className="h-4 w-4 text-indigo-500 mr-2" />
          System Load
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-16 w-full mt-2" />
          </>
        ) : loadStats ? (
          <div className="space-y-4">
            {/* Load Average */}
            <div>
              <h4 className="text-sm font-medium mb-2">Load Average</h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-muted p-3 rounded-sm">
                  <div className="text-xs text-muted-foreground">1 Minute</div>
                  <div className={`text-lg font-medium ${getLoadColor(loadStats.avg.load1)}`}>
                    {loadStats.avg.load1.toFixed(2)}
                  </div>
                </div>
                
                <div className="bg-muted p-3 rounded-sm">
                  <div className="text-xs text-muted-foreground">5 Minutes</div>
                  <div className={`text-lg font-medium ${getLoadColor(loadStats.avg.load5)}`}>
                    {loadStats.avg.load5.toFixed(2)}
                  </div>
                </div>
                
                <div className="bg-muted p-3 rounded-sm">
                  <div className="text-xs text-muted-foreground">15 Minutes</div>
                  <div className={`text-lg font-medium ${getLoadColor(loadStats.avg.load15)}`}>
                    {loadStats.avg.load15.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Process Stats */}
            <div>
              <h4 className="text-sm font-medium mb-2">Process Information</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted p-3 rounded-sm">
                  <div className="text-xs text-muted-foreground">Running</div>
                  <div className={`text-lg font-medium ${
                    loadStats.misc.procsRunning > 10 ? 'text-orange-500' : 'text-green-500'
                  }`}>
                    {loadStats.misc.procsRunning}
                  </div>
                </div>
                
                <div className="bg-muted p-3 rounded-sm">
                  <div className="text-xs text-muted-foreground">Blocked</div>
                  <div className={`text-lg font-medium ${
                    loadStats.misc.procsBlocked > 0 ? 'text-red-500' : 'text-green-500'
                  }`}>
                    {loadStats.misc.procsBlocked}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Load Interpretation */}
            <div className="text-xs text-muted-foreground pt-2">
              <p>
                Load average represents the average system load over time. Values above the number of CPU cores ({10}) 
                indicate system stress.
              </p>
            </div>
          </div>
        ) : (
          <div className="py-4 text-center text-sm text-muted-foreground">
            No load data available
          </div>
        )}
      </CardContent>
    </Card>
  );
};
