import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'
import Layout from '../components/Layout'

export default function Appointments() {
  const queryClient = useQueryClient()

  const { data: appointments, isLoading } = useQuery({
    queryKey: ['appointments', 'today'],
    queryFn: async () => {
      const res = await api.get('/appointments/today')
      return res.data
    }
  })

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await api.patch(`/appointments/${id}/status`, { status })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments', 'today'] })
    }
  })

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      BOOKED: 'bg-yellow-100 text-yellow-800',
      CHECKED_IN: 'bg-blue-100 text-blue-800',
      COMPLETED: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-red-100 text-red-800'
    }
    const labels: Record<string, string> = {
      BOOKED: '已預約',
      CHECKED_IN: '已報到',
      COMPLETED: '已完成',
      CANCELLED: '已取消'
    }
    return <span className={`px-2 py-1 rounded text-sm ${colors[status]}`}>{labels[status]}</span>
  }

  return (
    <Layout>
      <h1 className="text-2xl font-bold mb-6">今日預約管理</h1>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">號碼</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">病患</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">醫師</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">時段</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">狀態</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading ? (
              <tr><td colSpan={6} className="px-6 py-4 text-center">載入中...</td></tr>
            ) : appointments?.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-4 text-center text-gray-500">今日尚無預約</td></tr>
            ) : (
              appointments?.map((apt: any) => (
                <tr key={apt.id}>
                  <td className="px-6 py-4 whitespace-nowrap font-bold text-lg">{apt.queueNumber}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{apt.patient?.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{apt.timeSlot?.doctor?.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{apt.timeSlot?.startTime} - {apt.timeSlot?.endTime}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(apt.status)}</td>
                  <td className="px-6 py-4 whitespace-nowrap space-x-2">
                    {apt.status === 'BOOKED' && (
                      <>
                        <button
                          onClick={() => updateStatus.mutate({ id: apt.id, status: 'CHECKED_IN' })}
                          className="text-blue-600 hover:text-blue-800"
                        >報到</button>
                        <button
                          onClick={() => updateStatus.mutate({ id: apt.id, status: 'CANCELLED' })}
                          className="text-red-600 hover:text-red-800"
                        >取消</button>
                      </>
                    )}
                    {apt.status === 'CHECKED_IN' && (
                      <button
                        onClick={() => updateStatus.mutate({ id: apt.id, status: 'COMPLETED' })}
                        className="text-green-600 hover:text-green-800"
                      >完成</button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Layout>
  )
}
