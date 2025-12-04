'use client'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { CustomInput } from '@/components/ui/CustomInput'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getBrowserClient } from '@/lib/supabase/browser-client'
import { CheckCircle, X } from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { forwardRef, useImperativeHandle, useState } from 'react'

export interface LoginModalRef {
  show: (tab?: 'login' | 'signup', redirectUrl?: string) => void
  hide: () => void
}

interface LoginModalProps {
  initialTab?: 'login' | 'signup'
}

const LoginModal = forwardRef<LoginModalRef, LoginModalProps>(
  ({ initialTab = 'login' }, ref) => {
    const [isOpen, setIsOpen] = useState(false)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [firstName, setFirstName] = useState('')
    const [lastName, setLastName] = useState('')
    const [role, setRole] = useState('student')
    const [rememberMe, setRememberMe] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')
    const [activeTab, setActiveTab] = useState(initialTab)
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [redirectUrl, setRedirectUrl] = useState<string | undefined>()
    const [showEmailToast, setShowEmailToast] = useState(false)

    const router = useRouter()

    useImperativeHandle(ref, () => ({
      show: (tab = 'login', url) => {
        setActiveTab(tab)
        setRedirectUrl(url)
        setIsOpen(true)
      },
      hide: () => {
        setIsOpen(false)
        resetForm()
      },
    }))

    const resetForm = () => {
      setEmail('')
      setPassword('')
      setConfirmPassword('')
      setFirstName('')
      setLastName('')
      setRole('student')
      setRememberMe(false)
      setError('')
      setIsLoading(false)
      setActiveTab(initialTab)
      setShowPassword(false)
      setShowConfirmPassword(false)
      setRedirectUrl(undefined)
      setShowEmailToast(false)
    }

    const handleClose = () => {
      setIsOpen(false)
      resetForm()
    }

    const handleSignIn = async (e: React.FormEvent) => {
      e.preventDefault()
      if (!email || !password) {
        setError('E-Mail und Passwort sind erforderlich')
        return
      }

      setIsLoading(true)
      setError('')

      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password }),
          credentials: 'include',
        })

        const data: {
          success: boolean
          error?: string
          session?: { access_token: string; refresh_token: string }
        } = await response.json()

        if (data.success) {
          console.log(
            '[LoginModal] Login successful, setting client session...'
          )

          // Ensure the browser Supabase client has the session immediately
          if (data.session?.access_token && data.session?.refresh_token) {
            const supabase = getBrowserClient()
            await supabase.auth.setSession({
              access_token: data.session.access_token,
              refresh_token: data.session.refresh_token,
            })
          }

          // Close modal after session is set so UI updates can occur
          handleClose()

          // Navigate back to the intended page (AuthContext will not override for students)
          if (redirectUrl) {
            router.push(redirectUrl)
          }
        } else {
          setError(data.error || 'Anmeldung fehlgeschlagen')
        }
      } catch (error) {
        console.error('Login error:', error)
        setError('Anmeldung fehlgeschlagen. Bitte versuchen Sie es erneut.')
      } finally {
        setIsLoading(false)
      }
    }

    const handleSignUp = async (e: React.FormEvent) => {
      e.preventDefault()
      if (!email || !password || !confirmPassword || !firstName || !lastName) {
        setError('Alle Felder sind erforderlich')
        return
      }

      if (password !== confirmPassword) {
        setError('Passwörter stimmen nicht überein')
        return
      }

      if (password.length < 6) {
        setError('Passwort muss mindestens 6 Zeichen lang sein')
        return
      }

      setIsLoading(true)
      setError('')

      try {
        const fullName = `${firstName.trim()} ${lastName.trim()}`.trim()
        const response = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
            password,
            full_name: fullName,
            first_name: firstName,
            last_name: lastName,
            role,
          }),
          credentials: 'include',
        })

        const data = await response.json()

        if (data.success) {
          console.log(
            '[LoginModal] Signup successful, showing email confirmation toast...'
          )

          // Show email confirmation toast
          setShowEmailToast(true)

          // Hide toast after 5 seconds
          setTimeout(() => {
            setShowEmailToast(false)
          }, 5000)

          console.log('[LoginModal] Email confirmation toast shown')
        } else {
          setError(data.error || 'Registrierung fehlgeschlagen')
        }
      } catch (error) {
        console.error('Signup error:', error)
        setError('Registrierung fehlgeschlagen. Bitte versuchen Sie es erneut.')
      } finally {
        setIsLoading(false)
      }
    }

    const handleForgotPassword = (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsOpen(false) // Close login modal
      router.push('/auth/forgot-password')
    }

    if (!isOpen) {
      return null
    }

    return (
      <>
        <Dialog open={isOpen} onOpenChange={handleClose}>
          <DialogContent
            showCloseButton={false}
            className="sm:max-w-lg bg-white border-0 shadow-2xl rounded-3xl p-0 overflow-hidden z-50"
          >
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
                  <Image
                    src="/Logo-digi-CMYK.png"
                    alt="Logo"
                    width={72}
                    height={72}
                    className="rounded-full"
                  />
                </div>
                <DialogTitle className="text-3xl font-bold text-white mb-3">
                  Willkommen
                </DialogTitle>
                <DialogDescription className="text-white/90 text-base font-medium">
                  Melden Sie sich an oder erstellen Sie ein neues Konto
                </DialogDescription>
              </div>
            </div>

            {/* Content */}
            <div className="px-8 py-8">
              <Tabs
                value={activeTab}
                onValueChange={value =>
                  setActiveTab(value as 'login' | 'signup')
                }
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-2 gap-x-4 mb-8">
                  <TabsTrigger
                    value="login"
                    className="w-full justify-center rounded-xl py-3 px-4 text-sm font-semibold transition-all duration-200 border shadow-sm data-[state=active]:bg-gray-100 data-[state=active]:text-gray-800 data-[state=active]:border-gray-100 bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                  >
                    <span className="flex items-center gap-2">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                        />
                      </svg>
                      Einloggen
                    </span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="signup"
                    className="w-full justify-center rounded-xl py-3 px-4 text-sm font-semibold transition-all duration-200 border shadow-sm data-[state=active]:bg-gray-100 data-[state=active]:text-gray-800 data-[state=active]:border-gray-100 bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                  >
                    <span className="flex items-center gap-2">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                        />
                      </svg>
                      Registrieren
                    </span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="login" className="space-y-6 mt-0">
                  <form onSubmit={handleSignIn} className="space-y-6">
                    <div className="space-y-2">
                      <Label
                        htmlFor="login-email"
                        className="text-sm font-semibold text-gray-800 flex items-center gap-2"
                      >
                        <svg
                          className="w-4 h-4 text-[#486681]"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                          />
                        </svg>
                        E-Mail-Adresse
                      </Label>
                      <CustomInput
                        id="login-email"
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="ihre@email.com"
                        required
                        disabled={isLoading}
                        autoComplete="email"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="login-password"
                        className="text-sm font-semibold text-gray-800 flex items-center gap-2"
                      >
                        <svg
                          className="w-4 h-4 text-[#486681]"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                          />
                        </svg>
                        Passwort
                      </Label>
                      <div className="relative">
                        <CustomInput
                          id="login-password"
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={e => setPassword(e.target.value)}
                          placeholder="••••••••"
                          required
                          disabled={isLoading}
                          autoComplete="current-password"
                          className="pr-14"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-[#486681] transition-colors p-1 rounded-lg hover:bg-gray-100"
                          disabled={isLoading}
                          aria-label={
                            showPassword
                              ? 'Passwort verstecken'
                              : 'Passwort anzeigen'
                          }
                        >
                          {showPassword ? (
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                              />
                            </svg>
                          ) : (
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                              />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Checkbox
                          id="remember-me"
                          checked={rememberMe}
                          onCheckedChange={checked =>
                            setRememberMe(checked as boolean)
                          }
                          disabled={isLoading}
                          className="border-2 border-gray-300 data-[state=checked]:bg-[#486681] data-[state=checked]:border-[#486681] rounded-md"
                        />
                        <Label
                          htmlFor="remember-me"
                          className="text-sm text-gray-700 cursor-pointer font-medium"
                        >
                          Angemeldet bleiben
                        </Label>
                      </div>
                      <button
                        type="button"
                        onClick={handleForgotPassword}
                        className="text-sm text-[#486681] hover:text-[#3e5570] transition-colors font-semibold"
                        disabled={isLoading}
                      >
                        Passwort vergessen?
                      </button>
                    </div>

                    {error && (
                      <div className="text-red-700 text-sm text-center bg-red-50 border border-red-200 p-4 rounded-2xl font-medium">
                        {error}
                      </div>
                    )}

                    <Button
                      type="submit"
                      className="w-full h-14 bg-gradient-to-r from-[#486681] to-[#5a7a95] hover:from-[#3e5570] hover:to-[#4a6b7f] text-white font-semibold rounded-2xl transition-all duration-200 shadow-lg shadow-[#486681]/25 hover:shadow-xl hover:shadow-[#486681]/30 border-0 text-base"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <div className="flex items-center gap-3">
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          Wird angemeldet...
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                            />
                          </svg>
                          Einloggen
                        </div>
                      )}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="signup" className="space-y-6 mt-0">
                  {/* Email Confirmation Toast */}
                  {showEmailToast && (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
                      <div className="flex items-start">
                        <div className="flex-shrink-0">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        </div>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-green-800">
                            E-Mail-Bestätigung erforderlich
                          </h3>
                          <div className="mt-1 text-sm text-green-700">
                            <p>
                              Vielen Dank für Ihre Registrierung! Wir haben eine
                              Bestätigungs-E-Mail an{' '}
                              <span className="font-medium">{email}</span>{' '}
                              gesendet.
                            </p>
                            <p className="mt-1">
                              Bitte überprüfen Sie Ihr E-Mail-Postfach und
                              klicken Sie auf den Bestätigungslink, um Ihre
                              Registrierung abzuschließen.
                            </p>
                            <p className="mt-1 text-xs text-green-600">
                              Falls Sie die E-Mail nicht erhalten haben,
                              überprüfen Sie bitte auch Ihren Spam-Ordner.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <form onSubmit={handleSignUp} className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label
                          htmlFor="signup-first-name"
                          className="text-sm font-semibold text-gray-800 flex items-center gap-2"
                        >
                          <svg
                            className="w-4 h-4 text-[#486681]"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                            />
                          </svg>
                          Vorname
                        </Label>
                        <CustomInput
                          id="signup-first-name"
                          type="text"
                          value={firstName}
                          onChange={e => setFirstName(e.target.value)}
                          placeholder="Max"
                          required
                          disabled={isLoading}
                          autoComplete="given-name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label
                          htmlFor="signup-last-name"
                          className="text-sm font-semibold text-gray-800 flex items-center gap-2"
                        >
                          <svg
                            className="w-4 h-4 text-[#486681]"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                            />
                          </svg>
                          Nachname
                        </Label>
                        <CustomInput
                          id="signup-last-name"
                          type="text"
                          value={lastName}
                          onChange={e => setLastName(e.target.value)}
                          placeholder="Mustermann"
                          required
                          disabled={isLoading}
                          autoComplete="family-name"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="signup-email"
                        className="text-sm font-semibold text-gray-800 flex items-center gap-2"
                      >
                        <svg
                          className="w-4 h-4 text-[#486681]"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                          />
                        </svg>
                        E-Mail-Adresse
                      </Label>
                      <CustomInput
                        id="signup-email"
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="ihre@email.com"
                        required
                        disabled={isLoading}
                        autoComplete="email"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="signup-password"
                        className="text-sm font-semibold text-gray-800 flex items-center gap-2"
                      >
                        <svg
                          className="w-4 h-4 text-[#486681]"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                          />
                        </svg>
                        Passwort
                      </Label>
                      <div className="relative">
                        <CustomInput
                          id="signup-password"
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={e => setPassword(e.target.value)}
                          placeholder="••••••••"
                          required
                          disabled={isLoading}
                          autoComplete="new-password"
                          className="pr-14"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-[#486681] transition-colors p-1 rounded-lg hover:bg-gray-100"
                          disabled={isLoading}
                        >
                          {showPassword ? (
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                              />
                            </svg>
                          ) : (
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                              />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="signup-confirm-password"
                        className="text-sm font-semibold text-gray-800 flex items-center gap-2"
                      >
                        <svg
                          className="w-4 h-4 text-[#486681]"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        Passwort bestätigen
                      </Label>
                      <div className="relative">
                        <CustomInput
                          id="signup-confirm-password"
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={e => setConfirmPassword(e.target.value)}
                          placeholder="••••••••"
                          required
                          disabled={isLoading}
                          autoComplete="new-password"
                          className="pr-14"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowConfirmPassword(!showConfirmPassword)
                          }
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-[#486681] transition-colors p-1 rounded-lg hover:bg-gray-100"
                          disabled={isLoading}
                        >
                          {showConfirmPassword ? (
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                              />
                            </svg>
                          ) : (
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                              />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Role is automatically set to 'student' - Admin accounts can only be created by admin invitation */}

                    {error && (
                      <div className="text-red-700 text-sm text-center bg-red-50 border border-red-200 p-4 rounded-2xl font-medium">
                        {error}
                      </div>
                    )}

                    <Button
                      type="submit"
                      className="w-full h-14 bg-gradient-to-r from-[#486681] to-[#5a7a95] hover:from-[#3e5570] hover:to-[#4a6b7f] text-white font-semibold rounded-2xl transition-all duration-200 shadow-lg shadow-[#486681]/25 hover:shadow-xl hover:shadow-[#486681]/30 border-0 text-base"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <div className="flex items-center gap-3">
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          Konto wird erstellt...
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                            />
                          </svg>
                          Konto erstellen
                        </div>
                      )}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </div>
          </DialogContent>
        </Dialog>
      </>
    )
  }
)

LoginModal.displayName = 'LoginModal'

export default LoginModal
