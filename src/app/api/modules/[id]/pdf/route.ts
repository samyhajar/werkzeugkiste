import {
  getPublicModulePdfData,
  ModulePdfNotFoundError,
} from '@/lib/module-pdf/data'
import chromium from '@sparticuz/chromium'
import { spawn } from 'child_process'
import { randomUUID } from 'crypto'
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  unlinkSync,
} from 'fs'
import { NextRequest, NextResponse } from 'next/server'
import { homedir } from 'os'
import { join } from 'path'
import puppeteer, { type Browser } from 'puppeteer-core'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

interface PdfRouteParams {
  params: Promise<{ id: string }>
}

function slugifyFilename(value: string): string {
  const slug = value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return slug || 'modul'
}

function getContentDisposition(moduleTitle: string): string {
  const displayFilename = `Werkzeugkiste - ${moduleTitle}.pdf`
  const filename = `werkzeugkiste-${slugifyFilename(moduleTitle)}.pdf`
  const encodedFilename = encodeURIComponent(displayFilename)

  return `attachment; filename="${filename}"; filename*=UTF-8''${encodedFilename}`
}

function getRequestOrigin(request: NextRequest): string {
  const forwardedHost =
    request.headers.get('x-forwarded-host') || request.headers.get('host')
  const forwardedProto =
    request.headers.get('x-forwarded-proto') ||
    request.nextUrl.protocol.replace(':', '')

  if (forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`
  }

  return request.nextUrl.origin
}

async function createPdfBrowser(): Promise<Browser> {
  chromium.setGraphicsMode = false

  return puppeteer.launch({
    args: getChromiumArgs(),
    defaultViewport: getPdfViewport(),
    executablePath: await getChromiumExecutablePath(),
    headless: true,
  })
}

function getChromiumArgs(): string[] {
  return [...chromium.args, '--font-render-hinting=none', '--hide-scrollbars']
}

function getPdfViewport() {
  return {
    deviceScaleFactor: 1,
    height: 1754,
    width: 1240,
  }
}

async function getChromiumExecutablePath(): Promise<string> {
  if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    return process.env.PUPPETEER_EXECUTABLE_PATH
  }

  if (process.env.NODE_ENV !== 'production') {
    const localChromePath = getLocalChromeExecutablePath()
    if (localChromePath) {
      return localChromePath
    }
  }

  return chromium.executablePath()
}

function getWindowsChromeExecutable():
  | { powershellPath: string; wslPath: string }
  | null {
  const candidates = [
    {
      powershellPath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      wslPath: '/mnt/c/Program Files/Google/Chrome/Application/chrome.exe',
    },
    {
      powershellPath:
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
      wslPath: '/mnt/c/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    },
  ]

  return candidates.find(candidate => existsSync(candidate.wslPath)) ?? null
}

async function renderPdfBytes(printUrl: URL): Promise<Buffer> {
  const windowsChrome = getWindowsChromeExecutable()
  if (process.env.NODE_ENV !== 'production' && windowsChrome) {
    return renderPdfWithWindowsChrome(windowsChrome, printUrl)
  }

  let browser: Browser | null = null

  try {
    browser = await createPdfBrowser()
    const page = await browser.newPage()
    page.setDefaultNavigationTimeout(60000)

    const response = await page.goto(printUrl.toString(), {
      timeout: 60000,
      waitUntil: 'networkidle2',
    })

    if (!response || !response.ok()) {
      throw new Error(
        `Print page failed with status ${response?.status() ?? 'unknown'}`
      )
    }

    await page.waitForSelector('[data-module-pdf-ready="true"]', {
      timeout: 30000,
    })
    await page.emulateMediaType('print')

    const pdfBytes = await page.pdf({
      displayHeaderFooter: false,
      format: 'A4',
      margin: {
        bottom: '0',
        left: '0',
        right: '0',
        top: '0',
      },
      preferCSSPageSize: true,
      printBackground: true,
    })

    return Buffer.from(pdfBytes)
  } finally {
    await browser?.close()
  }
}

async function renderPdfWithWindowsChrome(
  chrome: { powershellPath: string },
  printUrl: URL
): Promise<Buffer> {
  const outputDirectory = join(process.cwd(), '.next', 'cache', 'module-pdf')
  mkdirSync(outputDirectory, { recursive: true })

  const outputPath = join(outputDirectory, `${randomUUID()}.pdf`)
  const windowsOutputPath = getWindowsPathFromWslPath(outputPath)
  if (!windowsOutputPath) {
    throw new Error(`Cannot convert PDF output path for Windows: ${outputPath}`)
  }

  const script = `
    $ErrorActionPreference = 'Stop'
    $dir = Join-Path $env:TEMP ('werkzeugkiste-pdf-chrome-' + [guid]::NewGuid().ToString())
    New-Item -ItemType Directory -Force -Path $dir | Out-Null
    $process = Start-Process -WindowStyle Hidden -Wait -PassThru -FilePath '${escapePowerShellSingleQuoted(chrome.powershellPath)}' -ArgumentList @(
      '--headless=new',
      '--disable-gpu',
      '--font-render-hinting=none',
      '--hide-scrollbars',
      '--no-first-run',
      '--no-default-browser-check',
      '--no-pdf-header-footer',
      '--print-to-pdf-no-header',
      '--virtual-time-budget=10000',
      '--print-to-pdf=${escapePowerShellSingleQuoted(windowsOutputPath)}',
      ('--user-data-dir=' + $dir),
      '${escapePowerShellSingleQuoted(printUrl.toString())}'
    )
    exit $process.ExitCode
  `

  try {
    await runPowerShell(script, 60000)

    if (!existsSync(outputPath)) {
      throw new Error('Windows Chrome did not create a PDF file')
    }

    const pdfBytes = readFileSync(outputPath)
    if (!pdfBytes.subarray(0, 5).equals(Buffer.from('%PDF-'))) {
      throw new Error('Windows Chrome output was not a PDF')
    }

    return pdfBytes
  } finally {
    if (existsSync(outputPath)) {
      unlinkSync(outputPath)
    }
  }
}

function getWindowsPathFromWslPath(path: string): string | null {
  const match = path.match(/^\/mnt\/([a-z])\/(.+)$/i)
  if (!match) {
    return null
  }

  return `${match[1].toUpperCase()}:\\${match[2].replaceAll('/', '\\')}`
}

function escapePowerShellSingleQuoted(value: string): string {
  return value.replaceAll("'", "''")
}

async function runPowerShell(script: string, timeoutMs: number): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const child = spawn('powershell.exe', ['-NoProfile', '-Command', script], {
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    const stdout: Buffer[] = []
    const stderr: Buffer[] = []
    const timeout = setTimeout(() => {
      child.kill()
      reject(new Error('Timed out while generating PDF with Windows Chrome'))
    }, timeoutMs)

    child.stdout.on('data', chunk => stdout.push(Buffer.from(chunk)))
    child.stderr.on('data', chunk => stderr.push(Buffer.from(chunk)))
    child.on('error', error => {
      clearTimeout(timeout)
      reject(error)
    })
    child.on('close', code => {
      clearTimeout(timeout)
      if (code === 0) {
        resolve()
        return
      }

      const output = Buffer.concat([...stdout, ...stderr]).toString('utf8')
      reject(
        new Error(
          `Windows Chrome PDF generation failed with exit code ${code}: ${output}`
        )
      )
    })
  })
}

function getLocalChromeExecutablePath(): string | null {
  const explicitCandidates = [
    '/usr/bin/google-chrome-stable',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
  ]

  const explicitCandidate = explicitCandidates.find(candidate =>
    existsSync(candidate)
  )
  if (explicitCandidate) {
    return explicitCandidate
  }

  const puppeteerCacheRoot = join(homedir(), '.cache', 'puppeteer')
  const puppeteerChromeRoot = join(puppeteerCacheRoot, 'chrome')
  const puppeteerHeadlessShellRoot = join(
    puppeteerCacheRoot,
    'chrome-headless-shell'
  )

  const cachedHeadlessShell = getPuppeteerCachedExecutable(
    puppeteerHeadlessShellRoot,
    'chrome-headless-shell-linux64',
    'chrome-headless-shell'
  )
  if (cachedHeadlessShell) {
    return cachedHeadlessShell
  }

  return getPuppeteerCachedExecutable(
    puppeteerChromeRoot,
    'chrome-linux64',
    'chrome'
  )
}

function getPuppeteerCachedExecutable(
  root: string,
  binaryDirectory: string,
  binaryName: string
): string | null {
  if (!existsSync(root)) {
    return null
  }

  const cachedCandidates = readdirSync(root)
    .filter(directoryName => directoryName.startsWith('linux-'))
    .sort()
    .reverse()
    .map(directoryName =>
      join(root, directoryName, binaryDirectory, binaryName)
    )

  return cachedCandidates.find(candidate => existsSync(candidate)) ?? null
}

export async function GET(request: NextRequest, { params }: PdfRouteParams) {
  try {
    const { id } = await params
    const moduleData = await getPublicModulePdfData(id)
    const printUrl = new URL(
      `/modules/${encodeURIComponent(id)}/print?pdf=1`,
      getRequestOrigin(request)
    )

    const pdfBytes = await renderPdfBytes(printUrl)

    return new NextResponse(new Uint8Array(pdfBytes), {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Content-Disposition': getContentDisposition(moduleData.title),
        'Content-Type': 'application/pdf',
        Expires: '0',
        Pragma: 'no-cache',
      },
    })
  } catch (error) {
    if (error instanceof ModulePdfNotFoundError) {
      return NextResponse.json(
        { success: false, error: 'Module not found' },
        { status: 404 }
      )
    }

    console.error('Module PDF API error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to generate module PDF' },
      { status: 500 }
    )
  }
}
