import React, { useState, useRef, useEffect } from 'react';
import { 
  User, CheckCircle, Filter, MoreHorizontal, Check, Edit2, Plus, Trash2, X 
} from 'lucide-react';
import { getDateStatus } from '../utils';
import PremiumSelect from './PremiumSelect';

export default function KanbanView({ 
  clients, 
  stages, 
  onUpdateClientStage, 
  onUpdateClientNextAction, 
  onEditStage,
  onNavigate 
}) {
  const [draggedClientId, setDraggedClientId] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  // Inline editing state for next action
  const [editingAction, setEditingAction] = useState(null);
  const textareaRef = useRef(null);

  // Criticality filters state
  const [selectedCriticalities, setSelectedCriticalities] = useState([]);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  // Columns menu state
  const [activeColumnMenu, setActiveColumnMenu] = useState(null); // stage name
  const [editingStageName, setEditingStageName] = useState(null); // stage name being edited
  const [editStageValue, setEditStageValue] = useState('');
  
  // Add client to stage dropdown state
  const [addingClientStage, setAddingClientStage] = useState(null); // stage name
  const [selectedAddClient, setSelectedAddClient] = useState('');

  const todayStr = '30/06/2026';
  const filterRef = useRef(null);

  // Close menus on outside click or Esc
  useEffect(() => {
    function handleClickOutside(e) {
      if (filterRef.current && !filterRef.current.contains(e.target)) {
        setShowFilterDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        setShowFilterDropdown(false);
        setActiveColumnMenu(null);
        setEditingStageName(null);
        setAddingClientStage(null);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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

  const handleToggleCriticalityFilter = (crit) => {
    setSelectedCriticalities(prev => 
      prev.includes(crit) ? prev.filter(c => c !== crit) : [...prev, crit]
    );
  };

  const handleRenameStageSubmit = (oldStage) => {
    if (editStageValue.trim() && editStageValue !== oldStage) {
      onEditStage(oldStage, editStageValue.trim());
    }
    setEditingStageName(null);
  };

  const handleAddClientToStageSubmit = (stage) => {
    if (selectedAddClient) {
      onUpdateClientStage(selectedAddClient, stage);
      setSelectedAddClient('');
      setAddingClientStage(null);
    }
  };

  const handleClearColumnSubmit = (stage) => {
    if (window.confirm(`Deseja realmente limpar todos os clientes da etapa "${stage}"?`)) {
      clients.forEach(c => {
        if (c.stage === stage) {
          // move to Finalizado stage
          onUpdateClientStage(c.id, 'Finalizado');
        }
      });
      setActiveColumnMenu(null);
    }
  };

  const allStages = stages || ['Novo', 'Kickoff', 'Configuração', 'Treinamento', 'Finalizado'];

  // Apply filters
  const filteredClients = clients.filter(c => {
    if (selectedCriticalities.length === 0) return true;
    return selectedCriticalities.includes(c.criticality);
  });

  const teamInitials = ['GA', 'ML', 'CL'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
      
      {/* ── KANBAN HEADER (JETSALES STYLE) ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#fff', margin: 0 }}>Pipeline de Implantação</h2>
          
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

        {/* Filters buttons */}
        <div style={{ display: 'flex', gap: '10px', position: 'relative' }} ref={filterRef}>
          <button 
            className="btn-secondary" 
            onClick={() => setShowFilterDropdown(!showFilterDropdown)}
            style={{ 
              padding: '8px 16px', 
              fontSize: '13px', 
              gap: '8px', 
              border: '1px solid #2A2A2A', 
              backgroundColor: '#1B1B1B',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              position: 'relative'
            }}
          >
            <Filter size={14} />
            <span>Filtros</span>
            {selectedCriticalities.length > 0 && (
              <span style={{
                backgroundColor: 'var(--green-primary)',
                color: '#000',
                fontSize: '10px',
                fontWeight: '700',
                padding: '2px 6px',
                borderRadius: '10px',
                marginLeft: '4px'
              }}>
                {selectedCriticalities.length}
              </span>
            )}
          </button>

          {showFilterDropdown && (
            <div 
              className="premium-select-dropdown" 
              style={{
                position: 'absolute',
                top: 'calc(100% + 6px)',
                right: 0,
                width: '180px',
                backgroundColor: '#161616',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: '10px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
                padding: '8px 0',
                zIndex: 1040,
                display: 'flex',
                flexDirection: 'column',
                animation: 'premiumDropdownOpen 200ms cubic-bezier(0.16, 1, 0.3, 1)',
                transformOrigin: 'top'
              }}
            >
              {['Crítico', 'Atenção', 'Estável'].map(crit => {
                const isSelected = selectedCriticalities.includes(crit);
                return (
                  <div 
                    key={crit}
                    onClick={() => handleToggleCriticalityFilter(crit)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 16px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      color: '#fff',
                      transition: 'all 150ms ease'
                    }}
                    className="premium-select-item"
                  >
                    <div style={{
                      width: '14px',
                      height: '14px',
                      border: isSelected ? '1px solid var(--green-primary)' : '1px solid #444',
                      backgroundColor: isSelected ? 'var(--green-primary)' : 'transparent',
                      borderRadius: '3px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 150ms ease'
                    }}>
                      {isSelected && <Check size={10} color="#000" strokeWidth={4} />}
                    </div>
                    <span>{crit}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── KANBAN BOARD ── */}
      <div className="kanban-board" style={{ overflowX: 'auto', display: 'flex', gap: '16px', paddingBottom: '16px' }}>
        {allStages.map(stage => {
          const stageClients = filteredClients.filter(c => c.stage === stage);
          const isDragOver = dragOverColumn === stage;

          // Find clients not in this stage for "Adicionar cliente"
          const otherClients = clients.filter(c => c.stage !== stage);

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
                gap: '12px',
                position: 'relative'
              }}
              onDragOver={(e) => handleDragOver(e, stage, stageClients.length)}
              onDrop={(e) => handleDrop(e, stage)}
            >
              {/* Column Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 8px', position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--green-primary)' }}></span>
                  
                  {editingStageName === stage ? (
                    <input 
                      type="text" 
                      className="form-input"
                      value={editStageValue}
                      onChange={e => setEditStageValue(e.target.value)}
                      onBlur={() => handleRenameStageSubmit(stage)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') handleRenameStageSubmit(stage);
                        if (e.key === 'Escape') setEditingStageName(null);
                      }}
                      autoFocus
                      style={{
                        fontSize: '14px',
                        fontWeight: '700',
                        color: '#fff',
                        backgroundColor: '#111',
                        border: '1px solid var(--green-primary)',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        width: '120px'
                      }}
                    />
                  ) : (
                    <span 
                      style={{ fontSize: '14px', fontWeight: '700', color: '#fff', cursor: 'pointer' }}
                      onClick={() => {
                        setEditingStageName(stage);
                        setEditStageValue(stage);
                      }}
                    >
                      {stage}
                    </span>
                  )}

                  <span style={{ fontSize: '11px', color: '#666', backgroundColor: '#1E1E1E', padding: '1px 6px', borderRadius: '10px', fontWeight: '600' }}>
                    {String(stageClients.length).padStart(2, '0')}
                  </span>
                </div>

                {/* Column Action Trigger Menu */}
                <button 
                  className="btn-icon" 
                  style={{ width: '24px', height: '24px', color: '#555', cursor: 'pointer', background: 'none', border: 'none' }}
                  onClick={() => setActiveColumnMenu(activeColumnMenu === stage ? null : stage)}
                >
                  <MoreHorizontal size={14} />
                </button>

                {/* Column Dropdown Popup */}
                {activeColumnMenu === stage && (
                  <>
                    <div 
                      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1010 }}
                      onClick={() => setActiveColumnMenu(null)}
                    />
                    <div 
                      className="premium-action-popup"
                      style={{
                        position: 'absolute',
                        top: '32px',
                        right: '8px',
                        width: '210px',
                        backgroundColor: '#161616',
                        border: '1px solid rgba(255, 255, 255, 0.06)',
                        borderRadius: '12px',
                        boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
                        zIndex: 1020,
                        padding: '6px 0',
                        display: 'flex',
                        flexDirection: 'column',
                        transformOrigin: 'top right'
                      }}
                    >
                      <div 
                        onClick={() => {
                          setEditingStageName(stage);
                          setEditStageValue(stage);
                          setActiveColumnMenu(null);
                        }}
                        style={{ padding: '10px 14px', fontSize: '12px', color: '#FFF', cursor: 'pointer', fontWeight: '600' }}
                        className="sidebar-popup-item"
                      >
                        ✏️ Renomear etapa
                      </div>
                      <div 
                        onClick={() => {
                          setAddingClientStage(stage);
                          setSelectedAddClient('');
                          setActiveColumnMenu(null);
                        }}
                        style={{ padding: '10px 14px', fontSize: '12px', color: '#FFF', cursor: 'pointer', fontWeight: '600' }}
                        className="sidebar-popup-item"
                      >
                        ➕ Adicionar cliente nesta etapa
                      </div>
                      <div 
                        onClick={() => handleClearColumnSubmit(stage)}
                        style={{ padding: '10px 14px', fontSize: '12px', color: '#FF5E5E', cursor: 'pointer', fontWeight: '600' }}
                        className="sidebar-popup-item"
                      >
                        🗑️ Limpar coluna
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Add Client Dialog Overlay */}
              {addingClientStage === stage && (
                <div 
                  className="premium-action-popup"
                  style={{
                    backgroundColor: '#1E1E1E',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '8px',
                    padding: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    zIndex: 1030
                  }}
                >
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#FFF' }}>Adicionar Cliente à Etapa</span>
                  <PremiumSelect
                    value={selectedAddClient}
                    onChange={setSelectedAddClient}
                    options={otherClients.map(oc => ({ value: oc.id, label: oc.name }))}
                    placeholder="Selecione o cliente"
                  />
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <button 
                      type="button" 
                      className="btn-secondary" 
                      style={{ fontSize: '11px', padding: '4px 8px' }}
                      onClick={() => setAddingClientStage(null)}
                    >
                      Cancelar
                    </button>
                    <button 
                      type="button" 
                      className="btn-primary" 
                      style={{ fontSize: '11px', padding: '4px 8px' }}
                      onClick={() => handleAddClientToStageSubmit(stage)}
                    >
                      Confirmar
                    </button>
                  </div>
                </div>
              )}

              {/* Cards Container */}
              <div 
                className="kanban-cards-container" 
                style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '10px', 
                  minHeight: '200px' 
                }}
              >
                {stageClients.length === 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', padding: '40px 16px', color: '#444' }}>
                    <CheckCircle size={36} />
                    <span style={{ fontSize: '12px', fontWeight: '600' }}>Nenhum cliente aqui</span>
                  </div>
                )}

                {stageClients.map((client, index) => {
                  const isDragging = draggedClientId === client.id;
                  const isDropTarget = isDragOver && dragOverIndex === index;
                  
                  let criticalityColor = 'var(--green-primary)';
                  let criticalityBg = '#1E351F';
                  
                  if (client.criticality === 'Crítico') {
                    criticalityColor = 'var(--badge-red)';
                    criticalityBg = '#3F1A1A';
                  } else if (client.criticality === 'Atenção') {
                    criticalityColor = 'var(--badge-yellow)';
                    criticalityBg = '#3D2F1D';
                  }

                  const deadline = getDeadlineDisplay(client.nextContactDate);
                  const isEditingThis = editingAction?.clientId === client.id;

                  const borderLeftStyle = client.criticality === 'Crítico' 
                    ? '3px solid var(--badge-red)' 
                    : client.criticality === 'Atenção'
                      ? '3px solid var(--badge-yellow)'
                      : '3px solid var(--green-primary)';

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
                          cursor: 'grab'
                        }}
                        draggable
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
                          <span 
                            style={{ 
                              fontSize: '9px', 
                              fontWeight: '800', 
                              color: criticalityColor, 
                              backgroundColor: criticalityBg, 
                              padding: '2px 6px', 
                              borderRadius: '4px',
                              textTransform: 'uppercase',
                              flexShrink: 0
                            }}
                          >
                            {client.criticality}
                          </span>
                        </div>

                        {/* Responsible */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#888' }}>
                          <User size={12} />
                          <span>{client.responsible || 'Especialista'}</span>
                        </div>

                        {/* Modules tags (dynamic height, show all) */}
                        {client.activeModules && client.activeModules.length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                            {client.activeModules.map(mod => (
                              <span key={mod} style={{ fontSize: '10px', backgroundColor: '#222', color: '#888', padding: '2px 6px', borderRadius: '4px' }}>
                                {mod}
                              </span>
                            ))}
                          </div>
                        )}

                        <hr style={{ border: 'none', borderTop: '1px solid #252525', margin: '4px 0' }} />

                        {/* Footer (PRÓXIMA AÇÃO / PRAZO) */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: '10px', alignItems: 'end' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', position: 'relative' }}>
                            <span style={{ fontSize: '9px', fontWeight: '700', color: '#555', textTransform: 'uppercase', letterSpacing: '0.5px' }}>PRÓXIMA AÇÃO</span>
                            {isEditingThis ? (
                              <div style={{ position: 'relative', width: '100%' }}>
                                <textarea
                                  ref={textareaRef}
                                  value={editingAction.value}
                                  maxLength={150}
                                  onChange={e => setEditingAction(prev => ({ ...prev, value: e.target.value }))}
                                  onKeyDown={e => handleKeyDownEditAction(e, client.id)}
                                  onBlur={() => handleSaveEditAction(client.id)}
                                  style={{
                                    width: '100%',
                                    backgroundColor: '#0B0B0B',
                                    border: '1px solid #65FF4B',
                                    borderRadius: '8px',
                                    padding: '12px 12px 24px 12px',
                                    color: '#FFF',
                                    fontSize: '12px',
                                    resize: 'none',
                                    outline: 'none',
                                    fontFamily: 'inherit'
                                  }}
                                />
                                <span style={{
                                  position: 'absolute',
                                  bottom: '6px',
                                  right: '12px',
                                  fontSize: '10px',
                                  color: '#666'
                                }}>
                                  {editingAction.value.length}/150
                                </span>
                              </div>
                            ) : (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <span
                                  className="kanban-card-action-green"
                                  style={{ fontSize: '12px', color: 'var(--green-primary)', fontWeight: '800', cursor: 'pointer', lineHeight: '1.4' }}
                                  onClick={() => handleStartEditAction(client.id, client.nextAction)}
                                >
                                  {client.nextAction || 'Definir ação...'}
                                </span>
                                <Edit2 
                                  size={10} 
                                  style={{ color: '#555', cursor: 'pointer', flexShrink: 0 }} 
                                  onClick={() => handleStartEditAction(client.id, client.nextAction)}
                                />
                              </div>
                            )}
                          </div>
                          
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'flex-end', textAlign: 'right' }}>
                            <span style={{ fontSize: '9px', fontWeight: '700', color: '#555', textTransform: 'uppercase', letterSpacing: '0.5px' }}>PRAZO</span>
                            <span 
                              className={deadline.className} 
                              style={{ 
                                fontSize: '12px', 
                                fontWeight: '700',
                                color: deadline.className === 'date-today' 
                                  ? 'var(--green-primary)' 
                                  : deadline.className === 'date-overdue'
                                    ? 'var(--badge-red)'
                                    : '#888'
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

            </div>
          );
        })}
      </div>

    </div>
  );
}
