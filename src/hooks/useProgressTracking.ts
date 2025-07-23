import { useState, useCallback } from 'react'
import { BaseApiResponse } from '@/types/api'

interface ProgressTrackingHook {
  markLessonComplete: (lessonId: string) => Promise<boolean>
  isMarking: boolean
  error: string | null
}

export const useProgressTracking = (): ProgressTrackingHook => {
  const [isMarking, setIsMarking] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const markLessonComplete = useCallback(
    async (lessonId: string): Promise<boolean> => {
      setIsMarking(true)
      setError(null)

      try {
        const response = await fetch('/api/student/progress', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            lesson_id: lessonId,
          }),
          credentials: 'include',
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data: BaseApiResponse = await response.json()

        if (data.success) {
          return true
        } else {
          throw new Error(data.error || 'Failed to mark lesson complete')
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to track progress'
        console.error('[ProgressTracking] Error:', errorMessage)
        setError(errorMessage)
        return false
      } finally {
        setIsMarking(false)
      }
    },
    []
  )

  return {
    markLessonComplete,
    isMarking,
    error,
  }
}

export default useProgressTracking
