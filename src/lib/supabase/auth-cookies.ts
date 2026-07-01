const AUTH_COOKIE_PREFIXES = [
  'sb-',
  'supabase-auth-token',
  'supabase.auth.token',
] as const

export function isSupabaseAuthCookieName(name: string) {
  return AUTH_COOKIE_PREFIXES.some(prefix => name.startsWith(prefix))
}

export function hasSupabaseAuthCookieNames(names: string[]) {
  return names.some(isSupabaseAuthCookieName)
}
