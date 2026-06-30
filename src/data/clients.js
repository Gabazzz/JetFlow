export const initialClients = [
  {
    id: "startuphub",
    name: "StartupHub",
    stage: "Novo",
    priority: "Alta",
    modules: ["API", "IA"],
    nextAction: "Agendar kickoff",
    deadline: "Em 3 dias",
    owner: "Felipe Torres",
    phone: "(11) 98888-1111",
    whatsapp: "(11) 98888-1111",
    email: "contato@startuphub.com.br",
    cnpj: "44.555.666/0001-22",
    plan: "SaaS Startup",
    entryDate: "22/06/2026",
    collaborator: "Felipe Torres",
    implType: "Completa",
    attentionStatus: null,
    daysWithoutUpdate: 0,
    checklists: {
      impl: [
        { id: "impl_kickoff", label: "Reunião de kickoff", checked: false },
        { id: "impl_import", label: "Importação de dados", checked: false },
        { id: "impl_config", label: "Configuração da plataforma", checked: false },
        { id: "impl_train", label: "Treinamento da equipe", checked: false },
        { id: "impl_followup", label: "Follow-up D+7", checked: false }
      ],
      api: [
        { id: "api_site", label: "Criar site", checked: false },
        { id: "api_host", label: "Contratar hospedagem", checked: false },
        { id: "api_domain", label: "Configurar domínio", checked: false },
        { id: "api_meta", label: "Criar conta Meta Business", checked: false },
        { id: "api_verify", label: "Verificação da conta", checked: false },
        { id: "api_connect", label: "Conectar API Oficial", checked: false },
        { id: "api_test", label: "Testar envio de mensagens", checked: false },
        { id: "api_validate", label: "Validar funcionamento", checked: false }
      ],
      ia: [
        { id: "ia_agent", label: "Criar agente IA", checked: false },
        { id: "ia_prompt", label: "Escrever prompt base", checked: false },
        { id: "ia_personality", label: "Configurar personalidade", checked: false },
        { id: "ia_rules", label: "Definir regras de comportamento", checked: false },
        { id: "ia_connect", label: "Conectar à plataforma", checked: false },
        { id: "ia_test", label: "Testar respostas", checked: false },
        { id: "ia_validate", label: "Validar com cliente", checked: false },
        { id: "ia_publish", label: "Publicar agente", checked: false }
      ]
    },
    logs: [
      { author: "Felipe Torres", date: "22/06", content: "Criou o cliente e atribuiu módulos API + IA" }
    ]
  },
  {
    id: "technova",
    name: "TechNova Ltda",
    stage: "Kickoff",
    priority: "Alta",
    modules: ["API", "Site"],
    nextAction: "Confirmar participantes",
    deadline: "Hoje",
    owner: "Gabriel Almeida",
    phone: "(71) 99999-1234",
    whatsapp: "(71) 99999-1234",
    email: "contato@technova.com.br",
    cnpj: "12.345.678/0001-90",
    plan: "Profissional",
    entryDate: "10/06/2025",
    collaborator: "Gabriel Almeida",
    implType: "Completa",
    attentionStatus: "Atrasado",
    daysWithoutUpdate: 5,
    attentionAction: "Ligar hoje às 15h",
    checklists: {
      impl: [
        { id: "impl_kickoff", label: "Reunião de kickoff", checked: true },
        { id: "impl_import", label: "Importação de dados", checked: true },
        { id: "impl_config", label: "Configuração da plataforma", checked: false },
        { id: "impl_train", label: "Treinamento da equipe", checked: false },
        { id: "impl_followup", label: "Follow-up D+7", checked: false }
      ],
      api: [
        { id: "api_site", label: "Criar site", checked: true },
        { id: "api_host", label: "Contratar hospedagem", checked: true },
        { id: "api_domain", label: "Configurar domínio", checked: false },
        { id: "api_meta", label: "Criar conta Meta Business", checked: false },
        { id: "api_verify", label: "Verificação da conta", checked: false },
        { id: "api_connect", label: "Conectar API Oficial", checked: false },
        { id: "api_test", label: "Testar envio de mensagens", checked: false },
        { id: "api_validate", label: "Validar funcionamento", checked: false }
      ],
      ia: [
        { id: "ia_agent", label: "Criar agente IA", checked: false },
        { id: "ia_prompt", label: "Escrever prompt base", checked: false },
        { id: "ia_personality", label: "Configurar personalidade", checked: false },
        { id: "ia_rules", label: "Definir regras de comportamento", checked: false },
        { id: "ia_connect", label: "Conectar à plataforma", checked: false },
        { id: "ia_test", label: "Testar respostas", checked: false },
        { id: "ia_validate", label: "Validar com cliente", checked: false },
        { id: "ia_publish", label: "Publicar agente", checked: false }
      ]
    },
    logs: [
      { author: "Gabriel Almeida", date: "Hoje 09:32", content: "Marcou 'Importação de dados' como concluída" },
      { author: "Carla Souza", date: "Ontem 16:14", content: "Adicionou observação: 'Cliente pediu prazo extra'" },
      { author: "Felipe Torres", date: "10/06", content: "Criou o cliente e atribuiu módulos API + IA + Site" }
    ]
  },
  {
    id: "inovavarejo",
    name: "InovaVarejo",
    stage: "Kickoff",
    priority: "Média",
    modules: ["IA"],
    nextAction: "Enviar material",
    deadline: "Em 2 dias",
    owner: "Carla Souza",
    phone: "(21) 97777-2222",
    whatsapp: "(21) 97777-2222",
    email: "suporte@inovavarejo.com",
    cnpj: "22.333.444/0001-55",
    plan: "Essencial",
    entryDate: "15/06/2026",
    collaborator: "Carla Souza",
    implType: "Rápida",
    attentionStatus: null,
    daysWithoutUpdate: 0,
    checklists: {
      impl: [
        { id: "impl_kickoff", label: "Reunião de kickoff", checked: true },
        { id: "impl_import", label: "Importação de dados", checked: false },
        { id: "impl_config", label: "Configuração da plataforma", checked: false },
        { id: "impl_train", label: "Treinamento da equipe", checked: false },
        { id: "impl_followup", label: "Follow-up D+7", checked: false }
      ],
      api: [
        { id: "api_site", label: "Criar site", checked: false },
        { id: "api_host", label: "Contratar hospedagem", checked: false },
        { id: "api_domain", label: "Configurar domínio", checked: false },
        { id: "api_meta", label: "Criar conta Meta Business", checked: false },
        { id: "api_verify", label: "Verificação da conta", checked: false },
        { id: "api_connect", label: "Conectar API Oficial", checked: false },
        { id: "api_test", label: "Testar envio de mensagens", checked: false },
        { id: "api_validate", label: "Validar funcionamento", checked: false }
      ],
      ia: [
        { id: "ia_agent", label: "Criar agente IA", checked: true },
        { id: "ia_prompt", label: "Escrever prompt base", checked: false },
        { id: "ia_personality", label: "Configurar personalidade", checked: false },
        { id: "ia_rules", label: "Definir regras de comportamento", checked: false },
        { id: "ia_connect", label: "Conectar à plataforma", checked: false },
        { id: "ia_test", label: "Testar respostas", checked: false },
        { id: "ia_validate", label: "Validar com cliente", checked: false },
        { id: "ia_publish", label: "Publicar agente", checked: false }
      ]
    },
    logs: [
      { author: "Carla Souza", date: "15/06", content: "Criou o cliente e atribuiu módulo IA" }
    ]
  },
  {
    id: "sulpharma",
    name: "SulPharma",
    stage: "Configuração",
    priority: "Média",
    modules: ["API", "IA", "Site"],
    nextAction: "Importar base de dados",
    deadline: "Em 5 dias",
    owner: "Gabriel Almeida",
    phone: "(51) 96666-3333",
    whatsapp: "(51) 96666-3333",
    email: "onboarding@sulpharma.com",
    cnpj: "33.444.555/0001-66",
    plan: "Enterprise",
    entryDate: "01/06/2026",
    collaborator: "Gabriel Almeida",
    implType: "Completa",
    attentionStatus: null,
    daysWithoutUpdate: 0,
    checklists: {
      impl: [
        { id: "impl_kickoff", label: "Reunião de kickoff", checked: true },
        { id: "impl_import", label: "Importação de dados", checked: false },
        { id: "impl_config", label: "Configuração da plataforma", checked: false },
        { id: "impl_train", label: "Treinamento da equipe", checked: false },
        { id: "impl_followup", label: "Follow-up D+7", checked: false }
      ],
      api: [
        { id: "api_site", label: "Criar site", checked: true },
        { id: "api_host", label: "Contratar hospedagem", checked: true },
        { id: "api_domain", label: "Configurar domínio", checked: false },
        { id: "api_meta", label: "Criar conta Meta Business", checked: false },
        { id: "api_verify", label: "Verificação da conta", checked: false },
        { id: "api_connect", label: "Conectar API Oficial", checked: false },
        { id: "api_test", label: "Testar envio de mensagens", checked: false },
        { id: "api_validate", label: "Validar funcionamento", checked: false }
      ],
      ia: [
        { id: "ia_agent", label: "Criar agente IA", checked: false },
        { id: "ia_prompt", label: "Escrever prompt base", checked: false },
        { id: "ia_personality", label: "Configurar personalidade", checked: false },
        { id: "ia_rules", label: "Definir regras de comportamento", checked: false },
        { id: "ia_connect", label: "Conectar à plataforma", checked: false },
        { id: "ia_test", label: "Testar respostas", checked: false },
        { id: "ia_validate", label: "Validar com cliente", checked: false },
        { id: "ia_publish", label: "Publicar agente", checked: false }
      ]
    },
    logs: [
      { author: "Gabriel Almeida", date: "01/06", content: "Iniciou a implantação do cliente e atribuiu módulos" }
    ]
  },
  {
    id: "grupoalvorada",
    name: "Grupo Alvorada",
    stage: "Configuração",
    priority: "Alta",
    modules: ["API"],
    nextAction: "Criar conta Meta Business",
    deadline: "Em 1 dia",
    owner: "Felipe Torres",
    phone: "(31) 95555-4444",
    whatsapp: "(31) 95555-4444",
    email: "diretoria@grupoalvorada.com",
    cnpj: "55.666.777/0001-88",
    plan: "Profissional",
    entryDate: "05/06/2026",
    collaborator: "Felipe Torres",
    implType: "Completa",
    attentionStatus: "Sem atualização",
    daysWithoutUpdate: 3,
    attentionAction: "Enviar checklist",
    checklists: {
      impl: [
        { id: "impl_kickoff", label: "Reunião de kickoff", checked: true },
        { id: "impl_import", label: "Importação de dados", checked: true },
        { id: "impl_config", label: "Configuração da plataforma", checked: true },
        { id: "impl_train", label: "Treinamento da equipe", checked: false },
        { id: "impl_followup", label: "Follow-up D+7", checked: false }
      ],
      api: [
        { id: "api_site", label: "Criar site", checked: true },
        { id: "api_host", label: "Contratar hospedagem", checked: true },
        { id: "api_domain", label: "Configurar domínio", checked: true },
        { id: "api_meta", label: "Criar conta Meta Business", checked: false },
        { id: "api_verify", label: "Verificação da conta", checked: false },
        { id: "api_connect", label: "Conectar API Oficial", checked: false },
        { id: "api_test", label: "Testar envio de mensagens", checked: false },
        { id: "api_validate", label: "Validar funcionamento", checked: false }
      ],
      ia: [
        { id: "ia_agent", label: "Criar agente IA", checked: false },
        { id: "ia_prompt", label: "Escrever prompt base", checked: false },
        { id: "ia_personality", label: "Configurar personalidade", checked: false },
        { id: "ia_rules", label: "Definir regras de comportamento", checked: false },
        { id: "ia_connect", label: "Conectar à plataforma", checked: false },
        { id: "ia_test", label: "Testar respostas", checked: false },
        { id: "ia_validate", label: "Validar com cliente", checked: false },
        { id: "ia_publish", label: "Publicar agente", checked: false }
      ]
    },
    logs: [
      { author: "Felipe Torres", date: "05/06", content: "Atribuído módulos para Grupo Alvorada e configurou o domínio" }
    ]
  },
  {
    id: "mercadodigital",
    name: "Mercado Digital",
    stage: "Integrações",
    priority: "Média",
    modules: ["API", "Integração"],
    nextAction: "Conectar API Oficial",
    deadline: "Em 3 dias",
    owner: "Carla Souza",
    phone: "(81) 94444-5555",
    whatsapp: "(81) 94444-5555",
    email: "parceiros@mercadodigital.com",
    cnpj: "66.777.888/0001-99",
    plan: "Profissional",
    entryDate: "08/06/2026",
    collaborator: "Carla Souza",
    implType: "Híbrida",
    attentionStatus: null,
    daysWithoutUpdate: 0,
    checklists: {
      impl: [
        { id: "impl_kickoff", label: "Reunião de kickoff", checked: true },
        { id: "impl_import", label: "Importação de dados", checked: true },
        { id: "impl_config", label: "Configuração da plataforma", checked: true },
        { id: "impl_train", label: "Treinamento da equipe", checked: false },
        { id: "impl_followup", label: "Follow-up D+7", checked: false }
      ],
      api: [
        { id: "api_site", label: "Criar site", checked: true },
        { id: "api_host", label: "Contratar hospedagem", checked: true },
        { id: "api_domain", label: "Configurar domínio", checked: true },
        { id: "api_meta", label: "Criar conta Meta Business", checked: true },
        { id: "api_verify", label: "Verificação da conta", checked: true },
        { id: "api_connect", label: "Conectar API Oficial", checked: false },
        { id: "api_test", label: "Testar envio de mensagens", checked: false },
        { id: "api_validate", label: "Validar funcionamento", checked: false }
      ],
      ia: [
        { id: "ia_agent", label: "Criar agente IA", checked: false },
        { id: "ia_prompt", label: "Escrever prompt base", checked: false },
        { id: "ia_personality", label: "Configurar personalidade", checked: false },
        { id: "ia_rules", label: "Definir regras de comportamento", checked: false },
        { id: "ia_connect", label: "Conectar à plataforma", checked: false },
        { id: "ia_test", label: "Testar respostas", checked: false },
        { id: "ia_validate", label: "Validar com cliente", checked: false },
        { id: "ia_publish", label: "Publicar agente", checked: false }
      ]
    },
    logs: [
      { author: "Carla Souza", date: "12/06", content: "Conectou a conta sandbox e validou verificação Meta" }
    ]
  },
  {
    id: "foodexpress",
    name: "FoodExpress",
    stage: "Treinamento",
    priority: "Baixa",
    modules: ["IA"],
    nextAction: "Agendar sessão com equipe",
    deadline: "Em 7 dias",
    owner: "Gabriel Almeida",
    phone: "(85) 93333-6666",
    whatsapp: "(85) 93333-6666",
    email: "contato@foodexpress.com",
    cnpj: "77.888.999/0001-11",
    plan: "Essencial",
    entryDate: "12/06/2026",
    collaborator: "Gabriel Almeida",
    implType: "Rápida",
    attentionStatus: null,
    daysWithoutUpdate: 0,
    checklists: {
      impl: [
        { id: "impl_kickoff", label: "Reunião de kickoff", checked: true },
        { id: "impl_import", label: "Importação de dados", checked: true },
        { id: "impl_config", label: "Configuração da plataforma", checked: true },
        { id: "impl_train", label: "Treinamento da equipe", checked: false },
        { id: "impl_followup", label: "Follow-up D+7", checked: false }
      ],
      api: [
        { id: "api_site", label: "Criar site", checked: false },
        { id: "api_host", label: "Contratar hospedagem", checked: false },
        { id: "api_domain", label: "Configurar domínio", checked: false },
        { id: "api_meta", label: "Criar conta Meta Business", checked: false },
        { id: "api_verify", label: "Verificação da conta", checked: false },
        { id: "api_connect", label: "Conectar API Oficial", checked: false },
        { id: "api_test", label: "Testar envio de mensagens", checked: false },
        { id: "api_validate", label: "Validar funcionamento", checked: false }
      ],
      ia: [
        { id: "ia_agent", label: "Criar agente IA", checked: true },
        { id: "ia_prompt", label: "Escrever prompt base", checked: true },
        { id: "ia_personality", label: "Configurar personalidade", checked: true },
        { id: "ia_rules", label: "Definir regras de comportamento", checked: true },
        { id: "ia_connect", label: "Conectar à plataforma", checked: false },
        { id: "ia_test", label: "Testar respostas", checked: false },
        { id: "ia_validate", label: "Validar com cliente", checked: false },
        { id: "ia_publish", label: "Publicar agente", checked: false }
      ]
    },
    logs: [
      { author: "Gabriel Almeida", date: "18/06", content: "Agendado treinamento após finalização das regras da IA" }
    ]
  },
  {
    id: "megastore",
    name: "MegaStore",
    stage: "Acompanhamento",
    priority: "Alta",
    modules: ["API", "IA", "Site", "Integração"],
    nextAction: "Follow-up D+7",
    deadline: "Em 2 dias",
    owner: "Carla Souza",
    phone: "(11) 92222-7777",
    whatsapp: "(11) 92222-7777",
    email: "suporte@megastore.com",
    cnpj: "88.999.000/0001-33",
    plan: "Enterprise",
    entryDate: "20/05/2026",
    collaborator: "Carla Souza",
    implType: "Completa",
    attentionStatus: "Atrasado",
    daysWithoutUpdate: 8,
    attentionAction: "Reagendar reunião",
    checklists: {
      impl: [
        { id: "impl_kickoff", label: "Reunião de kickoff", checked: true },
        { id: "impl_import", label: "Importação de dados", checked: true },
        { id: "impl_config", label: "Configuração da plataforma", checked: true },
        { id: "impl_train", label: "Treinamento da equipe", checked: false },
        { id: "impl_followup", label: "Follow-up D+7", checked: false }
      ],
      api: [
        { id: "api_site", label: "Criar site", checked: true },
        { id: "api_host", label: "Contratar hospedagem", checked: true },
        { id: "api_domain", label: "Configurar domínio", checked: true },
        { id: "api_meta", label: "Criar conta Meta Business", checked: true },
        { id: "api_verify", label: "Verificação da conta", checked: true },
        { id: "api_connect", label: "Conectar API Oficial", checked: true },
        { id: "api_test", label: "Testar envio de mensagens", checked: true },
        { id: "api_validate", label: "Validar funcionamento", checked: false }
      ],
      ia: [
        { id: "ia_agent", label: "Criar agente IA", checked: true },
        { id: "ia_prompt", label: "Escrever prompt base", checked: true },
        { id: "ia_personality", label: "Configurar personalidade", checked: true },
        { id: "ia_rules", label: "Definir regras de comportamento", checked: true },
        { id: "ia_connect", label: "Conectar à plataforma", checked: true },
        { id: "ia_test", label: "Testar respostas", checked: false },
        { id: "ia_validate", label: "Validar com cliente", checked: false },
        { id: "ia_publish", label: "Publicar agente", checked: false }
      ]
    },
    logs: [
      { author: "Carla Souza", date: "28/05", content: "Finalizado o treinamento oficial, iniciando acompanhamento" }
    ]
  },
  {
    id: "logirede",
    name: "LogiRede",
    stage: "Finalizado",
    priority: "Baixa",
    modules: ["API"],
    nextAction: "—",
    deadline: "Concluído",
    owner: "Felipe Torres",
    phone: "(41) 91111-8888",
    whatsapp: "(41) 91111-8888",
    email: "ti@logirede.com.br",
    cnpj: "99.000.111/0001-44",
    plan: "Profissional",
    entryDate: "15/05/2026",
    collaborator: "Felipe Torres",
    implType: "Completa",
    attentionStatus: null,
    daysWithoutUpdate: 0,
    checklists: {
      impl: [
        { id: "impl_kickoff", label: "Reunião de kickoff", checked: true },
        { id: "impl_import", label: "Importação de dados", checked: true },
        { id: "impl_config", label: "Configuração da plataforma", checked: true },
        { id: "impl_train", label: "Treinamento da equipe", checked: true },
        { id: "impl_followup", label: "Follow-up D+7", checked: true }
      ],
      api: [
        { id: "api_site", label: "Criar site", checked: true },
        { id: "api_host", label: "Contratar hospedagem", checked: true },
        { id: "api_domain", label: "Configurar domínio", checked: true },
        { id: "api_meta", label: "Criar conta Meta Business", checked: true },
        { id: "api_verify", label: "Verificação da conta", checked: true },
        { id: "api_connect", label: "Conectar API Oficial", checked: true },
        { id: "api_test", label: "Testar envio de mensagens", checked: true },
        { id: "api_validate", label: "Validar funcionamento", checked: true }
      ],
      ia: [
        { id: "ia_agent", label: "Criar agente IA", checked: true },
        { id: "ia_prompt", label: "Escrever prompt base", checked: true },
        { id: "ia_personality", label: "Configurar personalidade", checked: true },
        { id: "ia_rules", label: "Definir regras de comportamento", checked: true },
        { id: "ia_connect", label: "Conectar à plataforma", checked: true },
        { id: "ia_test", label: "Testar respostas", checked: true },
        { id: "ia_validate", label: "Validar com cliente", checked: true },
        { id: "ia_publish", label: "Publicar agente", checked: true }
      ]
    },
    logs: [
      { author: "Felipe Torres", date: "12/06", content: "Concluiu a implantação" }
    ]
  }
];
