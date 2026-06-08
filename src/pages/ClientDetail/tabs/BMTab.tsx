import { useState, useEffect } from 'react'
import { differenceInDays } from 'date-fns'
import { Flame, TrendingUp, Calendar, Zap, CheckCircle2, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Client, BMData, StatusBM, AquecimentoBM, EtapaAquecimento } from '../../../types'
import { DEFAULT_AQUECIMENTO } from '../../../types'
import { useStore } from '../../../store'
import { Button } from '../../../components/ui/Button'
import { Card } from '../../../components/ui/Card'
import { Badge } from '../../../components/ui/Badge'
import { Checklist } from '../../../components/ui/Checklist'
import { applyBMReceptivaAutomation, applyBMAtivaAutomation } from '../../../utils/automation'
import { statusBMColor, formatDate } from '../../../utils/format'

const STATUS_OPTIONS: StatusBM[] = [
  'Não iniciada', 'Criando', 'Dados preenchidos', 'Site/domínio pendente',
  'Verificação enviada', 'Em análise', 'Aprovada', 'Recusada', 'Com pendência',
]

const ETAPA_LABEL: Record<EtapaAquecimento, string> = {
  não_iniciado: 'Não iniciado',
  template_criando: 'Criando template',
  template_aguardando: 'Aguardando aprovação',
  template_aprovado: 'Template aprovado',
  primeiro_disparo: 'Primeiro disparo',
  aquecendo: 'Aquecendo',
  aquecida: 'Aquecida',
}

const ETAPA_BADGE: Record<EtapaAquecimento, string> = {
  não_iniciado: 'bg-gray-100 text-gray-600 border-gray-200',
  template_criando: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  template_aguardando: 'bg-amber-100 text-amber-800 border-amber-200',
  template_aprovado: 'bg-blue-100 text-blue-800 border-blue-200',
  primeiro_disparo: 'bg-purple-100 text-purple-800 border-purple-200',
  aquecendo: 'bg-orange-100 text-orange-800 border-orange-200',
  aquecida: 'bg-green-100 text-green-800 border-green-200',
}

function resolveAq(bm: BMData): AquecimentoBM {
  return {
    ...DEFAULT_AQUECIMENTO,
    ...bm.aquecimento,
    templates: bm.aquecimento?.templates ?? [],
    disparos: bm.aquecimento?.disparos ?? [],
    listas: bm.aquecimento?.listas ?? [],
    cronograma: bm.aquecimento?.cronograma ?? [],
  }
}

// ── Types ───────────────────────────────────────────────────

interface Props {
  client: Client
  type: 'receptiva' | 'ativa'
}

const inputCls = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'

// ── Main component ──────────────────────────────────────────

