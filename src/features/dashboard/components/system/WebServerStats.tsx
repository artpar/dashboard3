import React from 'react';
import { Globe } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { WebStats } from './SystemTypes';
import { formatUptimeString } from './SystemUtils';

interface WebServerStatsProps {
  webStats: WebStats | null;
  isLoading: boolean;
}

export const WebServerStats: React.FC<WebServerStatsProps> = ({ webStats, isLoading }) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base flex items-center">
          <Globe className="h-4 w-4 text-teal-500 mr-2" />
          Web Server Status
        </CardTitle>
        {webStats && (
          <div className="flex items-center">
            <span className="h-2 w-2 rounded-full bg-green-500 mr-2"></span>
            <span className="text-xs text-muted-foreground">Online</span>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center justify-between py-1 border-b">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </>
        ) : webStats ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {/* Uptime */}
              <div className="flex items-center justify-between py-1 border-b">
                <span className="text-sm font-medium">Uptime</span>
                <span className="text-sm">{formatUptimeString(webStats.uptime)}</span>
              </div>

              {/* PID */}
              <div className="flex items-center justify-between py-1 border-b">
                <span className="text-sm font-medium">Process ID</span>
                <span className="text-sm">{webStats.pid}</span>
              </div>

              {/* Total Requests */}
              <div className="flex items-center justify-between py-1 border-b">
                <span className="text-sm font-medium">Total Requests</span>
                <span className="text-sm">{webStats.total_count.toLocaleString()}</span>
              </div>

              {/* Recent Requests */}
              <div className="flex items-center justify-between py-1 border-b">
                <span className="text-sm font-medium">Recent Requests</span>
                <span className="text-sm">{webStats.count}</span>
              </div>

              {/* Average Response Time */}
              <div className="flex items-center justify-between py-1 border-b">
                <span className="text-sm font-medium">Avg. Response Time</span>
                <span className="text-sm">{formatUptimeString(webStats.average_response_time)}</span>
              </div>

              {/* Server Time */}
              <div className="flex items-center justify-between py-1 border-b">
                <span className="text-sm font-medium">Server Time</span>
                <span className="text-sm">{new Date(webStats.unixtime * 1000).toLocaleTimeString()}</span>
              </div>
            </div>

            {/* Status Code Distribution */}
            {Object.keys(webStats.total_status_code_count).length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">Status Code Distribution</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {Object.entries(webStats.total_status_code_count).map(([code, count]) => (
                    <div key={code} className="bg-muted p-2 rounded-sm">
                      <div className="text-xs text-muted-foreground">Status {code}</div>
                      <div className="text-sm font-medium">{count.toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="py-4 text-center text-sm text-muted-foreground">
            No web server data available
          </div>
        )}
      </CardContent>
    </Card>
  );
};
