import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw } from 'lucide-react'
import { useSystemStats } from './useSystemStats'
import { CpuStats } from './CpuStats'
import { MemoryStats } from './MemoryStats'
import { DiskStats } from './DiskStats'
import { DbConnectionStats } from './DbConnectionStats'
import { HostInfo } from './HostInfo'
import { TemperatureStats } from './TemperatureStats'
import { LoadStats } from './LoadStats'
import { WebServerStats } from './WebServerStats'
import { formatLastUpdated } from './SystemUtils'

interface SystemDashboardProps {
  refreshInterval?: number; // in milliseconds, default 15 seconds
}

export const SystemDashboard: React.FC<SystemDashboardProps> = ({
  refreshInterval = 15000,
}) => {
  const {
    statistics,
    isLoading,
    isRefreshing,
    error,
    lastUpdated,
    refetch
  } = useSystemStats({ refreshInterval });

  // Ref to track if this is the first render
  const isFirstRender = useRef(true);

  // Set isFirstRender to false after the first render
  useEffect(() => {
    if (isFirstRender.current && !isLoading && statistics) {
      isFirstRender.current = false;
    }
  }, [isLoading, statistics]);

  // Determine if we should show loading state or transition smoothly
  const showLoading = isLoading && isFirstRender.current;

  // Animation variants for smooth transitions
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.3,
        when: "beforeChildren",
        staggerChildren: 0.05
      }
    },
    refresh: {
      opacity: 1,
      transition: {
        duration: 0.2,
        when: "beforeChildren"
      }
    }
  };

  const itemVariants = {
    hidden: { y: 10, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.3 }
    },
    refresh: {
      opacity: 1,
      transition: { duration: 0.2 }
    }
  };

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
            disabled={isLoading || isRefreshing}
          >
            {/*<RefreshCw className={`h-3 w-3 mr-1 ${(isLoading || isRefreshing) ? 'animate-spin' : ''}`} />*/}
            {/*{isRefreshing ? 'Refreshing...' : 'Refresh'}*/}
          </button>
        </div>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm"
        >
          Error loading system statistics: {error.message}
        </motion.div>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={isFirstRender.current ? 'loading' : 'loaded'}
          initial="hidden"
          animate={"visible"}
          exit="hidden"
          variants={containerVariants}
          className="space-y-4"
        >
          {/* Primary Stats - First Row */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
            variants={itemVariants}
          >
            <WebServerStats webStats={statistics?.web || null} isLoading={showLoading} />
            <HostInfo hostStats={statistics?.host || null} isLoading={showLoading} />
            <DbConnectionStats dbStats={statistics?.db || null} isLoading={showLoading} />
          </motion.div>

          {/* Resource Usage - Second Row */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
            variants={itemVariants}
          >
            <CpuStats cpuStats={statistics?.cpu || null} isLoading={showLoading} />
            <MemoryStats memoryStats={statistics?.memory || null} isLoading={showLoading} />
          </motion.div>

          {/* System Metrics - Third Row */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            variants={itemVariants}
          >
            <LoadStats loadStats={statistics?.load || null} isLoading={showLoading} />
            <TemperatureStats hostStats={statistics?.host || null} isLoading={showLoading} />
            <DiskStats diskStats={statistics?.disk || null} isLoading={showLoading} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-xs text-muted-foreground text-center pt-2"
          >
            Statistics automatically refresh every {refreshInterval / 1000} seconds
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
