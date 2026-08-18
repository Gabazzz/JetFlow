import React, { useState } from 'react';
import {
  LayoutDashboard, Users, Calendar, CheckSquare, MoreHorizontal,
  Kanban, TrendingUp, LifeBuoy, Settings, Eye, EyeOff, LogOut, ArrowLeft, X, FileText
} from 'lucide-react';

const TABS = [
  { id: 'dashboard', label: 'Início', icon: LayoutDashboard },
  { id: 'clientes', label: 'Clientes', icon: Users },
  { id: 'agenda', label: 'Agenda', icon: Calendar },
  { id: 'tarefas', label: 'Tarefas', icon: CheckSquare }
];

const SHEET_ITEMS = [
  { id: 'kanban', label: 'Kanban', icon: Kanban },
  { id: 'oportunidades', label: 'Oportunidades', icon: TrendingUp },
  { id: 'suporte', label: 'Chamados de Suporte', icon: LifeBuoy },
  { id: 'configuracoes', label: 'Configurações', icon: Settings }
];

// Root of the tab a given route belongs to, for highlighting the right
// bottom-nav item even when the route drills into a detail page
// (clientes/:id still lights up "Clientes").
function tabRootOf(route) {
  if (route.startsWith('clientes/')) return 'clientes';
  return route;
}

export default function MobileShell({
  currentRoute,
  onNavigate,
  title,
  profile,
  viewOnly,
  onToggleViewOnly,
  onSignOut,
  onOpenNotaReuniao,
  children
}) {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const activeTabRoot = tabRootOf(currentRoute);
  const isDetailRoute = currentRoute.startsWith('clientes/') && currentRoute !== 'clientes';

  const goTab = (id) => {
    setIsSheetOpen(false);
    onNavigate(id);
  };

  return (
    <div className={`mobile-app ${viewOnly ? 'view-only-mode' : ''}`}>
      <div className="mobile-topbar">
        {isDetailRoute ? (
          <button className="mobile-topbar-back" onClick={() => onNavigate('clientes')} title="Voltar">
            <ArrowLeft size={18} />
          </button>
        ) : (
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--surface-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '11px', fontWeight: '700', color: 'var(--green-primary)', overflow: 'hidden' }}>
            {profile?.avatarUrl ? <img src={profile.avatarUrl} alt={profile.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : profile?.avatarInitials}
          </div>
        )}
        <span className="mobile-topbar-title">{title}</span>
        {viewOnly && (
          <span style={{ fontSize: '9px', fontWeight: '700', color: 'var(--green-primary)', border: '1px solid var(--green-primary)', borderRadius: '20px', padding: '3px 8px', flexShrink: 0 }}>
            VISUALIZAÇÃO
          </span>
        )}
      </div>

      <div className="mobile-content">
        {children}
      </div>

      <nav className="mobile-bottom-nav">
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`mobile-bottom-nav-item ${activeTabRoot === tab.id ? 'active' : ''}`}
            onClick={() => goTab(tab.id)}
          >
            <tab.icon size={18} />
            <span>{tab.label}</span>
          </button>
        ))}
        <button
          className={`mobile-bottom-nav-item ${isSheetOpen || SHEET_ITEMS.some(i => i.id === activeTabRoot) ? 'active' : ''}`}
          onClick={() => setIsSheetOpen(true)}
        >
          <MoreHorizontal size={18} />
          <span>Mais</span>
        </button>
      </nav>

      {isSheetOpen && (
        <>
          <div className="mobile-sheet-overlay" onClick={() => setIsSheetOpen(false)} />
          <div className="mobile-sheet">
            <div className="mobile-sheet-handle" />
            {!viewOnly && (
              <button className="mobile-sheet-item" onClick={() => { setIsSheetOpen(false); onOpenNotaReuniao(); }}>
                <FileText size={18} style={{ color: 'var(--green-primary)' }} />
                <span>Nova Nota de Reunião</span>
              </button>
            )}
            {SHEET_ITEMS.map(item => (
              <button key={item.id} className="mobile-sheet-item" onClick={() => goTab(item.id)}>
                <item.icon size={18} />
                <span>{item.label}</span>
              </button>
            ))}
            <button className="mobile-sheet-item" onClick={() => { onToggleViewOnly(); setIsSheetOpen(false); }}>
              {viewOnly ? <Eye size={18} style={{ color: 'var(--green-primary)' }} /> : <EyeOff size={18} />}
              <span>{viewOnly ? 'Sair do Modo Visualização' : 'Modo Visualização'}</span>
            </button>
            <button className="mobile-sheet-item danger" onClick={onSignOut}>
              <LogOut size={18} />
              <span>Sair da conta</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
