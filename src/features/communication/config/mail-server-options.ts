import { Lock, Mail, Server, Shield, Globe, Key, Inbox, Send } from 'lucide-react'

export interface MailServerType {
  id: string
  label: string
  description: string
  icon: typeof Server
  defaultPort: number
  defaultEncryption: string
}

export interface EncryptionType {
  id: string
  label: string
  description: string
  defaultPort: number
}

export interface AuthType {
  id: string
  label: string
  description: string
}

export interface PresetProvider {
  id: string
  label: string
  icon: typeof Mail
  smtpHost: string
  smtpPort: number
  imapHost: string
  imapPort: number
  encryption: string
  authType: string
  description: string
}

export const MAIL_SERVER_TYPES: MailServerType[] = [
  {
    id: 'smtp',
    label: 'SMTP',
    description: 'Simple Mail Transfer Protocol for sending emails',
    icon: Send,
    defaultPort: 587,
    defaultEncryption: 'starttls',
  },
  {
    id: 'imap',
    label: 'IMAP',
    description: 'Internet Message Access Protocol for receiving emails',
    icon: Inbox,
    defaultPort: 993,
    defaultEncryption: 'ssl',
  },
]

export const ENCRYPTION_TYPES: EncryptionType[] = [
  {
    id: 'none',
    label: 'None',
    description: 'No encryption (not recommended)',
    defaultPort: 25,
  },
  {
    id: 'ssl',
    label: 'SSL/TLS',
    description: 'Implicit SSL/TLS encryption on connect',
    defaultPort: 465,
  },
  {
    id: 'starttls',
    label: 'STARTTLS',
    description: 'Upgrade to TLS after initial connection',
    defaultPort: 587,
  },
]

export const AUTH_TYPES: AuthType[] = [
  {
    id: 'none',
    label: 'No Authentication',
    description: 'Open relay (not recommended)',
  },
  {
    id: 'plain',
    label: 'Plain',
    description: 'Simple username/password authentication',
  },
  {
    id: 'login',
    label: 'Login',
    description: 'LOGIN authentication method',
  },
  {
    id: 'cram-md5',
    label: 'CRAM-MD5',
    description: 'Challenge-response authentication',
  },
  {
    id: 'oauth2',
    label: 'OAuth 2.0',
    description: 'Modern OAuth 2.0 authentication',
  },
]

export const PRESET_PROVIDERS: PresetProvider[] = [
  {
    id: 'gmail',
    label: 'Gmail',
    icon: Mail,
    smtpHost: 'smtp.gmail.com',
    smtpPort: 587,
    imapHost: 'imap.gmail.com',
    imapPort: 993,
    encryption: 'starttls',
    authType: 'oauth2',
    description: 'Google Gmail SMTP/IMAP servers',
  },
  {
    id: 'outlook',
    label: 'Outlook / Microsoft 365',
    icon: Mail,
    smtpHost: 'smtp.office365.com',
    smtpPort: 587,
    imapHost: 'outlook.office365.com',
    imapPort: 993,
    encryption: 'starttls',
    authType: 'oauth2',
    description: 'Microsoft Outlook and Office 365',
  },
  {
    id: 'yahoo',
    label: 'Yahoo Mail',
    icon: Mail,
    smtpHost: 'smtp.mail.yahoo.com',
    smtpPort: 587,
    imapHost: 'imap.mail.yahoo.com',
    imapPort: 993,
    encryption: 'ssl',
    authType: 'plain',
    description: 'Yahoo Mail servers',
  },
  {
    id: 'sendgrid',
    label: 'SendGrid',
    icon: Send,
    smtpHost: 'smtp.sendgrid.net',
    smtpPort: 587,
    imapHost: '',
    imapPort: 0,
    encryption: 'starttls',
    authType: 'plain',
    description: 'SendGrid email delivery service',
  },
  {
    id: 'mailgun',
    label: 'Mailgun',
    icon: Send,
    smtpHost: 'smtp.mailgun.org',
    smtpPort: 587,
    imapHost: '',
    imapPort: 0,
    encryption: 'starttls',
    authType: 'plain',
    description: 'Mailgun email delivery service',
  },
  {
    id: 'ses',
    label: 'Amazon SES',
    icon: Send,
    smtpHost: 'email-smtp.us-east-1.amazonaws.com',
    smtpPort: 587,
    imapHost: '',
    imapPort: 0,
    encryption: 'starttls',
    authType: 'plain',
    description: 'Amazon Simple Email Service',
  },
  {
    id: 'postmark',
    label: 'Postmark',
    icon: Send,
    smtpHost: 'smtp.postmarkapp.com',
    smtpPort: 587,
    imapHost: '',
    imapPort: 0,
    encryption: 'starttls',
    authType: 'plain',
    description: 'Postmark transactional email',
  },
  {
    id: 'custom',
    label: 'Custom Server',
    icon: Server,
    smtpHost: '',
    smtpPort: 587,
    imapHost: '',
    imapPort: 993,
    encryption: 'starttls',
    authType: 'plain',
    description: 'Configure your own mail server',
  },
]

export function getMailServerTypeById(id: string): MailServerType | undefined {
  return MAIL_SERVER_TYPES.find((type) => type.id === id)
}

export function getEncryptionTypeById(id: string): EncryptionType | undefined {
  return ENCRYPTION_TYPES.find((type) => type.id === id)
}

export function getAuthTypeById(id: string): AuthType | undefined {
  return AUTH_TYPES.find((type) => type.id === id)
}

export function getPresetProviderById(id: string): PresetProvider | undefined {
  return PRESET_PROVIDERS.find((provider) => provider.id === id)
}
