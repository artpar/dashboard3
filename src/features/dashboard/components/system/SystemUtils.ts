// Utility functions for system statistics

/**
 * Format bytes to human-readable format
 * @param bytes Number of bytes
 * @param decimals Number of decimal places
 * @returns Formatted string
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Format seconds to human-readable uptime
 * @param seconds Uptime in seconds
 * @returns Formatted uptime string
 */
export function formatUptime(seconds: number): string {
  // return seconds.split(".")[0];
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  const parts = [];

  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (remainingSeconds > 0 || parts.length === 0) parts.push(`${remainingSeconds}s`);

  return parts.join(' ');
}
/**
 * Format uptime string from the API
 * @param uptimeString Uptime string like "7h3m30.302493625s" or "23.5ms"
 * @returns Formatted uptime string
 */
export function formatUptimeString(uptimeString: string): string {
  // Check for milliseconds format first
  const msMatch = uptimeString.match(/^(\d+(?:\.\d+)?)ms$/);
  if (msMatch) {
    const msMatchInt = parseInt(msMatch[1])
    return `${msMatchInt}ms`;
  }

  // Parse standard format "7h3m30.302493625s"
  const regex = /(?:(\d+)h)?(?:(\d+)m)?(?:(\d+(?:\.\d+)?)s)?/;
  const matches = uptimeString.match(regex);

  if (!matches) return uptimeString;

  const hours = matches[1] ? parseInt(matches[1], 10) : 0;
  const minutes = matches[2] ? parseInt(matches[2], 10) : 0;
  const seconds = matches[3] ? Math.floor(parseFloat(matches[3])) : 0;

  // Calculate days if hours > 24
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;

  // Format the output based on which values are non-zero
  let result = '';

  if (days > 0) {
    result += `${days}d `;
    result += `${remainingHours}h ${minutes}m ${seconds}s`;
  } else if (hours > 0) {
    result += `${hours}h `;
    if (minutes > 0 || seconds > 0) {
      result += `${minutes}m `;
      if (seconds > 0) {
        result += `${seconds}s`;
      }
    } else {
      result = result.trim(); // Remove trailing space if no minutes or seconds
    }
  } else if (minutes > 0) {
    result += `${minutes}m `;
    if (seconds > 0) {
      result += `${seconds}s`;
    } else {
      result = result.trim(); // Remove trailing space if no seconds
    }
  } else if (seconds > 0) {
    result += `${seconds}s`;
  } else {
    // Handle the case where all values are 0
    result = '0s';
  }

  return result.trim();
}


/**
 * Format time since last update
 * @param lastUpdated Date object of last update
 * @returns Formatted string
 */
export function formatLastUpdated(lastUpdated: Date | null): string {
  if (!lastUpdated) return 'Never';

  const now = new Date();
  const diffSeconds = Math.floor((now.getTime() - lastUpdated.getTime()) / 1000);

  if (diffSeconds < 60) {
    return `${diffSeconds} seconds ago`;
  } else if (diffSeconds < 3600) {
    return `${Math.floor(diffSeconds / 60)} minutes ago`;
  } else {
    return lastUpdated.toLocaleTimeString();
  }
}

/**
 * Get color based on usage percentage
 * @param percent Usage percentage
 * @returns CSS color class
 */
export function getUsageColor(percent: number): string {
  if (percent >= 90) return 'text-red-500';
  if (percent >= 75) return 'text-orange-500';
  if (percent >= 60) return 'text-yellow-500';
  return 'text-green-500';
}

/**
 * Get progress bar color based on usage percentage
 * @param percent Usage percentage
 * @returns CSS color class for progress bar
 */
export function getProgressColor(percent: number): string {
  if (percent >= 90) return 'bg-red-500';
  if (percent >= 75) return 'bg-orange-500';
  if (percent >= 60) return 'bg-yellow-500';
  return 'bg-green-500';
}

/**
 * Format temperature to human-readable format
 * @param temp Temperature in Celsius
 * @returns Formatted temperature string
 */
export function formatTemperature(temp: number): string {
  return `${temp.toFixed(1)}°C`;
}

/**
 * Get color based on temperature
 * @param temp Temperature in Celsius
 * @returns CSS color class
 */
export function getTemperatureColor(temp: number): string {
  if (temp >= 80) return 'text-red-500';
  if (temp >= 70) return 'text-orange-500';
  if (temp >= 60) return 'text-yellow-500';
  return 'text-green-500';
}

/**
 * Get average CPU usage from all cores
 * @param cpuPercent Array of CPU percentages
 * @returns Average CPU usage
 */
export function getAverageCpuUsage(cpuPercent: number[]): number {
  if (!cpuPercent || cpuPercent.length === 0) return 0;
  return cpuPercent.reduce((sum, percent) => sum + percent, 0) / cpuPercent.length;
}

/**
 * Filter and group temperature sensors by type
 * @param sensors Array of temperature sensors
 * @returns Grouped sensors
 */
export function groupTemperatureSensors(sensors: any[]): Record<string, any[]> {
  if (!sensors || sensors.length === 0) return {};

  const groups: Record<string, any[]> = {};

  sensors.forEach(sensor => {
    if (sensor.temperature === 0) return; // Skip sensors with zero temperature

    const key = sensor.sensorKey.startsWith('PMU')
      ? 'CPU/GPU'
      : sensor.sensorKey.includes('battery')
        ? 'Battery'
        : 'Other';

    if (!groups[key]) groups[key] = [];
    groups[key].push(sensor);
  });

  return groups;
}

/**
 * Get representative temperature for a system component
 * @param sensors Array of temperature sensors
 * @returns Representative temperature
 */
export function getRepresentativeTemperature(sensors: any[]): number {
  if (!sensors || sensors.length === 0) return 0;

  // Get average of non-zero temperatures
  const validSensors = sensors.filter(s => s.temperature > 0);
  if (validSensors.length === 0) return 0;

  return validSensors.reduce((sum, s) => sum + s.temperature, 0) / validSensors.length;
}
