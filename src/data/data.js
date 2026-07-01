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
  { id: 'mod7', name: 'API Oficial' },
];

export const initialAvailableOffers = [
  { id: 'off1', name: 'IA Conversacional' },
  { id: 'off2', name: 'Relatórios Avançados' },
  { id: 'off3', name: 'API Oficial' },
  { id: 'off4', name: 'Suporte Prioritário 24h' },
  { id: 'off5', name: 'Integração ERP' },
  { id: 'off6', name: 'White Label' },
  { id: 'off7', name: 'Multi-atendentes' },
];

export const initialStages = ['Novo', 'Kickoff', 'Configuração', 'Treinamento', 'Finalizado'];

// Checklists templates per module
export const moduleChecklistsTemplate = {
  'WhatsApp Business': [
    { label: 'Aprovação do número BSP', checked: true },
    { label: 'Configuração de perfil comercial', checked: true },
    { label: 'Disparo de teste de homologação', checked: false }
  ],
  'CRM Integrado': [
    { label: 'Mapeamento de campos personalizados', checked: true },
    { label: 'Integração de webhooks no CRM', checked: false },
    { label: 'Teste de sincronização de leads', checked: false }
  ],
  'Automação de Fluxos': [
    { label: 'Definição de regras de automação', checked: false },
    { label: 'Configuração de mensagens automáticas', checked: false },
    { label: 'Teste de gatilhos operacionais', checked: false }
  ],
  'IA Conversacional': [
    { label: 'Definição do Prompt de sistema', checked: false },
    { label: 'Configuração de base de conhecimento', checked: false },
    { label: 'Homologação de respostas da IA', checked: false }
  ],
  'Relatórios Avançados': [
    { label: 'Criação de dashboards customizados', checked: false },
    { label: 'Configuração de relatórios automáticos', checked: false }
  ],
  'Chatbot Builder': [
    { label: 'Desenho da árvore de decisão', checked: true },
    { label: 'Configuração de opções de menu', checked: false },
    { label: 'Teste de transbordo humano', checked: false }
  ],
  'API Oficial': [
    { label: 'Configuração do WABA', checked: true },
    { label: 'Verificação da conta Meta Business', checked: true },
    { label: 'Configuração de webhook oficial', checked: false }
  ]
};

