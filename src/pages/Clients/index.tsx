import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Filter } from 'lucide-react'
import { useStore } from '../../store'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { NewClientModal } from './NewClientModal'
import {
  statusGeralColor,
  priorityColor,
  formatDate,
  isOverdue,
  isDueToday,
} from '../../utils/format'
import type { StatusGeral, Prioridade } from '../../types'

const STATUS_FILTER_OPTIONS: Array<StatusGeral | 'Todos'> = [
  'Todos',
  'Aguardando dados/acesso',
  'Aguardando código Facebook',
  'Primeiro acesso realizado',
  'Aguardando 24h',
  'Criando BM receptiva',
  'BM receptiva em análise',
  'BM receptiva aprovada',
  'Configurando número receptivo',
  'Receptivo pronto',
  'Criando BM ativa',
  'BM ativa em análise',
  'BM ativa aprovada',
  'Configurando número ativo',
  'Configurando DataCrazy',
  'Configurando automações',
  'Cliente pronto',
  'Cliente com pendência',
  'Cliente pausado',
  'Cliente cancelado',
]

export function Clients() {
  const clients = useStore((s) => s.clients)
  const deleteClient = useStore((s) => s.deleteClient)
  const navigate = useNavigate()
  const [newOpen, setNewOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusGeral | 'Todos'>('Todos')
  const [prioFilter, setPrioFilter] = useState<Prioridade | 'Todas'>('Todas')
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const filtered = clients.filter((c) => {
    const matchSearch =
      !search ||
      c.nome.toLowerCase().includes(search.toLowerCase()) ||
      c.nomeConhecido.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'Todos' || c.statusGeral === statusFilter
    const matchPrio = prioFilter === 'Todas' || c.prioridade === prioFilter
    return matchSearch && matchStatus && matchPrio
  })

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
          <p className="text-sm text-gray-500 mt-1">{clients.length} cliente(s) cadastrado(s)</p>
        </div>
        <Button variant="primary" onClick={() => setNewOpen(true)}>
          <Plus size={16} />
          Novo cliente
        </Button>
      </div>

      <Card className="mb-4">
        <div className="p-4 flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2 flex-1 min-w-48">
            <Search size={16} className="text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nome..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 border-0 outline-none text-sm text-gray-700 placeholder-gray-400"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusGeral | 'Todos')}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {STATUS_FILTER_OPTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <select
              value={prioFilter}
              onChange={(e) => setPrioFilter(e.target.value as Prioridade | 'Todas')}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Todas">Todas prioridades</option>
              {(['Baixa', 'Média', 'Alta', 'Urgente'] as Prioridade[]).map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Cliente</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Receptivo</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Ativo</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">DataCrazy</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Próxima ação</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Prazo</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Prioridade</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((client) => {
                const overdue = isOverdue(client.prazoProximaAcao)
                const today = isDueToday(client.prazoProximaAcao)
                return (
                  <tr
                    key={client.id}
                    className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                      overdue ? 'bg-red-50/40' : today ? 'bg-yellow-50/40' : ''
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-900">{client.nome}</p>
                        <p className="text-xs text-gray-500">{client.nomeConhecido} · DDD {client.ddd}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge label={client.statusGeral} className={statusGeralColor(client.statusGeral)} />
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        label={client.statusReceptivo}
                        className={
                          client.statusReceptivo === 'Pronto'
                            ? 'bg-green-100 text-green-800 border-green-200'
                            : 'bg-gray-100 text-gray-600 border-gray-200'
                        }
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        label={client.statusAtivo}
                        className={
                          client.statusAtivo === 'Pronto'
                            ? 'bg-green-100 text-green-800 border-green-200'
                            : 'bg-gray-100 text-gray-600 border-gray-200'
                        }
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        label={client.statusDataCrazy}
                        className={
                          client.statusDataCrazy === 'Pronto'
                            ? 'bg-green-100 text-green-800 border-green-200'
                            : 'bg-gray-100 text-gray-600 border-gray-200'
                        }
                      />
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-gray-700 max-w-44 truncate text-xs" title={client.proximaAcao}>
                        {client.proximaAcao || '—'}
                      </p>
                      {client.pendencia && (
                        <p className="text-red-500 text-xs mt-0.5 truncate" title={client.pendencia}>
                          ⚠ {client.pendencia}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {client.prazoProximaAcao ? (
                        <span
                          className={`text-xs ${
                            overdue ? 'text-red-600 font-semibold' : today ? 'text-yellow-600 font-semibold' : 'text-gray-600'
                          }`}
                        >
                          {formatDate(client.prazoProximaAcao)}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge label={client.prioridade} className={priorityColor(client.prioridade)} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => navigate(`/clientes/${client.id}`)}
                          className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                        >
                          Abrir
                        </button>
                        <span className="text-gray-300">|</span>
                        <button
                          onClick={() => setConfirmDelete(client.id)}
                          className="text-red-500 hover:text-red-700 text-xs font-medium"
                        >
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-gray-400 text-sm">
                    Nenhum cliente encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <NewClientModal open={newOpen} onClose={() => setNewOpen(false)} />

      <ConfirmDialog
        open={!!confirmDelete}
        title="Excluir cliente"
        message="Tem certeza que deseja excluir este cliente? Todos os dados serão perdidos permanentemente."
        confirmLabel="Excluir"
        danger
        onConfirm={() => {
          if (confirmDelete) deleteClient(confirmDelete)
          setConfirmDelete(null)
        }}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  )
}
