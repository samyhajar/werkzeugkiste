'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function SignupPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to home page after a short delay
    const timeout = setTimeout(() => {
      router.replace('/')
    }, 3000)

    return () => clearTimeout(timeout)
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Registrierung
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Die Registrierung erfolgt jetzt über ein Modal auf der Startseite.
          </p>
          <p className="mt-4 text-sm text-gray-500">
            Sie werden automatisch zur Startseite weitergeleitet...
          </p>
        </div>
        <div className="mt-8">
          <button
            onClick={() => router.replace('/')}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-brand-secondary hover:bg-brand-secondary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Zur Startseite
          </button>
        </div>
      </div>
    </div>
  )
}