export function BMTab({ client, type }: Props) {
  const updateBMReceptiva = useStore((s) => s.updateBMReceptiva)
  const updateBMAtiva = useStore((s) => s.updateBMAtiva)
  const bm = type === 'receptiva' ? client.bmReceptiva : client.bmAtiva

  const [form, setForm] = useState<BMData>({
    ...bm,
    checklist: { ...bm.checklist },
  })
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    const current = type === 'receptiva' ? client.bmReceptiva : client.bmAtiva
    setForm({ ...current, checklist: { ...current.checklist } })
    setDirty(false)
  }, [client.id, client.atualizadoEm, type])

  function set<K extends keyof BMData>(key: K, value: BMData[K]) {
    setForm((f) => ({ ...f, [key]: value }))
    setDirty(true)
  }

  function save() {
    const prevStatus = bm.status
    const newStatus = form.status
    let autoUpdates = {}
    if (prevStatus !== newStatus) {
      autoUpdates = type === 'receptiva'
        ? applyBMReceptivaAutomation(client, newStatus)
        : applyBMAtivaAutomation(client, newStatus)
    }
    const update = type === 'receptiva' ? updateBMReceptiva : updateBMAtiva
    update(client.id, form, Object.keys(autoUpdates).length > 0 ? autoUpdates as Partial<Client> : undefined)
    setDirty(false)
  }

  // Computed values for aquecimento summary
  const aq = resolveAq(bm)
  const totalLeads = aq.disparos.reduce((s, d) => s + (d.totalLeads || 0), 0)
  const totalRespostas = aq.disparos.reduce((s, d) => s + (d.totalRespostas || 0), 0)
  const taxaResposta = totalLeads > 0 ? ((totalRespostas / totalLeads) * 100).toFixed(1) : '0'
  const diasAquecendo = aq.dataInicio ? differenceInDays(new Date(), new Date(aq.dataInicio)) : null
  const templatesAprovados = aq.templates.filter((t) => t.status === 'aprovado').length

  const label = type === 'receptiva' ? 'BM Receptiva' : 'BM Ativa'

  const checklistItems = [
    { key: 'bmCriada', label: type === 'receptiva' ? 'BM receptiva criada' : 'BM ativa criada', checked: form.checklist.bmCriada },
    { key: 'dadosCNPJPreenchidos', label: 'Dados do CNPJ preenchidos', checked: form.checklist.dadosCNPJPreenchidos },
    { key: 'siteFTMCriado', label: 'Site FTM criado', checked: form.checklist.siteFTMCriado },
    { key: 'dominiComprado', label: 'Domínio comprado', checked: form.checklist.dominiComprado },
    { key: 'dominioVinculado', label: 'Domínio vinculado', checked: form.checklist.dominioVinculado },
    { key: 'verificacaoEnviada', label: 'Verificação enviada', checked: form.checklist.verificacaoEnviada },
    { key: 'bmEmAnalise', label: 'BM em análise', checked: form.checklist.bmEmAnalise },
    { key: 'bmAprovada', label: 'BM aprovada', checked: form.checklist.bmAprovada },
    { key: 'bmRecusada', label: 'BM recusada ou com pendência', checked: form.checklist.bmRecusada },
  ]

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-base font-semibold text-gray-900">{label}</h3>
          <Badge label={form.status} className={statusBMColor(form.status)} />
        </div>
        <Button variant="primary" size="sm" onClick={save} disabled={!dirty}>
          Salvar alterações
        </Button>
      </div>

      {/* ── BM data + checklist ── */}
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-4">
          <Card className="p-5">
            <h4 className="text-sm font-semibold text-gray-700 mb-4">Dados da BM</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Nome da BM</label>
                <input type="text" value={form.nome} onChange={(e) => set('nome', e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">ID da BM</label>
                <input type="text" value={form.idBM} onChange={(e) => set('idBM', e.target.value)} placeholder="Ex: 987654321012345" className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                <select value={form.status} onChange={(e) => set('status', e.target.value as StatusBM)} className={inputCls}>
                  {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">CNPJ usado</label>
                <input type="text" value={form.cnpjUsado} onChange={(e) => set('cnpjUsado', e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Domínio</label>
                <input type="text" value={form.dominio} onChange={(e) => set('dominio', e.target.value)} placeholder="exemplo.com.br" className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Link do site FTM</label>
                <input type="text" value={form.linkSiteFTM} onChange={(e) => set('linkSiteFTM', e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Data de criação</label>
                <input
                  type="datetime-local"
                  value={form.dataCriacao ? form.dataCriacao.slice(0, 16) : ''}
                  onChange={(e) => set('dataCriacao', e.target.value ? new Date(e.target.value).toISOString() : '')}
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Data de envio da verificação</label>
                <input
                  type="datetime-local"
                  value={form.dataEnvioVerificacao ? form.dataEnvioVerificacao.slice(0, 16) : ''}
                  onChange={(e) => set('dataEnvioVerificacao', e.target.value ? new Date(e.target.value).toISOString() : '')}
                  className={inputCls}
                />
              </div>
              {form.dataAprovacao && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Data de aprovação</label>
                  <p className="text-sm text-gray-900">{formatDate(form.dataAprovacao)}</p>
                </div>
              )}
            </div>
            <div className="mt-4">
              <label className="block text-xs font-medium text-gray-700 mb-1">Motivo de recusa (se houver)</label>
              <input type="text" value={form.motivoRecusa} onChange={(e) => set('motivoRecusa', e.target.value)} className={inputCls} />
            </div>
            <div className="mt-4">
              <label className="block text-xs font-medium text-gray-700 mb-1">Observações</label>
              <textarea value={form.observacoes} onChange={(e) => set('observacoes', e.target.value)} rows={3} className={inputCls} />
            </div>
          </Card>
        </div>
        <div>
          <Card className="p-5">
            <Checklist
              title="Checklist"
              items={checklistItems}
              onChange={(key, checked) => {
                setForm((f) => ({ ...f, checklist: { ...f.checklist, [key]: checked } }))
                setDirty(true)
              }}
            />
          </Card>
        </div>
      </div>

      {/* ── Aquecimento — card compacto ── */}
      <div className="border-t-2 border-orange-100 pt-6">
        <Card className="p-5 bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-xl">
                <Flame size={18} className="text-orange-500" />
              </div>
              <div>
                <p className="text-xs text-orange-700 font-medium mb-0.5">Aquecimento</p>
                <div className="flex items-center gap-2">
                  <Badge label={ETAPA_LABEL[aq.etapa]} className={ETAPA_BADGE[aq.etapa]} />
                </div>
              </div>
            </div>

            <Link
              to={`/aquecimento/${client.id}`}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-xl transition-colors flex-shrink-0"
            >
              Gerenciar aquecimento completo
              <ChevronRight size={14} />
            </Link>
          </div>

          {aq.etapa !== 'não_iniciado' ? (
            <div className="grid grid-cols-4 gap-3 mt-4">
              {[
                {
                  icon: <Calendar size={13} className="text-blue-600" />,
                  value: diasAquecendo !== null ? `${diasAquecendo}d` : '—',
                  label: 'aquecendo',
                  color: 'text-blue-700',
                },
                {
                  icon: <CheckCircle2 size={13} className="text-purple-600" />,
                  value: `${templatesAprovados}/${aq.templates.length}`,
                  label: 'templates',
                  color: 'text-purple-700',
                },
                {
                  icon: <Zap size={13} className="text-orange-600" />,
                  value: String(aq.disparos.length),
                  label: 'disparos',
                  color: 'text-orange-700',
                },
                {
                  icon: <TrendingUp size={13} className="text-emerald-600" />,
                  value: `${taxaResposta}%`,
                  label: 'taxa resposta',
                  color: Number(taxaResposta) >= 10 ? 'text-emerald-700' : Number(taxaResposta) >= 5 ? 'text-yellow-700' : 'text-gray-600',
                },
              ].map((s) => (
                <div key={s.label} className="flex items-center gap-2 bg-white/70 rounded-lg px-3 py-2">
                  {s.icon}
                  <div>
                    <p className={`text-sm font-bold ${s.color}`}>{s.value}</p>
                    <p className="text-[10px] text-gray-500">{s.label}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-orange-600 mt-3">
              Aquecimento ainda não iniciado para esta BM. Clique em "Gerenciar aquecimento completo" para começar.
            </p>
          )}
        </Card>
      </div>
    </div>
  )
}


