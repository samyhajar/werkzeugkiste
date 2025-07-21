'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

export default function AdminSettingsPage() {
  // Platform branding state
  const [branding, setBranding] = useState({
    platformName: 'Werkzeugkiste Learning Platform',
    contactEmail: '',
    logoUrl: ''
  })

  // Note: Admin users will be loaded from backend when user management is implemented
  // const [admins] = useState<Array<{id: string, name: string, email: string}>>([])

  // Current admin user (you)
  const currentAdmin = {
    name: 'Admin User',
    email: 'admin@werkzeugkiste.com',
    role: 'Super Administrator'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Settings</h1>
          <p className="text-gray-600 mt-2">
            Manage platform settings, branding, and admin users
          </p>
        </div>
                 <Button className="bg-[#486681] hover:bg-[#3e5570] text-white shadow-sm">
           <span className="mr-2">⚙️</span>
           Platform Settings
         </Button>
      </div>

      <div className="max-w-4xl space-y-6">
        {/* Platform Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="shadow-md hover:shadow-lg transition-all duration-200 border-0 bg-gradient-to-br from-white to-[#486681]/5">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-[#486681]">Platform Status</CardTitle>
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-green-600 to-green-700 flex items-center justify-center">
                <span className="text-white text-sm">🟢</span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">Active</div>
              <p className="text-xs text-gray-500 mt-1">Platform is operational</p>
            </CardContent>
          </Card>

                     <Card className="shadow-md hover:shadow-lg transition-all duration-200 border-0 bg-gradient-to-br from-white to-purple-50/30">
             <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
               <CardTitle className="text-sm font-medium text-purple-700">Admin Users</CardTitle>
               <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-600 to-purple-700 flex items-center justify-center">
                 <span className="text-white text-sm">👥</span>
               </div>
             </CardHeader>
             <CardContent>
               <div className="text-2xl font-bold text-gray-900">1</div>
               <p className="text-xs text-gray-500 mt-1">Current administrator</p>
             </CardContent>
           </Card>

           <Card className="shadow-md hover:shadow-lg transition-all duration-200 border-0 bg-gradient-to-br from-white to-amber-50/30">
             <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
               <CardTitle className="text-sm font-medium text-amber-700">Configuration</CardTitle>
               <div className="h-8 w-8 rounded-full bg-gradient-to-br from-amber-600 to-amber-700 flex items-center justify-center">
                 <span className="text-white text-sm">⚙️</span>
               </div>
             </CardHeader>
             <CardContent>
               <div className="text-lg font-bold text-gray-900">Basic</div>
               <p className="text-xs text-gray-500 mt-1">Setup required</p>
             </CardContent>
           </Card>
        </div>

        {/* Branding Section */}
        <Card className="shadow-sm hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-white to-blue-50/30">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-[#486681] to-[#3e5570] flex items-center justify-center">
                <span className="text-white text-lg">🎨</span>
              </div>
              <div>
                <CardTitle className="text-xl text-[#486681]">Branding & Identity</CardTitle>
                <CardDescription className="text-sm">Platform name, logo, and contact information</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="platform-name" className="block text-sm font-semibold text-gray-700 mb-2">Platform Name</label>
                <Input
                  id="platform-name"
                  value={branding.platformName}
                  onChange={e => setBranding({ ...branding, platformName: e.target.value })}
                  className="border-[#486681]/20 focus:border-[#486681] focus:ring-[#486681]/20"
                />
                <p className="text-xs text-gray-500">This name appears in the header and emails</p>
              </div>
                             <div className="space-y-2">
                 <label htmlFor="contact-email" className="block text-sm font-semibold text-gray-700 mb-2">Contact Email</label>
                 <Input
                   id="contact-email"
                   type="email"
                   value={branding.contactEmail}
                   onChange={e => setBranding({ ...branding, contactEmail: e.target.value })}
                   placeholder="contact@yourplatform.com"
                   className="border-[#486681]/20 focus:border-[#486681] focus:ring-[#486681]/20"
                 />
                 <p className="text-xs text-gray-500">Support and admin contact email</p>
               </div>
            </div>
            <div className="space-y-2">
              <label htmlFor="logo-url" className="block text-sm font-semibold text-gray-700 mb-2">Logo URL</label>
              <Input
                id="logo-url"
                value={branding.logoUrl}
                onChange={e => setBranding({ ...branding, logoUrl: e.target.value })}
                placeholder="https://example.com/logo.png"
                className="border-[#486681]/20 focus:border-[#486681] focus:ring-[#486681]/20"
              />
              <p className="text-xs text-gray-500">URL to your platform logo (PNG, JPG, or SVG recommended)</p>
            </div>
            <div className="flex items-center justify-between p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-center gap-3">
                <span className="text-amber-600 text-lg">🚧</span>
                <div>
                  <p className="text-sm font-medium text-amber-800">Feature in Development</p>
                  <p className="text-xs text-amber-600">Branding changes will be available in the next update</p>
                </div>
              </div>
              <Button disabled className="bg-amber-200 text-amber-600">
                <span className="mr-1">💾</span>
                Save Changes
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Admin Users Section */}
        <Card className="shadow-sm hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-white to-purple-50/30">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-600 to-purple-700 flex items-center justify-center">
                <span className="text-white text-lg">👑</span>
              </div>
              <div>
                <CardTitle className="text-xl text-purple-700">Admin Users</CardTitle>
                <CardDescription className="text-sm">Manage administrator accounts and permissions</CardDescription>
              </div>
            </div>
          </CardHeader>
                     <CardContent className="space-y-4">
             {/* Current Admin User */}
             <div className="space-y-3">
               <div className="p-4 rounded-lg bg-white shadow-sm border border-gray-100">
                 <div className="flex items-center justify-between">
                   <div className="flex items-center gap-4">
                     <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#486681] to-[#3e5570] flex items-center justify-center flex-shrink-0">
                       <span className="text-white font-semibold text-sm">
                         {currentAdmin.name.charAt(0).toUpperCase()}
                       </span>
                     </div>
                     <div>
                       <div className="font-semibold text-gray-900">{currentAdmin.name}</div>
                       <div className="text-sm text-gray-500">{currentAdmin.email}</div>
                       <div className="flex items-center gap-2 mt-1">
                         <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[#486681]/10 text-[#486681]">
                           <span className="mr-1">👑</span>
                           {currentAdmin.role}
                         </span>
                         <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                           <span className="mr-1">🟢</span>
                           You
                         </span>
                       </div>
                     </div>
                   </div>
                   <div className="flex items-center gap-2">
                     <Button size="sm" variant="outline" disabled className="text-gray-400">
                       <span className="mr-1">✏️</span>
                       Edit Profile
                     </Button>
                   </div>
                 </div>
               </div>
            </div>
                         <div className="flex items-center justify-between p-4 bg-purple-50 border border-purple-200 rounded-lg">
               <div className="flex items-center gap-3">
                 <span className="text-purple-600 text-lg">🚧</span>
                 <div>
                   <p className="text-sm font-medium text-purple-800">Multi-Admin Support Coming Soon</p>
                   <p className="text-xs text-purple-600">Features to add and manage multiple administrators will be available in future updates</p>
                 </div>
               </div>
               <Button disabled className="bg-purple-200 text-purple-600">
                 <span className="mr-1">➕</span>
                 Add Administrator
               </Button>
             </div>
          </CardContent>
        </Card>

        {/* Security Section */}
        <Card className="shadow-sm hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-white to-red-50/30">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center">
                <span className="text-white text-lg">🔒</span>
              </div>
              <div>
                <CardTitle className="text-xl text-red-700">Security & Access Control</CardTitle>
                <CardDescription className="text-sm">Platform security settings and access controls</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Security Features List */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900 mb-3">Planned Security Features</h4>
                <div className="space-y-3">
                  {[
                    { icon: '🔐', feature: 'Two-Factor Authentication', status: 'planned' },
                    { icon: '🔑', feature: 'API Key Management', status: 'planned' },
                    { icon: '📊', feature: 'Access Logging', status: 'planned' },
                    { icon: '⚡', feature: 'Rate Limiting', status: 'planned' }
                  ].map((item, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm border border-gray-100">
                      <span className="text-lg">{item.icon}</span>
                      <div className="flex-1">
                        <span className="text-sm font-medium text-gray-900">{item.feature}</span>
                      </div>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                        Coming Soon
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Current Security Status */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900 mb-3">Current Status</h4>
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-green-600 text-lg">✅</span>
                    <span className="font-medium text-green-800">Basic Security Active</span>
                  </div>
                  <ul className="text-sm text-green-700 space-y-1 ml-6">
                    <li>• HTTPS encryption enabled</li>
                    <li>• Database security configured</li>
                    <li>• Authentication system active</li>
                    <li>• Role-based access control</li>
                  </ul>
                </div>

                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-amber-600 text-lg">🚧</span>
                    <span className="font-medium text-amber-800">Advanced Features Pending</span>
                  </div>
                  <p className="text-sm text-amber-700">
                    Enhanced security features are being developed and will be available in future updates.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}