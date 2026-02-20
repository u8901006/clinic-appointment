import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '../lib/api'
import Layout from '../components/Layout'

interface PatientItem {
  id: string
  name: string
  phone: string
  createdAt: string
  _count?: {
    appointments?: number
  }
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(value))
}

export default function Patients() {
  const [keyword, setKeyword] = useState('')

  const { data: patients = [], isLoading } = useQuery<PatientItem[]>({
    queryKey: ['patients'],
    queryFn: async () => {
      const res = await api.get('/patients')
      return res.data
    }
  })

  const filteredPatients = useMemo(() => {
    const normalized = keyword.trim().toLowerCase()
    return patients
      .filter((item) => {
        if (!normalized) return true
        return item.name.toLowerCase().includes(normalized) || item.phone.toLowerCase().includes(normalized)
      })
      .sort((a, b) => {
        const aCount = a._count?.appointments || 0
        const bCount = b._count?.appointments || 0
        return bCount - aCount
      })
  }, [patients, keyword])

  const stats = useMemo(() => {
    const total = patients.length
    const withPhone = patients.filter((item) => item.phone && item.phone.trim().length > 0).length
    const frequent = patients.filter((item) => (item._count?.appointments || 0) >= 3).length
    return { total, withPhone, frequent }
  }, [patients])

  return (
    <Layout>
      <section className="rounded-2xl border border-app-border bg-app-panel px-5 py-5 shadow-soft md:px-7">
        <h1 className="text-3xl font-bold text-app-text">病患管理</h1>
        <p className="mt-2 text-sm text-app-muted">快速查找病患資訊，掌握回診頻率與聯絡資料完整度。</p>
      </section>

      <section className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <article className="rounded-xl border border-app-border bg-white px-4 py-4 shadow-soft">
          <p className="text-sm font-semibold text-app-muted">病患總數</p>
          <p className="mt-2 text-3xl font-bold text-cyan-700">{stats.total}</p>
        </article>
        <article className="rounded-xl border border-app-border bg-white px-4 py-4 shadow-soft">
          <p className="text-sm font-semibold text-app-muted">已填電話</p>
          <p className="mt-2 text-3xl font-bold text-emerald-700">{stats.withPhone}</p>
        </article>
        <article className="rounded-xl border border-app-border bg-white px-4 py-4 shadow-soft">
          <p className="text-sm font-semibold text-app-muted">高回診族群 (3次以上)</p>
          <p className="mt-2 text-3xl font-bold text-indigo-700">{stats.frequent}</p>
        </article>
      </section>

      <section className="mt-4 rounded-2xl border border-app-border bg-white p-4 shadow-soft md:p-5">
        <label htmlFor="patient-search" className="mb-1 block text-sm font-semibold text-app-text">搜尋病患姓名或電話</label>
        <input
          id="patient-search"
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          placeholder="例如：王小明、0912"
          className="min-h-[44px] w-full rounded-xl border border-app-border bg-white px-3 text-base text-app-text placeholder:text-slate-400"
        />
      </section>

      <section className="mt-4 rounded-2xl border border-app-border bg-white p-4 shadow-soft md:p-6">
        <div className="mb-4 flex items-center justify-between gap-2">
          <h2 className="text-2xl font-bold text-app-text">病患清單</h2>
          <p className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-app-text">{filteredPatients.length} 筆</p>
        </div>

        {isLoading ? (
          <div className="rounded-xl border border-dashed border-app-border bg-app-panel p-6 text-center text-app-muted">載入中...</div>
        ) : filteredPatients.length === 0 ? (
          <div className="rounded-xl border border-dashed border-app-border bg-app-panel p-6 text-center text-app-muted">沒有符合條件的病患資料。</div>
        ) : (
          <>
            <div className="hidden overflow-x-auto rounded-xl border border-app-border md:block">
              <table className="min-w-full divide-y divide-app-border text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-app-muted">
                  <tr>
                    <th className="px-4 py-3">姓名</th>
                    <th className="px-4 py-3">電話</th>
                    <th className="px-4 py-3">預約次數</th>
                    <th className="px-4 py-3">建立日期</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-app-border bg-white">
                  {filteredPatients.map((patient) => (
                    <tr key={patient.id}>
                      <td className="px-4 py-3 font-semibold text-app-text">{patient.name}</td>
                      <td className="px-4 py-3 text-app-muted">{patient.phone || '未填寫'}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700">
                          {patient._count?.appointments || 0} 次
                        </span>
                      </td>
                      <td className="px-4 py-3 text-app-muted">{formatDate(patient.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-3 md:hidden">
              {filteredPatients.map((patient) => (
                <article key={patient.id} className="rounded-xl border border-app-border bg-app-panel p-4">
                  <p className="text-base font-semibold text-app-text">{patient.name}</p>
                  <p className="mt-1 text-sm text-app-muted">電話：{patient.phone || '未填寫'}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700">
                      預約 {patient._count?.appointments || 0} 次
                    </span>
                    <span className="text-xs text-app-muted">{formatDate(patient.createdAt)}</span>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </section>
    </Layout>
  )
}
