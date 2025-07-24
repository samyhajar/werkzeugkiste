'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { FileText, HelpCircle, ChevronDown, ChevronUp, ChevronLeft, User, BarChart3, CheckCircle } from 'lucide-react'
import { getBrowserClient } from '@/lib/supabase/browser-client'
import { useProgressTracking } from '@/hooks/useProgressTracking'
import Link from 'next/link'

interface Course {
  id: string
  title: string
  description: string | null
  module_id: string
  order: number
  lessons: Lesson[]
  quizzes: Quiz[]
}

interface Lesson {
  id: string
  title: string
  content: string | null
  duration_minutes: number | null
  order: number
  course_id: string
  created_at: string
}

interface Quiz {
  id: string
  title: string
  description: string | null
  lesson_id: string | null
  course_id: string
  created_at: string
}

interface Module {
  id: string
  title: string
  description: string | null
  status: 'draft' | 'published'
  hero_image: string | null
  created_at: string
  updated_at: string
  courses: Course[]
}

interface QuizQuestion {
  id: string
  type: string
  question_html: string
  explanation_html?: string
  points: number
  quiz_answers?: QuizAnswer[]
}

interface QuizAnswer {
  id: string
  answer_html: string
  is_correct: boolean
  feedback_html?: string
}

interface QuizContentProps {
  quiz: Quiz
  onBack: () => void
}

