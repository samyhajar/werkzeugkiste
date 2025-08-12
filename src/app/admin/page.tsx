import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server-client'
import { Card, CardContent } from '@/components/ui/card'
import {
  Users,
  BookOpen,
  Award,
  Activity,
  HelpCircle,
  TrendingUp,
  CheckCircle,
} from 'lucide-react'

// Force dynamic rendering to prevent static generation issues
// Keep default rendering; no force-dynamic to avoid unnecessary reload behavior

interface DashboardStats {
  totalUsers: number
  totalModules: number
  totalCourses: number
  totalLessons: number
  totalQuizzes: number
  totalCertificates: number
  recentActivity: Array<{
    id: string
    type: string
    description: string
    timestamp: string
    user?: string
  }>
  userGrowth: {
    current: number
    previous: number
    percentage: number
  }
  completionRates: {
    modules: number
    courses: number
    lessons: number
  }
}

export default async function AdminDashboard() {
  const supabase = await createClient()

  // Check if user is authenticated
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/')
  }

  // Check if user is admin using profiles table
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profileError || !profile || profile.role !== 'admin') {
    redirect('/')
  }

  // Fetch dashboard data directly from Supabase
  const [
    { data: users, error: _usersError },
    { data: modules, error: _modulesError },
    { data: courses, error: _coursesError },
    { data: lessons, error: _lessonsError },
    { data: quizzes, error: _quizzesError },
    { data: certificates, error: _certificatesError },
  ] = await Promise.all([
    supabase.from('profiles').select('id').eq('role', 'student'),
    supabase.from('modules').select('id'),
    supabase.from('courses').select('id'),
    supabase.from('lessons').select('id'),
    supabase.from('enhanced_quizzes').select('id'),
    supabase.from('certificates').select('id'),
  ])

  // Get recent activities
  const { data: lessonActivities } = await supabase
    .from('lesson_progress')
    .select(`
      lesson_id,
      student_id,
      completed_at,
      profiles (
        full_name
      ),
      lessons (
        title
      )
    `)
    .not('completed_at', 'is', null)
    .order('completed_at', { ascending: false })
    .limit(10)

  const { data: quizActivities } = await supabase
    .from('quiz_attempts')
    .select(`
      quiz_id,
      student_id,
      completed_at,
      profiles (
        full_name
      ),
      enhanced_quizzes (
        title
      )
    `)
    .not('completed_at', 'is', null)
    .order('completed_at', { ascending: false })
    .limit(10)

  // Calculate user growth (last 30 days vs previous 30 days)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const sixtyDaysAgo = new Date()
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)

  const { data: recentUsers } = await supabase
    .from('profiles')
    .select('created_at')
    .eq('role', 'student')
    .gte('created_at', thirtyDaysAgo.toISOString())

  const { data: previousUsers } = await supabase
    .from('profiles')
    .select('created_at')
    .eq('role', 'student')
    .gte('created_at', sixtyDaysAgo.toISOString())
    .lt('created_at', thirtyDaysAgo.toISOString())

  // Calculate completion rates
  const { data: completedLessons } = await supabase
    .from('lesson_progress')
    .select('id')
    .not('completed_at', 'is', null)

  // Build stats object
  const stats: DashboardStats = {
    totalUsers: users?.length || 0,
    totalModules: modules?.length || 0,
    totalCourses: courses?.length || 0,
    totalLessons: lessons?.length || 0,
    totalQuizzes: quizzes?.length || 0,
    totalCertificates: certificates?.length || 0,
    recentActivity: [
      ...(lessonActivities?.map((activity: any) => ({
        id: `lesson-${activity.lesson_id}-${activity.student_id}`,
        type: 'lesson_completed',
        description: `${activity.profiles?.full_name || 'Student'} completed "${activity.lessons?.title || 'Lesson'}"`,
        timestamp: activity.completed_at,
        user: activity.profiles?.full_name,
      })) || []),
      ...(quizActivities?.map((activity: any) => ({
        id: `quiz-${activity.quiz_id}-${activity.user_id}`,
        type: 'quiz_completed',
        description: `${activity.profiles?.full_name || 'Student'} completed "${activity.enhanced_quizzes?.title || 'Quiz'}"`,
        timestamp: activity.completed_at,
        user: activity.profiles?.full_name,
      })) || []),
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 10),
    userGrowth: {
      current: recentUsers?.length || 0,
      previous: previousUsers?.length || 0,
      percentage: previousUsers?.length ? Math.round(((recentUsers?.length || 0) - previousUsers.length) / previousUsers.length * 100) : 0,
    },
    completionRates: {
      modules: 0, // No module_progress table available
      courses: 0, // No course_progress table available
      lessons: lessons?.length ? Math.round((completedLessons?.length || 0) / lessons.length * 100) : 0,
    }
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user_registered':
        return <Users className="w-4 h-4" />
      case 'module_completed':
        return <Award className="w-4 h-4" />
      case 'lesson_started':
        return <BookOpen className="w-4 h-4" />
      case 'quiz_taken':
        return <HelpCircle className="w-4 h-4" />
      case 'lesson_completed':
        return <CheckCircle className="w-4 h-4" />
      case 'quiz_completed':
        return <Award className="w-4 h-4" />
      default:
        return <Activity className="w-4 h-4" />
    }
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'user_registered':
        return 'bg-blue-100 text-blue-600'
      case 'module_completed':
        return 'bg-green-100 text-green-600'
      case 'lesson_started':
        return 'bg-purple-100 text-purple-600'
      case 'quiz_taken':
        return 'bg-orange-100 text-orange-600'
      case 'lesson_completed':
        return 'bg-green-100 text-green-600'
      case 'quiz_completed':
        return 'bg-blue-100 text-blue-600'
      default:
        return 'bg-gray-100 text-gray-600'
    }
  }

  return (
    <div className="min-h-screen bg-[#6e859a]">
      <div className="px-4 sm:px-6 lg:px-8 xl:px-12 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Admin Dashboard</h1>
          <p className="text-white text-lg">Übersicht über die Plattform und Benutzeraktivitäten</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card className="bg-white shadow-lg border-0 rounded-xl overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Gesamte Benutzer</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalUsers}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg border-0 rounded-xl overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Module</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalModules}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg border-0 rounded-xl overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Kurse</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalCourses}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Award className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg border-0 rounded-xl overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Lektionen</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalLessons}</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg border-0 rounded-xl overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Quiz</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalQuizzes}</p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                  <HelpCircle className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg border-0 rounded-xl overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Zertifikate</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalCertificates}</p>
                </div>
                <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                  <Award className="w-6 h-6 text-indigo-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Growth and Completion Rates */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="bg-white shadow-lg border-0 rounded-xl overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Benutzerwachstum</h3>
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Letzte 30 Tage</span>
                  <span className="text-sm font-medium text-gray-900">{stats.userGrowth.current}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Vorherige 30 Tage</span>
                  <span className="text-sm font-medium text-gray-900">{stats.userGrowth.previous}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Wachstum</span>
                  <span className={`text-sm font-medium ${stats.userGrowth.percentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {stats.userGrowth.percentage >= 0 ? '+' : ''}{stats.userGrowth.percentage}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg border-0 rounded-xl overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Abschlussraten</h3>
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Module</span>
                  <span className="text-sm font-medium text-gray-900">{stats.completionRates.modules}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Kurse</span>
                  <span className="text-sm font-medium text-gray-900">{stats.completionRates.courses}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Lektionen</span>
                  <span className="text-sm font-medium text-gray-900">{stats.completionRates.lessons}%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="bg-white shadow-lg border-0 rounded-xl overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Letzte Aktivitäten</h3>
              <Activity className="w-5 h-5 text-gray-600" />
            </div>
            <div className="space-y-4">
              {stats.recentActivity.length > 0 ? (
                stats.recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className={`p-2 rounded-full ${getActivityColor(activity.type)}`}>
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(activity.timestamp).toLocaleDateString('de-DE', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">Keine Aktivitäten verfügbar</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
