import React, { useState } from 'react';
import { Thermometer } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { HostStats } from './SystemTypes';
import { 
  formatTemperature, 
  getTemperatureColor, 
  groupTemperatureSensors,
  getRepresentativeTemperature
} from './SystemUtils';

interface TemperatureStatsProps {
  hostStats: HostStats | null;
  isLoading: boolean;
}

export const TemperatureStats: React.FC<TemperatureStatsProps> = ({ hostStats, isLoading }) => {
  const [showAllSensors, setShowAllSensors] = useState(false);
  
  // Group temperature sensors by type
  const sensorGroups = hostStats?.temperatures 
    ? groupTemperatureSensors(hostStats.temperatures)
    : {};
  
  // Get CPU/GPU average temperature
  const cpuGpuTemp = sensorGroups['CPU/GPU'] 
    ? getRepresentativeTemperature(sensorGroups['CPU/GPU'])
    : 0;
  
  // Get battery temperature
  const batteryTemp = sensorGroups['Battery']?.[0]?.temperature || 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base flex items-center">
          <Thermometer className="h-4 w-4 text-red-500 mr-2" />
          Temperature Sensors
        </CardTitle>
        {hostStats?.temperatures && hostStats.temperatures.length > 0 && (
          <button 
            onClick={() => setShowAllSensors(!showAllSensors)}
            className="text-xs text-muted-foreground hover:text-primary"
          >
            {showAllSensors ? 'Show Less' : 'Show All'}
          </button>
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-16 w-full mt-2" />
          </>
        ) : hostStats?.temperatures && hostStats.temperatures.length > 0 ? (
          <div className="space-y-4">
            {/* Main temperature indicators */}
            <div className="grid grid-cols-2 gap-4">
              {cpuGpuTemp > 0 && (
                <div className="bg-muted p-4 rounded-sm flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">CPU/GPU</div>
                    <div className={`text-xl font-bold ${getTemperatureColor(cpuGpuTemp)}`}>
                      {formatTemperature(cpuGpuTemp)}
                    </div>
                  </div>
                  <div 
                    className={`h-12 w-12 rounded-full flex items-center justify-center ${
                      cpuGpuTemp >= 70 
                        ? 'bg-red-100 text-red-500' 
                        : cpuGpuTemp >= 60 
                          ? 'bg-orange-100 text-orange-500' 
                          : 'bg-green-100 text-green-500'
                    }`}
                  >
                    <Thermometer className="h-6 w-6" />
                  </div>
                </div>
              )}
              
              {batteryTemp > 0 && (
                <div className="bg-muted p-4 rounded-sm flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">Battery</div>
                    <div className={`text-xl font-bold ${getTemperatureColor(batteryTemp)}`}>
                      {formatTemperature(batteryTemp)}
                    </div>
                  </div>
                  <div 
                    className={`h-12 w-12 rounded-full flex items-center justify-center ${
                      batteryTemp >= 45 
                        ? 'bg-red-100 text-red-500' 
                        : batteryTemp >= 40 
                          ? 'bg-orange-100 text-orange-500' 
                          : 'bg-green-100 text-green-500'
                    }`}
                  >
                    <Thermometer className="h-6 w-6" />
                  </div>
                </div>
              )}
            </div>
            
            {/* All temperature sensors */}
            {showAllSensors && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">All Sensors</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {hostStats.temperatures
                    .filter(sensor => sensor.temperature > 0)
                    .map((sensor, index) => (
                      <div key={index} className="bg-muted p-2 rounded-sm">
                        <div className="text-xs text-muted-foreground truncate" title={sensor.sensorKey}>
                          {sensor.sensorKey}
                        </div>
                        <div className={`text-sm font-medium ${getTemperatureColor(sensor.temperature)}`}>
                          {formatTemperature(sensor.temperature)}
                        </div>
                      </div>
                    ))
                  }
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="py-4 text-center text-sm text-muted-foreground">
            No temperature data available
          </div>
        )}
      </CardContent>
    </Card>
  );
};
