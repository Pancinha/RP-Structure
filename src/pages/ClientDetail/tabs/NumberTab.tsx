import { useState, useEffect } from 'react'
import type { Client, NumberData, StatusNumero } from '../../../types'
import { useStore } from '../../../store'
import { Button } from '../../../components/ui/Button'
import { Card } from '../../../components/ui/Card'
import { Badge } from '../../../components/ui/Badge'
import { Checklist } from '../../../components/ui/Checklist'
import { applyNumeroReceptivoAutomation, applyNumeroAtivoAutomation } from '../../../utils/automation'
import { statusNumeroColor, formatDate } from '../../../utils/format'

const STATUS_OPTIONS: StatusNumero[] = [
  'Não iniciado', 'Aguardando número', 'Número separado', 'Chip ativado',
  'Conectando na BM', 'Conectando no DataCrazy', 'Em teste', 'Pronto',
  'Com erro', 'Com pendência',
]

interface Props {
  client: Client
  type: 'receptivo' | 'ativo'
}

export function NumberTab({ client, type }: Props) {
  const updateNumeroReceptivo = useStore((s) => s.updateNumeroReceptivo)
  const updateNumeroAtivo = useStore((s) => s.updateNumeroAtivo)
  const num = type === 'receptivo' ? client.numeroReceptivo : client.numeroAtivo

  const [form, setForm] = useState<NumberData>({ ...num, checklist: { ...num.checklist } })
  const [dirty, setDirty] = useState(false)

  // Reset form when the client prop updates after a save (fixes stale state)
  useEffect(() => {
    const current = type === 'receptivo' ? client.numeroReceptivo : client.numeroAtivo
    setForm({ ...current, checklist: { ...current.checklist } })
    setDirty(false)
  }, [client.id, client.atualizadoEm, type])

  function set<K extends keyof NumberData>(key: K, value: NumberData[K]) {
    setForm((f) => ({ ...f, [key]: value }))
    setDirty(true)
  }

  function save() {
    const prevStatus = num.statusFinal
    const nowPronto = form.statusFinal === 'Pronto' && prevStatus !== 'Pronto'

    let autoUpdates = {}
    if (nowPronto) {
      autoUpdates = type === 'receptivo'
        ? applyNumeroReceptivoAutomation(client, true)
        : applyNumeroAtivoAutomation(client, true)
    }

    const update = type === 'receptivo' ? updateNumeroReceptivo : updateNumeroAtivo
    update(
      client.id,
      form,
      Object.keys(autoUpdates).length > 0 ? autoUpdates as Partial<Client> : undefined
    )
    // dirty will reset via useEffect after store update triggers re-render
  }

  const label = type === 'receptivo' ? 'Número Receptivo' : 'Número Ativo'

  const checklistItems = [
    { key: 'numeroSeparado', label: 'Número separado', checked: form.checklist.numeroSeparado },
    { key: 'chipAtivado', label: 'Chip ativado', checked: form.checklist.chipAtivado },
    { key: 'conectadoBM', label: 'Número conectado na BM', checked: form.checklist.conectadoBM },
    { key: 'conectadoDataCrazy', label: 'Número conectado no DataCrazy', checked: form.checklist.conectadoDataCrazy },
    { key: 'testeRealizado', label: 'Teste realizado', checked: form.checklist.testeRealizado },
    { key: 'pronto', label: type === 'receptivo' ? 'Receptivo pronto' : 'Liberado para operação ativa', checked: form.checklist.pronto },
  ]

  const boolField = (label: string, key: keyof NumberData) => (
    <label className="flex items-center gap-3 cursor-pointer">
      <input
        type="checkbox"
        checked={!!form[key]}
        onChange={(e) => set(key, e.target.checked as never)}
        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
      />
      <span className="text-sm text-gray-700">{label}</span>
    </label>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-base font-semibold text-gray-900">{label}</h3>
          <Badge label={form.statusFinal} className={statusNumeroColor(form.statusFinal)} />
        </div>
        <Button variant="primary" size="sm" onClick={save} disabled={!dirty}>
          Salvar alterações
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-4">
          <Card className="p-5">
            <h4 className="text-sm font-semibold text-gray-700 mb-4">Dados do número</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">DDD</label>
                <input
                  type="text"
                  value={form.ddd}
                  onChange={(e) => set('ddd', e.target.value)}
                  maxLength={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Número</label>
                <input
                  type="text"
                  value={form.numero}
                  onChange={(e) => set('numero', e.target.value)}
                  placeholder="Ex: 11 99999-0000"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Operadora</label>
                <input
                  type="text"
                  value={form.operadora}
                  onChange={(e) => set('operadora', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Status do chip</label>
                <input
                  type="text"
                  value={form.statusChip}
                  onChange={(e) => set('statusChip', e.target.value)}
                  placeholder="Ex: Ativo, Aguardando ativação..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Data de ativação</label>
                <input
                  type="datetime-local"
                  value={form.dataAtivacao ? form.dataAtivacao.slice(0, 16) : ''}
                  onChange={(e) => set('dataAtivacao', e.target.value ? new Date(e.target.value).toISOString() : '')}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Status final</label>
                <select
                  value={form.statusFinal}
                  onChange={(e) => set('statusFinal', e.target.value as StatusNumero)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {boolField('Número conectado na BM?', 'conectadoBM')}
              {boolField('Número conectado no DataCrazy?', 'conectadoDataCrazy')}
              {type === 'ativo' && boolField('Pode disparar?', 'podeDisparar')}
              {boolField('Teste de recebimento realizado?', 'testeRealizado')}
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

          {form.statusFinal === 'Pronto' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm font-semibold text-green-800">
                ✓ {label} configurado e pronto!
              </p>
              {form.dataAtivacao && (
                <p className="text-xs text-green-600 mt-1">Ativado em: {formatDate(form.dataAtivacao)}</p>
              )}
            </div>
          )}
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
