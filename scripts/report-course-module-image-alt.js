#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const { parse } = require('node-html-parser')
const { createClient } = require('@supabase/supabase-js')

const rootDir = process.cwd()
const reportDir = path.join(rootDir, 'reports')
const reportPath = path.join(reportDir, 'course-module-image-alt-dry-run.md')

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

const metadataCache = new Map()
const warnings = []

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

function getCloudinaryAlt(data) {
  return data.context?.custom?.alt || data.context?.custom?.caption || null
}

async function fetchCloudinaryMetadata(imageUrl) {
  if (!isCloudinaryUrl(imageUrl)) return null
  if (metadataCache.has(imageUrl)) return metadataCache.get(imageUrl)

  const publicId = extractPublicId(imageUrl)
  if (!publicId) {
    const result = { publicId: null, alt: null, width: null, height: null, format: null, status: 'unparseable-url' }
    metadataCache.set(imageUrl, result)
    return result
  }

  const toMetadata = (data, status) => ({
    publicId: data.public_id || publicId,
    alt: getCloudinaryAlt(data),
    width: typeof data.width === 'number' ? data.width : null,
    height: typeof data.height === 'number' ? data.height : null,
    format: data.format || null,
    status,
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
        const result = toMetadata(await response.json(), 'cloudinary-admin-api')
        metadataCache.set(imageUrl, result)
        return result
      }
    } catch {
      // Fall through to fl_getinfo below.
    }
  }

  try {
    const response = await fetch(
      `https://res.cloudinary.com/${cloudName}/image/upload/fl_getinfo/${publicId}.json`
    )
    if (response.ok) {
      const result = toMetadata(await response.json(), 'cloudinary-fl-getinfo')
      metadataCache.set(imageUrl, result)
      return result
    }
  } catch {
    // Report unavailable metadata below.
  }

  const result = {
    publicId,
    alt: null,
    width: null,
    height: null,
    format: null,
    status: 'metadata-unavailable',
  }
  metadataCache.set(imageUrl, result)
  return result
}

function markdownEscape(value) {
  return String(value ?? '')
    .replace(/\r?\n/g, ' ')
    .replace(/\|/g, '\\|')
    .trim()
}

function truncate(value, length = 72) {
  const text = String(value ?? '')
  return text.length > length ? `${text.slice(0, length - 1)}...` : text
}

function htmlImageRows({ ownerType, ownerId, ownerTitle, html }) {
  if (!html?.trim()) return []

  const root = parse(html)
  return root.querySelectorAll('img').map((img, index) => {
    const src = img.getAttribute('src') || ''
    const alt = img.getAttribute('alt')
    return {
      ownerType,
      ownerId,
      ownerTitle,
      index: index + 1,
      src,
      alt,
      hasAltAttribute: alt !== undefined && alt !== null,
      isCloudinary: isCloudinaryUrl(src),
    }
  })
}

async function getRows(table, select, notNullColumn) {
  let query = supabase.from(table).select(select)
  if (notNullColumn) {
    query = query.not(notNullColumn, 'is', null)
  }

  const { data, error } = await query
  if (error) throw error
  return data || []
}

async function reportHeroRows({ table, label }) {
  let rows
  let hasImageMetadataColumns = true
  try {
    rows = await getRows(
      table,
      'id, title, hero_image, hero_image_alt, hero_image_public_id, hero_image_width, hero_image_height, hero_image_format',
      'hero_image'
    )
  } catch (error) {
    if (error?.code !== '42703') throw error

    hasImageMetadataColumns = false
    warnings.push(
      `${table}: image metadata columns are not available in the connected database yet. Run the Supabase migration before applying any backfill.`
    )
    rows = await getRows(table, 'id, title, hero_image', 'hero_image')
  }

  const reportRows = []
  for (const row of rows) {
    if (!isCloudinaryUrl(row.hero_image)) continue

    const metadata = await fetchCloudinaryMetadata(row.hero_image)
    const adminAlt = row.hero_image_alt?.trim() || null
    reportRows.push({
      type: label,
      id: row.id,
      title: row.title,
      url: row.hero_image,
      currentAlt: adminAlt,
      cloudinaryAlt: metadata?.alt || null,
      wouldPopulateAlt: !adminAlt && metadata?.alt ? metadata.alt : null,
      needsManualAlt: !adminAlt && !metadata?.alt,
      currentTechnicalMetadata:
        hasImageMetadataColumns &&
        (Boolean(row.hero_image_public_id) ||
          Boolean(row.hero_image_width) ||
          Boolean(row.hero_image_height) ||
          Boolean(row.hero_image_format)),
      metadata,
    })
  }

  return reportRows
}

async function reportHtmlRows() {
  const modules = await getRows(
    'modules',
    'id, title, presenter_materials_content',
    'presenter_materials_content'
  )
  const lessons = await getRows('lessons', 'id, title, content', 'content')

  const images = [
    ...modules.flatMap(row =>
      htmlImageRows({
        ownerType: 'module.presenter_materials_content',
        ownerId: row.id,
        ownerTitle: row.title,
        html: row.presenter_materials_content,
      })
    ),
    ...lessons.flatMap(row =>
      htmlImageRows({
        ownerType: 'lesson.content',
        ownerId: row.id,
        ownerTitle: row.title,
        html: row.content,
      })
    ),
  ].filter(row => row.isCloudinary)

  for (const image of images) {
    image.metadata = await fetchCloudinaryMetadata(image.src)
    image.wouldPopulateAlt =
      !image.hasAltAttribute && image.metadata?.alt ? image.metadata.alt : null
    image.needsManualAlt = !image.hasAltAttribute && !image.metadata?.alt
  }

  return images
}

