import React, { useState, useRef, useEffect } from 'react';
import {
  LayoutDashboard, Kanban, Users, Settings, Search,
  Link as LinkIcon, ChevronDown, ChevronRight, ExternalLink,
  Calendar, CheckSquare, Plus, User, Building2, Target, X, Zap, LifeBuoy, FileText
} from 'lucide-react';
import CustomDatePicker from './CustomDatePicker';
import CustomSelect from './CustomSelect';
import NotaReuniaoModal from './NotaReuniaoModal';
import jetflowIcon from '../assets/jetflow-icon.png';

export default function Sidebar({ currentRoute, onNavigate, profile, clients, offers, onOpenNewLeadModal, onAddClientTask, onAddClientOffer, onAddTicket, onUpdateClient, onUpdateChecklist, onUpdateAdditionalSteps }) {
  // Client context — reused as-is when the quick action is opened from within a client's page
  const contextClientId = currentRoute && currentRoute.startsWith('clientes/') ? currentRoute.split('/')[1] : null;
  const contextClient = contextClientId ? (clients || []).find(c => c.id === contextClientId) || null : null;
  const [isNotaReuniaoOpen, setIsNotaReuniaoOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [linksExpanded, setLinksExpanded] = useState(false);
  const searchRef = useRef(null);

  // Quick actions menu
  const [isQuickMenuOpen, setIsQuickMenuOpen] = useState(false);
  const quickMenuRef = useRef(null);
  const [activeQuickModal, setActiveQuickModal] = useState(null); // 'tarefa' | 'oportunidade'

  const [qTaskClientId, setQTaskClientId] = useState('');
  const [qTaskText, setQTaskText] = useState('');
  const [qTaskDeadline, setQTaskDeadline] = useState('');

  const [qOfferClientId, setQOfferClientId] = useState('');
  const [qOfferName, setQOfferName] = useState('');

  const [qTicketClientId, setQTicketClientId] = useState('');
  const [qTicketSubject, setQTicketSubject] = useState('');
  const [qTicketPriority, setQTicketPriority] = useState('Normal');

  // Close search on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSearchResults(false);
      }
      if (quickMenuRef.current && !quickMenuRef.current.contains(e.target)) {
        setIsQuickMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const resetQuickModals = () => {
    setActiveQuickModal(null);
    setQTaskClientId(''); setQTaskText(''); setQTaskDeadline('');
    setQOfferClientId(''); setQOfferName('');
    setQTicketClientId(''); setQTicketSubject(''); setQTicketPriority('Normal');
  };

  const handleSubmitQuickTask = (e) => {
    e.preventDefault();
    if (!qTaskClientId || !qTaskText.trim()) return;
    onAddClientTask(qTaskClientId, qTaskText.trim(), qTaskDeadline);
    resetQuickModals();
  };

  const handleSubmitQuickOffer = (e) => {
    e.preventDefault();
    if (!qOfferClientId || !qOfferName) return;
    onAddClientOffer(qOfferClientId, qOfferName);
    resetQuickModals();
  };

  const handleSubmitQuickTicket = (e) => {
    e.preventDefault();
    if (!qTicketClientId || !qTicketSubject.trim()) return;
    onAddTicket(qTicketClientId, qTicketSubject.trim(), '', qTicketPriority);
    resetQuickModals();
  };

  const filteredClients = searchQuery.trim().length >= 1
    ? (clients || []).filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 8)
    : [];

  // Gather links from all clients
  const allLinks = [];
  (clients || []).forEach(c => {
    const ql = c.quickLinks || {};
    if (ql.crm) allLinks.push({ label: `CRM — ${c.name}`, url: ql.crm });
    if (ql.discordIntegration) allLinks.push({ label: `Discord — ${c.name}`, url: ql.discordIntegration });
    (ql.discordSupport || []).forEach(ds => {
      if (ds.url) allLinks.push({ label: `${ds.label} — ${c.name}`, url: ds.url });
    });
    if (ql.site && c.activeModules?.includes('API Oficial')) allLinks.push({ label: `Site — ${c.name}`, url: ql.site });
    if (ql.deskPlatformUrl) allLinks.push({ label: `Atendimento — ${c.name}`, url: ql.deskPlatformUrl });
  });

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Escape') {
      setSearchQuery('');
      setShowSearchResults(false);
    }
  };

  return (
    <aside className="sidebar">
      {/* Brand Header */}
      <div className="logo-container" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '16px' }}>
        <img src={jetflowIcon} alt="JetFlow" style={{ width: '32px', height: '32px', borderRadius: '7px', flexShrink: 0 }} />
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span className="logo-text" style={{ fontSize: '15px', fontWeight: '700', color: '#fff', lineHeight: '1.2' }}>JetFlow</span>
          <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>CRM Onboarding</span>
        </div>
      </div>

      {/* Global Search */}
      <div className="sidebar-search-container" ref={searchRef}>
        <Search size={14} className="sidebar-search-icon" />
        <input
          type="text"
          className="sidebar-search-input"
          placeholder="Buscar clientes ou processos..."
          value={searchQuery}
          onChange={e => { setSearchQuery(e.target.value); setShowSearchResults(true); }}
          onFocus={() => setShowSearchResults(true)}
          onKeyDown={handleSearchKeyDown}
        />
        {showSearchResults && filteredClients.length > 0 && (
          <div className="sidebar-search-dropdown">
            {filteredClients.map(c => {
              let badgeClass = 'badge-estavel';
              if (c.criticality === 'Crítico') badgeClass = 'badge-critico';
              if (c.criticality === 'Atenção') badgeClass = 'badge-atencao';
              return (
                <div
                  key={c.id}
                  className="sidebar-search-item"
                  onClick={() => {
                    onNavigate(`clientes/${c.id}`);
                    setSearchQuery('');
                    setShowSearchResults(false);
                  }}
                >
                  <span>{c.name}</span>
                  <span className={`badge ${badgeClass}`} style={{ fontSize: '9px', padding: '2px 5px' }}>{c.criticality}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Actions menu */}
      <div style={{ padding: '0 8px 16px 8px', position: 'relative' }} ref={quickMenuRef}>
        <button
          onClick={() => setIsQuickMenuOpen(v => !v)}
          className="btn-primary quick-action-trigger"
          style={{
            width: '100%',
            justifyContent: 'center',
            backgroundColor: 'var(--green-primary)',
            color: '#000',
            fontWeight: '600',
            height: '40px',
            borderRadius: '8px'
          }}
        >
          <Zap size={16} />
          <span>Ação Rápida</span>
          <ChevronDown size={14} style={{ transform: isQuickMenuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 150ms ease-out' }} />
        </button>

        {isQuickMenuOpen && (
          <div className="quick-action-menu">
            <button
              className="quick-action-item"
              onClick={() => { onOpenNewLeadModal(); setIsQuickMenuOpen(false); }}
            >
              <Building2 size={15} />
              <div>
                <span className="quick-action-item-title">Novo Cliente</span>
                <span className="quick-action-item-sub">Cadastrar um novo lead/cliente</span>
              </div>
            </button>
            <button
              className="quick-action-item"
              onClick={() => { setActiveQuickModal('tarefa'); setIsQuickMenuOpen(false); }}
            >
              <CheckSquare size={15} />
              <div>
                <span className="quick-action-item-title">Nova Tarefa</span>
                <span className="quick-action-item-sub">Adicionar tarefa a um cliente</span>
              </div>
            </button>
            <button
              className="quick-action-item"
              onClick={() => { setActiveQuickModal('oportunidade'); setIsQuickMenuOpen(false); }}
            >
              <Target size={15} />
              <div>
                <span className="quick-action-item-title">Nova Oportunidade</span>
                <span className="quick-action-item-sub">Registrar interesse em oferta</span>
              </div>
            </button>
            <button
              className="quick-action-item"
              onClick={() => { setActiveQuickModal('chamado'); setIsQuickMenuOpen(false); }}
            >
              <LifeBuoy size={15} />
              <div>
                <span className="quick-action-item-title">Novo Chamado</span>
                <span className="quick-action-item-sub">Abrir chamado de suporte</span>
              </div>
            </button>
            <button
              className="quick-action-item"
              onClick={() => { setIsNotaReuniaoOpen(true); setIsQuickMenuOpen(false); }}
            >
              <FileText size={15} />
              <div>
                <span className="quick-action-item-title">📝 Nova Nota de Reunião</span>
                <span className="quick-action-item-sub">Registrar reunião de implantação</span>
              </div>
            </button>
          </div>
        )}
      </div>

      <nav className="sidebar-nav" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        
        {/* Section: GERAL */}
        <div>
          <span className="sidebar-section-title" style={{ padding: '0 16px', fontSize: '10px', fontWeight: '700', color: '#555', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '8px' }}>Geral</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <button
              className={`nav-item ${currentRoute === 'dashboard' ? 'active' : ''}`}
              onClick={() => onNavigate('dashboard')}
            >
              <LayoutDashboard size={18} />
              <span>Dashboard</span>
            </button>
            <button
              className={`nav-item ${currentRoute === 'kanban' ? 'active' : ''}`}
              onClick={() => onNavigate('kanban')}
            >
              <Kanban size={18} />
              <span>Kanban</span>
            </button>
            <button
              className={`nav-item ${currentRoute === 'clientes' || currentRoute.startsWith('clientes/') ? 'active' : ''}`}
              onClick={() => onNavigate('clientes')}
            >
              <Users size={18} />
              <span>Clientes</span>
            </button>
            <button
              className={`nav-item ${currentRoute === 'agenda' ? 'active' : ''}`}
              onClick={() => onNavigate('agenda')}
            >
              <Calendar size={18} />
              <span>Agenda</span>
            </button>
            <button
              className={`nav-item ${currentRoute === 'tarefas' ? 'active' : ''}`}
              onClick={() => onNavigate('tarefas')}
            >
              <CheckSquare size={18} />
              <span>Tarefas</span>
            </button>
          </div>
        </div>

        {/* Section: SUPORTE */}
        <div>
          <span className="sidebar-section-title" style={{ padding: '0 16px', fontSize: '10px', fontWeight: '700', color: '#555', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '8px' }}>Suporte</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <button
              className={`nav-item ${currentRoute === 'suporte' ? 'active' : ''}`}
              onClick={() => onNavigate('suporte')}
            >
              <LifeBuoy size={18} />
              <span>Chamados</span>
            </button>
            <button
              className={`nav-item ${currentRoute === 'configuracoes' ? 'active' : ''}`}
              onClick={() => onNavigate('configuracoes')}
            >
              <Settings size={18} />
              <span>Configurações</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Footer Profile */}
      <div className="sidebar-footer" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
        <div className="user-avatar">
          {profile.avatarUrl ? (
            <img src={profile.avatarUrl} alt={profile.name} />
          ) : (
            <span>{profile.avatarInitials}</span>
          )}
        </div>
        <div className="user-info">
          <span className="user-name">{profile.name}</span>
          <span className="user-role">{profile.role}</span>
        </div>
      </div>

      {/* Quick Modal: Nova Tarefa */}
      {activeQuickModal === 'tarefa' && (
        <div className="modal-overlay" onClick={resetQuickModals}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Nova Tarefa</h3>
              <button className="btn-icon" onClick={resetQuickModals}><X size={16} /></button>
            </div>
            <form onSubmit={handleSubmitQuickTask}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Cliente *</label>
                  <CustomSelect value={qTaskClientId} onChange={setQTaskClientId} placeholder="Selecionar cliente..." options={(clients || []).map(c => ({ value: c.id, label: c.name }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Tarefa *</label>
                  <input type="text" className="form-input" value={qTaskText} onChange={e => setQTaskText(e.target.value)} placeholder="O que precisa ser feito?" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Prazo</label>
                  <CustomDatePicker value={qTaskDeadline} onChange={setQTaskDeadline} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={resetQuickModals}>Cancelar</button>
                <button type="submit" className="btn-primary">Criar Tarefa</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Modal: Nova Oportunidade */}
      {activeQuickModal === 'oportunidade' && (
        <div className="modal-overlay" onClick={resetQuickModals}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Nova Oportunidade</h3>
              <button className="btn-icon" onClick={resetQuickModals}><X size={16} /></button>
            </div>
            <form onSubmit={handleSubmitQuickOffer}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Cliente *</label>
                  <CustomSelect value={qOfferClientId} onChange={setQOfferClientId} placeholder="Selecionar cliente..." options={(clients || []).map(c => ({ value: c.id, label: c.name }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Oferta de Interesse *</label>
                  <CustomSelect value={qOfferName} onChange={setQOfferName} placeholder="Selecionar oferta..." options={(offers || []).map(o => ({ value: o.name, label: o.name }))} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={resetQuickModals}>Cancelar</button>
                <button type="submit" className="btn-primary">Registrar Oportunidade</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Modal: Novo Chamado */}
      {activeQuickModal === 'chamado' && (
        <div className="modal-overlay" onClick={resetQuickModals}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Novo Chamado</h3>
              <button className="btn-icon" onClick={resetQuickModals}><X size={16} /></button>
            </div>
            <form onSubmit={handleSubmitQuickTicket}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Cliente *</label>
                  <CustomSelect value={qTicketClientId} onChange={setQTicketClientId} placeholder="Selecionar cliente..." options={(clients || []).map(c => ({ value: c.id, label: c.name }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Assunto *</label>
                  <input type="text" className="form-input" value={qTicketSubject} onChange={e => setQTicketSubject(e.target.value)} placeholder="Resumo do problema..." required />
                </div>
                <div className="form-group">
                  <label className="form-label">Prioridade</label>
                  <CustomSelect value={qTicketPriority} onChange={setQTicketPriority} options={['Baixa', 'Normal', 'Alta', 'Urgente']} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={resetQuickModals}>Cancelar</button>
                <button type="submit" className="btn-primary">Abrir Chamado</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isNotaReuniaoOpen && (
        <NotaReuniaoModal
          clients={clients || []}
          contextClient={contextClient}
          profile={profile}
          availableOffers={offers || []}
          onUpdateClient={onUpdateClient}
          onUpdateChecklist={onUpdateChecklist}
          onUpdateAdditionalSteps={onUpdateAdditionalSteps}
          onClose={() => setIsNotaReuniaoOpen(false)}
        />
      )}
    </aside>
  );
}
