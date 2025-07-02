'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import SignInForm from '@/components/auth/SignInForm'
import SignUpForm from '@/components/auth/SignUpForm'

export default function Login() {
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error'>('error')

  const showMessage = (msg: string, type: 'success' | 'error' = 'error') => {
    setMessage(msg)
    setMessageType(type)
    setTimeout(() => setMessage(''), 5000)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#486681] p-4">
      <Card className="w-full max-w-md shadow-xl border border-[#486681]/20">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-[#486681]">
            Digi+ Learning Platform
          </CardTitle>
          <CardDescription>
            Sign in to your account or create a new one
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="space-y-4">
              <SignInForm onMessage={showMessage} />

              {message && (
                <div className={`text-sm p-3 rounded-md ${
                  messageType === 'success'
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                  {message}
                </div>
              )}
            </TabsContent>

            <TabsContent value="signup" className="space-y-4">
              <SignUpForm onMessage={showMessage} />

              {message && (
                <div className={`text-sm p-3 rounded-md ${
                  messageType === 'success'
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                  {message}
                </div>
              )}
            </TabsContent>
          </Tabs>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Google OAuth coming soon...
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}