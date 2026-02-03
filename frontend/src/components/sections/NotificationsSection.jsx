import React, { useEffect, useMemo, useState } from 'react'
import Skeleton from '../ui/Skeleton'

const STORAGE_KEY = 'aarogini.notifications'

const seedNotifications = [
  {
    id: 'n1',
    title: 'Weekly health summary is ready',
    body: 'Your health trends for the past week are ready to review.',
    time: 'Just now',
    read: false,
    type: 'insight'
  },
  {
    id: 'n2',
    title: 'New article: Iron-rich foods guide',
    body: 'Boost energy levels with curated nutrition tips.',
    time: '2h ago',
    read: false,
    type: 'article'
  },
  {
    id: 'n3',
    title: 'Period tracker reminder',
    body: "Log today's symptoms to keep your cycle insights accurate.",
    time: 'Yesterday',
    read: true,
    type: 'reminder'
  },
]

const typeStyles = {
  insight: 'bg-emerald-100 text-emerald-700',
  article: 'bg-orange-100 text-orange-700',
  reminder: 'bg-amber-100 text-amber-700',
}

const NotificationsSection = ({ loading }) => {
  const [items, setItems] = useState([])

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      setItems(JSON.parse(stored))
    } else {
      setItems(seedNotifications)
    }
  }, [])

  useEffect(() => {
    if (items.length) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    }
    window.dispatchEvent(new Event('notificationsUpdated'))
  }, [items])

  const unreadCount = useMemo(() => items.filter(i => !i.read).length, [items])

  const markAllRead = () => setItems(prev => prev.map(i => ({ ...i, read: true })))
  const clearAll = () => setItems([])
  const toggleRead = (id) => setItems(prev => prev.map(i => i.id === id ? { ...i, read: !i.read } : i))

  if (loading) {
    return (
      <section className="bg-white/80 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm">
        <Skeleton className="h-6 w-56 mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800">
              <Skeleton className="h-4 w-2/3 mb-2" />
              <Skeleton className="h-3 w-full" />
            </div>
          ))}
        </div>
      </section>
    )
  }

  return (
    <section className="bg-white/80 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Notifications</h2>
          <p className="text-sm text-zinc-500">{unreadCount} unread - {items.length} total</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={markAllRead}
            className="px-3 py-1.5 text-sm font-medium rounded-full border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            Mark all read
          </button>
          <button
            onClick={clearAll}
            className="px-3 py-1.5 text-sm font-medium rounded-full bg-zinc-900 text-white hover:bg-zinc-800"
          >
            Clear
          </button>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-8 text-zinc-500">You're all caught up</div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className={`p-4 rounded-2xl border transition-all ${item.read ? 'border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900' : 'border-emerald-200 dark:border-emerald-500/40 bg-emerald-50/60 dark:bg-zinc-900'}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-[11px] px-2 py-0.5 rounded-full ${typeStyles[item.type] || 'bg-zinc-100 text-zinc-700'}`}>
                      {item.type}
                    </span>
                    <span className="text-xs text-zinc-400">{item.time}</span>
                  </div>
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{item.title}</p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-300">{item.body}</p>
                </div>
                <button
                  onClick={() => toggleRead(item.id)}
                  className="text-xs px-3 py-1 rounded-full border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  {item.read ? 'Mark unread' : 'Mark read'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

export default NotificationsSection
