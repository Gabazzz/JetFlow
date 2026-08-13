// ============================================================
// JetFlow — Client-side constants
//
// Everything that used to be mock seed data (clients, tickets, plans,
// modules, offers, stages) now lives in Supabase, scoped per account —
// see src/lib/supabaseSync.js. What's left here is genuinely static:
// a display-only fallback profile shape, and the checklist template
// used to seed a brand-new client's tasks when it's first created.
// ============================================================

export const initialProfile = {
  name: 'Gabriel Almeida',
  role: 'Especialista de Implantação',
  avatarInitials: 'GA',
};

// Checklists templates per module — configuráveis por módulo, não uma lista
// genérica única. Cada item carrega, além do label exibido na tela, as
// frases prontas usadas na Nota de Reunião quando o item é concluído
// (doneText) ou quando ainda está pendente (pendingText). Sem essas frases,
// a nota cai para "{label} realizado."/"{label} pendente." automaticamente.
export const moduleChecklistsTemplate = {
  'JetGo': [
    { label: 'Configuração inicial da plataforma', checked: false, doneText: 'Configuração inicial do JetGo realizada.', pendingText: 'Configurar JetGo.' },
    { label: 'Apresentação da plataforma', checked: false, doneText: 'JetGo apresentado ao cliente.', pendingText: 'Apresentar JetGo.' },
    { label: 'Cadastro de usuários', checked: false, doneText: 'Usuários cadastrados no JetGo.', pendingText: 'Cadastrar usuários no JetGo.' },
    { label: 'Teste operacional', checked: false, doneText: 'Teste operacional do JetGo realizado.', pendingText: 'Testar operação do JetGo.' },
    { label: 'Validação final', checked: false, doneText: 'JetGo validado.', pendingText: 'Validar JetGo.' }
  ],
  'WhatsApp Business': [
    { label: 'Aprovação do número BSP', checked: true, doneText: 'Número BSP aprovado.', pendingText: 'Aprovar número BSP.' },
    { label: 'Configuração de perfil comercial', checked: true, doneText: 'Perfil comercial configurado.', pendingText: 'Configurar perfil comercial.' },
    { label: 'Disparo de teste de homologação', checked: false, doneText: 'Teste de homologação disparado.', pendingText: 'Disparar teste de homologação.' }
  ],
  'CRM Integrado': [
    { label: 'Mapeamento de campos personalizados', checked: true, doneText: 'Campos personalizados mapeados.', pendingText: 'Mapear campos personalizados.' },
    { label: 'Integração de webhooks no CRM', checked: false, doneText: 'Webhooks do CRM integrados.', pendingText: 'Integrar webhooks no CRM.' },
    { label: 'Teste de sincronização de leads', checked: false, doneText: 'Sincronização de leads testada.', pendingText: 'Testar sincronização de leads.' }
  ],
  'Automação de Fluxos': [
    { label: 'Definição de regras de automação', checked: false, doneText: 'Regras de automação definidas.', pendingText: 'Definir regras de automação.' },
    { label: 'Configuração de mensagens automáticas', checked: false, doneText: 'Mensagens automáticas configuradas.', pendingText: 'Configurar mensagens automáticas.' },
    { label: 'Teste de gatilhos operacionais', checked: false, doneText: 'Gatilhos operacionais testados.', pendingText: 'Testar gatilhos operacionais.' }
  ],
  'Agente de IA': [
    { label: 'Criação', checked: false, doneText: 'Agente de IA criado.', pendingText: 'Criar Agente de IA.' },
    { label: 'Configuração', checked: false, doneText: 'Agente de IA configurado.', pendingText: 'Configurar Agente de IA.' },
    { label: 'Dashboard apresentado', checked: false, doneText: 'Dashboard de IA apresentado.', pendingText: 'Apresentar Dashboard de IA.' },
    { label: 'Teste realizado', checked: false, doneText: 'Teste do Agente de IA realizado.', pendingText: 'Testar Agente de IA.' },
    { label: 'Validação', checked: false, doneText: 'Agente de IA validado.', pendingText: 'Validar Agente de IA.' }
  ],
  'Chatbot': [
    { label: 'Construção/configuração', checked: false, doneText: 'Chatbot construído e configurado.', pendingText: 'Construir/configurar Chatbot.' },
    { label: 'Apresentação', checked: false, doneText: 'Chatbot apresentado.', pendingText: 'Apresentar Chatbot.' },
    { label: 'Teste', checked: false, doneText: 'Teste do Chatbot realizado.', pendingText: 'Testar Chatbot.' },
    { label: 'Validação', checked: false, doneText: 'Chatbot validado.', pendingText: 'Validar Chatbot.' }
  ],
  'JetVoice': [
    { label: 'Conexão realizada', checked: false, doneText: 'JetVoice conectado.', pendingText: 'Conectar JetVoice.' },
    { label: 'Configuração', checked: false, doneText: 'JetVoice configurado.', pendingText: 'Configurar JetVoice.' },
    { label: 'Teste', checked: false, doneText: 'Teste do JetVoice realizado.', pendingText: 'Testar JetVoice.' },
    { label: 'Funcionalidade validada', checked: false, doneText: 'JetVoice validado.', pendingText: 'Validar funcionalidade do JetVoice.' }
  ],
  'Integrações / Canais': [
    { label: 'Conexão de canais', checked: false, doneText: 'Canais conectados.', pendingText: 'Conectar canais.' },
    { label: 'Configuração de integrações', checked: false, doneText: 'Integrações configuradas.', pendingText: 'Configurar integrações.' },
    { label: 'Teste de integrações', checked: false, doneText: 'Teste de integrações realizado.', pendingText: 'Testar integrações.' },
    { label: 'Validação', checked: false, doneText: 'Integrações e canais validados.', pendingText: 'Validar integrações e canais.' }
  ],
  'Relatórios Avançados': [
    { label: 'Criação de dashboards customizados', checked: false, doneText: 'Dashboards customizados criados.', pendingText: 'Criar dashboards customizados.' },
    { label: 'Configuração de relatórios automáticos', checked: false, doneText: 'Relatórios automáticos configurados.', pendingText: 'Configurar relatórios automáticos.' }
  ],
  'API Oficial': [
    { label: 'Configuração do WABA', checked: true, doneText: 'WABA configurado.', pendingText: 'Configurar WABA.' },
    { label: 'Verificação da conta Meta Business', checked: true, doneText: 'Conta Meta Business verificada.', pendingText: 'Verificar conta Meta Business.' },
    { label: 'Configuração de webhook oficial', checked: false, doneText: 'Webhook oficial configurado.', pendingText: 'Configurar webhook oficial.' }
  ]
};
