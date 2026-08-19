import React, { useState, useRef, useEffect } from 'react';
import { User, CheckCircle, Filter, ArrowUpDown, MoreHorizontal, Edit2, Trash2, Check, X, ChevronDown, ChevronUp, Plus } from 'lucide-react';
import { getDateStatus, parseBRDate, getTodayBR } from '../utils';
import CustomSelect from './CustomSelect';
import useIsMobile from '../hooks/useIsMobile';

const CRITICALITY_ORDER = { 'Crítico': 3, 'Atenção': 2, 'Estável': 1 };

export default function KanbanView({ clients, stages, viewOnly, onUpdateClientStage, onUpdateClientNextAction, onEditStage, onRemoveStage, onRemoveClient, onNavigate }) {
  const isMobile = useIsMobile();
  const [draggedClientId, setDraggedClientId] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  // "Add to stage" modal (pick an existing client + which stage to place it in)
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignClientId, setAssignClientId] = useState('');
  const [assignStage, setAssignStage] = useState('');

  // Inline editing state
  const [editingAction, setEditingAction] = useState(null);
  const textareaRef = useRef(null);

  // Filter / sort state
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [activeCriticalities, setActiveCriticalities] = useState([]); // empty = show all
  const [sortMode, setSortMode] = useState('none'); // none | nome | criticidade | prazo
  const filterRef = useRef(null);
  const sortRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (filterRef.current && !filterRef.current.contains(e.target)) setIsFilterOpen(false);
      if (sortRef.current && !sortRef.current.contains(e.target)) setIsSortOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleCriticalityFilter = (crit) => {
    setActiveCriticalities(prev => prev.includes(crit) ? prev.filter(c => c !== crit) : [...prev, crit]);
  };

  // Column ("...") menu state
  const [openColumnMenu, setOpenColumnMenu] = useState(null);
  const [renamingStage, setRenamingStage] = useState(null);
  const [renameValue, setRenameValue] = useState('');
  const [collapsedStages, setCollapsedStages] = useState([]);
  const columnMenuRef = useRef(null);

  useEffect(() => {
    function handleClickOutsideColumnMenu(e) {
      if (columnMenuRef.current && !columnMenuRef.current.contains(e.target)) setOpenColumnMenu(null);
    }
    document.addEventListener('mousedown', handleClickOutsideColumnMenu);
    return () => document.removeEventListener('mousedown', handleClickOutsideColumnMenu);
  }, []);

  const handleConfirmRename = (stage) => {
    if (renameValue.trim() && renameValue.trim() !== stage) onEditStage(stage, renameValue.trim());
    setRenamingStage(null);
  };

  const toggleCollapsed = (stage) => {
    setCollapsedStages(prev => prev.includes(stage) ? prev.filter(s => s !== stage) : [...prev, stage]);
  };

  const todayStr = getTodayBR();

  const visibleClients = clients
    .filter(c => activeCriticalities.length === 0 || activeCriticalities.includes(c.criticality))
    .sort((a, b) => {
      if (sortMode === 'nome') return a.name.localeCompare(b.name);
      if (sortMode === 'criticidade') return (CRITICALITY_ORDER[b.criticality] || 0) - (CRITICALITY_ORDER[a.criticality] || 0);
      if (sortMode === 'prazo') {
        if (!a.nextContactDate) return 1;
        if (!b.nextContactDate) return -1;
        return parseBRDate(a.nextContactDate).getTime() - parseBRDate(b.nextContactDate).getTime();
      }
      return 0;
    });

  const handleDragStart = (e, clientId) => {
    setDraggedClientId(clientId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, stage, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumn(stage);
    setDragOverIndex(index);
  };

  const handleDrop = (e, targetStage) => {
    e.preventDefault();
    if (draggedClientId) {
      onUpdateClientStage(draggedClientId, targetStage);
    }
    setDraggedClientId(null);
    setDragOverColumn(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedClientId(null);
    setDragOverColumn(null);
    setDragOverIndex(null);
  };

  const handleStartEditAction = (clientId, currentAction) => {
    setEditingAction({ clientId, value: currentAction || '' });
    setTimeout(() => textareaRef.current?.focus(), 50);
  };

  const handleSaveEditAction = (clientId) => {
    if (editingAction && editingAction.clientId === clientId) {
      onUpdateClientNextAction(clientId, editingAction.value);
    }
    setEditingAction(null);
  };

  const handleKeyDownEditAction = (e, clientId) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSaveEditAction(clientId);
    }
    if (e.key === 'Escape') {
      setEditingAction(null);
    }
  };

  const getDeadlineDisplay = (deadlineStr) => {
    if (!deadlineStr) return { text: '—', className: '' };
    const status = getDateStatus(deadlineStr, todayStr);
    
    // Format to "24 Out" or similar if possible, otherwise keep BR format
    let displayDate = deadlineStr;
    try {
      const parts = deadlineStr.split('/');
      if (parts.length === 3) {
        const day = parts[0];
        const monthNum = parts[1];
        const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        const monthName = months[parseInt(monthNum, 10) - 1];
        displayDate = `${day} ${monthName}`;
      }
    } catch(e) {}

    if (status === 'overdue') return { text: displayDate, className: 'date-overdue' };
    if (status === 'today') return { text: 'Hoje', className: 'date-today' };
    return { text: displayDate, className: '' };
  };

  const allStages = stages || ['Novo', 'Kickoff', 'Configuração', 'Treinamento', 'Finalizado'];

  // Team avatar initials for group visual in header
  const teamInitials = ['GA', 'ML', 'CL'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
      
      {/* ── KANBAN HEADER (JETSALES STYLE) ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#fff', margin: 0 }}>Pipeline de Implantação</h2>
          <span className="type-badge type-onboarding">Onboarding</span>

          {/* Circular avatars group */}
          <div style={{ display: 'flex', alignItems: 'center', position: 'relative', paddingLeft: '8px' }}>
            {teamInitials.map((initials, idx) => (
              <div 
                key={initials}
                style={{ 
                  width: '24px', 
                  height: '24px', 
                  borderRadius: '50%', 
                  backgroundColor: '#2E2E2E', 
                  border: '1px solid #111', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  fontSize: '9px', 
                  fontWeight: '700', 
                  color: 'var(--green-primary)',
                  marginLeft: idx === 0 ? 0 : '-8px',
                  zIndex: 10 - idx
                }}
              >
                {initials}
              </div>
            ))}
            <div 
              style={{ 
                width: '24px', 
                height: '24px', 
                borderRadius: '50%', 
                backgroundColor: '#1E1E1E', 
                border: '1px solid #333', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                fontSize: '9px', 
                fontWeight: '700', 
                color: '#888',
                marginLeft: '-8px',
                zIndex: 1
              }}
            >
              +12
            </div>
          </div>
        </div>

        {/* Filters and Order buttons */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            className="btn-primary vo-hide"
            style={{ padding: '8px 16px', fontSize: '13px' }}
            onClick={() => { setAssignClientId(''); setAssignStage(allStages[0] || ''); setIsAssignModalOpen(true); }}
          >
            <Plus size={14} />
            <span>Adicionar ao Kanban</span>
          </button>
          <div style={{ position: 'relative' }} ref={filterRef}>
            <button
              className="btn-secondary"
              style={{ padding: '8px 16px', fontSize: '13px', gap: '8px', border: activeCriticalities.length > 0 ? '1px solid var(--green-primary)' : '1px solid #2A2A2A', backgroundColor: '#1B1B1B', color: activeCriticalities.length > 0 ? 'var(--green-primary)' : '#fff' }}
              onClick={() => { setIsFilterOpen(v => !v); setIsSortOpen(false); }}
            >
              <Filter size={14} />
              <span>Filtros{activeCriticalities.length > 0 ? ` (${activeCriticalities.length})` : ''}</span>
            </button>
            {isFilterOpen && (
              <div className="quick-action-menu" style={{ left: 'auto', right: 0, width: '200px' }}>
                <span style={{ fontSize: '10px', fontWeight: '700', color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px', padding: '6px 10px 2px' }}>Criticidade</span>
                {['Crítico', 'Atenção', 'Estável'].map(crit => (
                  <label key={crit} className="quick-action-item" style={{ cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      className="premium-check"
                      checked={activeCriticalities.includes(crit)}
                      onChange={() => toggleCriticalityFilter(crit)}
                    />
                    <span className="quick-action-item-title" style={{ fontWeight: '500' }}>{crit}</span>
                  </label>
                ))}
                {activeCriticalities.length > 0 && (
                  <button className="quick-action-item" style={{ color: 'var(--badge-red)' }} onClick={() => setActiveCriticalities([])}>
                    <span className="quick-action-item-title" style={{ color: 'var(--badge-red)' }}>Limpar filtros</span>
                  </button>
                )}
              </div>
            )}
          </div>

          <div style={{ position: 'relative' }} ref={sortRef}>
            <button
              className="btn-secondary"
              style={{ padding: '8px 16px', fontSize: '13px', gap: '8px', border: sortMode !== 'none' ? '1px solid var(--green-primary)' : '1px solid #2A2A2A', backgroundColor: '#1B1B1B', color: sortMode !== 'none' ? 'var(--green-primary)' : '#fff' }}
              onClick={() => { setIsSortOpen(v => !v); setIsFilterOpen(false); }}
            >
              <ArrowUpDown size={14} />
              <span>Ordenar</span>
            </button>
            {isSortOpen && (
              <div className="quick-action-menu" style={{ left: 'auto', right: 0, width: '200px' }}>
                {[
                  { id: 'none', label: 'Padrão' },
                  { id: 'nome', label: 'Nome (A-Z)' },
                  { id: 'criticidade', label: 'Criticidade' },
                  { id: 'prazo', label: 'Prazo mais próximo' }
                ].map(opt => (
                  <button
                    key={opt.id}
                    className="quick-action-item"
                    style={{ color: sortMode === opt.id ? 'var(--green-primary)' : '#fff' }}
                    onClick={() => { setSortMode(opt.id); setIsSortOpen(false); }}
                  >
                    <span className="quick-action-item-title" style={{ color: 'inherit' }}>{opt.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── KANBAN BOARD ── */}
      <div className="kanban-board" style={{ overflowX: 'auto', display: 'flex', gap: '16px', paddingBottom: '16px' }}>
        {allStages.map(stage => {
          const stageClients = visibleClients.filter(c => c.stage === stage);
          const isDragOver = dragOverColumn === stage;

          return (
            <div
              key={stage}
              className="kanban-column"
              style={{ 
                flex: '1', 
                minWidth: '280px', 
                backgroundColor: '#0F0F0F', 
                borderRadius: '8px', 
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}
              onDragOver={(e) => handleDragOver(e, stage, stageClients.length)}
              onDrop={(e) => handleDrop(e, stage)}
            >
              {/* Column Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 8px' }}>
                {renamingStage === stage ? (
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flex: 1 }}>
                    <input
                      type="text"
                      className="form-input"
                      style={{ fontSize: '13px', height: '30px', padding: '4px 8px', flex: 1 }}
                      value={renameValue}
                      onChange={e => setRenameValue(e.target.value)}
                      autoFocus
                      onKeyDown={e => { if (e.key === 'Enter') handleConfirmRename(stage); if (e.key === 'Escape') setRenamingStage(null); }}
                    />
                    <button className="btn-icon" style={{ width: '24px', height: '24px', color: 'var(--green-primary)' }} onClick={() => handleConfirmRename(stage)}><Check size={13} /></button>
                    <button className="btn-icon" style={{ width: '24px', height: '24px' }} onClick={() => setRenamingStage(null)}><X size={13} /></button>
                  </div>
                ) : (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--green-primary)' }}></span>
                      <span style={{ fontSize: '14px', fontWeight: '700', color: '#fff' }}>{stage}</span>
                      <span style={{ fontSize: '11px', color: '#666', backgroundColor: '#1E1E1E', padding: '1px 6px', borderRadius: '10px', fontWeight: '600' }}>
                        {String(stageClients.length).padStart(2, '0')}
                      </span>
                    </div>
                    <div style={{ position: 'relative' }} ref={openColumnMenu === stage ? columnMenuRef : null}>
                      <button
                        className="btn-icon"
                        style={{ width: '24px', height: '24px', color: openColumnMenu === stage ? 'var(--green-primary)' : '#555' }}
                        onClick={() => setOpenColumnMenu(prev => prev === stage ? null : stage)}
                      >
                        <MoreHorizontal size={14} />
                      </button>
                      {openColumnMenu === stage && (
                        <div className="quick-action-menu" style={{ left: 'auto', right: 0, width: '190px' }}>
                          <button className="quick-action-item vo-hide" onClick={() => { setRenamingStage(stage); setRenameValue(stage); setOpenColumnMenu(null); }}>
                            <Edit2 size={14} />
                            <span className="quick-action-item-title" style={{ fontWeight: '500' }}>Renomear etapa</span>
                          </button>
                          <button className="quick-action-item" onClick={() => { toggleCollapsed(stage); setOpenColumnMenu(null); }}>
                            {collapsedStages.includes(stage) ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                            <span className="quick-action-item-title" style={{ fontWeight: '500' }}>{collapsedStages.includes(stage) ? 'Expandir coluna' : 'Colapsar coluna'}</span>
                          </button>
                          <button
                            className="quick-action-item vo-hide"
                            style={{ color: 'var(--badge-red)' }}
                            onClick={() => {
                              setOpenColumnMenu(null);
                              if (window.confirm(`Remover a etapa "${stage}"? Os clientes nela ficarão sem etapa válida.`)) onRemoveStage(stage);
                            }}
                          >
                            <Trash2 size={14} />
                            <span className="quick-action-item-title" style={{ color: 'var(--badge-red)' }}>Remover etapa</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Cards Container */}
              {collapsedStages.includes(stage) ? (
                <div style={{ padding: '10px 8px', fontSize: '12px', color: '#666', textAlign: 'center' }}>
                  {stageClients.length} cliente{stageClients.length !== 1 ? 's' : ''} oculto{stageClients.length !== 1 ? 's' : ''}
                </div>
              ) : (
              <div
                className="kanban-cards-container"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  minHeight: '200px'
                }}
              >
                {stageClients.length === 0 && stage === allStages[allStages.length - 1] && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', padding: '40px 16px', color: '#444' }}>
                    <CheckCircle size={36} />
                    <span style={{ fontSize: '12px', fontWeight: '600' }}>Nenhum cliente aqui</span>
                  </div>
                )}

                {stageClients.map((client, index) => {
                  const isDragging = draggedClientId === client.id;
                  const isDropTarget = isDragOver && dragOverIndex === index;
                  
                  // Map criticality levels to labels & colors
                  let criticalityLabel = 'Baixa';
                  let criticalityColor = 'var(--badge-green)';
                  let criticalityBg = 'rgba(16, 185, 129, 0.12)';
                  
                  if (client.criticality === 'Crítico') {
                    criticalityLabel = 'Alta';
                    criticalityColor = 'var(--badge-red)';
                    criticalityBg = '#3F1A1A';
                  } else if (client.criticality === 'Atenção') {
                    criticalityLabel = 'Média';
                    criticalityColor = 'var(--badge-yellow)';
                    criticalityBg = '#3D2F1D';
                  }

                  const deadline = getDeadlineDisplay(client.nextContactDate);
                  const isEditingThis = editingAction?.clientId === client.id;

                  // High-fidelity border highlight for active/critical cards
                  const borderLeftStyle = client.criticality === 'Crítico'
                    ? '3px solid var(--badge-red)'
                    : client.criticality === 'Atenção'
                      ? '3px solid var(--badge-yellow)'
                      : '3px solid var(--badge-green)';

                  return (
                    <div key={client.id}>
                      {isDropTarget && <div className="kanban-drop-indicator" />}

                      <div
                        className={`kanban-card ${isDragging ? 'kanban-card-dragging' : ''}`}
                        style={{
                          backgroundColor: '#161616',
                          border: '1px solid #252525',
                          borderLeft: borderLeftStyle,
                          borderRadius: '6px',
                          padding: '14px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '10px',
                          cursor: isMobile ? 'default' : 'grab'
                        }}
                        draggable={!viewOnly && !isMobile}
                        onDragStart={(e) => handleDragStart(e, client.id)}
                        onDragEnd={handleDragEnd}
                      >
                        {/* Title Row */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                          <span
                            style={{ fontWeight: '700', fontSize: '14px', color: '#fff', cursor: 'pointer', lineHeight: '1.3' }}
                            onClick={() => onNavigate(`clientes/${client.id}`)}
                          >
                            {client.name}
                          </span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                            <span
                              style={{
                                fontSize: '8px',
                                fontWeight: '800',
                                color: criticalityColor,
                                backgroundColor: criticalityBg,
                                padding: '2px 6px',
                                borderRadius: '4px',
                                textTransform: 'uppercase'
                              }}
                            >
                              {criticalityLabel}
                            </span>
                            {onRemoveClient && (
                              <button
                                className="btn-danger-icon vo-hide"
                                style={{ width: '20px', height: '20px' }}
                                title="Excluir cliente"
                                // A confirmação vive no App, que sabe quantos
                                // chamados e tarefas somem junto — assim a
                                // pergunta é a mesma em todas as telas.
                                onClick={(e) => { e.stopPropagation(); onRemoveClient(client.id); }}
                              >
                                <Trash2 size={11} />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Responsible */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#888' }}>
                          <User size={12} />
                          <span>{client.responsible || 'Especialista'}</span>
                        </div>

                        {/* Arrastar não funciona por toque — no mobile, mudar de etapa é por aqui */}
                        {isMobile && (
                          <div className="vo-hide" onClick={e => e.stopPropagation()}>
                            <CustomSelect
                              value={stage}
                              onChange={v => onUpdateClientStage(client.id, v)}
                              options={allStages}
                            />
                          </div>
                        )}

                        {/* Modules tags */}
                        {client.activeModules && client.activeModules.length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                            {client.activeModules.slice(0, 2).map(mod => (
                              <span key={mod} style={{ fontSize: '10px', backgroundColor: '#222', color: '#666', padding: '2px 6px', borderRadius: '4px' }}>
                                {mod}
                              </span>
                            ))}
                          </div>
                        )}

                        <hr style={{ border: 'none', borderTop: '1px solid #252525', margin: '4px 0' }} />

                        {/* Footer (PRÓXIMA AÇÃO / PRAZO) */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '10px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <span style={{ fontSize: '9px', fontWeight: '700', color: '#555', textTransform: 'uppercase', letterSpacing: '0.5px' }}>PRÓXIMA AÇÃO</span>
                            {isEditingThis ? (
                              <textarea
                                ref={textareaRef}
                                className="kanban-card-textarea"
                                value={editingAction.value}
                                rows={2}
                                onChange={e => setEditingAction(prev => ({ ...prev, value: e.target.value }))}
                                onKeyDown={e => handleKeyDownEditAction(e, client.id)}
                                onBlur={() => handleSaveEditAction(client.id)}
                                style={{ width: '100%', fontSize: '11px' }}
                              />
                            ) : (
                              <span
                                className="kanban-card-action-green vo-disable"
                                style={{ fontSize: '12px', color: 'var(--green-primary)', fontWeight: '700', cursor: 'pointer' }}
                                onClick={() => handleStartEditAction(client.id, client.nextAction)}
                              >
                                {client.nextAction || 'Definir ação...'}
                              </span>
                            )}
                          </div>
                          
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'flex-end', textAlign: 'right' }}>
                            <span style={{ fontSize: '9px', fontWeight: '700', color: '#555', textTransform: 'uppercase', letterSpacing: '0.5px' }}>PRAZO</span>
                            <span 
                              className={deadline.className} 
                              style={{
                                fontSize: '12px',
                                fontWeight: '700',
                                color: deadline.className === 'date-overdue'
                                  ? 'var(--badge-red)'
                                  : deadline.className === 'date-today'
                                    ? 'var(--badge-yellow)'
                                    : deadline.text === '—'
                                      ? '#888'
                                      : 'var(--badge-green)'
                              }}
                            >
                              {deadline.text}
                            </span>
                          </div>
                        </div>

                      </div>
                    </div>
                  );
                })}

                {isDragOver && dragOverIndex === stageClients.length && (
                  <div className="kanban-drop-indicator" />
                )}
              </div>
              )}

            </div>
          );
        })}
      </div>

      {isAssignModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAssignModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '420px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Adicionar ao Kanban</h3>
              <button className="btn-icon" onClick={() => setIsAssignModalOpen(false)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Cliente *</label>
                <CustomSelect
                  value={assignClientId}
                  onChange={setAssignClientId}
                  placeholder="Selecionar cliente..."
                  options={clients.map(c => ({ value: c.id, label: c.name }))}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Etapa *</label>
                <CustomSelect value={assignStage} onChange={setAssignStage} options={allStages} />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn-secondary" onClick={() => setIsAssignModalOpen(false)}>Cancelar</button>
              <button
                type="button"
                className="btn-primary"
                disabled={!assignClientId || !assignStage}
                onClick={() => {
                  onUpdateClientStage(assignClientId, assignStage);
                  setIsAssignModalOpen(false);
                }}
              >
                <Check size={14} />
                <span>Adicionar</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
