import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { sendLoginNotification } from '../../lib/notify'
import { Shield, Eye, EyeOff, Smartphone, Mail, AlertCircle, CheckCircle2, Copy } from 'lucide-react'

type Step = 'credentials' | 'mfa-challenge' | 'mfa-enroll' | 'mfa-enroll-verify'

interface Props {
  initialStep?: Step
  onAuthenticated: () => void
}

export function LoginPage({ initialStep = 'credentials', onAuthenticated }: Props) {
  const [step, setStep] = useState<Step>(initialStep)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const [factorId, setFactorId] = useState('')
  const [challengeId, setChallengeId] = useState('')
  const [qrCode, setQrCode] = useState('')
  const [totpSecret, setTotpSecret] = useState('')
  const [copiedSecret, setCopiedSecret] = useState(false)

  // When page loads with an existing AAL1 session, initialize the MFA challenge
  useEffect(() => {
    if (initialStep === 'mfa-challenge') {
      initExistingChallenge()
    }
  }, [])

  async function initExistingChallenge() {
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      setEmail(session?.user?.email ?? '')

      const { data: factors } = await supabase.auth.mfa.listFactors()
      const factor = factors?.totp?.find((f) => f.status === 'verified')
      if (!factor) { setStep('credentials'); return }

      setFactorId(factor.id)
      const { data: challenge, error: err } = await supabase.auth.mfa.challenge({ factorId: factor.id })
      if (err) throw err
      setChallengeId(challenge.id)
    } catch {
      setError('Erro ao iniciar verificação. Faça login novamente.')
      setStep('credentials')
    } finally {
      setLoading(false)
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
      if (signInError) throw signInError

      const { data: factors } = await supabase.auth.mfa.listFactors()
      const verifiedFactor = factors?.totp?.find((f) => f.status === 'verified')

      if (verifiedFactor) {
        setFactorId(verifiedFactor.id)
        const { data: challenge, error: err } = await supabase.auth.mfa.challenge({ factorId: verifiedFactor.id })
        if (err) throw err
        setChallengeId(challenge.id)
        setStep('mfa-challenge')
      } else {
        // Unenroll any stale unverified factor before enrolling fresh
        const unverified = factors?.all?.find((f) => f.factor_type === 'totp' && f.status === 'unverified')
        if (unverified) await supabase.auth.mfa.unenroll({ factorId: unverified.id })

        const { data: enroll, error: enrollErr } = await supabase.auth.mfa.enroll({
          factorType: 'totp',
          friendlyName: 'RP Structure',
          issuer: 'RP Structure',
        })
        if (enrollErr) throw enrollErr

        setFactorId(enroll.id)
        setQrCode(enroll.totp.qr_code)
        setTotpSecret(enroll.totp.secret)

        const { data: challenge, error: challengeErr } = await supabase.auth.mfa.challenge({ factorId: enroll.id })
        if (challengeErr) throw challengeErr
        setChallengeId(challenge.id)
        setStep('mfa-enroll')
      }
    } catch (err) {
      setError(translateError(err instanceof Error ? err.message : String(err)))
    } finally {
      setLoading(false)
    }
  }

  async function handleMFAVerify(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { error } = await supabase.auth.mfa.verify({ factorId, challengeId, code })
      if (error) throw error

      sendLoginNotification(email).catch(() => {})
      onAuthenticated()
    } catch (err) {
      setError(translateError(err instanceof Error ? err.message : String(err)))
      setCode('')
    } finally {
      setLoading(false)
    }
  }

  function translateError(msg: string): string {
    if (msg.includes('Invalid login credentials')) return 'Email ou senha incorretos'
    if (msg.includes('Email not confirmed')) return 'Confirme seu email antes de fazer login'
    if (msg.includes('invalid') || msg.includes('Invalid MFA') || msg.includes('TOTP')) return 'Código inválido. Verifique o autenticador e tente novamente'
    if (msg.includes('expired') || msg.includes('Expired')) return 'Código expirado. Aguarde o próximo código (30s) e tente de novo'
    if (msg.includes('Too many') || msg.includes('rate limit')) return 'Muitas tentativas. Aguarde um momento'
    return msg
  }

  async function copySecret() {
    await navigator.clipboard.writeText(totpSecret)
    setCopiedSecret(true)
    setTimeout(() => setCopiedSecret(false), 2000)
  }

  function ErrorBox({ msg }: { msg: string }) {
    return (
      <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3">
        <AlertCircle size={14} className="text-red-500 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-red-700">{msg}</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* Branding */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-sm">
            <span className="text-white text-lg font-bold">RP</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900">RP Structure</h1>
          <p className="text-sm text-gray-500">Gestão de implantações — KSJ</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">

          {/* ── Step: credentials ── */}
          {step === 'credentials' && (
            <>
              <div className="mb-5">
                <h2 className="text-base font-semibold text-gray-900">Entrar</h2>
                <p className="text-xs text-gray-500 mt-0.5">Acesso restrito — somente usuários autorizados</p>
              </div>
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
                  <div className="relative">
                    <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoFocus
                      autoComplete="email"
                      placeholder="seu@email.com"
                      className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Senha</label>
                  <div className="relative">
                    <Shield size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type={showPass ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                      placeholder="••••••••"
                      className="w-full pl-9 pr-10 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
                {error && <ErrorBox msg={error} />}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Verificando...' : 'Continuar'}
                </button>
              </form>
            </>
          )}

          {/* ── Step: mfa-challenge (factor already enrolled) ── */}
          {step === 'mfa-challenge' && (
            <>
              <div className="mb-5">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mb-3">
                  <Smartphone size={20} className="text-blue-600" />
                </div>
                <h2 className="text-base font-semibold text-gray-900">Verificação em 2 etapas</h2>
                <p className="text-xs text-gray-500 mt-0.5">Abra o Google Authenticator ou Authy e informe o código de 6 dígitos</p>
              </div>
              <form onSubmit={handleMFAVerify} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Código do autenticador</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    required
                    autoFocus
                    placeholder="000 000"
                    className="w-full px-3 py-3 text-lg text-center tracking-[0.6em] font-mono border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-400 mt-1.5 text-center">O código muda a cada 30 segundos</p>
                </div>
                {error && <ErrorBox msg={error} />}
                <button
                  type="submit"
                  disabled={loading || code.length !== 6}
                  className="w-full py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Verificando...' : 'Entrar'}
                </button>
              </form>
            </>
          )}

          {/* ── Step: mfa-enroll (show QR code) ── */}
          {step === 'mfa-enroll' && (
            <>
              <div className="mb-4">
                <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center mb-3">
                  <Smartphone size={20} className="text-amber-600" />
                </div>
                <h2 className="text-base font-semibold text-gray-900">Configurar autenticador</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Primeira vez — instale o <strong>Google Authenticator</strong> ou <strong>Authy</strong> no celular e escaneie o QR code abaixo
                </p>
              </div>

              <div className="space-y-4">
                {qrCode && (
                  <div className="flex justify-center">
                    <div className="p-3 border-2 border-gray-100 rounded-xl bg-white">
                      <img src={qrCode} alt="QR Code para autenticador" className="w-44 h-44" />
                    </div>
                  </div>
                )}

                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1.5">Não consegue escanear? Insira o código manualmente no app:</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-xs font-mono text-gray-800 bg-white border border-gray-200 rounded px-2 py-1.5 overflow-auto whitespace-nowrap">
                      {totpSecret}
                    </code>
                    <button
                      onClick={copySecret}
                      className="flex-shrink-0 p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                      title="Copiar código"
                    >
                      {copiedSecret
                        ? <CheckCircle2 size={14} className="text-green-600" />
                        : <Copy size={14} />
                      }
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => { setStep('mfa-enroll-verify'); setCode(''); setError('') }}
                  className="w-full py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Já escaniei — Continuar
                </button>
              </div>
            </>
          )}

          {/* ── Step: mfa-enroll-verify (enter first code to confirm) ── */}
          {step === 'mfa-enroll-verify' && (
            <>
              <div className="mb-5">
                <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center mb-3">
                  <CheckCircle2 size={20} className="text-green-600" />
                </div>
                <h2 className="text-base font-semibold text-gray-900">Confirmar configuração</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Informe o código de 6 dígitos que aparece no autenticador para confirmar e ativar
                </p>
              </div>
              <form onSubmit={handleMFAVerify} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Código do autenticador</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    required
                    autoFocus
                    placeholder="000 000"
                    className="w-full px-3 py-3 text-lg text-center tracking-[0.6em] font-mono border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                {error && <ErrorBox msg={error} />}
                <button
                  type="submit"
                  disabled={loading || code.length !== 6}
                  className="w-full py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Ativando...' : 'Ativar e entrar'}
                </button>
                <button
                  type="button"
                  onClick={() => { setStep('mfa-enroll'); setError('') }}
                  className="w-full py-2 text-xs text-gray-400 hover:text-gray-600 transition-colors"
                >
                  Voltar para o QR code
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Área restrita — KSJ &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  )
}
