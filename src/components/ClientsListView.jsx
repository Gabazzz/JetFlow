import React, { useState } from 'react';
import { Search, Plus, List, Kanban, Check, Edit2, Phone, Shield, X, MessageSquarePlus, Target as TargetIcon, ShieldAlert } from 'lucide-react';
import KanbanView from './KanbanView';
import { getClientPhase, PHASE_META } from '../utils';

export default function ClientsListView({
  clients,
  plans,
  modules,
  tickets,
  stages,
  onAddClient,
  onNavigate,
  onUpdateClientStage,
  onUpdateClientNextAction,
  onUpdateClientCriticality,
  onRegisterContact,
  onOpenNewLeadModal,
  onEditStage,
  onRemoveStage
}) {
  const todayStr = '30/06/2026';
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
          stages={stages}
          onUpdateClientStage={onUpdateClientStage}
          onUpdateClientNextAction={onUpdateClientNextAction}
          onEditStage={onEditStage}
          onRemoveStage={onRemoveStage}
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
            <table className="clients-table">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Etapa</th>
                  <th>Fase CX</th>
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

                  const clientTickets = (tickets || []).filter(t => t.clientId === client.id);
                  const phase = getClientPhase(client, clientTickets, todayStr);
                  const phaseMeta = PHASE_META[phase];

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
                        <span
                          className="badge"
                          style={{ backgroundColor: phaseMeta.bg, color: phaseMeta.color, border: `1px solid ${phaseMeta.border}`, fontSize: '10px' }}
                        >
                          {phase}
                        </span>
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
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Quick action modal — centered, replaces the old floating popover */}
      {activePopover && (() => {
        const activeClient = clients.find(c => c.id === activePopover.clientId);
        if (!activeClient) return null;

        return (
          <div className="modal-overlay" onClick={() => setActivePopover(null)}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '440px' }}>
              <div className="modal-header">
                <h3 className="modal-title">
                  {activePopover.type === 'contato' && 'Registrar Contato'}
                  {activePopover.type === 'acao' && 'Editar Próxima Ação'}
                  {activePopover.type === 'criticidade' && 'Alterar Criticidade'}
                  <span style={{ color: 'var(--green-primary)', fontWeight: '500' }}> · {activeClient.name}</span>
                </h3>
                <button className="btn-icon" onClick={() => setActivePopover(null)}><X size={16} /></button>
              </div>

              {activePopover.type === 'contato' && (
                <>
                  <div className="modal-body">
                    <div className="form-group">
                      <label className="form-label">O que foi feito?</label>
                      <input
                        type="text"
                        className="form-input"
                        value={popoverObs}
                        onChange={e => setPopoverObs(e.target.value)}
                        placeholder="Nota opcional..."
                        onKeyDown={e => { if (e.key === 'Enter') handleConfirmContact(activeClient.id); }}
                        autoFocus
                      />
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button className="btn-secondary" onClick={() => setActivePopover(null)}>Cancelar</button>
                    <button className="btn-primary" onClick={() => handleConfirmContact(activeClient.id)}>Confirmar</button>
                  </div>
                </>
              )}

              {activePopover.type === 'acao' && (
                <>
                  <div className="modal-body">
                    <div className="form-group">
                      <label className="form-label">Próxima ação</label>
                      <input
                        type="text"
                        className="form-input"
                        value={popoverAction}
                        onChange={e => setPopoverAction(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') handleConfirmAction(activeClient.id); }}
                        autoFocus
                      />
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button className="btn-secondary" onClick={() => setActivePopover(null)}>Cancelar</button>
                    <button className="btn-primary" onClick={() => handleConfirmAction(activeClient.id)}>Salvar</button>
                  </div>
                </>
              )}

              {activePopover.type === 'criticidade' && (
                <div className="modal-body">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <button
                      className="btn-secondary"
                      style={{ justifyContent: 'center', color: 'var(--badge-red)', padding: '12px' }}
                      onClick={() => handleConfirmCriticality(activeClient.id, 'Crítico')}
                    >
                      Crítico — contato a cada 1 dia
                    </button>
                    <button
                      className="btn-secondary"
                      style={{ justifyContent: 'center', color: 'var(--badge-yellow)', padding: '12px' }}
                      onClick={() => handleConfirmCriticality(activeClient.id, 'Atenção')}
                    >
                      Atenção — contato a cada 2 dias
                    </button>
                    <button
                      className="btn-secondary"
                      style={{ justifyContent: 'center', color: 'var(--badge-green)', padding: '12px' }}
                      onClick={() => handleConfirmCriticality(activeClient.id, 'Estável')}
                    >
                      Estável — contato a cada 3 dias
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
