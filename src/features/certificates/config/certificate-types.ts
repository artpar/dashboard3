import { ShieldCheck, ShieldAlert, ShieldX, Clock, type LucideIcon } from 'lucide-react'

export type CertificateType = 'self-signed' | 'acme' | 'uploaded'

export interface CertificateTypeConfig {
  id: CertificateType
  label: string
  description: string
  icon: LucideIcon
  action?: string // Daptin action name
}

export const CERTIFICATE_TYPES: Record<CertificateType, CertificateTypeConfig> = {
  'self-signed': {
    id: 'self-signed',
    label: 'Self-Signed',
    description: 'Generate a self-signed certificate for development or internal use',
    icon: ShieldAlert,
    action: 'self.tls.generate',
  },
  acme: {
    id: 'acme',
    label: "Let's Encrypt (ACME)",
    description: 'Obtain a free, trusted certificate from Let\'s Encrypt',
    icon: ShieldCheck,
    action: 'acme.tls.generate',
  },
  uploaded: {
    id: 'uploaded',
    label: 'Upload Certificate',
    description: 'Upload your own certificate and private key',
    icon: ShieldCheck,
  },
}

export type CertificateStatus = 'valid' | 'expiring' | 'expired' | 'pending' | 'error'

export interface CertificateStatusConfig {
  id: CertificateStatus
  label: string
  color: string
  icon: LucideIcon
}

export const CERTIFICATE_STATUS: Record<CertificateStatus, CertificateStatusConfig> = {
  valid: {
    id: 'valid',
    label: 'Valid',
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: ShieldCheck,
  },
  expiring: {
    id: 'expiring',
    label: 'Expiring Soon',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: Clock,
  },
  expired: {
    id: 'expired',
    label: 'Expired',
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: ShieldX,
  },
  pending: {
    id: 'pending',
    label: 'Pending',
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    icon: Clock,
  },
  error: {
    id: 'error',
    label: 'Error',
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: ShieldAlert,
  },
}

export interface CertificateEntity {
  id: string
  reference_id: string
  hostname: string
  certificate_pem?: string
  private_key_pem?: string
  public_key_pem?: string
  root_certificate?: string
  created_at: string
  updated_at: string
}

export interface ParsedCertificate {
  subject: string
  issuer: string
  validFrom: Date
  validTo: Date
  serialNumber: string
  fingerprint?: string
  keyUsage?: string[]
  subjectAltNames?: string[]
}

/**
 * Parse a PEM certificate to extract information
 * Note: Full parsing requires server-side or Web Crypto API
 * This provides basic extraction from PEM format
 */
export function parseCertificatePEM(pem: string): Partial<ParsedCertificate> | null {
  if (!pem || !pem.includes('BEGIN CERTIFICATE')) {
    return null
  }

  // Basic validation that it's a certificate
  const certMatch = pem.match(/-----BEGIN CERTIFICATE-----([\s\S]*?)-----END CERTIFICATE-----/)
  if (!certMatch) {
    return null
  }

  // For full parsing, we'd need to decode the ASN.1 structure
  // Return basic info for now
  return {
    subject: 'Certificate present',
  }
}

/**
 * Calculate certificate status based on expiry date
 */
export function getCertificateStatus(
  validTo?: Date | string | null,
  hasCertificate?: boolean
): CertificateStatus {
  if (!hasCertificate) {
    return 'pending'
  }

  if (!validTo) {
    return 'valid' // Assume valid if no expiry info
  }

  const expiryDate = typeof validTo === 'string' ? new Date(validTo) : validTo
  const now = new Date()
  const daysUntilExpiry = Math.floor((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

  if (daysUntilExpiry < 0) {
    return 'expired'
  } else if (daysUntilExpiry < 30) {
    return 'expiring'
  }

  return 'valid'
}

/**
 * Format certificate expiry for display
 */
export function formatCertificateExpiry(validTo?: Date | string | null): string {
  if (!validTo) {
    return 'Unknown'
  }

  const expiryDate = typeof validTo === 'string' ? new Date(validTo) : validTo
  const now = new Date()
  const daysUntilExpiry = Math.floor((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

  if (daysUntilExpiry < 0) {
    return `Expired ${Math.abs(daysUntilExpiry)} days ago`
  } else if (daysUntilExpiry === 0) {
    return 'Expires today'
  } else if (daysUntilExpiry === 1) {
    return 'Expires tomorrow'
  } else if (daysUntilExpiry < 30) {
    return `Expires in ${daysUntilExpiry} days`
  }

  return expiryDate.toLocaleDateString()
}

/**
 * Generate DKIM DNS record from certificate
 */
export function generateDKIMRecord(hostname: string, publicKeyPem?: string): string | null {
  if (!publicKeyPem) {
    return null
  }

  // Extract the base64 key content (remove headers and newlines)
  const keyContent = publicKeyPem
    .replace(/-----BEGIN PUBLIC KEY-----/g, '')
    .replace(/-----END PUBLIC KEY-----/g, '')
    .replace(/\s/g, '')

  // DKIM record format
  return `v=DKIM1; k=rsa; p=${keyContent}`
}

/**
 * Get the selector for DKIM (commonly 'daptin' or based on config)
 */
export function getDKIMSelector(): string {
  return 'daptin'
}

/**
 * Generate the full DKIM DNS record name
 */
export function getDKIMRecordName(hostname: string): string {
  return `${getDKIMSelector()}._domainkey.${hostname}`
}
