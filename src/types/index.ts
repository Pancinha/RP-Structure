export type StatusGeral =
  | 'Aguardando dados/acesso'
  | 'Aguardando código Facebook'
  | 'Primeiro acesso realizado'
  | 'Aguardando 24h'
  | 'Criando BM receptiva'
  | 'BM receptiva em análise'
  | 'BM receptiva aprovada'
  | 'Configurando número receptivo'
  | 'Receptivo pronto'
  | 'Criando BM ativa'
  | 'BM ativa em análise'
  | 'BM ativa aprovada'
  | 'Configurando número ativo'
  | 'Configurando DataCrazy'
  | 'Configurando automações'
  | 'Cliente pronto'
  | 'Cliente com pendência'
  | 'Cliente pausado'
  | 'Cliente cancelado'

export type StatusReceptivo =
  | 'Não iniciado'
  | 'Em configuração'
  | 'Pronto'
  | 'Com pendência'

export type StatusAtivo =
  | 'Não iniciado'
  | 'Em configuração'
  | 'Pronto'
  | 'Com pendência'

export type StatusDataCrazy =
  | 'Não iniciado'
  | 'Em configuração'
  | 'Configurado'
  | 'Com erro'
  | 'Pronto'

export type Prioridade = 'Baixa' | 'Média' | 'Alta' | 'Urgente'

export type StatusBM =
  | 'Não iniciada'
  | 'Criando'
  | 'Dados preenchidos'
  | 'Site/domínio pendente'
  | 'Verificação enviada'
  | 'Em análise'
  | 'Aprovada'
  | 'Recusada'
  | 'Com pendência'

export type StatusNumero =
  | 'Não iniciado'
  | 'Aguardando número'
  | 'Número separado'
  | 'Chip ativado'
  | 'Conectando na BM'
  | 'Conectando no DataCrazy'
  | 'Em teste'
  | 'Pronto'
  | 'Com erro'
  | 'Com pendência'

export type StatusAutomacao =
  | 'Não iniciada'
  | 'Em configuração'
  | 'Configurada'
  | 'Testada'
  | 'Ativa'
  | 'Com erro'
  | 'Pausada'

export type TipoAutomacao = 'Receptiva' | 'Ativa'

export type StatusFacebook =
  | 'Pendente'
  | 'Acesso recebido'
  | 'Senha armazenada em local seguro'
  | 'Erro de acesso'

export interface BMChecklist {
  bmCriada: boolean
  dadosCNPJPreenchidos: boolean
  siteFTMCriado: boolean
  dominiComprado: boolean
  dominioVinculado: boolean
  verificacaoEnviada: boolean
  bmEmAnalise: boolean
  bmAprovada: boolean
  bmRecusada: boolean
}

export interface NumberChecklist {
  numeroSeparado: boolean
  chipAtivado: boolean
  conectadoBM: boolean
  conectadoDataCrazy: boolean
  testeRealizado: boolean
  pronto: boolean
}

export interface FacebookData {
  linkPerfil: string
  loginInformado: string
  statusAcesso: StatusFacebook
  codigoSolicitado: boolean
  codigoRecebido: boolean
  primeiroAcessoRealizado: boolean
  dataPrimeiroAcesso: string
  segundoAcessoRealizado: boolean
  dataSegundoAcesso: string
  observacoes: string
}

export type EtapaAquecimento =
  | 'não_iniciado'
  | 'template_criando'
  | 'template_aguardando'
  | 'template_aprovado'
  | 'primeiro_disparo'
  | 'aquecendo'
  | 'aquecida'

export interface BMTemplate {
  id: string
  nome: string
  dataEnvio: string
  dataAprovacao: string
  status: 'criando' | 'aguardando' | 'aprovado' | 'recusado'
  categoria: 'utility' | 'marketing' | 'authentication' | ''
  observacoes: string
}

export interface Disparo {
  id: string
  data: string
  nomeLista: string
  arquivoLista: string
  totalLeads: number
  totalRespostas: number
  qualidade: 'Boa' | 'Média' | 'Ruim' | ''
  observacoes: string
}

export interface ListaAquecimento {
  id: string
  nome: string
  arquivo: string
  urlExterno: string
  tipo: 'csv' | 'xlsx' | 'pdf' | 'outro'
  totalContatos: number
  dataAdicionada: string
  observacoes: string
}

export interface GlobalLista {
  id: string
  nome: string
  arquivo: string
  urlExterno: string
  tipo: 'csv' | 'xlsx' | 'pdf' | 'outro'
  totalContatos: number
  observacoes: string
  criadoEm: string
}

export interface DisparoAgendado {
  id: string
  dataPlanejada: string
  nomeLista: string
  listaId: string
  leadsPlanificados: number
  observacoes: string
  status: 'planejado' | 'realizado' | 'cancelado'
}

export interface AquecimentoBM {
  etapa: EtapaAquecimento
  limiteAtual: number
  dataInicio: string
  templates: BMTemplate[]
  disparos: Disparo[]
  listas: ListaAquecimento[]
  cronograma: DisparoAgendado[]
  observacoes: string
}

