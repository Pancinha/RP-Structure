import { useState, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { differenceInDays } from 'date-fns'
import {
  Flame, ChevronRight, Zap, Users, TrendingUp, BarChart2,
  AlertTriangle, Clock, CheckCircle2, MessageSquare, Target,
  ArrowRight, Search, ThumbsDown, Activity, Filter,
  List, Plus, Pencil, Trash2, Download, Upload, FileText,
} from 'lucide-react'
import { useStore } from '../../store'
import { supabase } from '../../lib/supabase'
import { Badge } from '../../components/ui/Badge'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { DEFAULT_AQUECIMENTO } from '../../types'
import type { EtapaAquecimento, BMData, AquecimentoBM, Disparo, GlobalLista } from '../../types'
import { formatDateShort } from '../../utils/format'

const inputCls = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'

function listaTipoColor(t: GlobalLista['tipo']): string {
  return t === 'csv' ? 'bg-green-100 text-green-800 border-green-200'
    : t === 'xlsx' ? 'bg-blue-100 text-blue-800 border-blue-200'
    : t === 'pdf' ? 'bg-red-100 text-red-800 border-red-200'
    : 'bg-gray-100 text-gray-600 border-gray-200'
}

type ListaModal = { type: 'add' } | { type: 'edit'; data: GlobalLista } | null

const ACCEPTED_TYPES = '.csv,.xlsx,.xls'
const MIME_EXT_MAP: Record<string, GlobalLista['tipo']> = {
  'text/csv': 'csv',
  'application/csv': 'csv',
  'application/vnd.ms-excel': 'xlsx',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
}

function inferTipo(file: File): GlobalLista['tipo'] {
  return MIME_EXT_MAP[file.type] ?? (file.name.endsWith('.csv') ? 'csv' : 'xlsx')
}

function ListaForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: GlobalLista
  onSave: (data: Omit<GlobalLista, 'id' | 'criadoEm'>) => Promise<void>
  onCancel: () => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [v, setV] = useState({
    nome: initial?.nome ?? '',
    arquivo: initial?.arquivo ?? '',
    arquivoPath: initial?.arquivoPath ?? '',
    tipo: initial?.tipo ?? 'csv' as GlobalLista['tipo'],
    totalContatos: initial?.totalContatos ?? 0,
    observacoes: initial?.observacoes ?? '',
  })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const set = <K extends keyof typeof v>(k: K, val: (typeof v)[K]) => setV((f) => ({ ...f, [k]: val }))

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setSelectedFile(file)
    setUploadError('')
    if (!v.nome) set('nome', file.name.replace(/\.[^.]+$/, ''))
    set('arquivo', file.name)
    set('tipo', inferTipo(file))
  }

  async function handleSave() {
    let arquivoPath = v.arquivoPath
    let arquivo = v.arquivo

    if (selectedFile) {
      setUploading(true)
      setUploadError('')
      const path = `${Date.now()}_${selectedFile.name.replace(/\s+/g, '_')}`
      const { error } = await supabase.storage.from('listas').upload(path, selectedFile, { upsert: true })
      if (error) {
        setUploadError('Erro ao fazer upload: ' + error.message)
        setUploading(false)
        return
      }
      // Delete old file if replacing
      if (initial?.arquivoPath && initial.arquivoPath !== path) {
        supabase.storage.from('listas').remove([initial.arquivoPath]).then()
      }
      arquivoPath = path
      arquivo = selectedFile.name
      setUploading(false)
    }

    await onSave({ ...v, arquivo, arquivoPath })
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Nome descritivo *</label>
        <input type="text" value={v.nome} onChange={(e) => set('nome', e.target.value)} placeholder="Ex: Lista leads junho" className={inputCls} autoFocus />
      </div>

      {/* File upload */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Arquivo</label>
        <input ref={fileRef} type="file" accept={ACCEPTED_TYPES} onChange={handleFileChange} className="hidden" />
        {v.arquivo && !selectedFile ? (
          <div className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <FileText size={16} className="text-blue-500 flex-shrink-0" />
            <span className="text-sm text-gray-700 truncate flex-1">{v.arquivo}</span>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="text-xs text-blue-600 hover:underline flex-shrink-0"
            >
              Substituir
            </button>
          </div>
        ) : selectedFile ? (
          <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <FileText size={16} className="text-blue-500 flex-shrink-0" />
            <span className="text-sm text-blue-700 truncate flex-1">{selectedFile.name}</span>
            <button
              type="button"
              onClick={() => { setSelectedFile(null); set('arquivo', initial?.arquivo ?? ''); set('arquivoPath', initial?.arquivoPath ?? '') }}
              className="text-xs text-gray-400 hover:text-gray-600 flex-shrink-0"
            >
              ✕
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="w-full flex flex-col items-center gap-2 p-6 border-2 border-dashed border-gray-300 rounded-lg text-gray-400 hover:border-blue-400 hover:text-blue-500 transition-colors"
          >
            <Upload size={20} />
            <span className="text-sm">Clique para selecionar arquivo CSV ou Excel</span>
          </button>
        )}
        {uploadError && <p className="text-xs text-red-600 mt-1">{uploadError}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Tipo</label>
          <select value={v.tipo} onChange={(e) => set('tipo', e.target.value as GlobalLista['tipo'])} className={inputCls}>
            <option value="csv">CSV (.csv)</option>
            <option value="xlsx">Excel (.xlsx)</option>
            <option value="pdf">PDF (.pdf)</option>
            <option value="outro">Outro</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Total de contatos</label>
          <input type="number" min={0} value={v.totalContatos} onChange={(e) => set('totalContatos', Number(e.target.value))} className={inputCls} />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Observações</label>
        <textarea value={v.observacoes} onChange={(e) => set('observacoes', e.target.value)} rows={2} className={inputCls} />
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <Button variant="secondary" onClick={onCancel} disabled={uploading}>Cancelar</Button>
        <Button variant="primary" onClick={handleSave} disabled={!v.nome.trim() || uploading}>
          {uploading ? 'Enviando arquivo...' : initial ? 'Salvar' : 'Adicionar lista'}
        </Button>
      </div>
    </div>
  )
}

async function downloadLista(lista: GlobalLista) {
  if (!lista.arquivoPath) return
  const { data, error } = await supabase.storage.from('listas').createSignedUrl(lista.arquivoPath, 60)
  if (error || !data?.signedUrl) return
  const a = document.createElement('a')
  a.href = data.signedUrl
  a.download = lista.arquivo || lista.nome
  a.click()
}

function ListasSection() {
  const globalListas = useStore((s) => s.globalListas)
  const addGlobalLista = useStore((s) => s.addGlobalLista)
  const updateGlobalLista = useStore((s) => s.updateGlobalLista)
  const deleteGlobalLista = useStore((s) => s.deleteGlobalLista)
  const [modal, setModal] = useState<ListaModal>(null)
  const [downloading, setDownloading] = useState<string | null>(null)

  const sorted = [...globalListas].sort((a, b) => b.criadoEm.localeCompare(a.criadoEm))
  const totalContatos = globalListas.reduce((s, l) => s + (l.totalContatos || 0), 0)

  async function handleSave(data: Omit<GlobalLista, 'id' | 'criadoEm'>) {
    if (modal?.type === 'edit') {
      updateGlobalLista(modal.data.id, data)
    } else {
      addGlobalLista(data)
    }
    setModal(null)
  }

  async function handleDownload(lista: GlobalLista) {
    setDownloading(lista.id)
    await downloadLista(lista)
    setDownloading(null)
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Listas de disparo</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {globalListas.length} lista{globalListas.length !== 1 ? 's' : ''} · {totalContatos.toLocaleString('pt-BR')} contatos no total
          </p>
        </div>
        <Button variant="primary" onClick={() => setModal({ type: 'add' })}>
          <Plus size={14} /> Nova lista
        </Button>
      </div>

      {sorted.length === 0 ? (
        <Card className="p-12 flex flex-col items-center gap-3 text-gray-400">
          <List size={32} className="text-gray-300" />
          <p className="text-sm font-medium">Nenhuma lista cadastrada</p>
          <p className="text-xs text-gray-400">Adicione as listas CSV que você usa para os disparos de aquecimento.</p>
          <Button variant="secondary" onClick={() => setModal({ type: 'add' })}>
            <Plus size={13} /> Adicionar primeira lista
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {sorted.map((l) => (
            <Card key={l.id} className="p-4 group">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-gray-900 truncate">{l.nome}</p>
                    <Badge label={l.tipo.toUpperCase()} className={listaTipoColor(l.tipo)} />
                  </div>
                  {l.arquivo && (
                    <p className="text-xs text-gray-500 mt-1 truncate">📄 {l.arquivo}</p>
                  )}
                  {l.totalContatos > 0 && (
                    <p className="text-sm font-bold text-blue-700 mt-2">
                      {l.totalContatos.toLocaleString('pt-BR')}
                      <span className="text-xs text-gray-400 font-normal ml-1">contatos</span>
                    </p>
                  )}
                  {l.observacoes && (
                    <p className="text-xs text-gray-400 italic mt-1.5 line-clamp-2">{l.observacoes}</p>
                  )}
                  {l.arquivoPath && (
                    <button
                      onClick={() => handleDownload(l)}
                      disabled={downloading === l.id}
                      className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-medium mt-2 disabled:opacity-50"
                    >
                      <Download size={11} />
                      {downloading === l.id ? 'Baixando...' : 'Baixar arquivo'}
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                  <button
                    onClick={() => setModal({ type: 'edit', data: l })}
                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Editar"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    onClick={() => deleteGlobalLista(l.id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Excluir"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
              <p className="text-[10px] text-gray-300 mt-3">
                Adicionada em {formatDateShort(l.criadoEm)}
              </p>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={modal !== null}
        onClose={() => setModal(null)}
        title={modal?.type === 'edit' ? 'Editar lista' : 'Nova lista de disparo'}
        size="md"
      >
        {modal !== null && (
          <ListaForm
            initial={modal.type === 'edit' ? modal.data : undefined}
            onSave={handleSave}
            onCancel={() => setModal(null)}
          />
        )}
      </Modal>
    </div>
  )
}

interface BMRow {
  clientId: string
  clientNome: string
  tipo: 'receptiva' | 'ativa'
  bm: BMData
  aq: AquecimentoBM
}

interface EnrichedDisparo extends Disparo {
  clientId: string
  clientNome: string
  tipo: 'receptiva' | 'ativa'
  bmNome: string
}

const ETAPA_LABELS: Record<EtapaAquecimento, string> = {
  não_iniciado: 'Não iniciado',
  template_criando: 'Criando template',
  template_aguardando: 'Aguardando aprovação',
  template_aprovado: 'Template aprovado',
  primeiro_disparo: 'Primeiro disparo',
  aquecendo: 'Aquecendo',
  aquecida: 'Aquecida',
}

const ETAPA_ORDER: EtapaAquecimento[] = [
  'não_iniciado', 'template_criando', 'template_aguardando',
  'template_aprovado', 'primeiro_disparo', 'aquecendo', 'aquecida',
]

function etapaColor(e: EtapaAquecimento): string {
  const map: Record<EtapaAquecimento, string> = {
    não_iniciado: 'bg-gray-100 text-gray-600 border-gray-200',
    template_criando: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    template_aguardando: 'bg-amber-100 text-amber-800 border-amber-200',
    template_aprovado: 'bg-blue-100 text-blue-800 border-blue-200',
    primeiro_disparo: 'bg-purple-100 text-purple-800 border-purple-200',
    aquecendo: 'bg-orange-100 text-orange-800 border-orange-200',
    aquecida: 'bg-green-100 text-green-800 border-green-200',
  }
  return map[e]
}

function etapaBgHex(e: EtapaAquecimento): string {
  const map: Record<EtapaAquecimento, string> = {
    não_iniciado: '#d1d5db',
    template_criando: '#fde68a',
    template_aguardando: '#fcd34d',
    template_aprovado: '#93c5fd',
    primeiro_disparo: '#c4b5fd',
    aquecendo: '#fdba74',
    aquecida: '#6ee7b7',
  }
  return map[e]
}

function qualidadeColor(q: string): string {
  if (q === 'Boa') return 'bg-green-100 text-green-800 border-green-200'
  if (q === 'Média') return 'bg-yellow-100 text-yellow-800 border-yellow-200'
  if (q === 'Ruim') return 'bg-red-100 text-red-800 border-red-200'
  return 'bg-gray-100 text-gray-400 border-gray-200'
}

function qualidadeDot(q: string): string {
  if (q === 'Boa') return 'bg-green-400'
  if (q === 'Ruim') return 'bg-red-400'
  if (q === 'Média') return 'bg-yellow-400'
  return 'bg-gray-300'
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

type TipoFilter = 'todos' | 'receptiva' | 'ativa'
type EtapaFilter = 'todas' | EtapaAquecimento

// ── Chart: leads vs respostas bar chart ────────────────────

function DisparosBarChart({
  items,
}: {
  items: Array<{ leads: number; respostas: number; date: string; label: string }>
}) {
  if (items.length === 0) {
    return (
      <div className="h-28 flex flex-col items-center justify-center gap-2 text-sm text-gray-400">
        <Zap size={20} className="text-gray-300" />
        Nenhum disparo registrado ainda
      </div>
    )
  }
  const maxVal = Math.max(...items.flatMap((d) => [d.leads, d.respostas]), 1)
  const H = 96

  return (
    <div>
      <div className="flex items-end gap-1.5 h-24 pb-0">
        {items.map((d, i) => (
          <div
            key={i}
            className="flex-1 flex items-end gap-0.5 group cursor-default"
            title={`${d.label}\nData: ${d.date}\nLeads: ${d.leads.toLocaleString('pt-BR')}\nRespostas: ${d.respostas.toLocaleString('pt-BR')}\nTaxa: ${d.leads > 0 ? ((d.respostas / d.leads) * 100).toFixed(1) : 0}%`}
          >
            <div
              className="flex-1 bg-blue-400/75 rounded-t-sm group-hover:bg-blue-500 transition-colors"
              style={{ height: `${Math.max((d.leads / maxVal) * H, 2)}px` }}
            />
            <div
              className="flex-1 bg-emerald-400/75 rounded-t-sm group-hover:bg-emerald-500 transition-colors"
              style={{ height: `${Math.max((d.respostas / maxVal) * H, 2)}px` }}
            />
          </div>
        ))}
      </div>
      <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-5">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-blue-400/75" />
          <span className="text-xs text-gray-500">Leads enviados</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-emerald-400/75" />
          <span className="text-xs text-gray-500">Respostas recebidas</span>
        </div>
        <span className="text-xs text-gray-400 ml-auto">
          Passe o mouse para detalhes
        </span>
      </div>
    </div>
  )
}

// ── Chart: taxa de resposta trend line ──────────────────────

function TaxaLineChart({
  values,
  labels,
}: {
  values: number[]
  labels: string[]
}) {
  if (values.length < 2) {
    return (
      <div className="h-16 flex items-center justify-center text-xs text-gray-400">
        Disparos insuficientes para exibir tendência (mínimo 2 com leads)
      </div>
    )
  }
  const max = Math.max(...values, 5)
  const W = 400
  const H = 64
  const pts = values.map((v, i) => ({
    x: values.length === 1 ? W / 2 : (i / (values.length - 1)) * W,
    y: H - (v / max) * (H - 4) - 2,
  }))
  const lineStr = pts.map((p) => `${p.x},${p.y}`).join(' ')
  const areaStr = `0,${H} ${lineStr} ${W},${H}`
  const lastVal = values[values.length - 1]
  const prevVal = values[values.length - 2]
  const trend = lastVal - prevVal

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-500">Taxa de resposta por disparo (%)</span>
        <span className={`text-xs font-semibold flex items-center gap-1 ${trend >= 0 ? 'text-green-600' : 'text-red-500'}`}>
          {trend >= 0 ? '↑' : '↓'} {Math.abs(trend).toFixed(1)}% no último disparo
        </span>
      </div>
      <svg
        width="100%"
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        className="overflow-visible"
      >
        <defs>
          <linearGradient id="taxa-area-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f97316" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#f97316" stopOpacity="0.01" />
          </linearGradient>
        </defs>
        <polygon points={areaStr} fill="url(#taxa-area-grad)" />
        <polyline
          points={lineStr}
          fill="none"
          stroke="#f97316"
          strokeWidth="1.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {pts.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="3" fill="white" stroke="#f97316" strokeWidth="1.5">
            <title>{`${labels[i]}: ${values[i].toFixed(1)}%`}</title>
          </circle>
        ))}
      </svg>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────

export function Aquecimento() {
  const clients = useStore((s) => s.clients)
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'dashboard' | 'listas'>('dashboard')
  const [tipoFilter, setTipoFilter] = useState<TipoFilter>('todos')
  const [etapaFilter, setEtapaFilter] = useState<EtapaFilter>('todas')
  const [search, setSearch] = useState('')
  const [pipelineFilter, setPipelineFilter] = useState<EtapaAquecimento | null>(null)

  const rows: BMRow[] = useMemo(
    () =>
      clients.flatMap((client) => {
        const result: BMRow[] = []
        const add = (tipo: 'receptiva' | 'ativa') => {
          const bm = tipo === 'receptiva' ? client.bmReceptiva : client.bmAtiva
          const aq = resolveAq(bm)
          if (!bm.nome && aq.etapa === 'não_iniciado' && aq.templates.length === 0 && aq.disparos.length === 0) return
          result.push({ clientId: client.id, clientNome: client.nomeConhecido || client.nome, tipo, bm, aq })
        }
        add('receptiva')
        add('ativa')
        return result
      }),
    [clients]
  )

  const allDisparos: EnrichedDisparo[] = useMemo(
    () =>
      rows
        .flatMap((r) =>
          r.aq.disparos.map((d) => ({ ...d, clientId: r.clientId, clientNome: r.clientNome, tipo: r.tipo, bmNome: r.bm.nome }))
        )
        .sort((a, b) => b.data.localeCompare(a.data)),
    [rows]
  )

  const stats = useMemo(() => {
    const bmsAtivas = rows.filter((r) => r.aq.etapa !== 'não_iniciado').length
    const bmsAquecidas = rows.filter((r) => r.aq.etapa === 'aquecida').length
    const totalLeads = allDisparos.reduce((s, d) => s + (d.totalLeads || 0), 0)
    const totalRespostas = allDisparos.reduce((s, d) => s + (d.totalRespostas || 0), 0)
    const taxaMedia = totalLeads > 0 ? (totalRespostas / totalLeads) * 100 : 0
    const templatesAprovados = rows.reduce((s, r) => s + r.aq.templates.filter((t) => t.status === 'aprovado').length, 0)
    const templatesTotal = rows.reduce((s, r) => s + r.aq.templates.length, 0)
    return { bmsAtivas, bmsAquecidas, totalLeads, totalRespostas, taxaMedia, templatesAprovados, templatesTotal }
  }, [rows, allDisparos])

  const pipelineCounts = useMemo(() => {
    const counts = Object.fromEntries(ETAPA_ORDER.map((e) => [e, 0])) as Record<EtapaAquecimento, number>
    rows.forEach((r) => { counts[r.aq.etapa]++ })
    return counts
  }, [rows])
  const maxPipelineCount = Math.max(...Object.values(pipelineCounts), 1)

  const pendencias = useMemo(() => {
    const list: Array<{
      type: 'recusado' | 'ruim' | 'inativo'
      clientId: string
      clientNome: string
      tipo: 'receptiva' | 'ativa'
      bmNome: string
      detail: string
    }> = []
    rows.forEach((r) => {
      r.aq.templates
        .filter((t) => t.status === 'recusado')
        .forEach((t) =>
          list.push({ type: 'recusado', clientId: r.clientId, clientNome: r.clientNome, tipo: r.tipo, bmNome: r.bm.nome, detail: `Template "${t.nome}" foi recusado` })
        )
      const ordenados = [...r.aq.disparos].sort((a, b) => b.data.localeCompare(a.data))
      if (ordenados[0]?.qualidade === 'Ruim') {
        list.push({ type: 'ruim', clientId: r.clientId, clientNome: r.clientNome, tipo: r.tipo, bmNome: r.bm.nome, detail: `Último disparo com qualidade Ruim (${formatDateShort(ordenados[0].data)})` })
      }
      const emDisparo = !['não_iniciado', 'template_criando', 'template_aguardando'].includes(r.aq.etapa)
      if (emDisparo) {
        const ultimo = ordenados[0]
        const ref = ultimo?.data || r.aq.dataInicio
        if (ref) {
          const dias = differenceInDays(new Date(), new Date(ref))
          if (dias >= 7)
            list.push({ type: 'inativo', clientId: r.clientId, clientNome: r.clientNome, tipo: r.tipo, bmNome: r.bm.nome, detail: `${dias} dias desde o último disparo` })
        }
      }
    })
    return list
  }, [rows])

  const chartDisparos = useMemo(
    () =>
      allDisparos
        .slice(0, 20)
        .reverse()
        .map((d) => ({
          leads: d.totalLeads || 0,
          respostas: d.totalRespostas || 0,
          date: formatDateShort(d.data),
          label: `${d.clientNome} · ${d.tipo === 'receptiva' ? 'Receptiva' : 'Ativa'}`,
        })),
    [allDisparos]
  )

  const taxaTrendData = useMemo(() => {
    const eligible = allDisparos.filter((d) => (d.totalLeads || 0) > 0).reverse().slice(-15)
    return {
      values: eligible.map((d) => ((d.totalRespostas || 0) / (d.totalLeads || 1)) * 100),
      labels: eligible.map((d) => `${formatDateShort(d.data)} · ${d.clientNome}`),
    }
  }, [allDisparos])

  const bmRanking = useMemo(
    () =>
      rows
        .filter((r) => r.aq.disparos.length > 0)
        .map((r) => {
          const tl = r.aq.disparos.reduce((s, d) => s + (d.totalLeads || 0), 0)
          const tr = r.aq.disparos.reduce((s, d) => s + (d.totalRespostas || 0), 0)
          const taxa = tl > 0 ? (tr / tl) * 100 : 0
          return { clientId: r.clientId, clientNome: r.clientNome, tipo: r.tipo, bmNome: r.bm.nome, taxa, tl, etapa: r.aq.etapa }
        })
        .sort((a, b) => b.taxa - a.taxa)
        .slice(0, 8),
    [rows]
  )

  const filtered = useMemo(
    () =>
      rows.filter((r) => {
        if (tipoFilter !== 'todos' && r.tipo !== tipoFilter) return false
        if (pipelineFilter && r.aq.etapa !== pipelineFilter) return false
        if (!pipelineFilter && etapaFilter !== 'todas' && r.aq.etapa !== etapaFilter) return false
        if (search) {
          const q = search.toLowerCase()
          if (!r.clientNome.toLowerCase().includes(q) && !r.bm.nome.toLowerCase().includes(q)) return false
        }
        return true
      }),
    [rows, tipoFilter, etapaFilter, pipelineFilter, search]
  )

  return (
    <div className="p-6 space-y-5">

      {/* ── Header ──────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-orange-100 rounded-xl">
            <Flame size={20} className="text-orange-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Aquecimento de BMs</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Gestão completa de templates, disparos e performance
            </p>
          </div>
        </div>
        {activeTab === 'dashboard' && allDisparos[0] && (
          <div className="text-right">
            <p className="text-xs text-gray-400">Último disparo</p>
            <p className="text-sm font-medium text-gray-700">{allDisparos[0].clientNome}</p>
            <p className="text-xs text-gray-500">{formatDateShort(allDisparos[0].data)}</p>
          </div>
        )}
      </div>

      {/* ── Tabs ────────────────────────────────────────── */}
      <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'dashboard' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Flame size={14} /> Dashboard
        </button>
        <button
          onClick={() => setActiveTab('listas')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'listas' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <List size={14} /> Listas de disparo
        </button>
      </div>

      {activeTab === 'listas' && <ListasSection />}
      {activeTab === 'dashboard' && (<>

      {/* ── Stats row ───────────────────────────────────── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs text-gray-500 font-medium">BMs em aquecimento</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.bmsAtivas}</p>
              <p className="text-xs text-gray-400 mt-0.5">{stats.bmsAquecidas} já aquecidas</p>
            </div>
            <div className="bg-orange-100 text-orange-600 p-2 rounded-lg flex-shrink-0">
              <Flame size={18} />
            </div>
          </div>
          <div className="mt-3 w-full bg-orange-100 rounded-full h-1.5">
            <div
              className="bg-orange-400 h-1.5 rounded-full"
              style={{ width: `${stats.bmsAtivas > 0 ? (stats.bmsAquecidas / stats.bmsAtivas) * 100 : 0}%` }}
            />
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs text-gray-500 font-medium">Total de leads</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalLeads.toLocaleString('pt-BR')}</p>
              <p className="text-xs text-gray-400 mt-0.5">{allDisparos.length} disparos realizados</p>
            </div>
            <div className="bg-blue-100 text-blue-600 p-2 rounded-lg flex-shrink-0">
              <Users size={18} />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs text-gray-500 font-medium">Taxa média de resposta</p>
              <p className={`text-3xl font-bold mt-1 ${stats.taxaMedia >= 10 ? 'text-green-700' : stats.taxaMedia >= 5 ? 'text-yellow-700' : 'text-gray-900'}`}>
                {stats.taxaMedia.toFixed(1)}%
              </p>
              <p className="text-xs text-gray-400 mt-0.5">{stats.totalRespostas.toLocaleString('pt-BR')} respostas totais</p>
            </div>
            <div className={`p-2 rounded-lg flex-shrink-0 ${stats.taxaMedia >= 10 ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}`}>
              <TrendingUp size={18} />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs text-gray-500 font-medium">Templates</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {stats.templatesAprovados}
                <span className="text-lg text-gray-400 font-normal">/{stats.templatesTotal}</span>
              </p>
              <p className="text-xs text-gray-400 mt-0.5">aprovados de criados</p>
            </div>
            <div className="bg-purple-100 text-purple-600 p-2 rounded-lg flex-shrink-0">
              <CheckCircle2 size={18} />
            </div>
          </div>
          {stats.templatesTotal > 0 && (
            <div className="mt-3 w-full bg-purple-100 rounded-full h-1.5">
              <div
                className="bg-purple-400 h-1.5 rounded-full"
                style={{ width: `${(stats.templatesAprovados / stats.templatesTotal) * 100}%` }}
              />
            </div>
          )}
        </div>
      </div>

      {/* ── Pipeline funil ──────────────────────────────── */}
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <Target size={15} className="text-gray-400" />
          <h2 className="text-sm font-semibold text-gray-700">Funil de aquecimento</h2>
          <span className="text-xs text-gray-400">— clique em uma etapa para filtrar a tabela</span>
          {pipelineFilter && (
            <button
              onClick={() => setPipelineFilter(null)}
              className="ml-auto text-xs text-blue-600 hover:text-blue-800 font-medium"
            >
              ✕ Limpar filtro
            </button>
          )}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {ETAPA_ORDER.map((etapa) => {
            const count = pipelineCounts[etapa]
            const isActive = pipelineFilter === etapa
            const barH = count > 0 ? Math.max((count / maxPipelineCount) * 48, 4) : 0
            return (
              <button
                key={etapa}
                onClick={() => setPipelineFilter(isActive ? null : etapa)}
                className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border-2 transition-all cursor-pointer ${
                  isActive
                    ? 'border-blue-400 bg-blue-50 shadow-sm'
                    : 'border-transparent hover:border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="w-full h-12 flex items-end justify-center">
                  {count > 0 ? (
                    <div
                      className="w-full rounded-t-md transition-all"
                      style={{ height: `${barH}px`, backgroundColor: etapaBgHex(etapa) }}
                    />
                  ) : (
                    <div className="w-full h-0.5 bg-gray-100 rounded" />
                  )}
                </div>
                <span className={`text-2xl font-bold leading-none ${count > 0 ? 'text-gray-900' : 'text-gray-300'}`}>
                  {count}
                </span>
                <span className="text-[9px] text-gray-500 text-center leading-tight px-0.5">
                  {ETAPA_LABELS[etapa]}
                </span>
              </button>
            )
          })}
        </div>
        <div className="mt-3 flex items-center justify-center gap-1.5">
          {ETAPA_ORDER.map((etapa, i) => (
            <span key={etapa} className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: etapaBgHex(etapa) }} />
              {i < ETAPA_ORDER.length - 1 && <ArrowRight size={9} className="text-gray-300 flex-shrink-0" />}
            </span>
          ))}
        </div>
      </Card>

      {/* ── Charts row ──────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="col-span-2 p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 size={15} className="text-gray-400" />
            <h2 className="text-sm font-semibold text-gray-700">Histórico de disparos</h2>
            <span className="text-xs text-gray-400">
              {chartDisparos.length > 0 ? `últimos ${chartDisparos.length}` : ''}
            </span>
          </div>
          <DisparosBarChart items={chartDisparos} />
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={15} className="text-gray-400" />
            <h2 className="text-sm font-semibold text-gray-700">Ranking de resposta</h2>
          </div>
          {bmRanking.length === 0 ? (
            <div className="py-6 flex flex-col items-center gap-2 text-gray-400">
              <BarChart2 size={20} className="text-gray-300" />
              <p className="text-xs text-center">Sem dados de disparo para comparar</p>
            </div>
          ) : (
            <div className="space-y-3">
              {bmRanking.map((bm) => (
                <button
                  key={`${bm.clientId}-${bm.tipo}`}
                  onClick={() => navigate(`/aquecimento/${bm.clientId}`)}
                  className="w-full text-left group"
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-gray-700 truncate flex-1 group-hover:text-blue-700 transition-colors">
                      {bm.clientNome}
                      <span className="text-gray-400 ml-1">
                        ({bm.tipo === 'receptiva' ? 'Rec' : 'Ati'})
                      </span>
                    </span>
                    <span className={`font-bold ml-2 ${bm.taxa >= 10 ? 'text-green-700' : bm.taxa >= 5 ? 'text-yellow-700' : 'text-red-500'}`}>
                      {bm.taxa.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full transition-all ${bm.taxa >= 10 ? 'bg-green-500' : bm.taxa >= 5 ? 'bg-yellow-500' : 'bg-red-400'}`}
                      style={{ width: `${Math.min(bm.taxa * 4, 100)}%` }}
                    />
                  </div>
                </button>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* ── Tendência (line chart) ───────────────────────── */}
      {taxaTrendData.values.length >= 2 && (
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Activity size={15} className="text-gray-400" />
            <h2 className="text-sm font-semibold text-gray-700">Tendência da taxa de resposta</h2>
            <span className="text-xs text-gray-400">por disparo, todos os clientes</span>
          </div>
          <TaxaLineChart values={taxaTrendData.values} labels={taxaTrendData.labels} />
        </Card>
      )}

      {/* ── Pendências ──────────────────────────────────── */}
      {pendencias.length > 0 && (
        <Card className="p-5 border-orange-200">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={15} className="text-orange-500" />
            <h2 className="text-sm font-semibold text-orange-800">
              Pendências e alertas
            </h2>
            <span className="bg-orange-100 text-orange-700 text-xs px-2 py-0.5 rounded-full font-medium">
              {pendencias.length}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
            {pendencias.map((p, i) => (
              <button
                key={i}
                onClick={() =>
                  navigate(`/aquecimento/${p.clientId}`)
                }
                className={`flex items-start gap-2.5 p-3 rounded-lg border text-left hover:shadow-sm transition-all ${
                  p.type === 'recusado'
                    ? 'bg-red-50 border-red-200 hover:border-red-300'
                    : p.type === 'ruim'
                    ? 'bg-amber-50 border-amber-200 hover:border-amber-300'
                    : 'bg-yellow-50 border-yellow-200 hover:border-yellow-300'
                }`}
              >
                {p.type === 'recusado' ? (
                  <AlertTriangle size={14} className="text-red-500 flex-shrink-0 mt-0.5" />
                ) : p.type === 'ruim' ? (
                  <ThumbsDown size={14} className="text-amber-500 flex-shrink-0 mt-0.5" />
                ) : (
                  <Clock size={14} className="text-yellow-600 flex-shrink-0 mt-0.5" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-gray-800">{p.clientNome}</p>
                  <p className="text-xs text-gray-500">
                    {p.bmNome ? `${p.bmNome} · ` : ''}
                    {p.tipo === 'receptiva' ? 'BM Receptiva' : 'BM Ativa'}
                  </p>
                  <p className="text-xs text-gray-600 mt-0.5">{p.detail}</p>
                </div>
                <ChevronRight size={12} className="text-gray-300 flex-shrink-0 ml-auto mt-0.5" />
              </button>
            ))}
          </div>
        </Card>
      )}

      {/* ── Filtros + Tabela ─────────────────────────────── */}
      <Card>
        <div className="p-4 border-b border-gray-100">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Buscar cliente ou BM..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="border border-gray-300 rounded-lg pl-8 pr-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-48"
              />
            </div>
            <div className="flex items-center gap-1.5 text-gray-400">
              <Filter size={13} />
            </div>
            <select
              value={tipoFilter}
              onChange={(e) => setTipoFilter(e.target.value as TipoFilter)}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="todos">Receptiva + Ativa</option>
              <option value="receptiva">Só Receptiva</option>
              <option value="ativa">Só Ativa</option>
            </select>
            {!pipelineFilter && (
              <select
                value={etapaFilter}
                onChange={(e) => setEtapaFilter(e.target.value as EtapaFilter)}
                className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="todas">Todas as etapas</option>
                {ETAPA_ORDER.map((e) => (
                  <option key={e} value={e}>
                    {ETAPA_LABELS[e]}
                  </option>
                ))}
              </select>
            )}
            {pipelineFilter && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg">
                <span className="text-sm text-blue-700">Etapa: {ETAPA_LABELS[pipelineFilter]}</span>
                <button onClick={() => setPipelineFilter(null)} className="text-blue-400 hover:text-blue-700 ml-1 font-bold">
                  ×
                </button>
              </div>
            )}
            <span className="text-xs text-gray-400 ml-auto">{filtered.length} BM(s)</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50/60 border-b border-gray-100">
                {[
                  'Cliente', 'Tipo', 'Nome BM', 'Etapa', 'Templates', 'Disparos',
                  'Leads', 'Respostas', 'Taxa', 'Últ. qualidade', 'Limite', 'Últ. disparo', '',
                ].map((h) => (
                  <th
                    key={h}
                    className="text-left px-4 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((r, i) => {
                const disparosOrdenados = [...r.aq.disparos].sort((a, b) => b.data.localeCompare(a.data))
                const ultimoDisparo = disparosOrdenados[0]
                const tl = r.aq.disparos.reduce((s, d) => s + (d.totalLeads || 0), 0)
                const tr2 = r.aq.disparos.reduce((s, d) => s + (d.totalRespostas || 0), 0)
                const taxa = tl > 0 ? (tr2 / tl) * 100 : 0
                const templAprov = r.aq.templates.filter((t) => t.status === 'aprovado').length
                return (
                  <tr
                    key={`${r.clientId}-${r.tipo}-${i}`}
                    onClick={() => navigate(`/aquecimento/${r.clientId}`)}
                    className="hover:bg-gray-50/80 transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">{r.clientNome}</td>
                    <td className="px-4 py-3">
                      <Badge
                        label={r.tipo === 'receptiva' ? 'Receptiva' : 'Ativa'}
                        className={r.tipo === 'receptiva' ? 'bg-blue-100 text-blue-800 border-blue-200' : 'bg-purple-100 text-purple-800 border-purple-200'}
                      />
                    </td>
                    <td className="px-4 py-3 text-gray-700 max-w-[140px] truncate" title={r.bm.nome}>
                      {r.bm.nome || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <Badge label={ETAPA_LABELS[r.aq.etapa]} className={etapaColor(r.aq.etapa)} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={templAprov > 0 ? 'text-green-700 font-semibold' : 'text-gray-500'}>
                        {templAprov}/{r.aq.templates.length}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-gray-700">{r.aq.disparos.length}</td>
                    <td className="px-4 py-3 text-gray-700">{tl.toLocaleString('pt-BR')}</td>
                    <td className="px-4 py-3 text-gray-700">{tr2.toLocaleString('pt-BR')}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`font-semibold ${taxa >= 10 ? 'text-green-700' : taxa >= 5 ? 'text-yellow-700' : taxa > 0 ? 'text-red-600' : 'text-gray-300'}`}
                      >
                        {tl > 0 ? `${taxa.toFixed(1)}%` : '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {ultimoDisparo?.qualidade ? (
                        <Badge label={ultimoDisparo.qualidade} className={qualidadeColor(ultimoDisparo.qualidade)} />
                      ) : (
                        <span className="text-xs text-gray-300">—</span>
                      )}
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
                  <td colSpan={13} className="px-4 py-12 text-center text-gray-400 text-sm">
                    {rows.length === 0
                      ? 'Nenhuma BM com dados de aquecimento. Acesse um cliente e configure a seção Aquecimento na aba BM.'
                      : 'Nenhuma BM corresponde aos filtros selecionados.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ── Cronograma de atividades ─────────────────────── */}
      {allDisparos.length > 0 && (
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-5">
            <MessageSquare size={15} className="text-gray-400" />
            <h2 className="text-sm font-semibold text-gray-700">Cronograma de atividades</h2>
            <span className="text-xs text-gray-400">últimos disparos registrados</span>
          </div>
          <div className="relative">
            <div className="absolute left-[7px] top-1 bottom-1 w-px bg-gray-200" />
            <div className="space-y-3">
              {allDisparos.slice(0, 15).map((d) => (
                <div key={d.id} className="pl-7 relative">
                  <div
                    className={`absolute left-0 top-2 w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm ${qualidadeDot(d.qualidade)}`}
                  />
                  <button
                    onClick={() => navigate(`/aquecimento/${d.clientId}`)}
                    className="w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors group"
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-sm font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">
                          {d.clientNome}
                        </span>
                        <Badge
                          label={d.tipo === 'receptiva' ? 'Receptiva' : 'Ativa'}
                          className={d.tipo === 'receptiva' ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-purple-100 text-purple-700 border-purple-200'}
                        />
                        {d.bmNome && <span className="text-xs text-gray-400 truncate">{d.bmNome}</span>}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-xs text-gray-400">{formatDateShort(d.data)}</span>
                        {d.qualidade && (
                          <Badge label={d.qualidade} className={qualidadeColor(d.qualidade)} />
                        )}
                        <ChevronRight size={12} className="text-gray-300 group-hover:text-gray-500" />
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                      {d.nomeLista && (
                        <span className="text-xs text-gray-500 font-medium">{d.nomeLista}</span>
                      )}
                      <span className="text-xs text-gray-500">
                        <span className="font-semibold text-blue-700">
                          {(d.totalLeads || 0).toLocaleString('pt-BR')}
                        </span>{' '}
                        leads
                        {' → '}
                        <span className="font-semibold text-emerald-700">
                          {(d.totalRespostas || 0).toLocaleString('pt-BR')}
                        </span>{' '}
                        respostas
                        {(d.totalLeads || 0) > 0 && (
                          <span className="text-gray-400 ml-1">
                            ({(((d.totalRespostas || 0) / (d.totalLeads || 1)) * 100).toFixed(1)}%)
                          </span>
                        )}
                      </span>
                      {d.arquivoLista && (
                        <span className="text-xs text-gray-400">📄 {d.arquivoLista}</span>
                      )}
                    </div>
                    {d.observacoes && (
                      <p className="text-xs text-gray-500 mt-1 italic">{d.observacoes}</p>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}
      </>)}
    </div>
  )
}
