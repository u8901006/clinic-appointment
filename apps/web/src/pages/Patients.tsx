import { useQuery } from '@tanstack/react-query'
import api from '../lib/api'
import Layout from '../components/Layout'

export default function Patients() {
  const { data: patients, isLoading } = useQuery({
    queryKey: ['patients'],
    queryFn: async () => {
      const res = await api.get('/patients')
      return res.data
    }
  })

  return (
    <Layout>
      <h1 className="text-2xl font-bold mb-6">病患管理</h1>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">姓名</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">電話</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">預約次數</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">建立時間</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading ? (
              <tr><td colSpan={4} className="px-6 py-4 text-center">載入中...</td></tr>
            ) : patients?.length === 0 ? (
              <tr><td colSpan={4} className="px-6 py-4 text-center text-gray-500">尚無病患資料</td></tr>
            ) : (
              patients?.map((patient: any) => (
                <tr key={patient.id}>
                  <td className="px-6 py-4 whitespace-nowrap">{patient.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{patient.phone}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{patient._count?.appointments || 0}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{new Date(patient.createdAt).toLocaleDateString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Layout>
  )
}
