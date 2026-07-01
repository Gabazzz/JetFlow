import React, { useState, useRef, useEffect } from 'react';
import { LayoutDashboard, Kanban, Users, Settings, Search, Link as LinkIcon, ChevronDown, ChevronRight, ExternalLink } from 'lucide-react';

export default function Sidebar({ currentRoute, onNavigate, profile, clients }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [linksExpanded, setLinksExpanded] = useState(false);
  const searchRef = useRef(null);

  const menuItems = [
    { label: 'Dashboard', route: 'dashboard', icon: LayoutDashboard },
    { label: 'Kanban', route: 'kanban', icon: Kanban },
    { label: 'Clientes', route: 'clientes', icon: Users },
    { label: 'Configurações', route: 'configuracoes', icon: Settings },
  ];

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

  // Collect all quick links from all clients
  const allLinks = [];
  (clients || []).forEach(c => {
    const ql = c.quickLinks || {};
    if (ql.crm) allLinks.push({ label: `CRM — ${c.name}`, url: ql.crm });
    if (ql.discordIntegration) allLinks.push({ label: `Discord Demandas — ${c.name}`, url: ql.discordIntegration });
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
      <div className="logo-container">
        <div className="logo-dot"></div>
        <span className="logo-text">JetFlow</span>
      </div>

      {/* Global Search Box */}
      <div className="sidebar-search-container" ref={searchRef}>
        <Search size={14} className="sidebar-search-icon" />
        <input
          type="text"
          className="sidebar-search-input"
          placeholder="Buscar cliente..."
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
        {showSearchResults && searchQuery.trim().length >= 1 && filteredClients.length === 0 && (
          <div className="sidebar-search-dropdown">
            <div className="sidebar-search-item" style={{ color: 'var(--text-secondary)', justifyContent: 'center' }}>
              Nenhum resultado encontrado
            </div>
          </div>
        )}
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentRoute === item.route ||
            (item.route === 'clientes' && currentRoute.startsWith('clientes/'));

          return (
            <button
              key={item.route}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => onNavigate(item.route)}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </button>
          );
        })}

        {/* Links Rápidos Expandable Section */}
        <div>
          <div className="sidebar-links-header" onClick={() => setLinksExpanded(!linksExpanded)}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <LinkIcon size={18} />
              <span>Links Rápidos</span>
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
                allLinks.slice(0, 15).map((link, idx) => (
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
      </nav>

      <div className="sidebar-footer">
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
