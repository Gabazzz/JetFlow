import React, { useState, useRef, useEffect } from 'react';
import { 
  LayoutDashboard, Kanban, Users, Settings, Search, 
  Link as LinkIcon, ChevronDown, ChevronRight, ExternalLink,
  Calendar, CheckSquare, Plus, User, LogOut
} from 'lucide-react';

export default function Sidebar({ currentRoute, onNavigate, profile, clients, onOpenAction, isOpen, onSignOut }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [linksExpanded, setLinksExpanded] = useState(false);
  const [showActionPopup, setShowActionPopup] = useState(false);
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

  // Listen to Escape key to close popups
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        setShowActionPopup(false);
        setShowSearchResults(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const filteredClients = searchQuery.trim().length >= 1
    ? (clients || []).filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 8)
    : [];

  // Static global links
  const globalStaticLinks = [
    { label: 'Documentação Jetsales', url: 'https://docs.jetsales.com.br' },
    { label: 'Portal do Parceiro', url: 'https://portal.jetsales.com.br' }
  ];

  // Active client links if on detail view
  const activeClientId = currentRoute.startsWith('clientes/') ? currentRoute.split('/')[1] : null;
  const activeClient = clients.find(c => c.id === activeClientId);
  
  const clientLinks = [];
  if (activeClient && activeClient.quickLinks) {
    const ql = activeClient.quickLinks;
    if (ql.crm) clientLinks.push({ label: `CRM — ${activeClient.name}`, url: ql.crm });
    if (ql.discordIntegration) clientLinks.push({ label: `Discord — ${activeClient.name}`, url: ql.discordIntegration });
    (ql.discordSupport || []).forEach(ds => {
      if (ds.url) clientLinks.push({ label: `${ds.label} — ${activeClient.name}`, url: ds.url });
    });
    if (ql.site) clientLinks.push({ label: `Site — ${activeClient.name}`, url: ql.site });
    if (ql.deskPlatformUrl) clientLinks.push({ label: `Atendimento — ${activeClient.name}`, url: ql.deskPlatformUrl });
  }

  // Merge lists
  const mergedLinksList = [...globalStaticLinks, ...clientLinks];

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
    <aside className={`sidebar${isOpen ? ' mobile-open' : ''}`}>
      {/* Brand Header */}
      <div className="logo-container" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '16px 0', marginBottom: '20px' }}>
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
      <div className="sidebar-search-container" ref={searchRef} style={{ position: 'relative', width: '100%', marginBottom: '16px' }}>
        <Search size={14} className="sidebar-search-icon" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#888', zIndex: 10 }} />
        <input
          type="text"
          className="sidebar-search-input"
          placeholder="Buscar clientes..."
          value={searchQuery}
          onChange={e => { setSearchQuery(e.target.value); setShowSearchResults(true); }}
          onFocus={() => setShowSearchResults(true)}
          onKeyDown={handleSearchKeyDown}
          style={{
            width: '100%',
            padding: '8px 12px 8px 32px',
            backgroundColor: '#2E2E2E',
            border: '1px solid transparent',
            borderRadius: '6px',
            color: '#fff',
            fontSize: '13px',
            transition: 'all 200ms ease'
          }}
        />
        {showSearchResults && filteredClients.length > 0 && (
          <div className="sidebar-search-dropdown" style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            backgroundColor: '#161616',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: '8px',
            boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
            zIndex: 1020,
            padding: '4px 0',
            maxHeight: '200px',
            overflowY: 'auto'
          }}>
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
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 12px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    transition: 'all 150ms ease'
                  }}
                >
                  <span style={{ color: '#FFF', fontWeight: '500' }}>{c.name}</span>
                  <span className={`badge ${badgeClass}`} style={{ fontSize: '9px', padding: '2px 5px' }}>{c.criticality}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Actions Trigger button "+ Nova Ação" */}
      <div style={{ padding: '0 0 16px 0', position: 'relative' }}>
        <button 
          onClick={() => setShowActionPopup(!showActionPopup)}
          className="btn-primary" 
          style={{ 
            width: '100%', 
            justifyContent: 'center', 
            backgroundColor: 'var(--green-primary)', 
            color: '#000', 
            fontWeight: '700',
            height: '40px',
            borderRadius: '8px',
            gap: '6px',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            fontSize: '14px',
            transition: 'transform 180ms ease'
          }}
        >
          <Plus size={16} strokeWidth={2.5} />
          <span>Nova Ação</span>
        </button>

        {/* Action Menu popover above button */}
        {showActionPopup && (
          <>
            <div 
              style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000 }}
              onClick={() => setShowActionPopup(false)}
            />
            <div 
              className="premium-action-popup"
              style={{
                position: 'absolute',
                bottom: '48px',
                left: 0,
                right: 0,
                backgroundColor: '#161616',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: '12px',
                boxShadow: '0 8px 40px rgba(0,0,0,0.6), 0 1px 0 rgba(255,255,255,0.04) inset',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                zIndex: 1010,
                padding: '6px 0',
                transformOrigin: 'bottom',
                animation: 'premiumDropdownOpen 200ms cubic-bezier(0.16, 1, 0.3, 1)'
              }}
            >
              {[
                { label: '📋 Novo Lead', type: 'lead' },
                { label: '✅ Nova Tarefa', type: 'task' },
                { label: '💡 Nova Oferta', type: 'offer' },
                { label: '📝 Anotação Rápida', type: 'note' },
              ].map(opt => (
                <div
                  key={opt.type}
                  onClick={() => {
                    onOpenAction(opt.type);
                    setShowActionPopup(false);
                  }}
                  style={{
                    padding: '12px 16px',
                    fontSize: '13px',
                    fontWeight: '600',
                    color: '#FFF',
                    cursor: 'pointer',
                    transition: 'all 180ms ease',
                  }}
                  className="sidebar-popup-item"
                >
                  {opt.label}
                </div>
              ))}
            </div>
          </>
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
              className={`nav-item ${(currentRoute === 'clientes' || currentRoute.startsWith('clientes/')) && !linksExpanded ? 'active' : ''}`}
              onClick={() => {
                setLinksExpanded(false);
                onNavigate('clientes');
              }}
            >
              <Users size={18} />
              <span>Clientes</span>
            </button>

            {/* Links Rápidos item below Clientes */}
            <button
              className={`nav-item ${linksExpanded ? 'active' : ''}`}
              onClick={() => setLinksExpanded(!linksExpanded)}
            >
              <LinkIcon size={18} />
              <span>Links Rápidos</span>
            </button>

            {/* Expanded section inside the sidebar nav itself */}
            {linksExpanded && (
              <div style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '2px', margin: '4px 0' }}>
                {mergedLinksList.map((link, idx) => (
                  <a
                    key={idx}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="sidebar-link-item-expanded"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 12px',
                      color: '#888',
                      textDecoration: 'none',
                      fontSize: '13px',
                      borderRadius: '6px',
                      transition: 'all 150ms ease',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    <LinkIcon size={12} style={{ color: 'var(--green-primary)', flexShrink: 0 }} />
                    <span style={{ textOverflow: 'ellipsis', overflow: 'hidden' }}>{link.label}</span>
                  </a>
                ))}
              </div>
            )}

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
      <div className="sidebar-footer" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
          <div className="user-avatar" style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#2E2E2E', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '700', color: 'var(--green-primary)', flexShrink: 0 }}>
            {profile.avatarUrl ? (
              <img src={profile.avatarUrl} alt={profile.name} style={{ width: '100%', height: '100%', borderRadius: '50%' }} />
            ) : (
              <span>{profile.avatarInitials}</span>
            )}
          </div>
          <div className="user-info" style={{ display: 'flex', flexDirection: 'column', gap: '2px', overflow: 'hidden' }}>
            <span className="user-name" style={{ fontSize: '13px', fontWeight: '700', color: '#FFF' }}>{profile.name}</span>
            <span className="user-role" style={{ fontSize: '10px', color: '#666' }}>{profile.role}</span>
          </div>
        </div>

        {onSignOut && (
          <button
            onClick={onSignOut}
            title="Sair da Conta"
            style={{
              background: 'none',
              border: 'none',
              color: '#888',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 150ms ease'
            }}
            onMouseEnter={e => e.currentTarget.style.color = '#EF4444'}
            onMouseLeave={e => e.currentTarget.style.color = '#888'}
          >
            <LogOut size={16} />
          </button>
        )}
      </div>
    </aside>
  );
}
