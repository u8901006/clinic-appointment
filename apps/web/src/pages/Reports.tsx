import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '../lib/api'
import Layout from '../components/Layout'

interface DailyReport {
  total: number
  byStatus: {
    booked: number
    checkedIn: number
    completed: number
    cancelled: number
  }
  byDoctor: Record<string, number>
}

interface MonthlyReport {
  total: number
  dailyAverage: number
  byDoctor: Record<string, number>
}

function buildDoctorRanking(byDoctor: Record<string, number>) {
  return Object.entries(byDoctor)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
}

export default function Reports() {
  const today = new Date()
  const [dailyDate, setDailyDate] = useState(today.toISOString().slice(0, 10))
  const [selectedYear, setSelectedYear] = useState(today.getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1)

  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear()
    return [currentYear - 1, currentYear, currentYear + 1]
  }, [])

  const { data: dailyReport, isLoading: dailyLoading } = useQuery<DailyReport>({
    queryKey: ['reports', 'daily', dailyDate],
    queryFn: async () => {
      const res = await api.get(`/reports/daily?date=${dailyDate}`)
      return res.data
    }
  })

  const { data: monthlyReport, isLoading: monthlyLoading } = useQuery<MonthlyReport>({
    queryKey: ['reports', 'monthly', selectedYear, selectedMonth],
    queryFn: async () => {
      const res = await api.get(`/reports/monthly?year=${selectedYear}&month=${selectedMonth}`)
      return res.data
    }
  })

  const dailyDoctorRanking = buildDoctorRanking(dailyReport?.byDoctor || {})
  const monthlyDoctorRanking = buildDoctorRanking(monthlyReport?.byDoctor || {})

  const dailyStatusCards = [
    { label: '已預約', value: dailyReport?.byStatus?.booked || 0, tone: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
    { label: '已報到', value: dailyReport?.byStatus?.checkedIn || 0, tone: 'text-cyan-700', bg: 'bg-cyan-50 border-cyan-200' },
    { label: '已完成', value: dailyReport?.byStatus?.completed || 0, tone: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
    { label: '已取消', value: dailyReport?.byStatus?.cancelled || 0, tone: 'text-rose-700', bg: 'bg-rose-50 border-rose-200' },
  ]

  const maxDailyDoctorCount = Math.max(...dailyDoctorRanking.map((item) => item.count), 1)
  const maxMonthlyDoctorCount = Math.max(...monthlyDoctorRanking.map((item) => item.count), 1)

  return (
    <Layout>
      <section className="rounded-2xl border border-app-border bg-app-panel px-5 py-5 shadow-soft md:px-7">
        <h1 className="text-3xl font-bold text-app-text">報表統計</h1>
        <p className="mt-2 text-sm text-app-muted">查看每日與每月門診預約走勢，協助行政排班與人力調度。</p>
      </section>

      <section className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <article className="rounded-2xl border border-app-border bg-white p-5 shadow-soft">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 className="text-2xl font-bold text-app-text">每日報表</h2>
            <div>
              <label htmlFor="daily-report-date" className="mb-1 block text-sm font-semibold text-app-text">日期</label>
              <input
                id="daily-report-date"
                type="date"
                value={dailyDate}
                onChange={(event) => setDailyDate(event.target.value)}
                className="min-h-[44px] rounded-xl border border-app-border bg-white px-3 text-base text-app-text"
              />
            </div>
          </div>

          {dailyLoading ? (
            <p className="mt-4 text-app-muted">載入中...</p>
          ) : (
            <div className="mt-4">
              <div className="mb-4 rounded-xl border border-app-border bg-app-panel px-4 py-3">
                <p className="text-sm font-semibold text-app-muted">總預約數</p>
                <p className="mt-1 text-3xl font-bold text-cyan-700">{dailyReport?.total || 0}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {dailyStatusCards.map((card) => (
                  <div key={card.label} className={`rounded-xl border px-3 py-3 ${card.bg}`}>
                    <p className="text-sm font-semibold text-app-muted">{card.label}</p>
                    <p className={`mt-1 text-2xl font-bold ${card.tone}`}>{card.value}</p>
                  </div>
                ))}
              </div>

              <div className="mt-5">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-app-muted">各醫師當日預約</h3>
                {dailyDoctorRanking.length === 0 ? (
                  <p className="mt-2 text-sm text-app-muted">目前無資料</p>
                ) : (
                  <div className="mt-2 space-y-2">
                    {dailyDoctorRanking.map((item) => (
                      <div key={item.name}>
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium text-app-text">{item.name}</span>
                          <span className="text-app-muted">{item.count}</span>
                        </div>
                        <div className="mt-1 h-2 rounded-full bg-slate-200">
                          <div className="h-2 rounded-full bg-cyan-600" style={{ width: `${Math.round((item.count / maxDailyDoctorCount) * 100)}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </article>

        <article className="rounded-2xl border border-app-border bg-white p-5 shadow-soft">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 className="text-2xl font-bold text-app-text">每月報表</h2>
            <div className="flex gap-2">
              <div>
                <label htmlFor="report-year" className="mb-1 block text-sm font-semibold text-app-text">年份</label>
                <select
                  id="report-year"
                  value={selectedYear}
                  onChange={(event) => setSelectedYear(Number(event.target.value))}
                  className="min-h-[44px] rounded-xl border border-app-border bg-white px-3 text-base text-app-text"
                >
                  {yearOptions.map((year) => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="report-month" className="mb-1 block text-sm font-semibold text-app-text">月份</label>
                <select
                  id="report-month"
                  value={selectedMonth}
                  onChange={(event) => setSelectedMonth(Number(event.target.value))}
                  className="min-h-[44px] rounded-xl border border-app-border bg-white px-3 text-base text-app-text"
                >
                  {Array.from({ length: 12 }, (_, index) => index + 1).map((month) => (
                    <option key={month} value={month}>{month} 月</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {monthlyLoading ? (
            <p className="mt-4 text-app-muted">載入中...</p>
          ) : (
            <div className="mt-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-app-border bg-app-panel px-4 py-3">
                  <p className="text-sm font-semibold text-app-muted">總預約數</p>
                  <p className="mt-1 text-3xl font-bold text-cyan-700">{monthlyReport?.total || 0}</p>
                </div>
                <div className="rounded-xl border border-app-border bg-app-panel px-4 py-3">
                  <p className="text-sm font-semibold text-app-muted">日均預約</p>
                  <p className="mt-1 text-3xl font-bold text-indigo-700">{monthlyReport?.dailyAverage?.toFixed(1) || '0.0'}</p>
                </div>
              </div>

              <div className="mt-5">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-app-muted">醫師月度預約排名</h3>
                {monthlyDoctorRanking.length === 0 ? (
                  <p className="mt-2 text-sm text-app-muted">目前無資料</p>
                ) : (
                  <div className="mt-2 space-y-2">
                    {monthlyDoctorRanking.map((item) => (
                      <div key={item.name}>
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium text-app-text">{item.name}</span>
                          <span className="text-app-muted">{item.count}</span>
                        </div>
                        <div className="mt-1 h-2 rounded-full bg-slate-200">
                          <div className="h-2 rounded-full bg-indigo-600" style={{ width: `${Math.round((item.count / maxMonthlyDoctorCount) * 100)}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </article>
      </section>
    </Layout>
  )
}
