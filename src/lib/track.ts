export function track(event: string, source?: string, meta?: Record<string, unknown>) {
  // Fire-and-forget — never block the UI
  fetch('/api/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event, source, meta }),
  }).catch(() => {})
}
