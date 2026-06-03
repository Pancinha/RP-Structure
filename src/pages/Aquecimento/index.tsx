import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Flame, ChevronRight, Zap, Users, MessageSquare, TrendingUp } from 'lucide-react'
import { useStore } from '../../store'
import { Badge } from '../../components/ui/Badge'
import { Card } from '../../components/ui/Card'
import { DEFAULT_AQUECIMENTO } from '../../types'
import type { EtapaAquecimento, BMData, AquecimentoBM } from '../../types'

interface BMRow {
  clientId: string
  clientNome: string
  tipo: 'receptiva' | 'ativa'
  bm: BMData
  aq: AquecimentoBM
}
import { formatDateShort } from '../../utils/format'

const ETAPA_LABELS: Record<EtapaAquecimento, string> = {
  não_iniciado: 'Não iniciado',
  template_criando: 'Criando template',
  template_aguardando: 'Aguardando aprovação',
  template_aprovado: 'Template aprovado',
  primeiro_disparo: 'Primeiro disparo',
  aquecendo: 'Aquecendo',
  aquecida: 'Aquecida',
}

function etapaColor(e: EtapaAquecimento): string {
  switch (e) {
    case 'não_iniciado': return 'bg-gray-100 text-gray-600 border-gray-200'
    case 'template_criando': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    case 'template_aguardando': return 'bg-yellow-100 text-yellow-700 border-yellow-200'
    case 'template_aprovado': return 'bg-blue-100 text-blue-800 border-blue-200'
    case 'primeiro_disparo': return 'bg-purple-100 text-purple-800 border-purple-200'
    case 'aquecendo': return 'bg-orange-100 text-orange-800 border-orange-200'
    case 'aquecida': return 'bg-green-100 text-green-800 border-green-200'
  }
}

function qualidadeColor(q: string): string {
  if (q === 'Boa') return 'bg-green-100 text-green-800 border-green-200'
  if (q === 'Média') return 'bg-yellow-100 text-yellow-800 border-yellow-200'
  if (q === 'Ruim') return 'bg-red-100 text-red-800 border-red-200'
  return 'bg-gray-100 text-gray-500 border-gray-200'
}

type TipoFilter = 'todos' | 'receptiva' | 'ativa'
type EtapaFilter = 'todas' | EtapaAquecimento