function buildReport({ moduleHeroes, courseHeroes, htmlImages }) {
  const heroRows = [...moduleHeroes, ...courseHeroes]
  const heroMissingAlt = heroRows.filter(row => !row.currentAlt)
  const heroWouldPopulateAlt = heroRows.filter(row => row.wouldPopulateAlt)
  const heroNeedsManualAlt = heroRows.filter(row => row.needsManualAlt)
  const htmlMissingAlt = htmlImages.filter(row => !row.hasAltAttribute)
  const htmlWouldPopulateAlt = htmlImages.filter(row => row.wouldPopulateAlt)
  const htmlNeedsManualAlt = htmlImages.filter(row => row.needsManualAlt)

  const lines = [
    '# Course/Module Image Alt Dry-Run Report',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    'Scope: modules, courses, lesson rich text, and module presenter rich text only. Digi-Sammlung and logos are excluded.',
    '',
    'No database writes were performed.',
    '',
  ]

  if (warnings.length > 0) {
    lines.push('## Warnings', '')
    for (const warning of warnings) {
      lines.push(`- ${warning}`)
    }
    lines.push('')
  }

  lines.push(
    '## Summary',
    '',
    `- Module hero Cloudinary images: ${moduleHeroes.length}`,
    `- Course hero Cloudinary images: ${courseHeroes.length}`,
    `- Hero images already having Supabase alt: ${heroRows.length - heroMissingAlt.length}`,
    `- Hero images missing Supabase alt: ${heroMissingAlt.length}`,
    `- Hero images where Cloudinary alt/caption could be used for one-time backfill: ${heroWouldPopulateAlt.length}`,
    `- Hero images needing manual alt text: ${heroNeedsManualAlt.length}`,
    `- Rich-text Cloudinary images: ${htmlImages.length}`,
    `- Rich-text images already having an alt attribute: ${htmlImages.length - htmlMissingAlt.length}`,
    `- Rich-text images missing alt attribute: ${htmlMissingAlt.length}`,
    `- Rich-text images where Cloudinary alt/caption could be inserted once: ${htmlWouldPopulateAlt.length}`,
    `- Rich-text images needing manual alt text or decorative alt="": ${htmlNeedsManualAlt.length}`,
    '',
    '## Hero Images Missing Supabase Alt',
    ''
  )

  if (heroMissingAlt.length === 0) {
    lines.push('None.', '')
  } else {
    lines.push('| Type | Title | ID | Cloudinary alt/caption | Suggested action | Public ID |')
    lines.push('| --- | --- | --- | --- | --- | --- |')
    for (const row of heroMissingAlt) {
      lines.push(
        `| ${markdownEscape(row.type)} | ${markdownEscape(row.title)} | ${row.id} | ${markdownEscape(row.cloudinaryAlt || '')} | ${
          row.wouldPopulateAlt ? 'Could backfill from Cloudinary once' : 'Needs manual alt'
        } | ${markdownEscape(row.metadata?.publicId || '')} |`
      )
    }
    lines.push('')
  }

  lines.push('## Rich-Text Images Missing Alt Attribute', '')

  if (htmlMissingAlt.length === 0) {
    lines.push('None.', '')
  } else {
    lines.push('| Location | Title | ID | Image # | Cloudinary alt/caption | Suggested action | URL |')
    lines.push('| --- | --- | --- | ---: | --- | --- | --- |')
    for (const row of htmlMissingAlt) {
      lines.push(
        `| ${markdownEscape(row.ownerType)} | ${markdownEscape(row.ownerTitle)} | ${row.ownerId} | ${row.index} | ${markdownEscape(row.metadata?.alt || '')} | ${
          row.wouldPopulateAlt ? 'Could insert from Cloudinary once' : 'Needs manual alt or decorative alt=""'
        } | ${markdownEscape(truncate(row.src))} |`
      )
    }
    lines.push('')
  }

  lines.push('## Hero Images With Existing Supabase Alt', '')
  const heroWithAlt = heroRows.filter(row => row.currentAlt)
  if (heroWithAlt.length === 0) {
    lines.push('None.', '')
  } else {
    lines.push('| Type | Title | ID | Supabase alt | Cloudinary alt/caption |')
    lines.push('| --- | --- | --- | --- | --- |')
    for (const row of heroWithAlt) {
      lines.push(
        `| ${markdownEscape(row.type)} | ${markdownEscape(row.title)} | ${row.id} | ${markdownEscape(row.currentAlt)} | ${markdownEscape(row.cloudinaryAlt || '')} |`
      )
    }
    lines.push('')
  }

  lines.push('## Notes', '')
  lines.push('- Cloudinary alt/caption is shown only as a possible one-time backfill source for existing content.')
  lines.push('- Future source of truth remains Werkzeugkiste/Supabase admin-entered alt text.')
  lines.push('- Empty hero alt should remain `null`; frontend/PDF rendering can fall back to the title.')
  lines.push('- Rich-text images with no meaningful description should get explicit `alt=""`.')
  lines.push('')

  return lines.join('\n')
}

async function main() {
  console.log('Creating dry-run report for course/module image alt text...')

  const [moduleHeroes, courseHeroes, htmlImages] = await Promise.all([
    reportHeroRows({ table: 'modules', label: 'module' }),
    reportHeroRows({ table: 'courses', label: 'course' }),
    reportHtmlRows(),
  ])

  const report = buildReport({ moduleHeroes, courseHeroes, htmlImages })
  fs.mkdirSync(reportDir, { recursive: true })
  fs.writeFileSync(reportPath, report)

  console.log(`Done. Report written to ${path.relative(rootDir, reportPath)}`)
  console.log('No database writes were performed.')
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})
