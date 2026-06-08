import { useState, useEffect } from 'react'
import { differenceInDays } from 'date-fns'
import { Flame, Plus, Trash2, Check, Pencil, TrendingUp, Calendar, Zap, CheckCircle2 } from 'lucide-react'
import type {
  Client, BMData, StatusBM,
  AquecimentoBM, BMTemplate, Disparo, EtapaAquecimento,
} from '../../../types'
import { DEFAULT_AQUECIMENTO } from '../../../types'
import { useStore } from '../../../store'
import { Button } from '../../../components/ui/Button'
import { Card } from '../../../components/ui/Card'
import { Badge } from '../../../components/ui/Badge'
import { Checklist } from '../../../components/ui/Checklist'
import { Modal } from '../../../components/ui/Modal'
import { applyBMReceptivaAutomation, applyBMAtivaAutomation } from '../../../utils/automation'
import { statusBMColor, formatDate, formatDateShort } from '../../../utils/format'

const STATUS_OPTIONS: StatusBM[] = [
  'Não iniciada', 'Criando', 'Dados preenchidos', 'Site/domínio pendente',
  'Verificação enviada', 'Em análise', 'Aprovada', 'Recusada', 'Com pendência',
]

const ETAPA_OPTIONS: { value: EtapaAquecimento; label: string; shortLabel: string }[] = [
  { value: 'não_iniciado',       label: 'Não iniciado',        shortLabel: 'Não\niniciado' },
  { value: 'template_criando',   label: 'Criando template',    shortLabel: 'Criando\ntemplate' },
  { value: 'template_aguardando',label: 'Aguardando aprovação',shortLabel: 'Aguardando\naprovação' },
  { value: 'template_aprovado',  label: 'Template aprovado',   shortLabel: 'Template\naprovado' },
  { value: 'primeiro_disparo',   label: 'Primeiro disparo',    shortLabel: '1º\ndisparo' },
  { value: 'aquecendo',          label: 'Aquecendo',           shortLabel: 'Aquecendo' },
  { value: 'aquecida',           label: 'Aquecida',            shortLabel: 'Aquecida' },
]

const ETAPA_COLORS: Record<EtapaAquecimento, { ring: string; bg: string; text: string; line: string }> = {
  não_iniciado:        { ring: 'ring-gray-300',   bg: 'bg-gray-100',    text: 'text-gray-500',   line: 'bg-gray-200' },
  template_criando:    { ring: 'ring-yellow-400',  bg: 'bg-yellow-400',  text: 'text-yellow-800', line: 'bg-yellow-300' },
  template_aguardando: { ring: 'ring-amber-400',   bg: 'bg-amber-400',   text: 'text-amber-800',  line: 'bg-amber-300' },
  template_aprovado:   { ring: 'ring-blue-400',    bg: 'bg-blue-500',    text: 'text-blue-800',   line: 'bg-blue-300' },
  primeiro_disparo:    { ring: 'ring-purple-400',  bg: 'bg-purple-500',  text: 'text-purple-800', line: 'bg-purple-300' },
  aquecendo:           { ring: 'ring-orange-400',  bg: 'bg-orange-500',  text: 'text-orange-800', line: 'bg-orange-300' },
  aquecida:            { ring: 'ring-green-400',   bg: 'bg-green-500',   text: 'text-green-800',  line: 'bg-green-300' },
}

function templateStatusColor(s: BMTemplate['status']): string {
  switch (s) {
    case 'aprovado': return 'bg-green-100 text-green-800 border-green-200'
    case 'aguardando': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    case 'recusado': return 'bg-red-100 text-red-800 border-red-200'
    default: return 'bg-gray-100 text-gray-600 border-gray-200'
  }
}

function templateStatusLabel(s: BMTemplate['status']): string {
  return { criando: 'Criando', aguardando: 'Aguardando', aprovado: 'Aprovado', recusado: 'Recusado' }[s]
}

function qualidadeColor(q: Disparo['qualidade']): string {
  switch (q) {
    case 'Boa': return 'bg-green-100 text-green-800 border-green-200'
    case 'Média': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    case 'Ruim': return 'bg-red-100 text-red-800 border-red-200'
    default: return 'bg-gray-100 text-gray-500 border-gray-200'
  }
}

function makeId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
}

