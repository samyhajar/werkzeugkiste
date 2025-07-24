// Common API Response Types
export interface BaseApiResponse {
  success: boolean
  error?: string
}

// Analytics API
export interface AnalyticsData {
  overview: {
    totalCourses: number
    totalLessons: number
    totalQuizzes: number
    totalStudents: number
  }
  recent: {
    coursesThisWeek: number
    lessonsThisWeek: number
    quizzesThisWeek: number
    studentsThisWeek: number
    coursesThisMonth: number
    lessonsThisMonth: number
    quizzesThisMonth: number
    studentsThisMonth: number
  }
  trends: {
    courses: Array<{ id: string; created_at: string }>
    students: Array<{ id: string; created_at: string }>
  }
}

export interface AnalyticsResponse extends BaseApiResponse {
  analytics?: AnalyticsData
}

// Dashboard API
export interface DashboardStats {
  totalStudents: number
  totalCourses: number
  totalLessons: number
  totalQuizzes: number
}

export interface DashboardActivity {
  timestamp: string
  description: string
  type: 'course' | 'lesson' | 'quiz' | 'student'
}

export interface DashboardResponse extends BaseApiResponse {
  stats?: DashboardStats
  recentActivities?: DashboardActivity[]
}

// Courses API
export interface CourseData {
  id: string
  title: string
  description: string | null
  created_at: string | null
  updated_at: string | null
  hero_image: string | null
  module_id: string | null
  modules?: {
    id: string
    title: string
  }
}

export interface CoursesResponse extends BaseApiResponse {
  courses?: CourseData[]
}

export interface CourseResponse extends BaseApiResponse {
  course?: CourseData
}

// Modules API
export interface ModuleData {
  id: string
  title: string
  description: string | null
  image_path: string | null
  sort_order: number | null
}

export interface ModulesResponse extends BaseApiResponse {
  modules?: ModuleData[]
}

export interface ModuleResponse extends BaseApiResponse {
  module?: ModuleData
}

// Lessons API
export interface LessonData {
  id: string
  title: string
  content: string | null
  course_id: string
  sort_order: number | null
  created_at: string | null
}

export interface LessonsResponse extends BaseApiResponse {
  lessons?: LessonData[]
}

export interface LessonResponse extends BaseApiResponse {
  lesson?: LessonData
}

// Quizzes API
export interface QuizData {
  id: string
  title: string
  description: string | null
  pass_percentage: number
  quizable_id: string
  quizable_type: string
  created_at: string | null
}

export interface QuizzesResponse extends BaseApiResponse {
  quizzes?: QuizData[]
}

export interface QuizResponse extends BaseApiResponse {
  quiz?: QuizData
}

// Students API
export interface StudentData {
  id: string
  full_name: string | null
  email: string
  role: string | null
  created_at: string | null
}

export interface StudentsResponse extends BaseApiResponse {
  students?: StudentData[]
}

// Auth API
export interface AuthUser {
  id: string
  email: string
  role: string
  full_name: string
}

export interface AuthResponse extends BaseApiResponse {
  user?: AuthUser
}

// Generic form data type for request bodies
export interface RequestBody {
  [key: string]: unknown
}

// Helper function to safely parse JSON responses
export async function parseApiResponse<T extends BaseApiResponse>(
  response: Response
): Promise<T> {
  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`)
  }

  const data = (await response.json()) as T
  return data
}
