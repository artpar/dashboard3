import {
  HardDrive,
  Cloud,
  Server,
  Database,
  Folder,
  LucideIcon,
} from 'lucide-react'

export interface ProviderField {
  name: string
  label: string
  type: 'text' | 'select' | 'password' | 'number' | 'checkbox'
  required?: boolean
  placeholder?: string
  options?: { value: string; label: string }[]
  description?: string
}

export interface CloudProvider {
  id: string
  label: string
  icon: LucideIcon
  description: string
  fields: ProviderField[]
  pathFormat: string
  pathPrefix: string
  pathPlaceholder: string
}

export const CLOUD_PROVIDERS: Record<string, CloudProvider> = {
  local: {
    id: 'local',
    label: 'Local Filesystem',
    icon: HardDrive,
    description: 'Store files on the local server filesystem',
    fields: [],
    pathFormat: '/path/to/directory',
    pathPrefix: '',
    pathPlaceholder: '/data/storage',
  },
  s3: {
    id: 's3',
    label: 'AWS S3',
    icon: Cloud,
    description: 'Amazon Simple Storage Service or S3-compatible (MinIO, DigitalOcean Spaces)',
    fields: [
      {
        name: 'region',
        label: 'Region',
        type: 'select',
        required: true,
        options: [
          { value: 'us-east-1', label: 'US East (N. Virginia)' },
          { value: 'us-east-2', label: 'US East (Ohio)' },
          { value: 'us-west-1', label: 'US West (N. California)' },
          { value: 'us-west-2', label: 'US West (Oregon)' },
          { value: 'eu-west-1', label: 'EU (Ireland)' },
          { value: 'eu-west-2', label: 'EU (London)' },
          { value: 'eu-west-3', label: 'EU (Paris)' },
          { value: 'eu-central-1', label: 'EU (Frankfurt)' },
          { value: 'ap-south-1', label: 'Asia Pacific (Mumbai)' },
          { value: 'ap-northeast-1', label: 'Asia Pacific (Tokyo)' },
          { value: 'ap-northeast-2', label: 'Asia Pacific (Seoul)' },
          { value: 'ap-southeast-1', label: 'Asia Pacific (Singapore)' },
          { value: 'ap-southeast-2', label: 'Asia Pacific (Sydney)' },
          { value: 'sa-east-1', label: 'South America (Sao Paulo)' },
        ],
      },
      {
        name: 'bucket',
        label: 'Bucket Name',
        type: 'text',
        required: true,
        placeholder: 'my-bucket',
      },
      {
        name: 'endpoint',
        label: 'Custom Endpoint',
        type: 'text',
        required: false,
        placeholder: 'https://s3.amazonaws.com',
        description: 'For S3-compatible services like MinIO or DigitalOcean Spaces',
      },
      {
        name: 'encryption',
        label: 'Enable Encryption',
        type: 'checkbox',
        required: false,
        description: 'Enable server-side encryption',
      },
    ],
    pathFormat: 's3:bucket-name/path',
    pathPrefix: 's3:',
    pathPlaceholder: 's3:my-bucket/files',
  },
  gcs: {
    id: 'gcs',
    label: 'Google Cloud Storage',
    icon: Cloud,
    description: 'Google Cloud Storage buckets',
    fields: [
      {
        name: 'project',
        label: 'Project ID',
        type: 'text',
        required: true,
        placeholder: 'my-gcp-project',
      },
      {
        name: 'bucket',
        label: 'Bucket Name',
        type: 'text',
        required: true,
        placeholder: 'my-bucket',
      },
    ],
    pathFormat: 'gcs:bucket-name/path',
    pathPrefix: 'gcs:',
    pathPlaceholder: 'gcs:my-bucket/files',
  },
  azure: {
    id: 'azure',
    label: 'Azure Blob Storage',
    icon: Cloud,
    description: 'Microsoft Azure Blob Storage containers',
    fields: [
      {
        name: 'account',
        label: 'Storage Account',
        type: 'text',
        required: true,
        placeholder: 'mystorageaccount',
      },
      {
        name: 'container',
        label: 'Container Name',
        type: 'text',
        required: true,
        placeholder: 'my-container',
      },
    ],
    pathFormat: 'azure:container/path',
    pathPrefix: 'azure:',
    pathPlaceholder: 'azure:my-container/files',
  },
  b2: {
    id: 'b2',
    label: 'Backblaze B2',
    icon: Database,
    description: 'Backblaze B2 Cloud Storage',
    fields: [
      {
        name: 'account',
        label: 'Account ID',
        type: 'text',
        required: true,
        placeholder: 'Account ID or Application Key ID',
      },
      {
        name: 'bucket',
        label: 'Bucket Name',
        type: 'text',
        required: true,
        placeholder: 'my-bucket',
      },
    ],
    pathFormat: 'b2:bucket-name/path',
    pathPrefix: 'b2:',
    pathPlaceholder: 'b2:my-bucket/files',
  },
  ftp: {
    id: 'ftp',
    label: 'FTP Server',
    icon: Server,
    description: 'Connect to an FTP server',
    fields: [
      {
        name: 'host',
        label: 'Host',
        type: 'text',
        required: true,
        placeholder: 'ftp.example.com',
      },
      {
        name: 'port',
        label: 'Port',
        type: 'number',
        required: false,
        placeholder: '21',
      },
      {
        name: 'user',
        label: 'Username',
        type: 'text',
        required: false,
        placeholder: 'anonymous',
      },
    ],
    pathFormat: 'ftp:host/path',
    pathPrefix: 'ftp:',
    pathPlaceholder: 'ftp:ftp.example.com/files',
  },
  sftp: {
    id: 'sftp',
    label: 'SFTP Server',
    icon: Server,
    description: 'Connect to an SFTP (SSH File Transfer Protocol) server',
    fields: [
      {
        name: 'host',
        label: 'Host',
        type: 'text',
        required: true,
        placeholder: 'sftp.example.com',
      },
      {
        name: 'port',
        label: 'Port',
        type: 'number',
        required: false,
        placeholder: '22',
      },
      {
        name: 'user',
        label: 'Username',
        type: 'text',
        required: true,
        placeholder: 'user',
      },
    ],
    pathFormat: 'sftp:host/path',
    pathPrefix: 'sftp:',
    pathPlaceholder: 'sftp:server.example.com/home/user',
  },
  dropbox: {
    id: 'dropbox',
    label: 'Dropbox',
    icon: Folder,
    description: 'Dropbox cloud storage',
    fields: [],
    pathFormat: 'dropbox:/path',
    pathPrefix: 'dropbox:',
    pathPlaceholder: 'dropbox:/Apps/MyApp',
  },
  drive: {
    id: 'drive',
    label: 'Google Drive',
    icon: Folder,
    description: 'Google Drive personal or team drive',
    fields: [
      {
        name: 'team_drive',
        label: 'Team Drive ID',
        type: 'text',
        required: false,
        placeholder: 'Leave empty for personal drive',
      },
    ],
    pathFormat: 'drive:/path',
    pathPrefix: 'drive:',
    pathPlaceholder: 'drive:/MyFolder',
  },
  onedrive: {
    id: 'onedrive',
    label: 'Microsoft OneDrive',
    icon: Folder,
    description: 'Microsoft OneDrive personal or business',
    fields: [],
    pathFormat: 'onedrive:/path',
    pathPrefix: 'onedrive:',
    pathPlaceholder: 'onedrive:/Documents',
  },
}

export const STORE_TYPES = [
  { value: 'local', label: 'Local', description: 'Direct access to remote storage' },
  { value: 'cached', label: 'Cached', description: 'Local mirror with sync to remote' },
]

export const getProviderById = (id: string): CloudProvider | undefined => {
  return CLOUD_PROVIDERS[id]
}

export const getProviderList = (): CloudProvider[] => {
  return Object.values(CLOUD_PROVIDERS)
}
