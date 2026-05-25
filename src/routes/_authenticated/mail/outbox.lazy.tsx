import { createLazyFileRoute } from '@tanstack/react-router'
import { NativeMailOutboxPage } from '@/features/communication/mail/native-mail'

export const Route = createLazyFileRoute('/_authenticated/mail/outbox')({
  component: NativeMailOutboxPage,
})
