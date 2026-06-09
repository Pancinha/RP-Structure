import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { differenceInDays } from 'date-fns'
import {
  Flame, ChevronLeft, Plus, Trash2, Check, Pencil,
  TrendingUp, Calendar, Zap, CheckCircle2, ExternalLink,
  ClipboardList, CheckCircle, FileText,
} from 'lucide-react'
import { useStore } from '../../store'
import { Badge } from '../../components/ui/Badge'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { DEFAULT_AQUECIMENTO } from '../../types'
import type {
  BMData, AquecimentoBM, BMTemplate, Disparo,
  EtapaAquecimento, ListaAquecimento, DisparoAgendado,
} from '../../types'
import { formatDateShort, statusBMColor } from '../../utils/format'

// ── Constants ──────────────────────────────────────────────

const ETAPA_OPTIONS: { value: EtapaAquecimento; label: string; short: string }[] = [
  { value: 'não_iniciado',        label: 'Não iniciado',        short: 'Não\niniciado' },
  { value: 'template_criando',    label: 'Criando template',    short: 'Criando\ntemplate' },
  { value: 'template_aguardando', label: 'Aguardando aprovação',short: 'Aguardando\naprovação' },
  { value: 'template_aprovado',   label: 'Template aprovado',   short: 'Template\naprovado' },
  { value: 'primeiro_disparo',    label: 'Primeiro disparo',    short: '1º\ndisparo' },
  { value: 'aquecendo',           label: 'Aquecendo',           short: 'Aquecendo' },
  { value: 'aquecida',            label: 'Aquecida',            short: 'Aquecida' },
]

