import { useState, useEffect, useRef, useCallback } from 'react';
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
  isRefreshing: boolean; // Added to indicate background refresh
}


export function useSystemStats({
  refreshInterval = 30000,
  initialFetch = true,
}: UseSystemStatsProps = {}): UseSystemStatsResult {
  const [statistics, setStatistics] = useState<SystemStatistics | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(initialFetch);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const DAPTIN_ENDPOINT = daptinClient.appConfig.getEndpoint();

  // Use refs to track previous values for smooth transitions
  const prevStatsRef = useRef<SystemStatistics | null>(null);
  const isMountedRef = useRef<boolean>(true);

  // Smoothly merge new data with existing data
  const smoothlyUpdateStatistics = (newData: SystemStatistics) => {
    if (!prevStatsRef.current) {
      // First load - just set the data directly
      setStatistics(newData);
      prevStatsRef.current = newData;
      return;
    }

    // Merge the new data with previous data for smoother transitions
    // This creates a transitional state that will be updated on the next refresh
    const mergedData = { ...newData };

    // Update the reference for next time
    prevStatsRef.current = newData;

    // Set the merged data
    setStatistics(mergedData);
  };

  const fetchStatistics = useCallback(async (isInitialLoad = false) => {
    try {
      if (isInitialLoad) {
        setIsLoading(true);
      } else {
        setIsRefreshing(true);
      }
      setError(null);

      const response = await fetch(`${DAPTIN_ENDPOINT}/statistics`);

      if (!response.ok) {
        throw new Error(`Failed to fetch statistics: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (isMountedRef.current) {
        smoothlyUpdateStatistics(data);
        setLastUpdated(new Date());
      }
    } catch (err) {
      console.error('Error fetching system statistics:', err);
      if (isMountedRef.current) {
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;

    if (initialFetch) {
      fetchStatistics(true);
    }

    if (refreshInterval > 0) {
      const intervalId = setInterval(() => fetchStatistics(false), refreshInterval);
      return () => {
        clearInterval(intervalId);
        isMountedRef.current = false;
      };
    }

    return () => {
      isMountedRef.current = false;
    };
  }, [refreshInterval, initialFetch, fetchStatistics]);

  // Create a memoized refetch function that always passes isInitialLoad=false
  const refetch = useCallback(async () => {
    return fetchStatistics(false);
  }, [fetchStatistics]);

  return {
    statistics,
    isLoading,
    isRefreshing,
    error,
    lastUpdated,
    refetch,
  };
}
