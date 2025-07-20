'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { ChevronLeft, BookOpen, HelpCircle, Clock, CheckCircle, AlertCircle } from 'lucide-react'

interface Quiz {
  id: string
  title: string
  description: string | null
  lesson_id: string | null
  course_id: string
  created_at: string
}

interface Course {
  id: string
  title: string
  description: string | null
  status: 'draft' | 'published'
  admin_id: string | null
  created_at: string
  updated_at: string
}

// Sample quiz questions for demonstration
const sampleQuestions = [
  {
    id: 1,
    question: "Was bedeutet 'digital'?",
    options: [
      "Etwas, das mit Fingern zu tun hat",
      "Etwas, das elektronisch und computerbasiert ist",
      "Etwas, das analog ist",
      "Etwas, das ohne Strom funktioniert"
    ],
    correctAnswer: 1
  },
  {
    id: 2,
    question: "Welche Vorteile hat eine digitale Stoppuhr gegenüber einer analogen?",
    options: [
      "Sie funktioniert ohne Strom",
      "Sie ist ungenauer",
      "Sie kann hunderstel Sekunden messen",
      "Sie ist billiger"
    ],
    correctAnswer: 2
  },
  {
    id: 3,
    question: "Was brauchen Sie für die praktischen Teile des Kurses?",
    options: [
      "Nur ein Smartphone",
      "Nur einen Computer",
      "Smartphone, Computer, Internetverbindung und Neugier",
      "Nichts davon"
    ],
    correctAnswer: 2
  }
]

