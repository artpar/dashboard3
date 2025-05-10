import { useState, useEffect } from 'react';
import { SystemStatistics } from './SystemTypes';
import { daptinClient } from '@/daptin';

interface UseSystemStatsProps {
  refreshInterval?: number; // in milliseconds, default 30 seconds
  initialFetch?: boolean; // whether to fetch on mount
}

interface UseSystemStatsResult {
  statistics: SystemStatistics | null;
  isLoading: boolean;
  error: Error | null;
  lastUpdated: Date | null;
  refetch: () => Promise<void>;
}

const DAPTIN_ENDPOINT = import.meta.env.VITE_DAPTIN_URL || daptinClient.endpoint;

export function useSystemStats({
  refreshInterval = 30000,
  initialFetch = true,
}: UseSystemStatsProps = {}): UseSystemStatsResult {
  const [statistics, setStatistics] = useState<SystemStatistics | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(initialFetch);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchStatistics = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(`${DAPTIN_ENDPOINT}/statistics`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch statistics: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      setStatistics(data);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching system statistics:', err);
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (initialFetch) {
      fetchStatistics();
    }

    if (refreshInterval > 0) {
      const intervalId = setInterval(fetchStatistics, refreshInterval);
      return () => clearInterval(intervalId);
    }
  }, [refreshInterval, initialFetch]);

  return {
    statistics,
    isLoading,
    error,
    lastUpdated,
    refetch: fetchStatistics,
  };
}
