import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
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

type WeekdayKey = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday'
type PeriodKey = 'morning' | 'afternoon' | 'evening'

type ScheduleMatrix = Record<WeekdayKey, Record<PeriodKey, boolean>>

const weekdayDefinitions: Array<{ key: WeekdayKey; label: string; offset: number }> = [
  { key: 'monday', label: '星期一', offset: 0 },
  { key: 'tuesday', label: '星期二', offset: 1 },
  { key: 'wednesday', label: '星期三', offset: 2 },
  { key: 'thursday', label: '星期四', offset: 3 },
  { key: 'friday', label: '星期五', offset: 4 },
  { key: 'saturday', label: '星期六', offset: 5 },
]

const periodDefinitions: Array<{ key: PeriodKey; label: string; startTime: string; endTime: string }> = [
  { key: 'morning', label: '上午', startTime: '08:50', endTime: '11:45' },
  { key: 'afternoon', label: '下午', startTime: '13:50', endTime: '16:45' },
  { key: 'evening', label: '晚上', startTime: '17:50', endTime: '20:45' },
]

function toApiDate(date: string) {
  return `${date}T00:00:00+08:00`
}

function toDateInputValue(date: Date) {
  const yyyy = date.getFullYear()
  const mm = `${date.getMonth() + 1}`.padStart(2, '0')
  const dd = `${date.getDate()}`.padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function toMondayDateInput(dateInput: string) {
  const date = new Date(`${dateInput}T00:00:00`)
  const day = date.getDay()
  const mondayOffset = day === 0 ? -6 : 1 - day
  date.setDate(date.getDate() + mondayOffset)
  return toDateInputValue(date)
}

function createScheduleMatrix(defaultOpen: boolean): ScheduleMatrix {
  return {
    monday: { morning: defaultOpen, afternoon: defaultOpen, evening: defaultOpen },
    tuesday: { morning: defaultOpen, afternoon: defaultOpen, evening: defaultOpen },
    wednesday: { morning: defaultOpen, afternoon: defaultOpen, evening: defaultOpen },
    thursday: { morning: defaultOpen, afternoon: defaultOpen, evening: defaultOpen },
    friday: { morning: defaultOpen, afternoon: defaultOpen, evening: defaultOpen },
    saturday: { morning: defaultOpen, afternoon: defaultOpen, evening: defaultOpen },
  }
}

function getMonthBounds(monthInput: string) {
  const [yearText, monthText] = monthInput.split('-')
  const year = Number(yearText)
  const month = Number(monthText)
  const firstDate = new Date(year, month - 1, 1)
  const lastDate = new Date(year, month, 0)
  return {
    start: toDateInputValue(firstDate),
    end: toDateInputValue(lastDate),
  }
}

function addMonths(monthInput: string, delta: number) {
  const [yearText, monthText] = monthInput.split('-')
  const year = Number(yearText)
  const month = Number(monthText)
  const date = new Date(year, month - 1 + delta, 1)
  return `${date.getFullYear()}-${`${date.getMonth() + 1}`.padStart(2, '0')}`
}

function buildCalendarDays(monthInput: string) {
  const [yearText, monthText] = monthInput.split('-')
  const year = Number(yearText)
  const month = Number(monthText)
  const firstDay = new Date(year, month - 1, 1)
  const startOffset = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1
  const startDate = new Date(firstDay)
  startDate.setDate(firstDay.getDate() - startOffset)

  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(startDate)
    day.setDate(startDate.getDate() + index)
    return {
      key: toDateInputValue(day),
      label: day.getDate(),
      inCurrentMonth: day.getMonth() === month - 1,
      isSunday: day.getDay() === 0,
      date: day,
    }
  })
}

