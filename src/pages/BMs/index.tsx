import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../../store'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { statusBMColor, formatDate } from '../../utils/format'
import type { StatusBM } from '../../types'

interface BMRow {
  clientId: string
  clientName: string
  tipo: 'Receptiva' | 'Ativa'
  nome: string
  idBM: string
  status: StatusBM
  cnpjUsado: string
  dominio: string
  dataEnvio: string
  dataAprovacao: string
  observacoes: string
}

const STATUS_FILTER: Array<StatusBM | 'Todos'> = [
  'Todos', 'Não iniciada', 'Criando', 'Dados preenchidos', 'Site/domínio pendente',
  'Verificação enviada', 'Em análise', 'Aprovada', 'Recusada', 'Com pendência',
]

export function BMs() {
  const clients = useStore((s) => s.clients)
  const navigate = useNavigate()
  const [tipoFilter, setTipoFilter] = useState<'Todos' | 'Receptiva' | 'Ativa'>('Todos')
  const [statusFilter, setStatusFilter] = useState<StatusBM | 'Todos'>('Todos')

  const rows: BMRow[] = []
  clients.forEach((c) => {
    if (c.bmReceptiva.nome || c.bmReceptiva.status !== 'Não iniciada') {
      rows.push({
        clientId: c.id,
        clientName: c.nome,
        tipo: 'Receptiva',
        nome: c.bmReceptiva.nome,
        idBM: c.bmReceptiva.idBM,
        status: c.bmReceptiva.status,
        cnpjUsado: c.bmReceptiva.cnpjUsado,
        dominio: c.bmReceptiva.dominio,
        dataEnvio: c.bmReceptiva.dataEnvioVerificacao,
        dataAprovacao: c.bmReceptiva.dataAprovacao,
        observacoes: c.bmReceptiva.observacoes,
      })
    }
    if (c.bmAtiva.nome || c.bmAtiva.status !== 'Não iniciada') {
      rows.push({
        clientId: c.id,
        clientName: c.nome,
        tipo: 'Ativa',
        nome: c.bmAtiva.nome,
        idBM: c.bmAtiva.idBM,
        status: c.bmAtiva.status,
        cnpjUsado: c.bmAtiva.cnpjUsado,
        dominio: c.bmAtiva.dominio,
        dataEnvio: c.bmAtiva.dataEnvioVerificacao,
        dataAprovacao: c.bmAtiva.dataAprovacao,
        observacoes: c.bmAtiva.observacoes,
      })
    }
  })

  const filtered = rows.filter((r) => {
    const matchTipo = tipoFilter === 'Todos' || r.tipo === tipoFilter
    const matchStatus = statusFilter === 'Todos' || r.status === statusFilter
    return matchTipo && matchStatus
  })

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">BMs</h1>
        <p className="text-sm text-gray-500 mt-1">{filtered.length} BM(s) encontrada(s)</p>
      </div>

      <div className="flex gap-3 mb-4 flex-wrap">
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
          onChange={(e) => setStatusFilter(e.target.value as StatusBM | 'Todos')}
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
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Tipo</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Nome BM</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">ID</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">CNPJ</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Domínio</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Envio</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Aprovação</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row, i) => (
                <tr key={`${row.clientId}-${row.tipo}-${i}`} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{row.clientName}</td>
                  <td className="px-4 py-3">
                    <Badge
                      label={row.tipo}
                      className={row.tipo === 'Receptiva' ? 'bg-blue-100 text-blue-800 border-blue-200' : 'bg-purple-100 text-purple-800 border-purple-200'}
                    />
                  </td>
                  <td className="px-4 py-3 text-gray-700">{row.nome || '—'}</td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs text-gray-600">{row.idBM || '—'}</span>
                  </td>
                  <td className="px-4 py-3">
                    <Badge label={row.status} className={statusBMColor(row.status)} />
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600">{row.cnpjUsado || '—'}</td>
                  <td className="px-4 py-3 text-xs text-gray-600">{row.dominio || '—'}</td>
                  <td className="px-4 py-3 text-xs text-gray-600">{formatDate(row.dataEnvio)}</td>
                  <td className="px-4 py-3 text-xs text-gray-600">{formatDate(row.dataAprovacao)}</td>
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
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-gray-400">
                    Nenhuma BM encontrada.
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
