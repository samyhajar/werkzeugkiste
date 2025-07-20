'use client'

import { useState } from 'react'
import { ChevronRight } from 'lucide-react'
import LoginModal from './LoginModal'

export default function NewHereButton() {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsLoginModalOpen(true)}
        className="fixed top-1/3 right-6 bg-[#de0449] hover:bg-[#c5043e] text-white px-6 py-3 rounded-lg shadow-lg transition-all duration-200 flex items-center gap-2 font-medium z-50 hover:scale-105 hover:shadow-xl"
        style={{
          transform: 'translateY(-50%)',
        }}
      >
        <ChevronRight className="h-5 w-5" />
        Neu hier?
      </button>

      {/* Login Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />
    </>
  )
}