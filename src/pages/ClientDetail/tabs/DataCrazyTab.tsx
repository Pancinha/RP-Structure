import { useState, useEffect } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import type { Client, DataCrazyData, Automation, StatusAutomacao, TipoAutomacao, StatusDataCrazy } from '../../../types'
import { useStore } from '../../../store'
import { Button } from '../../../components/ui/Button'
import { Card } from '../../../components/ui/Card'
import { Badge } from '../../../components/ui/Badge'
import { Modal } from '../../../components/ui/Modal'
import { statusDataCrazyColor, statusAutomacaoColor, formatDate } from '../../../utils/format'

interface Props { client: Client }

const DC_STATUS: StatusDataCrazy[] = ['Não iniciado', 'Em configuração', 'Configurado', 'Com erro', 'Pronto']
const AUTOMACAO_STATUS: StatusAutomacao[] = ['Não iniciada', 'Em configuração', 'Configurada', 'Testada', 'Ativa', 'Com erro', 'Pausada']

function makeId() {
  return `auto-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`
}

export function DataCrazyTab({ client }: Props) {
  const updateDataCrazy = useStore((s) => s.updateDataCrazy)
  const addAutomation = useStore((s) => s.addAutomation)
  const updateAutomation = useStore((s) => s.updateAutomation)
  const deleteAutomation = useStore((s) => s.deleteAutomation)

  const [form, setForm] = useState<Omit<DataCrazyData, 'automacoes'>>({
    clienteCriado: client.dataCrazy.clienteCriado,
    ambiente: client.dataCrazy.ambiente,
    numeroReceptivoVinculado: client.dataCrazy.numeroReceptivoVinculado,
    numeroAtivoVinculado: client.dataCrazy.numeroAtivoVinculado,
    funilConfigurado: client.dataCrazy.funilConfigurado,
    tagsCriadas: client.dataCrazy.tagsCriadas,
    automacoesReceptivasCriadas: client.dataCrazy.automacoesReceptivasCriadas,
    automacoesAtivasCriadas: client.dataCrazy.automacoesAtivasCriadas,
    disparoConfigurado: client.dataCrazy.disparoConfigurado,
    ultimoTeste: client.dataCrazy.ultimoTeste,
    status: client.dataCrazy.status,
    observacoes: client.dataCrazy.observacoes,
  })
  const [dirty, setDirty] = useState(false)
  const [addAutoOpen, setAddAutoOpen] = useState(false)

  // Reset form when store updates after save (fixes stale state)
  useEffect(() => {
    setForm({
      clienteCriado: client.dataCrazy.clienteCriado,
      ambiente: client.dataCrazy.ambiente,
      numeroReceptivoVinculado: client.dataCrazy.numeroReceptivoVinculado,
      numeroAtivoVinculado: client.dataCrazy.numeroAtivoVinculado,
      funilConfigurado: client.dataCrazy.funilConfigurado,
      tagsCriadas: client.dataCrazy.tagsCriadas,
      automacoesReceptivasCriadas: client.dataCrazy.automacoesReceptivasCriadas,
      automacoesAtivasCriadas: client.dataCrazy.automacoesAtivasCriadas,
      disparoConfigurado: client.dataCrazy.disparoConfigurado,
      ultimoTeste: client.dataCrazy.ultimoTeste,
      status: client.dataCrazy.status,
      observacoes: client.dataCrazy.observacoes,
    })
    setDirty(false)
  }, [client.id, client.atualizadoEm])
  const [newAuto, setNewAuto] = useState<Omit<Automation, 'id'>>({
    nome: '',
    tipo: 'Receptiva',
    numeroUsado: '',
    status: 'Não iniciada',
    dataUltimoTeste: '',
    observacoes: '',
  })

  function setF<K extends keyof typeof form>(key: K, value: typeof form[K]) {
    setForm((f) => ({ ...f, [key]: value }))
    setDirty(true)
  }

  function save() {
    updateDataCrazy(client.id, form)
    // dirty resets via useEffect after store update
  }

  function handleAddAuto() {
    if (!newAuto.nome.trim()) return
    addAutomation(client.id, { ...newAuto, id: makeId() })
    setAddAutoOpen(false)
    setNewAuto({ nome: '', tipo: 'Receptiva', numeroUsado: '', status: 'Não iniciada', dataUltimoTeste: '', observacoes: '' })
  }

  const bool = (label: string, key: keyof typeof form) => (
    <label className="flex items-center gap-3 cursor-pointer">
      <input
        type="checkbox"
        checked={!!form[key]}
        onChange={(e) => setF(key, e.target.checked as never)}
        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
      />
      <span className="text-sm text-gray-700">{label}</span>
    </label>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-base font-semibold text-gray-900">DataCrazy</h3>
          <Badge label={form.status} className={statusDataCrazyColor(form.status)} />
        </div>
        <Button variant="primary" size="sm" onClick={save} disabled={!dirty}>
          Salvar alterações
        </Button>
      </div>

      <Card className="p-5">
        <h4 className="text-sm font-semibold text-gray-700 mb-4">Configuração geral</h4>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Ambiente / conta DataCrazy</label>
            <input
              type="text"
              value={form.ambiente}
              onChange={(e) => setF('ambiente', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
            <select
              value={form.status}
              onChange={(e) => setF('status', e.target.value as StatusDataCrazy)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {DC_STATUS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Número receptivo vinculado</label>
            <input
              type="text"
              value={form.numeroReceptivoVinculado}
              onChange={(e) => setF('numeroReceptivoVinculado', e.target.value)}
              placeholder={client.numeroReceptivo.numero || ''}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Número ativo vinculado</label>
            <input
              type="text"
              value={form.numeroAtivoVinculado}
              onChange={(e) => setF('numeroAtivoVinculado', e.target.value)}
              placeholder={client.numeroAtivo.numero || ''}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Último teste realizado em</label>
            <input
              type="datetime-local"
              value={form.ultimoTeste ? form.ultimoTeste.slice(0, 16) : ''}
              onChange={(e) => setF('ultimoTeste', e.target.value ? new Date(e.target.value).toISOString() : '')}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="space-y-3">
          {bool('Cliente criado no DataCrazy?', 'clienteCriado')}
          {bool('Funil configurado?', 'funilConfigurado')}
          {bool('Tags criadas?', 'tagsCriadas')}
          {bool('Automações receptivas criadas?', 'automacoesReceptivasCriadas')}
          {bool('Automações ativas criadas?', 'automacoesAtivasCriadas')}
          {bool('Disparo configurado?', 'disparoConfigurado')}
        </div>

        <div className="mt-4">
          <label className="block text-xs font-medium text-gray-700 mb-1">Observações</label>
          <textarea
            value={form.observacoes}
            onChange={(e) => setF('observacoes', e.target.value)}
            rows={3}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </Card>

      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-semibold text-gray-700">
            Automações ({client.dataCrazy.automacoes.length})
          </h4>
          <Button variant="secondary" size="sm" onClick={() => setAddAutoOpen(true)}>
            <Plus size={14} />
            Nova automação
          </Button>
        </div>

        {client.dataCrazy.automacoes.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">
            Nenhuma automação cadastrada ainda.
          </p>
        ) : (
          <div className="space-y-3">
            {client.dataCrazy.automacoes.map((auto) => (
              <div key={auto.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-gray-900">{auto.nome}</p>
                    <Badge
                      label={auto.tipo}
                      className={auto.tipo === 'Receptiva' ? 'bg-blue-100 text-blue-800 border-blue-200' : 'bg-purple-100 text-purple-800 border-purple-200'}
                    />
                    <Badge label={auto.status} className={statusAutomacaoColor(auto.status)} />
                  </div>
                  {auto.numeroUsado && (
                    <p className="text-xs text-gray-500 mt-1">Número: {auto.numeroUsado}</p>
                  )}
                  {auto.dataUltimoTeste && (
                    <p className="text-xs text-gray-500">Último teste: {formatDate(auto.dataUltimoTeste)}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={auto.status}
                    onChange={(e) => updateAutomation(client.id, auto.id, { status: e.target.value as StatusAutomacao })}
                    className="border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    {AUTOMACAO_STATUS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <button
                    onClick={() => deleteAutomation(client.id, auto.id)}
                    className="text-red-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Modal open={addAutoOpen} onClose={() => setAddAutoOpen(false)} title="Nova automação" size="md">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Nome da automação *</label>
            <input
              type="text"
              value={newAuto.nome}
              onChange={(e) => setNewAuto((f) => ({ ...f, nome: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Tipo</label>
              <select
                value={newAuto.tipo}
                onChange={(e) => setNewAuto((f) => ({ ...f, tipo: e.target.value as TipoAutomacao }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Receptiva">Receptiva</option>
                <option value="Ativa">Ativa</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Número usado</label>
              <input
                type="text"
                value={newAuto.numeroUsado}
                onChange={(e) => setNewAuto((f) => ({ ...f, numeroUsado: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Status inicial</label>
            <select
              value={newAuto.status}
              onChange={(e) => setNewAuto((f) => ({ ...f, status: e.target.value as StatusAutomacao }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {AUTOMACAO_STATUS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Observações</label>
            <textarea
              value={newAuto.observacoes}
              onChange={(e) => setNewAuto((f) => ({ ...f, observacoes: e.target.value }))}
              rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setAddAutoOpen(false)}>Cancelar</Button>
            <Button variant="primary" onClick={handleAddAuto}>Adicionar</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
