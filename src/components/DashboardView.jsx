import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  Users, 
  CheckSquare, 
  AlertCircle, 
  RefreshCw, 
  BookOpen,
  CheckCircle2
} from 'lucide-react';

export default function DashboardView({ clients, tasks, onToggleTask, onNavigate }) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 8000); // 800ms as requested
    return () => clearTimeout(timer);
  }, []);

  // Metrics Data setup
  const meetingsTodayCount = tasks.filter(t => t.type === 'Reunião').length;
  const activeClientsCount = clients.filter(c => c.stage !== 'Finalizado').length;
  const pendingTasksCount = tasks.filter(t => !t.completed).length;
  const lateClientsCount = clients.filter(c => c.attentionStatus === 'Atrasado').length;
  const pendingFollowupsCount = clients.filter(c => c.nextAction && c.nextAction.toLowerCase().includes('follow-up')).length;
  const trainingTodayCount = tasks.filter(t => t.type === 'Treinamento').length;

  const metrics = [
    { title: 'Reuniões hoje', value: meetingsTodayCount, icon: CalendarIcon, status: 'positive' },
    { title: 'Clientes ativos', value: activeClientsCount, icon: Users, status: 'positive' },
    { title: 'Próximas tarefas', value: pendingTasksCount, icon: CheckSquare, status: 'positive' },
    { title: 'Clientes atrasados', value: lateClientsCount, icon: AlertCircle, status: 'critical' },
    { title: 'Follow-ups pendentes', value: pendingFollowupsCount, icon: RefreshCw, status: 'attention' },
    { title: 'Treinamentos hoje', value: trainingTodayCount, icon: BookOpen, status: 'positive' },
  ];

  // Attention clients list
  const attentionClients = clients.filter(c => c.attentionStatus);

  // Generate calendar days for June 2026 (June 1st is Monday, 30 days)
  const renderCalendarDays = () => {
    const days = [];
    // June 1 2026 is Monday, so no empty cells at the start if starting grid from Monday.
    // If grid starts on Sunday, we need 1 empty cell. Let's make it start on Sunday.
    // Empty cell for Sunday:
    days.push(<div key="empty-0" className="calendar-day empty"></div>);
    
    for (let i = 1; i <= 30; i++) {
      const isToday = i === 29; // June 29, 2026 is today's mock date based on metadata
      const hasMeeting = i === 9 || i === 15 || i === 22 || i === 29;
      
      days.push(
        <div 
          key={`day-${i}`} 
          className={`calendar-day ${isToday ? 'today' : ''} ${hasMeeting ? 'has-meeting' : ''}`}
          title={isToday ? 'Hoje' : hasMeeting ? 'Dia com reuniões' : ''}
        >
          {i}
        </div>
      );
    }
    return days;
  };

  if (isLoading) {
    return (
      <div className="dashboard-grid">
        {/* Metric Cards Skeleton */}
        <div className="metrics-container">
          {Array(6).fill(0).map((_, idx) => (
            <div key={idx} className="metric-card skeleton" style={{ minHeight: '100px' }}>
              <div className="metric-header">
                <div className="skeleton-text" style={{ width: '60px' }}></div>
                <div className="skeleton-avatar" style={{ width: '16px', height: '16px' }}></div>
              </div>
              <div className="skeleton-card-value" style={{ marginTop: '8px' }}></div>
            </div>
          ))}
        </div>

        {/* Content Skeleton */}
        <div className="dashboard-content-layout">
          <div className="dashboard-section skeleton" style={{ minHeight: '400px' }}>
            <div className="skeleton-title"></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '20px' }}>
              {Array(5).fill(0).map((_, idx) => (
                <div key={idx} className="skeleton-text" style={{ height: '50px', borderRadius: '8px' }}></div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="dashboard-section skeleton" style={{ minHeight: '220px' }}>
              <div className="skeleton-title"></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '20px' }}>
                {Array(3).fill(0).map((_, idx) => (
                  <div key={idx} className="skeleton-text" style={{ height: '40px', borderRadius: '8px' }}></div>
                ))}
              </div>
            </div>
            <div className="calendar-card skeleton" style={{ minHeight: '220px' }}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-grid">
      {/* Metric Cards */}
      <section className="metrics-container" aria-label="Métricas de Desempenho">
        {metrics.map((m, idx) => {
          const Icon = m.icon;
          return (
            <div key={idx} className={`metric-card ${m.status}`}>
              <div className="metric-header">
                <span className="metric-title">{m.title}</span>
                <Icon className="metric-icon" />
              </div>
              <span className="metric-value">{m.value}</span>
            </div>
          );
        })}
      </section>

      {/* Main dashboard content */}
      <div className="dashboard-content-layout">
        {/* Left Column: Activities of the Day */}
        <div className="dashboard-section">
          <div className="section-header">
            <h2 className="section-title">
              <CheckSquare className="nav-icon" style={{ color: 'var(--green-primary)' }} />
              Atividades do dia
            </h2>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>June 29, 2026</span>
          </div>

          <div className="activity-list">
            {tasks.map((task) => (
              <div key={task.id} className="activity-item">
                <div className="activity-left">
                  <span className="activity-time">{task.time}</span>
                  <span className={`badge ${task.type.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")}`}>
                    {task.type}
                  </span>
                  <div className="activity-info">
                    <span className="activity-title-text" style={{ textDecoration: task.completed ? 'line-through' : 'none', color: task.completed ? 'var(--text-secondary)' : 'var(--text-primary)' }}>
                      {task.title}
                    </span>
                    <span className="activity-meta">
                      Cliente:{' '}
                      <span 
                        className="client-name-link" 
                        onClick={() => onNavigate(`clientes/${task.clientId}`)}
                      >
                        {task.clientName}
                      </span>
                      {' · '}Responsável: {task.responsible}
                    </span>
                  </div>
                </div>
                <button 
                  className={`btn-done ${task.completed ? 'completed' : ''}`}
                  onClick={() => onToggleTask(task.id)}
                >
                  {task.completed ? 'Concluído ✓' : 'Marcar como feito'}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Needs Attention & Calendar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Need Attention */}
          <div className="dashboard-section">
            <div className="section-header">
              <h2 className="section-title">
                <AlertCircle className="nav-icon" style={{ color: 'var(--color-critical)' }} />
                Atenção necessária
              </h2>
            </div>

            <div className="attention-list">
              {attentionClients.map((client) => (
                <div key={client.id} className="attention-item">
                  <div className="attention-top">
                    <span 
                      className="client-name-link attention-client" 
                      onClick={() => onNavigate(`clientes/${client.id}`)}
                    >
                      {client.name}
                    </span>
                    <span className={`badge ${client.attentionStatus === 'Atrasado' ? 'atrasado' : 'sem-update'}`}>
                      {client.attentionStatus}
                    </span>
                  </div>
                  <div className="attention-middle">
                    <span>⚠️ {client.daysWithoutUpdate} dias sem update</span>
                  </div>
                  <div className="attention-action">
                    <span>⚡ Próxima ação: <strong>{client.attentionAction}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Calendar */}
          <div className="calendar-card">
            <div className="calendar-header">
              <span className="calendar-title">Junho 2026</span>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Hoje: 29</span>
            </div>
            <div className="calendar-grid">
              <div className="calendar-day-name">D</div>
              <div className="calendar-day-name">S</div>
              <div className="calendar-day-name">T</div>
              <div className="calendar-day-name">Q</div>
              <div className="calendar-day-name">Q</div>
              <div className="calendar-day-name">S</div>
              <div className="calendar-day-name">S</div>
              {renderCalendarDays()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
