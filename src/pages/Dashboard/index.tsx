import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users, AlertCircle, Building2, Clock,
  ChevronRight, TrendingUp, AlertTriangle, Search, X,
} from 'lucide-react'
import { useStore } from '../../store'
import { Badge } from '../../components/ui/Badge'
import { Card } from '../../components/ui/Card'
import {
  statusGeralColor,
  priorityColor,
  formatDate,
  isOverdue,
  isDueToday,
  progressScore,
} from '../../utils/format'
import type { Prioridade } from '../../types'

const PIPELINE_STAGES = [
  { label: 'Aguardando dados', key: 'Aguardando dados/acesso' },
  { label: 'Facebook', key: 'facebook' },
  { label: 'BM Receptiva', key: 'bm_receptiva' },
  { label: 'Nº Receptivo', key: 'numero_receptivo' },
  { label: 'BM Ativa', key: 'bm_ativa' },
  { label: 'Nº Ativo / DC', key: 'dc' },
  { label: 'Pronto', key: 'Cliente pronto' },
]

function clientPipelineKey(statusGeral: string): string {
  if (statusGeral === 'Aguardando dados/acesso') return 'Aguardando dados/acesso'
  if (['Aguardando código Facebook', 'Primeiro acesso realizado', 'Aguardando 24h'].includes(statusGeral)) return 'facebook'
  if (['Criando BM receptiva', 'BM receptiva em análise', 'BM receptiva aprovada'].includes(statusGeral)) return 'bm_receptiva'
  if (['Configurando número receptivo', 'Receptivo pronto'].includes(statusGeral)) return 'numero_receptivo'
  if (['Criando BM ativa', 'BM ativa em análise', 'BM ativa aprovada'].includes(statusGeral)) return 'bm_ativa'
  if (['Configurando número ativo', 'Configurando DataCrazy', 'Configurando automações'].includes(statusGeral)) return 'dc'
  if (statusGeral === 'Cliente pronto') return 'Cliente pronto'
  return 'outros'
}

type QuickFilter = 'todos' | 'ativos' | 'pendencia' | 'prontos'