export default function Doctors() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({ name: '', specialty: '' })
  const [selectedDoctorId, setSelectedDoctorId] = useState('')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10))
  const [slotForm, setSlotForm] = useState({ startTime: '09:00', endTime: '09:30', maxPatients: '20' })
  const [scheduleMatrix, setScheduleMatrix] = useState<ScheduleMatrix>(createScheduleMatrix(true))
  const [planStartDate, setPlanStartDate] = useState(toMondayDateInput(toDateInputValue(new Date())))
  const [planWeeks, setPlanWeeks] = useState('4')
  const [planMaxPatients, setPlanMaxPatients] = useState('20')
  const [planMessage, setPlanMessage] = useState('')
  const [calendarMonth, setCalendarMonth] = useState(() => toDateInputValue(new Date()).slice(0, 7))

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
      queryClient.invalidateQueries({ queryKey: ['slots'] })
      setSlotForm({ startTime: '09:00', endTime: '09:30', maxPatients: '20' })
    }
  })

  const createSlotBatch = useMutation({
    mutationFn: async (slots: Array<{ doctorId: string; date: string; startTime: string; endTime: string; maxPatients: number }>) => {
      await api.post('/slots/batch', { slots })
    },
    onSuccess: (_data, slots) => {
      queryClient.invalidateQueries({ queryKey: ['slots'] })
      setPlanMessage(`已建立 ${slots.length} 個看診時段。`)
    },
    onError: () => {
      setPlanMessage('建立門診時間表失敗，請檢查資料後重試。')
    },
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

  const { data: monthSlots = [], isLoading: monthSlotsLoading } = useQuery<SlotItem[]>({
    queryKey: ['slots', 'month', selectedDoctorId, calendarMonth],
    queryFn: async () => {
      const { start, end } = getMonthBounds(calendarMonth)
      const res = await api.get(`/slots?doctorId=${selectedDoctorId}&startDate=${start}&endDate=${end}`)
      return res.data
    },
    enabled: Boolean(selectedDoctorId),
  })

  const monthSlotMap = useMemo(() => {
    return monthSlots.reduce<Record<string, SlotItem[]>>((acc, slot) => {
      const dateKey = toDateInputValue(new Date(slot.date))
      if (!acc[dateKey]) {
        acc[dateKey] = []
      }
      acc[dateKey].push(slot)
      return acc
    }, {})
  }, [monthSlots])

  const calendarDays = useMemo(() => buildCalendarDays(calendarMonth), [calendarMonth])

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

  const togglePeriod = (weekday: WeekdayKey, period: PeriodKey) => {
    setScheduleMatrix((prev) => ({
      ...prev,
      [weekday]: {
        ...prev[weekday],
        [period]: !prev[weekday][period],
      },
    }))
  }

  const applyFullWeekTemplate = () => {
    setScheduleMatrix(createScheduleMatrix(true))
  }

  const applyReferenceTemplate = () => {
    setScheduleMatrix({
      monday: { morning: true, afternoon: true, evening: true },
      tuesday: { morning: true, afternoon: true, evening: true },
      wednesday: { morning: true, afternoon: true, evening: false },
      thursday: { morning: true, afternoon: true, evening: true },
      friday: { morning: true, afternoon: true, evening: true },
      saturday: { morning: true, afternoon: false, evening: false },
    })
  }

  const handleGenerateWeeklySlots = () => {
    setPlanMessage('')

    if (!selectedDoctorId) {
      setPlanMessage('請先選擇醫師，再建立門診時間表。')
      return
    }

    const weekCount = Math.max(1, Math.min(12, Number(planWeeks) || 1))
    const maxPatients = Math.max(1, Number(planMaxPatients) || 20)
    const normalizedMonday = toMondayDateInput(planStartDate)
    setPlanStartDate(normalizedMonday)

    const startMonday = new Date(`${normalizedMonday}T00:00:00`)
    const slots: Array<{ doctorId: string; date: string; startTime: string; endTime: string; maxPatients: number }> = []

    for (let weekIndex = 0; weekIndex < weekCount; weekIndex += 1) {
      for (const weekday of weekdayDefinitions) {
        const targetDate = new Date(startMonday)
        targetDate.setDate(startMonday.getDate() + weekIndex * 7 + weekday.offset)
        const targetDateString = toDateInputValue(targetDate)

        for (const period of periodDefinitions) {
          if (!scheduleMatrix[weekday.key][period.key]) continue

          slots.push({
            doctorId: selectedDoctorId,
            date: toApiDate(targetDateString),
            startTime: period.startTime,
            endTime: period.endTime,
            maxPatients,
          })
        }
      }
    }

    if (slots.length === 0) {
      setPlanMessage('目前沒有勾選任何門診時段。')
      return
    }

    createSlotBatch.mutate(slots)
  }

  const selectedSessionsPerWeek = weekdayDefinitions.reduce((sum, weekday) => {
    return sum + periodDefinitions.filter((period) => scheduleMatrix[weekday.key][period.key]).length
  }, 0)

  const monthTitle = useMemo(() => {
    const [yearText, monthText] = calendarMonth.split('-')
    return `${yearText} 年 ${Number(monthText)} 月`
  }, [calendarMonth])

  const periodTextByStartTime = useMemo(() => {
    return periodDefinitions.reduce<Record<string, string>>((acc, period) => {
      acc[period.startTime] = period.label
      return acc
    }, {})
  }, [])

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
                onChange={(event) => {
                  setSelectedDate(event.target.value)
                  setCalendarMonth(event.target.value.slice(0, 7))
                }}
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

      <section className="mt-6 rounded-2xl border border-app-border bg-white p-4 shadow-soft md:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-app-text">每週時段月曆</h2>
            <p className="mt-2 text-sm text-app-muted">可視化查看本月每天已建立時段，快速檢查週一到週六開診狀態。</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setCalendarMonth((prev) => addMonths(prev, -1))}
              className="min-h-[44px] min-w-[44px] cursor-pointer rounded-xl border border-app-border bg-app-panel px-3 text-lg font-bold text-app-text transition-colors hover:bg-cyan-50"
              aria-label="上個月"
            >
              ‹
            </button>
            <input
              type="month"
              value={calendarMonth}
              onChange={(event) => setCalendarMonth(event.target.value)}
              className="min-h-[44px] rounded-xl border border-app-border bg-white px-3 text-base text-app-text"
            />
            <button
              type="button"
              onClick={() => setCalendarMonth((prev) => addMonths(prev, 1))}
              className="min-h-[44px] min-w-[44px] cursor-pointer rounded-xl border border-app-border bg-app-panel px-3 text-lg font-bold text-app-text transition-colors hover:bg-cyan-50"
              aria-label="下個月"
            >
              ›
            </button>
          </div>
        </div>

        <p className="mt-3 text-sm font-semibold text-app-text">{monthTitle}</p>

        {!selectedDoctorId ? (
          <p className="mt-4 rounded-xl border border-dashed border-app-border bg-app-panel px-4 py-6 text-center text-sm text-app-muted">
            請先選擇醫師，才能查看該醫師的月曆時段。
          </p>
        ) : monthSlotsLoading ? (
          <p className="mt-4 rounded-xl border border-dashed border-app-border bg-app-panel px-4 py-6 text-center text-sm text-app-muted">
            月曆載入中...
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-xl border border-app-border">
            <div className="grid min-w-[840px] grid-cols-7 divide-x divide-app-border bg-slate-50 text-center text-xs font-semibold uppercase tracking-wide text-app-muted">
              <div className="px-2 py-2">週一</div>
              <div className="px-2 py-2">週二</div>
              <div className="px-2 py-2">週三</div>
              <div className="px-2 py-2">週四</div>
              <div className="px-2 py-2">週五</div>
              <div className="px-2 py-2">週六</div>
              <div className="px-2 py-2">週日</div>
            </div>

            <div className="grid min-w-[840px] grid-cols-7 border-t border-app-border">
              {calendarDays.map((day) => {
                const daySlots = monthSlotMap[day.key] || []
                const dayPeriods = Array.from(new Set(daySlots.map((slot) => periodTextByStartTime[slot.startTime] || slot.startTime)))

                return (
                  <article
                    key={day.key}
                    className={`min-h-[122px] border-r border-b border-app-border px-2 py-2 ${
                      day.inCurrentMonth ? 'bg-white' : 'bg-slate-50/70'
                    } ${day.isSunday ? 'bg-rose-50/40' : ''}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-semibold ${day.inCurrentMonth ? 'text-app-text' : 'text-app-muted'}`}>{day.label}</span>
                      {daySlots.length > 0 && (
                        <span className="rounded-full border border-cyan-200 bg-cyan-50 px-2 py-0.5 text-[11px] font-semibold text-cyan-700">
                          {daySlots.length} 診
                        </span>
                      )}
                    </div>

                    <div className="mt-2 flex flex-wrap gap-1">
                      {dayPeriods.length === 0 ? (
                        <span className="text-xs text-slate-400">—</span>
                      ) : (
                        dayPeriods.map((periodLabel) => (
                          <span key={`${day.key}-${periodLabel}`} className="rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                            {periodLabel}
                          </span>
                        ))
                      )}
                    </div>

                    {day.inCurrentMonth && (
                      <button
                        type="button"
                        onClick={() => setSelectedDate(day.key)}
                        className="mt-2 min-h-[32px] cursor-pointer rounded-lg border border-app-border bg-app-panel px-2 text-[11px] font-semibold text-app-text transition-colors hover:bg-cyan-50"
                      >
                        查看當日時段
                      </button>
                    )}
                  </article>
                )
              })}
            </div>
          </div>
        )}
      </section>

      <section className="mt-6 rounded-2xl border border-app-border bg-white p-4 shadow-soft md:p-6">
        <h2 className="text-2xl font-bold text-app-text">門診時間表（週一至週六）</h2>
        <p className="mt-2 text-sm text-app-muted">依照參考網站設計為上午、下午、晚上三時段，可勾選是否開診並一次建立多週時段。</p>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={applyFullWeekTemplate}
            className="min-h-[44px] cursor-pointer rounded-xl border border-cyan-200 bg-cyan-50 px-4 text-sm font-semibold text-cyan-700 transition-colors hover:bg-cyan-100"
          >
            套用週一至週六三時段
          </button>
          <button
            type="button"
            onClick={applyReferenceTemplate}
            className="min-h-[44px] cursor-pointer rounded-xl border border-app-border bg-app-panel px-4 text-sm font-semibold text-app-text transition-colors hover:bg-cyan-50"
          >
            套用網頁參考範本
          </button>
        </div>

        <div className="mt-4 overflow-x-auto rounded-xl border border-app-border">
          <table className="min-w-[760px] divide-y divide-app-border text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-app-muted">
              <tr>
                <th className="px-4 py-3">時段</th>
                {weekdayDefinitions.map((weekday) => (
                  <th key={weekday.key} className="px-4 py-3 text-center">{weekday.label}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-app-border bg-white">
              {periodDefinitions.map((period) => (
                <tr key={period.key}>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-app-text">{period.label}</p>
                    <p className="text-xs text-app-muted">{period.startTime} - {period.endTime}</p>
                  </td>
                  {weekdayDefinitions.map((weekday) => {
                    const enabled = scheduleMatrix[weekday.key][period.key]
                    return (
                      <td key={`${weekday.key}-${period.key}`} className="px-2 py-3 text-center">
                        <button
                          type="button"
                          aria-pressed={enabled}
                          onClick={() => togglePeriod(weekday.key, period.key)}
                          className={`min-h-[44px] min-w-[88px] cursor-pointer rounded-lg border px-3 text-xs font-semibold transition-colors ${
                            enabled
                              ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                              : 'border-slate-200 bg-slate-100 text-slate-500 hover:bg-slate-200'
                          }`}
                        >
                          {enabled ? '開診' : '休診'}
                        </button>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
          <div>
            <label htmlFor="plan-start" className="mb-1 block text-sm font-semibold text-app-text">起始週（會自動校正為週一）</label>
            <input
              id="plan-start"
              type="date"
              value={planStartDate}
              onChange={(event) => setPlanStartDate(event.target.value)}
              className="min-h-[44px] w-full rounded-xl border border-app-border bg-white px-3 text-base text-app-text"
            />
          </div>
          <div>
            <label htmlFor="plan-weeks" className="mb-1 block text-sm font-semibold text-app-text">建立週數</label>
            <input
              id="plan-weeks"
              type="number"
              min={1}
              max={12}
              value={planWeeks}
              onChange={(event) => setPlanWeeks(event.target.value)}
              className="min-h-[44px] w-full rounded-xl border border-app-border bg-white px-3 text-base text-app-text"
            />
          </div>
          <div>
            <label htmlFor="plan-capacity" className="mb-1 block text-sm font-semibold text-app-text">每時段名額上限</label>
            <input
              id="plan-capacity"
              type="number"
              min={1}
              value={planMaxPatients}
              onChange={(event) => setPlanMaxPatients(event.target.value)}
              className="min-h-[44px] w-full rounded-xl border border-app-border bg-white px-3 text-base text-app-text"
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-app-border bg-app-panel px-4 py-3">
          <p className="text-sm text-app-muted">每週已選 <span className="font-semibold text-app-text">{selectedSessionsPerWeek}</span> 個時段，建立 <span className="font-semibold text-app-text">{Math.max(1, Number(planWeeks) || 1)}</span> 週。</p>
          <button
            type="button"
            onClick={handleGenerateWeeklySlots}
            disabled={!selectedDoctorId || createSlotBatch.isPending}
            className="min-h-[44px] cursor-pointer rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {createSlotBatch.isPending ? '建立中...' : '一鍵建立門診時段'}
          </button>
        </div>

        {planMessage && (
          <p className={`mt-3 rounded-xl border px-4 py-3 text-sm font-medium ${
            planMessage.includes('失敗') || planMessage.includes('請先') || planMessage.includes('沒有勾選')
              ? 'border-rose-200 bg-rose-50 text-rose-700'
              : 'border-emerald-200 bg-emerald-50 text-emerald-700'
          }`}>{planMessage}</p>
        )}
      </section>

      {(createDoctor.isError || deleteDoctor.isError || createSlot.isError || createSlotBatch.isError) && (
        <p role="alert" className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          作業失敗，請檢查資料後再試。
        </p>
      )}

      {(createDoctor.isSuccess || createSlot.isSuccess || createSlotBatch.isSuccess) && (
        <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          已完成儲存。
        </p>
      )}
    </Layout>
  )
}
