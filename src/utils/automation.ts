import { add24h } from './format'
import type { Client, HistoryEntry, TipoHistorico } from '../types'

export function makeHistoryEntry(
  tipo: TipoHistorico,
  descricao: string,
  observacao = '',
): HistoryEntry {
  return {
    id: `h-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    dataHora: new Date().toISOString(),
    tipo,
    descricao,
    responsavel: 'Rafael',
    observacao,
  }
}

export function applyFacebookAutomation(
  client: Client,
  primeiroAcessoMarcado: boolean,
): Partial<Client> {
  if (!primeiroAcessoMarcado) return {}

  const entry = makeHistoryEntry('facebook', 'Primeiro acesso ao Facebook realizado')
  return {
    statusGeral: 'Aguardando 24h',
    proximaAcao: 'Aguardar 24h e acessar novamente para iniciar criação/verificação da BM',
    prazoProximaAcao: add24h(),
    pendencia: '',
    historico: [...client.historico, entry],
    atualizadoEm: new Date().toISOString(),
  }
}

export function applyBMReceptivaAutomation(
  client: Client,
  newStatus: string,
): Partial<Client> {
  const updates: Partial<Client> = { atualizadoEm: new Date().toISOString() }

  if (newStatus === 'Verificação enviada' || newStatus === 'Em análise') {
    const entry = makeHistoryEntry('bm_receptiva', 'BM receptiva enviada para verificação')
    updates.statusGeral = 'BM receptiva em análise'
    updates.proximaAcao = 'Verificar aprovação da BM receptiva'
    updates.prazoProximaAcao = add24h()
    updates.pendencia = ''
    updates.historico = [...client.historico, entry]
  }

  if (newStatus === 'Aprovada') {
    const entry = makeHistoryEntry('bm_receptiva', 'BM receptiva aprovada pelo Meta')
    updates.statusGeral = 'BM receptiva aprovada'
    updates.proximaAcao = 'Separar e ativar número receptivo'
    updates.prazoProximaAcao = ''
    updates.pendencia = ''
    updates.historico = [...client.historico, entry]
  }

  if (newStatus === 'Recusada') {
    const entry = makeHistoryEntry('bm_receptiva', 'BM receptiva recusada pelo Meta')
    updates.statusGeral = 'Cliente com pendência'
    updates.pendencia = 'BM receptiva recusada — verificar motivo e reenviar'
    updates.proximaAcao = ''
    updates.prazoProximaAcao = ''
    updates.historico = [...client.historico, entry]
  }

  if (newStatus === 'Com pendência') {
    const entry = makeHistoryEntry('bm_receptiva', 'BM receptiva com pendência')
    updates.statusGeral = 'Cliente com pendência'
    updates.pendencia = 'BM receptiva com pendência — verificar e resolver'
    updates.historico = [...client.historico, entry]
  }

  // Qualquer mudança para status de progresso limpa pendência anterior
  if (['Criando', 'Dados preenchidos', 'Site/domínio pendente', 'Não iniciada'].includes(newStatus)) {
    updates.pendencia = ''
  }

  return updates
}

export function applyNumeroReceptivoAutomation(
  client: Client,
  pronto: boolean,
): Partial<Client> {
  if (!pronto) return {}

  const entry = makeHistoryEntry('numero_receptivo', 'Número receptivo ativado e pronto')
  return {
    statusReceptivo: 'Pronto',
    statusGeral: 'Receptivo pronto',
    proximaAcao: 'Configurar BM ativa',
    prazoProximaAcao: '',
    pendencia: '',
    historico: [...client.historico, entry],
    atualizadoEm: new Date().toISOString(),
  }
}

export function applyBMAtivaAutomation(
  client: Client,
  newStatus: string,
): Partial<Client> {
  const updates: Partial<Client> = { atualizadoEm: new Date().toISOString() }

  if (newStatus === 'Verificação enviada' || newStatus === 'Em análise') {
    const entry = makeHistoryEntry('bm_ativa', 'BM ativa enviada para verificação')
    updates.statusGeral = 'BM ativa em análise'
    updates.proximaAcao = 'Verificar aprovação da BM ativa'
    updates.prazoProximaAcao = add24h()
    updates.pendencia = ''
    updates.historico = [...client.historico, entry]
  }

  if (newStatus === 'Aprovada') {
    const entry = makeHistoryEntry('bm_ativa', 'BM ativa aprovada pelo Meta')
    updates.statusGeral = 'BM ativa aprovada'
    updates.proximaAcao = 'Separar e ativar número ativo'
    updates.prazoProximaAcao = ''
    updates.pendencia = ''
    updates.historico = [...client.historico, entry]
  }

  if (newStatus === 'Recusada') {
    const entry = makeHistoryEntry('bm_ativa', 'BM ativa recusada pelo Meta')
    updates.statusGeral = 'Cliente com pendência'
    updates.pendencia = 'BM ativa recusada — verificar motivo e reenviar'
    updates.proximaAcao = ''
    updates.prazoProximaAcao = ''
    updates.historico = [...client.historico, entry]
  }

  if (newStatus === 'Com pendência') {
    const entry = makeHistoryEntry('bm_ativa', 'BM ativa com pendência')
    updates.statusGeral = 'Cliente com pendência'
    updates.pendencia = 'BM ativa com pendência — verificar e resolver'
    updates.historico = [...client.historico, entry]
  }

  // Qualquer mudança para status de progresso limpa pendência anterior
  if (['Criando', 'Dados preenchidos', 'Site/domínio pendente', 'Não iniciada'].includes(newStatus)) {
    updates.pendencia = ''
  }

  return updates
}

export function applyNumeroAtivoAutomation(
  client: Client,
  pronto: boolean,
): Partial<Client> {
  if (!pronto) return {}

  const entry = makeHistoryEntry('numero_ativo', 'Número ativo ativado e pronto')
  const updates: Partial<Client> = {
    statusAtivo: 'Pronto',
    pendencia: '',
    historico: [...client.historico, entry],
    atualizadoEm: new Date().toISOString(),
  }

  if (client.dataCrazy.status === 'Pronto' || client.dataCrazy.status === 'Configurado') {
    updates.statusGeral = 'Cliente pronto'
    updates.proximaAcao = ''
  } else {
    updates.statusGeral = 'Configurando DataCrazy'
    updates.proximaAcao = 'Configurar DataCrazy e automações'
  }

  return updates
}