export function Dashboard() {
  const clients = useStore((s) => s.clients)
  const navigate = useNavigate()

  const [quickFilter, setQuickFilter] = useState<QuickFilter>('todos')
  const [prioFilter, setPrioFilter] = useState<Prioridade | 'Todas'>('Todas')
  const [search, setSearch] = useState('')

  // ── Stats (always from all clients) ──────────────────────
  const total = clients.length
  const prontos = clients.filter((c) => c.statusGeral === 'Cliente pronto').length
  const emImplantacao = clients.filter(
    (c) => !['Cliente pronto', 'Cliente cancelado', 'Cliente pausado'].includes(c.statusGeral)
  ).length
  const comAtencao = clients.filter(
    (c) =>
      c.statusGeral === 'Cliente com pendência' ||
      !!c.pendencia ||
      (c.prazoProximaAcao && isOverdue(c.prazoProximaAcao))
  ).length
  const bmsAnalise = clients.filter(
    (c) => c.bmReceptiva.status === 'Em análise' || c.bmAtiva.status === 'Em análise'
  ).length

  const pipelineCounts: Record<string, number> = {}
  PIPELINE_STAGES.forEach((s) => { pipelineCounts[s.key] = 0 })
  clients.forEach((c) => {
    const key = clientPipelineKey(c.statusGeral)
    if (pipelineCounts[key] !== undefined) pipelineCounts[key]++
  })

  const urgentes = clients
    .filter(
      (c) =>
        c.statusGeral !== 'Cliente pronto' &&
        c.statusGeral !== 'Cliente cancelado' &&
        (c.prioridade === 'Urgente' ||
          (c.prazoProximaAcao && (isOverdue(c.prazoProximaAcao) || isDueToday(c.prazoProximaAcao))) ||
          !!c.pendencia)
    )
    .sort((a, b) => {
      const order = { Urgente: 0, Alta: 1, Média: 2, Baixa: 3 }
      return order[a.prioridade] - order[b.prioridade]
    })
    .slice(0, 5)

  // ── Filtered + sorted table ────────────────────────────────
  const filtered = clients
    .filter((c) => {
      if (search) {
        const q = search.toLowerCase()
        if (!c.nome.toLowerCase().includes(q) && !c.nomeConhecido.toLowerCase().includes(q)) return false
      }
      if (prioFilter !== 'Todas' && c.prioridade !== prioFilter) return false
      if (quickFilter === 'ativos') return !['Cliente pronto', 'Cliente cancelado', 'Cliente pausado', 'Cliente com pendência'].includes(c.statusGeral)
      if (quickFilter === 'pendencia') return c.statusGeral === 'Cliente com pendência' || !!c.pendencia
      if (quickFilter === 'prontos') return c.statusGeral === 'Cliente pronto'
      return true
    })
    .sort((a, b) => progressScore(b.statusGeral) - progressScore(a.statusGeral))

  const QUICK_FILTERS: { key: QuickFilter; label: string; count: number }[] = [
    { key: 'todos', label: 'Todos', count: clients.length },
    { key: 'ativos', label: 'Em implantação', count: emImplantacao },
    { key: 'pendencia', label: 'Com pendência', count: comAtencao },
    { key: 'prontos', label: 'Prontos', count: prontos },
  ]

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">Visão geral das implantações</p>
      </div>

      {/* 4 stat cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Total de clientes"
          value={total}
          sub={`${prontos} pronto(s)`}
          icon={<Users size={18} />}
          iconBg="bg-blue-100"
          iconColor="text-blue-600"
        />
        <StatCard
          label="Em implantação"
          value={emImplantacao}
          icon={<Clock size={18} />}
          iconBg="bg-indigo-100"
          iconColor="text-indigo-600"
        />
        <StatCard
          label="Requer atenção"
          value={comAtencao}
          sub="pendências e vencidos"
          icon={<AlertCircle size={18} />}
          iconBg={comAtencao > 0 ? 'bg-red-100' : 'bg-gray-100'}
          iconColor={comAtencao > 0 ? 'text-red-600' : 'text-gray-400'}
          valueColor={comAtencao > 0 ? 'text-red-600' : 'text-gray-900'}
          onClick={() => setQuickFilter('pendencia')}
        />
        <StatCard
          label="BMs em análise"
          value={bmsAnalise}
          sub="aguardando Meta"
          icon={<Building2 size={18} />}
          iconBg={bmsAnalise > 0 ? 'bg-yellow-100' : 'bg-gray-100'}
          iconColor={bmsAnalise > 0 ? 'text-yellow-600' : 'text-gray-400'}
          valueColor={bmsAnalise > 0 ? 'text-yellow-600' : 'text-gray-900'}
        />
      </div>

      {/* Urgent alert */}
      {urgentes.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={16} className="text-red-600" />
            <h2 className="text-sm font-semibold text-red-800">Requer atenção imediata</h2>
            <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
              {urgentes.length}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
            {urgentes.map((c) => {
              const overdue = c.prazoProximaAcao && isOverdue(c.prazoProximaAcao)
              const today = c.prazoProximaAcao && isDueToday(c.prazoProximaAcao)
              return (
                <div
                  key={c.id}
                  onClick={() => navigate(`/clientes/${c.id}`)}
                  className="bg-white border border-red-200 rounded-lg p-3 cursor-pointer hover:shadow-sm transition-shadow flex items-start gap-2"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="text-sm font-semibold text-gray-900 truncate">{c.nome}</p>
                      <Badge label={c.prioridade} className={`${priorityColor(c.prioridade)} text-xs`} />
                    </div>
                    {c.pendencia ? (
                      <p className="text-xs text-red-600 mt-0.5 truncate">⚠ {c.pendencia}</p>
                    ) : c.proximaAcao ? (
                      <p className="text-xs text-gray-500 mt-0.5 truncate">{c.proximaAcao}</p>
                    ) : null}
                    {c.prazoProximaAcao && (
                      <p className={`text-xs mt-0.5 font-medium ${overdue ? 'text-red-600' : today ? 'text-yellow-600' : 'text-gray-400'}`}>
                        {overdue ? 'VENCIDO — ' : today ? 'Hoje — ' : ''}
                        {formatDate(c.prazoProximaAcao)}
                      </p>
                    )}
                  </div>
                  <ChevronRight size={14} className="text-red-400 flex-shrink-0 mt-0.5" />
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Pipeline */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp size={15} className="text-gray-400" />
          <h2 className="text-sm font-semibold text-gray-700">Pipeline de implantação</h2>
        </div>
        <div className="flex items-center gap-1 overflow-x-auto pb-1">
          {PIPELINE_STAGES.map((stage, i) => {
            const count = pipelineCounts[stage.key] ?? 0
            const isLast = i === PIPELINE_STAGES.length - 1
            const isFinal = stage.key === 'Cliente pronto'
            const hasClients = count > 0
            return (
              <div key={stage.key} className="flex items-center flex-shrink-0">
                <div
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm ${
                    hasClients
                      ? isFinal
                        ? 'bg-green-50 border-green-200'
                        : 'bg-blue-50 border-blue-200'
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <span className={`font-bold text-base leading-none ${hasClients ? (isFinal ? 'text-green-600' : 'text-blue-600') : 'text-gray-300'}`}>
                    {count}
                  </span>
                  <span className={`text-xs whitespace-nowrap ${hasClients ? 'text-gray-700' : 'text-gray-400'}`}>
                    {stage.label}
                  </span>
                </div>
                {!isLast && <ChevronRight size={14} className="text-gray-300 mx-0.5 flex-shrink-0" />}
              </div>
            )
          })}
        </div>
      </Card>

      {/* Client table */}
      <Card>
        {/* Table header + filters */}
        <div className="px-4 py-3 border-b border-gray-100 space-y-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h2 className="text-sm font-semibold text-gray-700">
              Clientes
              <span className="ml-2 text-xs font-normal text-gray-400">{filtered.length} de {total}</span>
            </h2>
            <div className="flex items-center gap-2">
              {/* Search */}
              <div className="relative">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-7 pr-7 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-36"
                />
                {search && (
                  <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    <X size={12} />
                  </button>
                )}
              </div>
              {/* Priority filter */}
              <select
                value={prioFilter}
                onChange={(e) => setPrioFilter(e.target.value as Prioridade | 'Todas')}
                className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Todas">Todas prioridades</option>
                {(['Urgente', 'Alta', 'Média', 'Baixa'] as Prioridade[]).map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              <button
                onClick={() => navigate('/clientes')}
                className="text-xs text-blue-600 hover:underline whitespace-nowrap"
              >
                Ver completo →
              </button>
            </div>
          </div>

          {/* Quick filter pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {QUICK_FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setQuickFilter(f.key)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  quickFilter === f.key
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {f.label}
                <span className={`text-xs rounded-full px-1.5 py-0.5 leading-none ${
                  quickFilter === f.key ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  {f.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">Cliente</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">Status geral</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">Receptivo</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">Ativo</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">DataCrazy</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">Próxima ação</th>
                <th className="px-4 py-2.5 w-8"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((client) => {
                const overdue = client.prazoProximaAcao && isOverdue(client.prazoProximaAcao)
                const today = client.prazoProximaAcao && isDueToday(client.prazoProximaAcao)
                return (
                  <tr
                    key={client.id}
                    className={`hover:bg-gray-50/80 transition-colors cursor-pointer ${
                      overdue ? 'bg-red-50/30' : today ? 'bg-yellow-50/30' : ''
                    }`}
                    onClick={() => navigate(`/clientes/${client.id}`)}
                  >
                    <td className="px-4 py-3">
                      <p className="font-semibold text-gray-900">{client.nomeConhecido || client.nome}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Badge label={client.prioridade} className={`${priorityColor(client.prioridade)} text-xs`} />
                        <span className="text-xs text-gray-400">DDD {client.ddd}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge label={client.statusGeral} className={`${statusGeralColor(client.statusGeral)} text-xs`} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusDot status={client.statusReceptivo} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusDot status={client.statusAtivo} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusDot status={client.statusDataCrazy} />
                    </td>
                    <td className="px-4 py-3 max-w-52">
                      {client.proximaAcao ? (
                        <div>
                          <p className="text-xs text-gray-700 truncate" title={client.proximaAcao}>
                            {client.proximaAcao}
                          </p>
                          {client.prazoProximaAcao && (
                            <p className={`text-xs mt-0.5 ${overdue ? 'text-red-600 font-semibold' : today ? 'text-yellow-600 font-semibold' : 'text-gray-400'}`}>
                              {overdue ? '⚠ VENCIDO' : today ? '⚡ Hoje' : formatDate(client.prazoProximaAcao)}
                            </p>
                          )}
                        </div>
                      ) : client.pendencia ? (
                        <p className="text-xs text-red-600 truncate">⚠ {client.pendencia}</p>
                      ) : (
                        <span className="text-xs text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <ChevronRight size={15} className="text-gray-300" />
                    </td>
                  </tr>
                )
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-gray-400 text-sm">
                    {clients.length === 0 ? 'Nenhum cliente cadastrado.' : 'Nenhum cliente corresponde aos filtros.'}
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

function StatCard({
  label, value, icon, iconBg, iconColor, valueColor = 'text-gray-900', sub, onClick,
}: {
  label: string
  value: number
  icon: React.ReactNode
  iconBg: string
  iconColor: string
  valueColor?: string
  sub?: string
  onClick?: () => void
}) {
  return (
    <div
      className={`bg-white rounded-xl border border-gray-200 shadow-sm p-4 ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-500 font-medium">{label}</p>
          <p className={`text-3xl font-bold mt-1.5 ${valueColor}`}>{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
        </div>
        <div className={`${iconBg} ${iconColor} p-2 rounded-lg flex-shrink-0 mt-0.5`}>
          {icon}
        </div>
      </div>
    </div>
  )
}

function StatusDot({ status }: { status: string }) {
  const isPronto = status === 'Pronto'
  const isPendente = status === 'Com pendência' || status === 'Com erro'
  const isNaoIniciado = status === 'Não iniciado'
  const dotColor = isPronto ? 'bg-green-500' : isPendente ? 'bg-red-500' : isNaoIniciado ? 'bg-gray-300' : 'bg-blue-400'
  const textColor = isPronto ? 'text-green-700' : isPendente ? 'text-red-700' : isNaoIniciado ? 'text-gray-400' : 'text-blue-700'
  return (
    <div className="flex items-center gap-1.5">
      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dotColor}`} />
      <span className={`text-xs ${textColor}`}>{status}</span>
    </div>
  )
}