export default function QuizDetailPage() {
  const params = useParams()
  const router = useRouter()
  const quizId = params.id as string

  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [course, setCourse] = useState<Course | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: number]: number }>({})
  const [showResults, setShowResults] = useState(false)
  const [quizStarted, setQuizStarted] = useState(false)

  const fetchQuizDetails = async () => {
    setLoading(true)
    setError(null)

    try {
      // Get quiz details
      const quizzesResponse = await fetch(`/api/student/quizzes`, {
        method: 'GET',
        credentials: 'include',
      })

      if (!quizzesResponse.ok) {
        throw new Error(`API error: ${quizzesResponse.status}`)
      }

      const quizzesData = await quizzesResponse.json()

      if (quizzesData.success) {
        const foundQuiz = quizzesData.quizzes?.find((q: Quiz) => q.id === quizId)
        if (!foundQuiz) {
          throw new Error('Quiz not found')
        }
        setQuiz(foundQuiz)

        // Get course details
        const coursesResponse = await fetch(`/api/student/courses`, {
          method: 'GET',
          credentials: 'include',
        })

        if (coursesResponse.ok) {
          const coursesData = await coursesResponse.json()
          if (coursesData.success) {
            const foundCourse = coursesData.courses?.find((c: Course) => c.id === foundQuiz.course_id)
            if (foundCourse) {
              setCourse(foundCourse)
            }
          }
        }
      } else {
        throw new Error(quizzesData.error || 'Failed to fetch quiz')
      }
    } catch (err) {
      console.error('Error fetching quiz details:', err)
      setError(err instanceof Error ? err.message : 'Failed to load quiz')
    } finally {
      setLoading(false)
    }
  }

  const handleAnswerSelect = (questionIndex: number, answerIndex: number) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionIndex]: answerIndex
    }))
  }

  const handleNext = () => {
    if (currentQuestion < sampleQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
    }
  }

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1)
    }
  }

  const handleSubmitQuiz = () => {
    setShowResults(true)
  }

  const calculateScore = () => {
    let correct = 0
    sampleQuestions.forEach((question, index) => {
      if (selectedAnswers[index] === question.correctAnswer) {
        correct++
      }
    })
    return correct
  }

  useEffect(() => {
    if (quizId) {
      fetchQuizDetails()
    }
  }, [quizId])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
            <span className="text-gray-600">Quiz wird geladen...</span>
          </div>
        </div>
      </div>
    )
  }

  if (error || !quiz || !course) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-red-600 mb-2">Fehler beim Laden des Quiz</div>
            <div className="text-gray-500 text-sm mb-4">{error}</div>
            <Button onClick={() => fetchQuizDetails()}>
              Erneut versuchen
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (!quizStarted) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-[#486681] text-white py-6">
          <div className="max-w-4xl mx-auto px-4">
            <div className="flex items-center gap-2 text-sm text-blue-100 mb-2">
              <Link href="/modules" className="hover:text-white">Modul 1: Einstieg in die digitale Welt</Link>
              <span>›</span>
              <Link href={`/modules/${course.id}`} className="hover:text-white">{course.title}</Link>
              <span>›</span>
              <span>{quiz.title}</span>
            </div>
            <h1 className="text-2xl font-bold">{quiz.title}</h1>
          </div>
        </header>

        {/* Quiz Introduction */}
        <main className="max-w-4xl mx-auto px-4 py-8">
          <Card className="shadow-lg">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <HelpCircle className="w-8 h-8 text-blue-600" />
              </div>
              <CardTitle className="text-2xl">{quiz.title}</CardTitle>
              <CardDescription className="text-lg">
                {quiz.description || 'Testen Sie Ihr Wissen über die digitale Welt'}
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-6">
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="font-semibold text-gray-800">Fragen</div>
                  <div className="text-2xl font-bold text-blue-600">{sampleQuestions.length}</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="font-semibold text-gray-800">Geschätzte Zeit</div>
                  <div className="text-2xl font-bold text-blue-600">5 Min</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="font-semibold text-gray-800">Mindestpunktzahl</div>
                  <div className="text-2xl font-bold text-blue-600">70%</div>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg text-left">
                <h3 className="font-semibold text-blue-800 mb-2">Quiz-Hinweise:</h3>
                <ul className="text-blue-700 space-y-1 text-sm">
                  <li>• Lesen Sie jede Frage sorgfältig durch</li>
                  <li>• Sie können zwischen den Fragen vor und zurück navigieren</li>
                  <li>• Ihre Antworten werden automatisch gespeichert</li>
                  <li>• Sie können das Quiz nur einmal absolvieren</li>
                </ul>
              </div>

              <Button
                size="lg"
                className="px-8 py-3"
                onClick={() => setQuizStarted(true)}
              >
                Quiz starten
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  if (showResults) {
    const score = calculateScore()
    const percentage = Math.round((score / sampleQuestions.length) * 100)
    const passed = percentage >= 70

    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-[#486681] text-white py-6">
          <div className="max-w-4xl mx-auto px-4">
            <div className="flex items-center gap-2 text-sm text-blue-100 mb-2">
              <Link href="/modules" className="hover:text-white">Modul 1: Einstieg in die digitale Welt</Link>
              <span>›</span>
              <Link href={`/modules/${course.id}`} className="hover:text-white">{course.title}</Link>
              <span>›</span>
              <span>{quiz.title} - Ergebnisse</span>
            </div>
            <h1 className="text-2xl font-bold">Quiz Ergebnisse</h1>
          </div>
        </header>

        {/* Results */}
        <main className="max-w-4xl mx-auto px-4 py-8">
          <Card className="shadow-lg">
            <CardHeader className="text-center">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${
                passed ? 'bg-green-100' : 'bg-red-100'
              }`}>
                {passed ? (
                  <CheckCircle className="w-10 h-10 text-green-600" />
                ) : (
                  <AlertCircle className="w-10 h-10 text-red-600" />
                )}
              </div>
              <CardTitle className={`text-3xl ${passed ? 'text-green-600' : 'text-red-600'}`}>
                {passed ? 'Bestanden!' : 'Nicht bestanden'}
              </CardTitle>
              <CardDescription className="text-xl">
                Sie haben {score} von {sampleQuestions.length} Fragen richtig beantwortet ({percentage}%)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Score breakdown */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-4">Antworten im Detail:</h3>
                <div className="space-y-3">
                  {sampleQuestions.map((question, index) => {
                    const userAnswer = selectedAnswers[index]
                    const isCorrect = userAnswer === question.correctAnswer
                    return (
                      <div key={question.id} className="flex items-start gap-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                          isCorrect ? 'bg-green-100' : 'bg-red-100'
                        }`}>
                          {isCorrect ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-red-600" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-gray-800">
                            Frage {index + 1}: {question.question}
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            Ihre Antwort: {question.options[userAnswer] || 'Nicht beantwortet'}
                          </div>
                          {!isCorrect && (
                            <div className="text-sm text-green-600 mt-1">
                              Richtige Antwort: {question.options[question.correctAnswer]}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Navigation */}
              <div className="flex justify-center gap-4">
                <Button variant="outline" asChild>
                  <Link href={`/modules/${course.id}`}>
                    Zurück zum Kurs
                  </Link>
                </Button>
                {passed && (
                  <Button asChild>
                    <Link href="/modules">
                      Weiter zu den Modulen
                    </Link>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  const currentQ = sampleQuestions[currentQuestion]
  const progress = ((currentQuestion + 1) / sampleQuestions.length) * 100

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-[#486681] text-white py-4">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">{quiz.title}</h1>
              <div className="text-sm text-blue-100">
                Frage {currentQuestion + 1} von {sampleQuestions.length}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-blue-100">Fortschritt</div>
              <div className="text-lg font-bold">{Math.round(progress)}%</div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-blue-700 rounded-full h-2 mt-4">
            <div
              className="bg-white h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </header>

      {/* Quiz Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl">
              {currentQ.question}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {currentQ.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleAnswerSelect(currentQuestion, index)}
                  className={`w-full p-4 text-left rounded-lg border-2 transition-colors ${
                    selectedAnswers[currentQuestion] === index
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full border-2 ${
                      selectedAnswers[currentQuestion] === index
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-gray-300'
                    }`}>
                      {selectedAnswers[currentQuestion] === index && (
                        <div className="w-full h-full rounded-full bg-white scale-50" />
                      )}
                    </div>
                    <span>{option}</span>
                  </div>
                </button>
              ))}
            </div>

            {/* Navigation */}
            <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentQuestion === 0}
              >
                ← Vorherige
              </Button>

              <div className="text-sm text-gray-500">
                {Object.keys(selectedAnswers).length} von {sampleQuestions.length} beantwortet
              </div>

              {currentQuestion === sampleQuestions.length - 1 ? (
                <Button
                  onClick={handleSubmitQuiz}
                  disabled={Object.keys(selectedAnswers).length !== sampleQuestions.length}
                >
                  Quiz abschließen
                </Button>
              ) : (
                <Button
                  onClick={handleNext}
                  disabled={selectedAnswers[currentQuestion] === undefined}
                >
                  Nächste →
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
