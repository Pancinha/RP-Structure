import { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useStore } from './store'
import { Layout } from './components/layout/Layout'
import { Dashboard } from './pages/Dashboard'
import { Clients } from './pages/Clients'
import { ClientDetail } from './pages/ClientDetail'
import { Tasks } from './pages/Tasks'
import { BMs } from './pages/BMs'
import { Numbers } from './pages/Numbers'
import { Automations } from './pages/Automations'
import { Pendencias } from './pages/Pendencias'
import { Settings } from './pages/Settings'

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm font-medium text-gray-600">Carregando dados...</p>
        <p className="text-xs text-gray-400 mt-1">Conectando ao banco de dados</p>
      </div>
    </div>
  )
}

export default function App() {
  const loadClients = useStore((s) => s.loadClients)
  const loading = useStore((s) => s.loading)
  const loadError = useStore((s) => s.loadError)

  useEffect(() => {
    loadClients()
  }, [loadClients])

  if (loading) return <LoadingScreen />

  if (loadError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="bg-white border border-red-200 rounded-xl p-6 max-w-lg w-full">
          <p className="text-sm font-bold text-red-700 mb-2">Erro ao conectar com o banco de dados</p>
          <pre className="text-xs text-red-600 bg-red-50 rounded p-3 overflow-auto whitespace-pre-wrap">{loadError}</pre>
          <button
            onClick={() => loadClients()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="clientes" element={<Clients />} />
          <Route path="clientes/:id" element={<ClientDetail />} />
          <Route path="tarefas" element={<Tasks />} />
          <Route path="bms" element={<BMs />} />
          <Route path="numeros" element={<Numbers />} />
          <Route path="automacoes" element={<Automations />} />
          <Route path="pendencias" element={<Pendencias />} />
          <Route path="configuracoes" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
