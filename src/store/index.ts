import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import type {
  Client,
  FacebookData,
  BMData,
  NumberData,
  DataCrazyData,
  Automation,
  HistoryEntry,
  StatusReceptivo,
  StatusAtivo,
  StatusNumero,
  StatusDataCrazy,
} from '../types'
import {
  DEFAULT_FACEBOOK,
  DEFAULT_BM,
  DEFAULT_NUMBER,
  DEFAULT_DATACRAZY,
} from '../types'
import { makeHistoryEntry } from '../utils/automation'

function deriveStatusFromNumber(statusFinal: StatusNumero): StatusReceptivo {
  switch (statusFinal) {
    case 'Não iniciado': return 'Não iniciado'
    case 'Pronto': return 'Pronto'
    case 'Com erro':
    case 'Com pendência': return 'Com pendência'
    default: return 'Em configuração'
  }
}

// Upsert a single client to Supabase (fire-and-forget)
function syncClient(client: Client) {
  supabase
    .from('clients')
    .upsert({ id: client.id, data: client, updated_at: new Date().toISOString() })
    .then()
}

interface StoreState {
  clients: Client[]
  loading: boolean
  loadClients: () => Promise<void>
  setClients: (clients: Client[]) => void
  addClient: (data: Omit<Client, 'id' | 'facebook' | 'bmReceptiva' | 'numeroReceptivo' | 'bmAtiva' | 'numeroAtivo' | 'dataCrazy' | 'historico' | 'criadoEm' | 'atualizadoEm'>) => void
  updateClient: (id: string, partial: Partial<Client>) => void
  deleteClient: (id: string) => void
  updateFacebook: (clientId: string, data: Partial<FacebookData>, autoUpdates?: Partial<Client>) => void
  updateBMReceptiva: (clientId: string, data: Partial<BMData>, autoUpdates?: Partial<Client>) => void
  updateNumeroReceptivo: (clientId: string, data: Partial<NumberData>, autoUpdates?: Partial<Client>) => void
  updateBMAtiva: (clientId: string, data: Partial<BMData>, autoUpdates?: Partial<Client>) => void
  updateNumeroAtivo: (clientId: string, data: Partial<NumberData>, autoUpdates?: Partial<Client>) => void
  updateDataCrazy: (clientId: string, data: Partial<DataCrazyData>, autoUpdates?: Partial<Client>) => void
  addHistory: (clientId: string, entry: HistoryEntry) => void
  addAutomation: (clientId: string, automation: Automation) => void
  updateAutomation: (clientId: string, automationId: string, data: Partial<Automation>) => void
  deleteAutomation: (clientId: string, automationId: string) => void
}

