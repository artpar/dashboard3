import React from 'react'
import { Link } from '@tanstack/react-router'
import { Plus } from 'lucide-react'
import { TableBody, TableCell, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'

/**
 * Concept descriptions sourced from the Daptin wiki.
 * Keyed by entity table_name.
 */
const ENTITY_CONCEPTS: Record<string, { what: string; when: string }> = {
  action: {
    what: 'Actions are named server-side operations that execute business logic beyond CRUD — sending emails, uploading files, generating tokens, or calling external APIs.',
    when: 'Create actions for workflows like authentication flows, file management, data import/export, or triggering integrations.',
  },
  smd: {
    what: 'State machines define valid state transitions for records, controlling how they move through a lifecycle (e.g. draft → review → published).',
    when: 'Use state machines for order workflows, approval processes, support tickets, or any entity with strict stage progression.',
  },
  stream: {
    what: 'Streams are data transformation pipelines that process records as they flow through the system.',
    when: 'Use streams to transform, filter, or route data between entities or external systems in real time.',
  },
  data_exchange: {
    what: 'Data exchanges define bidirectional sync between Daptin entities and external systems like REST APIs, Google Sheets, or webhooks.',
    when: 'Use exchanges to push record changes to external systems or trigger automated workflows on data mutations.',
  },
  integration: {
    what: 'Integrations connect external APIs by uploading OpenAPI specs (v2/v3). Each API operation is parsed into a callable Daptin action.',
    when: 'Use integrations to connect services like Stripe, Twilio, or any OpenAPI-documented API without writing custom code.',
  },
  cloud_store: {
    what: 'Cloud stores configure storage backends via rclone — S3, GCS, Azure, Dropbox, local filesystem, and more.',
    when: 'Use cloud stores to manage file storage across providers, back static sites, or handle file uploads from entity columns.',
  },
  site: {
    what: 'Sites serve static websites from cloud storage with domain-based routing and automatic syncing.',
    when: 'Use sites to host marketing pages, documentation, Hugo/Jekyll blogs, or any static content from your cloud stores.',
  },
  certificate: {
    what: 'Certificates manage SSL/TLS credentials for HTTPS connections and DKIM email signing.',
    when: 'Add certificates to enable HTTPS for your sites or sign outgoing emails with DKIM.',
  },
  oauth_connect: {
    what: 'OAuth connections configure external identity providers (Google, GitHub, Microsoft, Facebook) for social login and API access.',
    when: 'Set up OAuth to enable social login for users or to access external APIs on their behalf.',
  },
  mail_server: {
    what: 'Mail servers configure SMTP and IMAP connections for sending and receiving email through Daptin.',
    when: 'Add a mail server to enable email actions — sending notifications, processing inbound mail, or syncing mailboxes.',
  },
  user_account: {
    what: 'User accounts store credentials and profile data. Each account uses JWT authentication with configurable group membership.',
    when: 'Manage user access, assign groups for permission control, or configure OTP-based two-factor authentication.',
  },
  usergroup: {
    what: 'User groups collect users for bulk permission assignment. Permissions are enforced at both table and record level per group.',
    when: 'Create groups to define access tiers — e.g. editors, viewers, admins — then assign table/row permissions per group.',
  },
}

interface EntityEmptyStateProps {
  entityName: string
  colSpan: number
  className?: string
}

export const EntityEmptyState: React.FC<EntityEmptyStateProps> = ({
  entityName,
  colSpan,
  className,
}) => {
  const concept = ENTITY_CONCEPTS[entityName]

  if (!concept) {
    return (
      <TableBody className={className}>
        <TableRow>
          <TableCell
            colSpan={colSpan}
            className='text-muted-foreground py-8 text-center'
          >
            No records yet
          </TableCell>
        </TableRow>
      </TableBody>
    )
  }

  return (
    <TableBody className={className}>
      <TableRow>
        <TableCell colSpan={colSpan} className='py-10'>
          <div className='mx-auto max-w-md text-center'>
            <p className='text-muted-foreground text-sm'>
              {concept.what}
            </p>
            <p className='text-muted-foreground mt-2 text-xs'>
              {concept.when}
            </p>
            <Button asChild size='sm' className='mt-4'>
              <Link to={`/create/${entityName}`}>
                <Plus className='mr-1 h-4 w-4' />
                Create first {entityName.replace(/_/g, ' ')}
              </Link>
            </Button>
          </div>
        </TableCell>
      </TableRow>
    </TableBody>
  )
}

export { ENTITY_CONCEPTS }
export default EntityEmptyState
