import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'
import Layout from '../components/Layout'

type AppointmentStatus = 'BOOKED' | 'CHECKED_IN' | 'COMPLETED' | 'CANCELLED'

interface AppointmentItem {
  id: string
  queueNumber: number
  status: AppointmentStatus
  patient?: {
    name?: string
    phone?: string
  }
  timeSlot?: {
    startTime?: string
    endTime?: string
    doctor?: {
      name?: string
    }
  }
}

const STATUS_LABEL: Record<AppointmentStatus, string> = {
  BOOKED: '已預約',
  CHECKED_IN: '已報到',
  COMPLETED: '已完成',
  CANCELLED: '已取消',
}

const STATUS_BADGE: Record<AppointmentStatus, string> = {
  BOOKED: 'border-amber-200 bg-amber-50 text-amber-700',
  CHECKED_IN: 'border-cyan-200 bg-cyan-50 text-cyan-700',
  COMPLETED: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  CANCELLED: 'border-rose-200 bg-rose-50 text-rose-700',
}

const STATUS_FILTERS: Array<{ key: 'ALL' | AppointmentStatus; label: string }> = [
  { key: 'ALL', label: '全部狀態' },
  { key: 'BOOKED', label: '已預約' },
  { key: 'CHECKED_IN', label: '已報到' },
  { key: 'COMPLETED', label: '已完成' },
  { key: 'CANCELLED', label: '已取消' },
]

