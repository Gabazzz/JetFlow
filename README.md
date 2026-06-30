# JetFlow 🚀

**Sistema SaaS de gestão de implantação (onboarding)** desenvolvido para a Jetsales. Utilizado por especialistas de implantação e gestores para acompanhar clientes contratantes de soluções WhatsApp, automações e IA.

## 🖥️ Visão Geral

Frontend navegável com dados mockados — sem backend. Toda a lógica de estado é gerenciada no frontend com dados estáticos/simulados.

## 🎨 Identidade Visual

| Token | Valor |
|---|---|
| Fundo principal | `#0B0B0B` |
| Cards | `#1B1B1B` |
| Superfície elevada | `#2E2E2E` |
| Verde principal (CTAs) | `#65FF4B` |
| Verde hover | `#42C84A` |
| Texto primário | `#FFFFFF` |
| Texto secundário | `#888888` |

- **Tipografia:** Inter (Google Fonts)
- **Estilo:** Dark mode total, glassmorphism em modais, bordas 8px, transições 200ms

## 📱 Telas Implementadas

### Fase 1 — Telas Principais
| Tela | Rota | Descrição |
|---|---|---|
| Dashboard | `#/dashboard` | KPIs reativos com indicadores de SLA, atividades e pipeline |
| Kanban | `#/kanban` | Quadro de pipeline com drag-and-drop e gaveta de detalhes |
| Clientes | `#/clientes` | Lista de clientes em implantação |
| Cliente 360 | `#/clientes/:id` | Visão completa com checklists, log de atividade e próximas ações |

### Fase 2 — Telas Secundárias
| Tela | Rota | Descrição |
|---|---|---|
| Agenda | `#/agenda` | Grade diária 08:00–19:00 com eventos posicionados por cálculo de minutos |
| Tarefas | `#/tarefas` | Central com filtros por abas, dropdowns e overdue sort |
| Lembretes | `#/lembretes` | Lembretes agrupados por período, com Dispensar e Adiar 1h |

## 🛠️ Stack Técnica

- **Framework:** React 19 + Vite 8
- **Estilo:** Vanilla CSS (sem frameworks)
- **Ícones:** Lucide React
- **Roteamento:** Hash-based SPA Router (sem dependências externas)
- **Estado:** React `useState` — dados mockados locais

## ⚙️ Como Rodar

```bash
# Instalar dependências
npm install

# Servidor de desenvolvimento
npm run dev

# Build de produção
npm run build
```

O servidor de dev estará disponível em **http://localhost:5173/**.

## 📂 Estrutura de Arquivos

```
src/
├── components/
│   ├── Sidebar.jsx          # Navegação lateral
│   ├── Header.jsx           # Cabeçalho global
│   ├── DashboardView.jsx    # Tela de métricas
│   ├── KanbanView.jsx       # Pipeline com drag-and-drop
│   ├── ClientsListView.jsx  # Lista de clientes
│   ├── Client360View.jsx    # Visão 360 do cliente
│   ├── AgendaView.jsx       # Agenda diária (Fase 2)
│   ├── TarefasView.jsx      # Central de tarefas (Fase 2)
│   └── LembretesView.jsx    # Controle de lembretes (Fase 2)
├── data/
│   ├── clients.js           # Mock de 9 clientes detalhados
│   ├── tasks.js             # Atividades do dashboard
│   ├── agenda.js            # Eventos da agenda
│   ├── tarefas.js           # Lista de tarefas
│   └── lembretes.js         # Lembretes iniciais
├── App.jsx                  # Raiz da aplicação + roteamento
├── index.css                # Design system completo
└── main.jsx                 # Ponto de entrada
```

---

Desenvolvido como entrega de frontend navegável para o projeto JetFlow — Jetsales.
