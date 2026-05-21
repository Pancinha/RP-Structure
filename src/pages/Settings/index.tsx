import { useState, useRef } from 'react'
import { Upload, Download, AlertTriangle, CheckCircle, Database } from 'lucide-react'
import { useStore } from '../../store'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import type { Client } from '../../types'

export function Settings() {
  const clients = useStore((s) => s.clients)
  const setClients = useStore((s) => s.setClients)
  const [confirmReset, setConfirmReset] = useState(false)
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [importMsg, setImportMsg] = useState('')
  const [confirmImport, setConfirmImport] = useState<Client[] | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const lastBackup = localStorage.getItem('rp-structure-last-backup')
  const lastBackupLabel = lastBackup
    ? new Date(lastBackup).toLocaleString('pt-BR')
    : 'Nunca'

  function handleExport() {
    const data = JSON.stringify({ clients, exportedAt: new Date().toISOString() }, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `rp-structure-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    localStorage.setItem('rp-structure-last-backup', new Date().toISOString())
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string)
        if (!parsed.clients || !Array.isArray(parsed.clients)) {
          setImportStatus('error')
          setImportMsg('Arquivo inválido: não contém lista de clientes.')
          return
        }
        setConfirmImport(parsed.clients as Client[])
      } catch {
        setImportStatus('error')
        setImportMsg('Arquivo inválido: JSON corrompido ou mal formado.')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  function doImport() {
    if (!confirmImport) return
    setClients(confirmImport)
    localStorage.setItem('rp-structure-last-backup', new Date().toISOString())
    setImportStatus('success')
    setImportMsg(`${confirmImport.length} cliente(s) importado(s) com sucesso.`)
    setConfirmImport(null)
  }

  function handleReset() {
    setClients([])
    window.location.reload()
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
        <p className="text-sm text-gray-500 mt-1">Gerenciamento de dados e sistema</p>
      </div>

      <div className="space-y-4 max-w-2xl">

        {/* System info */}
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Informações do sistema</h3>
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
            <div className="text-gray-500">Sistema</div>
            <div className="font-medium text-gray-900">RP Structure</div>
            <div className="text-gray-500">Clientes cadastrados</div>
            <div className="font-medium text-gray-900">{clients.length}</div>
            <div className="text-gray-500">Armazenamento</div>
            <div className="font-medium text-gray-900 flex items-center gap-1.5">
              <Database size={13} className="text-green-600" />
              Supabase (nuvem)
            </div>
            <div className="text-gray-500">Último backup exportado</div>
            <div className="font-medium text-gray-900">{lastBackupLabel}</div>
            <div className="text-gray-500">Versão</div>
            <div className="font-medium text-gray-900">2.0</div>
          </div>
        </Card>

        {/* Cloud info */}
        <Card className="p-4 bg-green-50 border-green-200">
          <div className="flex gap-3">
            <Database size={18} className="text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-green-800 mb-1">Dados salvos na nuvem</p>
              <ul className="text-xs text-green-700 space-y-1">
                <li>✓ Dados persistem independente do navegador ou dispositivo</li>
                <li>✓ Atualizações de código <strong>não apagam</strong> seus dados</li>
                <li>✓ Acessível de qualquer lugar com internet</li>
                <li>✓ Backup automático pelo Supabase</li>
              </ul>
            </div>
          </div>
        </Card>

        {/* Export */}
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-1">Exportar backup local</h3>
          <p className="text-xs text-gray-500 mb-3">
            Gera um arquivo JSON com todos os seus dados. Útil para ter uma cópia local de segurança.
          </p>
          <Button variant="secondary" onClick={handleExport}>
            <Download size={14} />
            Exportar JSON agora
          </Button>
        </Card>

        {/* Import */}
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-1">Importar backup</h3>
          <p className="text-xs text-gray-500 mb-3">
            Restaura seus dados a partir de um arquivo de backup exportado anteriormente.
            <strong className="text-gray-700"> Os dados atuais serão substituídos no banco.</strong>
          </p>

          {importStatus === 'success' && (
            <div className="flex items-center gap-2 mb-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle size={14} className="text-green-600" />
              <p className="text-sm text-green-800">{importMsg}</p>
            </div>
          )}
          {importStatus === 'error' && (
            <div className="flex items-center gap-2 mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertTriangle size={14} className="text-red-600" />
              <p className="text-sm text-red-800">{importMsg}</p>
            </div>
          )}

          <input
            ref={fileRef}
            type="file"
            accept=".json"
            onChange={handleFileSelect}
            className="hidden"
          />
          <Button variant="secondary" onClick={() => fileRef.current?.click()}>
            <Upload size={14} />
            Selecionar arquivo JSON
          </Button>
        </Card>

        {/* Reset */}
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-1">Resetar sistema</h3>
          <p className="text-xs text-gray-500 mb-3">
            Apaga <strong>todos</strong> os dados do banco e reinicia o sistema. Ação irreversível.
          </p>
          <Button variant="danger" onClick={() => setConfirmReset(true)}>
            Resetar tudo
          </Button>
        </Card>
      </div>

      {/* Confirm import */}
      <ConfirmDialog
        open={!!confirmImport}
        title="Confirmar importação"
        message={`Isso substituirá todos os ${clients.length} cliente(s) atual(is) pelos ${confirmImport?.length ?? 0} cliente(s) do arquivo. Os dados serão salvos no banco. Confirmar?`}
        confirmLabel="Importar e substituir"
        onConfirm={doImport}
        onCancel={() => setConfirmImport(null)}
      />

      {/* Confirm reset */}
      <ConfirmDialog
        open={confirmReset}
        title="Resetar sistema"
        message="Isso irá apagar TODOS os clientes e dados do banco. Esta ação não pode ser desfeita. Confirmar?"
        confirmLabel="Resetar tudo"
        danger
        onConfirm={handleReset}
        onCancel={() => setConfirmReset(false)}
      />
    </div>
  )
}
