import { useQuery } from '@tanstack/react-query'
import api from '../lib/api'
import Layout from '../components/Layout'

export default function Reports() {
  const today = new Date()
  const year = today.getFullYear()
  const month = today.getMonth() + 1

  const { data: dailyReport, isLoading: dailyLoading } = useQuery({
    queryKey: ['reports', 'daily'],
    queryFn: async () => {
      const res = await api.get('/reports/daily')
      return res.data
    }
  })

  const { data: monthlyReport, isLoading: monthlyLoading } = useQuery({
    queryKey: ['reports', 'monthly', year, month],
    queryFn: async () => {
      const res = await api.get(`/reports/monthly?year=${year}&month=${month}`)
      return res.data
    }
  })

  return (
    <Layout>
      <h1 className="text-2xl font-bold mb-6">報表統計</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">今日報表</h2>
          {dailyLoading ? (
            <p>載入中...</p>
          ) : (
            <div>
              <div className="mb-4">
                <span className="text-gray-500">總預約數：</span>
                <span className="text-2xl font-bold">{dailyReport?.total || 0}</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-yellow-50 p-3 rounded">
                  <div className="text-sm text-gray-500">已預約</div>
                  <div className="text-xl font-bold text-yellow-600">{dailyReport?.byStatus?.booked || 0}</div>
                </div>
                <div className="bg-blue-50 p-3 rounded">
                  <div className="text-sm text-gray-500">已報到</div>
                  <div className="text-xl font-bold text-blue-600">{dailyReport?.byStatus?.checkedIn || 0}</div>
                </div>
                <div className="bg-green-50 p-3 rounded">
                  <div className="text-sm text-gray-500">已完成</div>
                  <div className="text-xl font-bold text-green-600">{dailyReport?.byStatus?.completed || 0}</div>
                </div>
                <div className="bg-red-50 p-3 rounded">
                  <div className="text-sm text-gray-500">已取消</div>
                  <div className="text-xl font-bold text-red-600">{dailyReport?.byStatus?.cancelled || 0}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">{year}年{month}月報表</h2>
          {monthlyLoading ? (
            <p>載入中...</p>
          ) : (
            <div>
              <div className="mb-4">
                <span className="text-gray-500">總預約數：</span>
                <span className="text-2xl font-bold">{monthlyReport?.total || 0}</span>
              </div>
              <div className="mb-4">
                <span className="text-gray-500">日均預約：</span>
                <span className="text-xl font-bold">{monthlyReport?.dailyAverage?.toFixed(1) || 0}</span>
              </div>
              <div>
                <h3 className="text-sm text-gray-500 mb-2">各醫師預約數</h3>
                {Object.entries(monthlyReport?.byDoctor || {}).map(([name, count]) => (
                  <div key={name} className="flex justify-between py-1">
                    <span>{name}</span>
                    <span className="font-semibold">{count as number}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
