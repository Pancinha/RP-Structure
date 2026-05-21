import { useNavigate } from 'react-router-dom'
import { useStore } from '../../store'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { priorityColor, formatDate, isOverdue, isDueToday } from '../../utils/format'

interface Task {
  clientId: string
  clientName: string
  acao: string
  prazo: string
  prioridade: string
  tipo: string
  pendencia: string
}

export function Tasks() {
  const clients = useStore((s) => s.clients)
  const navigate = useNavigate()

  const tasks: Task[] = clients
    .filter((c) => c.proximaAcao || c.pendencia)
    .map((c) => ({
      clientId: c.id,
      clientName: c.nome,
      acao: c.proximaAcao || c.pendencia,
      prazo: c.prazoProximaAcao,
      prioridade: c.prioridade,
      tipo: c.pendencia ? 'Pendência' : inferTipo(c.proximaAcao),
      pendencia: c.pendencia,
    }))
    .sort((a, b) => {
      const prioOrder = { Urgente: 0, Alta: 1, Média: 2, Baixa: 3 }
      const aOverdue = isOverdue(a.prazo) ? -1 : 0
      const bOverdue = isOverdue(b.prazo) ? -1 : 0
      if (aOverdue !== bOverdue) return aOverdue - bOverdue
      return (prioOrder[a.prioridade as keyof typeof prioOrder] ?? 4) -
        (prioOrder[b.prioridade as keyof typeof prioOrder] ?? 4)
    })

  const overdue = tasks.filter((t) => t.prazo && isOverdue(t.prazo)).length
  const today = tasks.filter((t) => t.prazo && isDueToday(t.prazo)).length

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Tarefas</h1>
        <p className="text-sm text-gray-500 mt-1">
          {tasks.length} tarefa(s) · {overdue} vencida(s) · {today} para hoje
        </p>
      </div>

      {overdue > 0 && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm font-medium text-red-800">
            ⚠ {overdue} tarefa(s) vencida(s) — atenção imediata necessária
          </p>
        </div>
      )}

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Cliente</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Ação / Pendência</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Tipo</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Prazo</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Prioridade</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => {
                const overdue = task.prazo && isOverdue(task.prazo)
                const today = task.prazo && isDueToday(task.prazo)
                return (
                  <tr
                    key={task.clientId}
                    className={`border-b border-gray-100 hover:bg-gray-50 ${
                      overdue ? 'bg-red-50/50' : today ? 'bg-yellow-50/50' : ''
                    }`}
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{task.clientName}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-gray-700">{task.acao}</p>
                      {task.pendencia && (
                        <Badge label="Pendência" className="mt-1 bg-red-100 text-red-700 border-red-200" />
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        label={task.tipo}
                        className="bg-gray-100 text-gray-700 border-gray-200"
                      />
                    </td>
                    <td className="px-4 py-3">
                      {task.prazo ? (
                        <span
                          className={`text-xs font-medium ${
                            overdue ? 'text-red-600' : today ? 'text-yellow-600' : 'text-gray-600'
                          }`}
                        >
                          {formatDate(task.prazo)}
                          {overdue && ' — VENCIDO'}
                          {today && !overdue && ' — HOJE'}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">Sem prazo</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge label={task.prioridade} className={priorityColor(task.prioridade as never)} />
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => navigate(`/clientes/${task.clientId}`)}
                        className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                      >
                        Abrir →
                      </button>
                    </td>
                  </tr>
                )
              })}
              {tasks.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                    Nenhuma tarefa pendente.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

function inferTipo(acao: string): string {
  if (!acao) return 'Geral'
  const lower = acao.toLowerCase()
  if (lower.includes('facebook') || lower.includes('acesso') || lower.includes('código')) return 'Facebook'
  if (lower.includes('bm') || lower.includes('verificação') || lower.includes('domínio')) return 'BM'
  if (lower.includes('número') || lower.includes('chip')) return 'Número'
  if (lower.includes('datacrazy') || lower.includes('automação') || lower.includes('funil')) return 'DataCrazy'
  return 'Geral'
}
