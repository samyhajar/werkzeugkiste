import type { Metadata } from 'next'
import UnsubscribeClient from '@/components/shared/UnsubscribeClient'

export const metadata: Metadata = {
  title: 'Abmeldung',
}

export default function UnsubscribePage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>
}) {
  // Read query values on server and pass to client
  const emailParam = searchParams?.email
  const emailFromUrl = Array.isArray(emailParam) ? emailParam[0] : emailParam

  return (
    <div className="min-h-[60vh] flex items-start sm:items-center justify-center">
      <UnsubscribeClient emailFromUrl={emailFromUrl} />
    </div>
  )
}
