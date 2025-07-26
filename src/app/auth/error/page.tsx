'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function AuthErrorPage() {
  const router = useRouter()

  useEffect(() => {
    // Check for URL fragment parameters (after #)
    const hash = window.location.hash
    if (hash) {
      const params = new URLSearchParams(hash.substring(1)) // Remove the # symbol
      const error = params.get('error')
      const errorCode = params.get('error_code')
      const errorDescription = params.get('error_description')

      console.log('[Auth Error] Fragment params:', { error, errorCode, errorDescription })

      if (error || errorCode) {
        // Redirect to home page with error parameters in query string
        let redirectUrl = '/?'

        if (errorCode === 'otp_expired' || error === 'access_denied') {
          redirectUrl += 'error=email_link_expired'
        } else if (error) {
          redirectUrl += `error=${encodeURIComponent(error)}`
          if (errorDescription) {
            redirectUrl += `&error_description=${encodeURIComponent(errorDescription)}`
          }
        }

        console.log('[Auth Error] Redirecting to:', redirectUrl)
        router.push(redirectUrl)
        return
      }
    }

    // If no error in fragment, redirect to home
    router.push('/')
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#486682' }}>
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-xl text-center">
        <div className="flex justify-center mb-4">
          <Image
            src="/Logo-digi-CMYK.png"
            alt="Werkzeugkiste Logo"
            width={80}
            height={80}
            className="rounded-full"
          />
        </div>
        <div className="space-y-2">
          <div className="inline-flex items-center px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg">
            <div className="w-4 h-4 border-2 border-gray-300 border-t-[#3b5169] rounded-full animate-spin mr-2"></div>
            Verarbeitung...
          </div>
          <p className="text-sm text-gray-500">Sie werden weitergeleitet...</p>
        </div>
      </div>
    </div>
  )
}