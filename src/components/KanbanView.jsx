import React, { useState } from 'react';
import { Edit2, Check, X } from 'lucide-react';

export default function KanbanView({ 
  clients, 
  onUpdateClientStage, 
  onUpdateClientNextAction, 
  onNavigate 
}) {
  const columns = ['Novo', 'Kickoff', 'Configuração', 'Treinamento', 'Finalizado'];
  const [editingClientId, setEditingClientId] = useState(null);
  const [nextActionValue, setNextActionValue] = useState('');
  
  // Track which card is hovered during drag-over to show position line indicator
  const [dragOverCardId, setDragOverCardId] = useState(null);

  // Drag and Drop Handlers
  const handleDragStart = (e, clientId) => {
    e.dataTransfer.setData('text/plain', clientId);
  };

  const handleDragOverCard = (e, clientId) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverCardId(clientId);
  };

  const handleDragLeaveColumnOrCard = () => {
    setDragOverCardId(null);
  };

  const handleDragOverColumn = (e) => {
    e.preventDefault();
  };

  const handleDropColumn = (e, targetStage) => {
    e.preventDefault();
    setDragOverCardId(null);
    const clientId = e.dataTransfer.getData('text/plain');
    if (clientId) {
      onUpdateClientStage(clientId, targetStage);
    }
  };

  // Inline Next Action Edit Handlers
  const startEditing = (e, client) => {
    e.stopPropagation(); // Prevent navigating to detail
    setEditingClientId(client.id);
    setNextActionValue(client.nextAction || '');
  };

  const cancelEditing = (e) => {
    e.stopPropagation();
    setEditingClientId(null);
  };

  const saveNextAction = (e, clientId) => {
    e.stopPropagation();
    onUpdateClientNextAction(clientId, nextActionValue);
    setEditingClientId(null);
  };

  return (
    <div className="kanban-board">
      {columns.map((columnName) => {
        const columnClients = clients.filter(c => c.stage === columnName);

        return (
          <div 
            key={columnName} 
            className="kanban-column"
            onDragOver={handleDragOverColumn}
            onDrop={(e) => handleDropColumn(e, columnName)}
          >
            <div className="column-header">
              <span className="column-title">{columnName}</span>
              <span className="column-count">{columnClients.length}</span>
            </div>

            <div 
              className="column-cards"
              onDragLeave={handleDragLeaveColumnOrCard}
            >
              {columnClients.length === 0 ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100px', border: '2px dashed var(--border-color)', borderRadius: 'var(--radius)', color: 'var(--text-secondary)', fontSize: '12px' }}>
                  Sem clientes
                </div>
              ) : (
                columnClients.map((client) => {
                  let badgeClass = 'badge-estavel';
                  if (client.criticality === 'Crítico') badgeClass = 'badge-critico';
                  if (client.criticality === 'Atenção') badgeClass = 'badge-atencao';

                  const isEditingThis = editingClientId === client.id;
                  const isDragOverThis = dragOverCardId === client.id;

                  return (
                    <React.Fragment key={client.id}>
                      {/* Position indicator line between cards only */}
                      {isDragOverThis && <div className="kanban-drop-indicator" />}
                      
                      <div
                        className="kanban-card"
                        draggable
                        onDragStart={(e) => handleDragStart(e, client.id)}
                        onDragOver={(e) => handleDragOverCard(e, client.id)}
                        onClick={() => onNavigate(`clientes/${client.id}`)}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                          <span className="kanban-card-title">{client.name}</span>
                          <span className={`badge ${badgeClass}`} style={{ fontSize: '9px', padding: '2px 6px' }}>{client.criticality}</span>
                        </div>

                        <div className="kanban-card-meta">
                          <span>Plano: <strong>{client.plan}</strong></span>
                        </div>

                        {/* Next Action Box */}
                        <div 
                          className="kanban-card-action"
                          onClick={(e) => e.stopPropagation()} // Prevent card navigation when editing next action
                        >
                          {!isEditingThis ? (
                            <>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', overflow: 'hidden', flex: 1 }}>
                                <span style={{ fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Próxima Ação:</span>
                                <span style={{ fontSize: '12px', fontWeight: '500' }} title={client.nextAction}>{client.nextAction || 'Definir ação...'}</span>
                              </div>
                              <button 
                                className="btn-icon" 
                                style={{ width: '24px', height: '24px', flexShrink: 0 }}
                                onClick={(e) => startEditing(e, client)}
                                title="Editar ação"
                              >
                                <Edit2 size={10} />
                              </button>
                            </>
                          ) : (
                            <div style={{ display: 'flex', width: '100%', gap: '6px', alignItems: 'center' }}>
                              <input 
                                type="text" 
                                className="form-input" 
                                style={{ flex: 1, padding: '4px 8px', fontSize: '12px', height: '28px' }}
                                value={nextActionValue}
                                onChange={(e) => setNextActionValue(e.target.value)}
                                placeholder="Nova ação..."
                                onKeyDown={(e) => { if (e.key === 'Enter') saveNextAction(e, client.id); }}
                                autoFocus
                              />
                              <button 
                                className="btn-icon" 
                                style={{ width: '28px', height: '28px', color: 'var(--green-primary)', flexShrink: 0 }}
                                onClick={(e) => saveNextAction(e, client.id)}
                              >
                                <Check size={12} />
                              </button>
                              <button 
                                className="btn-icon" 
                                style={{ width: '28px', height: '28px', color: 'var(--badge-red)', flexShrink: 0 }}
                                onClick={cancelEditing}
                              >
                                <X size={12} />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </React.Fragment>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
