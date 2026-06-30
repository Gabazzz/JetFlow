import React, { useState } from 'react';
import { CheckCircle2, User, Calendar, ExternalLink, Filter } from 'lucide-react';

export default function TarefasView({ 
  clients, 
  tasks, 
  onToggleTask, 
  onNavigate 
}) {
  const [activeTab, setActiveTab] = useState('todas'); // todas, hoje, semana, atrasadas
  const [clientFilter, setClientFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  // Extract unique module types from tasks for filter dropdown
  const moduleTypes = Array.from(new Set(tasks.map(t => t.module)));

  // Filter logic
  let filteredTasks = [];
  if (activeTab === 'todas') {
    filteredTasks = tasks;
  } else if (activeTab === 'hoje') {
    // Today's tab includes today's tasks and also overdue tasks so they stay visible!
    filteredTasks = tasks.filter(t => t.category === 'hoje' || t.category === 'atrasada');
  } else if (activeTab === 'semana') {
    filteredTasks = tasks.filter(t => t.category === 'semana' || t.category === 'atrasada');
  } else if (activeTab === 'atrasadas') {
    filteredTasks = tasks.filter(t => t.category === 'atrasada');
  }

  // Apply dropdown filters
  if (clientFilter) {
    filteredTasks = filteredTasks.filter(t => t.clientId === clientFilter);
  }
  if (typeFilter) {
    filteredTasks = filteredTasks.filter(t => t.module === typeFilter);
  }

  // Sort logic: tasks with category === 'atrasada' and not completed MUST always be at the top!
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    const aIsAtrasada = a.category === 'atrasada' && !a.completed;
    const bIsAtrasada = b.category === 'atrasada' && !b.completed;
    if (aIsAtrasada && !bIsAtrasada) return -1;
    if (!aIsAtrasada && bIsAtrasada) return 1;
    return 0;
  });

  return (
    <div className="tasks-layout">
      {/* Filters Header Row */}
      <div className="tasks-filter-row">
        <div className="tasks-tabs">
          <button 
            id="tab-all-tasks"
            className={`tasks-tab-btn ${activeTab === 'todas' ? 'active' : ''}`}
            onClick={() => setActiveTab('todas')}
          >
            Todas
          </button>
          <button 
            id="tab-today-tasks"
            className={`tasks-tab-btn ${activeTab === 'hoje' ? 'active' : ''}`}
            onClick={() => setActiveTab('hoje')}
          >
            Hoje
          </button>
          <button 
            id="tab-week-tasks"
            className={`tasks-tab-btn ${activeTab === 'semana' ? 'active' : ''}`}
            onClick={() => setActiveTab('semana')}
          >
            Esta semana
          </button>
          <button 
            id="tab-late-tasks"
            className={`tasks-tab-btn ${activeTab === 'atrasadas' ? 'active' : ''}`}
            onClick={() => setActiveTab('atrasadas')}
          >
            Atrasadas
          </button>
        </div>

        <div className="tasks-dropdowns">
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Filter size={14} style={{ color: 'var(--text-secondary)' }} />
            <select 
              id="filter-task-client"
              className="tasks-select"
              value={clientFilter}
              onChange={(e) => setClientFilter(e.target.value)}
            >
              <option value="">Filtrar por Cliente</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <select 
            id="filter-task-type"
            className="tasks-select"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="">Filtrar por Módulo</option>
            {moduleTypes.map(mod => (
              <option key={mod} value={mod}>{mod}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Task List */}
      <div className="task-list">
        {sortedTasks.length === 0 ? (
          <div className="empty-state-container">
            <CheckCircle2 className="empty-state-icon" style={{ color: 'var(--text-secondary)' }} />
            <span className="empty-state-text">Nenhuma tarefa aqui. Aproveite.</span>
          </div>
        ) : (
          sortedTasks.map((task) => {
            const isAtrasada = task.category === 'atrasada';
            
            return (
              <div 
                key={task.id} 
                id={`task-item-${task.id}`}
                className={`task-card ${task.completed ? 'completed' : ''}`}
              >
                <div className="task-card-left">
                  <input 
                    type="checkbox" 
                    id={`checkbox-task-${task.id}`}
                    className="task-card-checkbox"
                    checked={task.completed}
                    onChange={() => onToggleTask(task.id)}
                  />
                  <div className="task-card-content">
                    <span className="task-card-title">{task.title}</span>
                    <div className="task-card-meta">
                      <span 
                        className="client-name-link"
                        onClick={() => onNavigate(`clientes/${task.clientId}`)}
                      >
                        {task.clientName}
                      </span>
                      <span>·</span>
                      <span>{task.module}</span>
                      <span>·</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <Calendar size={11} />
                        Prazo: {task.deadline}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="task-card-right">
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {isAtrasada && !task.completed && (
                      <span className="badge atrasado">Atrasada</span>
                    )}
                    {task.completed && (
                      <span className="badge done">Concluída</span>
                    )}
                    <span className={`badge ${
                      task.priority === 'Alta' ? 'badge-priority-alta' : 
                      task.priority === 'Média' ? 'badge-priority-media' : 
                      'badge-priority-baixa'
                    }`}>
                      {task.priority}
                    </span>
                  </div>
                  <button 
                    className="btn-action-outline"
                    style={{ padding: '6px 12px', fontSize: '11.5px' }}
                    onClick={() => onNavigate(`clientes/${task.clientId}`)}
                  >
                    Ver cliente
                    <ExternalLink size={11} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
