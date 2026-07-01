import React, { useState } from 'react';
import { Calendar, Users, CheckSquare, AlertTriangle, Edit2, Trash2, X, Plus } from 'lucide-react';
import { parseBRDate, getDateStatus, toBRDate } from '../utils';

export default function DashboardView({ 
  clients, 
  onAddReminder, 
  onUpdateReminder, 
  onRemoveReminder, 
  onRegisterContact, 
  onNavigate 
}) {
  const [activeModal, setActiveModal] = useState(null); // null, 'reunioes', 'ativos', 'tarefas', 'criticos'
  
  // Quick Reminder Form State
  const [quickTitle, setQuickTitle] = useState('');
  const [quickClientId, setQuickClientId] = useState('');
  const [quickDate, setQuickDate] = useState('');

  // Editing reminder state
  const [editingReminder, setEditingReminder] = useState(null); // { clientId, id, type, title, description, deadline, criticality }
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editDeadline, setEditDeadline] = useState('');
  const [editCriticality, setEditCriticality] = useState('Normal');

  const [dismissingReminderIds, setDismissingReminderIds] = useState([]);

  const todayStr = '30/06/2026';
  
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

  // Active clients
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

  // Top 3 critical clients for SLA summary
  const getCriticalityScore = (crit) => {
    if (crit === 'Crítico') return 3;
    if (crit === 'Atenção') return 2;
    return 1;
  };
  const slaClients = [...clients]
    .sort((a, b) => getCriticalityScore(b.criticality) - getCriticalityScore(a.criticality))
    .slice(0, 3);

  // Merge Custom Reminders and SLA Automatic Cycles
  const mergedReminders = [];
  clients.forEach(c => {
    // 1. Custom reminders
    if (c.reminders) {
      c.reminders.forEach(r => {
        mergedReminders.push({
          id: r.id,
          type: 'custom',
          clientId: c.id,
          clientName: c.name,
          title: r.title,
          description: r.description,
          deadline: r.deadline,
          criticality: r.criticality // Urgente / Normal / Baixo
        });
      });
    }
    // 2. SLA Automatic Cycles
    if (c.nextContactDate) {
      mergedReminders.push({
        id: `cycle_${c.id}`,
        type: 'cycle',
        clientId: c.id,
        clientName: c.name,
        title: `Contato Periódico (${c.criticality})`,
        description: `Contato periódico a cada ${c.criticality === 'Crítico' ? '1 dia' : c.criticality === 'Atenção' ? '2 dias' : '3 dias'}`,
        deadline: c.nextContactDate,
        criticality: c.criticality === 'Crítico' ? 'Urgente' : c.criticality === 'Atenção' ? 'Normal' : 'Baixo'
      });
    }
  });

  // Sort by deadline (closer/overdue first)
  mergedReminders.sort((a, b) => {
    return parseBRDate(a.deadline).getTime() - parseBRDate(b.deadline).getTime();
  });

  // Quick Reminder submit
  const handleQuickAddReminder = (e) => {
    e.preventDefault();
    if (!quickTitle.trim() || !quickClientId || !quickDate) return;

    // Convert date string from ISO date selector (YYYY-MM-DD) to BR format (DD/MM/AAAA)
    const brFormattedDate = toBRDate(quickDate);

    onAddReminder(quickClientId, quickTitle, '', brFormattedDate, 'Normal');
    setQuickTitle('');
    setQuickClientId('');
    setQuickDate('');
  };

  const handleOpenEditReminder = (item) => {
    setEditingReminder(item);
    setEditTitle(item.title);
    setEditDescription(item.description || '');
    // Convert BR format to ISO format for input date field
    const [day, month, year] = item.deadline.split('/');
    setEditDeadline(`${year}-${month}-${day}`);
    setEditCriticality(item.criticality);
  };

  const handleSaveEditReminder = (e) => {
    e.preventDefault();
    if (!editingReminder) return;

    const brFormattedDate = toBRDate(editDeadline);

    if (editingReminder.type === 'custom') {
      onUpdateReminder(editingReminder.clientId, editingReminder.id, {
        title: editTitle,
        description: editDescription,
        deadline: brFormattedDate,
        criticality: editCriticality
      });
    } else {
      // Edit cycle contact date directly
      onRegisterContact(editingReminder.clientId, 'Ajustado data de ciclo manualmente');
    }
    setEditingReminder(null);
  };

  const handleDismissReminder = (item) => {
    setDismissingReminderIds(prev => [...prev, item.id]);
    setTimeout(() => {
      if (item.type === 'custom') {
        onRemoveReminder(item.clientId, item.id);
      } else {
        // Dismiss cycle contacts means register the contact done
        onRegisterContact(item.clientId, 'Contato de ciclo registrado');
      }
      setDismissingReminderIds(prev => prev.filter(id => id !== item.id));
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
        <div className="dashboard-section" style={{ minWidth: '0' }}>
          <div className="section-header">
            <h3 className="section-title">Lembretes Ativos</h3>
          </div>

          {/* Quick Reminder Bar */}
          <form onSubmit={handleQuickAddReminder} className="quick-reminder-bar">
            <input 
              type="text" 
              className="form-input" 
              placeholder="O que precisa ser feito?" 
              value={quickTitle}
              onChange={e => setQuickTitle(e.target.value)}
              style={{ flex: 2, minWidth: '150px' }}
              required
            />
            <select 
              className="form-select" 
              value={quickClientId}
              onChange={e => setQuickClientId(e.target.value)}
              style={{ flex: 1, minWidth: '120px' }}
              required
            >
              <option value="">Selecionar cliente...</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <input 
              type="date" 
              className="form-input"
              value={quickDate}
              onChange={e => setQuickDate(e.target.value)}
              style={{ flex: 1, minWidth: '120px' }}
              required
            />
            <button type="submit" className="btn-primary" style={{ padding: '8px 14px', height: '38px', flexShrink: 0 }}>
              <Plus size={14} />
              <span>Adicionar</span>
            </button>
          </form>

          {/* Reminders List */}
          <div className="reminders-list">
            {mergedReminders.length === 0 ? (
              <div className="empty-state">
                <span className="empty-state-icon">🔔</span>
                <p>Nenhum lembrete ativo no momento.</p>
              </div>
            ) : (
              mergedReminders.map(item => {
                const isDismissing = dismissingReminderIds.includes(item.id);
                const status = getDateStatus(item.deadline, todayStr);
                
                let statusClass = 'date-future';
                if (status === 'overdue') statusClass = 'date-overdue';
                else if (status === 'today') statusClass = 'date-today';

                let criticalityBadgeClass = 'badge-estavel';
                if (item.criticality === 'Urgente') criticalityBadgeClass = 'badge-critico';
                if (item.criticality === 'Normal') criticalityBadgeClass = 'badge-atencao';

                return (
                  <div 
                    key={item.id} 
                    className={`reminder-item ${isDismissing ? 'item-fadeout' : ''}`}
                  >
                    <div className="reminder-info">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span 
                          className="reminder-client" 
                          style={{ cursor: 'pointer', color: 'var(--green-primary)' }}
                          onClick={() => onNavigate(`clientes/${item.clientId}`)}
                        >
                          {item.clientName}
                        </span>
                        <span className={`badge ${criticalityBadgeClass}`} style={{ fontSize: '9px', padding: '2px 4px' }}>
                          {item.criticality}
                        </span>
                        {item.type === 'cycle' && <span className="cycle-badge">Ciclo SLA</span>}
                      </div>
                      <p className="reminder-desc" style={{ fontWeight: '500', color: 'var(--text-primary)', marginTop: '4px' }}>{item.title}</p>
                      {item.description && <p className="reminder-desc" style={{ fontSize: '12px' }}>{item.description}</p>}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                        {status === 'overdue' && <AlertTriangle size={12} className="date-overdue" />}
                        <span className={statusClass} style={{ fontSize: '12px' }}>
                          Prazo: {item.deadline} {status === 'overdue' ? '(Atrasado)' : status === 'today' ? '(Hoje)' : ''}
                        </span>
                      </div>
                    </div>
                    <div className="actions-group">
                      {item.type === 'custom' && (
                        <button 
                          className="btn-icon" 
                          onClick={() => handleOpenEditReminder(item)}
                          title="Editar lembrete"
                        >
                          <Edit2 size={14} />
                        </button>
                      )}
                      <button 
                        className="btn-danger-icon" 
                        onClick={() => handleDismissReminder(item)}
                        title={item.type === 'custom' ? 'Concluir lembrete' : 'Registrar contato feito'}
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
      {editingReminder && (
        <div className="modal-overlay" onClick={() => setEditingReminder(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Editar Lembrete</h3>
              <button className="btn-icon" onClick={() => setEditingReminder(null)}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSaveEditReminder}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Título do Lembrete</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={editTitle}
                    onChange={e => setEditTitle(e.target.value)}
                    required
                  />
                </div>
                {editingReminder.type === 'custom' && (
                  <>
                    <div className="form-group">
                      <label className="form-label">Descrição</label>
                      <textarea 
                        className="form-textarea" 
                        rows="2"
                        value={editDescription}
                        onChange={e => setEditDescription(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Criticidade</label>
                      <select 
                        className="form-select" 
                        value={editCriticality}
                        onChange={e => setEditCriticality(e.target.value)}
                      >
                        <option value="Urgente">Urgente</option>
                        <option value="Normal">Normal</option>
                        <option value="Baixo">Baixo</option>
                      </select>
                    </div>
                  </>
                )}
                <div className="form-group">
                  <label className="form-label">Prazo</label>
                  <input 
                    type="date" 
                    className="form-input" 
                    value={editDeadline}
                    onChange={e => setEditDeadline(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setEditingReminder(null)}>Cancelar</button>
                <button type="submit" className="btn-primary">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
