import { useState } from 'react'
import { Plus } from 'lucide-react'
import type { Client, TipoHistorico } from '../../../types'
import { useStore } from '../../../store'
import { Button } from '../../../components/ui/Button'
import { Card } from '../../../components/ui/Card'
import { makeHistoryEntry } from '../../../utils/automation'
import { formatDate, tipoHistoricoLabel } from '../../../utils/format'

interface Props { client: Client }

const tipoColors: Record<TipoHistorico, string> = {
  cadastro: 'bg-gray-100 text-gray-700',
  facebook: 'bg-blue-100 text-blue-700',
  bm_receptiva: 'bg-purple-100 text-purple-700',
  numero_receptivo: 'bg-green-100 text-green-700',
  bm_ativa: 'bg-indigo-100 text-indigo-700',
  numero_ativo: 'bg-teal-100 text-teal-700',
  datacrazy: 'bg-orange-100 text-orange-700',
  automacao: 'bg-yellow-100 text-yellow-700',
  status: 'bg-slate-100 text-slate-700',
  manual: 'bg-pink-100 text-pink-700',
}

export function HistoricoTab({ client }: Props) {
  const addHistory = useStore((s) => s.addHistory)
  const [showForm, setShowForm] = useState(false)
  const [obs, setObs] = useState('')
  const [descricao, setDescricao] = useState('')

  function handleAdd() {
    if (!descricao.trim()) return
    addHistory(client.id, makeHistoryEntry('manual', descricao, obs))
    setDescricao('')
    setObs('')
    setShowForm(false)
  }

  const sorted = [...client.historico].sort(
    (a, b) => new Date(b.dataHora).getTime() - new Date(a.dataHora).getTime()
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-gray-900">
          Histórico ({client.historico.length} registros)
        </h3>
        <Button variant="secondary" size="sm" onClick={() => setShowForm((v) => !v)}>
          <Plus size={14} />
          Adicionar observação
        </Button>
      </div>

      {showForm && (
        <Card className="p-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Nova entrada manual</h4>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Descrição *</label>
              <input
                type="text"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="O que foi feito / aconteceu?"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Observação adicional</label>
              <textarea
                value={obs}
                onChange={(e) => setObs(e.target.value)}
                rows={2}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" size="sm" onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button variant="primary" size="sm" onClick={handleAdd}>Registrar</Button>
            </div>
          </div>
        </Card>
      )}

      <div className="space-y-3">
        {sorted.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-8">
            Nenhum registro no histórico ainda.
          </p>
        )}
        {sorted.map((entry) => (
          <Card key={entry.id} className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span
                    className={`text-xs px-2 py-0.5 rounded font-medium ${tipoColors[entry.tipo] ?? 'bg-gray-100 text-gray-700'}`}
                  >
                    {tipoHistoricoLabel(entry.tipo)}
                  </span>
                  <span className="text-xs text-gray-500">{entry.responsavel}</span>
                </div>
                <p className="text-sm text-gray-900 font-medium">{entry.descricao}</p>
                {entry.observacao && (
                  <p className="text-xs text-gray-500 mt-1">{entry.observacao}</p>
                )}
              </div>
              <time className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0">
                {formatDate(entry.dataHora)}
              </time>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
