'use client'

import { useRef } from 'react'
import LoginModal, { LoginModalRef } from './LoginModal'

export default function RegistrationButton() {
  const loginModalRef = useRef<LoginModalRef>(null)

  return (
    <>
      {/* Floating "Neu hier?" Button */}
      <div className="fixed right-8 z-40" style={{ top: '252px' }}>
        <button
          onClick={() => loginModalRef.current?.show('signup', window.location.href)}
          className="bg-[#de0446] hover:bg-[#c5043e] text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 shadow-lg flex items-center gap-2"
          style={{
            padding: '12px 24px'
          }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          Neu hier?
        </button>
      </div>

      {/* Login Modal with signup tab active */}
      <LoginModal ref={loginModalRef} initialTab="signup" />
    </>
  )
}