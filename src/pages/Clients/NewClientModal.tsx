import { useState } from 'react'
import { Modal } from '../../components/ui/Modal'
import { Button } from '../../components/ui/Button'
import { useStore } from '../../store'
import type { StatusGeral, Prioridade } from '../../types'

interface Props {
  open: boolean
  onClose: () => void
}

const statusOptions: StatusGeral[] = [
  'Aguardando dados/acesso',
  'Aguardando código Facebook',
  'Primeiro acesso realizado',
  'Aguardando 24h',
]

const prioridadeOptions: Prioridade[] = ['Baixa', 'Média', 'Alta', 'Urgente']

export function NewClientModal({ open, onClose }: Props) {
  const addClient = useStore((s) => s.addClient)
  const [form, setForm] = useState({
    nome: '',
    nomeConhecido: '',
    responsavel: '',
    whatsapp: '',
    email: '',
    ddd: '',
    cnpj: '',
    razaoSocial: '',
    nomeFantasia: '',
    observacoesCNPJ: '',
    observacoesGerais: '',
    statusGeral: 'Aguardando dados/acesso' as StatusGeral,
    statusReceptivo: 'Não iniciado' as const,
    statusAtivo: 'Não iniciado' as const,
    statusDataCrazy: 'Não iniciado' as const,
    proximaAcao: '',
    prazoProximaAcao: '',
    prioridade: 'Média' as Prioridade,
    pendencia: '',
  })

  const set = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }))

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nome.trim()) return
    addClient(form)
    onClose()
    setForm({
      nome: '',
      nomeConhecido: '',
      responsavel: '',
      whatsapp: '',
      email: '',
      ddd: '',
      cnpj: '',
      razaoSocial: '',
      nomeFantasia: '',
      observacoesCNPJ: '',
      observacoesGerais: '',
      statusGeral: 'Aguardando dados/acesso',
      statusReceptivo: 'Não iniciado',
      statusAtivo: 'Não iniciado',
      statusDataCrazy: 'Não iniciado',
      proximaAcao: '',
      prazoProximaAcao: '',
      prioridade: 'Média',
      pendencia: '',
    })
  }

  const field = (label: string, key: string, required = false, type = 'text') => (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        value={(form as Record<string, string>)[key] ?? ''}
        onChange={(e) => set(key, e.target.value)}
        required={required}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
    </div>
  )

  return (
    <Modal open={open} onClose={onClose} title="Novo cliente" size="xl">
      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          <section>
            <h3 className="text-sm font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-100">
              Dados básicos
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {field('Nome do cliente', 'nome', true)}
              {field('Nome conhecido pelo público', 'nomeConhecido', true)}
              {field('Responsável do cliente', 'responsavel')}
              {field('WhatsApp do responsável', 'whatsapp')}
              {field('E-mail', 'email', false, 'email')}
              {field('DDD desejado', 'ddd')}
            </div>
            <div className="mt-4">
              <label className="block text-xs font-medium text-gray-700 mb-1">Observações gerais</label>
              <textarea
                value={form.observacoesGerais}
                onChange={(e) => set('observacoesGerais', e.target.value)}
                rows={2}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </section>

          <section>
            <h3 className="text-sm font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-100">
              Dados jurídicos
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {field('CNPJ', 'cnpj')}
              {field('Razão social', 'razaoSocial')}
              {field('Nome fantasia', 'nomeFantasia')}
            </div>
            <div className="mt-4">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Observação sobre compatibilidade do nome
              </label>
              <input
                type="text"
                value={form.observacoesCNPJ}
                onChange={(e) => set('observacoesCNPJ', e.target.value)}
                placeholder="Ex: Nome fantasia compatível com nome público"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </section>

          <section>
            <h3 className="text-sm font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-100">
              Configuração inicial
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Status inicial</label>
                <select
                  value={form.statusGeral}
                  onChange={(e) => set('statusGeral', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {statusOptions.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Prioridade</label>
                <select
                  value={form.prioridade}
                  onChange={(e) => set('prioridade', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {prioridadeOptions.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Próxima ação</label>
                <input
                  type="text"
                  value={form.proximaAcao}
                  onChange={(e) => set('proximaAcao', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Prazo</label>
                <input
                  type="datetime-local"
                  value={form.prazoProximaAcao ? form.prazoProximaAcao.slice(0, 16) : ''}
                  onChange={(e) =>
                    set('prazoProximaAcao', e.target.value ? new Date(e.target.value).toISOString() : '')
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </section>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" type="submit">
            Cadastrar cliente
          </Button>
        </div>
      </form>
    </Modal>
  )
}