function resolveAq(bm: BMData): AquecimentoBM {
  return {
    ...DEFAULT_AQUECIMENTO,
    ...bm.aquecimento,
    templates: bm.aquecimento?.templates ?? [],
    disparos: bm.aquecimento?.disparos ?? [],
  }
}

// ── Stepper visual ─────────────────────────────────────────

function AquecimentoStepper({
  etapa,
  onChange,
}: {
  etapa: EtapaAquecimento
  onChange: (e: EtapaAquecimento) => void
}) {
  const currentIdx = ETAPA_OPTIONS.findIndex((o) => o.value === etapa)

  return (
    <div className="flex items-start select-none">
      {ETAPA_OPTIONS.map((o, i) => {
        const done = i < currentIdx
        const active = i === currentIdx
        const c = ETAPA_COLORS[o.value]
        return (
          <div key={o.value} className="flex items-start flex-1 last:flex-none">
            <button
              onClick={() => onChange(o.value)}
              className="flex flex-col items-center gap-1.5 group cursor-pointer"
              title={o.label}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ring-2 transition-all
                  ${done ? `${c.bg} ring-transparent text-white shadow-sm` : ''}
                  ${active ? `${c.bg} ring-transparent text-white shadow-md ring-offset-2 ${c.ring} scale-110` : ''}
                  ${!done && !active ? `bg-white ring-gray-200 text-gray-400 group-hover:ring-gray-400 group-hover:text-gray-600` : ''}
                `}
              >
                {done ? <Check size={13} strokeWidth={3} /> : i + 1}
              </div>
              <span
                className={`text-[9px] text-center leading-tight whitespace-pre-line w-14 transition-colors
                  ${done ? 'text-green-700 font-medium' : ''}
                  ${active ? `${c.text} font-semibold` : ''}
                  ${!done && !active ? 'text-gray-400 group-hover:text-gray-600' : ''}
                `}
              >
                {o.shortLabel}
              </span>
            </button>
            {i < ETAPA_OPTIONS.length - 1 && (
              <div className={`flex-1 h-0.5 mt-4 mx-0.5 rounded-full transition-colors ${done ? c.line : 'bg-gray-200'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Mini disparo bar chart ──────────────────────────────────

function MiniDisparosChart({ disparos }: { disparos: Disparo[] }) {
  if (disparos.length === 0) return null
  const sorted = [...disparos].sort((a, b) => a.data.localeCompare(b.data)).slice(-12)
  const maxVal = Math.max(...sorted.flatMap((d) => [d.totalLeads || 0, d.totalRespostas || 0]), 1)
  const H = 40

  return (
    <div className="flex items-end gap-0.5 h-10" title="Histórico de disparos: azul = leads, verde = respostas">
      {sorted.map((d, i) => (
        <div
          key={i}
          className="flex items-end gap-px flex-1"
          title={`${formatDateShort(d.data)}: ${(d.totalLeads || 0).toLocaleString('pt-BR')} leads, ${(d.totalRespostas || 0).toLocaleString('pt-BR')} resp.`}
        >
          <div
            className="flex-1 bg-blue-300 rounded-t-sm"
            style={{ height: `${Math.max(((d.totalLeads || 0) / maxVal) * H, 1)}px` }}
          />
          <div
            className="flex-1 bg-emerald-300 rounded-t-sm"
            style={{ height: `${Math.max(((d.totalRespostas || 0) / maxVal) * H, 1)}px` }}
          />
        </div>
      ))}
    </div>
  )
}

// ── Types ───────────────────────────────────────────────────

interface Props {
  client: Client
  type: 'receptiva' | 'ativa'
}

const BLANK_TEMPLATE: Omit<BMTemplate, 'id'> = {
  nome: '', dataEnvio: '', dataAprovacao: '',
  status: 'criando', categoria: '', observacoes: '',
}

const BLANK_DISPARO: Omit<Disparo, 'id'> = {
  data: new Date().toISOString().slice(0, 10),
  nomeLista: '', arquivoLista: '',
  totalLeads: 0, totalRespostas: 0,
  qualidade: '', observacoes: '',
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
    aquecimento: resolveAq(bm),
  })
  const [dirty, setDirty] = useState(false)

  // Template modals
  const [templateModalOpen, setTemplateModalOpen] = useState(false)
  const [newTemplate, setNewTemplate] = useState<Omit<BMTemplate, 'id'>>(BLANK_TEMPLATE)
  const [editingTemplate, setEditingTemplate] = useState<BMTemplate | null>(null)

  // Disparo modals
  const [disparoModalOpen, setDisparoModalOpen] = useState(false)
  const [newDisparo, setNewDisparo] = useState<Omit<Disparo, 'id'>>(BLANK_DISPARO)
  const [editingDisparo, setEditingDisparo] = useState<Disparo | null>(null)

  useEffect(() => {
    const current = type === 'receptiva' ? client.bmReceptiva : client.bmAtiva
    setForm({ ...current, checklist: { ...current.checklist }, aquecimento: resolveAq(current) })
    setDirty(false)
  }, [client.id, client.atualizadoEm, type])

  function set<K extends keyof BMData>(key: K, value: BMData[K]) {
    setForm((f) => ({ ...f, [key]: value }))
    setDirty(true)
  }

  function setAq<K extends keyof AquecimentoBM>(key: K, value: AquecimentoBM[K]) {
    setForm((f) => ({ ...f, aquecimento: { ...(f.aquecimento ?? DEFAULT_AQUECIMENTO), [key]: value } }))
    setDirty(true)
  }

  function getAq(): AquecimentoBM {
    return form.aquecimento ?? DEFAULT_AQUECIMENTO
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

  // Template CRUD
  function handleAddTemplate() {
    if (!newTemplate.nome.trim()) return
    const t: BMTemplate = { ...newTemplate, id: makeId() }
    setForm((f) => ({
      ...f,
      aquecimento: { ...(f.aquecimento ?? DEFAULT_AQUECIMENTO), templates: [...(f.aquecimento?.templates ?? []), t] },
    }))
    setDirty(true)
    setTemplateModalOpen(false)
    setNewTemplate(BLANK_TEMPLATE)
  }

  function handleUpdateTemplate() {
    if (!editingTemplate || !editingTemplate.nome.trim()) return
    setForm((f) => ({
      ...f,
      aquecimento: {
        ...(f.aquecimento ?? DEFAULT_AQUECIMENTO),
        templates: (f.aquecimento?.templates ?? []).map((t) => t.id === editingTemplate.id ? editingTemplate : t),
      },
    }))
    setDirty(true)
    setEditingTemplate(null)
  }

  function deleteTemplate(id: string) {
    setForm((f) => ({
      ...f,
      aquecimento: { ...(f.aquecimento ?? DEFAULT_AQUECIMENTO), templates: (f.aquecimento?.templates ?? []).filter((t) => t.id !== id) },
    }))
    setDirty(true)
  }

  // Disparo CRUD
  function handleAddDisparo() {
    if (!newDisparo.nomeLista.trim()) return
    const d: Disparo = { ...newDisparo, id: makeId() }
    setForm((f) => ({
      ...f,
      aquecimento: { ...(f.aquecimento ?? DEFAULT_AQUECIMENTO), disparos: [...(f.aquecimento?.disparos ?? []), d] },
    }))
    setDirty(true)
    setDisparoModalOpen(false)
    setNewDisparo(BLANK_DISPARO)
  }

  function handleUpdateDisparo() {
    if (!editingDisparo || !editingDisparo.nomeLista.trim()) return
    setForm((f) => ({
      ...f,
      aquecimento: {
        ...(f.aquecimento ?? DEFAULT_AQUECIMENTO),
        disparos: (f.aquecimento?.disparos ?? []).map((d) => d.id === editingDisparo.id ? editingDisparo : d),
      },
    }))
    setDirty(true)
    setEditingDisparo(null)
  }

  function deleteDisparo(id: string) {
    setForm((f) => ({
      ...f,
      aquecimento: { ...(f.aquecimento ?? DEFAULT_AQUECIMENTO), disparos: (f.aquecimento?.disparos ?? []).filter((d) => d.id !== id) },
    }))
    setDirty(true)
  }

  // Computed values
  const label = type === 'receptiva' ? 'BM Receptiva' : 'BM Ativa'
  const aq = getAq()
  const disparosOrdenados = [...aq.disparos].sort((a, b) => b.data.localeCompare(a.data))
  const ultimoDisparo = disparosOrdenados[0]
  const totalLeads = aq.disparos.reduce((s, d) => s + (d.totalLeads || 0), 0)
  const totalRespostas = aq.disparos.reduce((s, d) => s + (d.totalRespostas || 0), 0)
  const taxaResposta = totalLeads > 0 ? ((totalRespostas / totalLeads) * 100).toFixed(1) : '0'
  const diasAquecendo = aq.dataInicio ? differenceInDays(new Date(), new Date(aq.dataInicio)) : null
  const templatesAprovados = aq.templates.filter((t) => t.status === 'aprovado').length

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

      {/* ══════════════════════════════════════════════════ */}
      {/* ── SEÇÃO AQUECIMENTO ── */}
      {/* ══════════════════════════════════════════════════ */}

      <div className="border-t-2 border-orange-100 pt-6">
        {/* Aquecimento header */}
        <div className="flex items-center gap-2 mb-5">
          <div className="p-1.5 bg-orange-100 rounded-lg">
            <Flame size={16} className="text-orange-500" />
          </div>
          <h3 className="text-base font-semibold text-gray-900">Aquecimento</h3>
          <Badge
            label={ETAPA_OPTIONS.find((e) => e.value === aq.etapa)?.label ?? aq.etapa}
            className={
              aq.etapa === 'aquecida' ? 'bg-green-100 text-green-800 border-green-200' :
              aq.etapa === 'aquecendo' ? 'bg-orange-100 text-orange-800 border-orange-200' :
              aq.etapa === 'não_iniciado' ? 'bg-gray-100 text-gray-600 border-gray-200' :
              'bg-blue-100 text-blue-800 border-blue-200'
            }
          />
          {dirty && (
            <span className="text-xs text-orange-600 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-full ml-auto">
              Alterações pendentes
            </span>
          )}
        </div>

        {/* Stepper */}
        <Card className="p-5 mb-5">
          <p className="text-xs text-gray-500 font-medium mb-4">Etapa atual — clique para avançar ou retroceder</p>
          <AquecimentoStepper
            etapa={aq.etapa}
            onChange={(e) => setAq('etapa', e)}
          />
        </Card>

        {/* Config + mini stats */}
        <div className="grid grid-cols-3 gap-4 mb-5">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Limite de disparos atual</label>
            <input
              type="number"
              value={aq.limiteAtual}
              onChange={(e) => setAq('limiteAtual', Number(e.target.value))}
              placeholder="Ex: 250"
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Início do aquecimento</label>
            <input
              type="date"
              value={aq.dataInicio}
              onChange={(e) => setAq('dataInicio', e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Observações do aquecimento</label>
            <input
              type="text"
              value={aq.observacoes}
              onChange={(e) => setAq('observacoes', e.target.value)}
              placeholder="Notas gerais..."
              className={inputCls}
            />
          </div>
        </div>

        {/* Mini stats row */}
        {aq.etapa !== 'não_iniciado' && (
          <div className="grid grid-cols-3 gap-3 mb-5">
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex items-center gap-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Calendar size={14} className="text-blue-600" />
              </div>
              <div>
                <p className="text-lg font-bold text-blue-700">
                  {diasAquecendo !== null ? diasAquecendo : '—'}
                </p>
                <p className="text-xs text-blue-600">dias aquecendo</p>
              </div>
            </div>
            <div className="bg-purple-50 border border-purple-100 rounded-xl p-3 flex items-center gap-3">
              <div className="bg-purple-100 p-2 rounded-lg">
                <CheckCircle2 size={14} className="text-purple-600" />
              </div>
              <div>
                <p className="text-lg font-bold text-purple-700">
                  {templatesAprovados}/{aq.templates.length}
                </p>
                <p className="text-xs text-purple-600">templates aprovados</p>
              </div>
            </div>
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 flex items-center gap-3">
              <div className="bg-emerald-100 p-2 rounded-lg">
                <TrendingUp size={14} className="text-emerald-600" />
              </div>
              <div>
                <p className={`text-lg font-bold ${Number(taxaResposta) >= 10 ? 'text-emerald-700' : Number(taxaResposta) >= 5 ? 'text-yellow-700' : 'text-emerald-700'}`}>
                  {taxaResposta}%
                </p>
                <p className="text-xs text-emerald-600">taxa de resposta</p>
              </div>
            </div>
          </div>
        )}

        {/* Templates + Disparos side by side (or stacked) */}
        <div className="grid grid-cols-2 gap-5">

          {/* ── Templates ── */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-gray-700">
                Templates
                <span className="text-xs font-normal text-gray-400 ml-1.5">
                  ({templatesAprovados} aprovado{templatesAprovados !== 1 ? 's' : ''} de {aq.templates.length})
                </span>
              </h4>
              <Button variant="secondary" size="sm" onClick={() => { setNewTemplate(BLANK_TEMPLATE); setTemplateModalOpen(true) }}>
                <Plus size={12} /> Adicionar
              </Button>
            </div>

            {aq.templates.length === 0 ? (
              <div className="py-6 flex flex-col items-center gap-2 text-gray-400">
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Plus size={14} className="text-gray-400" />
                </div>
                <p className="text-xs text-center">Nenhum template.<br />Clique em Adicionar para criar o primeiro.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {aq.templates.map((t) => (
                  <div key={t.id} className="flex items-start gap-2.5 p-3 bg-gray-50 rounded-lg group">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="text-sm font-medium text-gray-900 truncate">{t.nome}</p>
                        <Badge label={templateStatusLabel(t.status)} className={templateStatusColor(t.status)} />
                        {t.categoria && (
                          <Badge
                            label={t.categoria}
                            className={
                              t.categoria === 'utility' ? 'bg-green-100 text-green-800 border-green-200' :
                              t.categoria === 'marketing' ? 'bg-orange-100 text-orange-800 border-orange-200' :
                              'bg-blue-100 text-blue-800 border-blue-200'
                            }
                          />
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        {t.dataEnvio && <p className="text-xs text-gray-400">Enviado: {formatDateShort(t.dataEnvio)}</p>}
                        {t.dataAprovacao && <p className="text-xs text-gray-400">Aprovado: {formatDateShort(t.dataAprovacao)}</p>}
                      </div>
                      {t.observacoes && <p className="text-xs text-gray-500 mt-0.5 italic">{t.observacoes}</p>}
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setEditingTemplate({ ...t })}
                        className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="Editar"
                      >
                        <Pencil size={12} />
                      </button>
                      <button
                        onClick={() => deleteTemplate(t.id)}
                        className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Excluir"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* ── Disparos ── */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-gray-700">
                Disparos
                <span className="text-xs font-normal text-gray-400 ml-1.5">({aq.disparos.length})</span>
              </h4>
              <Button variant="secondary" size="sm" onClick={() => { setNewDisparo(BLANK_DISPARO); setDisparoModalOpen(true) }}>
                <Plus size={12} /> Registrar
              </Button>
            </div>

            {/* Stats summary */}
            {aq.disparos.length > 0 && (
              <div className="mb-3">
                <div className="grid grid-cols-3 gap-2 p-3 bg-gradient-to-br from-blue-50 to-emerald-50 rounded-lg border border-blue-100 mb-2">
                  <div className="text-center">
                    <p className="text-base font-bold text-blue-700">{totalLeads.toLocaleString('pt-BR')}</p>
                    <p className="text-[10px] text-blue-600">leads</p>
                  </div>
                  <div className="text-center border-x border-blue-100">
                    <p className="text-base font-bold text-emerald-700">{totalRespostas.toLocaleString('pt-BR')}</p>
                    <p className="text-[10px] text-emerald-600">respostas</p>
                  </div>
                  <div className="text-center">
                    <p className={`text-base font-bold ${Number(taxaResposta) >= 10 ? 'text-emerald-700' : Number(taxaResposta) >= 5 ? 'text-yellow-700' : 'text-red-600'}`}>
                      {taxaResposta}%
                    </p>
                    <p className="text-[10px] text-gray-500">taxa</p>
                  </div>
                </div>
                <MiniDisparosChart disparos={aq.disparos} />
                <div className="flex items-center gap-3 mt-1">
                  <div className="flex items-center gap-1"><div className="w-2 h-2 bg-blue-300 rounded-sm" /><span className="text-[10px] text-gray-400">Leads</span></div>
                  <div className="flex items-center gap-1"><div className="w-2 h-2 bg-emerald-300 rounded-sm" /><span className="text-[10px] text-gray-400">Respostas</span></div>
                </div>
              </div>
            )}

            {aq.disparos.length === 0 ? (
              <div className="py-6 flex flex-col items-center gap-2 text-gray-400">
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Zap size={14} className="text-gray-400" />
                </div>
                <p className="text-xs text-center">Nenhum disparo.<br />Clique em Registrar para adicionar.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {disparosOrdenados.map((d) => (
                  <div key={d.id} className="flex items-start gap-2 p-2.5 bg-gray-50 rounded-lg group">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="text-sm font-medium text-gray-900 truncate">{d.nomeLista}</p>
                        <span className="text-xs text-gray-400">{formatDateShort(d.data)}</span>
                        {d.qualidade && <Badge label={d.qualidade} className={qualidadeColor(d.qualidade)} />}
                      </div>
                      <p className="text-xs text-gray-600 mt-0.5">
                        <span className="font-semibold text-blue-700">{(d.totalLeads || 0).toLocaleString('pt-BR')}</span> leads
                        {' → '}
                        <span className="font-semibold text-emerald-700">{(d.totalRespostas || 0).toLocaleString('pt-BR')}</span> resp.
                        {(d.totalLeads || 0) > 0 && (
                          <span className="text-gray-400 ml-1">
                            ({(((d.totalRespostas || 0) / (d.totalLeads || 1)) * 100).toFixed(1)}%)
                          </span>
                        )}
                        {d.arquivoLista && <span className="text-gray-400 ml-2">· 📄 {d.arquivoLista}</span>}
                      </p>
                      {d.observacoes && <p className="text-xs text-gray-400 mt-0.5 italic">{d.observacoes}</p>}
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                      <button
                        onClick={() => setEditingDisparo({ ...d })}
                        className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="Editar"
                      >
                        <Pencil size={12} />
                      </button>
                      <button
                        onClick={() => deleteDisparo(d.id)}
                        className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Excluir"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {ultimoDisparo && (
              <p className="text-xs text-gray-400 mt-2 text-right">
                Último: {formatDateShort(ultimoDisparo.data)}
              </p>
            )}
          </Card>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════ */}
      {/* ── MODALS ── */}
      {/* ══════════════════════════════════════════════════ */}

      {/* Add Template */}
      <Modal
        open={templateModalOpen}
        onClose={() => { setTemplateModalOpen(false); setNewTemplate(BLANK_TEMPLATE) }}
        title="Adicionar template"
        size="md"
      >
        <TemplateForm
          value={newTemplate}
          onChange={setNewTemplate}
          onSubmit={handleAddTemplate}
          onCancel={() => { setTemplateModalOpen(false); setNewTemplate(BLANK_TEMPLATE) }}
          submitLabel="Adicionar"
        />
      </Modal>

      {/* Edit Template */}
      <Modal
        open={!!editingTemplate}
        onClose={() => setEditingTemplate(null)}
        title="Editar template"
        size="md"
      >
        {editingTemplate && (
          <TemplateForm
            value={editingTemplate}
            onChange={(v) => setEditingTemplate(v as BMTemplate)}
            onSubmit={handleUpdateTemplate}
            onCancel={() => setEditingTemplate(null)}
            submitLabel="Salvar"
          />
        )}
      </Modal>

      {/* Add Disparo */}
      <Modal
        open={disparoModalOpen}
        onClose={() => { setDisparoModalOpen(false); setNewDisparo(BLANK_DISPARO) }}
        title="Registrar disparo"
        size="md"
      >
        <DisparoForm
          value={newDisparo}
          onChange={setNewDisparo}
          onSubmit={handleAddDisparo}
          onCancel={() => { setDisparoModalOpen(false); setNewDisparo(BLANK_DISPARO) }}
          submitLabel="Registrar"
        />
      </Modal>

      {/* Edit Disparo */}
      <Modal
        open={!!editingDisparo}
        onClose={() => setEditingDisparo(null)}
        title="Editar disparo"
        size="md"
      >
        {editingDisparo && (
          <DisparoForm
            value={editingDisparo}
            onChange={(v) => setEditingDisparo(v as Disparo)}
            onSubmit={handleUpdateDisparo}
            onCancel={() => setEditingDisparo(null)}
            submitLabel="Salvar"
          />
        )}
      </Modal>
    </div>
  )
}

// ── Reusable form sub-components ───────────────────────────

type TemplateFormValue = Omit<BMTemplate, 'id'> | BMTemplate

function TemplateForm({
  value,
  onChange,
  onSubmit,
  onCancel,
  submitLabel,
}: {
  value: TemplateFormValue
  onChange: (v: TemplateFormValue) => void
  onSubmit: () => void
  onCancel: () => void
  submitLabel: string
}) {
  const set = <K extends keyof TemplateFormValue>(k: K, v: TemplateFormValue[K]) =>
    onChange({ ...value, [k]: v })

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Nome do template *</label>
        <input
          type="text"
          value={value.nome}
          onChange={(e) => set('nome', e.target.value)}
          placeholder="Ex: Boas-vindas utility"
          className={inputCls}
          autoFocus
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
          <select value={value.status} onChange={(e) => set('status', e.target.value as BMTemplate['status'])} className={inputCls}>
            <option value="criando">Criando</option>
            <option value="aguardando">Aguardando aprovação</option>
            <option value="aprovado">Aprovado</option>
            <option value="recusado">Recusado</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Categoria</label>
          <select value={value.categoria} onChange={(e) => set('categoria', e.target.value as BMTemplate['categoria'])} className={inputCls}>
            <option value="">Não definida</option>
            <option value="utility">Utility</option>
            <option value="marketing">Marketing</option>
            <option value="authentication">Authentication</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Data de envio</label>
          <input type="date" value={value.dataEnvio} onChange={(e) => set('dataEnvio', e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Data de aprovação</label>
          <input type="date" value={value.dataAprovacao} onChange={(e) => set('dataAprovacao', e.target.value)} className={inputCls} />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Observações</label>
        <textarea value={value.observacoes} onChange={(e) => set('observacoes', e.target.value)} rows={2} className={inputCls} />
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <Button variant="secondary" onClick={onCancel}>Cancelar</Button>
        <Button variant="primary" onClick={onSubmit} disabled={!value.nome.trim()}>{submitLabel}</Button>
      </div>
    </div>
  )
}

type DisparoFormValue = Omit<Disparo, 'id'> | Disparo

function DisparoForm({
  value,
  onChange,
  onSubmit,
  onCancel,
  submitLabel,
}: {
  value: DisparoFormValue
  onChange: (v: DisparoFormValue) => void
  onSubmit: () => void
  onCancel: () => void
  submitLabel: string
}) {
  const set = <K extends keyof DisparoFormValue>(k: K, v: DisparoFormValue[K]) =>
    onChange({ ...value, [k]: v })

  const taxa = (value.totalLeads || 0) > 0
    ? (((value.totalRespostas || 0) / (value.totalLeads || 1)) * 100).toFixed(1)
    : null

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Nome da lista *</label>
          <input
            type="text"
            value={value.nomeLista}
            onChange={(e) => set('nomeLista', e.target.value)}
            placeholder="Ex: Lista leads maio"
            className={inputCls}
            autoFocus
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Data do disparo</label>
          <input type="date" value={value.data} onChange={(e) => set('data', e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Total de leads enviados</label>
          <input
            type="number"
            min={0}
            value={value.totalLeads}
            onChange={(e) => set('totalLeads', Number(e.target.value))}
            className={inputCls}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Total de respostas</label>
          <input
            type="number"
            min={0}
            value={value.totalRespostas}
            onChange={(e) => set('totalRespostas', Number(e.target.value))}
            className={inputCls}
          />
          {taxa && (
            <p className="text-xs text-emerald-600 mt-1 font-medium">Taxa de resposta: {taxa}%</p>
          )}
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Qualidade do número</label>
          <select
            value={value.qualidade}
            onChange={(e) => set('qualidade', e.target.value as Disparo['qualidade'])}
            className={inputCls}
          >
            <option value="">Não avaliado</option>
            <option value="Boa">Boa</option>
            <option value="Média">Média</option>
            <option value="Ruim">Ruim</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Nome do arquivo da lista</label>
          <input
            type="text"
            value={value.arquivoLista}
            onChange={(e) => set('arquivoLista', e.target.value)}
            placeholder="Ex: leads-maio.xlsx"
            className={inputCls}
          />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Observações</label>
        <textarea
          value={value.observacoes}
          onChange={(e) => set('observacoes', e.target.value)}
          rows={2}
          placeholder="Como foi o disparo, alguma observação..."
          className={inputCls}
        />
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <Button variant="secondary" onClick={onCancel}>Cancelar</Button>
        <Button variant="primary" onClick={onSubmit} disabled={!value.nomeLista.trim()}>{submitLabel}</Button>
      </div>
    </div>
  )
}

