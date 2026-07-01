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
  initialClients 
} from './data/data';

import { 
  calculateNextContactDate, 
  getDateStatus 
} from './utils';

import { Bell, X } from 'lucide-react';

export default function App() {
  const [currentRoute, setCurrentRoute] = useState('dashboard');
  
  // Application Local State (Single source of truth)
  const [profile, setProfile] = useState(initialProfile);
  const [plans, setPlans] = useState(initialPlans);
  const [modules, setModules] = useState(initialModules);
  const [offers, setOffers] = useState(initialAvailableOffers);
  const [clients, setClients] = useState(initialClients);

  const [showNotifications, setShowNotifications] = useState(false);

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
          onAddReminder={handleAddClientReminder}
          onUpdateReminder={handleEditClientReminder}
          onRemoveReminder={handleRemoveClientReminder}
          onRegisterContact={handleRegisterContact}
          onNavigate={handleNavigate}
        />
      );
    }

    if (currentRoute === 'kanban') {
      return (
        <KanbanView 
          clients={clients} 
          onUpdateClientStage={handleUpdateClientStage}
          onUpdateClientNextAction={handleUpdateClientNextAction}
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
            availableOffers={offers}
            onUpdateClient={handleUpdateClient}
            onRegisterContact={handleRegisterContact}
            onAddReminder={handleAddClientReminder}
            onEditReminder={handleEditClientReminder}
            onRemoveReminder={handleRemoveClientReminder}
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
      <Sidebar 
        currentRoute={currentRoute} 
        onNavigate={handleNavigate} 
        profile={profile} 
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
                                alert('Contato registrado com sucesso!');
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
    </div>
  );
}