export const useStore = create<StoreState>()((set, get) => ({
  clients: [],
  loading: true,

  loadClients: async () => {
    set({ loading: true })
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('data')
        .order('created_at', { ascending: true })

      if (error) throw error

      const clients = (data ?? []).map((row) => {
        const c = row.data as Client
        return {
          ...c,
          statusReceptivo: deriveStatusFromNumber(
            c.numeroReceptivo?.statusFinal ?? 'Não iniciado'
          ) as StatusReceptivo,
          statusAtivo: deriveStatusFromNumber(
            c.numeroAtivo?.statusFinal ?? 'Não iniciado'
          ) as StatusAtivo,
          statusDataCrazy: (c.dataCrazy?.status ?? 'Não iniciado') as StatusDataCrazy,
        }
      })

      set({ clients, loading: false })
    } catch {
      set({ loading: false })
    }
  },

  // Used by import — replaces all clients
  setClients: (clients) => {
    const toDelete = get().clients.map((c) => c.id).filter((id) => !clients.find((c) => c.id === id))
    set({ clients })
    ;(async () => {
      if (clients.length > 0) {
        await supabase
          .from('clients')
          .upsert(clients.map((c) => ({ id: c.id, data: c, updated_at: new Date().toISOString() })))
      }
      if (toDelete.length > 0) {
        await supabase.from('clients').delete().in('id', toDelete)
      }
    })()
  },

  addClient: (data) => {
    const now = new Date().toISOString()
    const newClient: Client = {
      ...data,
      id: `client-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      facebook: { ...DEFAULT_FACEBOOK },
      bmReceptiva: { ...DEFAULT_BM, checklist: { ...DEFAULT_BM.checklist } },
      numeroReceptivo: { ...DEFAULT_NUMBER, ddd: data.ddd, checklist: { ...DEFAULT_NUMBER.checklist } },
      bmAtiva: { ...DEFAULT_BM, checklist: { ...DEFAULT_BM.checklist } },
      numeroAtivo: { ...DEFAULT_NUMBER, ddd: data.ddd, checklist: { ...DEFAULT_NUMBER.checklist } },
      dataCrazy: { ...DEFAULT_DATACRAZY },
      historico: [makeHistoryEntry('cadastro', 'Cliente cadastrado no sistema')],
      criadoEm: now,
      atualizadoEm: now,
    }
    set((s) => ({ clients: [...s.clients, newClient] }))
    supabase
      .from('clients')
      .insert({ id: newClient.id, data: newClient, created_at: now, updated_at: now })
      .then()
  },

  updateClient: (id, partial) => {
    set((s) => ({
      clients: s.clients.map((c) =>
        c.id === id ? { ...c, ...partial, atualizadoEm: new Date().toISOString() } : c
      ),
    }))
    const updated = get().clients.find((c) => c.id === id)
    if (updated) syncClient(updated)
  },

  deleteClient: (id) => {
    set((s) => ({ clients: s.clients.filter((c) => c.id !== id) }))
    supabase.from('clients').delete().eq('id', id).then()
  },

  updateFacebook: (clientId, data, autoUpdates) => {
    set((s) => ({
      clients: s.clients.map((c) => {
        if (c.id !== clientId) return c
        const updated = { ...c, facebook: { ...c.facebook, ...data }, atualizadoEm: new Date().toISOString() }
        return autoUpdates ? { ...updated, ...autoUpdates } : updated
      }),
    }))
    const updated = get().clients.find((c) => c.id === clientId)
    if (updated) syncClient(updated)
  },

  updateBMReceptiva: (clientId, data, autoUpdates) => {
    set((s) => ({
      clients: s.clients.map((c) => {
        if (c.id !== clientId) return c
        const updated = {
          ...c,
          bmReceptiva: {
            ...c.bmReceptiva,
            ...data,
            checklist: data.checklist ? { ...c.bmReceptiva.checklist, ...data.checklist } : c.bmReceptiva.checklist,
          },
          atualizadoEm: new Date().toISOString(),
        }
        return autoUpdates ? { ...updated, ...autoUpdates } : updated
      }),
    }))
    const updated = get().clients.find((c) => c.id === clientId)
    if (updated) syncClient(updated)
  },

  updateNumeroReceptivo: (clientId, data, autoUpdates) => {
    set((s) => ({
      clients: s.clients.map((c) => {
        if (c.id !== clientId) return c
        const newNumero = {
          ...c.numeroReceptivo,
          ...data,
          checklist: data.checklist ? { ...c.numeroReceptivo.checklist, ...data.checklist } : c.numeroReceptivo.checklist,
        }
        const derivedStatus = deriveStatusFromNumber(newNumero.statusFinal) as StatusReceptivo
        const updated = {
          ...c,
          numeroReceptivo: newNumero,
          statusReceptivo: derivedStatus,
          atualizadoEm: new Date().toISOString(),
        }
        return autoUpdates ? { ...updated, ...autoUpdates } : updated
      }),
    }))
    const updated = get().clients.find((c) => c.id === clientId)
    if (updated) syncClient(updated)
  },

  updateBMAtiva: (clientId, data, autoUpdates) => {
    set((s) => ({
      clients: s.clients.map((c) => {
        if (c.id !== clientId) return c
        const updated = {
          ...c,
          bmAtiva: {
            ...c.bmAtiva,
            ...data,
            checklist: data.checklist ? { ...c.bmAtiva.checklist, ...data.checklist } : c.bmAtiva.checklist,
          },
          atualizadoEm: new Date().toISOString(),
        }
        return autoUpdates ? { ...updated, ...autoUpdates } : updated
      }),
    }))
    const updated = get().clients.find((c) => c.id === clientId)
    if (updated) syncClient(updated)
  },

  updateNumeroAtivo: (clientId, data, autoUpdates) => {
    set((s) => ({
      clients: s.clients.map((c) => {
        if (c.id !== clientId) return c
        const newNumero = {
          ...c.numeroAtivo,
          ...data,
          checklist: data.checklist ? { ...c.numeroAtivo.checklist, ...data.checklist } : c.numeroAtivo.checklist,
        }
        const derivedStatus = deriveStatusFromNumber(newNumero.statusFinal) as StatusAtivo
        const updated = {
          ...c,
          numeroAtivo: newNumero,
          statusAtivo: derivedStatus,
          atualizadoEm: new Date().toISOString(),
        }
        return autoUpdates ? { ...updated, ...autoUpdates } : updated
      }),
    }))
    const updated = get().clients.find((c) => c.id === clientId)
    if (updated) syncClient(updated)
  },

  updateDataCrazy: (clientId, data, autoUpdates) => {
    set((s) => ({
      clients: s.clients.map((c) => {
        if (c.id !== clientId) return c
        const newDC = { ...c.dataCrazy, ...data }
        const updated = {
          ...c,
          dataCrazy: newDC,
          statusDataCrazy: newDC.status as StatusDataCrazy,
          atualizadoEm: new Date().toISOString(),
        }
        return autoUpdates ? { ...updated, ...autoUpdates } : updated
      }),
    }))
    const updated = get().clients.find((c) => c.id === clientId)
    if (updated) syncClient(updated)
  },

  addHistory: (clientId, entry) => {
    set((s) => ({
      clients: s.clients.map((c) =>
        c.id === clientId
          ? { ...c, historico: [...c.historico, entry], atualizadoEm: new Date().toISOString() }
          : c
      ),
    }))
    const updated = get().clients.find((c) => c.id === clientId)
    if (updated) syncClient(updated)
  },

  addAutomation: (clientId, automation) => {
    set((s) => ({
      clients: s.clients.map((c) => {
        if (c.id !== clientId) return c
        return {
          ...c,
          dataCrazy: { ...c.dataCrazy, automacoes: [...c.dataCrazy.automacoes, automation] },
          atualizadoEm: new Date().toISOString(),
        }
      }),
    }))
    const updated = get().clients.find((c) => c.id === clientId)
    if (updated) syncClient(updated)
  },

  updateAutomation: (clientId, automationId, data) => {
    set((s) => ({
      clients: s.clients.map((c) => {
        if (c.id !== clientId) return c
        return {
          ...c,
          dataCrazy: {
            ...c.dataCrazy,
            automacoes: c.dataCrazy.automacoes.map((a) =>
              a.id === automationId ? { ...a, ...data } : a
            ),
          },
          atualizadoEm: new Date().toISOString(),
        }
      }),
    }))
    const updated = get().clients.find((c) => c.id === clientId)
    if (updated) syncClient(updated)
  },

  deleteAutomation: (clientId, automationId) => {
    set((s) => ({
      clients: s.clients.map((c) => {
        if (c.id !== clientId) return c
        return {
          ...c,
          dataCrazy: {
            ...c.dataCrazy,
            automacoes: c.dataCrazy.automacoes.filter((a) => a.id !== automationId),
          },
          atualizadoEm: new Date().toISOString(),
        }
      }),
    }))
    const updated = get().clients.find((c) => c.id === clientId)
    if (updated) syncClient(updated)
  },
}))
