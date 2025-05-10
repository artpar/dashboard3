import React from 'react';
import { RefreshCw } from 'lucide-react';
import { useSystemStats } from './useSystemStats';
import { CpuStats } from './CpuStats';
import { MemoryStats } from './MemoryStats';
import { DiskStats } from './DiskStats';
import { DbConnectionStats } from './DbConnectionStats';
import { HostInfo } from './HostInfo';
import { TemperatureStats } from './TemperatureStats';
import { LoadStats } from './LoadStats';
import { ProcessStats } from './ProcessStats';
import { WebServerStats } from './WebServerStats';
import { formatLastUpdated } from './SystemUtils';

interface SystemDashboardProps {
  refreshInterval?: number; // in milliseconds, default 15 seconds
}

export const SystemDashboard: React.FC<SystemDashboardProps> = ({
  refreshInterval = 15000,
}) => {
  const { 
    statistics, 
    isLoading, 
    error, 
    lastUpdated, 
    refetch 
  } = useSystemStats({ refreshInterval });

  return (
    <div className="space-y-4">
      {/* Dashboard Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">System Health Dashboard</h2>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-muted-foreground">
            Last updated: {formatLastUpdated(lastUpdated)}
          </span>
          <button 
            onClick={refetch}
            className="flex items-center text-xs text-primary hover:text-primary/80 transition-colors"
            disabled={isLoading}
          >
            <RefreshCw className={`h-3 w-3 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
          Error loading system statistics: {error.message}
        </div>
      )}

      {/* Primary Stats - First Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <WebServerStats webStats={statistics?.web || null} isLoading={isLoading} />
        <HostInfo hostStats={statistics?.host || null} isLoading={isLoading} />
        <DbConnectionStats dbStats={statistics?.db || null} isLoading={isLoading} />
      </div>

      {/* Resource Usage - Second Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <CpuStats cpuStats={statistics?.cpu || null} isLoading={isLoading} />
        <MemoryStats memoryStats={statistics?.memory || null} isLoading={isLoading} />
      </div>

      {/* System Metrics - Third Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <LoadStats loadStats={statistics?.load || null} isLoading={isLoading} />
        <TemperatureStats hostStats={statistics?.host || null} isLoading={isLoading} />
        <DiskStats diskStats={statistics?.disk || null} isLoading={isLoading} />
      </div>

      {/* Process Information - Fourth Row */}
      <div className="grid grid-cols-1 gap-4">
        <ProcessStats processStats={statistics?.process || null} isLoading={isLoading} />
      </div>

      <div className="text-xs text-muted-foreground text-center pt-2">
        Statistics automatically refresh every {refreshInterval / 1000} seconds
      </div>
    </div>
  );
};
