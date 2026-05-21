import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../../store'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { statusAutomacaoColor, formatDate } from '../../utils/format'
import type { StatusAutomacao, TipoAutomacao } from '../../types'

const STATUS_FILTER: Array<StatusAutomacao | 'Todos'> = [
  'Todos', 'Não iniciada', 'Em configuração', 'Configurada', 'Testada', 'Ativa', 'Com erro', 'Pausada',
]

export function Automations() {
  const clients = useStore((s) => s.clients)
  const navigate = useNavigate()
  const [tipoFilter, setTipoFilter] = useState<'Todos' | TipoAutomacao>('Todos')
  const [statusFilter, setStatusFilter] = useState<StatusAutomacao | 'Todos'>('Todos')

  const rows = clients.flatMap((c) =>
    c.dataCrazy.automacoes.map((a) => ({
      ...a,
      clientId: c.id,
      clientName: c.nome,
    }))
  ).filter((r) => {
    const matchTipo = tipoFilter === 'Todos' || r.tipo === tipoFilter
    const matchStatus = statusFilter === 'Todos' || r.status === statusFilter
    return matchTipo && matchStatus
  })

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Automações</h1>
        <p className="text-sm text-gray-500 mt-1">{rows.length} automação(ões) encontrada(s)</p>
      </div>

      <div className="flex gap-3 mb-4">
        <select
          value={tipoFilter}
          onChange={(e) => setTipoFilter(e.target.value as typeof tipoFilter)}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="Todos">Todos os tipos</option>
          <option value="Receptiva">Receptiva</option>
          <option value="Ativa">Ativa</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusAutomacao | 'Todos')}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {STATUS_FILTER.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Cliente</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Automação</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Tipo</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Número usado</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Último teste</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Observações</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={`${row.clientId}-${row.id}`} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{row.clientName}</td>
                  <td className="px-4 py-3 text-gray-900">{row.nome}</td>
                  <td className="px-4 py-3">
                    <Badge
                      label={row.tipo}
                      className={row.tipo === 'Receptiva' ? 'bg-blue-100 text-blue-800 border-blue-200' : 'bg-purple-100 text-purple-800 border-purple-200'}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs text-gray-600">{row.numeroUsado || '—'}</span>
                  </td>
                  <td className="px-4 py-3">
                    <Badge label={row.status} className={statusAutomacaoColor(row.status)} />
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600">{formatDate(row.dataUltimoTeste)}</td>
                  <td className="px-4 py-3 text-xs text-gray-500 max-w-40 truncate" title={row.observacoes}>
                    {row.observacoes || '—'}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => navigate(`/clientes/${row.clientId}`)}
                      className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                    >
                      Abrir →
                    </button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-400">
                    Nenhuma automação encontrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
