// @ts-nocheck
/// <reference lib="deno.ns" />

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

serve(async req => {
  try {
    const { userId, moduleId } = await req.json()

    if (!userId || !moduleId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'userId and moduleId are required',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    const siteUrl =
      Deno.env.get('NEXT_PUBLIC_SITE_URL') ??
      Deno.env.get('SITE_URL') ??
      'https://werkzeugkiste.arbeitplus.at'
    const internalSecret =
      Deno.env.get('INTERNAL_API_SECRET') ?? 'local-dev-secret'

    console.log('🔹 Triggering regenerate-certificate for', {
      userId,
      moduleId,
    })
    console.log('🔹 Using site URL:', siteUrl)

    // Secure server-to-server call
    let res: Response
    try {
      res = await fetch(`${siteUrl}/api/admin/regenerate-certificate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        Authorization: `Bearer ${internalSecret}`,
        },
        body: JSON.stringify({ userId, moduleId }),
      })
    } catch (requestError) {
      console.error('generate-certificate: request to Next.js API failed', requestError)
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Failed to reach certificate API',
        }),
        {
          status: 502,
          headers: { 'Content-Type': 'application/json' },
        },
      )
    }

    // Parse and relay response
    const data = await res.json().catch(() => ({
      success: false,
      error: 'Invalid JSON response from target endpoint',
    }))

    if (!res.ok || !data?.success) {
      console.error('generate-certificate: API responded with error', {
        status: res.status,
        body: data,
      })
      return new Response(
        JSON.stringify({
          success: false,
          error: data?.error || 'Certificate API returned an error',
        }),
        {
          status: res.status,
          headers: { 'Content-Type': 'application/json' },
        },
      )
    }

    return new Response(JSON.stringify(data), {
      status: res.status,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('❌ Edge Function error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message ?? 'Internal error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
})