function QuizContent({ quiz, onBack }: QuizContentProps) {
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [studentAnswers, setStudentAnswers] = useState<Record<string, string[]>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [results, setResults] = useState<any>(null)

  // Helper function to get question type label
  const getQuestionTypeLabel = (type: string, answers?: QuizAnswer[]) => {
    // Check if this is a True/False question by looking at the answers
    const isTrueFalse = answers && answers.length === 2 &&
      answers.some(a => a.answer_html === 'True') &&
      answers.some(a => a.answer_html === 'False')

    if (type === 'single' && isTrueFalse) {
      return 'Wahr/Falsch'
    }

    switch (type) {
      case 'single':
        return 'Einzelauswahl'
      case 'multiple':
        return 'Mehrfachauswahl'
      case 'true_false':
        return 'Wahr/Falsch'
      case 'free_text':
        return 'Freitext'
      case 'fill_blank':
        return 'Lückentext'
      case 'sorting':
        return 'Sortierung'
      case 'matching':
        return 'Zuordnung'
      case 'matrix':
        return 'Matrix'
      default:
        return type
    }
  }

  // Helper function to get input type
  const getInputType = (type: string) => {
    switch (type) {
      case 'multiple':
        return 'checkbox'
      case 'single':
      case 'true_false':
        return 'radio'
      default:
        return 'radio'
    }
  }

  // Handle answer changes
  const handleAnswerChange = (questionId: string, answerId: string, isChecked: boolean) => {
    setStudentAnswers(prev => {
      const currentAnswers = prev[questionId] || []

      if (getInputType(questions.find(q => q.id === questionId)?.type || 'single') === 'checkbox') {
        // Multiple choice - toggle answer
        if (isChecked) {
          return { ...prev, [questionId]: [...currentAnswers, answerId] }
        } else {
          return { ...prev, [questionId]: currentAnswers.filter(id => id !== answerId) }
        }
      } else {
        // Single choice - replace answer
        return { ...prev, [questionId]: isChecked ? [answerId] : [] }
      }
    })
  }

  // Handle quiz submission
  const handleSubmitQuiz = async () => {
    try {
      setSubmitting(true)

      const response = await fetch(`/api/quizzes/${quiz.id}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          answers: studentAnswers,
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setResults(data.results)
        setSubmitted(true)
      } else {
        setError(data.error || 'Failed to submit quiz')
      }
    } catch (err) {
      console.error('Error submitting quiz:', err)
      setError('Failed to submit quiz')
    } finally {
      setSubmitting(false)
    }
  }

  useEffect(() => {
    const fetchQuizContent = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/quizzes/${quiz.id}`)
        const data = await response.json()

                if (response.ok && data.success) {
          setQuestions(data.quiz.questions || [])
        } else {
          setError(data.error || 'Failed to load quiz content')
        }
      } catch (err) {
        console.error('Error fetching quiz content:', err)
        setError('Failed to load quiz content')
      } finally {
        setLoading(false)
      }
    }

    if (quiz.id) {
      fetchQuizContent()
    }
  }, [quiz.id])

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-12 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Quiz wird geladen...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-12 text-center">
        <div className="text-red-600 text-6xl mb-4">⚠️</div>
        <h2 className="text-xl font-semibold text-gray-600 mb-2">Fehler beim Laden</h2>
        <p className="text-gray-500 mb-6">{error}</p>
        <Button variant="outline" onClick={onBack}>
          Zurück zur Übersicht
        </Button>
      </div>
    )
  }

  // Show results if quiz was submitted
  if (submitted && results) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="p-8">
          <div className="text-center mb-6">
            <h3 className="text-2xl font-bold text-gray-800 mb-2">Quiz Ergebnisse</h3>
            <p className="text-gray-600">Quiz: {quiz.title}</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">{Math.round(results.score_percentage)}%</div>
                <div className="text-sm text-gray-600">Erreichte Punktzahl</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{results.earned_points}/{results.total_points}</div>
                <div className="text-sm text-gray-600">Punkte</div>
              </div>
            </div>

            <div className="mt-4 text-center">
              {results.passed ? (
                <div className="text-green-600 font-semibold">✅ Quiz bestanden!</div>
              ) : (
                <div className="text-red-600 font-semibold">❌ Quiz nicht bestanden</div>
              )}
            </div>
          </div>

          <div className="space-y-4 mb-6">
            <h4 className="font-semibold text-gray-800">Fragen Details:</h4>
            {results.question_results.map((result: any, index: number) => (
              <div key={index} className={`p-4 rounded-lg border ${
                result.is_correct ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Frage {index + 1}</span>
                  <span className={`text-sm font-medium ${
                    result.is_correct ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {result.is_correct ? '✅ Richtig' : '❌ Falsch'}
                  </span>
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  Punkte: {result.earned_points}/{result.points}
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-4 justify-center">
            <Button variant="outline" onClick={onBack}>
              Zurück zur Übersicht
            </Button>
            <Button onClick={() => {
              setSubmitted(false)
              setResults(null)
              setStudentAnswers({})
            }}>
              Quiz wiederholen
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Show quiz questions if they exist, otherwise show placeholder
  if (questions.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-12 text-center">
        <div className="text-blue-400 text-6xl mb-4">❓</div>
        <h2 className="text-xl font-semibold text-gray-600 mb-2">Quiz wird vorbereitet</h2>
        <p className="text-gray-500 mb-6">Dieses Quiz ist derzeit in Entwicklung und wird bald verfügbar sein.</p>
        <div className="flex gap-4 justify-center">
          <Button variant="outline" onClick={onBack}>
            Zurück zur Übersicht
          </Button>
          {quiz.lesson_id && (
            <Button onClick={() => {
              // This would need to be handled by the parent component
              onBack()
            }}>
              Zur Lektion
            </Button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      <div className="p-8">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Quiz: {quiz.title}</h3>
          {quiz.description && (
            <p className="text-gray-600">{quiz.description}</p>
          )}
        </div>

        <div className="space-y-6">
          {questions.map((question, index) => (
            <div key={question.id} className="border border-gray-200 rounded-lg p-6">
              <div className="mb-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-800 text-lg">
                    Frage {index + 1}
                  </h4>
                  <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                    question.type === 'multiple' ? 'bg-purple-100 text-purple-800' :
                    question.type === 'single' ? 'bg-blue-100 text-blue-800' :
                    question.type === 'true_false' ? 'bg-green-100 text-green-800' :
                    question.type === 'free_text' ? 'bg-orange-100 text-orange-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {getQuestionTypeLabel(question.type, question.quiz_answers)}
                  </span>
                </div>
                <div className="mb-4">
                  <p className="text-gray-800 text-base leading-relaxed">
                    {question.question_html}
                  </p>
                </div>
                {question.explanation_html && (
                  <div className="bg-blue-50 border-l-4 border-blue-400 p-3 mb-4">
                    <p className="text-sm text-blue-800">{question.explanation_html}</p>
                  </div>
                )}
              </div>



              {question.quiz_answers && question.quiz_answers.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm text-gray-600 mb-2">
                    {question.type === 'multiple'
                      ? 'Wählen Sie alle zutreffenden Antworten aus:'
                      : question.type === 'single'
                      ? 'Wählen Sie eine Antwort aus:'
                      : 'Antworten:'
                    }
                  </p>
                  {question.quiz_answers.map((answer, answerIndex) => (
                    <div key={answer.id} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <input
                        type={getInputType(question.type)}
                        name={`question-${question.id}`}
                        id={`answer-${answer.id}`}
                        checked={studentAnswers[question.id]?.includes(answer.id) || false}
                        onChange={(e) => handleAnswerChange(question.id, answer.id, e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <label htmlFor={`answer-${answer.id}`} className="flex-1 cursor-pointer text-gray-800">
                        <span className="font-medium text-gray-600 mr-2">{(answerIndex + 1).toString().padStart(2, '0')}.</span>
                        {answer.answer_html}
                      </label>
                    </div>
                  ))}
                </div>
              )}



              {/* Special handling for different question types */}
              {question.type === 'free_text' && (
                <div className="mt-4">
                  <textarea
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={4}
                    placeholder="Ihre Antwort hier..."
                  />
                </div>
              )}

              {question.type === 'fill_blank' && (
                <div className="mt-4">
                  <input
                    type="text"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Lücken füllen..."
                  />
                </div>
              )}

              {/* True/False questions are handled by the regular answer display above */}
            </div>
          ))}
        </div>

        <div className="mt-8 flex gap-4 justify-center">
          <Button variant="outline" onClick={onBack}>
            Zurück zur Übersicht
          </Button>
          <Button
            onClick={handleSubmitQuiz}
            disabled={submitting || Object.keys(studentAnswers).length === 0}
            className={submitting ? 'opacity-50 cursor-not-allowed' : ''}
          >
            {submitting ? 'Wird eingereicht...' : 'Quiz abschließen'}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function ModuleDetailPage() {
  const params = useParams()
  const router = useRouter()
  const moduleId = params.id as string

  const [module, setModule] = useState<Module | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedCourses, setExpandedCourses] = useState<Set<string>>(new Set())
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null)
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null)
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [lastRefetchTime, setLastRefetchTime] = useState(0)
  const [user, setUser] = useState<any>(null)
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set())
  const fetchInProgress = useRef(false)
  const lastFetchTime = useRef<number>(0)

  // Add progress tracking hook
  const { markLessonComplete, isMarking } = useProgressTracking()

  const fetchModule = useCallback(async () => {
    // Prevent duplicate requests
    if (fetchInProgress.current) {
      return
    }

    // Debounce requests
    const now = Date.now()
    if (now - lastFetchTime.current < 2000) {
      return
    }

    fetchInProgress.current = true
    lastFetchTime.current = now

    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/modules/${moduleId}`)
      const data = await response.json() as { success: boolean; module?: Module; error?: string }

      if (response.ok && data.success && data.module) {
        setModule(data.module)
      } else {
        setError(data.error || 'Failed to load module')
      }
    } catch (err) {
      console.error('Error fetching module:', err)
      setError('Failed to load module')
    } finally {
      setLoading(false)
      fetchInProgress.current = false
    }
  }, [moduleId])

  // Debounced refetch function to prevent too many API calls
  const _debouncedRefetch = useCallback(() => {
    const now = Date.now()
    if (now - lastRefetchTime > 1000 && !fetchInProgress.current) { // Only refetch if more than 1 second has passed
      setLastRefetchTime(now)
      void fetchModule()
    }
  }, [lastRefetchTime, fetchModule])

  useEffect(() => {
    if (moduleId) {
      void fetchModule()
      void fetchUserAndProgress()
    }
  }, [moduleId, fetchModule])

  // Fetch user and progress data
  const fetchUserAndProgress = useCallback(async () => {
    try {
      const supabase = getBrowserClient()
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      if (user && moduleId) {
        // Fetch completed lessons for this module
        const { data: progressData } = await supabase
          .from('lesson_progress')
          .select('lesson_id, completed_at')
          .eq('student_id', user.id)

        if (progressData) {
          const completedIds = new Set(progressData.map(p => p.lesson_id))
          setCompletedLessons(completedIds)
        }
      }
    } catch (error) {
      console.error('Error fetching user and progress:', error)
    }
  }, [moduleId])

  // Calculate progress percentage
  const getProgressPercentage = () => {
    if (!module) return 0
    const totalLessons = module.courses.reduce((total, course) => total + course.lessons.length, 0)
    if (totalLessons === 0) return 0
    return Math.round((completedLessons.size / totalLessons) * 100)
  }

  // Update progress display when completedLessons changes
  useEffect(() => {
    // This will trigger a re-render of the progress bar when completedLessons changes
  }, [completedLessons])

  useEffect(() => {
    if (moduleId) {
      void fetchModule()
      void fetchUserAndProgress()
    }
  }, [moduleId, fetchModule, fetchUserAndProgress])

  const toggleCourseExpansion = (courseId: string) => {
    setExpandedCourses(prev => {
      const newSet = new Set(prev)
      if (newSet.has(courseId)) {
        // If clicking on an already expanded course, close it
        newSet.delete(courseId)
      } else {
        // If clicking on a collapsed course, close all others and open this one
        newSet.clear()
        newSet.add(courseId)
      }
      return newSet
    })
  }

  const selectLesson = async (lesson: Lesson) => {
    setSelectedLesson(lesson)
    setSelectedQuiz(null) // Clear quiz selection
    // Find the course using the lesson's course_id
    const course = module?.courses.find(c => c.id === lesson.course_id)
    setSelectedCourse(course || null)

    // Mark lesson as complete when selected (if user is logged in and lesson not already completed)
    if (user && lesson.id && !completedLessons.has(lesson.id)) {
      try {
        const success = await markLessonComplete(lesson.id)
        if (success) {
          // Update local state to reflect completion
          setCompletedLessons(prev => new Set([...prev, lesson.id]))

          // Show success feedback (simple toast)
          const toast = document.createElement('div')
          toast.className = 'fixed top-20 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 transition-all duration-300'
          toast.textContent = `✓ "${lesson.title}" als abgeschlossen markiert`
          document.body.appendChild(toast)

          // Remove toast after 3 seconds
          setTimeout(() => {
            toast.style.opacity = '0'
            setTimeout(() => document.body.removeChild(toast), 300)
          }, 3000)

          // Check if module is completed after this lesson
          await checkModuleCompletion()
        }
      } catch (error) {
        console.error('Failed to mark lesson complete:', error)
        // Don't show error to user as this is a background operation
      }
    }
  }

  const selectQuiz = (quiz: Quiz) => {
    setSelectedQuiz(quiz)
    setSelectedLesson(null) // Clear lesson selection
    // Find the course using the quiz's course_id
    const course = module?.courses.find(c => c.id === quiz.course_id)
    setSelectedCourse(course || null)
  }

  const checkModuleCompletion = async () => {
    if (!user || !moduleId) return

    try {
      const response = await fetch('/api/student/check-module-completion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          moduleId: moduleId,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.certificatesGenerated > 0) {
          // Show module completion success message
          const successToast = document.createElement('div')
          successToast.className = 'fixed top-20 right-4 bg-blue-500 text-white px-6 py-4 rounded-lg shadow-lg z-50 transition-all duration-300 max-w-md'
          successToast.innerHTML = `
            <div class="flex items-center gap-3">
              <div class="text-2xl">🎉</div>
              <div>
                <div class="font-semibold">Modul abgeschlossen!</div>
                <div class="text-sm opacity-90">${data.message}</div>
                <div class="text-sm opacity-90 mt-1">${data.certificatesGenerated} Zertifikat(e) generiert!</div>
              </div>
            </div>
          `
          document.body.appendChild(successToast)

          // Remove toast after 5 seconds
          setTimeout(() => {
            successToast.style.opacity = '0'
            setTimeout(() => document.body.removeChild(successToast), 300)
          }, 5000)
        } else if (data.success && data.completedCourses > 0) {
          // Show progress message
          const progressToast = document.createElement('div')
          progressToast.className = 'fixed top-20 right-4 bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg z-50 transition-all duration-300 max-w-md'
          progressToast.innerHTML = `
            <div class="flex items-center gap-3">
              <div class="text-2xl">📚</div>
              <div>
                <div class="font-semibold">Fortschritt!</div>
                <div class="text-sm opacity-90">${data.completedCourses} von ${data.totalCourses} Kursen abgeschlossen</div>
              </div>
            </div>
          `
          document.body.appendChild(progressToast)

          // Remove toast after 3 seconds
          setTimeout(() => {
            progressToast.style.opacity = '0'
            setTimeout(() => document.body.removeChild(progressToast), 300)
          }, 3000)
        }
      }
    } catch (error) {
      console.error('Error checking module completion:', error)
    }
  }

  const getTotalLessons = () => {
    if (!module) return 0
    return module.courses.reduce((total, course) => total + course.lessons.length, 0)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#486681] mx-auto mb-4"></div>
          <p className="text-gray-600">Modul wird geladen...</p>
        </div>
      </div>
    )
  }

  if (error || !module) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">⚠️ Fehler</div>
          <p className="text-gray-600 mb-4">{error || 'Modul nicht gefunden'}</p>
          <Button onClick={() => router.push('/')}>
            Zurück zur Startseite
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-gray-50 flex overflow-hidden">
      {/* Continuous Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 h-16 flex items-center px-6">
        {/* Right: Progress Bar and User Info */}
        <div className="flex items-center gap-6 ml-auto">
          {/* Progress Bar */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#486681]" />
            </div>
            <div className="w-32">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-[#486681] h-2 rounded-full transition-all duration-300"
                  style={{ width: `${getProgressPercentage()}%` }}
                ></div>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {completedLessons.size} von {module ? module.courses.reduce((total, course) => total + course.lessons.length, 0) : 0} Lektionen
              </div>
            </div>
          </div>

          {/* User Info */}
          {user && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#486681] rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <div className="text-sm">
                <div className="font-medium text-gray-900">
                  {user.user_metadata?.full_name || user.email || 'Student'}
                </div>
                <div className="text-gray-500 text-xs">Student</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Back to Modules Link - Above Sidebar */}
      <div className="fixed top-16 left-0 w-96 bg-white border-b border-gray-200 z-40">
        <div className="p-4">
          <Link href="/" className="flex items-center gap-2 text-sm text-gray-600 hover:text-[#486681] transition-colors">
            <ChevronLeft className="w-4 h-4" />
            Zurück zu Modulen
          </Link>
        </div>
      </div>

      {/* Sidebar */}
      <aside className="w-96 bg-white border-r border-gray-200 flex flex-col shadow-sm sticky top-0 mt-28">

        {/* Module Name */}
        <div className="p-4 border-b border-gray-200 bg-white">
          <h1 className="font-bold text-xl text-gray-800">{module.title}</h1>
          <div className="flex items-center justify-between mt-2">
            <span className="text-gray-600 text-sm">{getTotalLessons()} Lektionen</span>
          </div>
        </div>

        {/* Course List Navigation */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 space-y-4">

            {module.courses.map((course, index) => (
              <div key={course.id} className="border border-gray-200 rounded-lg overflow-hidden">
                {/* Course Header */}
                <button
                  onClick={() => toggleCourseExpansion(course.id)}
                  className="w-full px-4 py-4 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 bg-[#de0449] text-white rounded-full flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </span>
                    <div className="text-left">
                      <h3 className="font-semibold text-gray-800 text-sm leading-tight">
                        {course.title}
                      </h3>
                    </div>
                  </div>
                  {expandedCourses.has(course.id) ? (
                    <ChevronUp className="h-5 w-5 text-gray-400 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-400 flex-shrink-0" />
                  )}
                </button>

                {/* Expanded Course Content */}
                {expandedCourses.has(course.id) && (
                  <div className="bg-white">
                    <div className="px-4 py-2 space-y-1">
                      {/* Lessons */}
                      {course.lessons
                        .sort((a, b) => (a.order || 0) - (b.order || 0))
                        .map((lesson, _lessonIndex) => {
                          const isCompleted = completedLessons.has(lesson.id)
                          return (
                            <div key={lesson.id}>
                              <button
                                onClick={() => selectLesson(lesson)}
                                disabled={isMarking}
                                className={`flex items-center gap-3 py-2 px-2 hover:bg-gray-50 rounded transition-colors group w-full text-left ${
                                  selectedLesson?.id === lesson.id ? 'bg-blue-50 text-blue-700' : ''
                                } ${isCompleted ? 'text-green-700' : ''} ${isMarking ? 'opacity-50 cursor-not-allowed' : ''}`}
                              >
                                {isCompleted ? (
                                  <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                                ) : (
                                  <FileText className="h-4 w-4 text-[#de0449] flex-shrink-0" />
                                )}
                                <span className={`font-medium text-sm group-hover:text-[#b8043a] flex-1 ${
                                  isCompleted ? 'text-green-700' : 'text-[#de0449]'
                                }`}>
                                  {lesson.title}
                                </span>
                                {isCompleted && (
                                  <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
                                    ✓ Abgeschlossen
                                  </span>
                                )}
                                {isMarking && selectedLesson?.id === lesson.id && (
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#486681]"></div>
                                )}
                              </button>

                              {/* Quizzes for this lesson */}
                              {course.quizzes
                                .filter(quiz => quiz.lesson_id === lesson.id)
                                .map((quiz) => (
                                  <button
                                    key={quiz.id}
                                    onClick={() => selectQuiz(quiz)}
                                    className={`flex items-center gap-3 py-2 px-2 ml-4 hover:bg-gray-50 rounded transition-colors group w-full text-left ${
                                      selectedQuiz?.id === quiz.id ? 'bg-blue-50 text-blue-700' : ''
                                    }`}
                                  >
                                    <HelpCircle className="h-4 w-4 text-[#de0449] flex-shrink-0" />
                                    <span className="text-[#de0449] font-medium text-sm group-hover:text-[#b8043a] flex-1">
                                      {quiz.title}
                                    </span>
                                  </button>
                                ))}
                            </div>
                          )
                        })}

                      {/* Course-level quizzes */}
                      {course.quizzes
                        .filter(quiz => !quiz.lesson_id)
                        .map((quiz) => (
                          <button
                            key={quiz.id}
                            onClick={() => selectQuiz(quiz)}
                            className={`flex items-center gap-3 py-2 px-2 hover:bg-gray-50 rounded transition-colors group w-full text-left ${
                              selectedQuiz?.id === quiz.id ? 'bg-blue-50 text-blue-700' : ''
                            }`}
                          >
                            <HelpCircle className="h-4 w-4 text-[#de0449] flex-shrink-0" />
                            <span className="text-[#de0449] font-medium text-sm group-hover:text-[#b8043a] flex-1">
                              {quiz.title}
                            </span>
                          </button>
                        ))}

                      {/* Empty state for courses with no content */}
                      {course.lessons.length === 0 && course.quizzes.length === 0 && (
                        <div className="px-2 py-4 text-center text-gray-500 text-sm">
                          Noch keine Inhalte verfügbar
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}


          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden mt-32">
        {selectedLesson ? (
          <div className="flex-1 overflow-y-auto">
            {/* Enhanced Lesson Header */}
            <div className="bg-white border-b border-gray-200 px-8 py-8">
              {/* Centered Breadcrumb */}
              <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mb-6">
                <Link
                  href="/"
                  className="hover:text-[#486681] transition-colors font-medium hover:underline"
                >
                  {module.title}
                </Link>
                <span className="text-gray-400">›</span>
                <span className="text-gray-600 font-medium">
                  {selectedCourse?.title || 'Kurs'}
                </span>
                <span className="text-gray-400">›</span>
                <span className="text-gray-800 font-semibold">
                  {selectedLesson.title}
                </span>
              </div>

              {/* Centered Lesson Title */}
              <div className="text-center mb-6">
                <h1 className="text-4xl font-bold text-gray-900 mb-4 leading-tight">
                  {selectedLesson.title}
                </h1>
                <div className="flex items-center justify-center gap-4 text-gray-600">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-[#486681] rounded-full"></span>
                    Lektion {selectedLesson.order}
                  </span>
                  <span className="text-gray-400">•</span>
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-[#486681] rounded-full"></span>
                    {selectedLesson.duration_minutes || 0} Min
                  </span>
                </div>
              </div>
            </div>

            {/* Enhanced Lesson Content */}
            <div className="px-8 py-8 overflow-y-auto bg-gray-50">
              {selectedLesson.content ? (
                <div className="max-w-4xl mx-auto">
                  <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                    <div className="p-8 prose prose-lg max-w-none">
                      <div
                        className="text-gray-800 leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: selectedLesson.content }}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="max-w-4xl mx-auto">
                  <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-12 text-center">
                    <div className="text-gray-400 text-6xl mb-4">📚</div>
                    <h2 className="text-xl font-semibold text-gray-600 mb-2">Kein Inhalt verfügbar</h2>
                    <p className="text-gray-500">Diese Lektion hat noch keinen Inhalt.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : selectedQuiz ? (
          <div className="flex-1 overflow-y-auto">
            {/* Enhanced Quiz Header */}
            <div className="bg-white border-b border-gray-200 px-8 py-8">
              {/* Centered Breadcrumb */}
              <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mb-6">
                <Link
                  href="/"
                  className="hover:text-[#486681] transition-colors font-medium hover:underline"
                >
                  {module.title}
                </Link>
                <span className="text-gray-400">›</span>
                <span className="text-gray-600 font-medium">
                  {selectedCourse?.title || 'Kurs'}
                </span>
                <span className="text-gray-400">›</span>
                <span className="text-gray-800 font-semibold">
                  {selectedQuiz.title}
                </span>
              </div>

              {/* Centered Quiz Title */}
              <div className="text-center mb-6">
                <h1 className="text-4xl font-bold text-gray-900 mb-4 leading-tight">
                  {selectedQuiz.title}
                </h1>
                <div className="flex items-center justify-center gap-4 text-gray-600">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                    Quiz
                  </span>
                  {selectedQuiz.description && (
                    <>
                      <span className="text-gray-400">•</span>
                      <span className="text-gray-600">
                        {selectedQuiz.description}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Enhanced Quiz Content */}
            <div className="px-8 py-8 overflow-y-auto bg-gray-50">
              <div className="max-w-4xl mx-auto">
                <QuizContent quiz={selectedQuiz} onBack={() => setSelectedQuiz(null)} />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="text-gray-400 text-6xl mb-4">📚</div>
              <h2 className="text-xl font-semibold text-gray-600 mb-2">Wähle eine Lektion oder ein Quiz aus</h2>
              <p className="text-gray-500">Klicke auf eine Lektion oder ein Quiz in der Seitenleiste, um den Inhalt anzuzeigen.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}