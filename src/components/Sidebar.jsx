import React, { useState, useRef, useEffect } from 'react';
import { 
  LayoutDashboard, Kanban, Users, Settings, Search, 
  Link as LinkIcon, ChevronDown, ChevronRight, ExternalLink,
  Calendar, CheckSquare, Plus, User
} from 'lucide-react';

export default function Sidebar({ currentRoute, onNavigate, profile, clients, onOpenNewLeadModal }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [linksExpanded, setLinksExpanded] = useState(false);
  const searchRef = useRef(null);

  // Close search on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSearchResults(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const handlePlaceholderClick = (label) => {
    alert(`Módulo ${label} estará disponível em breve!`);
  };

  return (
    <aside className="sidebar">
      {/* Brand Header */}
      <div className="logo-container" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '16px' }}>
        <div style={{ backgroundColor: 'var(--green-primary)', padding: '6px', borderRadius: '6px' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 22H22L12 2Z" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span className="logo-text" style={{ fontSize: '15px', fontWeight: '700', color: '#fff', lineHeight: '1.2' }}>Jetsales</span>
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

      {/* Bright Green "+ Novo Lead" button */}
      <div style={{ padding: '0 8px 16px 8px' }}>
        <button 
          onClick={onOpenNewLeadModal}
          className="btn-primary" 
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
          <Plus size={16} />
          <span>Novo Lead</span>
        </button>
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
              className="nav-item"
              onClick={() => handlePlaceholderClick('Agenda')}
            >
              <Calendar size={18} />
              <span>Agenda</span>
            </button>
            <button
              className="nav-item"
              onClick={() => handlePlaceholderClick('Tarefas')}
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
            {/* Links Rápidos Accordion */}
            <div>
              <div className="sidebar-links-header" onClick={() => setLinksExpanded(!linksExpanded)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <LinkIcon size={18} />
                  <span>Links rápidos</span>
                </div>
                {linksExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </div>

              {linksExpanded && (
                <div className="sidebar-links-list">
                  {allLinks.length === 0 ? (
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)', padding: '8px 12px' }}>
                      Nenhum link cadastrado.
                    </span>
                  ) : (
                    allLinks.slice(0, 10).map((link, idx) => (
                      <a
                        key={idx}
                        href={link.url}
                        target="_blank"
                        rel="noreferrer"
                        className="sidebar-link-item"
                        title={link.label}
                      >
                        <ExternalLink size={11} style={{ flexShrink: 0 }} />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {link.label}
                        </span>
                      </a>
                    ))
                  )}
                </div>
              )}
            </div>

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
    </aside>
  );
}
