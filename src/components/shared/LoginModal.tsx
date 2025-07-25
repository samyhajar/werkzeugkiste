'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
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
}

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState('student')
  const [rememberMe, setRememberMe] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('login')

  const { refreshSession } = useAuth()

  const resetForm = () => {
    setEmail('')
    setPassword('')
    setFullName('')
    setRole('student')
    setRememberMe(false)
    setError('')
    setIsLoading(false)
    setActiveTab('login')
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
    if (!email || !password || !fullName) {
      setError('Alle Felder sind erforderlich')
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
        <div className="px-8 pt-8 pb-6 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Willkommen
          </h2>
          <p className="text-gray-600 text-sm">
            Melden Sie sich an oder erstellen Sie ein neues Konto
          </p>
        </div>

        {/* Content */}
        <div className="px-8 pb-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
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
                    className="h-12 rounded-xl border-gray-200 focus:border-brand-primary focus:ring-brand-primary/20 transition-colors"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-password" className="text-sm font-medium text-gray-700">
                    Passwort
                  </Label>
                  <Input
                    id="signup-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder=""
                    required
                    disabled={isLoading}
                    className="h-12 rounded-xl border-gray-200 focus:border-brand-primary focus:ring-brand-primary/20 transition-colors"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-role" className="text-sm font-medium text-gray-700">
                    Rolle
                  </Label>
                  <select
                    id="signup-role"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full h-12 px-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-colors text-gray-900"
                    disabled={isLoading}
                  >
                    <option value="student">Student</option>
                    <option value="admin">Administrator</option>
                  </select>
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