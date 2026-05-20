const configuredDaptinEndpoint =
  import.meta.env.VITE_DAPTIN_ENDPOINT || import.meta.env.VITE_DAPTIN_URL
const runtimeDaptinEndpoint =
  typeof window !== 'undefined' ? window.location.origin : ''

export const HOST_BASEURL = configuredDaptinEndpoint || runtimeDaptinEndpoint
