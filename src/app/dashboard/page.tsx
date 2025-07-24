'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Award, BookOpen, CheckCircle, TrendingUp, User, Calendar } from 'lucide-react'

interface DashboardStats {
  totalModules: number
  completedModules: number
  totalLessons: number
  completedLessons: number
  certificates: number
  progressPercentage: number
}

interface RecentActivity {
  id: string
  type: 'lesson_completed' | 'module_completed' | 'certificate_earned'
  title: string
  date: string
  description: string
}

export default function StudentDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalModules: 0,
    completedModules: 0,
    totalLessons: 0,
    completedLessons: 0,
    certificates: 0,
    progressPercentage: 0,
  })
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)

      // Fetch progress data
      const progressResponse = await fetch('/api/student/progress')
      const progressData = progressResponse.ok ? await progressResponse.json() : { progress: [] }

      // Fetch certificates
      const certificatesResponse = await fetch('/api/student/certificates')
      const certificatesData = certificatesResponse.ok ? await certificatesResponse.json() : { certificates: [] }

      // Calculate stats
      const completedLessons = progressData.progress?.length || 0
      const certificates = certificatesData.certificates?.length || 0

      // For now, use placeholder data for modules
      const totalModules = 4 // We have 4 modules
      const completedModules = certificates // Each certificate represents a completed module
      const totalLessons = 20 // Approximate total lessons
      const progressPercentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0

      setStats({
        totalModules,
        completedModules,
        totalLessons,
        completedLessons,
        certificates,
        progressPercentage,
      })

      // Generate recent activity from progress data
      const activity: RecentActivity[] = []

      // Add recent lesson completions
      const recentLessons = progressData.progress?.slice(0, 5) || []
      recentLessons.forEach((lesson: any) => {
        activity.push({
          id: lesson.lesson_id,
          type: 'lesson_completed',
          title: lesson.lessons?.title || 'Unbekannte Lektion',
          date: lesson.completed_at,
          description: 'Lektion abgeschlossen',
        })
      })

      // Add recent certificates
      const recentCertificates = certificatesData.certificates?.slice(0, 3) || []
      recentCertificates.forEach((cert: any) => {
        activity.push({
          id: cert.id,
          type: 'certificate_earned',
          title: cert.courseName,
          date: cert.completedDate,
          description: 'Zertifikat erhalten',
        })
      })

      // Sort by date and take the most recent 8
      activity.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      setRecentActivity(activity.slice(0, 8))

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
              <span className="text-gray-600">Dashboard wird geladen...</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-[#486681] text-white py-8">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-3xl font-bold">Mein Dashboard</h1>
          <p className="text-blue-100 mt-2">Übersicht über Ihren Lernfortschritt</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Module abgeschlossen</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.completedModules} / {stats.totalModules}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Lektionen abgeschlossen</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.completedLessons} / {stats.totalLessons}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Zertifikate erhalten</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.certificates}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Award className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Gesamtfortschritt</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.progressPercentage}%</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Lernmodule
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Entdecken Sie unsere digitalen Lernmodule und verbessern Sie Ihre Kompetenzen.
              </p>
              <Link href="/">
                <Button className="w-full bg-[#486681] hover:bg-[#3e5570]">
                  Zu den Modulen
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5" />
                Zertifikate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Laden Sie Ihre erworbenen Zertifikate herunter und teilen Sie Ihre Erfolge.
              </p>
              <Link href="/certificates">
                <Button className="w-full bg-[#486681] hover:bg-[#3e5570]">
                  Meine Zertifikate
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Profil
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Verwalten Sie Ihr Profil und Ihre persönlichen Einstellungen.
              </p>
              <Button variant="outline" className="w-full">
                Profil bearbeiten
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Letzte Aktivitäten
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivity.length > 0 ? (
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center">
                      {activity.type === 'lesson_completed' && (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      )}
                      {activity.type === 'certificate_earned' && (
                        <Award className="w-5 h-5 text-purple-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{activity.title}</p>
                      <p className="text-sm text-gray-600">{activity.description}</p>
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(activity.date).toLocaleDateString('de-DE')}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">Noch keine Aktivitäten vorhanden.</p>
                <p className="text-sm text-gray-400 mt-2">
                  Beginnen Sie mit dem Lernen, um Aktivitäten zu sehen.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}