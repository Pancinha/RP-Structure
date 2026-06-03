import { useState, useEffect } from 'react'
import { Flame, Plus, Trash2 } from 'lucide-react'
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

const ETAPA_OPTIONS: { value: EtapaAquecimento; label: string }[] = [
  { value: 'não_iniciado', label: 'Não iniciado' },
  { value: 'template_criando', label: 'Criando template' },
  { value: 'template_aguardando', label: 'Aguardando aprovação' },
  { value: 'template_aprovado', label: 'Template aprovado' },
  { value: 'primeiro_disparo', label: 'Primeiro disparo' },
  { value: 'aquecendo', label: 'Aquecendo' },
  { value: 'aquecida', label: 'Aquecida' },
]

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

function templateStatusColor(s: BMTemplate['status']): string {
  switch (s) {
    case 'aprovado': return 'bg-green-100 text-green-800 border-green-200'
    case 'aguardando': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    case 'recusado': return 'bg-red-100 text-red-800 border-red-200'
    default: return 'bg-gray-100 text-gray-600 border-gray-200'
  }
}

function templateStatusLabel(s: BMTemplate['status']): string {
  const map = { criando: 'Criando', aguardando: 'Aguardando', aprovado: 'Aprovado', recusado: 'Recusado' }
  return map[s]
}

function qualidadeColor(q: Disparo['qualidade']): string {
  switch (q) {
    case 'Boa': return 'bg-green-100 text-green-800 border-green-200'
    case 'Média': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    case 'Ruim': return 'bg-red-100 text-red-800 border-red-200'
    default: return 'bg-gray-100 text-gray-500 border-gray-200'
  }
}

