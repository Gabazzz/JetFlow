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

export default function App() {
  const [currentRoute, setCurrentRoute] = useState('dashboard');
  
  // Application Local State (Single source of truth)
  const [profile, setProfile] = useState(initialProfile);
  const [plans, setPlans] = useState(initialPlans);
  const [modules, setModules] = useState(initialModules);
  const [offers, setOffers] = useState(initialAvailableOffers);
  const [clients, setClients] = useState(initialClients);

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
    // Synchronize renamed plan on clients
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
    // Synchronize renamed modules on clients activeModules list
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
    // Remove deleted module from clients
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
    // Synchronize renamed offer on clients interestOffers list
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
    // Remove deleted offer from clients
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

  const handleUpdateClientReminder = (clientId, reminderObj) => {
    setClients(prev => prev.map(c => 
      c.id === clientId ? { ...c, reminder: reminderObj } : c
    ));
  };

  // Routing render helper
  const renderView = () => {
    if (currentRoute === 'dashboard') {
      return (
        <DashboardView 
          clients={clients} 
          onUpdateClientReminder={handleUpdateClientReminder}
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

    // 404 Fallback
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
        </div>
        {renderView()}
      </main>
    </div>
  );
}
