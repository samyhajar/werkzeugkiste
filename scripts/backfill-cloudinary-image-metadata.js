#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const { parse } = require('node-html-parser')
const { createClient } = require('@supabase/supabase-js')

const apply = process.argv.includes('--apply')
const rootDir = process.cwd()

function loadEnvFile(fileName) {
  const filePath = path.join(rootDir, fileName)
  if (!fs.existsSync(filePath)) return

  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/)
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) {
      continue
    }
    const index = trimmed.indexOf('=')
    const key = trimmed.slice(0, index).trim()
    const rawValue = trimmed.slice(index + 1).trim()
    if (!process.env[key]) {
      process.env[key] = rawValue.replace(/^["']|["']$/g, '')
    }
  }
}

loadEnvFile('.env.local')
loadEnvFile('.env')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const cloudName =
  process.env.CLOUDINARY_CLOUD_NAME ||
  process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
  'dqmofjqca'
const cloudinaryApiKey = process.env.CLOUDINARY_API_KEY
const cloudinaryApiSecret = process.env.CLOUDINARY_API_SECRET

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment.'
  )
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})
const discoveredUrlAlts = new Map()

function isCloudinaryUrl(url) {
  return typeof url === 'string' && url.includes('cloudinary.com')
}

function extractPublicId(imageUrl) {
  if (!isCloudinaryUrl(imageUrl)) return null

  try {
    const parsed = new URL(imageUrl)
    const uploadMarker = '/upload/'
    const uploadIndex = parsed.pathname.indexOf(uploadMarker)
    if (uploadIndex === -1) return null

    const afterUpload = parsed.pathname.slice(uploadIndex + uploadMarker.length)
    const pathParts = afterUpload.split('/').filter(Boolean)
    const versionIndex = pathParts.findIndex(part => /^v\d+$/.test(part))
    const publicIdParts =
      versionIndex >= 0 ? pathParts.slice(versionIndex + 1) : pathParts
    const publicIdPath = publicIdParts.join('/')
    return decodeURIComponent(publicIdPath).replace(/\.[^.]+$/, '') || null
  } catch {
    const match = imageUrl.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[^.]+)?$/)
    return match?.[1]?.replace(/\.[^.]+$/, '') || null
  }
}

function metadataColumns(prefix, metadata) {
  return {
    [`${prefix}_alt`]: metadata?.alt ?? null,
    [`${prefix}_public_id`]: metadata?.publicId ?? null,
    [`${prefix}_width`]: metadata?.width ?? null,
    [`${prefix}_height`]: metadata?.height ?? null,
    [`${prefix}_format`]: metadata?.format ?? null,
  }
}

function getAlt(data) {
  return data.context?.custom?.alt || data.context?.custom?.caption || null
}

async function fetchMetadata(imageUrl, fallbackAlt) {
  const publicId = extractPublicId(imageUrl)
  if (!publicId) return null

  const fallback = fallbackAlt?.trim() || null
  const toMetadata = data => ({
    alt: getAlt(data) || fallback,
    publicId: data.public_id || publicId,
    width: typeof data.width === 'number' ? data.width : null,
    height: typeof data.height === 'number' ? data.height : null,
    format: data.format || null,
  })

  if (cloudinaryApiKey && cloudinaryApiSecret) {
    try {
      const auth = Buffer.from(
        `${cloudinaryApiKey}:${cloudinaryApiSecret}`
      ).toString('base64')
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/resources/image/upload/${encodeURIComponent(publicId)}`,
        { headers: { Authorization: `Basic ${auth}` } }
      )
      if (response.ok) {
        return toMetadata(await response.json())
      }
      console.warn(`Admin API ${response.status} for ${publicId}`)
    } catch (error) {
      console.warn(`Admin API failed for ${publicId}: ${error.message}`)
    }
  }

  try {
    const response = await fetch(
      `https://res.cloudinary.com/${cloudName}/image/upload/fl_getinfo/${publicId}.json`
    )
    if (response.ok) {
      return toMetadata(await response.json())
    }
    console.warn(`fl_getinfo ${response.status} for ${publicId}`)
  } catch (error) {
    console.warn(`fl_getinfo failed for ${publicId}: ${error.message}`)
  }

  return {
    alt: fallback,
    publicId,
    width: null,
    height: null,
    format: null,
  }
}

