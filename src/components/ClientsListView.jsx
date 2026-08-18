import React, { useState, useRef, useEffect } from 'react';
import { Search, Plus, List, Kanban, Check, Edit2, Phone, Shield, X, MessageSquarePlus, Target as TargetIcon, ShieldAlert, MoreHorizontal, Download, Upload } from 'lucide-react';
import KanbanView from './KanbanView';
import ImportExportClientsModal from './ImportExportClientsModal';
import { getClientPhase, PHASE_META, getDemandType, getTodayBR, getContactAlert } from '../utils';
import { exportClientsToXlsx } from '../lib/clientImportExport';
import useIsMobile from '../hooks/useIsMobile';

export default function ClientsListView({
  clients,
  plans,
  modules,
  tickets,
  stages,
  profile,
  viewOnly,
  onAddClient,
  onImportClients,
  onNavigate,
  onUpdateClientStage,
  onUpdateClientNextAction,
  onUpdateClientCriticality,
  onRegisterContact,
  onOpenNewLeadModal,
  onEditStage,
  onRemoveStage
}) {
  const todayStr = getTodayBR();
  const isMobile = useIsMobile();
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('lista'); // 'lista' or 'kanban'
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const moreMenuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target)) setIsMoreMenuOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleExport = async () => {
    setIsMoreMenuOpen(false);
    setIsExporting(true);
    try {
      await exportClientsToXlsx(clients);
    } finally {
      setIsExporting(false);
    }
  };

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

        <button className="btn-primary vo-hide" onClick={onOpenNewLeadModal}>
          <Plus size={16} />
          <span>Novo Cliente</span>
        </button>

        <div style={{ position: 'relative' }} ref={moreMenuRef}>
          <button
            className="btn-icon"
            style={{ width: '38px', height: '38px', border: '1px solid var(--border-color)' }}
            title="Exportar ou importar clientes"
            onClick={() => setIsMoreMenuOpen(v => !v)}
          >
            <MoreHorizontal size={16} />
          </button>
          {isMoreMenuOpen && (
            <div className="quick-action-menu" style={{ left: 'auto', right: 0, width: '220px' }}>
              <button className="quick-action-item" disabled={isExporting} onClick={handleExport}>
                <Download size={14} />
                <span className="quick-action-item-title" style={{ fontWeight: '500' }}>
                  {isExporting ? 'Exportando...' : 'Exportar clientes (.xlsx)'}
                </span>
              </button>
              <button className="quick-action-item vo-hide" onClick={() => { setIsMoreMenuOpen(false); setIsImportModalOpen(true); }}>
                <Upload size={14} />
                <span className="quick-action-item-title" style={{ fontWeight: '500' }}>Importar clientes (.xlsx)</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {isImportModalOpen && (
        <ImportExportClientsModal
          clients={clients}
          stages={stages}
          profileName={profile?.name}
          onImport={onImportClients}
          onClose={() => setIsImportModalOpen(false)}
        />
      )}

      {/* Conditional View Rendering */}
      {viewMode === 'kanban' ? (
        <KanbanView
          clients={filteredClients}
          stages={stages}
          viewOnly={viewOnly}
          onUpdateClientStage={onUpdateClientStage}
          onUpdateClientNextAction={onUpdateClientNextAction}
          onEditStage={onEditStage}
          onRemoveStage={onRemoveStage}
          onNavigate={onNavigate}
        />
      ) : isMobile ? (
        filteredClients.length === 0 ? (
          <div className="empty-state">
            <span className="empty-state-icon">👥</span>
            <p>Nenhum cliente cadastrado ou encontrado.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {filteredClients.map(client => {
              let badgeClass = 'badge-estavel';
              if (client.criticality === 'Crítico') badgeClass = 'badge-critico';
              if (client.criticality === 'Atenção') badgeClass = 'badge-atencao';

              const clientTickets = (tickets || []).filter(t => t.clientId === client.id);
              const phase = getClientPhase(client, clientTickets, todayStr, stages);
              const phaseMeta = PHASE_META[phase];
              const demandType = getDemandType(phase);
              const contactAlert = getContactAlert(client, stages, profile, todayStr);

              return (
                <div key={client.id} className="mobile-card" onClick={() => onNavigate(`clientes/${client.id}`)} style={{ cursor: 'pointer' }}>
                  <div className="mobile-card-row">
                    <span style={{ fontWeight: '700', color: '#fff', fontSize: '14px' }}>{client.name}</span>
                    <span className={`badge ${badgeClass}`} style={{ fontSize: '9px', flexShrink: 0 }}>{client.criticality}</span>
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{client.cnpj || 'Sem CNPJ'} · {client.plan}</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    <span className="stage-pill-list">{client.stage}</span>
                    <span className={`type-badge type-${demandType.toLowerCase()}`}>{demandType}</span>
                    <span className="badge" style={{ backgroundColor: phaseMeta.bg, color: phaseMeta.color, border: `1px solid ${phaseMeta.border}`, fontSize: '9px' }}>{phase}</span>
                    {contactAlert && (
                      <span className={`contact-alert-badge ${contactAlert.level}`} style={{ padding: '1px 6px', fontSize: '9px' }}>
                        ⏰ {contactAlert.dias}d
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '12px', color: '#aaa', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span>Próxima ação: {client.nextAction || '—'}</span>
                    <span style={{ color: '#666' }}>SLA: {client.nextContactDate || '—'} · Resp.: {client.responsible || '—'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )
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
                  <th>Tipo</th>
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
                  const phase = getClientPhase(client, clientTickets, todayStr, stages);
                  const phaseMeta = PHASE_META[phase];
                  const demandType = getDemandType(phase);
                  const contactAlert = getContactAlert(client, stages, profile, todayStr);

                  return (
                    <tr key={client.id} className="client-row-hoverable" style={{ position: 'relative' }}>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                            <span
                              style={{ fontWeight: '600', color: 'var(--green-primary)', cursor: 'pointer' }}
                              onClick={() => onNavigate(`clientes/${client.id}`)}
                            >
                              {client.name}
                            </span>
                            {contactAlert && (
                              <span
                                className={`contact-alert-badge ${contactAlert.level}`}
                                style={{ padding: '1px 6px', fontSize: '10px' }}
                                title={`Sem contato há ${contactAlert.dias} dias — sinal automático, não substitui a criticidade manual.`}
                              >
                                ⏰ {contactAlert.dias}d
                              </span>
                            )}
                          </div>
                          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{client.cnpj || 'Sem CNPJ'}</span>
                        </div>
                      </td>
                      <td>
                        <span className="stage-pill-list">{client.stage}</span>
                      </td>
                      <td>
                        <span className={`type-badge type-${demandType.toLowerCase()}`}>
                          {demandType}
                        </span>
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
                        <div className="hover-actions-overlay vo-hide">
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
