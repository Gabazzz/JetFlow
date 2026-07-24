import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import DashboardView from './components/DashboardView';
import KanbanView from './components/KanbanView';
import ClientsListView from './components/ClientsListView';
import ClientDetailView from './components/ClientDetailView';
import ConfiguracoesView from './components/ConfiguracoesView';
import AuthView from './components/AuthView';

import { supabase, isSupabaseConfigured } from './lib/supabase';
import { 
  getProfileService,
  updateProfileService,
  getPlansService,
  addPlanService,
  editPlanService,
  removePlanService,
  getModulesService,
  addModuleService,
  editModuleService,
  removeModuleService,
  getOffersService,
  addOfferService,
  editOfferService,
  removeOfferService,
  getStagesService,
  addStageService,
  editStageService,
  removeStageService,
  reorderStagesService,
  getClientsService,
  createClientService,
  updateClientService,
  deleteClientService,
  toggleChecklistService,
  addReminderService,
  removeReminderService,
  addLastContactService,
  addActivityHistoryService
} from './services/jetflowService';

import { 
  initialProfile, 
  initialPlans, 
  initialModules, 
  initialAvailableOffers, 
  initialStages,
  moduleChecklistsTemplate 
} from './data/data';

import { 
  calculateNextContactDate, 
  getDateStatus 
} from './utils';

import { Bell, X, Plus, AlertTriangle, AlertCircle, Flame, Star, Check } from 'lucide-react';
import CustomDatePicker from './components/CustomDatePicker';
import PremiumSelect from './components/PremiumSelect';

