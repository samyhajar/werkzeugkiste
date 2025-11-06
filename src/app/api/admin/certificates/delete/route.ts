import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server-client'
import type { Database } from '@/types/supabase'

type Profile = Database['public']['Tables']['profiles']['Row']
type Certificate = Pick<Database['public']['Tables']['certificates']['Row'], 'pdf_url'>

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check if user is authenticated and is admin
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is admin using profiles table
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const profileData = profile as Pick<Profile, 'role'> | null

    if (profileError || !profileData || profileData.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      )
    }

    const { user_id, module_id } = await request.json()

    if (!user_id || !module_id) {
      return NextResponse.json(
        { success: false, error: 'user_id and module_id are required' },
        { status: 400 }
      )
    }

    // Get the certificate to find the file URL
    const { data: certificate, error: fetchError } = await supabase
      .from('certificates')
      .select('pdf_url')
      .eq('user_id', user_id)
      .eq('module_id', module_id)
      .single()

    const certificateData = certificate as Certificate | null

    if (fetchError) {
      console.error('Error fetching certificate:', fetchError)
      return NextResponse.json(
        { success: false, error: 'Certificate not found' },
        { status: 404 }
      )
    }

    // Delete the file from storage if it exists
    if (certificateData?.pdf_url) {
      const { error: storageError } = await supabase.storage
        .from('certificates')
        .remove([certificateData.pdf_url])

      if (storageError) {
        console.error('Error deleting file from storage:', storageError)
        // Continue with database deletion even if storage deletion fails
      }
    }

    // Delete the certificate record from database
    const { error: deleteError } = await supabase
      .from('certificates')
      .delete()
      .eq('user_id', user_id)
      .eq('module_id', module_id)

    if (deleteError) {
      console.error('Error deleting certificate record:', deleteError)
      return NextResponse.json(
        { success: false, error: 'Failed to delete certificate' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Certificate deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting certificate:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
