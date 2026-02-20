import { useMemo } from 'react'
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

export default function Dashboard() {
  const queryClient = useQueryClient()

  const { data: todayAppointments = [], isLoading } = useQuery<AppointmentItem[]>({
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
    },
  })

  const summary = useMemo(() => {
    const counts = {
      total: todayAppointments.length,
      booked: todayAppointments.filter((item) => item.status === 'BOOKED').length,
      checkedIn: todayAppointments.filter((item) => item.status === 'CHECKED_IN').length,
      completed: todayAppointments.filter((item) => item.status === 'COMPLETED').length,
    }

    return [
      { label: '今日預約總數', value: counts.total, hint: '所有狀態', tone: 'text-cyan-700' },
      { label: '等待報到', value: counts.booked, hint: '需櫃台處理', tone: 'text-amber-700' },
      { label: '看診中', value: counts.checkedIn, hint: '醫師診間進行中', tone: 'text-sky-700' },
      { label: '已完成', value: counts.completed, hint: '今日已結案', tone: 'text-emerald-700' },
    ]
  }, [todayAppointments])

  const pendingList = useMemo(
    () => todayAppointments
      .filter((item) => item.status === 'BOOKED' || item.status === 'CHECKED_IN')
      .sort((a, b) => a.queueNumber - b.queueNumber),
    [todayAppointments]
  )

  const activeAction = updateStatus.variables

  const isActionLoading = (id: string, status: AppointmentStatus) => {
    return updateStatus.isPending && activeAction?.id === id && activeAction?.status === status
  }

  const formatToday = new Intl.DateTimeFormat('zh-TW', {
    weekday: 'long',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())

  return (
    <Layout>
      <section className="mb-6 rounded-2xl border border-app-border bg-app-panel px-5 py-5 shadow-soft md:px-7">
        <p className="text-sm font-semibold uppercase tracking-[0.15em] text-app-muted">Front Desk Command Center</p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
          <h1 className="text-3xl font-bold leading-tight text-app-text">今日看診指揮台</h1>
          <p className="rounded-full border border-cyan-200 bg-cyan-50 px-4 py-1 text-sm font-medium text-cyan-700">{formatToday}</p>
        </div>
        <p className="mt-2 text-sm text-app-muted">優先處理「等待報到」與「看診中」名單，可直接在此頁完成狀態更新。</p>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summary.map((card) => (
          <article key={card.label} className="rounded-2xl border border-app-border bg-white px-5 py-4 shadow-soft">
            <p className="text-sm font-semibold text-app-muted">{card.label}</p>
            <p className={`mt-2 text-4xl font-bold ${card.tone}`}>{card.value}</p>
            <p className="mt-1 text-xs text-app-muted">{card.hint}</p>
          </article>
        ))}
      </section>

      <section className="mt-6 rounded-2xl border border-app-border bg-white p-4 shadow-soft md:p-6">
        <div className="mb-4 flex items-end justify-between gap-2">
          <div>
            <h2 className="text-2xl font-bold text-app-text">待處理預約</h2>
            <p className="text-sm text-app-muted">依照號碼排序，櫃台可快速完成報到、完成或取消。</p>
          </div>
          <p className="rounded-lg bg-slate-100 px-3 py-1 text-sm font-semibold text-app-text">{pendingList.length} 筆待處理</p>
        </div>

        {isLoading ? (
          <div className="rounded-xl border border-dashed border-app-border bg-app-panel p-6 text-center text-app-muted">正在載入今日預約資料...</div>
        ) : pendingList.length === 0 ? (
          <div className="rounded-xl border border-dashed border-app-border bg-app-panel p-6 text-center text-app-muted">目前沒有待處理預約，辛苦了！</div>
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
                  {pendingList.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-3 text-lg font-bold text-cyan-700">{item.queueNumber}</td>
                      <td className="px-4 py-3 font-semibold text-app-text">{item.patient?.name || '未命名病患'}</td>
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
              {pendingList.map((item) => (
                <article key={item.id} className="rounded-xl border border-app-border bg-app-panel p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-lg font-bold text-cyan-700">#{item.queueNumber}</p>
                    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${STATUS_BADGE[item.status]}`}>
                      {STATUS_LABEL[item.status]}
                    </span>
                  </div>
                  <p className="mt-2 text-base font-semibold text-app-text">{item.patient?.name || '未命名病患'}</p>
                  <p className="text-sm text-app-muted">{item.timeSlot?.doctor?.name || '-'} | {item.timeSlot?.startTime} - {item.timeSlot?.endTime}</p>

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

        {updateStatus.isSuccess && (
          <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
            已更新預約狀態。
          </p>
        )}
      </section>

      <section className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <article className="rounded-2xl border border-app-border bg-white p-5 shadow-soft">
          <h3 className="text-xl font-bold text-app-text">櫃台處理建議</h3>
          <ul className="mt-3 space-y-2 text-sm text-app-muted">
            <li>1. 優先處理號碼最前面的「已預約」病患，避免塞車。</li>
            <li>2. 病患到場後立刻按「報到」，診間會更容易掌握進度。</li>
            <li>3. 病患離場後立即按「完成」，報表才會即時準確。</li>
          </ul>
        </article>
        <article className="rounded-2xl border border-app-border bg-app-panel p-5 shadow-soft">
          <h3 className="text-xl font-bold text-app-text">尖峰時段提醒</h3>
          <p className="mt-3 text-sm text-app-muted">
            若同一時段待報到數過高，建議提前通知醫師或安排分流，避免候診區擁擠。
          </p>
        </article>
      </section>
    </Layout>
  )
}
