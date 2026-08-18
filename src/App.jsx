import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import DashboardView from './components/DashboardView';
import KanbanView from './components/KanbanView';
import ClientsListView from './components/ClientsListView';
import ClientDetailView from './components/ClientDetailView';
import ConfiguracoesView from './components/ConfiguracoesView';
import SuporteView from './components/SuporteView';
import AgendaView from './components/AgendaView';
import TarefasView from './components/TarefasView';
import OportunidadesView from './components/OportunidadesView';
import Auth from './components/Auth';

import { initialProfile } from './data/data';

import {
  calculateNextContactDate,
  getDateStatus,
  getTodayBR,
  getNowTimeBR,
  addDaysToBRDate
} from './utils';

import { Bell, X, Plus } from 'lucide-react';
import CustomDatePicker from './components/CustomDatePicker';
import CustomSelect from './components/CustomSelect';
import { supabase } from './lib/supabaseClient';
import { loadAllData, clientToRow, ticketToRow, taskToRow, catalogToRow, syncTable, syncStages, syncProfile } from './lib/supabaseSync';

export default function App() {
  const [currentRoute, setCurrentRoute] = useState('dashboard');

  // Auth — every table in Supabase is scoped to auth.uid() via RLS, so the
  // whole app waits for a session before it has anything to show.
  const [session, setSession] = useState(undefined); // undefined = still checking
  const [dataReady, setDataReady] = useState(false);
  const userId = session?.user?.id || null;

  // Application Local State (Single source of truth — now backed by Supabase.
  // Handlers below are untouched from before; a set of sync effects further
  // down watches each collection and persists changes automatically.)
  const [profile, setProfile] = useState(initialProfile);
  const [plans, setPlans] = useState([]);
  const [modules, setModules] = useState([]);
  const [offers, setOffers] = useState([]);
  const [clients, setClients] = useState([]);
  const [stages, setStages] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [standaloneTasks, setStandaloneTasks] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  // Last-known id sets per collection, used to detect deletions on sync.
  const lastClientIds = useRef(new Set());
  const lastTicketIds = useRef(new Set());
  const lastTaskIds = useRef(new Set());
  const lastPlanIds = useRef(new Set());
  const lastModuleIds = useRef(new Set());
  const lastOfferIds = useRef(new Set());
  const lastStageNames = useRef(new Set());

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  // Load everything for the signed-in user once, right after login.
  useEffect(() => {
    if (!userId) {
      setDataReady(false);
      return;
    }
    let cancelled = false;
    (async () => {
      const data = await loadAllData(userId);
      if (cancelled) return;
      setProfile(data.profile || initialProfile);
      setPlans(data.plans);
      setModules(data.modules);
      setOffers(data.offers);
      setStages(data.stages);
      setClients(data.clients);
      setTickets(data.tickets);
      setStandaloneTasks(data.tasks);
      lastPlanIds.current = new Set(data.plans.map(p => p.id));
      lastModuleIds.current = new Set(data.modules.map(m => m.id));
      lastOfferIds.current = new Set(data.offers.map(o => o.id));
      lastStageNames.current = new Set(data.stages);
      lastClientIds.current = new Set(data.clients.map(c => c.id));
      lastTicketIds.current = new Set(data.tickets.map(t => t.id));
      lastTaskIds.current = new Set(data.tasks.map(t => t.id));
      setDataReady(true);
    })();
    return () => { cancelled = true; };
  }, [userId]);

  // Sync effects — fire after every local change to each collection, once
  // the initial load has completed. Business logic in the handlers below
  // never talks to Supabase directly; this is the only place that does.
  useEffect(() => {
    if (!dataReady || !userId) return;
    syncTable('clients', clients, c => clientToRow(c, userId), lastClientIds);
  }, [clients, dataReady, userId]);

  useEffect(() => {
    if (!dataReady || !userId) return;
    syncTable('tickets', tickets, t => ticketToRow(t, userId), lastTicketIds);
  }, [tickets, dataReady, userId]);

  useEffect(() => {
    if (!dataReady || !userId) return;
    syncTable('tasks', standaloneTasks, t => taskToRow(t, userId), lastTaskIds);
  }, [standaloneTasks, dataReady, userId]);

  useEffect(() => {
    if (!dataReady || !userId) return;
    syncTable('plans', plans, p => catalogToRow('plans', p, userId), lastPlanIds);
  }, [plans, dataReady, userId]);

  useEffect(() => {
    if (!dataReady || !userId) return;
    syncTable('modules', modules, m => catalogToRow('modules', m, userId), lastModuleIds);
  }, [modules, dataReady, userId]);

  useEffect(() => {
    if (!dataReady || !userId) return;
    syncTable('offers', offers, o => catalogToRow('offers', o, userId), lastOfferIds);
  }, [offers, dataReady, userId]);

  useEffect(() => {
    if (!dataReady || !userId) return;
    syncStages(stages, lastStageNames, userId);
  }, [stages, dataReady, userId]);

  useEffect(() => {
    if (!dataReady || !userId) return;
    syncProfile(profile, userId);
  }, [profile, dataReady, userId]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setDataReady(false);
    setProfile(initialProfile);
    setPlans([]); setModules([]); setOffers([]); setClients([]); setStages([]); setTickets([]); setStandaloneTasks([]);
  };

  // Global New Lead Modal Form State
  const [isNewLeadModalOpen, setIsNewLeadModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCnpj, setNewCnpj] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newWhatsapp, setNewWhatsapp] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newEntryDate, setNewEntryDate] = useState(() => getTodayBR());
  const [newPlan, setNewPlan] = useState('Pro');
  const [newCriticality, setNewCriticality] = useState('Estável');
  const [newJustification, setNewJustification] = useState('');
  const [newSelectedModules, setNewSelectedModules] = useState([]);
  const [newObservations, setNewObservations] = useState('');

  // Hash-based simple routing
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (!hash || hash === '#/') {
        setCurrentRoute('dashboard');
      } else {
        const route = hash.replace(/^#\//, '');
        setCurrentRoute(route);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange();

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  const handleNavigate = (route) => {
    window.location.hash = `#/${route}`;
    setCurrentRoute(route);
  };

  // State Mutators — Profile
  const handleUpdateProfile = (updatedFields) => {
    setProfile(prev => ({ ...prev, ...updatedFields }));
  };

  // State Mutators — Plans
  const handleAddPlan = (newPlan) => {
    setPlans(prev => [...prev, newPlan]);
  };

  const handleEditPlan = (id, newName) => {
    setPlans(prev => prev.map(p => p.id === id ? { ...p, name: newName } : p));
    setClients(prev => prev.map(c => {
      const oldPlanObj = plans.find(p => p.id === id);
      if (oldPlanObj && c.plan === oldPlanObj.name) {
        return { ...c, plan: newName };
      }
      return c;
    }));
  };

  const handleRemovePlan = (id) => {
    setPlans(prev => prev.filter(p => p.id !== id));
  };

  // State Mutators — Modules
  const handleAddModule = (newModule) => {
    setModules(prev => [...prev, newModule]);
  };

  const handleEditModule = (id, newName) => {
    setModules(prev => prev.map(m => m.id === id ? { ...m, name: newName } : m));
    setClients(prev => prev.map(c => {
      const oldModObj = modules.find(m => m.id === id);
      if (oldModObj && c.activeModules.includes(oldModObj.name)) {
        return {
          ...c,
          activeModules: c.activeModules.map(mName => mName === oldModObj.name ? newName : mName)
        };
      }
      return c;
    }));
  };

  const handleUpdateModuleChecklist = (id, checklist) => {
    setModules(prev => prev.map(m => m.id === id ? { ...m, checklist } : m));
  };

  const handleRemoveModule = (id) => {
    const targetModule = modules.find(m => m.id === id);
    setModules(prev => prev.filter(m => m.id !== id));
    if (targetModule) {
      setClients(prev => prev.map(c => ({
        ...c,
        activeModules: c.activeModules.filter(mName => mName !== targetModule.name)
      })));
    }
  };

  // State Mutators — Offers
  const handleAddOffer = (newOffer) => {
    setOffers(prev => [...prev, newOffer]);
  };

  const handleEditOffer = (id, newName) => {
    setOffers(prev => prev.map(o => o.id === id ? { ...o, name: newName } : o));
    setClients(prev => prev.map(c => {
      const oldOfferObj = offers.find(o => o.id === id);
      if (oldOfferObj) {
        return {
          ...c,
          interestOffers: c.interestOffers.map(io => io.name === oldOfferObj.name ? { ...io, name: newName } : io)
        };
      }
      return c;
    }));
  };

  const handleRemoveOffer = (id) => {
    const targetOffer = offers.find(o => o.id === id);
    setOffers(prev => prev.filter(o => o.id !== id));
    if (targetOffer) {
      setClients(prev => prev.map(c => ({
        ...c,
        interestOffers: c.interestOffers.filter(io => io.name !== targetOffer.name)
      })));
    }
  };

  // State Mutators — Clients
  const handleAddClient = (newClient) => {
    setClients(prev => [newClient, ...prev]);
  };

  const handleRemoveClient = (clientId) => {
    setClients(prev => prev.filter(c => c.id !== clientId));
  };

  const handleImportClients = ({ created, updated }) => {
    setClients(prev => {
      const updateMap = new Map(updated.map(u => [u.id, u.fields]));
      const merged = prev.map(c => updateMap.has(c.id) ? { ...c, ...updateMap.get(c.id) } : c);
      return [...created, ...merged];
    });
  };

  const handleUpdateClient = (clientId, fieldsToUpdate) => {
    setClients(prev => prev.map(c => 
      c.id === clientId ? { ...c, ...fieldsToUpdate } : c
    ));
  };

  const handleUpdateClientStage = (clientId, newStage) => {
    setClients(prev => prev.map(c => 
      c.id === clientId ? { ...c, stage: newStage } : c
    ));
  };

  const handleUpdateClientNextAction = (clientId, newNextAction) => {
    setClients(prev => prev.map(c => 
      c.id === clientId ? { ...c, nextAction: newNextAction } : c
    ));
  };

  // Contact cycle handler: updates nextContactDate and logs the contact — does not spawn a fake meeting
  const handleRegisterContact = (clientId, obsText = '') => {
    setClients(prev => prev.map(c => {
      if (c.id === clientId) {
        const todayStr = getTodayBR();
        const nextContact = calculateNextContactDate(c.criticality, todayStr);
        const label = obsText.trim() || 'Registrou contato periódico';
        return {
          ...c,
          nextContactDate: nextContact,
          lastContacts: [
            { date: todayStr, obs: label },
            ...(c.lastContacts || [])
          ],
          activityHistory: [
            { avatar: profile.avatarInitials, name: profile.name, action: label, date: `${todayStr} às ${getNowTimeBR()}`, isObservation: false },
            ...(c.activityHistory || [])
          ]
        };
      }
      return c;
    }));
  };

  // Marks an existing scheduled meeting as done, in place — no new entries created
  const handleCompleteMeeting = (clientId, meetingId) => {
    setClients(prev => prev.map(c => {
      if (c.id === clientId) {
        return {
          ...c,
          meetings: (c.meetings || []).map(m => m.id === meetingId ? { ...m, completed: true } : m)
        };
      }
      return c;
    }));
  };

  // Quick-action handlers
  const handleAddClientTask = (clientId, text, deadline) => {
    setClients(prev => prev.map(c => {
      if (c.id === clientId) {
        return {
          ...c,
          tasks: [...(c.tasks || []), { id: `task_${Date.now()}`, text, deadline }]
        };
      }
      return c;
    }));
  };

  const handleCompleteClientTask = (clientId, taskId) => {
    setClients(prev => prev.map(c => {
      if (c.id === clientId) {
        const task = (c.tasks || []).find(t => t.id === taskId);
        return {
          ...c,
          tasks: (c.tasks || []).map(t => t.id === taskId ? { ...t, completed: true, completedAt: getTodayBR() } : t),
          activityHistory: task ? [
            { avatar: profile.avatarInitials, name: profile.name, action: `Concluiu tarefa: ${task.text}`, date: `${getTodayBR()} às ${getNowTimeBR()}`, isObservation: false },
            ...(c.activityHistory || [])
          ] : (c.activityHistory || [])
        };
      }
      return c;
    }));
  };

  const handleAddClientOffer = (clientId, offerName) => {
    setClients(prev => prev.map(c => {
      if (c.id === clientId) {
        return {
          ...c,
          interestOffers: [...(c.interestOffers || []), { id: `io_${Date.now()}`, name: offerName, status: 'Interessado' }]
        };
      }
      return c;
    }));
  };

  const handleUpdateClientCriticality = (clientId, newCriticality) => {
    setClients(prev => prev.map(c => {
      if (c.id === clientId) {
        const nextContact = calculateNextContactDate(newCriticality, getTodayBR());
        return {
          ...c,
          criticality: newCriticality,
          nextContactDate: nextContact
        };
      }
      return c;
    }));
  };

  // Stage Mutators
  const handleAddStage = (stageName) => {
    setStages(prev => [...prev, stageName]);
  };

  const handleEditStage = (oldName, newName) => {
    setStages(prev => prev.map(s => s === oldName ? newName : s));
    setClients(prev => prev.map(c => c.stage === oldName ? { ...c, stage: newName } : c));
  };

  const handleRemoveStage = (stageName) => {
    setStages(prev => prev.filter(s => s !== stageName));
  };

  const handleReorderStages = (newOrder) => {
    setStages(newOrder);
  };

  // Checklist handler
  const handleUpdateClientChecklist = (clientId, moduleName, checklistItems) => {
    setClients(prev => prev.map(c => {
      if (c.id === clientId) {
        return {
          ...c,
          checklists: {
            ...(c.checklists || {}),
            [moduleName]: checklistItems
          }
        };
      }
      return c;
    }));
  };

  // Custom client reminder handlers
  const handleAddClientReminder = (clientId, title, description, deadline, criticality) => {
    setClients(prev => prev.map(c => {
      if (c.id === clientId) {
        const newReminder = {
          id: `r_${Date.now()}`,
          title,
          description,
          deadline,
          criticality
        };
        return {
          ...c,
          reminders: [...(c.reminders || []), newReminder]
        };
      }
      return c;
    }));
  };

  const handleEditClientReminder = (clientId, reminderId, updatedFields) => {
    setClients(prev => prev.map(c => {
      if (c.id === clientId) {
        return {
          ...c,
          reminders: c.reminders.map(r => r.id === reminderId ? { ...r, ...updatedFields } : r)
        };
      }
      return c;
    }));
  };

  const handleRemoveClientReminder = (clientId, reminderId) => {
    setClients(prev => prev.map(c => {
      if (c.id === clientId) {
        return {
          ...c,
          reminders: c.reminders.filter(r => r.id !== reminderId)
        };
      }
      return c;
    }));
  };

  // State Mutators — Support Tickets
  const handleAddTicket = (clientId, subject, description, priority, discordUrl = '') => {
    const newTicket = {
      id: `tk_${Date.now()}`,
      clientId,
      subject,
      description,
      priority,
      status: 'Aberto',
      createdDate: getTodayBR(),
      origem: 'Painel',
      discordUrl
    };
    setTickets(prev => [newTicket, ...prev]);
    setClients(prev => prev.map(c => {
      if (c.id === clientId) {
        return {
          ...c,
          activityHistory: [
            { avatar: profile.avatarInitials, name: profile.name, action: `Abriu chamado de suporte: ${subject}`, date: `${getTodayBR()} às ${getNowTimeBR()}`, isObservation: false },
            ...(c.activityHistory || [])
          ]
        };
      }
      return c;
    }));
  };

  const handleUpdateTicketStatus = (ticketId, newStatus) => {
    setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status: newStatus } : t));
  };

  const handleUpdateTicketLink = (ticketId, discordUrl) => {
    setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, discordUrl } : t));
  };

  const handleRemoveTicket = (ticketId) => {
    setTickets(prev => prev.filter(t => t.id !== ticketId));
  };

  const handleResolveTicket = (ticketId, note = '') => {
    setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status: 'Resolvido', resolutionNote: note } : t));
  };

  // State Mutators — Standalone Tasks ("avulsas", Minha Fila Hoje)
  const handleAddStandaloneTask = (title, dueDate = '') => {
    setStandaloneTasks(prev => [
      { id: `task_${Date.now()}`, title, dueDate, completed: false, completedAt: '' },
      ...prev
    ]);
  };

  const handleToggleStandaloneTask = (taskId) => {
    setStandaloneTasks(prev => prev.map(t => t.id === taskId
      ? { ...t, completed: !t.completed, completedAt: !t.completed ? getTodayBR() : '' }
      : t
    ));
  };

  const handleSnoozeStandaloneTask = (taskId) => {
    setStandaloneTasks(prev => prev.map(t => t.id === taskId ? { ...t, dueDate: addDaysToBRDate(t.dueDate, 1) } : t));
  };

  // Queue-only mutators — completing/snoozing an item pulled into Minha Fila
  // Hoje from a client's nextAction/reminder, without leaving the queue.
  const handleCompleteClientNextAction = (clientId) => {
    setClients(prev => prev.map(c => c.id === clientId ? { ...c, nextAction: '' } : c));
  };

  const handleSnoozeClientNextContact = (clientId) => {
    setClients(prev => prev.map(c => c.id === clientId ? { ...c, nextContactDate: addDaysToBRDate(c.nextContactDate, 1) } : c));
  };

  const handleSnoozeClientReminder = (clientId, reminderId) => {
    setClients(prev => prev.map(c => {
      if (c.id !== clientId) return c;
      return {
        ...c,
        reminders: (c.reminders || []).map(r => r.id === reminderId ? { ...r, deadline: addDaysToBRDate(r.deadline, 1) } : r)
      };
    }));
  };

  const handleSnoozeClientTask = (clientId, taskId) => {
    setClients(prev => prev.map(c => {
      if (c.id !== clientId) return c;
      return {
        ...c,
        tasks: (c.tasks || []).map(t => t.id === taskId ? { ...t, deadline: addDaysToBRDate(t.deadline, 1) } : t)
      };
    }));
  };

  const handleUncompleteClientTask = (clientId, taskId) => {
    setClients(prev => prev.map(c => {
      if (c.id !== clientId) return c;
      return {
        ...c,
        tasks: (c.tasks || []).map(t => t.id === taskId ? { ...t, completed: false, completedAt: '' } : t)
      };
    }));
  };

  const handleEditClientTask = (clientId, taskId, fields) => {
    setClients(prev => prev.map(c => {
      if (c.id !== clientId) return c;
      return {
        ...c,
        tasks: (c.tasks || []).map(t => t.id === taskId ? { ...t, ...fields } : t)
      };
    }));
  };

  const handleDeleteClientTask = (clientId, taskId) => {
    setClients(prev => prev.map(c => {
      if (c.id !== clientId) return c;
      return { ...c, tasks: (c.tasks || []).filter(t => t.id !== taskId) };
    }));
  };

  const handleEditStandaloneTask = (taskId, fields) => {
    setStandaloneTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...fields } : t));
  };

  const handleDeleteStandaloneTask = (taskId) => {
    setStandaloneTasks(prev => prev.filter(t => t.id !== taskId));
  };

  // Gather overdue or today's notifications
  const alertNotifications = [];
  const todayStrAlerts = getTodayBR();
  clients.forEach(c => {
    // 1. SLA contact reminders
    if (c.nextContactDate) {
      const status = getDateStatus(c.nextContactDate, todayStrAlerts);
      if (status === 'overdue' || status === 'today') {
        alertNotifications.push({
          id: `cycle_${c.id}`,
          type: 'cycle',
          clientId: c.id,
          clientName: c.name,
          title: `SLA: Contato Periódico (${c.criticality})`,
          deadline: c.nextContactDate,
          status
        });
      }
    }
    // 2. Custom reminders
    if (c.reminders) {
      c.reminders.forEach(r => {
        const status = getDateStatus(r.deadline, todayStrAlerts);
        if (status === 'overdue' || status === 'today') {
          alertNotifications.push({
            id: r.id,
            type: 'custom',
            clientId: c.id,
            clientName: c.name,
            title: r.title,
            deadline: r.deadline,
            status
          });
        }
      });
    }
  });

  // Routing render helper
  const renderView = () => {
    if (currentRoute === 'dashboard') {
      return (
        <DashboardView
          clients={clients}
          tickets={tickets}
          profile={profile}
          stages={stages}
          onAddReminder={handleAddClientReminder}
          onUpdateReminder={handleEditClientReminder}
          onRemoveReminder={handleRemoveClientReminder}
          onRegisterContact={handleRegisterContact}
          onCompleteMeeting={handleCompleteMeeting}
          onNavigate={handleNavigate}
        />
      );
    }

    if (currentRoute === 'kanban') {
      return (
        <KanbanView
          clients={clients}
          stages={stages}
          onUpdateClientStage={handleUpdateClientStage}
          onUpdateClientNextAction={handleUpdateClientNextAction}
          onEditStage={handleEditStage}
          onRemoveStage={handleRemoveStage}
          onRemoveClient={handleRemoveClient}
          onNavigate={handleNavigate}
        />
      );
    }

    if (currentRoute === 'clientes') {
      return (
        <ClientsListView
          clients={clients}
          plans={plans}
          modules={modules}
          tickets={tickets}
          stages={stages}
          profile={profile}
          onAddClient={handleAddClient}
          onImportClients={handleImportClients}
          onNavigate={handleNavigate}
          onUpdateClientStage={handleUpdateClientStage}
          onUpdateClientNextAction={handleUpdateClientNextAction}
          onUpdateClientCriticality={handleUpdateClientCriticality}
          onRegisterContact={handleRegisterContact}
          onOpenNewLeadModal={() => setIsNewLeadModalOpen(true)}
          onEditStage={handleEditStage}
          onRemoveStage={handleRemoveStage}
        />
      );
    }

    // Dynamic Route: clientes/:id
    if (currentRoute.startsWith('clientes/')) {
      const clientId = currentRoute.split('/')[1];
      const client = clients.find(c => c.id === clientId);
      if (client) {
        return (
          <ClientDetailView
            client={client}
            plans={plans}
            modules={modules}
            stages={stages}
            profile={profile}
            availableOffers={offers}
            onUpdateClient={handleUpdateClient}
            onRegisterContact={handleRegisterContact}
            onAddReminder={handleAddClientReminder}
            onEditReminder={handleEditClientReminder}
            onRemoveReminder={handleRemoveClientReminder}
            onUpdateChecklist={handleUpdateClientChecklist}
            onCompleteTask={handleCompleteClientTask}
            tickets={tickets.filter(t => t.clientId === client.id)}
            onAddTicket={handleAddTicket}
            onUpdateTicketStatus={handleUpdateTicketStatus}
            onUpdateTicketLink={handleUpdateTicketLink}
            onNavigate={handleNavigate}
          />
        );
      } else {
        return (
          <div className="empty-state">
            <span className="empty-state-icon">⚠️</span>
            <p>Cliente não encontrado.</p>
            <button className="btn-secondary" onClick={() => handleNavigate('clientes')}>Voltar para lista</button>
          </div>
        );
      }
    }

    if (currentRoute === 'agenda') {
      return <AgendaView clients={clients} accountEmail={session.user.email} profile={profile} onUpdateClient={handleUpdateClient} />;
    }

    if (currentRoute === 'tarefas') {
      return (
        <TarefasView
          clients={clients}
          tickets={tickets}
          standaloneTasks={standaloneTasks}
          stages={stages}
          profile={profile}
          onNavigate={handleNavigate}
          onCompleteClientNextAction={handleCompleteClientNextAction}
          onSnoozeClientNextContact={handleSnoozeClientNextContact}
          onRemoveClientReminder={handleRemoveClientReminder}
          onSnoozeClientReminder={handleSnoozeClientReminder}
          onEditClientReminder={handleEditClientReminder}
          onCompleteClientTask={handleCompleteClientTask}
          onUncompleteClientTask={handleUncompleteClientTask}
          onSnoozeClientTask={handleSnoozeClientTask}
          onEditClientTask={handleEditClientTask}
          onDeleteClientTask={handleDeleteClientTask}
          onResolveTicket={handleResolveTicket}
          onRemoveTicket={handleRemoveTicket}
          onAddStandaloneTask={handleAddStandaloneTask}
          onToggleStandaloneTask={handleToggleStandaloneTask}
          onSnoozeStandaloneTask={handleSnoozeStandaloneTask}
          onEditStandaloneTask={handleEditStandaloneTask}
          onDeleteStandaloneTask={handleDeleteStandaloneTask}
        />
      );
    }

    if (currentRoute === 'oportunidades') {
      return (
        <OportunidadesView
          clients={clients}
          onNavigate={handleNavigate}
          onUpdateClient={handleUpdateClient}
        />
      );
    }

    if (currentRoute === 'suporte') {
      return (
        <SuporteView
          clients={clients}
          tickets={tickets}
          onAddTicket={handleAddTicket}
          onUpdateTicketStatus={handleUpdateTicketStatus}
          onUpdateTicketLink={handleUpdateTicketLink}
          onRemoveTicket={handleRemoveTicket}
          onNavigate={handleNavigate}
        />
      );
    }

    if (currentRoute === 'configuracoes') {
      return (
        <ConfiguracoesView
          profile={profile}
          onUpdateProfile={handleUpdateProfile}
          accountEmail={session.user.email}
          onSignOut={handleSignOut}
          plans={plans}
          onAddPlan={handleAddPlan}
          onEditPlan={handleEditPlan}
          onRemovePlan={handleRemovePlan}
          modules={modules}
          onAddModule={handleAddModule}
          onEditModule={handleEditModule}
          onRemoveModule={handleRemoveModule}
          onUpdateModuleChecklist={handleUpdateModuleChecklist}
          offers={offers}
          onAddOffer={handleAddOffer}
          onEditOffer={handleEditOffer}
          onRemoveOffer={handleRemoveOffer}
          stages={stages}
          onAddStage={handleAddStage}
          onEditStage={handleEditStage}
          onRemoveStage={handleRemoveStage}
          onReorderStages={handleReorderStages}
        />
      );
    }

    return (
      <div className="empty-state">
        <span className="empty-state-icon">⚠️</span>
        <p>Página não encontrada.</p>
        <button className="btn-secondary" onClick={() => handleNavigate('dashboard')}>Ir para o Dashboard</button>
      </div>
    );
  };

  const getPageTitle = () => {
    if (currentRoute === 'dashboard') return 'Dashboard Geral';
    if (currentRoute === 'kanban') return 'Quadro Kanban';
    if (currentRoute === 'clientes') return 'Lista de Clientes';
    if (currentRoute.startsWith('clientes/')) return 'Detalhes do Cliente';
    if (currentRoute === 'agenda') return 'Agenda';
    if (currentRoute === 'tarefas') return 'Minha Fila Hoje';
    if (currentRoute === 'oportunidades') return 'Oportunidades';
    if (currentRoute === 'suporte') return 'Central de Suporte';
    if (currentRoute === 'configuracoes') return 'Configurações do Sistema';
    return 'JetFlow';
  };

  if (session === undefined || (session && !dataReady)) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-primary)', color: 'var(--text-secondary)', fontSize: '13px' }}>
        Carregando...
      </div>
    );
  }

  if (!session) {
    return <Auth />;
  }

  return (
    <div className="app-layout">
      <Sidebar
        currentRoute={currentRoute}
        onNavigate={handleNavigate}
        profile={profile}
        clients={clients}
        offers={offers}
        onOpenNewLeadModal={() => setIsNewLeadModalOpen(true)}
        onAddClientTask={handleAddClientTask}
        onAddClientOffer={handleAddClientOffer}
        onAddTicket={handleAddTicket}
        onUpdateClient={handleUpdateClient}
        onUpdateChecklist={handleUpdateClientChecklist}
      />
      <main className="main-container">
        <div className="view-header">
          <h2 className="view-title">{getPageTitle()}</h2>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* Notification Bell */}
            <div className="notification-wrapper">
              <button 
                className="notification-bell" 
                onClick={() => setShowNotifications(!showNotifications)}
                title="Central de Alertas de Contatos e Lembretes"
              >
                <Bell size={20} />
                {alertNotifications.length > 0 && (
                  <span className="notification-badge">{alertNotifications.length}</span>
                )}
              </button>

              {showNotifications && (
                <>
                  <div 
                    style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999 }}
                    onClick={() => setShowNotifications(false)}
                  />
                  <div className="notification-dropdown" onClick={(e) => e.stopPropagation()}>
                    <div className="notification-header">
                      <span>Lembretes Vencidos ou Hoje ({alertNotifications.length})</span>
                      <button className="btn-icon" style={{ width: '24px', height: '24px' }} onClick={() => setShowNotifications(false)}>
                        <X size={12} />
                      </button>
                    </div>
                    <div className="notification-list">
                      {alertNotifications.length === 0 ? (
                        <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>
                          Nenhum lembrete atrasado ou vencendo hoje.
                        </div>
                      ) : (
                        alertNotifications.map(item => (
                          <div key={item.id} className="notification-item">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <strong style={{ color: 'var(--text-primary)' }}>{item.clientName}</strong>
                              <span className={item.status === 'overdue' ? 'date-overdue' : 'date-today'} style={{ fontSize: '11px' }}>
                                {item.status === 'overdue' ? 'Atrasado' : 'Hoje'} ({item.deadline})
                              </span>
                            </div>
                            <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>{item.title}</span>
                            <button 
                              className="btn-primary" 
                              style={{ padding: '4px 8px', fontSize: '11px', alignSelf: 'flex-start', marginTop: '4px' }}
                              onClick={() => {
                                if (item.type === 'custom') {
                                  handleRemoveClientReminder(item.clientId, item.id);
                                } else {
                                  handleRegisterContact(item.clientId, 'Contato de ciclo registrado');
                                }
                              }}
                            >
                              Registrar Contato
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        {renderView()}
      </main>

      {/* Global New Lead Modal */}
      {isNewLeadModalOpen && (
        <div className="modal-overlay" onClick={() => setIsNewLeadModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Cadastrar Novo Cliente</h3>
              <button className="btn-icon" onClick={() => setIsNewLeadModalOpen(false)}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              const nextContact = calculateNextContactDate(newCriticality, newEntryDate);
              
              // Populate checklists from each module's configured template
              const clientChecklists = {};
              newSelectedModules.forEach(mod => {
                const modObj = modules.find(m => m.name === mod);
                clientChecklists[mod] = modObj?.checklist
                  ? JSON.parse(JSON.stringify(modObj.checklist))
                  : [];
              });

              const newClient = {
                id: `c_${Date.now()}`,
                name: newName,
                cnpj: newCnpj,
                phone: newPhone,
                whatsapp: newWhatsapp,
                email: newEmail,
                entryDate: newEntryDate,
                plan: newPlan,
                criticality: newCriticality,
                criticalityJustification: newJustification,
                activeModules: newSelectedModules,
                observations: newObservations,
                responsible: profile.name,
                stage: 'Novo',
                nextAction: 'Reunião de Alinhamento inicial',
                nextContactDate: nextContact,
                checklists: clientChecklists,
                checklistBaseline: JSON.parse(JSON.stringify(clientChecklists)),
                reminders: [],
                lastUpdated: {
                  date: getTodayBR(),
                  time: getNowTimeBR(),
                  user: profile.name
                },
                lastContacts: [
                  { date: newEntryDate, obs: 'Cliente cadastrado no sistema.' }
                ],
                activityHistory: [
                  { avatar: profile.avatarInitials, name: profile.name, action: 'Criou o cliente no sistema', date: `${newEntryDate} às ${getNowTimeBR()}`, isObservation: false }
                ],
                quickLinks: {
                  crm: '',
                  discordIntegration: '',
                  discordSupport: [],
                  site: '',
                  deskPlatformUrl: '',
                  deskPlatformEmail: ''
                }
              };

              handleAddClient(newClient);
              
              // Reset
              setNewName('');
              setNewCnpj('');
              setNewPhone('');
              setNewWhatsapp('');
              setNewEmail('');
              setNewEntryDate(getTodayBR());
              setNewPlan('Pro');
              setNewCriticality('Estável');
              setNewJustification('');
              setNewSelectedModules([]);
              setNewObservations('');
              setIsNewLeadModalOpen(false);
            }}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Nome do Cliente *</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={newName} 
                      onChange={e => setNewName(e.target.value)} 
                      placeholder="Razão Social ou Nome Fantasia"
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">CNPJ</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={newCnpj} 
                      onChange={e => setNewCnpj(e.target.value)} 
                      placeholder="00.000.000/0001-00"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Telefone</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={newPhone} 
                      onChange={e => setNewPhone(e.target.value)} 
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">WhatsApp</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={newWhatsapp} 
                      onChange={e => setNewWhatsapp(e.target.value)} 
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">E-mail</label>
                    <input 
                      type="email" 
                      className="form-input" 
                      value={newEmail} 
                      onChange={e => setNewEmail(e.target.value)} 
                      placeholder="contato@cliente.com"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Data de Entrada</label>
                    <CustomDatePicker value={newEntryDate} onChange={setNewEntryDate} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Plano</label>
                    <CustomSelect value={newPlan} onChange={setNewPlan} options={plans.map(p => ({ value: p.name, label: p.name }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Nível de Criticidade</label>
                    <CustomSelect value={newCriticality} onChange={setNewCriticality} options={['Estável', 'Atenção', 'Crítico']} />
                  </div>
                  {newCriticality !== 'Estável' && (
                    <div className="form-group full-width">
                      <label className="form-label">Justificativa da Criticidade *</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        value={newJustification} 
                        onChange={e => setNewJustification(e.target.value)}
                        placeholder="Descreva o motivo de atenção/crítico..."
                        required
                      />
                    </div>
                  )}
                  <div className="form-group full-width">
                    <label className="form-label">Módulos Contratados</label>
                    <div className="checkbox-group">
                      {modules.map(mod => (
                        <label key={mod.id} className="checkbox-label">
                          <input
                            type="checkbox"
                            className="premium-check"
                            checked={newSelectedModules.includes(mod.name)}
                            onChange={() => {
                              setNewSelectedModules(prev => 
                                prev.includes(mod.name) ? prev.filter(m => m !== mod.name) : [...prev, mod.name]
                              );
                            }}
                          />
                          <span>{mod.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="form-group full-width">
                    <label className="form-label">Observações</label>
                    <textarea 
                      className="form-textarea" 
                      rows="3" 
                      value={newObservations} 
                      onChange={e => setNewObservations(e.target.value)} 
                      placeholder="Observações gerais adicionais..."
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setIsNewLeadModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn-primary">Criar Cliente</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
