import React from 'react';
import { LayoutDashboard, Kanban, Users, Settings } from 'lucide-react';

export default function Sidebar({ currentRoute, onNavigate, profile }) {
  const menuItems = [
    { label: 'Dashboard', route: 'dashboard', icon: LayoutDashboard },
    { label: 'Kanban', route: 'kanban', icon: Kanban },
    { label: 'Clientes', route: 'clientes', icon: Users },
    { label: 'Configurações', route: 'configuracoes', icon: Settings },
  ];

  return (
    <aside className="sidebar">
      <div className="logo-container">
        <div className="logo-dot"></div>
        <span className="logo-text">JetFlow</span>
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
