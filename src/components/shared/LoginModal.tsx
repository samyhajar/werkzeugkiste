'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getBrowserClient } from '@/lib/supabase/browser-client'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { X } from 'lucide-react'

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const [signInEmail, setSignInEmail] = useState('')
  const [signInPassword, setSignInPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [signUpEmail, setSignUpEmail] = useState('')
  const [signUpPassword, setSignUpPassword] = useState('')
  const [signUpConfirmPassword, setSignUpConfirmPassword] = useState('')
  const [signUpRole, setSignUpRole] = useState('student')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const router = useRouter()
  const supabase = getBrowserClient()

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setSignInEmail('')
      setSignInPassword('')
      setRememberMe(false)
      setSignUpEmail('')
      setSignUpPassword('')
      setSignUpConfirmPassword('')
      setSignUpRole('student')
      setError('')
      setSuccess('')
      setLoading(false)
    }
  }, [isOpen])

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: signInEmail, password: signInPassword }),
      })

      const data = await response.json()

      if (data.success) {
        setSuccess('Anmeldung erfolgreich!')

        // Refresh the client-side session to immediately reflect the login
        await supabase.auth.refreshSession()

        // Close modal and let the page update naturally
        setTimeout(() => {
          onClose()
          // Force a page refresh to ensure auth state is properly updated
          window.location.reload()
        }, 1000)
      } else {
        setError(data.error || 'Anmeldung fehlgeschlagen')
      }
    } catch (err) {
      setError('Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.')
    } finally {
      setLoading(false)
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (signUpPassword !== signUpConfirmPassword) {
      setError('Passwörter stimmen nicht überein')
      return
    }

    if (signUpPassword.length < 6) {
      setError('Passwort muss mindestens 6 Zeichen lang sein')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: signUpEmail,
          password: signUpPassword,
          role: signUpRole
        }),
      })

      const data = await response.json()

      if (data.success) {
        setSuccess('Registrierung erfolgreich! Sie können sich jetzt anmelden.')
        setSignUpEmail('')
        setSignUpPassword('')
        setSignUpConfirmPassword('')
        setSignUpRole('student')
      } else {
        setError(data.error || 'Registrierung fehlgeschlagen')
      }
    } catch (err) {
      setError('Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg p-0 bg-white">
        <div className="p-8">
          <DialogHeader className="mb-8">
            <DialogTitle className="text-3xl font-normal text-gray-700 text-left">
              Einloggen
            </DialogTitle>
            <DialogDescription className="text-gray-500 text-left">
              Melden Sie sich an oder erstellen Sie ein neues Konto
            </DialogDescription>
            <button
              onClick={onClose}
              className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
            >
              <X className="h-4 w-4" />
            </button>
          </DialogHeader>

          <Tabs defaultValue="signin" className="w-full">
            <TabsContent value="signin" className="space-y-6 mt-0">
              <form onSubmit={handleSignIn} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="signin-email" className="text-gray-600 font-normal">
                    Benutzername oder E-Mail
                  </Label>
                  <Input
                    id="signin-email"
                    type="email"
                    value={signInEmail}
                    onChange={(e) => setSignInEmail(e.target.value)}
                    required
                    disabled={loading}
                    className="border-0 border-b border-gray-300 rounded-none px-0 py-3 focus:border-gray-500 focus:ring-0 bg-transparent"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signin-password" className="text-gray-600 font-normal">
                    Passwort
                  </Label>
                  <Input
                    id="signin-password"
                    type="password"
                    value={signInPassword}
                    onChange={(e) => setSignInPassword(e.target.value)}
                    required
                    disabled={loading}
                    className="border-0 border-b border-gray-300 rounded-none px-0 py-3 focus:border-gray-500 focus:ring-0 bg-transparent"
                    autoComplete="current-password"
                  />
                </div>

                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="remember-me"
                    checked={rememberMe}
                    onCheckedChange={setRememberMe}
                    disabled={loading}
                  />
                  <Label htmlFor="remember-me" className="text-gray-600 font-normal">
                    Meine Eingaben speichern
                  </Label>
                </div>

                <div className="text-center">
                  <button
                    type="button"
                    className="text-gray-500 underline text-sm hover:text-gray-700"
                  >
                    Passwort vergessen? Hier klicken!
                  </button>
                </div>

                {error && (
                  <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">{error}</div>
                )}

                {success && (
                  <div className="text-green-600 text-sm bg-green-50 p-3 rounded-md font-medium">{success}</div>
                )}

                <Button
                  type="submit"
                  className="w-full bg-[#de0449] hover:bg-[#c5043e] text-white py-3 rounded-md font-normal text-lg"
                  disabled={loading}
                >
                  {loading ? 'Wird angemeldet...' : 'Einloggen'}
                </Button>

                <div className="text-center mt-6">
                  <span className="text-gray-600">Noch nicht Mitglied? </span>
                  <button
                    type="button"
                    onClick={() => {
                      // Switch to signup tab - we'll implement this if needed
                    }}
                    className="text-gray-600 underline hover:text-gray-800"
                  >
                    Jetzt Registrieren
                  </button>
                </div>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="space-y-4 mt-4">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-email">E-Mail</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    value={signUpEmail}
                    onChange={(e) => setSignUpEmail(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Passwort</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    value={signUpPassword}
                    onChange={(e) => setSignUpPassword(e.target.value)}
                    required
                    disabled={loading}
                    minLength={6}
                    autoComplete="new-password"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-confirm-password">Passwort bestätigen</Label>
                  <Input
                    id="signup-confirm-password"
                    type="password"
                    value={signUpConfirmPassword}
                    onChange={(e) => setSignUpConfirmPassword(e.target.value)}
                    required
                    disabled={loading}
                    autoComplete="new-password"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-role">Rolle</Label>
                  <Select value={signUpRole} onValueChange={setSignUpRole} disabled={loading}>
                    <SelectTrigger>
                      <SelectValue placeholder="Rolle auswählen" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="student">Student</SelectItem>
                      <SelectItem value="admin">Administrator</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {error && (
                  <div className="text-red-600 text-sm">{error}</div>
                )}
                {success && (
                  <div className="text-green-600 text-sm">{success}</div>
                )}
                <Button
                  type="submit"
                  className="w-full bg-brand-secondary hover:bg-brand-secondary-hover text-white"
                  disabled={loading}
                >
                  {loading ? 'Wird registriert...' : 'Registrieren'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  )
}