import { useState } from 'react'
import type { Client, FacebookData, StatusFacebook } from '../../../types'
import { useStore } from '../../../store'
import { Button } from '../../../components/ui/Button'
import { Card } from '../../../components/ui/Card'
import { applyFacebookAutomation } from '../../../utils/automation'
import { formatDate } from '../../../utils/format'

interface Props { client: Client }

const statusOptions: StatusFacebook[] = [
  'Pendente', 'Acesso recebido', 'Senha armazenada em local seguro', 'Erro de acesso'
]

export function FacebookTab({ client }: Props) {
  const updateFacebook = useStore((s) => s.updateFacebook)
  const [form, setForm] = useState<FacebookData>({ ...client.facebook })
  const [dirty, setDirty] = useState(false)

  function set<K extends keyof FacebookData>(key: K, value: FacebookData[K]) {
    setForm((f) => ({ ...f, [key]: value }))
    setDirty(true)
  }

  function save() {
    const prevPrimeiroAcesso = client.facebook.primeiroAcessoRealizado
    const marcandoAgora = !prevPrimeiroAcesso && form.primeiroAcessoRealizado

    const autoUpdates = applyFacebookAutomation(client, marcandoAgora)

    const facebookData: FacebookData = {
      ...form,
      dataPrimeiroAcesso: form.primeiroAcessoRealizado && !form.dataPrimeiroAcesso
        ? new Date().toISOString()
        : form.dataPrimeiroAcesso,
      dataSegundoAcesso: form.segundoAcessoRealizado && !form.dataSegundoAcesso
        ? new Date().toISOString()
        : form.dataSegundoAcesso,
    }

    updateFacebook(
      client.id,
      facebookData,
      Object.keys(autoUpdates).length > 0 ? autoUpdates : undefined
    )
    setDirty(false)
  }

  const bool = (label: string, key: keyof FacebookData, obs?: string) => (
    <label className="flex items-start gap-3 cursor-pointer">
      <input
        type="checkbox"
        checked={!!form[key]}
        onChange={(e) => set(key, e.target.checked as never)}
        className="mt-0.5 w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
      />
      <div>
        <span className="text-sm text-gray-700">{label}</span>
        {obs && <p className="text-xs text-gray-500 mt-0.5">{obs}</p>}
      </div>
    </label>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-gray-900">Facebook</h3>
        <Button variant="primary" size="sm" onClick={save} disabled={!dirty}>
          Salvar alterações
        </Button>
      </div>

      <Card className="p-5">
        <h4 className="text-sm font-semibold text-gray-700 mb-4">Dados de acesso</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Link do perfil</label>
            <input
              type="url"
              value={form.linkPerfil}
              onChange={(e) => set('linkPerfil', e.target.value)}
              placeholder="https://facebook.com/..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Login informado</label>
            <input
              type="text"
              value={form.loginInformado}
              onChange={(e) => set('loginInformado', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Status do acesso</label>
            <select
              value={form.statusAcesso}
              onChange={(e) => set('statusAcesso', e.target.value as StatusFacebook)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {statusOptions.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <p className="text-xs text-gray-400 mt-1">
              Não salve senhas aqui. Use "Senha armazenada em local seguro" para indicar que a senha está guardada de forma segura.
            </p>
          </div>
        </div>
      </Card>

      <Card className="p-5">
        <h4 className="text-sm font-semibold text-gray-700 mb-4">Verificação e acessos</h4>
        <div className="space-y-4">
          {bool('Código de verificação solicitado?', 'codigoSolicitado')}
          {bool('Código de verificação recebido?', 'codigoRecebido')}
          {bool(
            'Primeiro acesso realizado?',
            'primeiroAcessoRealizado',
            'Ao marcar, o sistema criará automaticamente a próxima ação de aguardar 24h'
          )}
          {form.primeiroAcessoRealizado && form.dataPrimeiroAcesso && (
            <p className="text-xs text-gray-500 ml-7">
              Data: {formatDate(form.dataPrimeiroAcesso)}
            </p>
          )}
          {bool('Segundo acesso realizado?', 'segundoAcessoRealizado')}
          {form.segundoAcessoRealizado && form.dataSegundoAcesso && (
            <p className="text-xs text-gray-500 ml-7">
              Data: {formatDate(form.dataSegundoAcesso)}
            </p>
          )}
        </div>
      </Card>

      <Card className="p-5">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Observações</h4>
        <textarea
          value={form.observacoes}
          onChange={(e) => set('observacoes', e.target.value)}
          rows={4}
          placeholder="Observações sobre o acesso ao Facebook..."
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </Card>
    </div>
  )
}
