'use client'

import { useState, forwardRef, useImperativeHandle } from 'react'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { CustomInput } from '@/components/ui/CustomInput'
import { X } from 'lucide-react'
import Image from 'next/image'

export interface ForgotPasswordModalRef {
  show: () => void
  hide: () => void
}

interface ForgotPasswordModalProps {
  onBackToLogin?: () => void
}

const ForgotPasswordModal = forwardRef<ForgotPasswordModalRef, ForgotPasswordModalProps>(({ onBackToLogin }, ref) => {
  const [isOpen, setIsOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useImperativeHandle(ref, () => ({
    show: () => {
      setIsOpen(true)
      resetForm()
    },
    hide: () => {
      setIsOpen(false)
      resetForm()
    }
  }))

  const resetForm = () => {
    setEmail('')
    setError('')
    setSuccess('')
    setIsLoading(false)
  }

  const handleClose = () => {
    setIsOpen(false)
    resetForm()
  }

  const handleBackToLogin = () => {
    handleClose()
    onBackToLogin?.()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) {
      setError('E-Mail-Adresse ist erforderlich')
      return
    }

    setIsLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email
        }),
      })

      const data = await response.json()

      if (data.success) {
        setSuccess(data.message)
        setEmail('')
        // Close modal after 3 seconds
        setTimeout(() => {
          handleClose()
        }, 3000)
      } else {
        setError(data.error || 'Ein Fehler ist aufgetreten')
      }
    } catch (error) {
      console.error('Forgot password error:', error)
      setError('Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) {
    return null
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent showCloseButton={false} className="sm:max-w-lg bg-white border-0 shadow-2xl rounded-3xl p-0 overflow-hidden z-50">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-6 right-6 z-10 p-2 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white transition-all duration-200 shadow-lg border border-gray-100"
          disabled={isLoading}
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>

        {/* Header with Gradient */}
        <div className="relative bg-gradient-to-br from-[#486681] via-[#5a7a95] to-[#486681] px-8 pt-12 pb-8">
          <div className="absolute inset-0 bg-black/5"></div>
          <div className="relative text-center">
            <div className="mx-auto mb-4 w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center p-1">
              <Image src="/Logo-digi-CMYK.png" alt="Logo" width={72} height={72} className="rounded-full" />
            </div>
            <DialogTitle className="text-3xl font-bold text-white mb-3">
              Passwort vergessen?
            </DialogTitle>
            <DialogDescription className="text-white/90 text-base font-medium">
              Geben Sie Ihre E-Mail-Adresse ein und wir senden Ihnen einen Link zum Zurücksetzen Ihres Passworts
            </DialogDescription>
          </div>
        </div>

        {/* Content */}
        <div className="px-8 py-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="forgot-email" className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                <svg className="w-4 h-4 text-[#486681]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                </svg>
                E-Mail-Adresse
              </Label>
              <CustomInput
                id="forgot-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ihre@email.com"
                required
                disabled={isLoading}
                autoComplete="email"
                autoFocus
              />
            </div>

            {error && (
              <div className="text-red-700 text-sm text-center bg-red-50 border border-red-200 p-4 rounded-2xl font-medium">
                {error}
              </div>
            )}

            {success && (
              <div className="text-green-700 text-sm text-center bg-green-50 border border-green-200 p-4 rounded-2xl font-medium">
                {success}
              </div>
            )}

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1 h-14 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-2xl font-semibold"
                onClick={handleClose}
                disabled={isLoading}
              >
                Abbrechen
              </Button>
              <Button
                type="submit"
                className="flex-1 h-14 bg-gradient-to-r from-[#486681] to-[#5a7a95] hover:from-[#3e5570] hover:to-[#4a6b7f] text-white font-semibold rounded-2xl transition-all duration-200 shadow-lg shadow-[#486681]/25 hover:shadow-xl hover:shadow-[#486681]/30"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Wird gesendet...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    E-Mail senden
                  </div>
                )}
              </Button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Erinnern Sie sich an Ihr Passwort?{' '}
              <button
                onClick={handleBackToLogin}
                className="text-[#486681] hover:text-[#3e5570] font-semibold transition-colors"
                disabled={isLoading}
              >
                Zurück zum Login
              </button>
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
})

ForgotPasswordModal.displayName = 'ForgotPasswordModal'

export default ForgotPasswordModal