import { getAltTextFromUrl, getAltTextsForUrls } from '@/lib/cloudinary'
import { NextRequest, NextResponse } from 'next/server'

/**
 * API route to fetch ALT text from Cloudinary
 *
 * GET /api/cloudinary/alt-text?url=<cloudinary-url>
 * Returns: { altText: string | null }
 *
 * POST /api/cloudinary/alt-text
 * Body: { urls: string[] }
 * Returns: { altTexts: { [url: string]: string } }
 */

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const url = searchParams.get('url')

  if (!url) {
    return NextResponse.json(
      { error: 'Missing url parameter' },
      { status: 400 }
    )
  }

  try {
    const altText = await getAltTextFromUrl(url)
    return NextResponse.json({ altText })
  } catch (error) {
    console.error('Error fetching ALT text:', error)
    return NextResponse.json(
      { error: 'Failed to fetch ALT text' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { urls } = body

    if (!urls || !Array.isArray(urls)) {
      return NextResponse.json(
        { error: 'Missing or invalid urls array' },
        { status: 400 }
      )
    }

    const altTextsMap = await getAltTextsForUrls(urls)

    // Convert Map to object for JSON response
    const altTexts: { [url: string]: string } = {}
    altTextsMap.forEach((value, key) => {
      altTexts[key] = value
    })

    return NextResponse.json({ altTexts })
  } catch (error) {
    console.error('Error fetching ALT texts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch ALT texts' },
      { status: 500 }
    )
  }
}
