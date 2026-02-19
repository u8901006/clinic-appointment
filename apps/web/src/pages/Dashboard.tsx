import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import Layout from '../components/Layout'

export default function Dashboard() {
  const { data: todayAppointments } = useQuery({
    queryKey: ['appointments', 'today'],
    queryFn: async () => {
      const res = await axios.get('/api/v1/appointments/today')
      return res.data
    }
  })

  return (
    <Layout>
      <h1 className="text-2xl font-bold mb-6">儀表板</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-600">今日預約</h2>
          <p className="text-3xl font-bold text-blue-600">{todayAppointments?.length || 0}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-600">待診人數</h2>
          <p className="text-3xl font-bold text-yellow-600">
            {todayAppointments?.filter((a: any) => a.status === 'BOOKED').length || 0}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-600">已完成</h2>
          <p className="text-3xl font-bold text-green-600">
            {todayAppointments?.filter((a: any) => a.status === 'COMPLETED').length || 0}
          </p>
        </div>
      </div>
    </Layout>
  )
}
