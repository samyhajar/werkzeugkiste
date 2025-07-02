import CreateCourseForm from '@/components/admin/CreateCourseForm'

export const metadata = {
  title: 'Create Course | Digi+ Admin',
}

export default function NewCoursePage() {
  return (
    <div className="min-h-screen p-6 flex flex-col items-center max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Create a New Course</h1>
      <CreateCourseForm />
    </div>
  )
}