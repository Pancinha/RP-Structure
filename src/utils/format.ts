import { format, formatDistanceToNow, isPast, isToday } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { Prioridade, StatusGeral, StatusBM, StatusNumero, StatusDataCrazy, StatusAutomacao } from '../types'

export function formatDate(iso: string): string {
  if (!iso) return '—'
  try {
    return format(new Date(iso), 'dd/MM/yyyy HH:mm', { locale: ptBR })
  } catch {
    return '—'
  }
}

export function formatDateShort(iso: string): string {
  if (!iso) return '—'
  try {
    // Date-only strings (YYYY-MM-DD, from <input type="date">) must be parsed as
    // local time, not UTC — otherwise `new Date(iso)` shifts the displayed date
    // back a day in timezones behind UTC (e.g. Brazil).
    const dateOnlyMatch = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/)
    const date = dateOnlyMatch
      ? new Date(Number(dateOnlyMatch[1]), Number(dateOnlyMatch[2]) - 1, Number(dateOnlyMatch[3]))
      : new Date(iso)
    return format(date, 'dd/MM/yyyy', { locale: ptBR })
  } catch {
    return '—'
  }
}

export function formatRelative(iso: string): string {
  if (!iso) return '—'
  try {
    return formatDistanceToNow(new Date(iso), { addSuffix: true, locale: ptBR })
  } catch {
    return '—'
  }
}

export function isOverdue(iso: string): boolean {
  if (!iso) return false
  try {
    return isPast(new Date(iso))
  } catch {
    return false
  }
}

export function isDueToday(iso: string): boolean {
  if (!iso) return false
  try {
    return isToday(new Date(iso))
  } catch {
    return false
  }
}

export function add24h(from?: Date): string {
  const base = from ?? new Date()
  return new Date(base.getTime() + 24 * 3600000).toISOString()
}

export function priorityColor(p: Prioridade): string {
  switch (p) {
    case 'Urgente': return 'bg-red-100 text-red-800 border-red-200'
    case 'Alta': return 'bg-orange-100 text-orange-800 border-orange-200'
    case 'Média': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    case 'Baixa': return 'bg-gray-100 text-gray-700 border-gray-200'
  }
}

export function statusGeralColor(s: StatusGeral): string {
  if (s === 'Cliente pronto') return 'bg-green-100 text-green-800 border-green-200'
  if (s === 'Cliente cancelado') return 'bg-red-100 text-red-800 border-red-200'
  if (s === 'Cliente com pendência') return 'bg-red-100 text-red-700 border-red-200'
  if (s === 'Cliente pausado') return 'bg-gray-100 text-gray-600 border-gray-200'
  if (s.includes('análise') || s.includes('Aguardando')) return 'bg-yellow-100 text-yellow-800 border-yellow-200'
  if (s.includes('pronto') || s.includes('aprovada') || s.includes('Aprovada')) return 'bg-green-100 text-green-800 border-green-200'
  return 'bg-blue-100 text-blue-800 border-blue-200'
}

export function statusBMColor(s: StatusBM): string {
  switch (s) {
    case 'Aprovada': return 'bg-green-100 text-green-800 border-green-200'
    case 'Em análise': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    case 'Verificação enviada': return 'bg-blue-100 text-blue-800 border-blue-200'
    case 'Recusada': return 'bg-red-100 text-red-800 border-red-200'
    case 'Com pendência': return 'bg-orange-100 text-orange-800 border-orange-200'
    case 'Não iniciada': return 'bg-gray-100 text-gray-600 border-gray-200'
    default: return 'bg-blue-100 text-blue-800 border-blue-200'
  }
}

export function statusNumeroColor(s: StatusNumero): string {
  switch (s) {
    case 'Pronto': return 'bg-green-100 text-green-800 border-green-200'
    case 'Com erro': return 'bg-red-100 text-red-800 border-red-200'
    case 'Com pendência': return 'bg-orange-100 text-orange-800 border-orange-200'
    case 'Não iniciado': return 'bg-gray-100 text-gray-600 border-gray-200'
    default: return 'bg-blue-100 text-blue-800 border-blue-200'
  }
}

export function statusDataCrazyColor(s: StatusDataCrazy): string {
  switch (s) {
    case 'Pronto': return 'bg-green-100 text-green-800 border-green-200'
    case 'Com erro': return 'bg-red-100 text-red-800 border-red-200'
    case 'Não iniciado': return 'bg-gray-100 text-gray-600 border-gray-200'
    default: return 'bg-blue-100 text-blue-800 border-blue-200'
  }
}

export function statusAutomacaoColor(s: StatusAutomacao): string {
  switch (s) {
    case 'Ativa': return 'bg-green-100 text-green-800 border-green-200'
    case 'Com erro': return 'bg-red-100 text-red-800 border-red-200'
    case 'Pausada': return 'bg-gray-100 text-gray-600 border-gray-200'
    case 'Não iniciada': return 'bg-gray-100 text-gray-600 border-gray-200'
    case 'Testada': return 'bg-green-100 text-green-700 border-green-200'
    default: return 'bg-blue-100 text-blue-800 border-blue-200'
  }
}

const PROGRESS_ORDER: Record<string, number> = {
  'Aguardando dados/acesso': 0,
  'Aguardando código Facebook': 1,
  'Primeiro acesso realizado': 2,
  'Aguardando 24h': 3,
  'Criando BM receptiva': 4,
  'BM receptiva em análise': 5,
  'BM receptiva aprovada': 6,
  'Configurando número receptivo': 7,
  'Receptivo pronto': 8,
  'Criando BM ativa': 9,
  'BM ativa em análise': 10,
  'BM ativa aprovada': 11,
  'Configurando número ativo': 12,
  'Configurando DataCrazy': 13,
  'Configurando automações': 14,
  'Cliente pronto': 15,
  'Cliente com pendência': -1,
  'Cliente pausado': -2,
  'Cliente cancelado': -3,
}

export function progressScore(statusGeral: string): number {
  return PROGRESS_ORDER[statusGeral] ?? 0
}

export function tipoHistoricoLabel(tipo: string): string {
  const map: Record<string, string> = {
    cadastro: 'Cadastro',
    facebook: 'Facebook',
    bm_receptiva: 'BM Receptiva',
    numero_receptivo: 'Número Receptivo',
    bm_ativa: 'BM Ativa',
    numero_ativo: 'Número Ativo',
    datacrazy: 'DataCrazy',
    automacao: 'Automação',
    status: 'Status',
    manual: 'Manual',
  }
  return map[tipo] ?? tipo
}
