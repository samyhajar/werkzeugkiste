import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server-client'

export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient()

    // Simple test query
    const { data, error } = await supabase
      .from('certificates')
      .select('*')
      .limit(5)

    if (error) {
      console.error('Simple query error:', error)
      return NextResponse.json(
        { success: false, error: `Query error: ${error.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      count: data?.length || 0,
      data: data || [],
    })
  } catch (error) {
    console.error('Error in test simple API:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
