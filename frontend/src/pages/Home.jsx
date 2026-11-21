import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api/client'

async function checkBackend() {
  try {
    await api.get('/me')
    return { status: 200 }
  } catch (err) {
    // Any HTTP response (even 401) means the backend is reachable.
    if (err.response) return { status: err.response.status }
    throw err // no response at all = network/proxy problem
  }
}

export default function Home() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['backend-check'],
    queryFn: checkBackend,
    retry: false,
  })

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-3 bg-slate-50">
      <h1 className="text-3xl font-bold text-indigo-600">
        Placement Preparation Tracker
      </h1>
      {isLoading && <p className="text-slate-500">Checking backend...</p>}
      {isError && <p className="text-red-600">Backend not reachable</p>}
      {data && (
        <p className="text-green-600">Backend reachable (HTTP {data.status})</p>
      )}
    </main>
  )
}