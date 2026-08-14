import React, { useState, useMemo } from 'react';
import {
  CheckSquare, Clock, ExternalLink, Plus, X, User, AlertTriangle,
  MessageSquare, Check
} from 'lucide-react';
import CustomDatePicker from './CustomDatePicker';
import { getTodayBR, parseBRDate, getClientPhase } from '../utils';

const ORIGIN_META = {
  Onboarding: { color: 'var(--green-primary)', bg: '#1E351F' },
  CS: { color: '#38BDF8', bg: '#0F2733' },
  Suporte: { color: '#F59E0B', bg: '#3D2F1D' },
  Pessoal: { color: '#A78BFA', bg: '#2A2140' }
};

const FILTERS = ['Todas', 'Onboarding', 'CS', 'Suporte', 'Pessoal'];

const GROUPS = [
  { key: 'atrasadas', label: 'Atrasadas', color: '#EF4444' },
  { key: 'hoje', label: 'Hoje', color: 'var(--green-primary)' },
  { key: 'amanha', label: 'Amanhã', color: '#38BDF8' },
  { key: 'esta_semana', label: 'Esta semana', color: '#aaa' },
  { key: 'sem_prazo', label: 'Sem prazo definido', color: '#666' }
];

function criticalityRank(crit) {
  if (crit === 'Crítico' || crit === 'Urgente') return 4;
  if (crit === 'Atenção' || crit === 'Normal') return 3;
  if (crit === 'Baixo' || crit === 'Baixa') return 1;
  return 2;
}

function ticketPriorityRank(p) {
  if (p === 'Urgente') return 4;
  if (p === 'Alta') return 3;
  if (p === 'Normal') return 2;
  return 1;
}

