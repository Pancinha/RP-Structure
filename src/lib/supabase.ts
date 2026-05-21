import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? ''

if (!supabaseUrl.startsWith('http')) {
  throw new Error(
    `VITE_SUPABASE_URL não configurada no ambiente de build.\n` +
    `Valor recebido: "${supabaseUrl}"\n` +
    `Configure a variável no Railway e faça redeploy.`
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
