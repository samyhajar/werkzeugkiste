'use client'
// Force dynamic rendering to prevent static generation issues
export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Trash2, UserPlus, Mail, Shield, User, ChevronUp, ChevronDown } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { de } from 'date-fns/locale'

interface UserProfile {
  id: string
  email: string | undefined
  role: string
  created_at: string
  last_sign_in_at: string | null
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [isInviteDialogOpen, setInviteDialogOpen] = useState(false)
  const [inviting, setInviting] = useState(false)
  const [newUser, setNewUser] = useState({
    email: '',
    role: 'student',
  })
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null)
  const [sortField, setSortField] = useState<'email' | 'role' | 'created_at'>('created_at')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/admin/users', {
        method: 'GET',
        credentials: 'include',
      })
      if (!response.ok) throw new Error(`API error: ${response.status}`)
      const data = await response.json()
      if (data.success) {
        setUsers(data.users || [])
      } else {
        throw new Error(data.error || 'Failed to fetch users')
      }
    } catch (err) {
      console.error('Error fetching users:', err)
      setError(err instanceof Error ? err.message : 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }, [])

  const inviteUser = useCallback(async () => {
    if (!newUser.email.trim()) return
    setInviting(true)
    setError(null)
    try {
      const response = await fetch('/api/admin/users/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(newUser),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to invite user')
      }

      setInviteDialogOpen(false)
      setNewUser({ email: '', role: 'student' })
      await fetchUsers()
    } catch (err) {
      console.error('Error inviting user:', err)
      setError(err instanceof Error ? err.message : 'Failed to invite user')
    } finally {
      setInviting(false)
    }
  }, [newUser, fetchUsers])

  const deleteUser = useCallback(async () => {
    if (!userToDelete) return
    setDeleting(true)
    setError(null)
    try {
      const response = await fetch(`/api/admin/users/delete-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ userId: userToDelete.id }),
      })

      const data = await response.json()

      if (!response.ok || data.error) {
        throw new Error(data.error || 'Failed to delete user')
      }

      setUsers(users.filter(u => u.id !== userToDelete.id))
      setDeleteDialogOpen(false)
      setUserToDelete(null)
    } catch (err) {
      console.error('Error deleting user:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete user')
    } finally {
      setDeleting(false)
    }
  }, [userToDelete, users])

  const handleSort = useCallback((field: 'email' | 'role' | 'created_at') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }, [sortField, sortDirection])

  const sortedUsers = useMemo(() => {
    return [...users].sort((a, b) => {
      const aValue = a[sortField] || ''
      const bValue = b[sortField] || ''
      if (sortDirection === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      }
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
    })
  }, [users, sortField, sortDirection])

  const filteredUsers = useMemo(() => {
    return sortedUsers.filter(user => {
      const matchesSearch = user.email?.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesRole = roleFilter === 'all' || user.role === roleFilter
      return matchesSearch && matchesRole
    })
  }, [sortedUsers, searchTerm, roleFilter])

  useEffect(() => {
    void fetchUsers()
  }, [fetchUsers])

  if (loading) return <div className="p-8">Loading...</div>
  if (error) return <div className="p-8 text-red-500">{error}</div>

  return (
    <div className="w-full px-8 py-8 space-y-8 bg-transparent">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Benutzerverwaltung</h1>
          <p className="text-white text-sm">Admins und Teilnehmer einladen und verwalten</p>
        </div>
        <button
          onClick={() => setInviteDialogOpen(true)}
          className="bg-[#486681] hover:bg-[#3e5570] text-white shadow-sm px-4 py-2 rounded-md flex items-center gap-2 transition-colors"
        >
          <UserPlus size={20} />
          Benutzer einladen
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            placeholder="Search by email..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full h-12 px-4 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#486681]/20 focus:border-[#486681] bg-white"
          />
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="w-[200px] h-12 px-4 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#486681]/20 focus:border-[#486681] bg-white"
          >
            <option value="all">Alle Rollen</option>
            <option value="admin">Admins</option>
            <option value="student">Teilnehmer</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gradient-to-r from-[#486681] to-[#3e5570]">
              <th className="px-6 py-4 text-left text-sm font-semibold text-white tracking-wider cursor-pointer" onClick={() => handleSort('email')}>E-Mail {sortField === 'email' && (sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />)}</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-white tracking-wider cursor-pointer" onClick={() => handleSort('role')}>Rolle {sortField === 'role' && (sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />)}</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-white tracking-wider cursor-pointer" onClick={() => handleSort('created_at')}>Erstellt am {sortField === 'created_at' && (sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />)}</th>
              <th className="px-6 py-4 text-center text-sm font-semibold text-white tracking-wider">Aktionen</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredUsers.map(user => (
              <tr key={user.id} className="bg-white hover:bg-gray-100 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">{user.email}</td>
                <td className="px-6 py-4 whitespace-nowrap">{user.role}</td>
                <td className="px-6 py-4 whitespace-nowrap">{formatDistanceToNow(new Date(user.created_at), { addSuffix: true, locale: de })}</td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <button
                    onClick={() => { setUserToDelete(user); setDeleteDialogOpen(true); }}
                    className="p-2 text-red-600 hover:bg-red-100 rounded-full transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Invite User Dialog */}
      <Dialog open={isInviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Benutzer einladen</DialogTitle>
            <DialogDescription>
              Geben Sie die E-Mail-Adresse und die Rolle für den neuen Benutzer ein.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex flex-col space-y-2">
              <label htmlFor="email">E-Mail</label>
              <input
                id="email"
                type="email"
                value={newUser.email}
                onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                className="w-full h-10 px-3 py-2 text-sm border border-gray-300 rounded-md"
              />
            </div>
            <div className="flex flex-col space-y-2">
              <label htmlFor="role">Rolle</label>
              <select
                id="role"
                value={newUser.role}
                onChange={e => setNewUser({ ...newUser, role: e.target.value })}
                className="w-full h-10 px-3 py-2 text-sm border border-gray-300 rounded-md"
              >
                <option value="student">Teilnehmer</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setInviteDialogOpen(false)}>Abbrechen</Button>
            <Button onClick={() => void inviteUser()} disabled={inviting}>
              {inviting ? 'Wird eingeladen...' : 'Einladung senden'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">Benutzer endgültig löschen</DialogTitle>
            <DialogDescription>
              Sind Sie absolut sicher, dass Sie den Benutzer <strong>{userToDelete?.email}</strong> löschen möchten?
              <br />
              <br />
              Diese Aktion ist unumkehrbar und wird alle zugehörigen Daten, einschließlich Zertifikate und Fortschritte, dauerhaft entfernen.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Abbrechen</Button>
            <Button variant="destructive" onClick={() => void deleteUser()} disabled={deleting}>
              {deleting ? 'Wird gelöscht...' : 'Ja, endgültig löschen'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}