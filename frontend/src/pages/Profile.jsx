import React, { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'
import Skeleton from '../components/ui/Skeleton'

const Profile = () => {
  const { user, updateUser } = useAuth()
  const [loading, setLoading] = useState(false)

  const loadProfile = async () => {
    try {
      setLoading(true)
      const response = await api.get('/users/profile')
      if (response?.data?.success && response.data.data) {
        updateUser(response.data.data)
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProfile()
    const handler = () => loadProfile()
    window.addEventListener('reportsUpdated', handler)
    return () => window.removeEventListener('reportsUpdated', handler)
  }, [])

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pt-24 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-4">
            {loading ? (
              <Skeleton className="w-16 h-16 rounded-2xl" />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-2xl font-semibold text-zinc-700 dark:text-zinc-200">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
            )}
            <div>
              {loading ? (
                <>
                  <Skeleton className="h-6 w-48 mb-2" />
                  <Skeleton className="h-4 w-56" />
                </>
              ) : (
                <>
                  <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{user?.name || 'Your Profile'}</h1>
                  <p className="text-sm text-zinc-500">{user?.email || 'No email on file'}</p>
                  {loading && <p className="text-xs text-zinc-400">Refreshing…</p>}
                </>
              )}
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800">
              <p className="text-xs uppercase tracking-wide text-zinc-500">Health Profile</p>
              <div className="mt-2 space-y-2 text-sm text-zinc-700 dark:text-zinc-200">
                {loading ? (
                  <>
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-4 w-1/2" />
                  </>
                ) : (
                  <>
                    <div className="flex justify-between"><span>Blood Type</span><span>{user?.healthProfile?.bloodType || '—'}</span></div>
                    <div className="flex justify-between"><span>Height</span><span>{user?.healthProfile?.height ? `${user.healthProfile.height} cm` : '—'}</span></div>
                    <div className="flex justify-between"><span>Weight</span><span>{user?.healthProfile?.weight ? `${user.healthProfile.weight} kg` : '—'}</span></div>
                  </>
                )}
              </div>
            </div>

            <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800">
              <p className="text-xs uppercase tracking-wide text-zinc-500">Conditions</p>
              <div className="mt-2 text-sm text-zinc-700 dark:text-zinc-200">
                {loading ? (
                  <>
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-2/3" />
                  </>
                ) : (
                  <>
                    {(user?.detectedConditions || []).length > 0 ? (
                      <ul className="list-disc list-inside space-y-1">
                        {user.detectedConditions.map((c) => (
                          <li key={c}>{c}</li>
                        ))}
                      </ul>
                    ) : (
                      <p>No conditions recorded yet.</p>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800">
            <p className="text-xs uppercase tracking-wide text-zinc-500">Account</p>
            <div className="mt-2 space-y-2 text-sm text-zinc-700 dark:text-zinc-200">
              {loading ? (
                <>
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-4 w-1/3" />
                </>
              ) : (
                <>
                  <div className="flex justify-between"><span>Member Since</span><span>{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}</span></div>
                  <div className="flex justify-between"><span>Role</span><span>{user?.role || 'user'}</span></div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile
