import React, { useRef, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { useSystemStats } from './system/useSystemStats'
import { CpuStats } from './system/CpuStats'
import { MemoryStats } from './system/MemoryStats'
import { DiskStats } from './system/DiskStats'
import { DbConnectionStats } from './system/DbConnectionStats'
import { motion, AnimatePresence } from 'framer-motion'

interface SystemHealthProps {
  refreshInterval?: number
}

export const SystemHealth: React.FC<SystemHealthProps> = ({
  refreshInterval = 30000,
}) => {
  // Use our improved hook with isRefreshing state
  const { statistics, isLoading, isRefreshing } = useSystemStats({ refreshInterval })

  // Ref to track if this is the first render
  const isFirstRender = useRef(true)

  // Set isFirstRender to false after the first render
  useEffect(() => {
    if (isFirstRender.current && !isLoading && statistics) {
      isFirstRender.current = false
    }
  }, [isLoading, statistics])

  // Determine if we should show loading state or transition smoothly
  const showLoading = isLoading && isFirstRender.current

  // Animation variants for smooth transitions
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.3,
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    },
    refresh: {
      opacity: 1,
      transition: {
        duration: 0.2,
        when: "beforeChildren"
      }
    }
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.3 }
    },
    refresh: {
      opacity: 1,
      transition: { duration: 0.2 }
    }
  }

  return (
    <Card className={isRefreshing ? 'relative' : ''}>
      {/* Subtle refresh indicator overlay */}
      {isRefreshing && !isLoading && (
        <div className="absolute inset-0 bg-primary/5 z-10 pointer-events-none rounded-lg overflow-hidden">
          <div className="absolute top-0 left-0 h-1 bg-primary/20 animate-pulse w-full"></div>
        </div>
      )}

      <CardContent className="p-4 space-y-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={isFirstRender.current ? 'loading' : 'loaded'}
            initial="hidden"
            animate={isRefreshing ? "refresh" : "visible"}
            exit="hidden"
            variants={containerVariants}
            className="space-y-4"
          >
            <motion.h3
              className="text-base font-medium"
              variants={itemVariants}
            >
              Resource Usage
            </motion.h3>

            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
              variants={itemVariants}
            >
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </CardContent>
    </Card>
  )
}

// This is kept for backward compatibility but no longer used directly
export const defaultSystemMetrics = []