export function Aquecimento() {
  const clients = useStore((s) => s.clients)
  const navigate = useNavigate()

  const [tipoFilter, setTipoFilter] = useState<TipoFilter>('todos')
  const [etapaFilter, setEtapaFilter] = useState<EtapaFilter>('todas')
  const [search, setSearch] = useState('')

  // Build flat list of BM rows
  const rows: BMRow[] = clients.flatMap((client) => {
    const result: BMRow[] = []

    const addRow = (tipo: 'receptiva' | 'ativa') => {
      const bm = tipo === 'receptiva' ? client.bmReceptiva : client.bmAtiva
      if (!bm.nome && bm.status === 'Não iniciada' && !bm.aquecimento) return
      const aq: AquecimentoBM = { ...DEFAULT_AQUECIMENTO, ...bm.aquecimento, templates: bm.aquecimento?.templates ?? [], disparos: bm.aquecimento?.disparos ?? [] }
      result.push({ clientId: client.id, clientNome: client.nomeConhecido || client.nome, tipo, bm, aq })
    }

    addRow('receptiva')
    addRow('ativa')
    return result
  })

  const filtered = rows.filter((r) => {
    if (tipoFilter !== 'todos' && r.tipo !== tipoFilter) return false
    if (etapaFilter !== 'todas' && r.aq.etapa !== etapaFilter) return false
    if (search) {
      const q = search.toLowerCase()
      if (!r.clientNome.toLowerCase().includes(q) && !r.bm.nome.toLowerCase().includes(q)) return false
    }
    return true
  })

  // Global stats
  const allDisparos = rows.flatMap((r) => r.aq.disparos)
  const totalDisparos = allDisparos.length
  const totalLeads = allDisparos.reduce((s, d) => s + (Number(d.totalLeads) || 0), 0)
  const totalRespostas = allDisparos.reduce((s, d) => s + (Number(d.totalRespostas) || 0), 0)
  const taxaMedia = totalLeads > 0 ? ((totalRespostas / totalLeads) * 100).toFixed(1) : '0'
  const bmsAtivas = rows.filter((r) => r.aq.etapa !== 'não_iniciado').length

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center gap-2">
        <Flame size={22} className="text-orange-500" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Aquecimento de BMs</h1>
          <p className="text-sm text-gray-500 mt-0.5">Controle de templates, disparos e resultados por BM</p>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: 'BMs em aquecimento', value: bmsAtivas, icon: <Flame size={18} />, bg: 'bg-orange-100', color: 'text-orange-600' },
          { label: 'Total de disparos', value: totalDisparos, icon: <Zap size={18} />, bg: 'bg-purple-100', color: 'text-purple-600' },
          { label: 'Leads atingidos', value: totalLeads.toLocaleString('pt-BR'), icon: <Users size={18} />, bg: 'bg-blue-100', color: 'text-blue-600' },
          { label: 'Taxa de resposta', value: `${taxaMedia}%`, icon: <TrendingUp size={18} />, bg: 'bg-green-100', color: 'text-green-600' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs text-gray-500 font-medium">{s.label}</p>
                <p className="text-3xl font-bold text-gray-900 mt-1.5">{s.value}</p>
              </div>
              <div className={`${s.bg} ${s.color} p-2 rounded-lg flex-shrink-0 mt-0.5`}>{s.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            placeholder="Buscar cliente ou BM..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-48"
          />
          <select
            value={tipoFilter}
            onChange={(e) => setTipoFilter(e.target.value as TipoFilter)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="todos">Receptiva + Ativa</option>
            <option value="receptiva">Só Receptiva</option>
            <option value="ativa">Só Ativa</option>
          </select>
          <select
            value={etapaFilter}
            onChange={(e) => setEtapaFilter(e.target.value as EtapaFilter)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="todas">Todas as etapas</option>
            {(Object.entries(ETAPA_LABELS) as [EtapaAquecimento, string][]).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
          <span className="text-xs text-gray-400 ml-auto">{filtered.length} BM(s)</span>
        </div>
      </Card>

      {/* Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                {['Cliente', 'Tipo', 'Nome BM', 'Etapa', 'Templates', 'Disparos', 'Leads', 'Respostas', 'Última qualidade', 'Limite', 'Último disparo', ''].map((h) => (
                  <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((r, i) => {
                const disparosOrdered = [...r.aq.disparos].sort((a, b) => b.data.localeCompare(a.data))
                const ultimoDisparo = disparosOrdered[0]
                const totalLeadsRow = r.aq.disparos.reduce((s, d) => s + (d.totalLeads || 0), 0)
                const totalRespostasRow = r.aq.disparos.reduce((s, d) => s + (d.totalRespostas || 0), 0)
                const tab = r.tipo === 'receptiva' ? 'bm-receptiva' : 'bm-ativa'

                return (
                  <tr
                    key={`${r.clientId}-${r.tipo}-${i}`}
                    onClick={() => navigate(`/clientes/${r.clientId}?tab=${tab}`)}
                    className="hover:bg-gray-50/80 transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">{r.clientNome}</td>
                    <td className="px-4 py-3">
                      <Badge
                        label={r.tipo === 'receptiva' ? 'Receptiva' : 'Ativa'}
                        className={r.tipo === 'receptiva' ? 'bg-blue-100 text-blue-800 border-blue-200' : 'bg-purple-100 text-purple-800 border-purple-200'}
                      />
                    </td>
                    <td className="px-4 py-3 text-gray-700 max-w-32 truncate" title={r.bm.nome}>{r.bm.nome || '—'}</td>
                    <td className="px-4 py-3">
                      <Badge label={ETAPA_LABELS[r.aq.etapa]} className={etapaColor(r.aq.etapa)} />
                    </td>
                    <td className="px-4 py-3 text-center text-gray-700">{r.aq.templates.length}</td>
                    <td className="px-4 py-3 text-center text-gray-700">{r.aq.disparos.length}</td>
                    <td className="px-4 py-3 text-gray-700">{totalLeadsRow.toLocaleString('pt-BR')}</td>
                    <td className="px-4 py-3 text-gray-700">
                      {totalRespostasRow.toLocaleString('pt-BR')}
                      {totalLeadsRow > 0 && (
                        <span className="text-xs text-gray-400 ml-1">
                          ({((totalRespostasRow / totalLeadsRow) * 100).toFixed(0)}%)
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {ultimoDisparo?.qualidade
                        ? <Badge label={ultimoDisparo.qualidade} className={qualidadeColor(ultimoDisparo.qualidade)} />
                        : <span className="text-xs text-gray-300">—</span>
                      }
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {r.aq.limiteAtual > 0 ? r.aq.limiteAtual.toLocaleString('pt-BR') : '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                      {ultimoDisparo ? formatDateShort(ultimoDisparo.data) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <ChevronRight size={15} className="text-gray-300" />
                    </td>
                  </tr>
                )
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={12} className="px-4 py-10 text-center text-gray-400 text-sm">
                    {rows.length === 0
                      ? 'Nenhuma BM com dados de aquecimento. Acesse um cliente e configure a seção Aquecimento.'
                      : 'Nenhuma BM corresponde aos filtros selecionados.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="px-4 py-3 border-t border-gray-100 flex items-center gap-1 flex-wrap">
          {(Object.entries(ETAPA_LABELS) as [EtapaAquecimento, string][]).map(([v, l]) => (
            <span key={v} className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs border ${etapaColor(v)}`}>{l}</span>
          ))}
        </div>
      </Card>

      {/* Disparos recentes */}
      {allDisparos.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <MessageSquare size={15} className="text-gray-400" />
            <h2 className="text-sm font-semibold text-gray-700">Últimos disparos registrados</h2>
          </div>
          <div className="space-y-2">
            {rows
              .flatMap((r) =>
                r.aq.disparos.map((d) => ({
                  id: d.id, data: d.data, nomeLista: d.nomeLista, arquivoLista: d.arquivoLista,
                  totalLeads: d.totalLeads, totalRespostas: d.totalRespostas, qualidade: d.qualidade,
                  observacoes: d.observacoes,
                  clientNome: r.clientNome, clientId: r.clientId, tipo: r.tipo, nomeBM: r.bm.nome,
                }))
              )
              .sort((a, b) => b.data.localeCompare(a.data))
              .slice(0, 8)
              .map((d) => (
                <div
                  key={d.id}
                  onClick={() => navigate(`/clientes/${d.clientId}?tab=${d.tipo === 'receptiva' ? 'bm-receptiva' : 'bm-ativa'}`)}
                  className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-gray-900">{d.clientNome}</p>
                      {d.nomeBM && <span className="text-xs text-gray-400">· {d.nomeBM}</span>}
                      <span className="text-xs text-gray-400">{formatDateShort(d.data)}</span>
                      {d.qualidade && <Badge label={d.qualidade} className={qualidadeColor(d.qualidade)} />}
                    </div>
                    <p className="text-xs text-gray-600 mt-0.5">
                      {d.nomeLista} · <span className="font-medium">{d.totalLeads.toLocaleString('pt-BR')}</span> leads
                      {' → '}
                      <span className="font-medium">{d.totalRespostas.toLocaleString('pt-BR')}</span> respostas
                      {d.totalLeads > 0 && ` (${((d.totalRespostas / d.totalLeads) * 100).toFixed(1)}%)`}
                    </p>
                  </div>
                  <ChevronRight size={14} className="text-gray-300 flex-shrink-0" />
                </div>
              ))}
          </div>
        </Card>
      )}
    </div>
  )
}
