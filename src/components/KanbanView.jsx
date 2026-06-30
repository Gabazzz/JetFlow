import React, { useState } from 'react';
import { initialClients } from '../data/clients';
import { AlertCircle, User, Calendar, CheckSquare, Zap, FolderOpen } from 'lucide-react';
import Client360View from './Client360View';

const COLUMNS = [
  "Novo",
  "Kickoff",
  "Configuração",
  "Integrações",
  "Treinamento",
  "Acompanhamento",
  "Finalizado"
];

export default function KanbanView({ clients, onUpdateClientStage, onUpdateClientChecklist, onUpdateNextAction }) {
  const [draggedClientId, setDraggedClientId] = useState(null);
  const [activeColumnDragOver, setActiveColumnDragOver] = useState(null);
  const [selectedClientId, setSelectedClientId] = useState(null);

  // Drag and Drop handlers
  const handleDragStart = (e, clientId) => {
    setDraggedClientId(clientId);
    e.dataTransfer.setData('text/plain', clientId);
    // Add opacity styling to element immediately
    setTimeout(() => {
      const element = document.getElementById(`card-${clientId}`);
      if (element) element.classList.add('dragging');
    }, 0);
  };

  const handleDragEnd = () => {
    const element = document.getElementById(`card-${draggedClientId}`);
    if (element) element.classList.remove('dragging');
    setDraggedClientId(null);
    setActiveColumnDragOver(null);
  };

  const handleDragOver = (e, column) => {
    e.preventDefault();
    if (activeColumnDragOver !== column) {
      setActiveColumnDragOver(column);
    }
  };

  const handleDragLeave = () => {
    setActiveColumnDragOver(null);
  };

  const handleDrop = (e, column) => {
    e.preventDefault();
    const clientId = e.dataTransfer.getData('text/plain') || draggedClientId;
    if (clientId) {
      onUpdateClientStage(clientId, column);
    }
    setDraggedClientId(null);
    setActiveColumnDragOver(null);
  };

  const handleCardClick = (clientId) => {
    setSelectedClientId(clientId);
  };

  const handleCloseDrawer = () => {
    setSelectedClientId(null);
  };

  const selectedClient = clients.find(c => c.id === selectedClientId);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
      <div className="kanban-container">
        {COLUMNS.map((column) => {
          const columnClients = clients.filter(c => c.stage === column);
          const isOver = activeColumnDragOver === column;

          return (
            <div
              key={column}
              className={`kanban-column ${isOver ? 'drag-over' : ''}`}
              onDragOver={(e) => handleDragOver(e, column)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, column)}
            >
              <div className="column-header">
                <span className="column-title">{column}</span>
                <span className="column-count">{columnClients.length}</span>
              </div>

              <div className="column-cards-container">
                {columnClients.length === 0 ? (
                  <div className="column-empty">
                    <FolderOpen className="column-empty-icon" />
                    <span>Nenhum cliente nesta etapa</span>
                  </div>
                ) : (
                  columnClients.map((client) => (
                    <div
                      key={client.id}
                      id={`card-${client.id}`}
                      className="kanban-card"
                      draggable
                      onDragStart={(e) => handleDragStart(e, client.id)}
                      onDragEnd={handleDragEnd}
                      onClick={() => handleCardClick(client.id)}
                    >
                      <div className="card-top">
                        <span className={`badge ${
                          client.priority === 'Alta' ? 'badge-priority-alta' : 
                          client.priority === 'Média' ? 'badge-priority-media' : 
                          'badge-priority-baixa'
                        }`}>
                          {client.priority}
                        </span>
                        {client.modules.map(mod => (
                          <span key={mod} className="badge-module">{mod}</span>
                        ))}
                      </div>

                      <h3 className="card-title">{client.name}</h3>

                      <div className="card-meta">
                        <span style={{ display: 'flex', alignPosition: 'center', gap: '4px', alignItems: 'center' }}>
                          <User size={12} />
                          {client.owner.split(' ')[0]}
                        </span>
                        <span style={{ display: 'flex', alignPosition: 'center', gap: '4px', alignItems: 'center' }}>
                          <Calendar size={12} />
                          {client.deadline}
                        </span>
                      </div>

                      <div className="card-divider" />

                      <div className="card-action">
                        <Zap size={12} style={{ color: 'var(--green-primary)' }} />
                        <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                          Próxima ação: {client.nextAction}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Drawer Overlay */}
      <div 
        className={`drawer-overlay ${selectedClientId ? 'open' : ''}`}
        onClick={handleCloseDrawer}
      />

      {/* Slide-out Drawer */}
      <div className={`drawer ${selectedClientId ? 'open' : ''}`}>
        {selectedClient && (
          <Client360View 
            client={selectedClient} 
            isDrawer={true} 
            onClose={handleCloseDrawer} 
            onUpdateChecklist={(mod, itemIdx, val) => onUpdateClientChecklist(selectedClient.id, mod, itemIdx, val)}
            onUpdateNextAction={(completed) => onUpdateNextAction(selectedClient.id, completed)}
          />
        )}
      </div>
    </div>
  );
}
