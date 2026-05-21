import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useStore } from '../../store'
import { Badge } from '../../components/ui/Badge'
import { priorityColor, statusGeralColor } from '../../utils/format'
import { ResumoTab } from './tabs/ResumoTab'
import { FacebookTab } from './tabs/FacebookTab'
import { BMTab } from './tabs/BMTab'
import { NumberTab } from './tabs/NumberTab'
import { DataCrazyTab } from './tabs/DataCrazyTab'
import { HistoricoTab } from './tabs/HistoricoTab'

const TABS = [
  { id: 'resumo', label: 'Resumo' },
  { id: 'facebook', label: 'Facebook' },
  { id: 'bm-receptiva', label: 'BM Receptiva' },
  { id: 'numero-receptivo', label: 'Nº Receptivo' },
  { id: 'bm-ativa', label: 'BM Ativa' },
  { id: 'numero-ativo', label: 'Nº Ativo' },
  { id: 'datacrazy', label: 'DataCrazy' },
  { id: 'historico', label: 'Histórico' },
]

export function ClientDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('resumo')
  const client = useStore((s) => s.clients.find((c) => c.id === id))

  if (!client) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">Cliente não encontrado.</p>
        <button
          onClick={() => navigate('/clientes')}
          className="text-blue-600 hover:underline text-sm mt-2"
        >
          Voltar para a lista
        </button>
      </div>
    )
  }

  function renderTab() {
    if (!client) return null
    switch (activeTab) {
      case 'resumo': return <ResumoTab client={client} />
      case 'facebook': return <FacebookTab client={client} />
      case 'bm-receptiva': return <BMTab client={client} type="receptiva" />
      case 'numero-receptivo': return <NumberTab client={client} type="receptivo" />
      case 'bm-ativa': return <BMTab client={client} type="ativa" />
      case 'numero-ativo': return <NumberTab client={client} type="ativo" />
      case 'datacrazy': return <DataCrazyTab client={client} />
      case 'historico': return <HistoricoTab client={client} />
      default: return null
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-3 mb-3">
          <button
            onClick={() => navigate('/clientes')}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{client.nome}</h1>
            <p className="text-sm text-gray-500">{client.nomeConhecido} · DDD {client.ddd}</p>
          </div>
          <div className="ml-3 flex items-center gap-2 flex-wrap">
            <Badge label={client.statusGeral} className={statusGeralColor(client.statusGeral)} />
            <Badge label={client.prioridade} className={priorityColor(client.prioridade)} />
          </div>
        </div>

        <div className="flex gap-1 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab.label}
              {tab.id === 'historico' && (
                <span className="ml-1.5 text-xs opacity-70">({client.historico.length})</span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {renderTab()}
      </div>
    </div>
  )
}
