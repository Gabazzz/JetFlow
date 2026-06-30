// ============================================================
// JetFlow — Mock Data (all local state, no backend)
// ============================================================

export const initialProfile = {
  name: 'Gabriel Almeida',
  role: 'Especialista de Implantação',
  avatarInitials: 'GA',
};

export const initialPlans = [
  { id: 'plan1', name: 'Starter' },
  { id: 'plan2', name: 'Pro' },
  { id: 'plan3', name: 'Enterprise' },
  { id: 'plan4', name: 'Básico' },
];

export const initialModules = [
  { id: 'mod1', name: 'WhatsApp Business' },
  { id: 'mod2', name: 'CRM Integrado' },
  { id: 'mod3', name: 'Automação de Fluxos' },
  { id: 'mod4', name: 'IA Conversacional' },
  { id: 'mod5', name: 'Relatórios Avançados' },
  { id: 'mod6', name: 'Chatbot Builder' },
  { id: 'mod7', name: 'API Premium' },
];

export const initialAvailableOffers = [
  { id: 'off1', name: 'IA Conversacional' },
  { id: 'off2', name: 'Relatórios Avançados' },
  { id: 'off3', name: 'API Premium' },
  { id: 'off4', name: 'Suporte Prioritário 24h' },
  { id: 'off5', name: 'Integração ERP' },
  { id: 'off6', name: 'White Label' },
  { id: 'off7', name: 'Multi-atendentes' },
];

