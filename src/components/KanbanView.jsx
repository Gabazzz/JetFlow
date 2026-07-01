import React, { useState, useRef } from 'react';
import { User, CheckCircle } from 'lucide-react';
import { getDateStatus } from '../utils';

export default function KanbanView({ clients, stages, onUpdateClientStage, onUpdateClientNextAction, onNavigate }) {
  const [draggedClientId, setDraggedClientId] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  // Inline editing state: { clientId, value }
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
    if (status === 'overdue') return { text: deadlineStr, className: 'date-overdue' };
    if (status === 'today') return { text: 'Hoje', className: 'date-today' };
    return { text: deadlineStr, className: '' };
  };

  const allStages = stages || ['Novo', 'Kickoff', 'Configuração', 'Treinamento', 'Finalizado'];

  return (
    <div className="kanban-board" style={{ overflowX: 'auto', minHeight: '70vh' }}>
      {allStages.map(stage => {
        const stageClients = clients.filter(c => c.stage === stage);
        const isDragOver = dragOverColumn === stage;

        return (
          <div
            key={stage}
            className="kanban-column"
            onDragOver={(e) => handleDragOver(e, stage, stageClients.length)}
            onDrop={(e) => handleDrop(e, stage)}
          >
            {/* Column Header */}
            <div className="kanban-column-header">
              <span className="kanban-column-title">{stage}</span>
              <span className="kanban-column-count">{stageClients.length}</span>
            </div>

            {/* Cards */}
            <div className="kanban-cards-container" style={{ display: 'flex', flexDirection: 'column', gap: '0', minHeight: '60px' }}>
              {stageClients.length === 0 && stage === 'Finalizado' && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', padding: '32px 16px', color: 'var(--text-secondary)' }}>
                  <CheckCircle size={32} style={{ color: '#2E2E2E' }} />
                  <span style={{ fontSize: '12px' }}>Nenhum cliente aqui</span>
                </div>
              )}

              {stageClients.map((client, index) => {
                const isDragging = draggedClientId === client.id;
                const isDropTarget = isDragOver && dragOverIndex === index;
                const critBadgeClass = client.criticality === 'Crítico' ? 'badge-critico' : client.criticality === 'Atenção' ? 'badge-atencao' : 'badge-estavel';
                const deadline = getDeadlineDisplay(client.nextContactDate);
                const isEditingThis = editingAction?.clientId === client.id;

                return (
                  <div key={client.id}>
                    {/* Drop indicator ABOVE card */}
                    {isDropTarget && (
                      <div className="kanban-drop-indicator" />
                    )}

                    <div
                      className={`kanban-card ${isDragging ? 'kanban-card-dragging' : ''}`}
                      draggable
                      onDragStart={(e) => handleDragStart(e, client.id)}
                      onDragEnd={handleDragEnd}
                    >
                      {/* Card Top: Name + Badge */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                        <span
                          style={{ fontWeight: '700', fontSize: '14px', cursor: 'pointer', lineHeight: '1.3' }}
                          onClick={() => onNavigate(`clientes/${client.id}`)}
                        >
                          {client.name}
                        </span>
                        <span className={`badge ${critBadgeClass}`} style={{ fontSize: '9px', padding: '2px 5px', flexShrink: 0 }}>
                          {client.criticality}
                        </span>
                      </div>

                      {/* Responsible */}
                      <div className="kanban-card-responsible">
                        <User size={12} />
                        <span>{client.responsible || 'Não atribuído'}</span>
                      </div>

                      {/* Module Pills */}
                      {client.activeModules && client.activeModules.length > 0 && (
                        <div className="kanban-card-modules">
                          {client.activeModules.slice(0, 3).map(mod => (
                            <span key={mod} className="kanban-card-module-pill">{mod}</span>
                          ))}
                          {client.activeModules.length > 3 && (
                            <span className="kanban-card-module-pill">+{client.activeModules.length - 3}</span>
                          )}
                        </div>
                      )}

                      {/* Divider */}
                      <hr className="kanban-card-divider" />

                      {/* Footer: Next Action + Deadline */}
                      <div className="kanban-card-footer">
                        <div className="kanban-card-footer-col">
                          <span className="kanban-card-footer-label">Próxima Ação</span>
                          {isEditingThis ? (
                            <textarea
                              ref={textareaRef}
                              className="kanban-card-textarea"
                              value={editingAction.value}
                              rows={2}
                              onChange={e => setEditingAction(prev => ({ ...prev, value: e.target.value }))}
                              onKeyDown={e => handleKeyDownEditAction(e, client.id)}
                              onBlur={() => handleSaveEditAction(client.id)}
                            />
                          ) : (
                            <span
                              className="kanban-card-footer-val kanban-card-action-green"
                              onClick={() => handleStartEditAction(client.id, client.nextAction)}
                              title="Clique para editar"
                            >
                              {client.nextAction || 'Clique para definir...'}
                            </span>
                          )}
                        </div>
                        <div className="kanban-card-footer-col">
                          <span className="kanban-card-footer-label">Prazo SLA</span>
                          <span className={`kanban-card-footer-val ${deadline.className}`} style={{ fontWeight: deadline.className ? '600' : '400' }}>
                            {deadline.text}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Drop indicator at bottom of column */}
              {isDragOver && dragOverIndex === stageClients.length && (
                <div className="kanban-drop-indicator" />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
