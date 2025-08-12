'use client'

import { useEffect, useMemo, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import LoginModal, { type LoginModalRef } from '@/components/shared/LoginModal'

export default function LoginPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const loginModalRef = useRef<LoginModalRef>(null)

  const redirectUrl = useMemo(() => {
    const redirect = searchParams.get('redirect')
    // Fallback to homepage if no redirect target provided
    return redirect && redirect.length > 0 ? redirect : '/'
  }, [searchParams])

  useEffect(() => {
    // Open the login modal immediately with the redirect target
    loginModalRef.current?.show('login', redirectUrl)
  }, [redirectUrl])

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-6">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-gray-800 mb-2">Anmeldung erforderlich</h1>
        <p className="text-gray-600 mb-6">Bitte melden Sie sich an, um fortzufahren.</p>
        <button
          onClick={() => loginModalRef.current?.show('login', redirectUrl)}
          className="inline-flex items-center justify-center rounded-lg px-5 py-3 bg-[#486681] text-white font-medium hover:bg-[#3e5570] transition-colors"
        >
          Anmelde-Dialog öffnen
        </button>
      </div>
      <LoginModal ref={loginModalRef} initialTab="login" />
    </div>
  )
}