// Today for mock = 2026-06-30
export const initialClients = [
  {
    id: 'c1',
    name: 'TechCorp Soluções',
    phone: '(11) 99823-0041',
    whatsapp: '(11) 99823-0041',
    email: 'contato@techcorp.com.br',
    cnpj: '12.345.678/0001-90',
    entryDate: '2026-05-01',
    responsible: 'Gabriel Almeida',
    plan: 'Pro',
    activeModules: ['WhatsApp Business', 'CRM Integrado', 'Automação de Fluxos'],
    criticality: 'Crítico',
    criticalityJustification: 'SLA comprometido há 2 semanas. Integração com CRM apresentando falhas recorrentes no envio de mensagens.',
    observations: 'Cliente exigente. Prefere reuniões às terças-feiras. Tem equipe técnica interna. Solicitar acesso VPN para suporte remoto.',
    stage: 'Kickoff',
    nextAction: 'Agendar treinamento da equipe comercial',
    reminder: {
      text: 'Confirmar acesso ao painel administrativo do cliente',
      deadline: '2026-07-02',
    },
    interestOffers: [
      { id: 'io_c1_1', name: 'IA Conversacional', status: 'Interessado' },
      { id: 'io_c1_2', name: 'Relatórios Avançados', status: 'Em análise' },
    ],
    meetings: [
      { id: 'meet_c1_1', date: '2026-06-30', time: '14:00', title: 'Kickoff inicial com equipe comercial' },
      { id: 'meet_c1_2', date: '2026-07-07', time: '10:00', title: 'Revisão de configurações' },
    ],
    tasks: [
      { id: 'task_c1_1', text: 'Verificar integração do CRM com WhatsApp', deadline: '2026-07-01' },
      { id: 'task_c1_2', text: 'Enviar documentação técnica do módulo de automação', deadline: '2026-07-03' },
    ],
  },
  {
    id: 'c2',
    name: 'Grupo Nexus Varejo',
    phone: '(21) 3022-1100',
    whatsapp: '(21) 99100-4455',
    email: 'ti@nexusvarejo.com.br',
    cnpj: '98.765.432/0001-11',
    entryDate: '2026-05-20',
    responsible: 'Gabriel Almeida',
    plan: 'Enterprise',
    activeModules: ['WhatsApp Business', 'CRM Integrado', 'Chatbot Builder', 'Relatórios Avançados'],
    criticality: 'Atenção',
    criticalityJustification: 'Treinamento da equipe atrasado. Cliente solicitou adiamento por 10 dias por demanda interna.',
    observations: 'Grande empresa de varejo. Contato principal: Fernanda Souza (TI). Reuniões preferencialmente por Google Meet.',
    stage: 'Treinamento',
    nextAction: 'Realizar treinamento da equipe de vendas (25 pessoas)',
    reminder: {
      text: 'Enviar material de treinamento do Chatbot Builder antes da reunião',
      deadline: '2026-07-05',
    },
    interestOffers: [
      { id: 'io_c2_1', name: 'API Premium', status: 'Em análise' },
      { id: 'io_c2_2', name: 'Integração ERP', status: 'Interessado' },
      { id: 'io_c2_3', name: 'White Label', status: 'Convertido' },
    ],
    meetings: [
      { id: 'meet_c2_1', date: '2026-06-30', time: '09:30', title: 'Acompanhamento de treinamento — parte 1' },
    ],
    tasks: [
      { id: 'task_c2_1', text: 'Preparar slides do treinamento de Chatbot', deadline: '2026-07-04' },
      { id: 'task_c2_2', text: 'Configurar perfis de acesso para 25 usuários', deadline: '2026-07-06' },
    ],
  },
  {
    id: 'c3',
    name: 'Saúde Digital Clínicas',
    phone: '(31) 2100-9090',
    whatsapp: '(31) 98877-2233',
    email: 'implantacao@saudedigital.med.br',
    cnpj: '45.678.901/0001-22',
    entryDate: '2026-06-10',
    responsible: 'Gabriel Almeida',
    plan: 'Starter',
    activeModules: ['WhatsApp Business', 'Automação de Fluxos'],
    criticality: 'Estável',
    criticalityJustification: 'Implantação dentro do prazo. Cliente satisfeito com o andamento.',
    observations: 'Clínica médica com 3 unidades. Muito satisfeitos com o processo. Candidatos a upsell para plano Pro.',
    stage: 'Configuração',
    nextAction: 'Finalizar configuração dos fluxos de automação de agendamento',
    reminder: {
      text: 'Verificar se agendamentos automáticos estão funcionando corretamente',
      deadline: '2026-07-08',
    },
    interestOffers: [
      { id: 'io_c3_1', name: 'Multi-atendentes', status: 'Interessado' },
    ],
    meetings: [
      { id: 'meet_c3_1', date: '2026-07-01', time: '15:00', title: 'Review das automações de agendamento' },
    ],
    tasks: [
      { id: 'task_c3_1', text: 'Configurar fluxo de agendamento para 3 unidades', deadline: '2026-07-07' },
    ],
  },
  {
    id: 'c4',
    name: 'Construtora Horizonte',
    phone: '(41) 3300-7722',
    whatsapp: '(41) 99772-8800',
    email: 'projetos@horizonteconstrutora.com',
    cnpj: '33.210.987/0001-55',
    entryDate: '2026-06-20',
    responsible: 'Gabriel Almeida',
    plan: 'Pro',
    activeModules: ['WhatsApp Business', 'CRM Integrado'],
    criticality: 'Crítico',
    criticalityJustification: 'Cliente solicitou rollback de configuração que causou perda de dados de leads. Urgente.',
    observations: 'Construtora de médio porte. Trabalham com corretores externos. Processo de vendas complexo com múltiplas etapas.',
    stage: 'Configuração',
    nextAction: 'Restaurar dados de leads perdidos e revisar configuração do CRM',
    reminder: {
      text: 'URGENTE: Acompanhar restauração dos dados de leads com a equipe técnica',
      deadline: '2026-07-01',
    },
    interestOffers: [
      { id: 'io_c4_1', name: 'API Premium', status: 'Interessado' },
    ],
    meetings: [
      { id: 'meet_c4_1', date: '2026-06-30', time: '11:00', title: 'Reunião de crise — perda de dados' },
    ],
    tasks: [
      { id: 'task_c4_1', text: 'Abrir ticket de suporte para restauração de dados', deadline: '2026-06-30' },
      { id: 'task_c4_2', text: 'Revisar backup de leads com equipe técnica', deadline: '2026-07-01' },
    ],
  },
  {
    id: 'c5',
    name: 'Educação Futura EAD',
    phone: '(11) 4002-8922',
    whatsapp: '(11) 97755-3344',
    email: 'suporte@educacaofutura.com.br',
    cnpj: '77.123.456/0001-33',
    entryDate: '2026-06-01',
    responsible: 'Gabriel Almeida',
    plan: 'Enterprise',
    activeModules: ['WhatsApp Business', 'CRM Integrado', 'IA Conversacional', 'Chatbot Builder'],
    criticality: 'Estável',
    criticalityJustification: 'Implantação concluída com sucesso. Aguardando apenas homologação interna do cliente.',
    observations: 'Plataforma EAD com mais de 50.000 alunos. Equipe técnica muito capacitada. Provável renovação com upsell.',
    stage: 'Finalizado',
    nextAction: 'Acompanhar período de homologação até 15/07',
    reminder: null,
    interestOffers: [
      { id: 'io_c5_1', name: 'Suporte Prioritário 24h', status: 'Convertido' },
      { id: 'io_c5_2', name: 'White Label', status: 'Em análise' },
    ],
    meetings: [],
    tasks: [],
  },
  {
    id: 'c6',
    name: 'Logística RápidoNet',
    phone: '(51) 3300-1122',
    whatsapp: '(51) 99332-7788',
    email: 'contato@rapidonet.com.br',
    cnpj: '55.987.654/0001-44',
    entryDate: '2026-06-25',
    responsible: 'Gabriel Almeida',
    plan: 'Básico',
    activeModules: ['WhatsApp Business'],
    criticality: 'Atenção',
    criticalityJustification: 'Cliente novo com pouca familiaridade técnica. Precisa de acompanhamento mais próximo.',
    observations: 'Empresa de logística com 50 entregadores. Usarão o WhatsApp para comunicação com motoristas. Processo simples mas equipe precisará de treinamento intensivo.',
    stage: 'Novo',
    nextAction: 'Agendar reunião de kickoff com gerente operacional',
    reminder: {
      text: 'Ligar para confirmar horário do kickoff com Sr. Marcos Ribeiro',
      deadline: '2026-07-01',
    },
    interestOffers: [],
    meetings: [],
    tasks: [
      { id: 'task_c6_1', text: 'Enviar proposta de treinamento personalizada', deadline: '2026-07-02' },
    ],
  },
];
