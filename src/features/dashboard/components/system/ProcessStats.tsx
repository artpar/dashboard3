import React from 'react';
import { Layers } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ProcessStats as ProcessStatsType } from './SystemTypes';

interface ProcessStatsProps {
  processStats: ProcessStatsType | null;
  isLoading: boolean;
}

export const ProcessStats: React.FC<ProcessStatsProps> = ({ processStats, isLoading }) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base flex items-center">
          <Layers className="h-4 w-4 text-cyan-500 mr-2" />
          Process Information
        </CardTitle>
        {processStats && (
          <span className="text-xs text-muted-foreground">
            {processStats.count} processes
          </span>
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-16 w-full mt-2" />
          </>
        ) : processStats && processStats.top_processes.length > 0 ? (
          <div className="space-y-2">
            <div className="text-sm font-medium">Top Processes</div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-muted-foreground border-b">
                    <th className="text-left py-2 px-2">PID</th>
                    <th className="text-left py-2 px-2">Name</th>
                    <th className="text-right py-2 px-2">CPU %</th>
                    <th className="text-right py-2 px-2">Memory %</th>
                  </tr>
                </thead>
                <tbody>
                  {processStats.top_processes.map((process) => (
                    <tr key={process.pid} className="border-b border-muted">
                      <td className="py-2 px-2">{process.pid}</td>
                      <td className="py-2 px-2 font-medium">{process.name || 'Unknown'}</td>
                      <td className="py-2 px-2 text-right">
                        {process.cpu_percent > 0 ? `${process.cpu_percent.toFixed(1)}%` : '-'}
                      </td>
                      <td className="py-2 px-2 text-right">
                        {process.mem_percent > 0 ? `${process.mem_percent.toFixed(1)}%` : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="text-xs text-muted-foreground pt-2">
              <p>
                Showing top {processStats.top_processes.length} of {processStats.count} processes.
              </p>
            </div>
          </div>
        ) : (
          <div className="py-4 text-center text-sm text-muted-foreground">
            No process data available
          </div>
        )}
      </CardContent>
    </Card>
  );
};
