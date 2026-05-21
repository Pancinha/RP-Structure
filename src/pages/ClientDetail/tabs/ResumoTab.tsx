import { useState } from 'react'
import type { Client, StatusGeral, Prioridade } from '../../../types'
import { useStore } from '../../../store'
import { Badge } from '../../../components/ui/Badge'
import { Button } from '../../../components/ui/Button'
import { Card } from '../../../components/ui/Card'
import { statusGeralColor, priorityColor, formatDate, isOverdue } from '../../../utils/format'

const STATUS_OPTIONS: StatusGeral[] = [
  'Aguardando dados/acesso', 'Aguardando código Facebook', 'Primeiro acesso realizado',
  'Aguardando 24h', 'Criando BM receptiva', 'BM receptiva em análise',
  'BM receptiva aprovada', 'Configurando número receptivo', 'Receptivo pronto',
  'Criando BM ativa', 'BM ativa em análise', 'BM ativa aprovada',
  'Configurando número ativo', 'Configurando DataCrazy', 'Configurando automações',
  'Cliente pronto', 'Cliente com pendência', 'Cliente pausado', 'Cliente cancelado',
]

interface Props { client: Client }

export function ResumoTab({ client }: Props) {
  const updateClient = useStore((s) => s.updateClient)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    nome: client.nome,
    nomeConhecido: client.nomeConhecido,
    responsavel: client.responsavel,
    whatsapp: client.whatsapp,
    email: client.email,
    ddd: client.ddd,
    cnpj: client.cnpj,
    razaoSocial: client.razaoSocial,
    nomeFantasia: client.nomeFantasia,
    observacoesCNPJ: client.observacoesCNPJ,
    observacoesGerais: client.observacoesGerais,
    statusGeral: client.statusGeral,
    proximaAcao: client.proximaAcao,
    prazoProximaAcao: client.prazoProximaAcao,
    prioridade: client.prioridade,
    pendencia: client.pendencia,
  })

  function save() {
    updateClient(client.id, { ...form })
    setEditing(false)
  }

  const overdue = isOverdue(client.prazoProximaAcao)

  if (editing) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-900">Editar resumo</h3>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => setEditing(false)}>Cancelar</Button>
            <Button variant="primary" size="sm" onClick={save}>Salvar</Button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[
            ['Nome do cliente', 'nome'],
            ['Nome conhecido', 'nomeConhecido'],
            ['Responsável', 'responsavel'],
            ['WhatsApp', 'whatsapp'],
            ['E-mail', 'email'],
            ['DDD', 'ddd'],
            ['CNPJ', 'cnpj'],
            ['Razão social', 'razaoSocial'],
            ['Nome fantasia', 'nomeFantasia'],
          ].map(([label, key]) => (
            <div key={key}>
              <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
              <input
                type="text"
                value={(form as Record<string, string>)[key] ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          ))}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Status geral</label>
            <select
              value={form.statusGeral}
              onChange={(e) => setForm((f) => ({ ...f, statusGeral: e.target.value as StatusGeral }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Prioridade</label>
            <select
              value={form.prioridade}
              onChange={(e) => setForm((f) => ({ ...f, prioridade: e.target.value as Prioridade }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {(['Baixa', 'Média', 'Alta', 'Urgente'] as Prioridade[]).map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-700 mb-1">Próxima ação</label>
            <input
              type="text"
              value={form.proximaAcao}
              onChange={(e) => setForm((f) => ({ ...f, proximaAcao: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Prazo</label>
            <input
              type="datetime-local"
              value={form.prazoProximaAcao ? form.prazoProximaAcao.slice(0, 16) : ''}
              onChange={(e) => setForm((f) => ({ ...f, prazoProximaAcao: e.target.value ? new Date(e.target.value).toISOString() : '' }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Pendência atual</label>
            <input
              type="text"
              value={form.pendencia}
              onChange={(e) => setForm((f) => ({ ...f, pendencia: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-700 mb-1">Observações gerais</label>
            <textarea
              value={form.observacoesGerais}
              onChange={(e) => setForm((f) => ({ ...f, observacoesGerais: e.target.value }))}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>
    )
  }

  const row = (label: string, value: string) => (
    <div key={label} className="flex flex-col gap-0.5">
      <span className="text-xs text-gray-500 font-medium">{label}</span>
      <span className="text-sm text-gray-900">{value || '—'}</span>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-gray-900">Resumo do cliente</h3>
        <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>Editar</Button>
      </div>

      {client.pendencia && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm font-medium text-red-800">⚠ Pendência: {client.pendencia}</p>
        </div>
      )}

      {client.proximaAcao && (
        <div className={`rounded-lg p-4 border ${overdue ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'}`}>
          <p className="text-xs font-medium text-gray-500 mb-1">Próxima ação</p>
          <p className={`text-sm font-semibold ${overdue ? 'text-red-800' : 'text-blue-800'}`}>
            {client.proximaAcao}
          </p>
          {client.prazoProximaAcao && (
            <p className={`text-xs mt-1 ${overdue ? 'text-red-600' : 'text-blue-600'}`}>
              Prazo: {formatDate(client.prazoProximaAcao)}
              {overdue && ' — VENCIDO'}
            </p>
          )}
        </div>
      )}

      <div className="flex gap-3 flex-wrap">
        <Badge label={client.statusGeral} className={statusGeralColor(client.statusGeral)} />
        <Badge label={client.prioridade} className={priorityColor(client.prioridade)} />
        <Badge
          label={`Receptivo: ${client.statusReceptivo}`}
          className={client.statusReceptivo === 'Pronto' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-gray-100 text-gray-600 border-gray-200'}
        />
        <Badge
          label={`Ativo: ${client.statusAtivo}`}
          className={client.statusAtivo === 'Pronto' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-gray-100 text-gray-600 border-gray-200'}
        />
        <Badge
          label={`DataCrazy: ${client.statusDataCrazy}`}
          className={client.statusDataCrazy === 'Pronto' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-gray-100 text-gray-600 border-gray-200'}
        />
      </div>

      <Card className="p-5">
        <h4 className="text-sm font-semibold text-gray-700 mb-4">Dados do cliente</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {row('Nome', client.nome)}
          {row('Nome conhecido', client.nomeConhecido)}
          {row('Responsável', client.responsavel)}
          {row('WhatsApp', client.whatsapp)}
          {row('E-mail', client.email)}
          {row('DDD', client.ddd)}
          {row('CNPJ', client.cnpj)}
          {row('Razão social', client.razaoSocial)}
          {row('Nome fantasia', client.nomeFantasia)}
          {row('Obs. CNPJ', client.observacoesCNPJ)}
          {row('Cadastrado em', formatDate(client.criadoEm))}
          {row('Atualizado em', formatDate(client.atualizadoEm))}
        </div>
        {client.observacoesGerais && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <span className="text-xs text-gray-500 font-medium">Observações gerais</span>
            <p className="text-sm text-gray-700 mt-1">{client.observacoesGerais}</p>
          </div>
        )}
      </Card>
    </div>
  )
}
