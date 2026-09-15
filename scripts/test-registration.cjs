const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const ts = require('typescript')
const { NextRequest } = require('next/server')

const root = path.resolve(__dirname, '..')
function load(relative, client) {
  const filename = path.join(root, relative)
  const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      jsx: ts.JsxEmit.React,
    },
  }).outputText
  const module = { exports: {} }
  const localRequire = name => {
    if (
      name === '@/lib/supabase/server-client' ||
      name === '@supabase/supabase-js'
    )
      return { createClient: () => client }
    if (name.startsWith('@/'))
      return load('src/' + name.slice(2) + '.ts', client)
    return require(name)
  }
  vm.runInNewContext(
    compiled,
    {
      module,
      exports: module.exports,
      require: localRequire,
      process,
      console,
      crypto,
      URL,
      URLSearchParams,
    },
    { filename }
  )
  return module.exports
}
function request(body, origin = 'https://example.test') {
  return new NextRequest('https://example.test/api/auth/confirm', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(origin ? { origin } : {}),
    },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  })
}
function route(name, auth) {
  return load('src/app/api/auth/' + name + '/route.ts', { auth })
}

test('signup normalizes email/names and cannot accept admin role', async () => {
  let sent
  const api = route('signup', {
    signUp: async value => {
      sent = value
      return { data: { user: { id: 'test' }, session: null }, error: null }
    },
  })
  const response = await api.POST(
    request({
      email: ' Person@Example.com ',
      password: 'strong-password',
      first_name: ' First ',
      last_name: ' Last ',
      role: 'admin',
    })
  )
  assert.equal(response.status, 200)
  assert.equal(sent.email, 'person@example.com')
  assert.equal(sent.options.data.role, 'student')
  assert.equal(sent.options.data.full_name, 'First Last')
  assert.match(sent.options.emailRedirectTo, /\/auth\/callback\?type=signup$/)
  assert.equal((await response.json()).confirmation_required, true)
})
test('signup rejects malformed, empty and invalid input before contacting provider', async () => {
  let calls = 0
  const api = route('signup', {
    signUp: () => {
      calls++
      throw Error('unexpected')
    },
  })
  for (const body of [
    '{',
    null,
    {},
    { email: 'x', password: 'short', first_name: 12 },
  ]) {
    assert.equal((await api.POST(request(body))).status, 400)
  }
  assert.equal(calls, 0)
})
test('signup duplicate response does not disclose account or claim a session', async () => {
  const api = route('signup', {
    signUp: async () => ({ data: {}, error: { code: 'user_already_exists' } }),
  })
  const result = await (
    await api.POST(
      request({
        email: 'p@example.com',
        password: 'abcdef',
        first_name: 'P',
        last_name: 'Q',
      })
    )
  ).json()
  assert.equal(result.success, true)
  assert.equal(result.confirmation_required, true)
  assert.equal(result.user, undefined)
})
test('a 30-person group signup burst has no application-level shared limiter', async () => {
  let calls = 0
  const api = route('signup', {
    signUp: async () => {
      calls++
      return {
        data: { user: { id: `test-${calls}` }, session: null },
        error: null,
      }
    },
  })
  const responses = await Promise.all(
    Array.from({ length: 30 }, (_, index) =>
      api.POST(
        request({
          email: `person-${index}@example.org`,
          password: 'strong-password',
          first_name: 'Group',
          last_name: `Member ${index}`,
        })
      )
    )
  )
  assert.equal(calls, 30)
  assert.deepEqual(
    responses.map(response => response.status),
    Array(30).fill(200)
  )
})
test('resend uses signup resend, normalized email and no admin operation', async () => {
  let sent
  const api = route('resend-confirmation', {
    resend: async value => {
      sent = value
      return { error: null }
    },
  })
  const response = await api.POST(request({ email: ' Person@Example.com ' }))
  assert.equal(response.status, 200)
  assert.equal(sent.type, 'signup')
  assert.equal(sent.email, 'person@example.com')
  assert.match((await response.json()).message, /Falls/)
})
test('sending limits and delivery failures are not reported as successful emails', async () => {
  for (const name of ['resend-confirmation', 'forgot-password']) {
    for (const [code, status] of [
      ['over_email_send_rate_limit', 429],
      ['over_request_rate_limit', 429],
      ['unexpected_failure', 503],
    ]) {
      const fail = async () => ({ error: { code } })
      const api = route(name, { resend: fail, resetPasswordForEmail: fail })
      const response = await api.POST(request({ email: 'p@example.com' }))
      assert.equal(response.status, status)
      assert.equal((await response.json()).success, false)
    }
  }
})
test('provider exceptions are handled', async () => {
  for (const name of ['resend-confirmation', 'forgot-password']) {
    const fail = async () => {
      throw Error('offline')
    }
    const response = await route(name, {
      resend: fail,
      resetPasswordForEmail: fail,
    }).POST(request({ email: 'p@example.com' }))
    assert.equal(response.status, 503)
  }
})
test('confirmation has no GET mutation and rejects cross-site or invalid requests', async () => {
  let calls = 0
  const api = route('confirm', {
    verifyOtp: async () => {
      calls++
      return {}
    },
  })
  assert.equal(api.GET, undefined)
  const token = 'a'.repeat(64)
  assert.equal(
    (await api.POST(request({ token_hash: token }, 'https://evil.test')))
      .status,
    403
  )
  assert.equal(
    (await api.POST(request({ token_hash: token }, null))).status,
    403
  )
  for (const body of [
    '{',
    null,
    {},
    { token_hash: 'bad' },
    { token_hash: 'a'.repeat(64), type: 'magiclink' },
  ])
    assert.equal((await api.POST(request(body))).status, 400)
  assert.equal(calls, 0)
})
test('confirmation establishes session without PKCE verifier; recovery stays recovery', async () => {
  for (const type of ['email', 'recovery']) {
    let sent
    const api = route('confirm', {
      verifyOtp: async value => {
        sent = value
        return { data: { session: { user: { id: 'test' } } }, error: null }
      },
    })
    const response = await api.POST(
      request({
        token_hash: 'a'.repeat(64),
        type,
        redirectTo: 'https://evil.test',
      })
    )
    assert.equal(response.status, 200)
    assert.equal(sent.type, type)
    assert.equal(
      (await response.json()).redirectTo,
      type === 'recovery' ? '/auth/password-reset' : '/?registration=confirmed'
    )
  }
})
test('expired/reused links have actionable 24-hour error, provider outage is different', async () => {
  for (const [error, expected] of [
    [{ code: 'otp_expired', status: 403 }, 400],
    [{ code: 'unexpected_failure', status: 500 }, 503],
  ]) {
    const api = route('confirm', {
      verifyOtp: async () => ({ data: {}, error }),
    })
    const response = await api.POST(request({ token_hash: 'a'.repeat(64) }))
    assert.equal(response.status, expected)
    const result = await response.json()
    if (expected === 400) assert.match(result.error, /24 Stunden/)
    else assert.doesNotMatch(result.error, /abgelaufen/)
  }
})
test('confirmation failures use stable provider codes instead of message guessing', () => {
  const classify = load(
    'src/lib/auth/registration.ts',
    {}
  ).classifyConfirmationFailure
  assert.equal(classify({ code: 'otp_expired', status: 403 }), 'expired')
  assert.equal(
    classify({ code: 'validation_failed', status: 403 }),
    'already_used_or_invalid'
  )
  assert.equal(
    classify({
      code: 'validation_failed',
      message: 'both auth code and code verifier should be non-empty',
      status: 400,
    }),
    'pkce_state_error'
  )
  assert.equal(classify({ code: 'bad_code_verifier' }), 'pkce_state_error')
  assert.equal(
    classify({ code: 'over_email_send_rate_limit', status: 429 }),
    'rate_limited'
  )
  assert.equal(classify({ code: 'unexpected_failure', status: 500 }), 'unknown')
})
test('legacy missing browser verifier is classified as session issue, not expiry', async () => {
  const filename = path.join(root, 'src/app/auth/callback/route.ts')
  const code = fs.readFileSync(filename, 'utf8')
  // Execute the real callback with an SSR provider stub, preserving NextResponse redirects.
  const compiled = ts.transpileModule(code, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  }).outputText
  const module = { exports: {} }
  vm.runInNewContext(compiled, {
    module,
    exports: module.exports,
    require: name => {
      if (name === '@supabase/ssr')
        return {
          createServerClient: () => ({
            auth: {
              exchangeCodeForSession: async () => ({
                data: {},
                error: {
                  message:
                    'both auth code and code verifier should be non-empty',
                },
              }),
            },
          }),
        }
      if (name === '@/lib/auth/registration')
        return load('src/lib/auth/registration.ts', {})
      return require(name)
    },
    process,
    console: { log() {}, error() {} },
    crypto,
    URL,
  })
  const response = await module.exports.GET(
    new NextRequest('https://example.test/auth/callback?code=test')
  )
  assert.equal(
    new URL(response.headers.get('location')).searchParams.get('error'),
    'email_link_session'
  )
})
