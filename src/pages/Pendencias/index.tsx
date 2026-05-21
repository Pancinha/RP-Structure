import { useNavigate } from 'react-router-dom'
import { useStore } from '../../store'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { priorityColor, formatDate, isOverdue } from '../../utils/format'

export function Pendencias() {
  const clients = useStore((s) => s.clients)
  const navigate = useNavigate()

  const pendentes = clients.filter(
    (c) =>
      c.statusGeral === 'Cliente com pendência' ||
      !!c.pendencia ||
      (c.prazoProximaAcao && isOverdue(c.prazoProximaAcao))
  )

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Pendências</h1>
        <p className="text-sm text-gray-500 mt-1">
          {pendentes.length} cliente(s) com pendências ou tarefas vencidas
        </p>
      </div>

      {pendentes.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-green-600 font-medium text-lg">✓ Nenhuma pendência no momento!</p>
          <p className="text-gray-500 text-sm mt-2">Todos os clientes estão em dia.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {pendentes.map((c) => {
            const overdue = c.prazoProximaAcao && isOverdue(c.prazoProximaAcao)
            return (
              <Card key={c.id} className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <h3 className="font-semibold text-gray-900">{c.nome}</h3>
                      <Badge label={c.prioridade} className={priorityColor(c.prioridade)} />
                      {overdue && (
                        <Badge label="Tarefa vencida" className="bg-red-100 text-red-800 border-red-200" />
                      )}
                    </div>
                    {c.pendencia && (
                      <p className="text-sm text-red-700 mb-2">
                        <strong>Pendência:</strong> {c.pendencia}
                      </p>
                    )}
                    {c.proximaAcao && (
                      <p className="text-sm text-gray-700">
                        <strong>Próxima ação:</strong> {c.proximaAcao}
                      </p>
                    )}
                    {c.prazoProximaAcao && (
                      <p className={`text-xs mt-1 ${overdue ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
                        Prazo: {formatDate(c.prazoProximaAcao)}
                        {overdue && ' — VENCIDO'}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => navigate(`/clientes/${c.id}`)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium ml-4"
                  >
                    Abrir →
                  </button>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
