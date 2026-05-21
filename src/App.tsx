import { useEffect, useState, Component, type ReactNode } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useStore } from './store'
import { supabase } from './lib/supabase'
import { LoginPage } from './pages/Login'

type LoginStep = 'credentials' | 'mfa-challenge' | 'mfa-enroll' | 'mfa-enroll-verify'
type AuthStatus = 'checking' | 'login' | 'authenticated'

class ErrorBoundary extends Component<{ children: ReactNode }, { error: string | null }> {
  state = { error: null }
  static getDerivedStateFromError(e: Error) { return { error: e.message + '\n' + e.stack } }
  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
          <div className="bg-white border border-red-200 rounded-xl p-6 max-w-2xl w-full">
            <p className="text-sm font-bold text-red-700 mb-2">Erro de renderização</p>
            <pre className="text-xs text-red-600 bg-red-50 rounded p-3 overflow-auto whitespace-pre-wrap max-h-64">{this.state.error}</pre>
            <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
              Recarregar
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

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
  const [authStatus, setAuthStatus] = useState<AuthStatus>('checking')
  const [loginStep, setLoginStep] = useState<LoginStep>('credentials')

  const loadClients = useStore((s) => s.loadClients)
  const loading = useStore((s) => s.loading)
  const loadError = useStore((s) => s.loadError)

  useEffect(() => {
    checkAuth()

    // Listen for sign-out or session expiry
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
        // On sign-out go back to login; on token refresh re-check auth level
        if (event === 'SIGNED_OUT') {
          setAuthStatus('login')
          setLoginStep('credentials')
        }
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function checkAuth() {
    try {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        setAuthStatus('login')
        setLoginStep('credentials')
        return
      }

      const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()

      if (aal?.currentLevel === 'aal2') {
        // Fully authenticated
        setAuthStatus('authenticated')
        loadClients()
        return
      }

      // AAL1 session — determine which login step to resume
      const { data: factors } = await supabase.auth.mfa.listFactors()
      const hasVerifiedFactor = factors?.totp?.some((f) => f.status === 'verified') ?? false

      setLoginStep(hasVerifiedFactor ? 'mfa-challenge' : 'credentials')
      setAuthStatus('login')
    } catch {
      setAuthStatus('login')
      setLoginStep('credentials')
    }
  }

  function handleAuthenticated() {
    setAuthStatus('authenticated')
    loadClients()
  }

  // ── Auth gate ──────────────────────────────────
  if (authStatus === 'checking') return <LoadingScreen />

  if (authStatus === 'login') {
    return <LoginPage initialStep={loginStep} onAuthenticated={handleAuthenticated} />
  }

  // ── Authenticated — wait for data ──────────────
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
    <ErrorBoundary>
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
    </ErrorBoundary>
  )
}