export interface BMData {
  nome: string
  idBM: string
  status: StatusBM
  cnpjUsado: string
  dominio: string
  siteFTMCriado: boolean
  linkSiteFTM: string
  dataCriacao: string
  dataEnvioVerificacao: string
  dataAprovacao: string
  motivoRecusa: string
  observacoes: string
  checklist: BMChecklist
  aquecimento?: AquecimentoBM
}

export interface NumberData {
  ddd: string
  numero: string
  operadora: string
  statusChip: string
  dataAtivacao: string
  conectadoBM: boolean
  conectadoDataCrazy: boolean
  podeDisparar: boolean
  testeRealizado: boolean
  statusFinal: StatusNumero
  observacoes: string
  checklist: NumberChecklist
}

export interface Automation {
  id: string
  nome: string
  tipo: TipoAutomacao
  numeroUsado: string
  status: StatusAutomacao
  dataUltimoTeste: string
  observacoes: string
}

export interface DataCrazyData {
  clienteCriado: boolean
  ambiente: string
  numeroReceptivoVinculado: string
  numeroAtivoVinculado: string
  funilConfigurado: boolean
  tagsCriadas: boolean
  automacoesReceptivasCriadas: boolean
  automacoesAtivasCriadas: boolean
  disparoConfigurado: boolean
  ultimoTeste: string
  status: StatusDataCrazy
  observacoes: string
  automacoes: Automation[]
}

export type TipoHistorico =
  | 'cadastro'
  | 'facebook'
  | 'bm_receptiva'
  | 'numero_receptivo'
  | 'bm_ativa'
  | 'numero_ativo'
  | 'datacrazy'
  | 'automacao'
  | 'status'
  | 'manual'

export interface HistoryEntry {
  id: string
  dataHora: string
  tipo: TipoHistorico
  descricao: string
  responsavel: string
  observacao: string
}

export interface Client {
  id: string
  nome: string
  nomeConhecido: string
  responsavel: string
  whatsapp: string
  email: string
  ddd: string
  cnpj: string
  razaoSocial: string
  nomeFantasia: string
  observacoesCNPJ: string
  observacoesGerais: string
  statusGeral: StatusGeral
  statusReceptivo: StatusReceptivo
  statusAtivo: StatusAtivo
  statusDataCrazy: StatusDataCrazy
  proximaAcao: string
  prazoProximaAcao: string
  prioridade: Prioridade
  pendencia: string
  facebook: FacebookData
  bmReceptiva: BMData
  numeroReceptivo: NumberData
  bmAtiva: BMData
  numeroAtivo: NumberData
  dataCrazy: DataCrazyData
  historico: HistoryEntry[]
  criadoEm: string
  atualizadoEm: string
}

export const DEFAULT_BM_CHECKLIST: BMChecklist = {
  bmCriada: false,
  dadosCNPJPreenchidos: false,
  siteFTMCriado: false,
  dominiComprado: false,
  dominioVinculado: false,
  verificacaoEnviada: false,
  bmEmAnalise: false,
  bmAprovada: false,
  bmRecusada: false,
}

export const DEFAULT_NUMBER_CHECKLIST: NumberChecklist = {
  numeroSeparado: false,
  chipAtivado: false,
  conectadoBM: false,
  conectadoDataCrazy: false,
  testeRealizado: false,
  pronto: false,
}

export const DEFAULT_FACEBOOK: FacebookData = {
  linkPerfil: '',
  loginInformado: '',
  statusAcesso: 'Pendente',
  codigoSolicitado: false,
  codigoRecebido: false,
  primeiroAcessoRealizado: false,
  dataPrimeiroAcesso: '',
  segundoAcessoRealizado: false,
  dataSegundoAcesso: '',
  observacoes: '',
}

export const DEFAULT_AQUECIMENTO: AquecimentoBM = {
  etapa: 'não_iniciado',
  limiteAtual: 250,
  dataInicio: '',
  templates: [],
  disparos: [],
  listas: [],
  cronograma: [],
  observacoes: '',
}

export const DEFAULT_BM: BMData = {
  nome: '',
  idBM: '',
  status: 'Não iniciada',
  cnpjUsado: '',
  dominio: '',
  siteFTMCriado: false,
  linkSiteFTM: '',
  dataCriacao: '',
  dataEnvioVerificacao: '',
  dataAprovacao: '',
  motivoRecusa: '',
  observacoes: '',
  checklist: { ...DEFAULT_BM_CHECKLIST },
}

export const DEFAULT_NUMBER: NumberData = {
  ddd: '',
  numero: '',
  operadora: 'Vivo',
  statusChip: '',
  dataAtivacao: '',
  conectadoBM: false,
  conectadoDataCrazy: false,
  podeDisparar: false,
  testeRealizado: false,
  statusFinal: 'Não iniciado',
  observacoes: '',
  checklist: { ...DEFAULT_NUMBER_CHECKLIST },
}

export const DEFAULT_DATACRAZY: DataCrazyData = {
  clienteCriado: false,
  ambiente: '',
  numeroReceptivoVinculado: '',
  numeroAtivoVinculado: '',
  funilConfigurado: false,
  tagsCriadas: false,
  automacoesReceptivasCriadas: false,
  automacoesAtivasCriadas: false,
  disparoConfigurado: false,
  ultimoTeste: '',
  status: 'Não iniciado',
  observacoes: '',
  automacoes: [],
}
