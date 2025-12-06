import React from 'react';
import { Cpu } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { CpuStats as CpuStatsType } from './SystemTypes';
import { getAverageCpuUsage, getProgressColor } from './SystemUtils';
import { StatsCard } from './StatsCard';

interface CpuStatsProps {
  cpuStats: CpuStatsType | null;
  isLoading: boolean;
}

export const CpuStats: React.FC<CpuStatsProps> = ({ cpuStats, isLoading }) => {
  return (
    <StatsCard
      title="CPU Usage"
      icon={<Cpu className="h-4 w-4 text-blue-500 mr-2" />}
      data={cpuStats}
      isLoading={isLoading}
      subtitle={
        cpuStats?.info[0] && (
          <span className="text-xs text-muted-foreground">
            {cpuStats.info[0].modelName} ({cpuStats.counts} cores)
          </span>
        )
      }
      loadingSkeletons={
        <>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-16 w-full" />
        </>
      }
      noDataMessage="No CPU data available"
    >
      {(data) => {
        const averageCpuUsage = getAverageCpuUsage(data.percent);
        return (
          <>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Average Usage</span>
                <span className="text-sm text-muted-foreground">
                  {averageCpuUsage.toFixed(1)}%
                </span>
              </div>
              <Progress
                value={averageCpuUsage}
                className="h-2"
                indicatorClassName={getProgressColor(averageCpuUsage)}
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {data.percent.map((percent, index) => (
                <div key={index} className="space-y-1">
                  <div className="text-xs font-medium">Core {index}</div>
                  <div className="h-16 bg-muted rounded-sm relative overflow-hidden">
                    <div
                      className={`absolute bottom-0 w-full ${getProgressColor(percent)}`}
                      style={{
                        height: `${percent}%`,
                        transition: 'height 0.5s ease-in-out'
                      }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center text-xs font-medium">
                      {percent.toFixed(1)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        );
      }}
    </StatsCard>
  );
};
