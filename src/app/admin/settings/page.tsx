'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

export default function AdminSettingsPage() {
  // Placeholder state for branding/contact info
  const [branding, setBranding] = useState({
    platformName: 'Digi+ Learning Platform',
    contactEmail: 'admin@example.com',
    logoUrl: ''
  })

  // Placeholder state for admin users
  const [admins] = useState([
    { id: '1', name: 'Alice Admin', email: 'alice@example.com' },
    { id: '2', name: 'Bob Boss', email: 'bob@example.com' }
  ])

  return (
    <div className="p-8">
      <div className="max-w-3xl space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Settings</h1>
          <p className="text-foreground/60">Manage platform settings, branding, and admin users.</p>
        </div>
        {/* Branding Section */}
        <Card>
          <CardHeader>
            <CardTitle>Branding</CardTitle>
            <CardDescription>Platform name, logo, and contact info</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Platform Name</label>
              <Input
                value={branding.platformName}
                onChange={e => setBranding({ ...branding, platformName: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Contact Email</label>
              <Input
                value={branding.contactEmail}
                onChange={e => setBranding({ ...branding, contactEmail: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Logo URL</label>
              <Input
                value={branding.logoUrl}
                onChange={e => setBranding({ ...branding, logoUrl: e.target.value })}
              />
            </div>
            <Button disabled>Save Changes (Coming Soon)</Button>
          </CardContent>
        </Card>
        {/* Admin Users Section */}
        <Card>
          <CardHeader>
            <CardTitle>Admin Users</CardTitle>
            <CardDescription>Manage admin access</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {admins.map(admin => (
                <li key={admin.id} className="flex items-center justify-between border-b pb-2">
                  <div>
                    <div className="font-medium">{admin.name}</div>
                    <div className="text-xs text-foreground/60">{admin.email}</div>
                  </div>
                  <Button size="sm" variant="outline" disabled>Remove</Button>
                </li>
              ))}
            </ul>
            <Button className="mt-4" disabled>Add Admin (Coming Soon)</Button>
          </CardContent>
        </Card>
        {/* Security Section */}
        <Card>
          <CardHeader>
            <CardTitle>Security & Access</CardTitle>
            <CardDescription>Platform security settings</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-foreground/60">Security settings and access controls will be available soon.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}