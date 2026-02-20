import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import api from '../lib/api'
import Layout from '../components/Layout'

interface DoctorItem {
  id: string
  name: string
  specialty: string
}

interface SlotItem {
  id: string
  date: string
  startTime: string
  endTime: string
  maxPatients: number
  currentCount: number
}

function toApiDate(date: string) {
  return `${date}T00:00:00+08:00`
}

export default function Doctors() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({ name: '', specialty: '' })
  const [selectedDoctorId, setSelectedDoctorId] = useState('')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10))
  const [slotForm, setSlotForm] = useState({ startTime: '09:00', endTime: '09:30', maxPatients: '20' })

  const { data: doctors = [], isLoading } = useQuery<DoctorItem[]>({
    queryKey: ['doctors'],
    queryFn: async () => {
      const res = await api.get('/doctors')
      return res.data
    }
  })

  const createDoctor = useMutation({
    mutationFn: async (data: { name: string; specialty: string }) => {
      await api.post('/doctors', data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctors'] })
      setShowForm(false)
      setFormData({ name: '', specialty: '' })
    }
  })

  const createSlot = useMutation({
    mutationFn: async (data: { doctorId: string; date: string; startTime: string; endTime: string; maxPatients: number }) => {
      await api.post('/slots', data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['slots', selectedDoctorId, selectedDate] })
      setSlotForm({ startTime: '09:00', endTime: '09:30', maxPatients: '20' })
    }
  })

  const deleteDoctor = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/doctors/${id}`)
    },
    onSuccess: (_data, deletedId) => {
      queryClient.invalidateQueries({ queryKey: ['doctors'] })
      if (selectedDoctorId === deletedId) {
        setSelectedDoctorId('')
      }
    }
  })

  const { data: slots = [], isLoading: slotsLoading } = useQuery<SlotItem[]>({
    queryKey: ['slots', selectedDoctorId, selectedDate],
    queryFn: async () => {
      const res = await api.get(`/slots?doctorId=${selectedDoctorId}&date=${selectedDate}`)
      return res.data
    },
    enabled: Boolean(selectedDoctorId && selectedDate)
  })

  const selectedDoctor = doctors.find((doctor) => doctor.id === selectedDoctorId)

  const handleCreateSlot = (event: React.FormEvent) => {
    event.preventDefault()
    if (!selectedDoctorId) return

    const maxPatients = Number(slotForm.maxPatients)
    createSlot.mutate({
      doctorId: selectedDoctorId,
      date: toApiDate(selectedDate),
      startTime: slotForm.startTime,
      endTime: slotForm.endTime,
      maxPatients: Number.isFinite(maxPatients) && maxPatients > 0 ? maxPatients : 20,
    })
  }

  return (
    <Layout>
      <section className="rounded-2xl border border-app-border bg-app-panel px-5 py-5 shadow-soft md:px-7">
        <h1 className="text-3xl font-bold text-app-text">醫師與時段</h1>
        <p className="mt-2 text-sm text-app-muted">先建立醫師，再安排時段，櫃台才能順利處理 LINE 預約流程。</p>
      </section>

      <section className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-bold text-app-text">醫師資料管理</h2>
        <button
          onClick={() => setShowForm(true)}
          className="min-h-[44px] cursor-pointer rounded-xl bg-cyan-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-cyan-700"
        >
          新增醫師
        </button>
      </section>

      {showForm && (
        <section className="mt-4 rounded-2xl border border-app-border bg-white p-5 shadow-soft">
          <h3 className="text-xl font-bold text-app-text">新增醫師</h3>
          <form onSubmit={(e) => { e.preventDefault(); createDoctor.mutate(formData) }}>
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="doctor-name" className="mb-1 block text-sm font-semibold text-app-text">姓名</label>
                <input
                  id="doctor-name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="min-h-[44px] w-full rounded-xl border border-app-border bg-white px-3 text-base text-app-text"
                  required
                />
              </div>
              <div>
                <label htmlFor="doctor-specialty" className="mb-1 block text-sm font-semibold text-app-text">科別</label>
                <input
                  id="doctor-specialty"
                  type="text"
                  value={formData.specialty}
                  onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                  className="min-h-[44px] w-full rounded-xl border border-app-border bg-white px-3 text-base text-app-text"
                  required
                />
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button type="submit" className="min-h-[44px] cursor-pointer rounded-xl bg-cyan-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-cyan-700">儲存</button>
              <button type="button" onClick={() => setShowForm(false)} className="min-h-[44px] cursor-pointer rounded-xl border border-app-border bg-app-panel px-4 text-sm font-semibold text-app-text transition-colors hover:bg-cyan-50">取消</button>
            </div>
          </form>
        </section>
      )}

      <section className="mt-4 rounded-2xl border border-app-border bg-white p-4 shadow-soft md:p-6">
        <div className="hidden overflow-x-auto rounded-xl border border-app-border md:block">
          <table className="min-w-full divide-y divide-app-border text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-app-muted">
              <tr>
                <th className="px-4 py-3">姓名</th>
                <th className="px-4 py-3">科別</th>
                <th className="px-4 py-3">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-app-border bg-white">
              {isLoading ? (
                <tr><td colSpan={3} className="px-4 py-6 text-center text-app-muted">載入中...</td></tr>
              ) : doctors.length === 0 ? (
                <tr><td colSpan={3} className="px-4 py-6 text-center text-app-muted">尚無醫師資料</td></tr>
              ) : (
                doctors.map((doctor) => (
                  <tr key={doctor.id}>
                    <td className="px-4 py-3 font-semibold text-app-text">{doctor.name}</td>
                    <td className="px-4 py-3 text-app-muted">{doctor.specialty}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedDoctorId(doctor.id)}
                          className="min-h-[44px] cursor-pointer rounded-lg border border-cyan-200 bg-cyan-50 px-3 text-sm font-semibold text-cyan-700 transition-colors hover:bg-cyan-100"
                        >
                          管理時段
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteDoctor.mutate(doctor.id)}
                          className="min-h-[44px] cursor-pointer rounded-lg border border-rose-200 px-3 text-sm font-semibold text-rose-700 transition-colors hover:bg-rose-50"
                        >
                          刪除
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="space-y-3 md:hidden">
          {doctors.map((doctor) => (
            <article key={doctor.id} className="rounded-xl border border-app-border bg-app-panel p-4">
              <p className="text-base font-semibold text-app-text">{doctor.name}</p>
              <p className="mt-1 text-sm text-app-muted">{doctor.specialty}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedDoctorId(doctor.id)}
                  className="min-h-[44px] flex-1 cursor-pointer rounded-lg border border-cyan-200 bg-cyan-50 px-3 text-sm font-semibold text-cyan-700"
                >
                  管理時段
                </button>
                <button
                  type="button"
                  onClick={() => deleteDoctor.mutate(doctor.id)}
                  className="min-h-[44px] flex-1 cursor-pointer rounded-lg border border-rose-200 px-3 text-sm font-semibold text-rose-700"
                >
                  刪除
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-app-border bg-white p-4 shadow-soft md:p-6">
        <h2 className="text-2xl font-bold text-app-text">時段管理</h2>
        <p className="mt-2 text-sm text-app-muted">選擇醫師與日期後可新增門診時段，供 LINE 預約流程使用。</p>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <label htmlFor="slot-doctor" className="mb-1 block text-sm font-semibold text-app-text">醫師</label>
            <select
              id="slot-doctor"
              value={selectedDoctorId}
              onChange={(event) => setSelectedDoctorId(event.target.value)}
              className="min-h-[44px] w-full rounded-xl border border-app-border bg-white px-3 text-base text-app-text"
            >
              <option value="">請選擇醫師</option>
              {doctors.map((doctor) => (
                <option key={doctor.id} value={doctor.id}>{doctor.name} - {doctor.specialty}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="slot-date" className="mb-1 block text-sm font-semibold text-app-text">日期</label>
            <input
              id="slot-date"
              type="date"
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
              className="min-h-[44px] w-full rounded-xl border border-app-border bg-white px-3 text-base text-app-text"
            />
          </div>
        </div>

        <form className="mt-4 rounded-xl border border-app-border bg-app-panel p-4" onSubmit={handleCreateSlot}>
          <h3 className="text-lg font-bold text-app-text">新增時段</h3>
          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
            <div>
              <label htmlFor="slot-start" className="mb-1 block text-sm font-semibold text-app-text">開始時間</label>
              <input
                id="slot-start"
                type="time"
                value={slotForm.startTime}
                onChange={(event) => setSlotForm({ ...slotForm, startTime: event.target.value })}
                className="min-h-[44px] w-full rounded-xl border border-app-border bg-white px-3 text-base text-app-text"
                required
              />
            </div>
            <div>
              <label htmlFor="slot-end" className="mb-1 block text-sm font-semibold text-app-text">結束時間</label>
              <input
                id="slot-end"
                type="time"
                value={slotForm.endTime}
                onChange={(event) => setSlotForm({ ...slotForm, endTime: event.target.value })}
                className="min-h-[44px] w-full rounded-xl border border-app-border bg-white px-3 text-base text-app-text"
                required
              />
            </div>
            <div>
              <label htmlFor="slot-capacity" className="mb-1 block text-sm font-semibold text-app-text">名額上限</label>
              <input
                id="slot-capacity"
                type="number"
                min={1}
                value={slotForm.maxPatients}
                onChange={(event) => setSlotForm({ ...slotForm, maxPatients: event.target.value })}
                className="min-h-[44px] w-full rounded-xl border border-app-border bg-white px-3 text-base text-app-text"
                required
              />
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between gap-3">
            <p className="text-xs text-app-muted">請確認醫師與日期後再新增時段。</p>
            <button
              type="submit"
              disabled={!selectedDoctorId || createSlot.isPending}
              className="min-h-[44px] cursor-pointer rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {createSlot.isPending ? '新增中...' : '新增時段'}
            </button>
          </div>
        </form>

        <div className="mt-5 rounded-xl border border-app-border bg-white p-4">
          <h3 className="text-lg font-bold text-app-text">{selectedDoctor ? `${selectedDoctor.name} ${selectedDate} 時段列表` : '請先選擇醫師與日期'}</h3>

          {!selectedDoctorId ? (
            <p className="mt-3 text-sm text-app-muted">請先選擇醫師以查看當日時段。</p>
          ) : slotsLoading ? (
            <p className="mt-3 text-sm text-app-muted">載入時段中...</p>
          ) : slots.length === 0 ? (
            <p className="mt-3 text-sm text-app-muted">此日期尚未建立時段。</p>
          ) : (
            <div className="mt-3 space-y-2">
              {slots.map((slot) => {
                const occupancy = slot.maxPatients > 0 ? Math.min(Math.round((slot.currentCount / slot.maxPatients) * 100), 100) : 0
                return (
                  <article key={slot.id} className="rounded-lg border border-app-border bg-app-panel p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-semibold text-app-text">{slot.startTime} - {slot.endTime}</p>
                      <span className="text-sm text-app-muted">{slot.currentCount} / {slot.maxPatients}</span>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-slate-200">
                      <div className="h-2 rounded-full bg-cyan-600" style={{ width: `${occupancy}%` }} />
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {(createDoctor.isError || deleteDoctor.isError || createSlot.isError) && (
        <p role="alert" className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          作業失敗，請檢查資料後再試。
        </p>
      )}

      {(createDoctor.isSuccess || createSlot.isSuccess) && (
        <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          已完成儲存。
        </p>
      )}
    </Layout>
  )
}
