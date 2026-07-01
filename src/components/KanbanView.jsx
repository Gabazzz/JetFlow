import React, { useState, useRef } from 'react';
import { User, CheckCircle, Filter, ArrowUpDown, MoreHorizontal } from 'lucide-react';
import { getDateStatus } from '../utils';

export default function KanbanView({ clients, stages, onUpdateClientStage, onUpdateClientNextAction, onNavigate }) {
  const [draggedClientId, setDraggedClientId] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  // Inline editing state
  const [editingAction, setEditingAction] = useState(null);
  const textareaRef = useRef(null);

  const todayStr = '30/06/2026';

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
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn-secondary" style={{ padding: '8px 16px', fontSize: '13px', gap: '8px', border: '1px solid #2A2A2A', backgroundColor: '#1B1B1B' }}>
            <Filter size={14} />
            <span>Filtros</span>
          </button>
          <button className="btn-secondary" style={{ padding: '8px 16px', fontSize: '13px', gap: '8px', border: '1px solid #2A2A2A', backgroundColor: '#1B1B1B' }}>
            <ArrowUpDown size={14} />
            <span>Ordenar</span>
          </button>
        </div>
      </div>

      {/* ── KANBAN BOARD ── */}
      <div className="kanban-board" style={{ overflowX: 'auto', display: 'flex', gap: '16px', paddingBottom: '16px' }}>
        {allStages.map(stage => {
          const stageClients = clients.filter(c => c.stage === stage);
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--green-primary)' }}></span>
                  <span style={{ fontSize: '14px', fontWeight: '700', color: '#fff' }}>{stage}</span>
                  <span style={{ fontSize: '11px', color: '#666', backgroundColor: '#1E1E1E', padding: '1px 6px', borderRadius: '10px', fontWeight: '600' }}>
                    {String(stageClients.length).padStart(2, '0')}
                  </span>
                </div>
                <button className="btn-icon" style={{ width: '24px', height: '24px', color: '#555' }}>
                  <MoreHorizontal size={14} />
                </button>
              </div>

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
                {stageClients.length === 0 && stage === 'Finalizado' && (
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
                  let criticalityColor = 'var(--green-primary)';
                  let criticalityBg = '#1E351F';
                  
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
                        </div>

                        {/* Responsible */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#888' }}>
                          <User size={12} />
                          <span>{client.responsible || 'Especialista'}</span>
                        </div>

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
                                className="kanban-card-action-green"
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
