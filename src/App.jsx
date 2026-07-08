import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import DashboardView from './components/DashboardView';
import KanbanView from './components/KanbanView';
import ClientsListView from './components/ClientsListView';
import ClientDetailView from './components/ClientDetailView';
import ConfiguracoesView from './components/ConfiguracoesView';

import { 
  initialProfile, 
  initialPlans, 
  initialModules, 
  initialAvailableOffers, 
  initialClients,
  initialStages
} from './data/data';

import { 
  calculateNextContactDate, 
  getDateStatus 
} from './utils';

import { Bell, X, Plus, AlertTriangle, AlertCircle, Flame, Star, Check } from 'lucide-react';
import CustomDatePicker from './components/CustomDatePicker';
import PremiumSelect from './components/PremiumSelect';
import { moduleChecklistsTemplate } from './data/data';

// Helper: load from localStorage or fall back to default
function loadFromStorage(key, fallback) {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
}

export default function App() {
  const [currentRoute, setCurrentRoute] = useState('dashboard');
  
  // Application Local State (Single source of truth) — persisted via localStorage
  const [profile, setProfile] = useState(() => loadFromStorage('jf_profile', initialProfile));
  const [plans, setPlans] = useState(() => loadFromStorage('jf_plans', initialPlans));
  const [modules, setModules] = useState(() => loadFromStorage('jf_modules', initialModules));
  const [offers, setOffers] = useState(() => loadFromStorage('jf_offers', initialAvailableOffers));
  const [clients, setClients] = useState(() => loadFromStorage('jf_clients', initialClients));
  const [stages, setStages] = useState(() => loadFromStorage('jf_stages', initialStages));
  const [showNotifications, setShowNotifications] = useState(false);
  const [completedIds, setCompletedIds] = useState([]);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Auto-save to localStorage whenever state changes
  useEffect(() => { localStorage.setItem('jf_profile', JSON.stringify(profile)); }, [profile]);
  useEffect(() => { localStorage.setItem('jf_plans', JSON.stringify(plans)); }, [plans]);
  useEffect(() => { localStorage.setItem('jf_modules', JSON.stringify(modules)); }, [modules]);
  useEffect(() => { localStorage.setItem('jf_offers', JSON.stringify(offers)); }, [offers]);
  useEffect(() => { localStorage.setItem('jf_clients', JSON.stringify(clients)); }, [clients]);
  useEffect(() => { localStorage.setItem('jf_stages', JSON.stringify(stages)); }, [stages]);

  const toggleCompletedId = (id) => {
    setCompletedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // Global Action Modals states
  const [activeActionModal, setActiveActionModal] = useState(null); // 'lead' | 'task' | 'offer' | 'note' | null
  const [readNotifications, setReadNotifications] = useState([]);

  // Novo Lead Form State
  const [newName, setNewName] = useState('');
  const [newCnpj, setNewCnpj] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newWhatsapp, setNewWhatsapp] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newEntryDate, setNewEntryDate] = useState('30/06/2026');
  const [newPlan, setNewPlan] = useState('Pro');
  const [newCriticality, setNewCriticality] = useState('Estável');
  const [newJustification, setNewJustification] = useState('');
  const [newSelectedModules, setNewSelectedModules] = useState([]);
  const [newObservations, setNewObservations] = useState('');

  // Nova Tarefa Form State
  const [taskTitle, setTaskTitle] = useState('');
  const [taskClientId, setTaskClientId] = useState('');
  const [taskDeadline, setTaskDeadline] = useState('30/06/2026');
  const [taskCriticality, setTaskCriticality] = useState('Normal');

  // Nova Oferta Form State
  const [offerClientId, setOfferClientId] = useState('');
  const [offerName, setOfferName] = useState('');
  const [offerStatus, setOfferStatus] = useState('Interessado');

  // Anotação Rápida Form State
  const [noteClientId, setNoteClientId] = useState('');
  const [noteText, setNoteText] = useState('');

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
  const handleUpdateProfile = (updatedProfile) => {
    setProfile(updatedProfile);
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

  const handleEditModule = (id, updates) => {
    // updates can be { name, emoji } or just a string (legacy)
    const updateObj = typeof updates === 'string' ? { name: updates } : updates;
    setModules(prev => prev.map(m => m.id === id ? { ...m, ...updateObj } : m));
    if (updateObj.name) {
      setClients(prev => prev.map(c => {
        const oldModObj = modules.find(m => m.id === id);
        if (oldModObj && c.activeModules.includes(oldModObj.name)) {
          return {
            ...c,
            activeModules: c.activeModules.map(mName => mName === oldModObj.name ? updateObj.name : mName)
          };
        }
        return c;
      }));
    }
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

  // Contact cycle handler: updates nextContactDate automatically starting from 30/06/2026
  const handleRegisterContact = (clientId, obsText = '') => {
    setClients(prev => prev.map(c => {
      if (c.id === clientId) {
        const nextContact = calculateNextContactDate(c.criticality, '30/06/2026');
        const nextMeet = {
          id: `meet_${Date.now()}`,
          date: '30/06/2026',
          time: '12:00',
          title: obsText.trim() ? `Contato: ${obsText}` : 'Contato periódico realizado'
        };
        return {
          ...c,
          nextContactDate: nextContact,
          meetings: [nextMeet, ...(c.meetings || [])]
        };
      }
      return c;
    }));
  };

  const handleUpdateClientCriticality = (clientId, newCriticality) => {
    setClients(prev => prev.map(c => {
      if (c.id === clientId) {
        const nextContact = calculateNextContactDate(newCriticality, '30/06/2026');
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

  const handleAddClientTask = (clientId, text, deadline) => {
    setClients(prev => prev.map(c => {
      if (c.id === clientId) {
        const newTask = {
          id: `task_${Date.now()}`,
          text,
          deadline
        };
        return {
          ...c,
          tasks: [...(c.tasks || []), newTask]
        };
      }
      return c;
    }));
  };

  const handleAddClientOffer = (clientId, name, status) => {
    setClients(prev => prev.map(c => {
      if (c.id === clientId) {
        const newOffer = {
          id: `io_${Date.now()}`,
          name,
          status
        };
        return {
          ...c,
          interestOffers: [...(c.interestOffers || []), newOffer]
        };
      }
      return c;
    }));
  };

  const handleAddClientNote = (clientId, text) => {
    setClients(prev => prev.map(c => {
      if (c.id === clientId) {
        const newNote = {
          avatar: profile.avatarInitials,
          name: profile.name,
          action: `Anotação Rápida: ${text}`,
          date: `30/06/2026 às 12:00`,
          isObservation: true
        };
        return {
          ...c,
          activityHistory: [newNote, ...(c.activityHistory || [])]
        };
      }
      return c;
    }));
  };

  // Gather rich notifications
  const alertNotifications = [];
  clients.forEach(c => {
    // 1. SLA contact reminders (bell icon)
    if (c.nextContactDate) {
      const status = getDateStatus(c.nextContactDate, '30/06/2026');
      if (status === 'overdue' || status === 'today') {
        alertNotifications.push({
          id: `cycle_${c.id}`,
          type: 'cycle',
          iconType: 'lembrete', // sino
          clientId: c.id,
          clientName: c.name,
          title: `Contato Periódico (${c.criticality})`,
          text: `Contato periódico de ciclo (${c.criticality}) necessário.`,
          deadline: c.nextContactDate,
          relativeTime: status === 'overdue' ? 'Atrasado' : 'Hoje',
          status
        });
      }
    }
    // 2. Custom reminders (bell icon)
    if (c.reminders) {
      c.reminders.forEach(r => {
        const status = getDateStatus(r.deadline, '30/06/2026');
        if (status === 'overdue' || status === 'today') {
          alertNotifications.push({
            id: r.id,
            type: 'custom',
            iconType: 'lembrete', // sino
            clientId: c.id,
            clientName: c.name,
            title: r.title,
            text: r.title,
            deadline: r.deadline,
            relativeTime: status === 'overdue' ? 'Atrasado' : 'Hoje',
            status
          });
        }
      });
    }
    // 3. Cliente crítico (fogo)
    if (c.criticality === 'Crítico') {
      alertNotifications.push({
        id: `crit_${c.id}`,
        type: 'critical',
        iconType: 'critico', // fogo
        clientId: c.id,
        clientName: c.name,
        title: `Cliente Crítico`,
        text: `SLA Crítico: ${c.name} exige atenção imediata!`,
        deadline: c.nextContactDate || '30/06/2026',
        relativeTime: 'Urgente',
        status: 'overdue'
      });
    }
    // 4. Nova oferta (estrela)
    if (c.interestOffers) {
      c.interestOffers.forEach(o => {
        if (o.status === 'Interessado') {
          alertNotifications.push({
            id: `off_${c.id}_${o.id}`,
            type: 'offer',
            iconType: 'oferta', // estrela
            clientId: c.id,
            clientName: c.name,
            title: `Nova Oferta`,
            text: `Interesse demonstrado por ${c.name} em ${o.name}.`,
            deadline: '30/06/2026',
            relativeTime: 'Recente',
            status: 'today'
          });
        }
      });
    }
    // 5. Tarefa vencida (alerta)
    if (c.tasks) {
      c.tasks.forEach(t => {
        const status = getDateStatus(t.deadline, '30/06/2026');
        if (status === 'overdue' || status === 'today') {
          alertNotifications.push({
            id: t.id,
            type: 'task',
            iconType: 'tarefa', // alerta
            clientId: c.id,
            clientName: c.name,
            title: `Tarefa pendente`,
            text: `Tarefa vencida: ${t.text}`,
            deadline: t.deadline,
            relativeTime: status === 'overdue' ? 'Atrasada' : 'Hoje',
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
          onAddReminder={handleAddClientReminder}
          onUpdateReminder={handleEditClientReminder}
          onRemoveReminder={handleRemoveClientReminder}
          onRegisterContact={handleRegisterContact}
          onNavigate={handleNavigate}
          completedIds={completedIds}
          onToggleCompleted={toggleCompletedId}
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
          onAddClient={handleAddClient}
          onNavigate={handleNavigate}
          onUpdateClientStage={handleUpdateClientStage}
          onUpdateClientNextAction={handleUpdateClientNextAction}
          onUpdateClientCriticality={handleUpdateClientCriticality}
          onRegisterContact={handleRegisterContact}
          onOpenNewLeadModal={() => setActiveActionModal('lead')}
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
            availableOffers={offers}
            onUpdateClient={handleUpdateClient}
            onRegisterContact={handleRegisterContact}
            onAddReminder={handleAddClientReminder}
            onEditReminder={handleEditClientReminder}
            onRemoveReminder={handleRemoveClientReminder}
            onUpdateChecklist={handleUpdateClientChecklist}
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

    if (currentRoute === 'configuracoes') {
      return (
        <ConfiguracoesView 
          profile={profile}
          onUpdateProfile={handleUpdateProfile}
          plans={plans}
          onAddPlan={handleAddPlan}
          onEditPlan={handleEditPlan}
          onRemovePlan={handleRemovePlan}
          modules={modules}
          onAddModule={handleAddModule}
          onEditModule={handleEditModule}
          onRemoveModule={handleRemoveModule}
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
    if (currentRoute === 'configuracoes') return 'Configurações do Sistema';
    return 'JetFlow';
  };

  return (
    <div className="app-layout">
      {/* Mobile sidebar overlay */}
      {mobileSidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setMobileSidebarOpen(false)} />
      )}

      <Sidebar 
        currentRoute={currentRoute} 
        onNavigate={(route) => { handleNavigate(route); setMobileSidebarOpen(false); }} 
        profile={profile}
        clients={clients}
        isOpen={mobileSidebarOpen}
        onOpenAction={(type) => {
          // Reset fields when opening modals
          if (type === 'task') {
            setTaskTitle('');
            setTaskClientId(clients[0]?.id || '');
            setTaskDeadline('30/06/2026');
            setTaskCriticality('Normal');
          } else if (type === 'offer') {
            setOfferClientId(clients[0]?.id || '');
            setOfferName(offers[0]?.name || '');
            setOfferStatus('Interessado');
          } else if (type === 'note') {
            setNoteClientId(clients[0]?.id || '');
            setNoteText('');
          }
          setActiveActionModal(type);
          setMobileSidebarOpen(false);
        }}
      />

      <main className="main-container">
        <div className="view-header">
          {/* Hamburger — only visible on mobile via CSS */}
          <button
            className="mobile-menu-btn"
            onClick={() => setMobileSidebarOpen(true)}
            aria-label="Abrir menu"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
          <h2 className="view-title">{getPageTitle()}</h2>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* Notification Bell */}
            <div className="notification-wrapper" style={{ position: 'relative' }}>
              <button 
                className="notification-bell" 
                onClick={() => setShowNotifications(!showNotifications)}
                title="Central de Alertas"
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#fff',
                  cursor: 'pointer',
                  position: 'relative',
                  padding: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 150ms ease'
                }}
              >
                <Bell size={20} />
                {alertNotifications.filter(n => !readNotifications.includes(n.id)).length > 0 && (
                  <span className="notification-badge" style={{
                    position: 'absolute',
                    top: '2px',
                    right: '2px',
                    backgroundColor: '#65FF4B',
                    color: '#000',
                    borderRadius: '50%',
                    width: '16px',
                    height: '16px',
                    fontSize: '10px',
                    fontWeight: '700',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {alertNotifications.filter(n => !readNotifications.includes(n.id)).length}
                  </span>
                )}
              </button>

              {showNotifications && (
                <>
                  <div 
                    style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999 }}
                    onClick={() => setShowNotifications(false)}
                  />
                  <div className="notification-dropdown" style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    width: '360px',
                    backgroundColor: '#161616',
                    borderRadius: '14px',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    boxShadow: '0 8px 40px rgba(0,0,0,0.6), 0 1px 0 rgba(255,255,255,0.04) inset',
                    zIndex: 1000,
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    animation: 'premiumDropdownOpen 200ms cubic-bezier(0.16, 1, 0.3, 1)',
                    transformOrigin: 'top right'
                  }} onClick={(e) => e.stopPropagation()}>
                    
                    {/* Header */}
                    <div className="notification-header" style={{
                      padding: '14px 16px',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <span style={{ fontSize: '13px', fontWeight: '700', color: '#FFF' }}>Notificações</span>
                      <button 
                        onClick={() => setReadNotifications(alertNotifications.map(n => n.id))}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#65FF4B',
                          fontSize: '12px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          padding: 0
                        }}
                      >
                        Marcar todas como lidas
                      </button>
                    </div>

                    {/* List */}
                    <div className="notification-list" style={{ maxHeight: '320px', overflowY: 'auto' }}>
                      {alertNotifications.length === 0 ? (
                        <div style={{ padding: '32px', textAlign: 'center', color: '#555', fontSize: '13px' }}>
                          Nenhuma notificação no momento.
                        </div>
                      ) : (
                        alertNotifications.map(item => {
                          const isUnread = !readNotifications.includes(item.id);
                          
                          // Determine icon colored by type
                          let icon = <Bell size={16} style={{ color: '#A78BFA' }} />; // Lembrete default (sino)
                          if (item.iconType === 'tarefa') {
                            icon = <AlertTriangle size={16} style={{ color: '#F59E0B' }} />; // Tarefa vencida (alerta)
                          } else if (item.iconType === 'critico') {
                            icon = <Flame size={16} style={{ color: '#EF4444' }} />; // Cliente crítico (fogo)
                          } else if (item.iconType === 'oferta') {
                            icon = <Star size={16} style={{ color: '#65FF4B' }} />; // Nova oferta (estrela)
                          }

                          return (
                            <div 
                              key={item.id} 
                              onClick={() => {
                                // Mark as read and navigate
                                if (!readNotifications.includes(item.id)) {
                                  setReadNotifications(prev => [...prev, item.id]);
                                }
                                handleNavigate(`clientes/${item.clientId}`);
                                setShowNotifications(false);
                              }}
                              style={{
                                display: 'flex',
                                gap: '12px',
                                padding: '12px 16px',
                                borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                                cursor: 'pointer',
                                transition: 'all 150ms ease',
                                backgroundColor: isUnread ? 'rgba(101, 255, 75, 0.04)' : 'transparent',
                                position: 'relative'
                              }}
                              className="notification-item-hover"
                            >
                              <div style={{ flexShrink: 0, marginTop: '2px' }}>
                                {icon}
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1, paddingRight: isUnread ? '12px' : '0' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span style={{ fontSize: '12px', fontWeight: '700', color: '#FFF' }}>{item.clientName}</span>
                                  <span style={{ fontSize: '10px', color: '#666', fontWeight: '600' }}>{item.relativeTime}</span>
                                </div>
                                <span style={{ fontSize: '12px', color: '#888', lineHeight: '1.4' }}>{item.text}</span>
                              </div>
                              {isUnread && (
                                <div style={{
                                  position: 'absolute',
                                  right: '16px',
                                  top: '50%',
                                  transform: 'translateY(-50%)',
                                  width: '6px',
                                  height: '6px',
                                  borderRadius: '50%',
                                  backgroundColor: '#65FF4B'
                                }} />
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Footer */}
                    <div style={{
                      padding: '10px',
                      borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                      display: 'flex',
                      justifyContent: 'center'
                    }}>
                      <button
                        onClick={() => {
                          setShowNotifications(false);
                          handleNavigate('dashboard');
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#888',
                          fontSize: '11px',
                          fontWeight: '700',
                          cursor: 'pointer',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em'
                        }}
                      >
                        Ver todas
                      </button>
                    </div>

                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        {renderView()}
      </main>

      {/* MODAL 1: Novo Lead */}
      {activeActionModal === 'lead' && (
        <div className="modal-overlay" onClick={() => setActiveActionModal(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Cadastrar Novo Cliente</h3>
              <button className="btn-icon" onClick={() => setActiveActionModal(null)}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              const nextContact = calculateNextContactDate(newCriticality, newEntryDate);
              
              // Populate checklists
              const clientChecklists = {};
              newSelectedModules.forEach(mod => {
                clientChecklists[mod] = moduleChecklistsTemplate[mod] 
                  ? JSON.parse(JSON.stringify(moduleChecklistsTemplate[mod])) 
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
                stage: 'Novo',
                nextAction: 'Reunião de Alinhamento inicial',
                nextContactDate: nextContact,
                checklists: clientChecklists,
                reminders: [],
                lastUpdated: {
                  date: '30/06/2026',
                  time: '12:00',
                  user: profile.name
                },
                lastContacts: [
                  { date: newEntryDate, obs: 'Cliente cadastrado no sistema.' }
                ],
                activityHistory: [
                  { avatar: profile.avatarInitials, name: profile.name, action: 'Criou o cliente no sistema', date: `${newEntryDate} às 12:00`, isObservation: false }
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
              setNewEntryDate('30/06/2026');
              setNewPlan('Pro');
              setNewCriticality('Estável');
              setNewJustification('');
              setNewSelectedModules([]);
              setNewObservations('');
              setActiveActionModal(null);
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
                    <PremiumSelect 
                      value={newPlan} 
                      onChange={setNewPlan}
                      options={plans.map(p => ({ value: p.name, label: p.name }))}
                      placeholder="Selecione o plano"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Nível de Criticidade</label>
                    <PremiumSelect 
                      value={newCriticality} 
                      onChange={setNewCriticality}
                      options={[
                        { value: 'Estável', label: 'Estável', colorBar: '#10B981' },
                        { value: 'Atenção', label: 'Atenção', colorBar: '#F59E0B' },
                        { value: 'Crítico', label: 'Crítico', colorBar: '#EF4444' }
                      ]}
                      placeholder="Selecione a criticidade"
                    />
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
                    <label className="form-label">
                      Módulos Contratados
                      {newSelectedModules.length > 0 && (
                        <span style={{
                          marginLeft: '8px',
                          fontSize: '10px',
                          fontWeight: '700',
                          color: 'var(--green-primary)',
                          backgroundColor: 'rgba(101,255,75,0.1)',
                          border: '1px solid rgba(101,255,75,0.2)',
                          borderRadius: '10px',
                          padding: '1px 7px',
                          letterSpacing: '0.3px'
                        }}>
                          {newSelectedModules.length} selecionado{newSelectedModules.length > 1 ? 's' : ''}
                        </span>
                      )}
                    </label>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                      gap: '10px',
                      marginTop: '4px'
                    }}>
                      {modules.map(mod => {
                        const isSelected = newSelectedModules.includes(mod.name);
                        const icon = mod.emoji || '📦';
                        return (
                          <div
                            key={mod.id}
                            onClick={() => {
                              setNewSelectedModules(prev =>
                                prev.includes(mod.name) ? prev.filter(m => m !== mod.name) : [...prev, mod.name]
                              );
                            }}
                            style={{
                              position: 'relative',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '8px',
                              padding: '14px 14px 12px',
                              borderRadius: '10px',
                              border: isSelected
                                ? '1.5px solid var(--green-primary)'
                                : '1.5px solid #2A2A2A',
                              backgroundColor: isSelected ? 'rgba(101,255,75,0.05)' : '#1A1A1A',
                              cursor: 'pointer',
                              transition: 'all 180ms cubic-bezier(0.16,1,0.3,1)',
                              transform: 'translateY(0)',
                              boxShadow: isSelected ? '0 0 0 1px rgba(101,255,75,0.15)' : 'none',
                              userSelect: 'none',
                            }}
                            onMouseEnter={e => {
                              if (!isSelected) {
                                e.currentTarget.style.borderColor = '#3A3A3A';
                                e.currentTarget.style.backgroundColor = '#202020';
                              }
                              e.currentTarget.style.transform = 'translateY(-1px)';
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.borderColor = isSelected ? 'var(--green-primary)' : '#2A2A2A';
                              e.currentTarget.style.backgroundColor = isSelected ? 'rgba(101,255,75,0.05)' : '#1A1A1A';
                              e.currentTarget.style.transform = 'translateY(0)';
                            }}
                          >
                            {/* Check badge top-right */}
                            <div style={{
                              position: 'absolute',
                              top: '10px',
                              right: '10px',
                              width: '16px',
                              height: '16px',
                              borderRadius: '50%',
                              border: isSelected ? 'none' : '1.5px solid #3A3A3A',
                              backgroundColor: isSelected ? 'var(--green-primary)' : 'transparent',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 200ms ease',
                              flexShrink: 0,
                            }}>
                              {isSelected && <Check size={9} strokeWidth={4} color="#000" />}
                            </div>

                            {/* Icon */}
                            <span style={{ fontSize: '20px', lineHeight: 1 }}>{icon}</span>

                            {/* Name */}
                            <span style={{
                              fontSize: '12px',
                              fontWeight: '600',
                              color: isSelected ? '#fff' : '#999',
                              lineHeight: 1.3,
                              transition: 'color 180ms ease',
                              paddingRight: '18px',
                            }}>
                              {mod.name}
                            </span>
                          </div>
                        );
                      })}
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
                <button type="button" className="btn-secondary" onClick={() => setActiveActionModal(null)}>Cancelar</button>
                <button type="submit" className="btn-primary">Criar Cliente</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Nova Tarefa */}
      {activeActionModal === 'task' && (
        <div className="modal-overlay" onClick={() => setActiveActionModal(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Criar Nova Tarefa</h3>
              <button className="btn-icon" onClick={() => setActiveActionModal(null)}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              if (!taskClientId) {
                alert('Selecione um cliente!');
                return;
              }
              handleAddClientTask(taskClientId, taskTitle, taskDeadline);
              alert('Tarefa criada com sucesso!');
              setActiveActionModal(null);
            }}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Título da Tarefa *</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={taskTitle} 
                    onChange={e => setTaskTitle(e.target.value)} 
                    placeholder="Ex: Enviar credenciais de acesso"
                    required 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Cliente associado *</label>
                  <PremiumSelect 
                    value={taskClientId}
                    onChange={setTaskClientId}
                    options={clients.map(c => {
                      let color = '#10B981';
                      if (c.criticality === 'Crítico') color = '#EF4444';
                      if (c.criticality === 'Atenção') color = '#F59E0B';
                      return { value: c.id, label: c.name, colorBar: color };
                    })}
                    placeholder="Selecione o cliente"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Prazo final *</label>
                  <CustomDatePicker value={taskDeadline} onChange={setTaskDeadline} />
                </div>
                <div className="form-group">
                  <label className="form-label">Criticidade</label>
                  <PremiumSelect 
                    value={taskCriticality}
                    onChange={setTaskCriticality}
                    options={[
                      { value: 'Normal', label: 'Normal' },
                      { value: 'Urgente', label: 'Urgente' }
                    ]}
                    placeholder="Selecione a criticidade"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setActiveActionModal(null)}>Cancelar</button>
                <button type="submit" className="btn-primary">Criar Tarefa</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Nova Oferta */}
      {activeActionModal === 'offer' && (
        <div className="modal-overlay" onClick={() => setActiveActionModal(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Registrar Nova Oferta</h3>
              <button className="btn-icon" onClick={() => setActiveActionModal(null)}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              if (!offerClientId) {
                alert('Selecione um cliente!');
                return;
              }
              handleAddClientOffer(offerClientId, offerName, offerStatus);
              alert('Oferta registrada com sucesso!');
              setActiveActionModal(null);
            }}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Cliente associado *</label>
                  <PremiumSelect 
                    value={offerClientId}
                    onChange={setOfferClientId}
                    options={clients.map(c => {
                      let color = '#10B981';
                      if (c.criticality === 'Crítico') color = '#EF4444';
                      if (c.criticality === 'Atenção') color = '#F59E0B';
                      return { value: c.id, label: c.name, colorBar: color };
                    })}
                    placeholder="Selecione o cliente"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Nome da Oferta *</label>
                  <PremiumSelect 
                    value={offerName}
                    onChange={setOfferName}
                    options={offers.map(o => ({ value: o.name, label: o.name }))}
                    placeholder="Selecione a oferta"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Status do Interesse *</label>
                  <PremiumSelect 
                    value={offerStatus}
                    onChange={setOfferStatus}
                    options={[
                      { value: 'Interessado', label: 'Interessado' },
                      { value: 'Em análise', label: 'Em análise' },
                      { value: 'Convertido', label: 'Convertido' }
                    ]}
                    placeholder="Selecione o status"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setActiveActionModal(null)}>Cancelar</button>
                <button type="submit" className="btn-primary">Registrar Oferta</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: Anotação Rápida */}
      {activeActionModal === 'note' && (
        <div className="modal-overlay" onClick={() => setActiveActionModal(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Anotação Rápida</h3>
              <button className="btn-icon" onClick={() => setActiveActionModal(null)}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              if (!noteClientId) {
                alert('Selecione um cliente!');
                return;
              }
              handleAddClientNote(noteClientId, noteText);
              alert('Anotação registrada com sucesso!');
              setActiveActionModal(null);
            }}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Cliente associado *</label>
                  <PremiumSelect 
                    value={noteClientId}
                    onChange={setNoteClientId}
                    options={clients.map(c => {
                      let color = '#10B981';
                      if (c.criticality === 'Crítico') color = '#EF4444';
                      if (c.criticality === 'Atenção') color = '#F59E0B';
                      return { value: c.id, label: c.name, colorBar: color };
                    })}
                    placeholder="Selecione o cliente"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Texto da Anotação *</label>
                  <textarea 
                    className="form-textarea" 
                    rows="4" 
                    value={noteText} 
                    onChange={e => setNoteText(e.target.value)} 
                    placeholder="Escreva a anotação que ficará salva no histórico..."
                    required
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#666' }}>
                  <span>Data de registro: 30/06/2026 às 12:00</span>
                  <span>Salvo por: {profile.name}</span>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setActiveActionModal(null)}>Cancelar</button>
                <button type="submit" className="btn-primary">Registrar Anotação</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation Bar — CSS hides this on desktop */}
      <nav className="mobile-bottom-nav">
        <button
          className={`mobile-nav-btn ${currentRoute === 'dashboard' ? 'active' : ''}`}
          onClick={() => { handleNavigate('dashboard'); setMobileSidebarOpen(false); }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
            <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
          </svg>
          <span>Início</span>
        </button>

        <button
          className={`mobile-nav-btn ${currentRoute === 'kanban' ? 'active' : ''}`}
          onClick={() => { handleNavigate('kanban'); setMobileSidebarOpen(false); }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="5" height="18" rx="1"/><rect x="10" y="3" width="5" height="12" rx="1"/><rect x="17" y="3" width="5" height="15" rx="1"/>
          </svg>
          <span>Kanban</span>
        </button>

        {/* FAB: Nova Ação */}
        <button
          className="mobile-nav-fab"
          onClick={() => {
            setTaskTitle('');
            setTaskClientId(clients[0]?.id || '');
            setTaskDeadline('30/06/2026');
            setTaskCriticality('Normal');
            setActiveActionModal('lead');
          }}
          aria-label="Novo Lead"
        >
          <div className="mobile-nav-fab-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </div>
          <span style={{ fontSize: '8px', color: '#555', marginTop: '2px' }}>Novo</span>
        </button>

        <button
          className={`mobile-nav-btn ${currentRoute === 'clientes' || currentRoute.startsWith('clientes/') ? 'active' : ''}`}
          onClick={() => { handleNavigate('clientes'); setMobileSidebarOpen(false); }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          <span>Clientes</span>
        </button>

        <button
          className={`mobile-nav-btn ${currentRoute === 'configuracoes' ? 'active' : ''}`}
          onClick={() => { handleNavigate('configuracoes'); setMobileSidebarOpen(false); }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
          <span>Config</span>
        </button>
      </nav>

    </div>
  );
}