async function updateImageRows({ table, urlColumn, prefix, titleColumn = 'title' }) {
  const { data, error } = await supabase
    .from(table)
    .select(`id, ${titleColumn}, ${urlColumn}`)
    .not(urlColumn, 'is', null)

  if (error) throw error

  let changed = 0
  for (const row of data || []) {
    const imageUrl = row[urlColumn]
    if (!isCloudinaryUrl(imageUrl)) continue

    const metadata = await fetchMetadata(imageUrl, row[titleColumn])
    const update = metadataColumns(prefix, metadata)
    if (metadata?.alt) {
      discoveredUrlAlts.set(imageUrl, metadata.alt)
    }
    changed += 1

    console.log(
      `${apply ? 'Updating' : 'Would update'} ${table}/${row.id}: ${metadata?.publicId || 'unknown'}`
    )

    if (apply) {
      const { error: updateError } = await supabase
        .from(table)
        .update(update)
        .eq('id', row.id)
      if (updateError) throw updateError
    }
  }

  return changed
}

function addMissingImageAlt(html, urlAltMap) {
  if (!html?.trim()) return { html, changed: false }

  const root = parse(html)
  let changed = false

  root.querySelectorAll('img').forEach(img => {
    const existingAlt = img.getAttribute('alt')
    if (existingAlt !== undefined && existingAlt !== null) return

    const src = img.getAttribute('src')
    if (!isCloudinaryUrl(src)) return

    const alt = urlAltMap.get(src) || ''
    img.setAttribute('alt', alt)
    changed = true
  })

  return { html: root.toString(), changed }
}

async function backfillHtmlTable({ table, column }) {
  const { data, error } = await supabase
    .from(table)
    .select(`id, ${column}`)
    .not(column, 'is', null)

  if (error) throw error

  let changed = 0
  for (const row of data || []) {
    const result = addMissingImageAlt(row[column], discoveredUrlAlts)
    if (!result.changed) continue

    changed += 1
    console.log(`${apply ? 'Updating' : 'Would update'} ${table}/${row.id} HTML`)

    if (apply) {
      const { error: updateError } = await supabase
        .from(table)
        .update({ [column]: result.html })
        .eq('id', row.id)
      if (updateError) throw updateError
    }
  }

  return changed
}

async function main() {
  console.log(
    apply
      ? 'Applying Cloudinary image metadata backfill...'
      : 'Dry run: pass --apply to update Supabase.'
  )

  const counts = []
  counts.push(
    await updateImageRows({
      table: 'modules',
      urlColumn: 'hero_image',
      prefix: 'hero_image',
    })
  )
  counts.push(
    await updateImageRows({
      table: 'courses',
      urlColumn: 'hero_image',
      prefix: 'hero_image',
    })
  )
  counts.push(
    await updateImageRows({
      table: 'digi_resources',
      urlColumn: 'logo_url',
      prefix: 'logo',
    })
  )
  counts.push(
    await updateImageRows({
      table: 'digi_resource_slides',
      urlColumn: 'image_url',
      prefix: 'image',
    })
  )

  const moduleHtml = await backfillHtmlTable({
    table: 'modules',
    column: 'presenter_materials_content',
  })
  const lessonHtml = await backfillHtmlTable({
    table: 'lessons',
    column: 'content',
  })

  console.log(
    `Done. Image rows: ${counts.reduce((sum, count) => sum + count, 0)}. HTML rows: ${
      moduleHtml + lessonHtml
    }.`
  )
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})
