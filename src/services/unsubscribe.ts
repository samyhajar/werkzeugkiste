export interface UnsubscribeResponse {
  success: boolean
  error?: string
  notFound?: boolean
}

export async function unsubscribeByEmail(
  email: string
): Promise<UnsubscribeResponse> {
  const res = await fetch('/api/unsubscribe', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email }),
  })

  let data: UnsubscribeResponse
  try {
    data = (await res.json()) as UnsubscribeResponse
  } catch (_e) {
    data = { success: false, error: 'Unerwartete Antwort vom Server.' }
  }

  if (!res.ok) {
    return { success: false, error: data.error || res.statusText }
  }

  return data
}
