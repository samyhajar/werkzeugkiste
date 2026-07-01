import { loadPublicModules } from '@/lib/modules/public-module-data'
import { NextRequest, NextResponse } from 'next/server'

const PUBLIC_CACHE_CONTROL = 'public, s-maxage=3600, stale-while-revalidate=86400'

export async function GET(_request: NextRequest) {
  try {
    const modulesWithCourses = await loadPublicModules()

    return NextResponse.json(
      {
        success: true,
        modules: modulesWithCourses,
      },
      {
        headers: {
          'Cache-Control': PUBLIC_CACHE_CONTROL,
          Vary: 'Accept-Encoding',
        },
      }
    )
  } catch (error) {
    console.error('Modules API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
