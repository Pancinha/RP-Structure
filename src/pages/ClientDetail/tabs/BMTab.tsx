import { useState, useEffect } from 'react'
import type { Client, BMData, StatusBM } from '../../../types'
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

interface Props {
  client: Client
  type: 'receptiva' | 'ativa'
}

export function BMTab({ client, type }: Props) {
  const updateBMReceptiva = useStore((s) => s.updateBMReceptiva)
  const updateBMAtiva = useStore((s) => s.updateBMAtiva)
  const bm = type === 'receptiva' ? client.bmReceptiva : client.bmAtiva
  const [form, setForm] = useState<BMData>({ ...bm, checklist: { ...bm.checklist } })
  const [dirty, setDirty] = useState(false)

  // Reset form when store updates after save (fixes stale state)
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
    const changed = prevStatus !== newStatus

    let autoUpdates = {}
    if (changed) {
      autoUpdates = type === 'receptiva'
        ? applyBMReceptivaAutomation(client, newStatus)
        : applyBMAtivaAutomation(client, newStatus)
    }

    const update = type === 'receptiva' ? updateBMReceptiva : updateBMAtiva
    update(
      client.id,
      form,
      Object.keys(autoUpdates).length > 0 ? autoUpdates as Partial<Client> : undefined
    )
    setDirty(false)
  }

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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-base font-semibold text-gray-900">{label}</h3>
          <Badge label={form.status} className={statusBMColor(form.status)} />
        </div>
        <Button variant="primary" size="sm" onClick={save} disabled={!dirty}>
          Salvar alterações
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-4">
          <Card className="p-5">
            <h4 className="text-sm font-semibold text-gray-700 mb-4">Dados da BM</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Nome da BM</label>
                <input
                  type="text"
                  value={form.nome}
                  onChange={(e) => set('nome', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">ID da BM</label>
                <input
                  type="text"
                  value={form.idBM}
                  onChange={(e) => set('idBM', e.target.value)}
                  placeholder="Ex: 987654321012345"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => set('status', e.target.value as StatusBM)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">CNPJ usado</label>
                <input
                  type="text"
                  value={form.cnpjUsado}
                  onChange={(e) => set('cnpjUsado', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Domínio</label>
                <input
                  type="text"
                  value={form.dominio}
                  onChange={(e) => set('dominio', e.target.value)}
                  placeholder="exemplo.com.br"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Link do site FTM</label>
                <input
                  type="text"
                  value={form.linkSiteFTM}
                  onChange={(e) => set('linkSiteFTM', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Data de criação</label>
                <input
                  type="datetime-local"
                  value={form.dataCriacao ? form.dataCriacao.slice(0, 16) : ''}
                  onChange={(e) => set('dataCriacao', e.target.value ? new Date(e.target.value).toISOString() : '')}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Data de envio da verificação</label>
                <input
                  type="datetime-local"
                  value={form.dataEnvioVerificacao ? form.dataEnvioVerificacao.slice(0, 16) : ''}
                  onChange={(e) => set('dataEnvioVerificacao', e.target.value ? new Date(e.target.value).toISOString() : '')}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              <input
                type="text"
                value={form.motivoRecusa}
                onChange={(e) => set('motivoRecusa', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="mt-4">
              <label className="block text-xs font-medium text-gray-700 mb-1">Observações</label>
              <textarea
                value={form.observacoes}
                onChange={(e) => set('observacoes', e.target.value)}
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </Card>
        </div>

        <div>
          <Card className="p-5">
            <Checklist
              title="Checklist"
              items={checklistItems}
              onChange={(key, checked) => {
                setForm((f) => ({
                  ...f,
                  checklist: { ...f.checklist, [key]: checked },
                }))
                setDirty(true)
              }}
            />
          </Card>
        </div>
      </div>
    </div>
  )
}
