export const initialReminders = [
  // HOJE (Today)
  {
    id: "rem_1",
    title: "Ligar para TechNova Ltda",
    clientName: "TechNova Ltda",
    clientId: "technova",
    description: "Confirmar presença no treinamento de amanhã",
    time: "15:00",
    responsible: "Gabriel Almeida",
    category: "hoje"
  },
  {
    id: "rem_2",
    title: "Enviar proposta atualizada",
    clientName: "MegaStore",
    clientId: "megastore",
    description: "MegaStore pediu revisão do plano",
    time: "17:30",
    responsible: "Carla Souza",
    category: "hoje"
  },

  // AMANHÃ (Tomorrow)
  {
    id: "rem_3",
    title: "Follow-up pós-treinamento",
    clientName: "SulPharma",
    clientId: "sulpharma",
    description: "SulPharma — verificar dúvidas da equipe",
    time: "10:00",
    responsible: "Gabriel Almeida",
    category: "amanha"
  },

  // PRÓXIMOS DIAS (Next Days)
  {
    id: "rem_4",
    title: "Renovação de contrato",
    clientName: "InovaVarejo",
    clientId: "inovavarejo",
    description: "InovaVarejo — contrato vence em 15 dias",
    time: "09:00",
    responsible: "Carla Souza",
    category: "proximos"
  }
];
