import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../../store'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { statusNumeroColor } from '../../utils/format'
import type { StatusNumero } from '../../types'

interface NumberRow {
  clientId: string
  clientName: string
  tipo: 'Receptivo' | 'Ativo'
  ddd: string
  numero: string
  operadora: string
  statusChip: string
  conectadoBM: boolean
  conectadoDataCrazy: boolean
  testeRealizado: boolean
  statusFinal: StatusNumero
  observacoes: string
}

const STATUS_FILTER: Array<StatusNumero | 'Todos'> = [
  'Todos', 'Não iniciado', 'Aguardando número', 'Número separado', 'Chip ativado',
  'Conectando na BM', 'Conectando no DataCrazy', 'Em teste', 'Pronto', 'Com erro', 'Com pendência',
]

export function Numbers() {
  const clients = useStore((s) => s.clients)
  const navigate = useNavigate()
  const [tipoFilter, setTipoFilter] = useState<'Todos' | 'Receptivo' | 'Ativo'>('Todos')
  const [statusFilter, setStatusFilter] = useState<StatusNumero | 'Todos'>('Todos')
  const [dddFilter, setDddFilter] = useState('')

  const rows: NumberRow[] = []
  clients.forEach((c) => {
    if (c.numeroReceptivo.numero || c.numeroReceptivo.statusFinal !== 'Não iniciado') {
      rows.push({
        clientId: c.id,
        clientName: c.nome,
        tipo: 'Receptivo',
        ddd: c.numeroReceptivo.ddd,
        numero: c.numeroReceptivo.numero,
        operadora: c.numeroReceptivo.operadora,
        statusChip: c.numeroReceptivo.statusChip,
        conectadoBM: c.numeroReceptivo.conectadoBM,
        conectadoDataCrazy: c.numeroReceptivo.conectadoDataCrazy,
        testeRealizado: c.numeroReceptivo.testeRealizado,
        statusFinal: c.numeroReceptivo.statusFinal,
        observacoes: c.numeroReceptivo.observacoes,
      })
    }
    if (c.numeroAtivo.numero || c.numeroAtivo.statusFinal !== 'Não iniciado') {
      rows.push({
        clientId: c.id,
        clientName: c.nome,
        tipo: 'Ativo',
        ddd: c.numeroAtivo.ddd,
        numero: c.numeroAtivo.numero,
        operadora: c.numeroAtivo.operadora,
        statusChip: c.numeroAtivo.statusChip,
        conectadoBM: c.numeroAtivo.conectadoBM,
        conectadoDataCrazy: c.numeroAtivo.conectadoDataCrazy,
        testeRealizado: c.numeroAtivo.testeRealizado,
        statusFinal: c.numeroAtivo.statusFinal,
        observacoes: c.numeroAtivo.observacoes,
      })
    }
  })

  const filtered = rows.filter((r) => {
    const matchTipo = tipoFilter === 'Todos' || r.tipo === tipoFilter
    const matchStatus = statusFilter === 'Todos' || r.statusFinal === statusFilter
    const matchDDD = !dddFilter || r.ddd.includes(dddFilter)
    return matchTipo && matchStatus && matchDDD
  })

  const yesNo = (v: boolean) => (
    <span className={`text-xs font-medium ${v ? 'text-green-600' : 'text-gray-400'}`}>
      {v ? 'Sim' : 'Não'}
    </span>
  )

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Números</h1>
        <p className="text-sm text-gray-500 mt-1">{filtered.length} número(s) encontrado(s)</p>
      </div>

      <div className="flex gap-3 mb-4 flex-wrap">
        <select
          value={tipoFilter}
          onChange={(e) => setTipoFilter(e.target.value as typeof tipoFilter)}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="Todos">Todos os tipos</option>
          <option value="Receptivo">Receptivo</option>
          <option value="Ativo">Ativo</option>
        </select>
        <input
          type="text"
          placeholder="Filtrar por DDD..."
          value={dddFilter}
          onChange={(e) => setDddFilter(e.target.value)}
          maxLength={3}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm w-36 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusNumero | 'Todos')}
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
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">DDD</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Número</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Operadora</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">BM</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">DataCrazy</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Testado</th>
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
                      className={row.tipo === 'Receptivo' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-purple-100 text-purple-800 border-purple-200'}
                    />
                  </td>
                  <td className="px-4 py-3 text-gray-700">{row.ddd || '—'}</td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-sm text-gray-900">{row.numero || '—'}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{row.operadora}</td>
                  <td className="px-4 py-3">
                    <Badge label={row.statusFinal} className={statusNumeroColor(row.statusFinal)} />
                  </td>
                  <td className="px-4 py-3">{yesNo(row.conectadoBM)}</td>
                  <td className="px-4 py-3">{yesNo(row.conectadoDataCrazy)}</td>
                  <td className="px-4 py-3">{yesNo(row.testeRealizado)}</td>
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
                    Nenhum número encontrado.
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