export default function App() {
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);

  const [currentRoute, setCurrentRoute] = useState('dashboard');
  
  // Application State
  const [profile, setProfile] = useState(initialProfile);
  const [plans, setPlans] = useState(initialPlans);
  const [modules, setModules] = useState(initialModules);
  const [offers, setOffers] = useState(initialAvailableOffers);
  const [clients, setClients] = useState([]);
  const [stages, setStages] = useState(initialStages);
  const [showNotifications, setShowNotifications] = useState(false);
  const [readNotifications, setReadNotifications] = useState([]);
  const [completedIds, setCompletedIds] = useState([]);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Modals state
  const [activeActionModal, setActiveActionModal] = useState(null); // 'lead' | 'task' | 'offer' | 'note' | null

  // Lead modal fields
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

  // Task modal fields
  const [taskTitle, setTaskTitle] = useState('');
  const [taskClientId, setTaskClientId] = useState('');
  const [taskDeadline, setTaskDeadline] = useState('30/06/2026');
  const [taskCriticality, setTaskCriticality] = useState('Normal');

  // Offer modal fields
  const [offerClientId, setOfferClientId] = useState('');
  const [offerName, setOfferName] = useState('');
  const [offerStatus, setOfferStatus] = useState('Interessado');

  // Note modal fields
  const [noteClientId, setNoteClientId] = useState('');
  const [noteText, setNoteText] = useState('');

  // 1. SUPABASE AUTH SESSION LISTENER
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setAuthLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // 2. FETCH DATA WHEN USER IS AUTHENTICATED
  const loadAllData = async (userId) => {
    if (!userId) return;
    setDataLoading(true);
    try {
      const [userProfile, userClients, plansData, modulesData, offersData, stagesData] = await Promise.all([
        getProfileService(userId),
        getClientsService(userId),
        getPlansService(),
        getModulesService(),
        getOffersService(),
        getStagesService()
      ]);

      setProfile(userProfile);
      setClients(userClients);
      setPlans(plansData);
      setModules(modulesData);
      setOffers(offersData);
      setStages(stagesData);
    } catch (err) {
      console.error('Error loading JetFlow data from Supabase:', err);
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user?.id) {
      loadAllData(session.user.id);
    } else {
      setClients([]);
    }
  }, [session?.user?.id]);

  // Route hash sync
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#/', '');
      if (hash) {
        setCurrentRoute(hash);
      } else {
        setCurrentRoute('dashboard');
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

  const toggleCompletedId = (id) => {
    setCompletedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setClients([]);
    handleNavigate('dashboard');
  };

  // State Mutators — Profile
  const handleUpdateProfile = async (updatedProfile) => {
    setProfile(updatedProfile);
    if (session?.user?.id) {
      try {
        await updateProfileService(session.user.id, updatedProfile);
      } catch (err) {
        console.error(err);
      }
    }
  };

  // State Mutators — Plans
  const handleAddPlan = async (newPlanObj) => {
    setPlans(prev => [...prev, newPlanObj]);
    try {
      await addPlanService(newPlanObj);
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditPlan = async (id, newName) => {
    setPlans(prev => prev.map(p => p.id === id ? { ...p, name: newName } : p));
    try {
      await editPlanService(id, newName);
      if (session?.user?.id) loadAllData(session.user.id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemovePlan = async (id) => {
    setPlans(prev => prev.filter(p => p.id !== id));
    try {
      await removePlanService(id);
    } catch (err) {
      console.error(err);
    }
  };

  // State Mutators — Modules
  const handleAddModule = async (newModuleObj) => {
    setModules(prev => [...prev, newModuleObj]);
    try {
      await addModuleService(newModuleObj);
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditModule = async (id, updates) => {
    const updateObj = typeof updates === 'string' ? { name: updates } : updates;
    setModules(prev => prev.map(m => m.id === id ? { ...m, ...updateObj } : m));
    try {
      await editModuleService(id, updateObj);
      if (session?.user?.id) loadAllData(session.user.id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveModule = async (id) => {
    setModules(prev => prev.filter(m => m.id !== id));
    try {
      await removeModuleService(id);
    } catch (err) {
      console.error(err);
    }
  };

  // State Mutators — Offers
  const handleAddOffer = async (newOfferObj) => {
    setOffers(prev => [...prev, newOfferObj]);
    try {
      await addOfferService(newOfferObj);
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditOffer = async (id, newName) => {
    setOffers(prev => prev.map(o => o.id === id ? { ...o, name: newName } : o));
    try {
      await editOfferService(id, newName);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveOffer = async (id) => {
    setOffers(prev => prev.filter(o => o.id !== id));
    try {
      await removeOfferService(id);
    } catch (err) {
      console.error(err);
    }
  };

  // State Mutators — Stages
  const handleAddStage = async (stageName) => {
    setStages(prev => [...prev, stageName]);
    try {
      await addStageService(stageName);
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditStage = async (oldName, newName) => {
    setStages(prev => prev.map(s => s === oldName ? newName : s));
    try {
      await editStageService(oldName, newName);
      if (session?.user?.id) loadAllData(session.user.id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveStage = async (stageName) => {
    setStages(prev => prev.filter(s => s !== stageName));
    try {
      await removeStageService(stageName);
    } catch (err) {
      console.error(err);
    }
  };

  const handleReorderStages = async (newStagesList) => {
    setStages(newStagesList);
    try {
      await reorderStagesService(newStagesList);
    } catch (err) {
      console.error(err);
    }
  };

  // State Mutators — Clients (Strict RLS by session.user.id)
  const handleAddClient = async (newClientInput) => {
    if (!session?.user?.id) return;
    try {
      await createClientService(session.user.id, newClientInput, moduleChecklistsTemplate);
      await loadAllData(session.user.id);
    } catch (err) {
      console.error('Error adding client:', err);
    }
  };

  const handleUpdateClient = async (clientId, fieldsToUpdate) => {
    setClients(prev => prev.map(c => 
      c.id === clientId ? { ...c, ...fieldsToUpdate } : c
    ));
    try {
      await updateClientService(clientId, fieldsToUpdate);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateClientStage = async (clientId, newStage) => {
    setClients(prev => prev.map(c => 
      c.id === clientId ? { ...c, stage: newStage } : c
    ));
    try {
      await updateClientService(clientId, { stage: newStage });
      if (session?.user?.id) {
        await addActivityHistoryService(clientId, session.user.id, `Marcou etapa ${newStage} no Kanban`, false);
        loadAllData(session.user.id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateClientNextAction = async (clientId, newNextAction) => {
    setClients(prev => prev.map(c => 
      c.id === clientId ? { ...c, nextAction: newNextAction } : c
    ));
    try {
      await updateClientService(clientId, { nextAction: newNextAction });
    } catch (err) {
      console.error(err);
    }
  };

  const handleRegisterContact = async (clientId, obsText = '') => {
    const client = clients.find(c => c.id === clientId);
    if (!client) return;

    const nextContact = calculateNextContactDate(client.criticality, '30/06/2026');

    try {
      await updateClientService(clientId, { nextContactDate: nextContact });
      if (session?.user?.id) {
        await addLastContactService(clientId, session.user.id, obsText.trim() ? obsText : 'Contato periódico realizado');
        await addActivityHistoryService(clientId, session.user.id, `Contato realizado. Nota: ${obsText || 'Periódico'}`, false);
        loadAllData(session.user.id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleChecklist = async (clientId, moduleName, itemLabel, currentChecked) => {
    // Optimistic UI update
    setClients(prev => prev.map(c => {
      if (c.id === clientId) {
        const modChecklists = c.checklists[moduleName] || [];
        const updated = modChecklists.map(chk => chk.label === itemLabel ? { ...chk, checked: !currentChecked } : chk);
        return {
          ...c,
          checklists: {
            ...c.checklists,
            [moduleName]: updated
          }
        };
      }
      return c;
    }));

    if (session?.user?.id) {
      try {
        await toggleChecklistService(clientId, session.user.id, moduleName, itemLabel, !currentChecked);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleAddReminder = async (clientId, reminderObj) => {
    if (session?.user?.id) {
      try {
        await addReminderService(clientId, session.user.id, reminderObj);
        loadAllData(session.user.id);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleRemoveReminder = async (reminderId) => {
    try {
      await removeReminderService(reminderId);
      if (session?.user?.id) loadAllData(session.user.id);
    } catch (err) {
      console.error(err);
    }
  };

  // Notifications calculation
  const alertNotifications = [];
  clients.forEach(client => {
    if (client.criticality === 'Crítico') {
      alertNotifications.push({
        id: `crit_${client.id}`,
        clientId: client.id,
        clientName: client.name,
        type: 'critico',
        iconType: 'critico',
        title: `Cliente em Estado Crítico`,
        text: `O cliente ${client.name} está marcado como Crítico e exige atenção imediata da equipe CX.`,
        relativeTime: 'Hoje'
      });
    }

    if (client.nextContactDate && getDateStatus(client.nextContactDate, '30/06/2026') === 'atencao') {
      alertNotifications.push({
        id: `cont_${client.id}`,
        clientId: client.id,
        clientName: client.name,
        type: 'tarefa',
        iconType: 'tarefa',
        title: `SLA de Contato no Limite`,
        text: `O prazo para contato com ${client.name} vence hoje (${client.nextContactDate}).`,
        relativeTime: 'Hoje'
      });
    }

    if (client.reminders) {
      client.reminders.forEach(r => {
        if (r.criticality === 'Urgente') {
          alertNotifications.push({
            id: `rem_${r.id}`,
            clientId: client.id,
            clientName: client.name,
            type: 'lembrete',
            iconType: 'lembrete',
            title: `Lembrete Urgente: ${r.title}`,
            text: `${r.title} — ${client.name}`,
            relativeTime: r.deadline || 'Hoje'
          });
        }
      });
    }
  });

  // Loading Screen for Auth
  if (authLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#0B0B0B',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--green-primary, #65FF4B)',
        fontSize: '16px',
        fontWeight: '700',
        fontFamily: 'Inter, system-ui, sans-serif'
      }}>
        Carregando JetFlow...
      </div>
    );
  }

  // Render Login/Signup view if user is not authenticated
  if (!session) {
    return <AuthView onAuthSuccess={(sess) => setSession(sess)} />;
  }

  // Render active route
  const renderView = () => {
    if (currentRoute === 'dashboard') {
      return (
        <DashboardView 
          clients={clients} 
          onAddReminder={handleAddReminder}
          onRemoveReminder={handleRemoveReminder}
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
          onRegisterContact={handleRegisterContact}
          onOpenNewLeadModal={() => setActiveActionModal('lead')}
        />
      );
    }

    if (currentRoute.startsWith('clientes/')) {
      const clientId = currentRoute.split('/')[1];
      const client = clients.find(c => c.id === clientId);
      if (client) {
        return (
          <ClientDetailView 
            client={client} 
            stages={stages}
            onUpdateClient={handleUpdateClient}
            onRegisterContact={handleRegisterContact}
            onNavigate={handleNavigate}
            onToggleChecklist={handleToggleChecklist}
          />
        );
      } else {
        return (
          <div className="empty-state">
            <span className="empty-state-icon">🔍</span>
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
        onSignOut={handleSignOut}
        onOpenAction={(type) => {
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
          {/* Hamburger menu button */}
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
                          
                          let icon = <Bell size={16} style={{ color: '#A78BFA' }} />;
                          if (item.iconType === 'tarefa') {
                            icon = <AlertTriangle size={16} style={{ color: '#F59E0B' }} />;
                          } else if (item.iconType === 'critico') {
                            icon = <Flame size={16} style={{ color: '#EF4444' }} />;
                          } else if (item.iconType === 'oferta') {
                            icon = <Star size={16} style={{ color: '#65FF4B' }} />;
                          }

                          return (
                            <div 
                              key={item.id} 
                              onClick={() => {
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

        {dataLoading ? (
          <div style={{ padding: '40px', color: 'var(--green-primary, #65FF4B)', fontSize: '14px', textAlign: 'center' }}>
            Sincronizando dados com o Supabase...
          </div>
        ) : (
          renderView()
        )}
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
            <form onSubmit={async (e) => {
              e.preventDefault();
              const nextContact = calculateNextContactDate(newCriticality, newEntryDate);
              
              const newClientData = {
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
                nextContactDate: nextContact
              };

              await handleAddClient(newClientData);
              
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
                      placeholder="Ex: TechCorp Soluções" 
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
                      placeholder="00.000.000/0000-00" 
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Telefone Principal</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={newPhone} 
                      onChange={e => setNewPhone(e.target.value)} 
                      placeholder="(11) 99999-0000" 
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">WhatsApp Comercial</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={newWhatsapp} 
                      onChange={e => setNewWhatsapp(e.target.value)} 
                      placeholder="(11) 99999-0000" 
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">E-mail Principal</label>
                    <input 
                      type="email" 
                      className="form-input" 
                      value={newEmail} 
                      onChange={e => setNewEmail(e.target.value)} 
                      placeholder="contato@empresa.com" 
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Data de Entrada *</label>
                    <CustomDatePicker 
                      value={newEntryDate} 
                      onChange={setNewEntryDate} 
                      placeholder="DD/MM/AAAA" 
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Plano Contratado *</label>
                    <PremiumSelect 
                      value={newPlan} 
                      onChange={setNewPlan} 
                      options={plans.map(p => ({ value: p.name, label: p.name }))} 
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Criticidade Inicial *</label>
                    <PremiumSelect 
                      value={newCriticality} 
                      onChange={setNewCriticality} 
                      options={[
                        { value: 'Estável', label: '🟢 Estável', colorBar: '#10B981' },
                        { value: 'Atenção', label: '🟡 Atenção', colorBar: '#F59E0B' },
                        { value: 'Crítico', label: '🔴 Crítico', colorBar: '#EF4444' }
                      ]} 
                    />
                  </div>

                  {newCriticality !== 'Estável' && (
                    <div className="form-group full-width">
                      <label className="form-label">Justificativa da Criticidade *</label>
                      <textarea 
                        className="form-textarea" 
                        rows="2" 
                        value={newJustification} 
                        onChange={e => setNewJustification(e.target.value)} 
                        placeholder="Explique o motivo do status..." 
                        required={newCriticality !== 'Estável'}
                      />
                    </div>
                  )}

                  <div className="form-group full-width">
                    <label className="form-label">Módulos Contratados</label>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
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
                                prev.includes(mod.name)
                                  ? prev.filter(m => m !== mod.name)
                                  : [...prev, mod.name]
                              );
                            }}
                            style={{
                              backgroundColor: isSelected ? '#1E2D1F' : '#161616',
                              border: isSelected ? '1.5px solid var(--green-primary)' : '1.5px solid #252525',
                              borderRadius: '10px',
                              padding: '10px 14px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              transition: 'all 150ms ease',
                              boxShadow: isSelected ? '0 0 12px rgba(101, 255, 75, 0.15)' : 'none'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <span style={{ fontSize: '18px' }}>{icon}</span>
                              <span style={{ fontSize: '13px', fontWeight: isSelected ? '700' : '500', color: isSelected ? '#FFF' : '#CCC' }}>
                                {mod.name}
                              </span>
                            </div>
                            <div style={{
                              width: '18px',
                              height: '18px',
                              borderRadius: '4px',
                              border: isSelected ? '1.5px solid var(--green-primary)' : '1.5px solid #444',
                              backgroundColor: isSelected ? 'var(--green-primary)' : 'transparent',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 150ms ease'
                            }}>
                              {isSelected && <Check size={12} strokeWidth={3} color="#000" />}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="form-group full-width">
                    <label className="form-label">Observações Iniciais</label>
                    <textarea 
                      className="form-textarea" 
                      rows="3" 
                      value={newObservations} 
                      onChange={e => setNewObservations(e.target.value)} 
                      placeholder="Informações relevantes sobre a conta..." 
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setActiveActionModal(null)}>Cancelar</button>
                <button type="submit" className="btn-primary">Salvar e Cadastrar</button>
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
              <h3 className="modal-title">Nova Tarefa / Lembrete</h3>
              <button className="btn-icon" onClick={() => setActiveActionModal(null)}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              if (taskClientId) {
                await handleAddReminder(taskClientId, {
                  title: taskTitle,
                  deadline: taskDeadline,
                  criticality: taskCriticality,
                  description: ''
                });
              }
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
                    placeholder="Ex: Confirmar acesso VPN" 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Cliente Associado *</label>
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
                  <label className="form-label">Prazo de Conclusão *</label>
                  <CustomDatePicker 
                    value={taskDeadline} 
                    onChange={setTaskDeadline} 
                    placeholder="DD/MM/AAAA" 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Criticidade</label>
                  <PremiumSelect 
                    value={taskCriticality} 
                    onChange={setTaskCriticality} 
                    options={[
                      { value: 'Normal', label: 'Normal' },
                      { value: 'Urgente', label: '🔴 Urgente', colorBar: '#EF4444' }
                    ]} 
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

      {/* MODAL 3: Nova Oferta de Upsell */}
      {activeActionModal === 'offer' && (
        <div className="modal-overlay" onClick={() => setActiveActionModal(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Registrar Oportunidade de Upsell</h3>
              <button className="btn-icon" onClick={() => setActiveActionModal(null)}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              if (offerClientId && offerName) {
                const targetClient = clients.find(c => c.id === offerClientId);
                if (targetClient) {
                  const currentMods = targetClient.activeModules || [];
                  if (!currentMods.includes(offerName)) {
                    await handleUpdateClient(offerClientId, {
                      activeModules: [...currentMods, offerName]
                    });
                  }
                }
              }
              setActiveActionModal(null);
            }}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Cliente *</label>
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
                  <label className="form-label">Módulo / Oferta de Interesse *</label>
                  <PremiumSelect 
                    value={offerName} 
                    onChange={setOfferName} 
                    options={offers.map(o => ({ value: o.name, label: o.name }))}
                    placeholder="Selecione a oferta"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Status da Oportunidade</label>
                  <PremiumSelect 
                    value={offerStatus} 
                    onChange={setOfferStatus} 
                    options={[
                      { value: 'Interessado', label: '🟡 Interessado' },
                      { value: 'Em Negociação', label: '🔵 Em Negociação' },
                      { value: 'Contratado', label: '🟢 Contratado', colorBar: '#10B981' }
                    ]} 
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
              <h3 className="modal-title">Anotação Rápida no Histórico</h3>
              <button className="btn-icon" onClick={() => setActiveActionModal(null)}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              if (noteClientId && noteText.trim()) {
                await addActivityHistoryService(noteClientId, session.user.id, `Anotação do cliente: ${noteText}`, true);
                await loadAllData(session.user.id);
              }
              setActiveActionModal(null);
            }}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Cliente *</label>
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
                  <span>Data de registro: {new Date().toLocaleDateString('pt-BR')}</span>
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

      {/* Mobile Bottom Navigation Bar */}
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
