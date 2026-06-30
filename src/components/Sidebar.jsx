import React from 'react';
import { 
  LayoutDashboard, 
  Kanban, 
  Users, 
  Calendar, 
  CheckSquare, 
  Bell, 
  Settings 
} from 'lucide-react';

export default function Sidebar({ currentRoute, onNavigate }) {
  const menuItems = [
    { label: 'Dashboard', route: 'dashboard', icon: LayoutDashboard, isPlaceholder: false },
    { label: 'Kanban', route: 'kanban', icon: Kanban, isPlaceholder: false },
    { label: 'Clientes', route: 'clientes', icon: ClientesIcon, isPlaceholder: false },
    { label: 'Agenda', route: 'agenda', icon: Calendar, isPlaceholder: false },
    { label: 'Tarefas', route: 'tarefas', icon: CheckSquare, isPlaceholder: false },
    { label: 'Lembretes', route: 'lembretes', icon: Bell, isPlaceholder: false },
    { label: 'Configurações', route: 'configuracoes', icon: Settings, isPlaceholder: true },
  ];

  // Helper custom icon wrapper for Clientes to show users properly
  function ClientesIcon(props) {
    return <Users {...props} />;
  }

  return (
    <aside className="sidebar">
      <div>
        <div className="logo-container">
          <span className="logo-text">JetFlow<span className="logo-dot">.</span></span>
        </div>
        <nav className="nav-links">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentRoute === item.route || (item.route === 'clientes' && currentRoute.startsWith('clientes/'));
            return (
              <div
                key={item.label}
                id={`nav-item-${item.route}`}
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={() => onNavigate(item.route)}
                title={item.isPlaceholder ? `${item.label} (Em breve)` : item.label}
              >
                <Icon className="nav-icon" />
                <span>{item.label}</span>
                {item.isPlaceholder && (
                  <span style={{ fontSize: '8px', color: '#888', marginLeft: 'auto', border: '1px solid #2e2e2e', padding: '1px 4px', borderRadius: '4px' }}>
                    breve
                  </span>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      <div className="sidebar-footer">
        <div className="avatar">
          GA
          <span className="status-dot"></span>
        </div>
        <div className="user-info">
          <span className="user-name">Gabriel Almeida</span>
          <span className="user-role">Especialista de Onboarding</span>
        </div>
      </div>
    </aside>
  );
}
