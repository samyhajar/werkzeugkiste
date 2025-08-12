'use client'

import { Suspense, useEffect, useMemo, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import LoginModal, { type LoginModalRef } from '@/components/shared/LoginModal'

function LoginPageContent() {
  const searchParams = useSearchParams()
  const loginModalRef = useRef<LoginModalRef>(null)

  const redirectUrl = useMemo(() => {
    const redirect = searchParams.get('redirect')
    return redirect && redirect.length > 0 ? redirect : '/'
  }, [searchParams])

  useEffect(() => {
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

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-white p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#486681] mx-auto mb-4"></div>
          <p className="text-gray-600">Lade Anmeldeseite…</p>
        </div>
      </div>
    }>
      <LoginPageContent />
    </Suspense>
  )
}