const ETAPA_STYLE: Record<EtapaAquecimento, { bg: string; ring: string; text: string; line: string; badge: string }> = {
  não_iniciado:        { bg: 'bg-gray-100',    ring: 'ring-gray-300',   text: 'text-gray-500',   line: 'bg-gray-200',   badge: 'bg-gray-100 text-gray-600 border-gray-200' },
  template_criando:    { bg: 'bg-yellow-400',  ring: 'ring-yellow-400', text: 'text-yellow-800', line: 'bg-yellow-300', badge: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  template_aguardando: { bg: 'bg-amber-400',   ring: 'ring-amber-400',  text: 'text-amber-800',  line: 'bg-amber-300',  badge: 'bg-amber-100 text-amber-800 border-amber-200' },
  template_aprovado:   { bg: 'bg-blue-500',    ring: 'ring-blue-400',   text: 'text-blue-800',   line: 'bg-blue-300',   badge: 'bg-blue-100 text-blue-800 border-blue-200' },
  primeiro_disparo:    { bg: 'bg-purple-500',  ring: 'ring-purple-400', text: 'text-purple-800', line: 'bg-purple-300', badge: 'bg-purple-100 text-purple-800 border-purple-200' },
  aquecendo:           { bg: 'bg-orange-500',  ring: 'ring-orange-400', text: 'text-orange-800', line: 'bg-orange-300', badge: 'bg-orange-100 text-orange-800 border-orange-200' },
  aquecida:            { bg: 'bg-green-500',   ring: 'ring-green-400',  text: 'text-green-800',  line: 'bg-green-300',  badge: 'bg-green-100 text-green-800 border-green-200' },
}

// ── Helpers ────────────────────────────────────────────────

function makeId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
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

function templateStatusColor(s: BMTemplate['status']): string {
  return s === 'aprovado' ? 'bg-green-100 text-green-800 border-green-200'
    : s === 'aguardando' ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
    : s === 'recusado' ? 'bg-red-100 text-red-800 border-red-200'
    : 'bg-gray-100 text-gray-600 border-gray-200'
}

function templateStatusLabel(s: BMTemplate['status']): string {
  return { criando: 'Criando', aguardando: 'Aguardando', aprovado: 'Aprovado', recusado: 'Recusado' }[s]
}

function qualidadeColor(q: string): string {
  return q === 'Boa' ? 'bg-green-100 text-green-800 border-green-200'
    : q === 'Média' ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
    : q === 'Ruim' ? 'bg-red-100 text-red-800 border-red-200'
    : 'bg-gray-100 text-gray-400 border-gray-200'
}

function listaTipoColor(t: ListaAquecimento['tipo']): string {
  return t === 'csv' ? 'bg-green-100 text-green-800 border-green-200'
    : t === 'xlsx' ? 'bg-blue-100 text-blue-800 border-blue-200'
    : t === 'pdf' ? 'bg-red-100 text-red-800 border-red-200'
    : 'bg-gray-100 text-gray-600 border-gray-200'
}

function cronogramaStatusColor(s: DisparoAgendado['status']): string {
  return s === 'realizado' ? 'bg-green-100 text-green-800 border-green-200'
    : s === 'cancelado' ? 'bg-red-100 text-red-800 border-red-200'
    : 'bg-blue-100 text-blue-800 border-blue-200'
}

// ── Mini bar chart ─────────────────────────────────────────

function MiniChart({ disparos }: { disparos: Disparo[] }) {
  if (disparos.length === 0) return null
  const sorted = [...disparos].sort((a, b) => a.data.localeCompare(b.data)).slice(-10)
  const maxVal = Math.max(...sorted.flatMap((d) => [d.totalLeads || 0, d.totalRespostas || 0]), 1)
  return (
    <div className="flex items-end gap-0.5 h-8">
      {sorted.map((d, i) => (
        <div
          key={i}
          className="flex-1 flex items-end gap-px"
          title={`${formatDateShort(d.data)}: ${(d.totalLeads || 0).toLocaleString('pt-BR')} leads, ${(d.totalRespostas || 0).toLocaleString('pt-BR')} resp.`}
        >
          <div className="flex-1 bg-blue-300 rounded-t-sm" style={{ height: `${Math.max(((d.totalLeads || 0) / maxVal) * 32, 1)}px` }} />
          <div className="flex-1 bg-emerald-300 rounded-t-sm" style={{ height: `${Math.max(((d.totalRespostas || 0) / maxVal) * 32, 1)}px` }} />
        </div>
      ))}
    </div>
  )
}

// ── Visual stepper ─────────────────────────────────────────

function Stepper({ etapa, onChange }: { etapa: EtapaAquecimento; onChange: (e: EtapaAquecimento) => void }) {
  const currentIdx = ETAPA_OPTIONS.findIndex((o) => o.value === etapa)
  return (
    <div className="flex items-start">
      {ETAPA_OPTIONS.map((o, i) => {
        const done = i < currentIdx
        const active = i === currentIdx
        const s = ETAPA_STYLE[o.value]
        return (
          <div key={o.value} className="flex items-start flex-1 last:flex-none">
            <button
              onClick={() => onChange(o.value)}
              className="flex flex-col items-center gap-1.5 group"
              title={o.label}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ring-2 transition-all
                  ${done ? `${s.bg} ring-transparent text-white shadow-sm` : ''}
                  ${active ? `${s.bg} ring-offset-2 ${s.ring} text-white shadow-md scale-110 ring-transparent` : ''}
                  ${!done && !active ? 'bg-white ring-gray-200 text-gray-400 group-hover:ring-gray-400 group-hover:text-gray-600' : ''}
                `}
              >
                {done ? <Check size={13} strokeWidth={3} /> : i + 1}
              </div>
              <span className={`text-[9px] text-center leading-tight whitespace-pre-line w-14 transition-colors
                ${done ? 'text-green-700 font-medium' : ''}
                ${active ? `${s.text} font-semibold` : ''}
                ${!done && !active ? 'text-gray-400 group-hover:text-gray-600' : ''}
              `}>{o.short}</span>
            </button>
            {i < ETAPA_OPTIONS.length - 1 && (
              <div className={`flex-1 h-0.5 mt-4 mx-0.5 rounded-full ${done ? s.line : 'bg-gray-200'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Modal types ────────────────────────────────────────────

type ModalState =
  | { type: 'template-add' }
  | { type: 'template-edit'; data: BMTemplate }
  | { type: 'lista-add' }
  | { type: 'lista-edit'; data: ListaAquecimento }
  | { type: 'cronograma-add' }
  | { type: 'cronograma-edit'; data: DisparoAgendado }
  | { type: 'disparo-add' }
  | { type: 'disparo-edit'; data: Disparo }
  | null

const inputCls = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'

// ── Main page ──────────────────────────────────────────────

export function ClienteAquecimento() {
  const { clientId } = useParams<{ clientId: string }>()
  const navigate = useNavigate()
  const clients = useStore((s) => s.clients)
  const updateBMReceptiva = useStore((s) => s.updateBMReceptiva)
  const updateBMAtiva = useStore((s) => s.updateBMAtiva)

  const client = clients.find((c) => c.id === clientId)

  const [activeTab, setActiveTab] = useState<'receptiva' | 'ativa'>('receptiva')
  const [formR, setFormR] = useState<BMData>(() =>
    client ? { ...client.bmReceptiva, aquecimento: resolveAq(client.bmReceptiva) } : ({} as BMData)
  )
  const [formA, setFormA] = useState<BMData>(() =>
    client ? { ...client.bmAtiva, aquecimento: resolveAq(client.bmAtiva) } : ({} as BMData)
  )
  const [dirtyR, setDirtyR] = useState(false)
  const [dirtyA, setDirtyA] = useState(false)
  const [modal, setModal] = useState<ModalState>(null)

  useEffect(() => {
    if (!client) { navigate('/aquecimento'); return }
    // Only reset if not dirty — avoids overwriting unsaved config changes
    if (!dirtyR) setFormR({ ...client.bmReceptiva, aquecimento: resolveAq(client.bmReceptiva) })
    if (!dirtyA) setFormA({ ...client.bmAtiva, aquecimento: resolveAq(client.bmAtiva) })
  }, [client?.id, client?.atualizadoEm])

  if (!client) return null

  const form = activeTab === 'receptiva' ? formR : formA
  const dirty = activeTab === 'receptiva' ? dirtyR : dirtyA
  const setForm = activeTab === 'receptiva' ? setFormR : setFormA
  const setDirty = activeTab === 'receptiva' ? setDirtyR : setDirtyA

  const aq = form.aquecimento ?? DEFAULT_AQUECIMENTO

  // Updates config fields in local state only (requires explicit save button)
  function setAq<K extends keyof AquecimentoBM>(key: K, value: AquecimentoBM[K]) {
    setForm((f) => ({ ...f, aquecimento: { ...(f.aquecimento ?? DEFAULT_AQUECIMENTO), [key]: value } }))
    setDirty(true)
  }

  // Builds new form from current state + partial, persists immediately to store/DB
  function applyAndSave(partialAq: Partial<AquecimentoBM>) {
    const newAq = { ...(form.aquecimento ?? DEFAULT_AQUECIMENTO), ...partialAq }
    const newForm = { ...form, aquecimento: newAq }
    setForm(newForm)
    setDirty(false)
    const update = activeTab === 'receptiva' ? updateBMReceptiva : updateBMAtiva
    update(client!.id, newForm)
  }

  // Config save (limite, dataInicio, observacoes)
  function saveConfig() {
    const update = activeTab === 'receptiva' ? updateBMReceptiva : updateBMAtiva
    update(client!.id, form)
    setDirty(false)
  }

  // ── Templates ──────────────────────────────────────────
  function handleSaveTemplate(data: Omit<BMTemplate, 'id'> | BMTemplate) {
    const newTemplates = 'id' in data
      ? aq.templates.map((t) => t.id === data.id ? data : t)
      : [...aq.templates, { ...data, id: makeId() }]
    // Auto-advance: não_iniciado → template_criando when first template is added
    const autoEtapa: EtapaAquecimento =
      aq.etapa === 'não_iniciado' && newTemplates.length > 0 ? 'template_criando' : aq.etapa
    applyAndSave({ templates: newTemplates, etapa: autoEtapa })
    setModal(null)
  }
  function deleteTemplate(id: string) {
    applyAndSave({ templates: aq.templates.filter((t) => t.id !== id) })
  }

  // ── Listas ─────────────────────────────────────────────
  function handleSaveLista(data: Omit<ListaAquecimento, 'id'> | ListaAquecimento) {
    const newListas = 'id' in data
      ? aq.listas.map((l) => l.id === data.id ? data : l)
      : [...aq.listas, { ...data, id: makeId() }]
    applyAndSave({ listas: newListas })
    setModal(null)
  }
  function deleteLista(id: string) {
    applyAndSave({ listas: aq.listas.filter((l) => l.id !== id) })
  }

  // ── Cronograma ─────────────────────────────────────────
  function handleSaveCronograma(data: Omit<DisparoAgendado, 'id'> | DisparoAgendado) {
    const newCronograma = 'id' in data
      ? aq.cronograma.map((c) => c.id === data.id ? data : c)
      : [...aq.cronograma, { ...data, id: makeId() }]
    applyAndSave({ cronograma: newCronograma })
    setModal(null)
  }
  function deleteCronograma(id: string) {
    applyAndSave({ cronograma: aq.cronograma.filter((c) => c.id !== id) })
  }

  // ── Disparos ───────────────────────────────────────────
  const ETAPAS_ANTES_DISPARO: EtapaAquecimento[] = [
    'não_iniciado', 'template_criando', 'template_aguardando', 'template_aprovado',
  ]
  function handleSaveDisparo(data: Omit<Disparo, 'id'> | Disparo) {
    const isNew = !('id' in data)
    const newDisparos = isNew
      ? [...aq.disparos, { ...data, id: makeId() }]
      : aq.disparos.map((d) => d.id === data.id ? data : d)
    // Auto-advance: etapas iniciais → primeiro_disparo when first disparo is registered
    const autoEtapa: EtapaAquecimento =
      isNew && ETAPAS_ANTES_DISPARO.includes(aq.etapa) ? 'primeiro_disparo' : aq.etapa
    applyAndSave({ disparos: newDisparos, etapa: autoEtapa })
    setModal(null)
  }
  function deleteDisparo(id: string) {
    applyAndSave({ disparos: aq.disparos.filter((d) => d.id !== id) })
  }

  // ── Computed values ────────────────────────────────────
  const disparosOrdenados = [...aq.disparos].sort((a, b) => b.data.localeCompare(a.data))
  const totalLeads = aq.disparos.reduce((s, d) => s + (d.totalLeads || 0), 0)
  const totalRespostas = aq.disparos.reduce((s, d) => s + (d.totalRespostas || 0), 0)
  const taxaResposta = totalLeads > 0 ? ((totalRespostas / totalLeads) * 100).toFixed(1) : '0'
  const templatesAprovados = aq.templates.filter((t) => t.status === 'aprovado').length
  const diasAquecendo = aq.dataInicio ? differenceInDays(new Date(), new Date(aq.dataInicio)) : null
  const etapaAtual = ETAPA_OPTIONS.find((e) => e.value === aq.etapa)!
  const cronogramaOrdenado = [...aq.cronograma].sort((a, b) => a.dataPlanejada.localeCompare(b.dataPlanejada))
  const listasOrdenadas = [...aq.listas].sort((a, b) => b.dataAdicionada.localeCompare(a.dataAdicionada))

  const bmLabel = activeTab === 'receptiva' ? 'BM Receptiva' : 'BM Ativa'

  return (
    <div className="p-6 space-y-5 max-w-5xl mx-auto">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <nav className="flex items-center gap-1.5 text-sm text-gray-400 mb-1">
            <Link to="/aquecimento" className="hover:text-blue-600 transition-colors flex items-center gap-1">
              <ChevronLeft size={14} /> Aquecimento
            </Link>
            <span>/</span>
            <span className="text-gray-700 font-medium">{client.nomeConhecido || client.nome}</span>
          </nav>
          <div className="flex items-center gap-3 mt-1">
            <div className="p-2 bg-orange-100 rounded-xl">
              <Flame size={18} className="text-orange-500" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{client.nomeConhecido || client.nome}</h1>
              <p className="text-sm text-gray-500">Gestão de aquecimento de BMs</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          {dirty && (
            <span className="text-xs text-orange-600 bg-orange-50 border border-orange-200 px-2 py-1 rounded-full">
              Configurações não salvas
            </span>
          )}
          {dirty && (
            <Button variant="primary" onClick={saveConfig}>
              Salvar configurações
            </Button>
          )}
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl w-fit">
        {(['receptiva', 'ativa'] as const).map((t) => {
          const bm = t === 'receptiva' ? client.bmReceptiva : client.bmAtiva
          const aqBM = resolveAq(bm)
          const isDirty = t === 'receptiva' ? dirtyR : dirtyA
          return (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === t ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t === 'receptiva' ? 'BM Receptiva' : 'BM Ativa'}
              <Badge
                label={ETAPA_OPTIONS.find((e) => e.value === aqBM.etapa)?.label ?? aqBM.etapa}
                className={ETAPA_STYLE[aqBM.etapa].badge}
              />
              {isDirty && <span className="w-1.5 h-1.5 bg-orange-400 rounded-full" title="Configurações não salvas" />}
            </button>
          )
        })}
      </div>

      {/* ── BM info line ── */}
      {form.nome && (
        <div className="flex items-center gap-3 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm">
          <span className="font-medium text-gray-900">{form.nome}</span>
          {form.idBM && <span className="text-gray-400 font-mono text-xs">ID: {form.idBM}</span>}
          <Badge label={form.status} className={statusBMColor(form.status)} />
          <span className="ml-auto text-xs text-gray-400">{bmLabel}</span>
        </div>
      )}

      {/* ── Stepper ── */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs text-gray-500 font-medium mb-0.5">Etapa de aquecimento</p>
            <div className="flex items-center gap-2">
              <Badge label={etapaAtual.label} className={ETAPA_STYLE[aq.etapa].badge} />
            </div>
          </div>
          <p className="text-xs text-gray-400">Clique em uma etapa para avançar ou retroceder</p>
        </div>
        <Stepper etapa={aq.etapa} onChange={(e) => applyAndSave({ etapa: e })} />
      </Card>

      {/* ── Config + mini stats ── */}
      <div className="grid grid-cols-3 gap-4">
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
          <label className="block text-xs font-medium text-gray-700 mb-1">Observações gerais</label>
          <input
            type="text"
            value={aq.observacoes}
            onChange={(e) => setAq('observacoes', e.target.value)}
            placeholder="Notas sobre o aquecimento..."
            className={inputCls}
          />
        </div>
      </div>

      {/* Mini stats */}
      {aq.etapa !== 'não_iniciado' && (
        <div className="grid grid-cols-4 gap-3">
          {[
            { icon: <Calendar size={14} className="text-blue-600" />, bg: 'bg-blue-50 border-blue-100', value: diasAquecendo !== null ? `${diasAquecendo}d` : '—', label: 'aquecendo', textColor: 'text-blue-700' },
            { icon: <CheckCircle2 size={14} className="text-purple-600" />, bg: 'bg-purple-50 border-purple-100', value: `${templatesAprovados}/${aq.templates.length}`, label: 'templates aprovados', textColor: 'text-purple-700' },
            { icon: <Zap size={14} className="text-orange-600" />, bg: 'bg-orange-50 border-orange-100', value: String(aq.disparos.length), label: 'disparos realizados', textColor: 'text-orange-700' },
            { icon: <TrendingUp size={14} className="text-emerald-600" />, bg: 'bg-emerald-50 border-emerald-100', value: `${taxaResposta}%`, label: 'taxa de resposta', textColor: Number(taxaResposta) >= 10 ? 'text-emerald-700' : Number(taxaResposta) >= 5 ? 'text-yellow-700' : 'text-emerald-700' },
          ].map((s) => (
            <div key={s.label} className={`${s.bg} border rounded-xl p-3 flex items-center gap-2.5`}>
              <div className="flex-shrink-0">{s.icon}</div>
              <div>
                <p className={`text-lg font-bold leading-none ${s.textColor}`}>{s.value}</p>
                <p className="text-[10px] text-gray-500 mt-0.5">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Templates ─────────────────────────────────── */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FileText size={16} className="text-gray-400" />
            <h3 className="text-sm font-semibold text-gray-800">Templates</h3>
            <span className="text-xs text-gray-400">
              {templatesAprovados} aprovado{templatesAprovados !== 1 ? 's' : ''} de {aq.templates.length}
            </span>
          </div>
          <Button variant="secondary" size="sm" onClick={() => setModal({ type: 'template-add' })}>
            <Plus size={13} /> Adicionar template
          </Button>
        </div>

        {aq.templates.length === 0 ? (
          <div className="py-8 flex flex-col items-center gap-2 text-gray-400 bg-gray-50 rounded-xl">
            <FileText size={24} className="text-gray-300" />
            <p className="text-sm">Nenhum template cadastrado ainda.</p>
            <button onClick={() => setModal({ type: 'template-add' })} className="text-xs text-blue-600 hover:underline">
              Adicionar o primeiro template
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {aq.templates.map((t) => (
              <div key={t.id} className="flex items-start gap-3 p-3.5 bg-gray-50 rounded-xl border border-gray-100 group">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-gray-900">{t.nome}</p>
                    <Badge label={templateStatusLabel(t.status)} className={templateStatusColor(t.status)} />
                    {t.categoria && (
                      <Badge
                        label={t.categoria}
                        className={
                          t.categoria === 'utility' ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                            : t.categoria === 'marketing' ? 'bg-orange-100 text-orange-800 border-orange-200'
                            : 'bg-blue-100 text-blue-800 border-blue-200'
                        }
                      />
                    )}
                  </div>
                  <div className="flex items-center gap-4 mt-1.5">
                    {t.dataEnvio && (
                      <p className="text-xs text-gray-400 flex items-center gap-1">
                        <Calendar size={10} /> Envio: {formatDateShort(t.dataEnvio)}
                      </p>
                    )}
                    {t.dataAprovacao && (
                      <p className="text-xs text-gray-400 flex items-center gap-1">
                        <CheckCircle size={10} /> Aprovação: {formatDateShort(t.dataAprovacao)}
                      </p>
                    )}
                  </div>
                  {t.observacoes && (
                    <p className="text-xs text-gray-500 italic mt-1">{t.observacoes}</p>
                  )}
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                  <button onClick={() => setModal({ type: 'template-edit', data: { ...t } })} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Editar">
                    <Pencil size={12} />
                  </button>
                  <button onClick={() => deleteTemplate(t.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Excluir">
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* ── Listas ────────────────────────────────────── */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ClipboardList size={16} className="text-gray-400" />
            <h3 className="text-sm font-semibold text-gray-800">Listas de disparo</h3>
            <span className="text-xs text-gray-400">{aq.listas.length} lista{aq.listas.length !== 1 ? 's' : ''}</span>
          </div>
          <Button variant="secondary" size="sm" onClick={() => setModal({ type: 'lista-add' })}>
            <Plus size={13} /> Adicionar lista
          </Button>
        </div>

        {listasOrdenadas.length === 0 ? (
          <div className="py-8 flex flex-col items-center gap-2 text-gray-400 bg-gray-50 rounded-xl">
            <ClipboardList size={24} className="text-gray-300" />
            <p className="text-sm">Nenhuma lista cadastrada.</p>
            <p className="text-xs text-gray-400">Adicione as listas de contatos que serão usadas nos disparos.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {listasOrdenadas.map((l) => (
              <div key={l.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 group">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-gray-900">{l.nome}</p>
                    <Badge label={l.tipo.toUpperCase()} className={listaTipoColor(l.tipo)} />
                    {l.arquivo && <span className="text-xs text-gray-400">📄 {l.arquivo}</span>}
                    {l.urlExterno && (
                      <a href={l.urlExterno} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
                        <ExternalLink size={10} /> Abrir arquivo
                      </a>
                    )}
                  </div>
                  <div className="flex items-center gap-4 mt-1">
                    {l.totalContatos > 0 && (
                      <p className="text-xs text-gray-500 font-medium">{l.totalContatos.toLocaleString('pt-BR')} contatos</p>
                    )}
                    {l.dataAdicionada && (
                      <p className="text-xs text-gray-400">Adicionada: {formatDateShort(l.dataAdicionada)}</p>
                    )}
                    {l.observacoes && <p className="text-xs text-gray-400 italic truncate max-w-48">{l.observacoes}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                  <button onClick={() => setModal({ type: 'lista-edit', data: { ...l } })} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                    <Pencil size={12} />
                  </button>
                  <button onClick={() => deleteLista(l.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* ── Cronograma ────────────────────────────────── */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-gray-400" />
            <h3 className="text-sm font-semibold text-gray-800">Cronograma de disparos</h3>
            <span className="text-xs text-gray-400">{aq.cronograma.length} agendado{aq.cronograma.length !== 1 ? 's' : ''}</span>
          </div>
          <Button variant="secondary" size="sm" onClick={() => setModal({ type: 'cronograma-add' })}>
            <Plus size={13} /> Planejar disparo
          </Button>
        </div>

        {cronogramaOrdenado.length === 0 ? (
          <div className="py-8 flex flex-col items-center gap-2 text-gray-400 bg-gray-50 rounded-xl">
            <Calendar size={24} className="text-gray-300" />
            <p className="text-sm">Nenhum disparo planejado.</p>
            <p className="text-xs text-gray-400">Planeje os próximos disparos com data e lista prevista.</p>
          </div>
        ) : (
          <div className="relative">
            <div className="absolute left-[7px] top-1 bottom-1 w-px bg-gray-200" />
            <div className="space-y-2">
              {cronogramaOrdenado.map((c) => {
                const isPast = c.dataPlanejada < new Date().toISOString().slice(0, 10)
                const lista = aq.listas.find((l) => l.id === c.listaId)
                return (
                  <div key={c.id} className="pl-6 relative group">
                    <div className={`absolute left-0 top-3 w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm
                      ${c.status === 'realizado' ? 'bg-green-400' : c.status === 'cancelado' ? 'bg-red-400' : isPast ? 'bg-orange-400' : 'bg-blue-400'}`}
                    />
                    <div className={`flex items-center gap-3 p-3 rounded-xl border ${
                      c.status === 'realizado' ? 'bg-green-50 border-green-100' :
                      c.status === 'cancelado' ? 'bg-gray-50 border-gray-100 opacity-60' :
                      isPast ? 'bg-orange-50 border-orange-100' :
                      'bg-blue-50 border-blue-100'
                    }`}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-gray-900">{formatDateShort(c.dataPlanejada)}</span>
                          <Badge label={c.status === 'planejado' ? 'Planejado' : c.status === 'realizado' ? 'Realizado' : 'Cancelado'} className={cronogramaStatusColor(c.status)} />
                          {c.nomeLista && <span className="text-xs text-gray-600">{c.nomeLista}</span>}
                          {lista && <span className="text-xs text-gray-400">(📄 {lista.arquivo || lista.nome})</span>}
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          {c.leadsPlanificados > 0 && (
                            <span className="text-xs text-gray-500">{c.leadsPlanificados.toLocaleString('pt-BR')} leads previstos</span>
                          )}
                          {c.observacoes && <span className="text-xs text-gray-400 italic">{c.observacoes}</span>}
                          {isPast && c.status === 'planejado' && (
                            <span className="text-xs text-orange-600 font-medium">⚠ Data passada</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                        <button onClick={() => setModal({ type: 'cronograma-edit', data: { ...c } })} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-100 rounded-lg">
                          <Pencil size={12} />
                        </button>
                        <button onClick={() => deleteCronograma(c.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-100 rounded-lg">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </Card>

      {/* ── Disparos realizados ───────────────────────── */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Zap size={16} className="text-gray-400" />
            <h3 className="text-sm font-semibold text-gray-800">Disparos realizados</h3>
            <span className="text-xs text-gray-400">{aq.disparos.length} disparo{aq.disparos.length !== 1 ? 's' : ''}</span>
          </div>
          <Button variant="secondary" size="sm" onClick={() => setModal({ type: 'disparo-add' })}>
            <Plus size={13} /> Registrar disparo
          </Button>
        </div>

        {aq.disparos.length > 0 && (
          <div className="grid grid-cols-4 gap-3 mb-4 p-4 bg-gradient-to-br from-blue-50 to-emerald-50 rounded-xl border border-blue-100">
            {[
              { label: 'Disparos', value: String(aq.disparos.length), color: 'text-blue-700' },
              { label: 'Leads', value: totalLeads.toLocaleString('pt-BR'), color: 'text-blue-700' },
              { label: 'Respostas', value: totalRespostas.toLocaleString('pt-BR'), color: 'text-emerald-700' },
              { label: 'Taxa', value: `${taxaResposta}%`, color: Number(taxaResposta) >= 10 ? 'text-emerald-700' : Number(taxaResposta) >= 5 ? 'text-yellow-700' : 'text-red-600' },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-gray-500">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {aq.disparos.length > 1 && (
          <div className="mb-4 px-2">
            <MiniChart disparos={aq.disparos} />
            <div className="flex items-center gap-3 mt-1.5">
              <div className="flex items-center gap-1"><div className="w-2 h-2 bg-blue-300 rounded-sm" /><span className="text-[10px] text-gray-400">Leads</span></div>
              <div className="flex items-center gap-1"><div className="w-2 h-2 bg-emerald-300 rounded-sm" /><span className="text-[10px] text-gray-400">Respostas</span></div>
            </div>
          </div>
        )}

        {aq.disparos.length === 0 ? (
          <div className="py-8 flex flex-col items-center gap-2 text-gray-400 bg-gray-50 rounded-xl">
            <Zap size={24} className="text-gray-300" />
            <p className="text-sm">Nenhum disparo registrado ainda.</p>
            <button onClick={() => setModal({ type: 'disparo-add' })} className="text-xs text-blue-600 hover:underline">
              Registrar o primeiro disparo
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {disparosOrdenados.map((d) => (
              <div key={d.id} className="flex items-start gap-3 p-3.5 bg-gray-50 rounded-xl border border-gray-100 group">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-gray-900">{d.nomeLista}</p>
                    <span className="text-xs text-gray-400">{formatDateShort(d.data)}</span>
                    {d.qualidade && <Badge label={d.qualidade} className={qualidadeColor(d.qualidade)} />}
                  </div>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    <p className="text-xs text-gray-600">
                      <span className="font-semibold text-blue-700">{(d.totalLeads || 0).toLocaleString('pt-BR')}</span> leads
                      {' → '}
                      <span className="font-semibold text-emerald-700">{(d.totalRespostas || 0).toLocaleString('pt-BR')}</span> respostas
                      {(d.totalLeads || 0) > 0 && (
                        <span className="text-gray-400 ml-1">({(((d.totalRespostas || 0) / (d.totalLeads || 1)) * 100).toFixed(1)}%)</span>
                      )}
                    </p>
                    {d.arquivoLista && <span className="text-xs text-gray-400">📄 {d.arquivoLista}</span>}
                    {d.observacoes && <span className="text-xs text-gray-400 italic">{d.observacoes}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                  <button onClick={() => setModal({ type: 'disparo-edit', data: { ...d } })} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                    <Pencil size={12} />
                  </button>
                  <button onClick={() => deleteDisparo(d.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* ══════════════════════════════════════════════════ */}
      {/* ── MODALS ── */}
      {/* ══════════════════════════════════════════════════ */}

      {/* Template */}
      <Modal
        open={modal?.type === 'template-add' || modal?.type === 'template-edit'}
        onClose={() => setModal(null)}
        title={modal?.type === 'template-edit' ? 'Editar template' : 'Adicionar template'}
        size="md"
      >
        {(modal?.type === 'template-add' || modal?.type === 'template-edit') && (
          <TemplateForm
            initial={modal.type === 'template-edit' ? modal.data : undefined}
            onSave={handleSaveTemplate}
            onCancel={() => setModal(null)}
          />
        )}
      </Modal>

      {/* Lista */}
      <Modal
        open={modal?.type === 'lista-add' || modal?.type === 'lista-edit'}
        onClose={() => setModal(null)}
        title={modal?.type === 'lista-edit' ? 'Editar lista' : 'Adicionar lista'}
        size="md"
      >
        {(modal?.type === 'lista-add' || modal?.type === 'lista-edit') && (
          <ListaForm
            initial={modal.type === 'lista-edit' ? modal.data : undefined}
            onSave={handleSaveLista}
            onCancel={() => setModal(null)}
          />
        )}
      </Modal>

      {/* Cronograma */}
      <Modal
        open={modal?.type === 'cronograma-add' || modal?.type === 'cronograma-edit'}
        onClose={() => setModal(null)}
        title={modal?.type === 'cronograma-edit' ? 'Editar disparo planejado' : 'Planejar disparo'}
        size="md"
      >
        {(modal?.type === 'cronograma-add' || modal?.type === 'cronograma-edit') && (
          <CronogramaForm
            initial={modal.type === 'cronograma-edit' ? modal.data : undefined}
            listas={aq.listas}
            onSave={handleSaveCronograma}
            onCancel={() => setModal(null)}
          />
        )}
      </Modal>

      {/* Disparo */}
      <Modal
        open={modal?.type === 'disparo-add' || modal?.type === 'disparo-edit'}
        onClose={() => setModal(null)}
        title={modal?.type === 'disparo-edit' ? 'Editar disparo' : 'Registrar disparo realizado'}
        size="md"
      >
        {(modal?.type === 'disparo-add' || modal?.type === 'disparo-edit') && (
          <DisparoForm
            initial={modal.type === 'disparo-edit' ? modal.data : undefined}
            listas={aq.listas}
            onSave={handleSaveDisparo}
            onCancel={() => setModal(null)}
          />
        )}
      </Modal>
    </div>
  )
}

// ── Form components ────────────────────────────────────────

function TemplateForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: BMTemplate
  onSave: (data: Omit<BMTemplate, 'id'> | BMTemplate) => void
  onCancel: () => void
}) {
  const [v, setV] = useState<Omit<BMTemplate, 'id'> | BMTemplate>(
    initial ?? { nome: '', dataEnvio: '', dataAprovacao: '', status: 'criando', categoria: '', observacoes: '' }
  )
  const set = <K extends keyof typeof v>(k: K, val: (typeof v)[K]) => setV((f) => ({ ...f, [k]: val }))
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Nome do template *</label>
        <input type="text" value={v.nome} onChange={(e) => set('nome', e.target.value)} placeholder="Ex: Boas-vindas utility" className={inputCls} autoFocus />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
          <select value={v.status} onChange={(e) => set('status', e.target.value as BMTemplate['status'])} className={inputCls}>
            <option value="criando">Criando</option>
            <option value="aguardando">Aguardando aprovação</option>
            <option value="aprovado">Aprovado</option>
            <option value="recusado">Recusado</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Categoria</label>
          <select value={v.categoria} onChange={(e) => set('categoria', e.target.value as BMTemplate['categoria'])} className={inputCls}>
            <option value="">Não definida</option>
            <option value="utility">Utility</option>
            <option value="marketing">Marketing</option>
            <option value="authentication">Authentication</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Data de envio</label>
          <input type="date" value={v.dataEnvio} onChange={(e) => set('dataEnvio', e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Data de aprovação</label>
          <input type="date" value={v.dataAprovacao} onChange={(e) => set('dataAprovacao', e.target.value)} className={inputCls} />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Observações</label>
        <textarea value={v.observacoes} onChange={(e) => set('observacoes', e.target.value)} rows={2} className={inputCls} />
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <Button variant="secondary" onClick={onCancel}>Cancelar</Button>
        <Button variant="primary" onClick={() => onSave(v)} disabled={!v.nome.trim()}>
          {initial ? 'Salvar' : 'Adicionar'}
        </Button>
      </div>
    </div>
  )
}

function ListaForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: ListaAquecimento
  onSave: (data: Omit<ListaAquecimento, 'id'> | ListaAquecimento) => void
  onCancel: () => void
}) {
  const [v, setV] = useState<Omit<ListaAquecimento, 'id'> | ListaAquecimento>(
    initial ?? { nome: '', arquivo: '', urlExterno: '', tipo: 'xlsx', totalContatos: 0, dataAdicionada: new Date().toISOString().slice(0, 10), observacoes: '' }
  )
  const set = <K extends keyof typeof v>(k: K, val: (typeof v)[K]) => setV((f) => ({ ...f, [k]: val }))
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Nome descritivo da lista *</label>
        <input type="text" value={v.nome} onChange={(e) => set('nome', e.target.value)} placeholder="Ex: Lista leads maio" className={inputCls} autoFocus />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Nome do arquivo</label>
          <input type="text" value={v.arquivo} onChange={(e) => set('arquivo', e.target.value)} placeholder="Ex: leads-maio.xlsx" className={inputCls} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Tipo de arquivo</label>
          <select value={v.tipo} onChange={(e) => set('tipo', e.target.value as ListaAquecimento['tipo'])} className={inputCls}>
            <option value="xlsx">Excel (.xlsx)</option>
            <option value="csv">CSV (.csv)</option>
            <option value="pdf">PDF (.pdf)</option>
            <option value="outro">Outro</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Total de contatos</label>
          <input type="number" min={0} value={v.totalContatos} onChange={(e) => set('totalContatos', Number(e.target.value))} className={inputCls} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Data de adição</label>
          <input type="date" value={v.dataAdicionada} onChange={(e) => set('dataAdicionada', e.target.value)} className={inputCls} />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Link externo (Google Drive / Dropbox)
          <span className="text-gray-400 font-normal ml-1">— opcional</span>
        </label>
        <input type="url" value={v.urlExterno} onChange={(e) => set('urlExterno', e.target.value)} placeholder="https://drive.google.com/..." className={inputCls} />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Observações</label>
        <textarea value={v.observacoes} onChange={(e) => set('observacoes', e.target.value)} rows={2} className={inputCls} />
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <Button variant="secondary" onClick={onCancel}>Cancelar</Button>
        <Button variant="primary" onClick={() => onSave(v)} disabled={!v.nome.trim()}>
          {initial ? 'Salvar' : 'Adicionar'}
        </Button>
      </div>
    </div>
  )
}

function CronogramaForm({
  initial,
  listas,
  onSave,
  onCancel,
}: {
  initial?: DisparoAgendado
  listas: ListaAquecimento[]
  onSave: (data: Omit<DisparoAgendado, 'id'> | DisparoAgendado) => void
  onCancel: () => void
}) {
  const [v, setV] = useState<Omit<DisparoAgendado, 'id'> | DisparoAgendado>(
    initial ?? { dataPlanejada: '', nomeLista: '', listaId: '', leadsPlanificados: 0, observacoes: '', status: 'planejado' }
  )
  const set = <K extends keyof typeof v>(k: K, val: (typeof v)[K]) => setV((f) => ({ ...f, [k]: val }))
  const selectedLista = listas.find((l) => l.id === v.listaId)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Data planejada *</label>
          <input type="date" value={v.dataPlanejada} onChange={(e) => set('dataPlanejada', e.target.value)} className={inputCls} autoFocus />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
          <select value={v.status} onChange={(e) => set('status', e.target.value as DisparoAgendado['status'])} className={inputCls}>
            <option value="planejado">Planejado</option>
            <option value="realizado">Realizado</option>
            <option value="cancelado">Cancelado</option>
          </select>
        </div>
      </div>
      {listas.length > 0 && (
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Lista cadastrada</label>
          <select value={v.listaId} onChange={(e) => {
            const lista = listas.find((l) => l.id === e.target.value)
            set('listaId', e.target.value)
            if (lista) set('nomeLista', lista.nome)
          }} className={inputCls}>
            <option value="">Selecionar lista...</option>
            {listas.map((l) => <option key={l.id} value={l.id}>{l.nome} ({l.arquivo})</option>)}
          </select>
        </div>
      )}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Nome da lista
          {selectedLista && <span className="text-gray-400 font-normal ml-1">— preenchido automaticamente</span>}
        </label>
        <input type="text" value={v.nomeLista} onChange={(e) => set('nomeLista', e.target.value)} placeholder="Ex: Lista leads maio" className={inputCls} />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Leads previstos</label>
        <input type="number" min={0} value={v.leadsPlanificados} onChange={(e) => set('leadsPlanificados', Number(e.target.value))} className={inputCls} />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Observações</label>
        <textarea value={v.observacoes} onChange={(e) => set('observacoes', e.target.value)} rows={2} className={inputCls} />
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <Button variant="secondary" onClick={onCancel}>Cancelar</Button>
        <Button variant="primary" onClick={() => onSave(v)} disabled={!v.dataPlanejada}>{initial ? 'Salvar' : 'Planejar'}</Button>
      </div>
    </div>
  )
}

function DisparoForm({
  initial,
  listas,
  onSave,
  onCancel,
}: {
  initial?: Disparo
  listas: ListaAquecimento[]
  onSave: (data: Omit<Disparo, 'id'> | Disparo) => void
  onCancel: () => void
}) {
  const [v, setV] = useState<Omit<Disparo, 'id'> | Disparo>(
    initial ?? { data: new Date().toISOString().slice(0, 10), nomeLista: '', arquivoLista: '', totalLeads: 0, totalRespostas: 0, qualidade: '', observacoes: '' }
  )
  const set = <K extends keyof typeof v>(k: K, val: (typeof v)[K]) => setV((f) => ({ ...f, [k]: val }))
  const taxa = (v.totalLeads || 0) > 0
    ? (((v.totalRespostas || 0) / (v.totalLeads || 1)) * 100).toFixed(1)
    : null

  return (
    <div className="space-y-4">
      {listas.length > 0 && (
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Lista cadastrada (opcional)</label>
          <select onChange={(e) => {
            const lista = listas.find((l) => l.id === e.target.value)
            if (lista) {
              set('nomeLista', lista.nome)
              set('arquivoLista', lista.arquivo)
              if (lista.totalContatos) set('totalLeads', lista.totalContatos)
            }
          }} className={inputCls} defaultValue="">
            <option value="">Selecionar lista para preencher automaticamente...</option>
            {listas.map((l) => <option key={l.id} value={l.id}>{l.nome} — {l.totalContatos.toLocaleString('pt-BR')} contatos</option>)}
          </select>
        </div>
      )}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Nome da lista *</label>
          <input type="text" value={v.nomeLista} onChange={(e) => set('nomeLista', e.target.value)} placeholder="Ex: Lista leads maio" className={inputCls} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Data do disparo</label>
          <input type="date" value={v.data} onChange={(e) => set('data', e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Leads enviados</label>
          <input type="number" min={0} value={v.totalLeads} onChange={(e) => set('totalLeads', Number(e.target.value))} className={inputCls} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Respostas recebidas</label>
          <input type="number" min={0} value={v.totalRespostas} onChange={(e) => set('totalRespostas', Number(e.target.value))} className={inputCls} />
          {taxa && <p className="text-xs text-emerald-600 font-medium mt-1">Taxa: {taxa}%</p>}
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Qualidade do número</label>
          <select value={v.qualidade} onChange={(e) => set('qualidade', e.target.value as Disparo['qualidade'])} className={inputCls}>
            <option value="">Não avaliado</option>
            <option value="Boa">Boa</option>
            <option value="Média">Média</option>
            <option value="Ruim">Ruim</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Arquivo da lista</label>
          <input type="text" value={v.arquivoLista} onChange={(e) => set('arquivoLista', e.target.value)} placeholder="leads-maio.xlsx" className={inputCls} />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Observações</label>
        <textarea value={v.observacoes} onChange={(e) => set('observacoes', e.target.value)} rows={2} placeholder="Como foi o disparo..." className={inputCls} />
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <Button variant="secondary" onClick={onCancel}>Cancelar</Button>
        <Button variant="primary" onClick={() => onSave(v)} disabled={!v.nomeLista.trim()}>{initial ? 'Salvar' : 'Registrar'}</Button>
      </div>
    </div>
  )
}
