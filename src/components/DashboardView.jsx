import React, { useState } from 'react';
import { Calendar, Users, CheckSquare, AlertTriangle, Edit2, Trash2, X, ArrowRight } from 'lucide-react';

export default function DashboardView({ clients, onUpdateClientReminder, onNavigate }) {
  const [activeModal, setActiveModal] = useState(null); // null, 'reunioes', 'ativos', 'tarefas', 'criticos'
  const [editingReminderClient, setEditingReminderClient] = useState(null); // client object
  const [editReminderText, setEditReminderText] = useState('');
  const [editReminderDeadline, setEditReminderDeadline] = useState('');
  const [dismissingClientIds, setDismissingClientIds] = useState([]);

  // Calculations for today (2026-06-30)
  const todayStr = '2026-06-30';
  
  // Meetings today
  const meetingsToday = [];
  clients.forEach(c => {
    if (c.meetings) {
      c.meetings.forEach(m => {
        if (m.date === todayStr) {
          meetingsToday.push({
            clientName: c.name,
            clientId: c.id,
            ...m
          });
        }
      });
    }
  });

  // Active clients (all that are not 'Finalizado')
  const activeClients = clients.filter(c => c.stage !== 'Finalizado');

  // Pending tasks
  const pendingTasks = [];
  clients.forEach(c => {
    if (c.tasks) {
      c.tasks.forEach(t => {
        pendingTasks.push({
          clientName: c.name,
          clientId: c.id,
          ...t
        });
      });
    }
  });

  // Critical clients
  const criticalClients = clients.filter(c => c.criticality === 'Crítico');

  // Reminders (clients with active reminder)
  const clientReminders = clients.filter(c => c.reminder && c.reminder.text);

  // Top 3 critical clients for SLA summary (ordered by Criticality priority: Crítico, Atenção, Estável)
  const getCriticalityScore = (crit) => {
    if (crit === 'Crítico') return 3;
    if (crit === 'Atenção') return 2;
    return 1;
  };
  const slaClients = [...clients]
    .sort((a, b) => getCriticalityScore(b.criticality) - getCriticalityScore(a.criticality))
    .slice(0, 3);

  // Edit reminder handler
  const handleOpenEditReminder = (client) => {
    setEditingReminderClient(client);
    setEditReminderText(client.reminder?.text || '');
    setEditReminderDeadline(client.reminder?.deadline || '');
  };

  const handleSaveReminder = (e) => {
    e.preventDefault();
    if (!editingReminderClient) return;
    onUpdateClientReminder(editingReminderClient.id, {
      text: editReminderText,
      deadline: editReminderDeadline
    });
    setEditingReminderClient(null);
  };

  const handleDismissReminder = (clientId) => {
    setDismissingClientIds(prev => [...prev, clientId]);
    setTimeout(() => {
      onUpdateClientReminder(clientId, null);
      setDismissingClientIds(prev => prev.filter(id => id !== clientId));
    }, 150);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', width: '100%' }}>
      {/* Top KPI Grid */}
      <div className="grid-cards">
        <button className="kpi-card" onClick={() => setActiveModal('reunioes')}>
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
            <span className="kpi-label">Reuniões Hoje</span>
            <Calendar size={18} style={{ color: 'var(--green-primary)' }} />
          </div>
          <span className="kpi-value">{meetingsToday.length}</span>
          <span className="kpi-subtitle">Agendadas para hoje</span>
        </button>

        <button className="kpi-card" onClick={() => setActiveModal('ativos')}>
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
            <span className="kpi-label">Clientes Ativos</span>
            <Users size={18} style={{ color: 'var(--green-primary)' }} />
          </div>
          <span className="kpi-value">{activeClients.length}</span>
          <span className="kpi-subtitle">Em processo de onboarding</span>
        </button>

        <button className="kpi-card" onClick={() => setActiveModal('tarefas')}>
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
            <span className="kpi-label">Próximas Tarefas</span>
            <CheckSquare size={18} style={{ color: 'var(--green-primary)' }} />
          </div>
          <span className="kpi-value">{pendingTasks.length}</span>
          <span className="kpi-subtitle">Pendentes nos checklists</span>
        </button>

        <button className="kpi-card" onClick={() => setActiveModal('criticos')}>
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
            <span className="kpi-label">Clientes Críticos</span>
            <AlertTriangle size={18} style={{ color: 'var(--badge-red)' }} />
          </div>
          <span className="kpi-value">{criticalClients.length}</span>
          <span className="kpi-subtitle">SLA crítico ou em atenção</span>
        </button>
      </div>

      {/* Main Dashboard Section */}
      <div className="dashboard-layout">
        {/* Left Side: Reminders */}
        <div className="dashboard-section">
          <div className="section-header">
            <h3 className="section-title">Lembretes Ativos</h3>
          </div>
          <div className="reminders-list">
            {clientReminders.length === 0 ? (
              <div className="empty-state">
                <span className="empty-state-icon">🔔</span>
                <p>Nenhum lembrete ativo no momento.</p>
              </div>
            ) : (
              clientReminders.map(client => {
                const isDismissing = dismissingClientIds.includes(client.id);
                return (
                  <div 
                    key={client.id} 
                    className={`reminder-item ${isDismissing ? 'item-fadeout' : ''}`}
                  >
                    <div className="reminder-info">
                      <span className="reminder-client">{client.name}</span>
                      <p className="reminder-desc">{client.reminder.text}</p>
                      <span className="reminder-time">Prazo: {client.reminder.deadline || 'Sem prazo'}</span>
                    </div>
                    <div className="actions-group">
                      <button 
                        className="btn-icon" 
                        onClick={() => handleOpenEditReminder(client)}
                        title="Editar lembrete"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button 
                        className="btn-danger-icon" 
                        onClick={() => handleDismissReminder(client.id)}
                        title="Dispensar lembrete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: SLA Resumido */}
        <div className="dashboard-section">
          <div className="section-header">
            <h3 className="section-title">Resumo de SLA (Mais Críticos)</h3>
          </div>
          <div className="sla-list">
            {slaClients.length === 0 ? (
              <div className="empty-state">
                <span className="empty-state-icon">📊</span>
                <p>Nenhum cliente cadastrado.</p>
              </div>
            ) : (
              slaClients.map(client => {
                let badgeClass = 'badge-estavel';
                if (client.criticality === 'Crítico') badgeClass = 'badge-critico';
                if (client.criticality === 'Atenção') badgeClass = 'badge-atencao';

                return (
                  <div key={client.id} className="sla-item">
                    <div className="sla-client-row">
                      <span 
                        className="sla-client-name"
                        onClick={() => onNavigate(`clientes/${client.id}`)}
                      >
                        {client.name}
                      </span>
                      <span className={`badge ${badgeClass}`}>{client.criticality}</span>
                    </div>
                    <div className="sla-action-box">
                      <div className="sla-action-title">Próxima Ação:</div>
                      <div>{client.nextAction || 'Nenhuma ação definida'}</div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* KPI Card Details Modal */}
      {activeModal && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {activeModal === 'reunioes' && 'Reuniões Agendadas para Hoje'}
                {activeModal === 'ativos' && 'Clientes em Onboarding Ativo'}
                {activeModal === 'tarefas' && 'Checklist: Próximas Tarefas'}
                {activeModal === 'criticos' && 'Clientes em Estado Crítico'}
              </h3>
              <button className="btn-icon" onClick={() => setActiveModal(null)}>
                <X size={16} />
              </button>
            </div>
            <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
              {activeModal === 'reunioes' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {meetingsToday.length === 0 ? (
                    <p style={{ color: 'var(--text-secondary)' }}>Nenhuma reunião agendada para hoje.</p>
                  ) : (
                    meetingsToday.map(m => (
                      <div 
                        key={m.id} 
                        style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius)', backgroundColor: 'var(--bg-primary)' }}
                      >
                        <div>
                          <strong 
                            style={{ cursor: 'pointer', color: 'var(--green-primary)' }}
                            onClick={() => { setActiveModal(null); onNavigate(`clientes/${m.clientId}`); }}
                          >
                            {m.clientName}
                          </strong>
                          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>{m.title}</div>
                        </div>
                        <span style={{ color: 'var(--green-primary)', fontWeight: '600' }}>{m.time}</span>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeModal === 'ativos' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {activeClients.length === 0 ? (
                    <p style={{ color: 'var(--text-secondary)' }}>Nenhum cliente em onboarding ativo.</p>
                  ) : (
                    activeClients.map(c => (
                      <div 
                        key={c.id} 
                        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius)', backgroundColor: 'var(--bg-primary)' }}
                      >
                        <div>
                          <strong 
                            style={{ cursor: 'pointer' }}
                            onClick={() => { setActiveModal(null); onNavigate(`clientes/${c.id}`); }}
                          >
                            {c.name}
                          </strong>
                          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>Plano: {c.plan}</div>
                        </div>
                        <span style={{ fontSize: '12px', backgroundColor: 'var(--border-color)', padding: '4px 8px', borderRadius: '4px' }}>{c.stage}</span>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeModal === 'tarefas' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {pendingTasks.length === 0 ? (
                    <p style={{ color: 'var(--text-secondary)' }}>Nenhuma tarefa pendente nos checklists.</p>
                  ) : (
                    pendingTasks.map(t => (
                      <div 
                        key={t.id} 
                        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius)', backgroundColor: 'var(--bg-primary)' }}
                      >
                        <div>
                          <span style={{ fontSize: '14px' }}>{t.text}</span>
                          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                            Cliente:{' '}
                            <span 
                              style={{ color: 'var(--green-primary)', cursor: 'pointer' }}
                              onClick={() => { setActiveModal(null); onNavigate(`clientes/${t.clientId}`); }}
                            >
                              {t.clientName}
                            </span>
                          </div>
                        </div>
                        <span style={{ fontSize: '12px', color: 'var(--badge-yellow)' }}>Até {t.deadline}</span>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeModal === 'criticos' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {criticalClients.length === 0 ? (
                    <p style={{ color: 'var(--text-secondary)' }}>Nenhum cliente em estado crítico. Bom trabalho!</p>
                  ) : (
                    criticalClients.map(c => (
                      <div 
                        key={c.id} 
                        style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '16px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius)', backgroundColor: 'var(--bg-primary)' }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <strong 
                            style={{ cursor: 'pointer', color: 'var(--badge-red)' }}
                            onClick={() => { setActiveModal(null); onNavigate(`clientes/${c.id}`); }}
                          >
                            {c.name}
                          </strong>
                          <span className="badge badge-critico">{c.criticality}</span>
                        </div>
                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{c.criticalityJustification || 'Sem justificativa preenchida.'}</p>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setActiveModal(null)}>Fechar</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Reminder Modal */}
      {editingReminderClient && (
        <div className="modal-overlay" onClick={() => setEditingReminderClient(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Editar Lembrete de {editingReminderClient.name}</h3>
              <button className="btn-icon" onClick={() => setEditingReminderClient(null)}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSaveReminder}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Texto do Lembrete</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={editReminderText}
                    onChange={e => setEditReminderText(e.target.value)}
                    placeholder="Descrição do lembrete..."
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Prazo de Resolução</label>
                  <input 
                    type="date" 
                    className="form-input" 
                    value={editReminderDeadline}
                    onChange={e => setEditReminderDeadline(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setEditingReminderClient(null)}>Cancelar</button>
                <button type="submit" className="btn-primary">Salvar Alterações</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
