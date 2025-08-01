'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

/**
 * Component that cleans up the logout=true parameter from the URL
 * after successful logout to keep the URL clean
 */
export default function LogoutCleanup() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (searchParams.get('logout') === 'true') {
      // Clean up the logout parameter from the URL
      const newSearchParams = new URLSearchParams(searchParams.toString())
      newSearchParams.delete('logout')

      const newUrl = newSearchParams.toString()
        ? `/?${newSearchParams.toString()}`
        : '/'

      // Replace the current URL without adding to history
      router.replace(newUrl)

      console.log('[LogoutCleanup] Cleaned up logout parameter from URL')
    }
  }, [searchParams, router])

  return null // This component doesn't render anything
}