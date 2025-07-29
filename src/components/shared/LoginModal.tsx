'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
import { useAuth } from '@/contexts/AuthContext'
import { X } from 'lucide-react'

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
  initialTab?: 'login' | 'signup'
}

export default function LoginModal({ isOpen, onClose, initialTab = 'login' }: LoginModalProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState('student')
  const [rememberMe, setRememberMe] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState(initialTab)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const { refreshSession } = useAuth()

  const resetForm = () => {
    setEmail('')
    setPassword('')
    setConfirmPassword('')
    setFullName('')
    setRole('student')
    setRememberMe(false)
    setError('')
    setIsLoading(false)
    setActiveTab(initialTab)
    setShowPassword(false)
    setShowConfirmPassword(false)
  }

  const handleClose = () => {
    resetForm()
    onClose()
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
        credentials: 'include'
      })

      const data = await response.json()

      if (data.success) {
        console.log('[LoginModal] Login successful, refreshing session...')

        // Refresh the auth context session to get updated user data
        await refreshSession()

        console.log('[LoginModal] Session refreshed, closing modal...')

        // Close modal - AuthContext will handle redirection automatically
        handleClose()

        console.log('[LoginModal] Login process completed')
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
    if (!email || !password || !confirmPassword || !fullName) {
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
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          full_name: fullName,
          role
        }),
        credentials: 'include'
      })

      const data = await response.json()

      if (data.success) {
        // Refresh the auth context session to get updated user data
        await refreshSession()

        // Close modal - AuthContext will handle role-based redirection
        handleClose()
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

  const handleForgotPassword = () => {
    // TODO: Implement forgot password functionality
    alert('Passwort-Zurücksetzen-Funktion wird bald verfügbar sein.')
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-white border-0 shadow-2xl rounded-2xl p-0 overflow-hidden">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
          disabled={isLoading}
        >
          <X className="w-4 h-4 text-gray-600" />
        </button>

        {/* Header */}
        <DialogHeader className="px-8 pt-8 pb-6 text-center">
          <DialogTitle className="text-2xl font-bold text-gray-900 mb-2">
            Willkommen
          </DialogTitle>
          <DialogDescription className="text-gray-600 text-sm">
            Melden Sie sich an oder erstellen Sie ein neues Konto
          </DialogDescription>
        </DialogHeader>

        {/* Content */}
        <div className="px-8 pb-8">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'login' | 'signup')} className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-gray-100 rounded-xl p-1 mb-6">
              <TabsTrigger
                value="login"
                className="rounded-lg py-2.5 text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all"
              >
                Einloggen
              </TabsTrigger>
              <TabsTrigger
                value="signup"
                className="rounded-lg py-2.5 text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all"
              >
                Registrieren
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="space-y-5 mt-0">
              <form onSubmit={handleSignIn} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="login-email" className="text-sm font-medium text-gray-700">
                    Benutzername oder E-Mail
                  </Label>
                  <Input
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder=""
                    required
                    disabled={isLoading}
                    autoComplete="email"
                    className="h-12 rounded-xl border-gray-200 focus:border-brand-primary focus:ring-brand-primary/20 transition-colors"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="login-password" className="text-sm font-medium text-gray-700">
                    Passwort
                  </Label>
                  <Input
                    id="login-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder=""
                    required
                    disabled={isLoading}
                    autoComplete="current-password"
                    className="h-12 rounded-xl border-gray-200 focus:border-brand-primary focus:ring-brand-primary/20 transition-colors"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="remember-me"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                    disabled={isLoading}
                    className="border-gray-300 data-[state=checked]:bg-brand-primary data-[state=checked]:border-brand-primary"
                  />
                  <Label
                    htmlFor="remember-me"
                    className="text-sm text-gray-600 cursor-pointer"
                  >
                    Meine Eingaben speichern
                  </Label>
                </div>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-sm text-brand-primary hover:text-brand-primary/80 transition-colors"
                    disabled={isLoading}
                  >
                    Passwort vergessen? Hier klicken!
                  </button>
                </div>

                {error && (
                  <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-lg">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full h-12 bg-brand-primary hover:bg-brand-primary/90 text-white font-medium rounded-xl transition-colors shadow-sm"
                  disabled={isLoading}
                >
                  {isLoading ? 'Wird angemeldet...' : 'Einloggen'}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="space-y-5 mt-0">
              <form onSubmit={handleSignUp} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="signup-name" className="text-sm font-medium text-gray-700">
                    Vollständiger Name
                  </Label>
                  <Input
                    id="signup-name"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder=""
                    required
                    disabled={isLoading}
                    autoComplete="name"
                    className="h-12 rounded-xl border-gray-200 focus:border-brand-primary focus:ring-brand-primary/20 transition-colors"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-email" className="text-sm font-medium text-gray-700">
                    E-Mail-Adresse
                  </Label>
                  <Input
                    id="signup-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder=""
                    required
                    disabled={isLoading}
                    autoComplete="email"
                    className="h-12 rounded-xl border-gray-200 focus:border-brand-primary focus:ring-brand-primary/20 transition-colors"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-password" className="text-sm font-medium text-gray-700">
                    Passwort
                  </Label>
                  <div className="relative">
                    <Input
                      id="signup-password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder=""
                      required
                      disabled={isLoading}
                      autoComplete="new-password"
                      className="h-12 rounded-xl border-gray-200 focus:border-brand-primary focus:ring-brand-primary/20 transition-colors pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      disabled={isLoading}
                    >
                      {showPassword ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-confirm-password" className="text-sm font-medium text-gray-700">
                    Passwort bestätigen
                  </Label>
                  <div className="relative">
                    <Input
                      id="signup-confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder=""
                      required
                      disabled={isLoading}
                      autoComplete="new-password"
                      className="h-12 rounded-xl border-gray-200 focus:border-brand-primary focus:ring-brand-primary/20 transition-colors pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      disabled={isLoading}
                    >
                      {showConfirmPassword ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Role is automatically set to 'student' - Admin accounts can only be created by admin invitation */}

                {error && (
                  <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-lg">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full h-12 bg-brand-primary hover:bg-brand-primary/90 text-white font-medium rounded-xl transition-colors shadow-sm"
                  disabled={isLoading}
                >
                  {isLoading ? 'Konto wird erstellt...' : 'Konto erstellen'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  )
}