import React, { useEffect, useMemo, useState } from 'react'
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

  const bmi = useMemo(() => {
    const height = Number(user?.healthProfile?.height)
    const weight = Number(user?.healthProfile?.weight)
    if (!Number.isFinite(height) || !Number.isFinite(weight) || height <= 0) return null
    const h = height / 100
    return (weight / (h * h)).toFixed(1)
  }, [user?.healthProfile?.height, user?.healthProfile?.weight])

  return (
    <div className="min-h-screen bg-[#f7f3ee] dark:bg-[#0f1515] pt-24 px-6 pb-12">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="relative overflow-hidden rounded-3xl border border-white/60 bg-white/80 dark:bg-zinc-900/80 shadow-xl">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-100/60 via-amber-100/40 to-orange-100/60" />
          <div className="relative p-8 flex flex-col md:flex-row md:items-center gap-6">
            {loading ? (
              <Skeleton className="w-20 h-20 rounded-2xl" />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-white/80 dark:bg-zinc-800 flex items-center justify-center text-3xl font-semibold text-zinc-700 dark:text-zinc-100 shadow-md">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
            )}
            <div className="flex-1">
              {loading ? (
                <>
                  <Skeleton className="h-7 w-56 mb-2" />
                  <Skeleton className="h-4 w-72" />
                </>
              ) : (
                <>
                  <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 font-display">
                    {user?.name || 'Your Profile'}
                  </h1>
                  <p className="text-sm text-zinc-600 dark:text-zinc-300">
                    {user?.email || 'No email on file'}
                  </p>
                  <p className="text-xs text-zinc-500 mt-2">
                    Member since {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}
                  </p>
                </>
              )}
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-2xl bg-white/70 dark:bg-zinc-900/70 p-3 border border-white/70">
                <p className="text-xs text-zinc-500">BMI</p>
                <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{bmi || '—'}</p>
              </div>
              <div className="rounded-2xl bg-white/70 dark:bg-zinc-900/70 p-3 border border-white/70">
                <p className="text-xs text-zinc-500">Blood</p>
                <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{user?.healthProfile?.bloodType || '—'}</p>
              </div>
              <div className="rounded-2xl bg-white/70 dark:bg-zinc-900/70 p-3 border border-white/70">
                <p className="text-xs text-zinc-500">Role</p>
                <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{user?.role || 'user'}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-3xl border border-white/60 bg-white/80 dark:bg-zinc-900/80 shadow-lg p-6">
            <p className="text-xs uppercase tracking-wide text-zinc-500">Health Profile</p>
            <div className="mt-4 space-y-3 text-sm text-zinc-700 dark:text-zinc-200">
              {loading ? (
                <>
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-4 w-1/2" />
                </>
              ) : (
                <>
                  <div className="flex justify-between"><span>Height</span><span>{user?.healthProfile?.height ? `${user.healthProfile.height} cm` : '—'}</span></div>
                  <div className="flex justify-between"><span>Weight</span><span>{user?.healthProfile?.weight ? `${user.healthProfile.weight} kg` : '—'}</span></div>
                  <div className="flex justify-between"><span>Blood Type</span><span>{user?.healthProfile?.bloodType || '—'}</span></div>
                </>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-white/60 bg-white/80 dark:bg-zinc-900/80 shadow-lg p-6">
            <p className="text-xs uppercase tracking-wide text-zinc-500">Conditions</p>
            <div className="mt-4 text-sm text-zinc-700 dark:text-zinc-200">
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

        <div className="rounded-3xl border border-white/60 bg-white/80 dark:bg-zinc-900/80 shadow-lg p-6">
          <p className="text-xs uppercase tracking-wide text-zinc-500">Account</p>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-zinc-700 dark:text-zinc-200">
            {loading ? (
              <>
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-1/3" />
              </>
            ) : (
              <>
                <div className="flex justify-between"><span>Member Since</span><span>{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}</span></div>
                <div className="flex justify-between"><span>Role</span><span>{user?.role || 'user'}</span></div>
                <div className="flex justify-between"><span>Status</span><span>{user ? 'Active' : '—'}</span></div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile
