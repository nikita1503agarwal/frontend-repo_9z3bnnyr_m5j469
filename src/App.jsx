import { useEffect, useState } from 'react'
import EventPage from './components/EventPage'

function App() {
  const baseUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'
  const [eventId, setEventId] = useState(null)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    const existing = localStorage.getItem('demo_event_id')
    if (existing) {
      setEventId(existing)
      return
    }

    // Create a demo event on first load so you can see the page right away
    const createDemo = async () => {
      setCreating(true)
      try {
        const payload = {
          title: 'Community Beach Cleanup',
          description: 'Join us for a fun and impactful morning cleaning our local shoreline. Bags, gloves, and refreshments provided. Families welcome! 🧤🌊',
          date_iso: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3).toISOString(),
          location: 'Ocean View Park, Santa Monica',
          cover_image_url: 'https://images.unsplash.com/photo-1520975922284-9e0ce8273a06?q=80&w=1600&auto=format&fit=crop'
        }
        const res = await fetch(`${baseUrl}/api/events`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        const data = await res.json()
        if (data.id) {
          localStorage.setItem('demo_event_id', data.id)
          setEventId(data.id)
        }
      } catch (e) {
        console.error(e)
      } finally {
        setCreating(false)
      }
    }

    createDemo()
  }, [baseUrl])

  if (!eventId) {
    return (
      <div className="min-h-screen bg-slate-950 text-white grid place-items-center p-6 text-center">
        <div>
          <div className="animate-pulse text-blue-300 mb-2">Preparing your event…</div>
          {creating && <p className="text-slate-400 text-sm">Setting up a demo so you can preview the design.</p>}
        </div>
      </div>
    )
  }

  return <EventPage eventId={eventId} />
}

export default App
