import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import DashboardView from './components/DashboardView';
import KanbanView from './components/KanbanView';
import ClientsListView from './components/ClientsListView';
import Client360View from './components/Client360View';
import AgendaView from './components/AgendaView';
import TarefasView from './components/TarefasView';
import LembretesView from './components/LembretesView';

import { initialClients } from './data/clients';
import { initialTasks } from './data/tasks';
import { initialAgendaEvents } from './data/agenda';
import { initialTasksList } from './data/tarefas';
import { initialReminders } from './data/lembretes';

import { AlertCircle, HelpCircle } from 'lucide-react';

export default function App() {
  const [clients, setClients] = useState(initialClients);
  const [tasks, setTasks] = useState(initialTasks);
  const [currentRoute, setCurrentRoute] = useState('dashboard');

  // Phase 2 States
  const [agendaEvents, setAgendaEvents] = useState(initialAgendaEvents);
  const [tasksList, setTasksList] = useState(initialTasksList);
  const [reminders, setReminders] = useState(initialReminders);

  // Simple Hash-based Router
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (!hash || hash === '#/') {
        setCurrentRoute('dashboard');
      } else {
        // Remove '#/' from hash
        const route = hash.replace(/^#\//, '');
        setCurrentRoute(route);
      }
    };

    // Listen for hashchange
    window.addEventListener('hashchange', handleHashChange);
    // Trigger once on load
    handleHashChange();

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  const handleNavigate = (route) => {
    window.location.hash = `#/${route}`;
    setCurrentRoute(route);
  };

  // State Mutators
  // 1. Toggle dashboard task completion
  const handleToggleTask = (taskId) => {
    setTasks(prevTasks => 
      prevTasks.map(task => 
        task.id === taskId ? { ...task, completed: !task.completed } : task
      )
    );
  };

  // 2. Update client stage (for drag & drop)
  const handleUpdateClientStage = (clientId, newStage) => {
    setClients(prevClients => 
      prevClients.map(client => {
        if (client.id === clientId) {
          const oldStage = client.stage;
          if (oldStage === newStage) return client;
          
          // Add a new activity log entry for the stage change
          const newLog = {
            author: "Gabriel Almeida",
            date: "Hoje " + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            content: `Moveu o cliente de "${oldStage}" para "${newStage}"`
          };
          return {
            ...client,
            stage: newStage,
            logs: [newLog, ...client.logs]
          };
        }
        return client;
      })
    );
  };

  // 3. Update client checklist re-actively
  const handleUpdateClientChecklist = (clientId, moduleKey, itemIndex, newValue) => {
    setClients(prevClients => 
      prevClients.map(client => {
        if (client.id === clientId) {
          const updatedChecklist = [...client.checklists[moduleKey]];
          const item = updatedChecklist[itemIndex];
          const oldChecked = item.checked;
          
          if (oldChecked === newValue) return client;

          updatedChecklist[itemIndex] = { ...item, checked: newValue };

          // Add activity log
          const newLog = {
            author: "Gabriel Almeida",
            date: "Hoje " + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            content: `${newValue ? 'Marcou' : 'Desmarcou'} "${item.label}" como concluída`
          };

          return {
            ...client,
            checklists: {
              ...client.checklists,
              [moduleKey]: updatedChecklist
            },
            logs: [newLog, ...client.logs]
          };
        }
        return client;
      })
    );
  };

  // 4. Mark next action as completed
  const handleUpdateNextAction = (clientId, completed) => {
    if (!completed) return;
    setClients(prevClients => 
      prevClients.map(client => {
        if (client.id === clientId) {
          const actionText = client.nextAction;
          if (actionText === '—') return client;

          const newLog = {
            author: "Gabriel Almeida",
            date: "Hoje " + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            content: `Concluiu a ação: "${actionText}"`
          };

          return {
            ...client,
            nextAction: '—',
            deadline: 'Concluído',
            logs: [newLog, ...client.logs]
          };
        }
        return client;
      })
    );
  };

  // ==========================
  // PHASE 2 STATE HANDLERS
  // ==========================

  // Agenda Event addition
  const handleAddAgendaEvent = (newEvent) => {
    setAgendaEvents(prev => [...prev, newEvent]);
  };

  // Tasks screen list task toggle completion
  const handleToggleTaskListTask = (taskId) => {
    setTasksList(prev => prev.map(t => 
      t.id === taskId ? { ...t, completed: !t.completed } : t
    ));
  };

  // Reminders screen list actions
  const handleAddReminder = (newReminder) => {
    setReminders(prev => [...prev, newReminder]);
  };

  const handleDismissReminder = (reminderId) => {
    setReminders(prev => prev.filter(r => r.id !== reminderId));
  };

  // "Adiar 1h" shifts period category from 'hoje' -> 'amanha', 'amanha' -> 'proximos' and increases time by 1 hour
  const handleDelayReminder = (reminderId) => {
    setReminders(prev => prev.map(rem => {
      if (rem.id === reminderId) {
        let nextCategory = rem.category;
        if (rem.category === 'hoje') {
          nextCategory = 'amanha';
        } else if (rem.category === 'amanha') {
          nextCategory = 'proximos';
        }

        // Add 1 hour to the clock time
        let timeString = rem.time;
        try {
          const [h, m] = rem.time.split(':').map(Number);
          const nextH = (h + 1) % 24;
          timeString = `${nextH.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
        } catch(e) {}

        return {
          ...rem,
          category: nextCategory,
          time: timeString
        };
      }
      return rem;
    }));
  };

  // Render active view
  const renderView = () => {
    if (currentRoute === 'dashboard') {
      return (
        <DashboardView 
          clients={clients} 
          tasks={tasks} 
          onToggleTask={handleToggleTask} 
          onNavigate={handleNavigate}
        />
      );
    }

    if (currentRoute === 'kanban') {
      return (
        <KanbanView 
          clients={clients} 
          onUpdateClientStage={handleUpdateClientStage} 
          onUpdateClientChecklist={handleUpdateClientChecklist}
          onUpdateNextAction={handleUpdateNextAction}
        />
      );
    }

    if (currentRoute === 'clientes') {
      return (
        <ClientsListView 
          clients={clients} 
          onNavigate={handleNavigate}
        />
      );
    }

    // Phase 2 views
    if (currentRoute === 'agenda') {
      return (
        <AgendaView 
          clients={clients}
          agendaEvents={agendaEvents}
          onAddEvent={handleAddAgendaEvent}
          onNavigate={handleNavigate}
        />
      );
    }

    if (currentRoute === 'tarefas') {
      return (
        <TarefasView 
          clients={clients}
          tasks={tasksList}
          onToggleTask={handleToggleTaskListTask}
          onNavigate={handleNavigate}
        />
      );
    }

    if (currentRoute === 'lembretes') {
      return (
        <LembretesView 
          clients={clients}
          reminders={reminders}
          onAddReminder={handleAddReminder}
          onDismissReminder={handleDismissReminder}
          onDelayReminder={handleDelayReminder}
          onNavigate={handleNavigate}
        />
      );
    }

    // Dynamic routing: clients/:id
    if (currentRoute.startsWith('clientes/')) {
      const clientId = currentRoute.split('/')[1];
      const client = clients.find(c => c.id === clientId);
      if (client) {
        return (
          <div>
            <button 
              className="btn-action-outline" 
              style={{ marginBottom: '16px' }}
              onClick={() => handleNavigate('clientes')}
            >
              ← Voltar para lista de clientes
            </button>
            <Client360View 
              client={client} 
              onUpdateChecklist={(mod, itemIdx, val) => handleUpdateClientChecklist(client.id, mod, itemIdx, val)}
              onUpdateNextAction={(completed) => handleUpdateNextAction(client.id, completed)}
            />
          </div>
        );
      }
    }

    // Placeholders for Configurações
    const placeholderRoutes = ['configuracoes'];
    if (placeholderRoutes.includes(currentRoute)) {
      return (
        <div className="placeholder-container">
          <HelpCircle className="placeholder-icon" style={{ animation: 'bounce 2s infinite' }} />
          <h2 className="placeholder-title">Configurações (Em breve)</h2>
          <p className="placeholder-text">
            Esta funcionalidade está planejada para a Fase 3 do JetFlow e não está ativa nesta entrega do frontend navegável.
          </p>
          <button className="btn-back-home" onClick={() => handleNavigate('dashboard')}>
            Voltar para o Dashboard
          </button>
        </div>
      );
    }

    // 404 Fallback
    return (
      <div className="placeholder-container">
        <AlertCircle className="placeholder-icon" />
        <h2 className="placeholder-title">Página não encontrada (404)</h2>
        <p className="placeholder-text">A rota especificada não existe.</p>
        <button className="btn-back-home" onClick={() => handleNavigate('dashboard')}>
          Voltar para o Dashboard
        </button>
      </div>
    );
  };

  const getPageTitle = () => {
    if (currentRoute === 'dashboard') return 'Dashboard';
    if (currentRoute === 'kanban') return 'Quadro Kanban';
    if (currentRoute === 'clientes') return 'Clientes em Implantação';
    if (currentRoute.startsWith('clientes/')) return 'Cliente 360';
    if (currentRoute === 'agenda') return 'Agenda do Especialista';
    if (currentRoute === 'tarefas') return 'Central de Tarefas';
    if (currentRoute === 'lembretes') return 'Lembretes Manuais';
    if (currentRoute === 'configuracoes') return 'Configurações';
    return 'Navegação';
  };

  return (
    <div className="app-container">
      <Sidebar currentRoute={currentRoute} onNavigate={handleNavigate} />
      <main className="main-content">
        <Header title={getPageTitle()} />
        {renderView()}
      </main>
    </div>
  );
}