function makeId() {
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

  // Modals
  const [templateModalOpen, setTemplateModalOpen] = useState(false)
  const [disparoModalOpen, setDisparoModalOpen] = useState(false)
  const [newTemplate, setNewTemplate] = useState<Omit<BMTemplate, 'id'>>(BLANK_TEMPLATE)
  const [newDisparo, setNewDisparo] = useState<Omit<Disparo, 'id'>>(BLANK_DISPARO)

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

  function save() {
    const prevStatus = bm.status
    const newStatus = form.status
    const changed = prevStatus !== newStatus

    let autoUpdates = {}
    if (changed) {
      autoUpdates = type === 'receptiva'
        ? applyBMReceptivaAutomation(client, newStatus)
        : applyBMAtivaAutomation(client, newStatus)
    }

    const update = type === 'receptiva' ? updateBMReceptiva : updateBMAtiva
    update(client.id, form, Object.keys(autoUpdates).length > 0 ? autoUpdates as Partial<Client> : undefined)
    setDirty(false)
  }

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

  function deleteTemplate(id: string) {
    setForm((f) => ({
      ...f,
      aquecimento: {
        ...(f.aquecimento ?? DEFAULT_AQUECIMENTO),
        templates: (f.aquecimento?.templates ?? []).filter((t) => t.id !== id),
      },
    }))
    setDirty(true)
  }

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

  function deleteDisparo(id: string) {
    setForm((f) => ({
      ...f,
      aquecimento: {
        ...(f.aquecimento ?? DEFAULT_AQUECIMENTO),
        disparos: (f.aquecimento?.disparos ?? []).filter((d) => d.id !== id),
      },
    }))
    setDirty(true)
  }

  const label = type === 'receptiva' ? 'BM Receptiva' : 'BM Ativa'
  const aq = form.aquecimento ?? DEFAULT_AQUECIMENTO
  const etapaLabel = ETAPA_OPTIONS.find((e) => e.value === aq.etapa)?.label ?? aq.etapa

  // Disparo stats
  const totalLeads = aq.disparos.reduce((s, d) => s + (d.totalLeads || 0), 0)
  const totalRespostas = aq.disparos.reduce((s, d) => s + (d.totalRespostas || 0), 0)
  const taxaResposta = totalLeads > 0 ? ((totalRespostas / totalLeads) * 100).toFixed(1) : '0'
  const ultimoDisparo = [...aq.disparos].sort((a, b) => b.data.localeCompare(a.data))[0]

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

  const inputCls = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'

  return (
    <div className="space-y-6">
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
                <input type="datetime-local" value={form.dataCriacao ? form.dataCriacao.slice(0, 16) : ''} onChange={(e) => set('dataCriacao', e.target.value ? new Date(e.target.value).toISOString() : '')} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Data de envio da verificação</label>
                <input type="datetime-local" value={form.dataEnvioVerificacao ? form.dataEnvioVerificacao.slice(0, 16) : ''} onChange={(e) => set('dataEnvioVerificacao', e.target.value ? new Date(e.target.value).toISOString() : '')} className={inputCls} />
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

      {/* ── Aquecimento section ── */}
      <div className="border-t border-gray-200 pt-6">
        <div className="flex items-center gap-2 mb-5">
          <Flame size={16} className="text-orange-500" />
          <h3 className="text-base font-semibold text-gray-900">Aquecimento</h3>
          <Badge label={etapaLabel} className={etapaColor(aq.etapa)} />
        </div>

        {/* Config row */}
        <div className="grid grid-cols-3 gap-4 mb-5">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Etapa atual</label>
            <select value={aq.etapa} onChange={(e) => setAq('etapa', e.target.value as EtapaAquecimento)} className={inputCls}>
              {ETAPA_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
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
        </div>

        {/* Templates card */}
        <Card className="p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-gray-700">
              Templates <span className="text-xs font-normal text-gray-400 ml-1">({aq.templates.length})</span>
            </h4>
            <Button variant="secondary" size="sm" onClick={() => setTemplateModalOpen(true)}>
              <Plus size={13} /> Adicionar template
            </Button>
          </div>

          {aq.templates.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-3">Nenhum template cadastrado.</p>
          ) : (
            <div className="space-y-2">
              {aq.templates.map((t) => (
                <div key={t.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-gray-900">{t.nome}</p>
                      <Badge label={templateStatusLabel(t.status)} className={templateStatusColor(t.status)} />
                      {t.categoria && (
                        <Badge
                          label={t.categoria}
                          className={t.categoria === 'utility' ? 'bg-green-100 text-green-800 border-green-200' : t.categoria === 'marketing' ? 'bg-orange-100 text-orange-800 border-orange-200' : 'bg-blue-100 text-blue-800 border-blue-200'}
                        />
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      {t.dataEnvio && <p className="text-xs text-gray-400">Enviado: {formatDateShort(t.dataEnvio)}</p>}
                      {t.dataAprovacao && <p className="text-xs text-gray-400">Aprovado: {formatDateShort(t.dataAprovacao)}</p>}
                    </div>
                    {t.observacoes && <p className="text-xs text-gray-500 mt-1">{t.observacoes}</p>}
                  </div>
                  <button onClick={() => deleteTemplate(t.id)} className="text-red-400 hover:text-red-600 transition-colors flex-shrink-0">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Disparos card */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-gray-700">
              Disparos <span className="text-xs font-normal text-gray-400 ml-1">({aq.disparos.length})</span>
            </h4>
            <Button variant="secondary" size="sm" onClick={() => setDisparoModalOpen(true)}>
              <Plus size={13} /> Registrar disparo
            </Button>
          </div>

          {/* Stats */}
          {aq.disparos.length > 0 && (
            <div className="grid grid-cols-4 gap-3 mb-4 p-3 bg-blue-50 rounded-lg">
              <div className="text-center">
                <p className="text-lg font-bold text-blue-700">{aq.disparos.length}</p>
                <p className="text-xs text-blue-600">Disparos</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-blue-700">{totalLeads.toLocaleString('pt-BR')}</p>
                <p className="text-xs text-blue-600">Leads</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-blue-700">{totalRespostas.toLocaleString('pt-BR')}</p>
                <p className="text-xs text-blue-600">Respostas</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-blue-700">{taxaResposta}%</p>
                <p className="text-xs text-blue-600">Taxa</p>
              </div>
            </div>
          )}

          {aq.disparos.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-3">Nenhum disparo registrado.</p>
          ) : (
            <div className="space-y-2">
              {[...aq.disparos].sort((a, b) => b.data.localeCompare(a.data)).map((d) => (
                <div key={d.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-gray-900">{d.nomeLista}</p>
                      <span className="text-xs text-gray-400">{formatDateShort(d.data)}</span>
                      {d.qualidade && <Badge label={d.qualidade} className={qualidadeColor(d.qualidade)} />}
                    </div>
                    <div className="flex items-center gap-4 mt-1">
                      <p className="text-xs text-gray-600">
                        <span className="font-medium">{d.totalLeads.toLocaleString('pt-BR')}</span> leads
                        {' → '}
                        <span className="font-medium">{d.totalRespostas.toLocaleString('pt-BR')}</span> respostas
                        {d.totalLeads > 0 && ` (${((d.totalRespostas / d.totalLeads) * 100).toFixed(1)}%)`}
                      </p>
                      {d.arquivoLista && <p className="text-xs text-gray-400">📄 {d.arquivoLista}</p>}
                    </div>
                    {d.observacoes && <p className="text-xs text-gray-500 mt-1">{d.observacoes}</p>}
                  </div>
                  <button onClick={() => deleteDisparo(d.id)} className="text-red-400 hover:text-red-600 transition-colors flex-shrink-0">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {ultimoDisparo && (
            <p className="text-xs text-gray-400 mt-3 text-right">
              Último disparo: {formatDateShort(ultimoDisparo.data)}
            </p>
          )}
        </Card>

        {/* Aquecimento observacoes */}
        <div className="mt-4">
          <label className="block text-xs font-medium text-gray-700 mb-1">Observações do aquecimento</label>
          <textarea
            value={aq.observacoes}
            onChange={(e) => setAq('observacoes', e.target.value)}
            rows={2}
            placeholder="Notas gerais sobre o aquecimento..."
            className={inputCls}
          />
        </div>
      </div>

      {/* ── Template modal ── */}
      <Modal open={templateModalOpen} onClose={() => { setTemplateModalOpen(false); setNewTemplate(BLANK_TEMPLATE) }} title="Adicionar template" size="md">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Nome do template *</label>
            <input type="text" value={newTemplate.nome} onChange={(e) => setNewTemplate((f) => ({ ...f, nome: e.target.value }))} placeholder="Ex: Boas-vindas utility" className={inputCls} autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
              <select value={newTemplate.status} onChange={(e) => setNewTemplate((f) => ({ ...f, status: e.target.value as BMTemplate['status'] }))} className={inputCls}>
                <option value="criando">Criando</option>
                <option value="aguardando">Aguardando aprovação</option>
                <option value="aprovado">Aprovado</option>
                <option value="recusado">Recusado</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Categoria</label>
              <select value={newTemplate.categoria} onChange={(e) => setNewTemplate((f) => ({ ...f, categoria: e.target.value as BMTemplate['categoria'] }))} className={inputCls}>
                <option value="">Não definida</option>
                <option value="utility">Utility</option>
                <option value="marketing">Marketing</option>
                <option value="authentication">Authentication</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Data de envio</label>
              <input type="date" value={newTemplate.dataEnvio} onChange={(e) => setNewTemplate((f) => ({ ...f, dataEnvio: e.target.value }))} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Data de aprovação</label>
              <input type="date" value={newTemplate.dataAprovacao} onChange={(e) => setNewTemplate((f) => ({ ...f, dataAprovacao: e.target.value }))} className={inputCls} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Observações</label>
            <textarea value={newTemplate.observacoes} onChange={(e) => setNewTemplate((f) => ({ ...f, observacoes: e.target.value }))} rows={2} className={inputCls} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => { setTemplateModalOpen(false); setNewTemplate(BLANK_TEMPLATE) }}>Cancelar</Button>
            <Button variant="primary" onClick={handleAddTemplate} disabled={!newTemplate.nome.trim()}>Adicionar</Button>
          </div>
        </div>
      </Modal>

      {/* ── Disparo modal ── */}
      <Modal open={disparoModalOpen} onClose={() => { setDisparoModalOpen(false); setNewDisparo(BLANK_DISPARO) }} title="Registrar disparo" size="md">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Nome da lista *</label>
              <input type="text" value={newDisparo.nomeLista} onChange={(e) => setNewDisparo((f) => ({ ...f, nomeLista: e.target.value }))} placeholder="Ex: Lista leads maio" className={inputCls} autoFocus />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Data do disparo</label>
              <input type="date" value={newDisparo.data} onChange={(e) => setNewDisparo((f) => ({ ...f, data: e.target.value }))} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Total de leads enviados</label>
              <input type="number" min={0} value={newDisparo.totalLeads} onChange={(e) => setNewDisparo((f) => ({ ...f, totalLeads: Number(e.target.value) }))} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Total de respostas</label>
              <input type="number" min={0} value={newDisparo.totalRespostas} onChange={(e) => setNewDisparo((f) => ({ ...f, totalRespostas: Number(e.target.value) }))} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Qualidade do número após disparo</label>
              <select value={newDisparo.qualidade} onChange={(e) => setNewDisparo((f) => ({ ...f, qualidade: e.target.value as Disparo['qualidade'] }))} className={inputCls}>
                <option value="">Não avaliado</option>
                <option value="Boa">Boa</option>
                <option value="Média">Média</option>
                <option value="Ruim">Ruim</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Nome do arquivo da lista</label>
              <input type="text" value={newDisparo.arquivoLista} onChange={(e) => setNewDisparo((f) => ({ ...f, arquivoLista: e.target.value }))} placeholder="Ex: leads-maio.xlsx" className={inputCls} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Observações</label>
            <textarea value={newDisparo.observacoes} onChange={(e) => setNewDisparo((f) => ({ ...f, observacoes: e.target.value }))} rows={2} placeholder="Como foi o disparo, alguma observação..." className={inputCls} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => { setDisparoModalOpen(false); setNewDisparo(BLANK_DISPARO) }}>Cancelar</Button>
            <Button variant="primary" onClick={handleAddDisparo} disabled={!newDisparo.nomeLista.trim()}>Registrar</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
