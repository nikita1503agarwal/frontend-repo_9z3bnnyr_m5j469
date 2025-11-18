import { useEffect, useMemo, useState } from 'react'

const formatDate = (iso) => {
  try {
    const d = new Date(iso)
    return new Intl.DateTimeFormat(undefined, {
      weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
    }).format(d)
  } catch {
    return iso
  }
}

export default function EventPage({ eventId, initialUser }) {
  const baseUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'
  const [event, setEvent] = useState(null)
  const [counts, setCounts] = useState({ going: 0, not_going: 0 })
  const [myStatus, setMyStatus] = useState(null) // 'going' | 'not_going' | null
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const user = useMemo(() => {
    // For demo purposes we generate a lightweight local identity if not provided
    if (initialUser) return initialUser
    const stored = localStorage.getItem('demo_user')
    if (stored) return JSON.parse(stored)
    const u = { id: crypto.randomUUID(), name: 'Guest' }
    localStorage.setItem('demo_user', JSON.stringify(u))
    return u
  }, [initialUser])

  useEffect(() => {
    const load = async () => {
      try {
        const ev = await fetch(`${baseUrl}/api/events/${eventId}`).then(r => r.json())
        setEvent(ev)
      } catch {}
      try {
        const c = await fetch(`${baseUrl}/api/events/${eventId}/counts`).then(r => r.json())
        setCounts(c)
      } catch {}
      try {
        const res = await fetch(`${baseUrl}/api/events/${eventId}/rsvp/${user.id}`)
        if (res.ok) {
          const r = await res.json()
          setMyStatus(r.status)
        }
      } catch {}
      setLoading(false)
    }
    load()
  }, [baseUrl, eventId, user.id])

  const toggleAttendance = async () => {
    const next = myStatus === 'going' ? 'not_going' : 'going'
    setSaving(true)
    try {
      await fetch(`${baseUrl}/api/events/${eventId}/rsvp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next, user_id: user.id, user_name: user.name })
      })
      setMyStatus(next)
      setCounts((c) => ({
        going: c.going + (next === 'going' ? 1 : -1) + (myStatus === null ? 0 : 0),
        not_going: c.not_going + (next === 'not_going' ? 1 : -1) + (myStatus === null ? 0 : 0),
      }))
      // For robustness re-fetch counts
      const c = await fetch(`${baseUrl}/api/events/${eventId}/counts`).then(r => r.json())
      setCounts(c)
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="animate-pulse text-blue-300">Loading event…</div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6 text-center">
        <div>
          <p className="text-xl">Event not found</p>
          <a href="/" className="mt-4 inline-block underline text-blue-300">Go Home</a>
        </div>
      </div>
    )
  }

  const isGoing = myStatus === 'going'

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-3xl mx-auto pb-16">
        {/* Cover */}
        <div className="relative aspect-[16/10] w-full overflow-hidden rounded-b-3xl bg-slate-800">
          {event.cover_image_url ? (
            <img src={event.cover_image_url} alt={event.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full grid place-items-center text-slate-300">No Image</div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold drop-shadow-lg">{event.title}</h1>
          </div>
        </div>

        {/* Meta */}
        <div className="px-4 sm:px-6 mt-6 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="space-y-1">
              <p className="text-slate-300">{formatDate(event.date_iso)}</p>
              <p className="text-slate-300">{event.location}</p>
            </div>
            <button
              onClick={toggleAttendance}
              disabled={saving}
              className={`inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-slate-950 ${isGoing ? 'bg-emerald-500 hover:bg-emerald-600 text-white' : 'bg-slate-700 hover:bg-slate-600 text-white'}`}
            >
              {saving ? 'Updating…' : isGoing ? 'You are going ✓' : 'Attend'}
            </button>
          </div>

          {/* Smart toggle chips */}
          <div className="flex items-center gap-2 text-sm">
            <button
              onClick={() => myStatus !== 'going' && toggleAttendance()}
              className={`px-4 py-2 rounded-full border transition ${isGoing ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300' : 'border-slate-700 text-slate-300 hover:border-slate-500'}`}
            >
              Going
            </button>
            <button
              onClick={() => myStatus !== 'not_going' && toggleAttendance()}
              className={`px-4 py-2 rounded-full border transition ${myStatus === 'not_going' ? 'bg-rose-600/20 border-rose-500 text-rose-300' : 'border-slate-700 text-slate-300 hover:border-slate-500'}`}
            >
              Not going
            </button>
            <div className="ml-auto flex items-center gap-3 text-slate-400">
              <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> {counts.going}</span>
              <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500" /> {counts.not_going}</span>
            </div>
          </div>

          {event.description && (
            <div className="mt-2 text-slate-200 leading-relaxed">{event.description}</div>
          )}
        </div>
      </div>
    </div>
  )
}
