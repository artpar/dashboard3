// Types for system statistics data
export interface CpuInfo {
  cpu: number;
  vendorId: string;
  family: string;
  model: string;
  stepping: number;
  physicalId: string;
  coreId: string;
  cores: number;
  modelName: string;
  mhz: number;
  cacheSize: number;
  flags: string[] | null;
  microcode: string;
}

export interface CpuStats {
  counts: number;
  info: CpuInfo[];
  percent: number[];
}

export interface DbStats {
  MaxOpenConnections: number;
  OpenConnections: number;
  InUse: number;
  Idle: number;
  WaitCount: number;
  WaitDuration: number;
  MaxIdleClosed: number;
  MaxIdleTimeClosed: number;
  MaxLifetimeClosed: number;
}

export interface DiskIOStats {
  [key: string]: {
    readCount: number;
    mergedReadCount: number;
    writeCount: number;
    mergedWriteCount: number;
    readBytes: number;
    writeBytes: number;
    readTime: number;
    writeTime: number;
    iopsInProgress: number;
    ioTime: number;
    weightedIO: number;
    name: string;
    serialNumber: string;
    label: string;
  };
}

export interface DiskStats {
  io: DiskIOStats;
}

export interface HostInfo {
  hostname: string;
  uptime: number;
  bootTime: number;
  procs: number;
  os: string;
  platform: string;
  platformFamily: string;
  platformVersion: string;
  kernelVersion: string;
  kernelArch: string;
  virtualizationSystem: string;
  virtualizationRole: string;
  hostId: string;
}

export interface TemperatureSensor {
  sensorKey: string;
  temperature: number;
  sensorHigh: number;
  sensorCritical: number;
}

export interface HostStats {
  info: HostInfo;
  temperatures: TemperatureSensor[];
  users: any | null;
}

export interface LoadAvg {
  load1: number;
  load5: number;
  load15: number;
}

export interface LoadMisc {
  procsTotal: number;
  procsCreated: number;
  procsRunning: number;
  procsBlocked: number;
  ctxt: number;
}

export interface LoadStats {
  avg: LoadAvg;
  misc: LoadMisc;
}

export interface SwapMemory {
  total: number;
  used: number;
  free: number;
  usedPercent: number;
  sin: number;
  sout: number;
  pgIn: number;
  pgOut: number;
  pgFault: number;
  pgMajFault: number;
}

export interface VirtualMemory {
  total: number;
  available: number;
  used: number;
  usedPercent: number;
  free: number;
  active: number;
  inactive: number;
  wired: number;
  laundry: number;
  buffers: number;
  cached: number;
  writeBack: number;
  dirty: number;
  writeBackTmp: number;
  shared: number;
  slab: number;
  sreclaimable: number;
  sunreclaim: number;
  pageTables: number;
  swapCached: number;
  commitLimit: number;
  committedAS: number;
  highTotal: number;
  highFree: number;
  lowTotal: number;
  lowFree: number;
  swapTotal: number;
  swapFree: number;
  mapped: number;
  vmallocTotal: number;
  vmallocUsed: number;
  vmallocChunk: number;
  hugePagesTotal: number;
  hugePagesFree: number;
  hugePagesRsvd: number;
  hugePagesSurp: number;
  hugePageSize: number;
  anonHugePages: number;
}

export interface MemoryStats {
  swap: SwapMemory;
  virtual: VirtualMemory;
}

export interface Process {
  cmdline: string;
  cpu_percent: number;
  mem_percent: number;
  name: string;
  pid: number;
}

export interface ProcessStats {
  count: number;
  top_processes: Process[];
}

export interface WebStats {
  pid: number;
  hostname: string;
  uptime: string;
  uptime_sec: number;
  time: string;
  unixtime: number;
  status_code_count: Record<string, number>;
  total_status_code_count: Record<string, number>;
  count: number;
  total_count: number;
  total_response_time: string;
  total_response_time_sec: number;
  total_response_size: number;
  average_response_size: number;
  average_response_time: string;
  average_response_time_sec: number;
  total_metrics_counts: Record<string, number>;
  average_metrics_timers: Record<string, number>;
}

export interface SystemStatistics {
  cpu: CpuStats;
  db: DbStats;
  disk: DiskStats;
  host: HostStats;
  load: LoadStats;
  memory: MemoryStats;
  process: ProcessStats;
  web: WebStats;
}