// Today in system = 30/06/2026
export const initialClients = [
  {
    id: 'c1',
    name: 'TechCorp Soluções',
    phone: '(11) 99823-0041',
    whatsapp: '(11) 99823-0041',
    email: 'contato@techcorp.com.br',
    cnpj: '12.345.678/0001-90',
    entryDate: '01/05/2026',
    responsible: 'Gabriel Almeida',
    plan: 'Pro',
    activeModules: ['WhatsApp Business', 'CRM Integrado', 'Automação de Fluxos'],
    criticality: 'Crítico',
    criticalityJustification: 'SLA comprometido há 2 semanas. Integração com CRM apresentando falhas recorrentes no envio de mensagens.',
    observations: 'Cliente exigente. Prefere reuniões às terças-feiras. Tem equipe técnica interna. Solicitar acesso VPN para suporte remoto.',
    stage: 'Kickoff',
    nextAction: 'Agendar treinamento da equipe comercial',
    nextContactDate: '01/07/2026', // Critical -> 1 day from 30/06
    lastUpdated: {
      date: '30/06/2026',
      time: '17:45',
      user: 'Gabriel Almeida'
    },
    lastContacts: [
      { date: '30/06/2026', obs: 'Reunião de alinhamento com equipe de TI. Pendente liberação de portas na VPN.' },
      { date: '28/06/2026', obs: 'Contato telefônico com Marcos sobre instabilidade no webhook.' }
    ],
    activityHistory: [
      { avatar: 'GA', name: 'Gabriel Almeida', action: 'Criou o cliente no sistema', date: '30/06/2026 às 10:00', isObservation: false },
      { avatar: 'GA', name: 'Gabriel Almeida', action: 'Observação do cliente: O cliente solicitou urgência na configuração do WhatsApp.', date: '30/06/2026 às 11:30', isObservation: true },
      { avatar: 'GA', name: 'Gabriel Almeida', action: 'Marcou etapa Kickoff no Kanban', date: '30/06/2026 às 14:00', isObservation: false }
    ],
    checklists: {
      'WhatsApp Business': [
        { label: 'Aprovação do número BSP', checked: true },
        { label: 'Configuração de perfil comercial', checked: true },
        { label: 'Disparo de teste de homologação', checked: false }
      ],
      'CRM Integrado': [
        { label: 'Mapeamento de campos personalizados', checked: true },
        { label: 'Integração de webhooks no CRM', checked: false },
        { label: 'Teste de sincronização de leads', checked: false }
      ],
      'Automação de Fluxos': [
        { label: 'Definição de regras de automação', checked: false },
        { label: 'Configuração de mensagens automáticas', checked: false },
        { label: 'Teste de gatilhos operacionais', checked: false }
      ]
    },
    reminders: [
      {
        id: 'r_c1_1',
        title: 'Confirmar acesso ao painel administrativo do cliente',
        description: 'Verificar com o gerente de TI as chaves provisórias',
        deadline: '02/07/2026',
        criticality: 'Urgente'
      },
      {
        id: 'r_c1_2',
        title: 'Revisar logs de falhas no CRM',
        description: 'Análise detalhada do webhook de webhook-corp',
        deadline: '30/06/2026', // Due today
        criticality: 'Normal'
      }
    ],
    quickLinks: {
      crm: 'https://techcorp.crm-active.com/leads/1234',
      discordIntegration: 'https://discord.com/channels/techcorp/onboarding',
      discordSupport: [
        { id: 'ds_c1_1', label: 'Discord Suporte Integrações', url: 'https://discord.gg/techcorp-support' }
      ],
      site: 'https://www.techcorp.com.br',
      deskPlatformUrl: 'https://techcorp.ladesk.com',
      deskPlatformEmail: 'suporte@techcorp.com.br'
    },
    meetings: [
      { id: 'meet_c1_1', date: '30/06/2026', time: '14:00', title: 'Kickoff inicial com equipe comercial' },
      { id: 'meet_c1_2', date: '07/07/2026', time: '10:00', title: 'Revisão de configurações' },
    ],
    tasks: [
      { id: 'task_c1_1', text: 'Verificar integração do CRM com WhatsApp', deadline: '01/07/2026' },
      { id: 'task_c1_2', text: 'Enviar documentação técnica do módulo de automação', deadline: '03/07/2026' },
    ],
    interestOffers: [
      { id: 'io_c1_1', name: 'IA Conversacional', status: 'Interessado' },
      { id: 'io_c1_2', name: 'Relatórios Avançados', status: 'Em análise' },
    ],
  },
  {
    id: 'c2',
    name: 'Grupo Nexus Varejo',
    phone: '(21) 3022-1100',
    whatsapp: '(21) 99100-4455',
    email: 'ti@nexusvarejo.com.br',
    cnpj: '98.765.432/0001-11',
    entryDate: '20/05/2026',
    responsible: 'Gabriel Almeida',
    plan: 'Enterprise',
    activeModules: ['WhatsApp Business', 'CRM Integrado', 'Chatbot Builder', 'Relatórios Avançados', 'API Oficial'],
    criticality: 'Atenção',
    criticalityJustification: 'Treinamento da equipe atrasado. Cliente solicitou adiamento por 10 dias por demanda interna.',
    observations: 'Grande empresa de varejo. Contato principal: Fernanda Souza (TI). Reuniões preferencialmente por Google Meet.',
    stage: 'Treinamento',
    nextAction: 'Realizar treinamento da equipe de vendas (25 pessoas)',
    nextContactDate: '02/07/2026', // Atenção -> 2 days from 30/06
    lastUpdated: {
      date: '30/06/2026',
      time: '16:00',
      user: 'Gabriel Almeida'
    },
    lastContacts: [
      { date: '29/06/2026', obs: 'Fernanda solicitou adiamento do treinamento para o dia 05/07.' }
    ],
    activityHistory: [
      { avatar: 'GA', name: 'Gabriel Almeida', action: 'Adicionou o cliente Nexus', date: '20/05/2026 às 09:00', isObservation: false },
      { avatar: 'GA', name: 'Gabriel Almeida', action: 'Observação do cliente: O cliente solicitou material em PDF sobre Chatbots.', date: '29/06/2026 às 15:30', isObservation: true }
    ],
    checklists: {
      'WhatsApp Business': [
        { label: 'Aprovação do número BSP', checked: true },
        { label: 'Configuração de perfil comercial', checked: true },
        { label: 'Disparo de teste de homologação', checked: true }
      ],
      'CRM Integrado': [
        { label: 'Mapeamento de campos personalizados', checked: true },
        { label: 'Integração de webhooks no CRM', checked: true },
        { label: 'Teste de sincronização de leads', checked: false }
      ],
      'Chatbot Builder': [
        { label: 'Desenho da árvore de decisão', checked: true },
        { label: 'Configuração de opções de menu', checked: false },
        { label: 'Teste de transbordo humano', checked: false }
      ],
      'Relatórios Avançados': [
        { label: 'Criação de dashboards customizados', checked: false },
        { label: 'Configuração de relatórios automáticos', checked: false }
      ],
      'API Oficial': [
        { label: 'Configuração do WABA', checked: true },
        { label: 'Verificação da conta Meta Business', checked: true },
        { label: 'Configuração de webhook oficial', checked: false }
      ]
    },
    reminders: [
      {
        id: 'r_c2_1',
        title: 'Enviar material de treinamento do Chatbot Builder',
        description: 'PDFs e guias práticos do módulo',
        deadline: '05/07/2026',
        criticality: 'Normal'
      },
      {
        id: 'r_c2_2',
        title: 'Corrigir permissões dos atendentes',
        description: 'Liberar acesso ao dashboard principal',
        deadline: '29/06/2026', // Overdue
        criticality: 'Urgente'
      }
    ],
    quickLinks: {
      crm: 'https://nexus.crm-active.com/leads/99',
      discordIntegration: 'https://discord.com/channels/nexus/dev-channel',
      discordSupport: [
        { id: 'ds_c2_1', label: 'Discord Suporte Nexus Geral', url: 'https://discord.gg/nexus-general' },
        { id: 'ds_c2_2', label: 'Discord Suporte Nexus Urgente', url: 'https://discord.gg/nexus-critical' }
      ],
      site: 'https://www.nexusvarejo.com.br',
      deskPlatformUrl: 'https://nexus.zendesk.com',
      deskPlatformEmail: 'ti@nexusvarejo.com.br'
    },
    meetings: [
      { id: 'meet_c2_1', date: '30/06/2026', time: '09:30', title: 'Acompanhamento de treinamento — parte 1' },
    ],
    tasks: [
      { id: 'task_c2_1', text: 'Preparar slides do treinamento de Chatbot', deadline: '04/07/2026' },
      { id: 'task_c2_2', text: 'Configurar perfis de acesso para 25 usuários', deadline: '06/07/2026' },
    ],
    interestOffers: [
      { id: 'io_c2_1', name: 'API Oficial', status: 'Convertido' },
      { id: 'io_c2_2', name: 'Integração ERP', status: 'Interessado' },
      { id: 'io_c2_3', name: 'White Label', status: 'Convertido' },
    ],
  },
  {
    id: 'c3',
    name: 'Saúde Digital Clínicas',
    phone: '(31) 2100-9090',
    whatsapp: '(31) 98877-2233',
    email: 'implantacao@saudedigital.med.br',
    cnpj: '45.678.901/0001-22',
    entryDate: '10/06/2026',
    responsible: 'Gabriel Almeida',
    plan: 'Saúde',
    activeModules: ['WhatsApp Business', 'Automação de Fluxos'],
    criticality: 'Estável',
    criticalityJustification: 'Implantação dentro do prazo. Cliente satisfeito com o andamento.',
    observations: 'Clínica médica com 3 unidades. Muito satisfeitos com o processo. Candidatos a upsell para plano Pro.',
    stage: 'Configuração',
    nextAction: 'Finalizar configuração dos fluxos de automação de agendamento',
    nextContactDate: '03/07/2026', // Estável -> 3 days from 30/06
    lastUpdated: {
      date: '28/06/2026',
      time: '11:00',
      user: 'Gabriel Almeida'
    },
    lastContacts: [
      { date: '28/06/2026', obs: 'Validação técnica concluída com sucesso nas automações.' }
    ],
    activityHistory: [
      { avatar: 'GA', name: 'Gabriel Almeida', action: 'Cadastrou clínica no sistema', date: '10/06/2026 às 11:00', isObservation: false }
    ],
    checklists: {
      'WhatsApp Business': [
        { label: 'Aprovação do número BSP', checked: true },
        { label: 'Configuração de perfil comercial', checked: true },
        { label: 'Disparo de teste de homologação', checked: false }
      ],
      'Automação de Fluxos': [
        { label: 'Definição de regras de automação', checked: true },
        { label: 'Configuração de mensagens automáticas', checked: true },
        { label: 'Teste de gatilhos operacionais', checked: false }
      ]
    },
    reminders: [
      {
        id: 'r_c3_1',
        title: 'Verificar se agendamentos automáticos funcionam',
        description: 'Fazer teste com número de teste Saúde1',
        deadline: '08/07/2026',
        criticality: 'Baixo'
      }
    ],
    quickLinks: {
      crm: '',
      discordIntegration: '',
      discordSupport: [],
      site: '',
      deskPlatformUrl: '',
      deskPlatformEmail: ''
    },
    meetings: [
      { id: 'meet_c3_1', date: '01/07/2026', time: '15:00', title: 'Review das automações de agendamento' },
    ],
    tasks: [
      { id: 'task_c3_1', text: 'Configurar fluxo de agendamento para 3 unidades', deadline: '07/07/2026' },
    ],
    interestOffers: [
      { id: 'io_c3_1', name: 'Multi-atendentes', status: 'Interessado' },
    ],
  },
  {
    id: 'c4',
    name: 'Saúde Fácil Lab',
    phone: '(11) 98111-2222',
    whatsapp: '(11) 98111-2222',
    email: 'diretoria@saudefacil.com.br',
    cnpj: '11.222.333/0001-44',
    entryDate: '15/06/2026',
    responsible: 'Gabriel Almeida',
    plan: 'Saúde',
    activeModules: ['WhatsApp Business', 'IA Conversacional'],
    criticality: 'Estável',
    criticalityJustification: 'Onboarding sob controle.',
    observations: 'Laboratório de análises clínicas.',
    stage: 'Novo',
    nextAction: 'Coleta de dados da API legada',
    nextContactDate: '03/07/2026',
    lastUpdated: {
      date: '15/06/2026',
      time: '14:20',
      user: 'Gabriel Almeida'
    },
    lastContacts: [
      { date: '15/06/2026', obs: 'Cliente integrado, aguardando documentação da API legada.' }
    ],
    activityHistory: [
      { avatar: 'GA', name: 'Gabriel Almeida', action: 'Importou dados Saúde Fácil', date: '15/06/2026 às 14:20', isObservation: false }
    ],
    checklists: {
      'WhatsApp Business': [
        { label: 'Aprovação do número BSP', checked: false },
        { label: 'Configuração de perfil comercial', checked: false },
        { label: 'Disparo de teste de homologação', checked: false }
      ],
      'IA Conversacional': [
        { label: 'Definição do Prompt de sistema', checked: false },
        { label: 'Configuração de base de conhecimento', checked: false },
        { label: 'Homologação de respostas da IA', checked: false }
      ]
    },
    reminders: [],
    quickLinks: {
      crm: '',
      discordIntegration: '',
      discordSupport: [],
      site: '',
      deskPlatformUrl: '',
      deskPlatformEmail: ''
    },
    meetings: [],
    tasks: [],
    interestOffers: []
  }
];
