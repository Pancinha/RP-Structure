import { useState, useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  CheckSquare,
  Building2,
  Flame,
  Phone,
  Zap,
  AlertCircle,
  Settings,
  Download,
  CheckCircle,
  LogOut,
} from 'lucide-react'
import { useStore } from '../../store'
import { supabase } from '../../lib/supabase'

const BACKUP_KEY = 'rp-structure-last-backup'

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/clientes', label: 'Clientes', icon: Users },
  { to: '/tarefas', label: 'Tarefas', icon: CheckSquare },
  { to: '/bms', label: 'BMs', icon: Building2 },
  { to: '/aquecimento', label: 'Aquecimento', icon: Flame },
  { to: '/numeros', label: 'Números', icon: Phone },
  { to: '/automacoes', label: 'Automações', icon: Zap },
  { to: '/pendencias', label: 'Pendências', icon: AlertCircle },
  { to: '/configuracoes', label: 'Configurações', icon: Settings },
]

function getLastBackup(): string | null {
  return localStorage.getItem(BACKUP_KEY)
}

function backupDoneToday(): boolean {
  const last = getLastBackup()
  if (!last) return false
  const lastDate = new Date(last).toDateString()
  return lastDate === new Date().toDateString()
}

export function Sidebar() {
  const clients = useStore((s) => s.clients)
  const pendencias = clients.filter(
    (c) => c.statusGeral === 'Cliente com pendência' || c.pendencia
  ).length
  const [doneToday, setDoneToday] = useState(backupDoneToday())
  const [justExported, setJustExported] = useState(false)

  useEffect(() => {
    setDoneToday(backupDoneToday())
  }, [])

  function handleExport() {
    const data = JSON.stringify({ clients, exportedAt: new Date().toISOString() }, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `rp-structure-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    const now = new Date().toISOString()
    localStorage.setItem(BACKUP_KEY, now)
    setDoneToday(true)
    setJustExported(true)
    setTimeout(() => setJustExported(false), 3000)
  }

  const lastBackup = getLastBackup()
  const lastBackupLabel = lastBackup
    ? new Date(lastBackup).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
    : null

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-screen sticky top-0">
      <div className="p-5 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white text-xs font-bold">RP</span>
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900 leading-none">RP Structure</p>
            <p className="text-xs text-gray-500">Gestão de implantações</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 overflow-y-auto">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors relative ${
                    isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`
                }
              >
                <item.icon size={18} />
                {item.label}
                {item.to === '/pendencias' && pendencias > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {pendencias}
                  </span>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Backup diário */}
      <div className={`mx-3 mb-3 rounded-lg p-3 border ${doneToday ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
        <div className="flex items-center gap-2 mb-2">
          {doneToday
            ? <CheckCircle size={14} className="text-green-600 flex-shrink-0" />
            : <Download size={14} className="text-red-500 flex-shrink-0" />
          }
          <p className={`text-xs font-semibold ${doneToday ? 'text-green-800' : 'text-red-800'}`}>
            {doneToday ? 'Backup feito hoje' : 'Backup pendente hoje'}
          </p>
        </div>
        {lastBackupLabel && (
          <p className="text-xs text-gray-500 mb-2">Último: {lastBackupLabel}</p>
        )}
        <button
          onClick={handleExport}
          className={`w-full flex items-center justify-center gap-1.5 px-2 py-1.5 rounded text-xs font-medium transition-colors ${
            justExported
              ? 'bg-green-600 text-white'
              : doneToday
              ? 'bg-green-100 text-green-800 hover:bg-green-200'
              : 'bg-red-600 text-white hover:bg-red-700'
          }`}
        >
          <Download size={12} />
          {justExported ? 'Exportado!' : 'Exportar backup agora'}
        </button>
      </div>

      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-gray-700 text-xs font-medium">R</span>
          </div>
          <span className="text-sm text-gray-700 font-medium flex-1 truncate">Rafael</span>
          <button
            onClick={() => supabase.auth.signOut()}
            title="Sair"
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  )
}
