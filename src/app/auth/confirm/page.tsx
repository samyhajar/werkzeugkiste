import type { Metadata } from 'next'
import ConfirmRegistration from './ConfirmRegistration'

export const metadata: Metadata = {
  title: 'E-Mail bestätigen',
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
}

export default function ConfirmPage() {
  return <ConfirmRegistration />
}