function getGroupKey(dueDate, todayDateObj) {
  if (!dueDate) return 'sem_prazo';
  let d;
  try {
    d = parseBRDate(dueDate);
    if (isNaN(d.getTime())) return 'sem_prazo';
  } catch (e) {
    return 'sem_prazo';
  }
  const diffDays = Math.round((d.getTime() - todayDateObj.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return 'atrasadas';
  if (diffDays === 0) return 'hoje';
  if (diffDays === 1) return 'amanha';
  return 'esta_semana';
}

function formatDueLabel(dueDate, groupKey) {
  if (!dueDate) return null;
  if (groupKey === 'hoje') return 'Hoje';
  if (groupKey === 'amanha') return 'Amanhã';
  return dueDate;
}

export default function TarefasView({
  clients,
  tickets,
  standaloneTasks,
  onNavigate,
  onCompleteClientNextAction,
  onSnoozeClientNextContact,
  onRemoveClientReminder,
  onSnoozeClientReminder,
  onResolveTicket,
  onAddStandaloneTask,
  onToggleStandaloneTask,
  onSnoozeStandaloneTask
}) {
  const [activeFilter, setActiveFilter] = useState('Todas');
  const [resolvingTicketId, setResolvingTicketId] = useState(null);
  const [resolutionNoteText, setResolutionNoteText] = useState('');
  const [completedTodayCount, setCompletedTodayCount] = useState(0);
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');

  const todayStr = getTodayBR();
  const todayDateObj = parseBRDate(todayStr);

  // Combine everything already in the system into one flat queue — no
  // manual step required from the user, and no extra Supabase queries:
  // built entirely from data App.jsx already loaded.
  const allItems = useMemo(() => {
    const items = [];

    clients.forEach(client => {
      const clientTickets = tickets.filter(t => t.clientId === client.id);
      const phase = getClientPhase(client, clientTickets, todayStr);
      const origin = phase === 'Onboarding' ? 'Onboarding' : 'CS';

      if (client.nextAction && client.nextAction.trim()) {
        items.push({
          id: `nextaction_${client.id}`,
          kind: 'nextAction',
          title: client.nextAction,
          clientId: client.id,
          clientName: client.name,
          origin,
          dueDate: client.nextContactDate || null,
          priorityRank: criticalityRank(client.criticality)
        });
      }

      (client.reminders || []).forEach(r => {
        items.push({
          id: `reminder_${r.id}`,
          kind: 'reminder',
          reminderId: r.id,
          title: r.title,
          clientId: client.id,
          clientName: client.name,
          origin,
          dueDate: r.deadline || null,
          priorityRank: criticalityRank(r.criticality)
        });
      });
    });

    tickets.forEach(t => {
      if (t.status === 'Resolvido' || t.status === 'Fechado') return;
      const client = clients.find(c => c.id === t.clientId);
      items.push({
        id: `ticket_${t.id}`,
        kind: 'ticket',
        ticketId: t.id,
        title: t.subject,
        clientId: t.clientId,
        clientName: client ? client.name : null,
        origin: 'Suporte',
        dueDate: null,
        priorityRank: ticketPriorityRank(t.priority)
      });
    });

    standaloneTasks.forEach(t => {
      if (t.completed) return;
      items.push({
        id: `task_${t.id}`,
        kind: 'task',
        taskId: t.id,
        title: t.title,
        clientId: null,
        clientName: null,
        origin: 'Pessoal',
        dueDate: t.dueDate || null,
        priorityRank: 2
      });
    });

    return items.map(item => ({ ...item, groupKey: getGroupKey(item.dueDate, todayDateObj) }));
  }, [clients, tickets, standaloneTasks, todayStr]);

  const filteredItems = useMemo(() => {
    if (activeFilter === 'Todas') return allItems;
    return allItems.filter(i => i.origin === activeFilter);
  }, [allItems, activeFilter]);

  const groupedItems = useMemo(() => {
    const byGroup = {};
    GROUPS.forEach(g => { byGroup[g.key] = []; });
    filteredItems.forEach(item => { byGroup[item.groupKey].push(item); });

    Object.keys(byGroup).forEach(key => {
      byGroup[key].sort((a, b) => {
        if (a.dueDate && b.dueDate) {
          const da = parseBRDate(a.dueDate).getTime();
          const db = parseBRDate(b.dueDate).getTime();
          if (da !== db) return da - db;
        }
        return b.priorityRank - a.priorityRank;
      });
    });

    return byGroup;
  }, [filteredItems]);

  const pendingTodayCount = allItems.filter(i => i.groupKey === 'hoje').length;
  const totalTodayCount = completedTodayCount + pendingTodayCount;
  const progressPct = totalTodayCount === 0 ? 0 : Math.round((completedTodayCount / totalTodayCount) * 100);

  const handleComplete = (item) => {
    if (item.groupKey === 'hoje') setCompletedTodayCount(c => c + 1);
    if (item.kind === 'nextAction') onCompleteClientNextAction(item.clientId);
    else if (item.kind === 'reminder') onRemoveClientReminder(item.clientId, item.reminderId);
    else if (item.kind === 'task') onToggleStandaloneTask(item.taskId);
  };

  const handleSnooze = (item) => {
    if (item.kind === 'nextAction') onSnoozeClientNextContact(item.clientId);
    else if (item.kind === 'reminder') onSnoozeClientReminder(item.clientId, item.reminderId);
    else if (item.kind === 'task') onSnoozeStandaloneTask(item.taskId);
  };

  const handleConfirmResolveTicket = (item) => {
    if (item.groupKey === 'hoje') setCompletedTodayCount(c => c + 1);
    onResolveTicket(item.ticketId, resolutionNoteText.trim());
    setResolvingTicketId(null);
    setResolutionNoteText('');
  };

  const handleSubmitNewTask = (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    onAddStandaloneTask(newTaskTitle.trim(), newTaskDueDate);
    setNewTaskTitle('');
    setNewTaskDueDate('');
    setIsNewTaskOpen(false);
  };

  const totalItemsCount = filteredItems.length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%' }}>

      {/* Header: progress + filters + new task */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '240px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '600' }}>
              {completedTodayCount} de {totalTodayCount} concluídas hoje
            </span>
            <div style={{ width: '260px', maxWidth: '100%', height: '6px', backgroundColor: '#1E1E1E', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: `${progressPct}%`, height: '100%', backgroundColor: 'var(--green-primary)', transition: 'width 250ms ease-out' }} />
            </div>
          </div>

          <button className="btn-primary" onClick={() => setIsNewTaskOpen(true)}>
            <Plus size={16} />
            <span>Nova tarefa</span>
          </button>
        </div>

        {/* Filter chips */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              style={{
                padding: '6px 14px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: '700',
                border: `1px solid ${activeFilter === f ? 'var(--green-primary)' : '#2A2A2A'}`,
                backgroundColor: activeFilter === f ? 'rgba(101, 255, 75, 0.1)' : '#161616',
                color: activeFilter === f ? 'var(--green-primary)' : '#aaa',
                cursor: 'pointer'
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Grouped queue */}
      {totalItemsCount === 0 ? (
        <div className="empty-state" style={{ padding: '60px 20px' }}>
          <span className="empty-state-icon">🎉</span>
          <p>Tudo em dia! Nenhuma tarefa pendente {activeFilter !== 'Todas' ? `em "${activeFilter}"` : ''}.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {GROUPS.map(group => {
            const items = groupedItems[group.key];
            if (!items || items.length === 0) return null;
            return (
              <div key={group.key} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: group.color }} />
                  <span style={{ fontSize: '12px', fontWeight: '800', color: group.color, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {group.label}
                  </span>
                  <span style={{ fontSize: '11px', color: '#666' }}>({items.length})</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {items.map(item => {
                    const meta = ORIGIN_META[item.origin];
                    const isOverdue = group.key === 'atrasadas';
                    const isResolvingThis = resolvingTicketId === item.ticketId;
                    const dueLabel = formatDueLabel(item.dueDate, item.groupKey);
                    const canSnooze = item.kind !== 'ticket' && !!item.dueDate;

                    return (
                      <div
                        key={item.id}
                        style={{
                          backgroundColor: '#161616',
                          border: `1px solid ${isOverdue ? 'rgba(239, 68, 68, 0.35)' : '#252525'}`,
                          borderLeft: isOverdue ? '3px solid #EF4444' : '3px solid transparent',
                          borderRadius: '8px',
                          padding: '14px 16px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '10px'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                          <input
                            type="checkbox"
                            className="premium-check"
                            checked={false}
                            style={{ marginTop: '2px', flexShrink: 0 }}
                            onChange={() => {
                              if (item.kind === 'ticket') {
                                setResolvingTicketId(isResolvingThis ? null : item.ticketId);
                                setResolutionNoteText('');
                              } else {
                                handleComplete(item);
                              }
                            }}
                          />

                          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                              <span style={{ fontSize: '13px', fontWeight: '600', color: '#fff' }}>{item.title}</span>
                              <span style={{ fontSize: '9px', fontWeight: '800', color: meta.color, backgroundColor: meta.bg, padding: '2px 7px', borderRadius: '4px', textTransform: 'uppercase' }}>
                                {item.origin}
                              </span>
                              {isOverdue && <AlertTriangle size={12} style={{ color: '#EF4444' }} />}
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', fontSize: '11px', color: '#888' }}>
                              {item.clientName && (
                                <span
                                  style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--green-primary)', fontWeight: '600', cursor: 'pointer' }}
                                  onClick={() => onNavigate(`clientes/${item.clientId}`)}
                                >
                                  <User size={11} />
                                  {item.clientName}
                                </span>
                              )}
                              {dueLabel && (
                                <span className={isOverdue ? 'date-overdue' : ''} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <Clock size={11} />
                                  {dueLabel}
                                </span>
                              )}
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                            {canSnooze && (
                              <button className="btn-icon" style={{ width: '28px', height: '28px' }} title="Adiar 1 dia" onClick={() => handleSnooze(item)}>
                                <Clock size={13} />
                              </button>
                            )}
                            {item.kind === 'ticket' && (
                              <button className="btn-icon" style={{ width: '28px', height: '28px' }} title="Abrir chamado completo" onClick={() => onNavigate('suporte')}>
                                <ExternalLink size={13} />
                              </button>
                            )}
                          </div>
                        </div>

                        {isResolvingThis && (
                          <div style={{ display: 'flex', gap: '8px', paddingLeft: '30px', alignItems: 'center' }}>
                            <MessageSquare size={13} style={{ color: '#666', flexShrink: 0 }} />
                            <input
                              type="text"
                              className="form-input"
                              style={{ flex: 1, fontSize: '12px', height: '32px' }}
                              placeholder="Nota de resolução, opcional"
                              value={resolutionNoteText}
                              onChange={e => setResolutionNoteText(e.target.value)}
                              autoFocus
                              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleConfirmResolveTicket(item); } if (e.key === 'Escape') setResolvingTicketId(null); }}
                            />
                            <button className="btn-primary" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => handleConfirmResolveTicket(item)}>
                              <Check size={13} />
                              <span>Concluir</span>
                            </button>
                            <button className="btn-icon" style={{ width: '28px', height: '28px' }} onClick={() => setResolvingTicketId(null)}>
                              <X size={13} />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* New standalone task modal */}
      {isNewTaskOpen && (
        <div className="modal-overlay" onClick={() => setIsNewTaskOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '420px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Nova Tarefa</h3>
              <button className="btn-icon" onClick={() => setIsNewTaskOpen(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleSubmitNewTask}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Título *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newTaskTitle}
                    onChange={e => setNewTaskTitle(e.target.value)}
                    placeholder="O que precisa ser feito?"
                    autoFocus
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Prazo (opcional)</label>
                  <CustomDatePicker value={newTaskDueDate} onChange={setNewTaskDueDate} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setIsNewTaskOpen(false)}>Cancelar</button>
                <button type="submit" className="btn-primary">
                  <CheckSquare size={14} />
                  <span>Adicionar</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
