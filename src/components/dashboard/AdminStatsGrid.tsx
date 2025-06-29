'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function AdminStatsGrid() {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Total Courses</CardTitle>
          <CardDescription>Published & Draft</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-brand-primary">0</div>
          <p className="text-sm text-foreground/60 mt-1">No courses yet</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Students</CardTitle>
          <CardDescription>Active learners</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-brand-secondary">0</div>
          <p className="text-sm text-foreground/60 mt-1">No students yet</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Completions</CardTitle>
          <CardDescription>Course completions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-gray-600">0</div>
          <p className="text-sm text-foreground/60 mt-1">No completions yet</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Certificates</CardTitle>
          <CardDescription>Issued certificates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-gray-600">0</div>
          <p className="text-sm text-foreground/60 mt-1">No certificates yet</p>
        </CardContent>
      </Card>
    </div>
  )
}