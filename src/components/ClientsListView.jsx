import React, { useState } from 'react';
import { Search, Plus, List, Kanban, Check, Edit2, Phone, Shield } from 'lucide-react';
import KanbanView from './KanbanView';

export default function ClientsListView({ 
  clients, 
  plans, 
  modules, 
  onAddClient, 
  onNavigate,
  onUpdateClientStage,
  onUpdateClientNextAction,
  onUpdateClientCriticality,
  onRegisterContact,
  onOpenNewLeadModal
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('lista'); // 'lista' or 'kanban'

  // Popover State: { clientId, type: 'contato' | 'acao' | 'criticidade' }
  const [activePopover, setActivePopover] = useState(null);
  const [popoverObs, setPopoverObs] = useState('');
  const [popoverAction, setPopoverAction] = useState('');

  // Search filter
  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.plan.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenPopover = (clientId, type, currentVal = '') => {
    setActivePopover({ clientId, type });
    if (type === 'contato') {
      setPopoverObs('');
    } else if (type === 'acao') {
      setPopoverAction(currentVal);
    }
  };

  const handleConfirmContact = (clientId) => {
    onRegisterContact(clientId, popoverObs);
    setActivePopover(null);
  };

  const handleConfirmAction = (clientId) => {
    onUpdateClientNextAction(clientId, popoverAction);
    setActivePopover(null);
  };

  const handleConfirmCriticality = (clientId, newCrit) => {
    onUpdateClientCriticality(clientId, newCrit);
    setActivePopover(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%', position: 'relative' }}>
      
      {/* Click-away blocker overlay for popovers */}
      {activePopover && (
        <div 
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999, cursor: 'default' }}
          onClick={() => setActivePopover(null)}
        />
      )}

      {/* Top search, toggle and creation row */}
      <div className="search-bar-row">
        <div className="search-input-wrapper">
          <Search size={16} className="search-icon" />
          <input 
            type="text" 
            className="search-input" 
            placeholder="Buscar por nome do cliente ou plano..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        {/* List / Kanban Mode Toggle */}
        <div className="toggle-group">
          <button 
            className={`toggle-btn ${viewMode === 'lista' ? 'active' : ''}`}
            onClick={() => setViewMode('lista')}
          >
            <List size={14} />
            <span>Lista</span>
          </button>
          <button 
            className={`toggle-btn ${viewMode === 'kanban' ? 'active' : ''}`}
            onClick={() => setViewMode('kanban')}
          >
            <Kanban size={14} />
            <span>Kanban</span>
          </button>
        </div>

        <button className="btn-primary" onClick={onOpenNewLeadModal}>
          <Plus size={16} />
          <span>Novo Cliente</span>
        </button>
      </div>

      {/* Conditional View Rendering */}
      {viewMode === 'kanban' ? (
        <KanbanView 
          clients={filteredClients}
          onUpdateClientStage={onUpdateClientStage}
          onUpdateClientNextAction={onUpdateClientNextAction}
          onNavigate={onNavigate}
        />
      ) : (
        <div className="table-responsive">
          {filteredClients.length === 0 ? (
            <div className="empty-state">
              <span className="empty-state-icon">👥</span>
              <p>Nenhum cliente cadastrado ou encontrado.</p>
            </div>
          ) : (
            <>
              <table className="clients-table">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Etapa</th>
                  <th>Responsável</th>
                  <th>Plano</th>
                  <th>Módulos Ativos</th>
                  <th>Próxima Ação</th>
                  <th style={{ width: '120px' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredClients.map(client => {
                  let badgeClass = 'badge-estavel';
                  if (client.criticality === 'Crítico') badgeClass = 'badge-critico';
                  if (client.criticality === 'Atenção') badgeClass = 'badge-atencao';

                  const isPopoverActive = activePopover && activePopover.clientId === client.id;

                  return (
                    <tr key={client.id} className="client-row-hoverable" style={{ position: 'relative' }}>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span 
                            style={{ fontWeight: '600', color: 'var(--green-primary)', cursor: 'pointer' }}
                            onClick={() => onNavigate(`clientes/${client.id}`)}
                          >
                            {client.name}
                          </span>
                          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{client.cnpj || 'Sem CNPJ'}</span>
                        </div>
                      </td>
                      <td>
                        <span className="stage-pill-list">{client.stage}</span>
                      </td>
                      <td>
                        <span style={{ fontSize: '13px' }}>{client.responsible || '—'}</span>
                      </td>
                      <td>
                        <span style={{ fontSize: '13px', fontWeight: '500' }}>{client.plan}</span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                          {client.activeModules && client.activeModules.slice(0, 2).map(m => (
                            <span key={m} className="module-tag-small">{m}</span>
                          ))}
                          {client.activeModules && client.activeModules.length > 2 && (
                            <span className="module-tag-small">+{client.activeModules.length - 2}</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span style={{ fontSize: '13px', fontWeight: '500' }}>{client.nextAction || '—'}</span>
                          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>SLA: {client.nextContactDate || '—'}</span>
                        </div>
                      </td>
                      <td style={{ position: 'relative' }}>
                        {/* Hover Quick Actions triggers */}
                        <div className="hover-actions-overlay">
                          <button 
                            className="btn-action-small"
                            onClick={(e) => { e.stopPropagation(); handleOpenPopover(client.id, 'contato'); }}
                            title="Registrar Contato"
                          >
                            Registrar contato
                          </button>
                          <button 
                            className="btn-action-small"
                            onClick={(e) => { e.stopPropagation(); handleOpenPopover(client.id, 'acao', client.nextAction); }}
                            title="Editar próxima ação"
                          >
                            Ação
                          </button>
                          <button 
                            className="btn-action-small"
                            onClick={(e) => { e.stopPropagation(); handleOpenPopover(client.id, 'criticidade'); }}
                            title="Mudar criticidade"
                          >
                            Criticidade
                          </button>
                          <button 
                            className="btn-action-small-arrow"
                            onClick={(e) => { e.stopPropagation(); onNavigate(`clientes/${client.id}`); }}
                            title="Ver detalhes"
                          >
                            Ver detalhes →
                          </button>
                        </div>

                        {/* Inline Popovers */}
                        {isPopoverActive && (
                          <div 
                            className="inline-popover-container"
                            style={{ 
                              position: 'absolute', 
                              bottom: '100%', 
                              right: '0', 
                              marginBottom: '8px', 
                              zIndex: 1000,
                              padding: '16px',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '12px',
                              width: activePopover.type === 'criticidade' ? '300px' : '260px',
                              textAlign: 'left'
                            }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {activePopover.type === 'contato' && (
                              <>
                                <span className="premium-label" style={{ marginBottom: '2px', display: 'block' }}>Registrar Contato</span>
                                <input 
                                  type="text" 
                                  className="form-input"
                                  value={popoverObs}
                                  onChange={e => setPopoverObs(e.target.value)}
                                  placeholder="Nota opcional de contato..."
                                  onKeyDown={e => { if (e.key === 'Enter') handleConfirmContact(client.id); }}
                                  style={{ width: '100%', fontSize: '13px', height: '36px', borderRadius: '6px', padding: '0 10px' }}
                                  autoFocus
                                />
                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '4px' }}>
                                  <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: '11px' }} onClick={() => setActivePopover(null)}>Cancelar</button>
                                  <button className="btn-primary" style={{ padding: '6px 12px', fontSize: '11px', backgroundColor: 'var(--green-primary)', color: '#000', border: 'none', fontWeight: '600' }} onClick={() => handleConfirmContact(client.id)}>Confirmar</button>
                                </div>
                              </>
                            )}

                            {activePopover.type === 'acao' && (
                              <>
                                <span className="premium-label" style={{ marginBottom: '2px', display: 'block' }}>Editar Próxima Ação</span>
                                <input 
                                  type="text" 
                                  className="form-input"
                                  value={popoverAction}
                                  onChange={e => setPopoverAction(e.target.value)}
                                  onKeyDown={e => { if (e.key === 'Enter') handleConfirmAction(client.id); }}
                                  style={{ width: '100%', fontSize: '13px', height: '36px', borderRadius: '6px', padding: '0 10px' }}
                                  autoFocus
                                />
                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '4px' }}>
                                  <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: '11px' }} onClick={() => setActivePopover(null)}>Cancelar</button>
                                  <button className="btn-primary" style={{ padding: '6px 12px', fontSize: '11px', backgroundColor: 'var(--green-primary)', color: '#000', border: 'none', fontWeight: '600' }} onClick={() => handleConfirmAction(client.id)}>Salvar</button>
                                </div>
                              </>
                            )}

                            {activePopover.type === 'criticidade' && (
                              <>
                                <span className="premium-label" style={{ marginBottom: '2px', display: 'block', textAlign: 'center' }}>Alterar Criticidade</span>
                                <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', marginTop: '4px' }}>
                                  {[
                                    { val: 'Crítico', label: '🔴 Crítico', bg: '#EF4444' },
                                    { val: 'Atenção', label: '🟡 Atenção', bg: '#F59E0B' },
                                    { val: 'Estável', label: '🟢 Estável', bg: '#10B981' }
                                  ].map(opt => {
                                    const isActive = client.criticality === opt.val;
                                    return (
                                      <button
                                        key={opt.val}
                                        type="button"
                                        onClick={() => handleConfirmCriticality(client.id, opt.val)}
                                        style={{
                                          flex: 1,
                                          padding: '8px 0',
                                          fontSize: '10px',
                                          fontWeight: '700',
                                          borderRadius: '6px',
                                          cursor: 'pointer',
                                          border: `1px solid ${opt.bg}`,
                                          backgroundColor: isActive ? opt.bg : 'transparent',
                                          color: isActive ? '#000' : '#FFF',
                                          transition: 'all 150ms ease',
                                          whiteSpace: 'nowrap',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center'
                                        }}
                                      >
                                        {opt.label}
                                      </button>
                                    );
                                  })}
                                </div>
                              </>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Mobile card list — shown only on mobile via CSS */}
            <div className="clients-mobile-list">
              {filteredClients.map(client => {
                let badgeClass = 'badge-estavel';
                if (client.criticality === 'Crítico') badgeClass = 'badge-critico';
                if (client.criticality === 'Atenção') badgeClass = 'badge-atencao';
                return (
                  <div
                    key={client.id}
                    className="client-mobile-card"
                    onClick={() => onNavigate(`clientes/${client.id}`)}
                  >
                    <div className="client-mobile-card-top">
                      <span className="client-mobile-card-name">{client.name}</span>
                      <span className={`badge ${badgeClass}`}>{client.criticality}</span>
                    </div>
                    <div className="client-mobile-card-meta">
                      <span className="stage-pill-list">{client.stage}</span>
                      <span style={{ fontSize: '12px', color: '#888' }}>{client.plan}</span>
                      {client.responsible && (
                        <span style={{ fontSize: '11px', color: '#666' }}>👤 {client.responsible}</span>
                      )}
                    </div>
                    {client.nextAction && (
                      <div className="client-mobile-card-footer">
                        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          📋 {client.nextAction}
                        </span>
                        <span style={{ color: '#65FF4B', fontWeight: '700', flexShrink: 0 }}>Ver →</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
