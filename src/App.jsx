import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import DashboardView from './components/DashboardView';
import KanbanView from './components/KanbanView';
import ClientsListView from './components/ClientsListView';
import ClientDetailView from './components/ClientDetailView';
import ConfiguracoesView from './components/ConfiguracoesView';
import SuporteView from './components/SuporteView';

import {
  initialProfile,
  initialPlans,
  initialModules,
  initialAvailableOffers,
  initialClients,
  initialStages,
  initialTickets
} from './data/data';

import {
  calculateNextContactDate,
  getDateStatus,
  createDefaultAdditionalSteps
} from './utils';

import { Bell, X, Plus } from 'lucide-react';
import CustomDatePicker from './components/CustomDatePicker';
import CustomSelect from './components/CustomSelect';
import { moduleChecklistsTemplate } from './data/data';

export default function App() {
  const [currentRoute, setCurrentRoute] = useState('dashboard');
  
  // Application Local State (Single source of truth)
  const [profile, setProfile] = useState(initialProfile);
  const [plans, setPlans] = useState(initialPlans);
  const [modules, setModules] = useState(initialModules);
  const [offers, setOffers] = useState(initialAvailableOffers);
  // Cada cliente precisa de etapas adicionais (BM/GupShup) e de um "retrato"
  // do checklist (baseline) representando o estado na última nota gerada —
  // é contra esse retrato que a Nota de Reunião calcula o que foi feito
  // especificamente na reunião atual. Sem baseline salvo (dado seed antigo),
  // o retrato inicial é o próprio estado atual do checklist.
  const [clients, setClients] = useState(() => initialClients.map(c => ({
    ...c,
    additionalSteps: c.additionalSteps || createDefaultAdditionalSteps(),
    checklistBaseline: c.checklistBaseline || JSON.parse(JSON.stringify(c.checklists || {})),
    additionalStepsBaseline: c.additionalStepsBaseline || JSON.parse(JSON.stringify(c.additionalSteps || createDefaultAdditionalSteps()))
  })));
  const [stages, setStages] = useState(initialStages);
  const [tickets, setTickets] = useState(initialTickets);
  const [showNotifications, setShowNotifications] = useState(false);

  // Global New Lead Modal Form State
  const [isNewLeadModalOpen, setIsNewLeadModalOpen] = useState(false);
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

  // Contact cycle handler: updates nextContactDate and logs the contact — does not spawn a fake meeting
  const handleRegisterContact = (clientId, obsText = '') => {
    setClients(prev => prev.map(c => {
      if (c.id === clientId) {
        const nextContact = calculateNextContactDate(c.criticality, '30/06/2026');
        const label = obsText.trim() || 'Registrou contato periódico';
        return {
          ...c,
          nextContactDate: nextContact,
          lastContacts: [
            { date: '30/06/2026', obs: label },
            ...(c.lastContacts || [])
          ],
          activityHistory: [
            { avatar: profile.avatarInitials, name: profile.name, action: label, date: '30/06/2026 às 12:00', isObservation: false },
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
          tasks: (c.tasks || []).filter(t => t.id !== taskId),
          activityHistory: task ? [
            { avatar: profile.avatarInitials, name: profile.name, action: `Concluiu tarefa: ${task.text}`, date: '30/06/2026 às 12:00', isObservation: false },
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

  // Etapas adicionais (Verificação de BM, Conexão com GupShup) — independentes
  // dos módulos contratados, mas participam do mesmo diff de "o que foi feito
  // nesta reunião" usado pela Nota de Reunião.
  const handleUpdateAdditionalSteps = (clientId, updatedSteps) => {
    setClients(prev => prev.map(c => c.id === clientId ? { ...c, additionalSteps: updatedSteps } : c));
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
      createdDate: '30/06/2026',
      origem: 'Painel',
      discordUrl
    };
    setTickets(prev => [newTicket, ...prev]);
    setClients(prev => prev.map(c => {
      if (c.id === clientId) {
        return {
          ...c,
          activityHistory: [
            { avatar: profile.avatarInitials, name: profile.name, action: `Abriu chamado de suporte: ${subject}`, date: '30/06/2026 às 12:00', isObservation: false },
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

  // Gather overdue or today's notifications
  const alertNotifications = [];
  clients.forEach(c => {
    // 1. SLA contact reminders
    if (c.nextContactDate) {
      const status = getDateStatus(c.nextContactDate, '30/06/2026');
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
        const status = getDateStatus(r.deadline, '30/06/2026');
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
          onAddClient={handleAddClient}
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
            availableOffers={offers}
            onUpdateClient={handleUpdateClient}
            onRegisterContact={handleRegisterContact}
            onAddReminder={handleAddClientReminder}
            onEditReminder={handleEditClientReminder}
            onRemoveReminder={handleRemoveClientReminder}
            onUpdateChecklist={handleUpdateClientChecklist}
            onUpdateAdditionalSteps={handleUpdateAdditionalSteps}
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

    if (currentRoute === 'suporte') {
      return (
        <SuporteView
          clients={clients}
          tickets={tickets}
          onAddTicket={handleAddTicket}
          onUpdateTicketStatus={handleUpdateTicketStatus}
          onUpdateTicketLink={handleUpdateTicketLink}
          onNavigate={handleNavigate}
        />
      );
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
    if (currentRoute === 'suporte') return 'Central de Suporte';
    if (currentRoute === 'configuracoes') return 'Configurações do Sistema';
    return 'JetFlow';
  };

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
                checklistBaseline: JSON.parse(JSON.stringify(clientChecklists)),
                additionalSteps: createDefaultAdditionalSteps(),
                additionalStepsBaseline: createDefaultAdditionalSteps(),
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
