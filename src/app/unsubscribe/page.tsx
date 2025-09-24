import type { Metadata } from 'next'
import UnsubscribeClient from '@/components/shared/UnsubscribeClient'

export const metadata: Metadata = {
  title: 'Abmeldung',
}

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  // Next.js 15 passes searchParams as a Promise
  const sp = await searchParams
  const emailParam = sp?.email
  const emailFromUrl = Array.isArray(emailParam) ? emailParam[0] : emailParam

  return (
    <div className="min-h-[60vh] flex items-start sm:items-center justify-center">
      <UnsubscribeClient emailFromUrl={emailFromUrl} />
    </div>
  )
}
