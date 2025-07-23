import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server-client'

export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient()

    // Fetch certificates with user and module information
    const { data: certificates, error } = await supabase
      .from('certificates')
      .select(
        `
        *,
        user:profiles(full_name),
        module:modules(title)
      `
      )
      .order('issued_at', { ascending: false })

    if (error) {
      console.error('Error fetching certificates:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch certificates' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      certificates: certificates || [],
      count: certificates?.length || 0,
    })
  } catch (error) {
    console.error('Error in debug certificates API:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