export default function Appointments() {
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState<'ALL' | AppointmentStatus>('ALL')
  const [doctorFilter, setDoctorFilter] = useState('ALL')
  const [keyword, setKeyword] = useState('')

  const { data: appointments = [], isLoading } = useQuery<AppointmentItem[]>({
    queryKey: ['appointments', 'today'],
    queryFn: async () => {
      const res = await api.get('/appointments/today')
      return res.data
    }
  })

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: AppointmentStatus }) => {
      await api.patch(`/appointments/${id}/status`, { status })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments', 'today'] })
    }
  })

  const doctorOptions = useMemo(() => {
    const names = appointments
      .map((item) => item.timeSlot?.doctor?.name)
      .filter((name): name is string => Boolean(name))
    return Array.from(new Set(names)).sort((a, b) => a.localeCompare(b, 'zh-Hant'))
  }, [appointments])

  const statusCount = useMemo(() => {
    return appointments.reduce<Record<'ALL' | AppointmentStatus, number>>((acc, item) => {
      acc.ALL += 1
      acc[item.status] += 1
      return acc
    }, {
      ALL: 0,
      BOOKED: 0,
      CHECKED_IN: 0,
      COMPLETED: 0,
      CANCELLED: 0,
    })
  }, [appointments])

  const filteredAppointments = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase()

    return appointments
      .filter((item) => statusFilter === 'ALL' || item.status === statusFilter)
      .filter((item) => doctorFilter === 'ALL' || item.timeSlot?.doctor?.name === doctorFilter)
      .filter((item) => {
        if (!normalizedKeyword) return true
        const patientName = item.patient?.name?.toLowerCase() || ''
        const patientPhone = item.patient?.phone?.toLowerCase() || ''
        return patientName.includes(normalizedKeyword) || patientPhone.includes(normalizedKeyword)
      })
      .sort((a, b) => a.queueNumber - b.queueNumber)
  }, [appointments, statusFilter, doctorFilter, keyword])

  const activeAction = updateStatus.variables
  const isActionLoading = (id: string, status: AppointmentStatus) => {
    return updateStatus.isPending && activeAction?.id === id && activeAction?.status === status
  }

  return (
    <Layout>
      <section className="rounded-2xl border border-app-border bg-app-panel px-5 py-5 shadow-soft md:px-7">
        <h1 className="text-3xl font-bold text-app-text">預約總覽</h1>
        <p className="mt-2 text-sm text-app-muted">使用篩選與快速操作，讓櫃台同仁在尖峰時段也能快速處理預約。</p>
      </section>

      <section className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-5">
        {STATUS_FILTERS.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setStatusFilter(item.key)}
            className={`min-h-[54px] cursor-pointer rounded-xl border px-4 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
              statusFilter === item.key
                ? 'border-cyan-300 bg-cyan-50 text-cyan-800'
                : 'border-app-border bg-white text-app-text hover:border-cyan-200 hover:bg-cyan-50/40'
            }`}
          >
            <p className="text-sm font-semibold">{item.label}</p>
            <p className="text-xs text-app-muted">{statusCount[item.key]} 筆</p>
          </button>
        ))}
      </section>

      <section className="mt-4 rounded-2xl border border-app-border bg-white p-4 shadow-soft md:p-5">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <label htmlFor="appointment-search" className="mb-1 block text-sm font-semibold text-app-text">搜尋病患姓名或電話</label>
            <input
              id="appointment-search"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="例如：王小明、0912"
              className="min-h-[44px] w-full rounded-xl border border-app-border bg-white px-3 text-base text-app-text placeholder:text-slate-400"
            />
          </div>

          <div>
            <label htmlFor="appointment-doctor" className="mb-1 block text-sm font-semibold text-app-text">醫師篩選</label>
            <select
              id="appointment-doctor"
              value={doctorFilter}
              onChange={(event) => setDoctorFilter(event.target.value)}
              className="min-h-[44px] w-full rounded-xl border border-app-border bg-white px-3 text-base text-app-text"
            >
              <option value="ALL">全部醫師</option>
              {doctorOptions.map((doctorName) => (
                <option key={doctorName} value={doctorName}>{doctorName}</option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              type="button"
              onClick={() => {
                setStatusFilter('ALL')
                setDoctorFilter('ALL')
                setKeyword('')
              }}
              className="min-h-[44px] w-full cursor-pointer rounded-xl border border-app-border bg-app-panel px-3 text-sm font-semibold text-app-text transition-colors hover:bg-cyan-50"
            >
              清除篩選條件
            </button>
          </div>
        </div>
      </section>

      <section className="mt-4 rounded-2xl border border-app-border bg-white p-4 shadow-soft md:p-6">
        <div className="mb-4 flex items-center justify-between gap-2">
          <h2 className="text-2xl font-bold text-app-text">今日預約清單</h2>
          <p className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-app-text">{filteredAppointments.length} / {appointments.length}</p>
        </div>

        {isLoading ? (
          <div className="rounded-xl border border-dashed border-app-border bg-app-panel p-6 text-center text-app-muted">載入中...</div>
        ) : filteredAppointments.length === 0 ? (
          <div className="rounded-xl border border-dashed border-app-border bg-app-panel p-6 text-center text-app-muted">沒有符合條件的預約資料。</div>
        ) : (
          <>
            <div className="hidden overflow-x-auto rounded-xl border border-app-border md:block">
              <table className="min-w-full divide-y divide-app-border text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-app-muted">
                  <tr>
                    <th className="px-4 py-3">號碼</th>
                    <th className="px-4 py-3">病患</th>
                    <th className="px-4 py-3">醫師</th>
                    <th className="px-4 py-3">時段</th>
                    <th className="px-4 py-3">狀態</th>
                    <th className="px-4 py-3">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-app-border bg-white">
                  {filteredAppointments.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-3 text-lg font-bold text-cyan-700">{item.queueNumber}</td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-app-text">{item.patient?.name || '未命名病患'}</p>
                        <p className="text-xs text-app-muted">{item.patient?.phone || '未填電話'}</p>
                      </td>
                      <td className="px-4 py-3 text-app-muted">{item.timeSlot?.doctor?.name || '-'}</td>
                      <td className="px-4 py-3 text-app-muted">{item.timeSlot?.startTime} - {item.timeSlot?.endTime}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${STATUS_BADGE[item.status]}`}>
                          {STATUS_LABEL[item.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          {item.status === 'BOOKED' && (
                            <>
                              <button
                                type="button"
                                onClick={() => updateStatus.mutate({ id: item.id, status: 'CHECKED_IN' })}
                                disabled={updateStatus.isPending}
                                className="min-h-[44px] cursor-pointer rounded-lg bg-cyan-600 px-3 text-sm font-semibold text-white transition-colors hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {isActionLoading(item.id, 'CHECKED_IN') ? '處理中...' : '報到'}
                              </button>
                              <button
                                type="button"
                                onClick={() => updateStatus.mutate({ id: item.id, status: 'CANCELLED' })}
                                disabled={updateStatus.isPending}
                                className="min-h-[44px] cursor-pointer rounded-lg border border-rose-200 px-3 text-sm font-semibold text-rose-700 transition-colors hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {isActionLoading(item.id, 'CANCELLED') ? '處理中...' : '取消'}
                              </button>
                            </>
                          )}
                          {item.status === 'CHECKED_IN' && (
                            <button
                              type="button"
                              onClick={() => updateStatus.mutate({ id: item.id, status: 'COMPLETED' })}
                              disabled={updateStatus.isPending}
                              className="min-h-[44px] cursor-pointer rounded-lg bg-emerald-600 px-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {isActionLoading(item.id, 'COMPLETED') ? '處理中...' : '完成'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-3 md:hidden">
              {filteredAppointments.map((item) => (
                <article key={item.id} className="rounded-xl border border-app-border bg-app-panel p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-lg font-bold text-cyan-700">#{item.queueNumber}</p>
                    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${STATUS_BADGE[item.status]}`}>
                      {STATUS_LABEL[item.status]}
                    </span>
                  </div>
                  <p className="mt-2 text-base font-semibold text-app-text">{item.patient?.name || '未命名病患'}</p>
                  <p className="text-sm text-app-muted">{item.patient?.phone || '未填電話'}</p>
                  <p className="mt-1 text-sm text-app-muted">{item.timeSlot?.doctor?.name || '-'} | {item.timeSlot?.startTime} - {item.timeSlot?.endTime}</p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {item.status === 'BOOKED' && (
                      <>
                        <button
                          type="button"
                          onClick={() => updateStatus.mutate({ id: item.id, status: 'CHECKED_IN' })}
                          disabled={updateStatus.isPending}
                          className="min-h-[44px] flex-1 cursor-pointer rounded-lg bg-cyan-600 px-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {isActionLoading(item.id, 'CHECKED_IN') ? '處理中...' : '報到'}
                        </button>
                        <button
                          type="button"
                          onClick={() => updateStatus.mutate({ id: item.id, status: 'CANCELLED' })}
                          disabled={updateStatus.isPending}
                          className="min-h-[44px] flex-1 cursor-pointer rounded-lg border border-rose-200 px-3 text-sm font-semibold text-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {isActionLoading(item.id, 'CANCELLED') ? '處理中...' : '取消'}
                        </button>
                      </>
                    )}
                    {item.status === 'CHECKED_IN' && (
                      <button
                        type="button"
                        onClick={() => updateStatus.mutate({ id: item.id, status: 'COMPLETED' })}
                        disabled={updateStatus.isPending}
                        className="min-h-[44px] flex-1 cursor-pointer rounded-lg bg-emerald-600 px-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isActionLoading(item.id, 'COMPLETED') ? '處理中...' : '完成'}
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </>
        )}

        {updateStatus.isError && (
          <p role="alert" className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
            狀態更新失敗，請稍後再試。
          </p>
        )}
      </section>
    </Layout>
  )
}
