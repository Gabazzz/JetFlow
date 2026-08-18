import React, { useState, useMemo, useEffect } from 'react';
import {
  CheckSquare, Clock, ExternalLink, Plus, X, User, AlertTriangle,
  MessageSquare, Check, ChevronLeft, ChevronRight, ChevronDown, Undo2,
  Pencil, Trash2
} from 'lucide-react';
import CustomDatePicker from './CustomDatePicker';
import { getTodayBR, parseBRDate, getClientPhase, addDaysToBRDate, getContactAlert } from '../utils';

// Onboarding/CS/Suporte reuse the shared .type-badge pill + tokens; Pessoal
// isn't one of the three official "tipo de demanda" categories, so it keeps
// its own distinct color inline rather than a root-level token.
const TYPE_BADGE_CLASS = {
  Onboarding: 'type-onboarding',
  CS: 'type-cs',
  Suporte: 'type-suporte'
};
const PESSOAL_COLOR = { color: '#A78BFA', bg: 'rgba(167, 139, 250, 0.12)' };

const FILTERS = ['Todas', 'Onboarding', 'CS', 'Suporte', 'Pessoal'];

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

function sortByDateThenPriority(items) {
  return [...items].sort((a, b) => {
    if (a.dueDate && b.dueDate) {
      const da = parseBRDate(a.dueDate).getTime();
      const db = parseBRDate(b.dueDate).getTime();
      if (da !== db) return da - db;
    }
    return b.priorityRank - a.priorityRank;
  });
}

export default function TarefasView({
  clients,
  tickets,
  standaloneTasks,
  stages,
  profile,
  onNavigate,
  onCompleteClientNextAction,
  onSnoozeClientNextContact,
  onRemoveClientReminder,
  onSnoozeClientReminder,
  onEditClientReminder,
  onCompleteClientTask,
  onSnoozeClientTask,
  onUncompleteClientTask,
  onEditClientTask,
  onDeleteClientTask,
  onResolveTicket,
  onRemoveTicket,
  onAddStandaloneTask,
  onToggleStandaloneTask,
  onSnoozeStandaloneTask,
  onEditStandaloneTask,
  onDeleteStandaloneTask
}) {
  const [activeFilter, setActiveFilter] = useState('Todas');
  const [selectedDateBR, setSelectedDateBR] = useState(() => getTodayBR());
  const [resolvingTicketId, setResolvingTicketId] = useState(null);
  const [resolutionNoteText, setResolutionNoteText] = useState('');
  const [completedTodayCount, setCompletedTodayCount] = useState(0);
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [isCompletedOpen, setIsCompletedOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDueDate, setEditDueDate] = useState('');

  const todayStr = getTodayBR();
  const todayDateObj = parseBRDate(todayStr);
  const tomorrowStr = addDaysToBRDate(todayStr, 1);
  const isViewingToday = selectedDateBR === todayStr;

  const selectedDateLabel = selectedDateBR === todayStr
    ? 'Hoje'
    : selectedDateBR === tomorrowStr
      ? 'Amanhã'
      : selectedDateBR;

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

      (client.tasks || []).forEach(t => {
        if (t.completed) return;
        items.push({
          id: `clienttask_${t.id}`,
          kind: 'clientTask',
          clientTaskId: t.id,
          title: t.text,
          clientId: client.id,
          clientName: client.name,
          origin,
          dueDate: t.deadline || null,
          priorityRank: criticalityRank(client.criticality)
        });
      });

      // Automatic "sem contato" check-in — only for clients that actually
      // crossed the Risco threshold (getContactAlert already scopes this to
      // post-onboarding clients). No stored due date: it's derived as "the
      // day this crossed Risco", so it lands in Atrasadas/Hoje on its own
      // and disappears the moment a new contact resets the gap — no
      // separate "concluir" action needed.
      const contactAlert = getContactAlert(client, stages, profile, todayStr);
      if (contactAlert?.level === 'risco') {
        const diasRisco = profile?.alertDiasRisco ?? 30;
        const crossedDateBR = addDaysToBRDate(todayStr, -(contactAlert.dias - diasRisco));
        items.push({
          id: `contactalert_${client.id}`,
          kind: 'contactAlert',
          title: `Cliente sem contato há ${contactAlert.dias} dias — fazer um check-in`,
          clientId: client.id,
          clientName: client.name,
          origin: 'CS',
          dueDate: crossedDateBR,
          priorityRank: 4
        });
      }
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

    return items;
  }, [clients, tickets, standaloneTasks, stages, profile, todayStr]);

  // Items already finished, kept around just for the collapsed "Concluídas"
  // section on the day they were completed. Next-action/reminder/ticket
  // items don't carry a completion date today, so only standalone and
  // client tasks (which do) show up here.
  const completedItems = useMemo(() => {
    const items = [];

    clients.forEach(client => {
      const clientTickets = tickets.filter(t => t.clientId === client.id);
      const phase = getClientPhase(client, clientTickets, todayStr);
      const origin = phase === 'Onboarding' ? 'Onboarding' : 'CS';

      (client.tasks || []).forEach(t => {
        if (!t.completed || !t.completedAt) return;
        items.push({
          id: `clienttask_${t.id}`,
          kind: 'clientTask',
          clientTaskId: t.id,
          title: t.text,
          clientId: client.id,
          clientName: client.name,
          origin,
          completedAt: t.completedAt
        });
      });
    });

    standaloneTasks.forEach(t => {
      if (!t.completed || !t.completedAt) return;
      items.push({
        id: `task_${t.id}`,
        kind: 'task',
        taskId: t.id,
        title: t.title,
        clientId: null,
        clientName: null,
        origin: 'Pessoal',
        completedAt: t.completedAt
      });
    });

    return items;
  }, [clients, tickets, standaloneTasks, todayStr]);

  const filteredItems = useMemo(() => {
    if (activeFilter === 'Todas') return allItems;
    return allItems.filter(i => i.origin === activeFilter);
  }, [allItems, activeFilter]);

  const completedForSelectedDay = useMemo(() => {
    return completedItems.filter(i =>
      i.completedAt === selectedDateBR && (activeFilter === 'Todas' || i.origin === activeFilter)
    );
  }, [completedItems, selectedDateBR, activeFilter]);

  useEffect(() => {
    setIsCompletedOpen(false);
  }, [selectedDateBR]);

  // Everything is scoped to the selected date: overdue items only make
  // sense relative to today, items due exactly on the selected date always
  // show, and undated items (support tickets have no deadline field, and a
  // standalone task can be created without one) aren't tied to any single
  // day, so they stay visible no matter which day is being browsed.
  const { overdueItems, dayItems, noDueDateItems } = useMemo(() => {
    const overdue = [];
    const day = [];
    const noDate = [];

    filteredItems.forEach(item => {
      if (!item.dueDate) {
        noDate.push(item);
        return;
      }
      const d = parseBRDate(item.dueDate);
      if (isNaN(d.getTime())) {
        noDate.push(item);
        return;
      }
      if (item.dueDate === selectedDateBR) {
        day.push(item);
        return;
      }
      if (isViewingToday && d.getTime() < todayDateObj.getTime()) {
        overdue.push(item);
      }
    });

    return {
      overdueItems: sortByDateThenPriority(overdue),
      dayItems: sortByDateThenPriority(day),
      noDueDateItems: sortByDateThenPriority(noDate)
    };
  }, [filteredItems, selectedDateBR, isViewingToday, todayDateObj]);

  // The "concluídas hoje" counter always tracks real today, regardless of
  // which day is currently being browsed. Tarefas de cliente/avulsas têm
  // completedAt persistido, então são contadas direto dos dados — refletem
  // "Desfazer conclusão" automaticamente e não se perdem ao trocar de rota
  // ou recarregar a página. Próxima ação/lembrete/chamado não guardam
  // quando foram concluídos, então esses continuam num contador de sessão.
  const tasksCompletedTodayCount = completedItems.filter(i => i.completedAt === todayStr).length;
  const totalCompletedTodayCount = completedTodayCount + tasksCompletedTodayCount;
  const pendingTodayCount = allItems.filter(i => i.dueDate === todayStr).length;
  const totalTodayCount = totalCompletedTodayCount + pendingTodayCount;
  const progressPct = totalTodayCount === 0 ? 0 : Math.round((totalCompletedTodayCount / totalTodayCount) * 100);

  const shiftDay = (delta) => setSelectedDateBR(prev => addDaysToBRDate(prev, delta));

  const handleComplete = (item) => {
    // clientTask/task já entram em tasksCompletedTodayCount (derivado de
    // completedAt) — só incrementa aqui pros tipos que não persistem
    // quando foram concluídos, senão contaria em dobro.
    if (item.dueDate === todayStr && item.kind !== 'clientTask' && item.kind !== 'task') {
      setCompletedTodayCount(c => c + 1);
    }
    if (item.kind === 'nextAction') onCompleteClientNextAction(item.clientId);
    else if (item.kind === 'reminder') onRemoveClientReminder(item.clientId, item.reminderId);
    else if (item.kind === 'clientTask') onCompleteClientTask(item.clientId, item.clientTaskId);
    else if (item.kind === 'task') onToggleStandaloneTask(item.taskId);
  };

  const handleSnooze = (item) => {
    if (item.kind === 'nextAction') onSnoozeClientNextContact(item.clientId);
    else if (item.kind === 'reminder') onSnoozeClientReminder(item.clientId, item.reminderId);
    else if (item.kind === 'clientTask') onSnoozeClientTask(item.clientId, item.clientTaskId);
    else if (item.kind === 'task') onSnoozeStandaloneTask(item.taskId);
  };

  const handleUndoComplete = (item) => {
    if (item.kind === 'clientTask') onUncompleteClientTask(item.clientId, item.clientTaskId);
    else if (item.kind === 'task') onToggleStandaloneTask(item.taskId);
  };

  // Título/prazo têm o mesmo formato de edição nos três tipos que são
  // "tarefas" de verdade (avulsa, de cliente e lembrete). Próxima ação já
  // tem seu próprio ciclo de vida (concluir avança para a próxima) e chamado
  // de suporte se edita na Central de Suporte — nenhum dos dois entra aqui.
  const isEditable = (item) => ['task', 'clientTask', 'reminder'].includes(item.kind);
  const isDeletable = (item) => ['task', 'clientTask', 'reminder', 'ticket'].includes(item.kind);

  const openEditItemModal = (item) => {
    setEditingItem(item);
    setEditTitle(item.title);
    setEditDueDate(item.dueDate || '');
  };

  const handleSaveEditItem = (e) => {
    e.preventDefault();
    if (!editTitle.trim() || !editingItem) return;
    const title = editTitle.trim();
    if (editingItem.kind === 'task') onEditStandaloneTask(editingItem.taskId, { title, dueDate: editDueDate });
    else if (editingItem.kind === 'clientTask') onEditClientTask(editingItem.clientId, editingItem.clientTaskId, { text: title, deadline: editDueDate });
    else if (editingItem.kind === 'reminder') onEditClientReminder(editingItem.clientId, editingItem.reminderId, { title, deadline: editDueDate });
    setEditingItem(null);
  };

  const handleDeleteItem = (item) => {
    if (!window.confirm('Excluir esta tarefa? Essa ação não pode ser desfeita.')) return;
    if (item.kind === 'task') onDeleteStandaloneTask(item.taskId);
    else if (item.kind === 'clientTask') onDeleteClientTask(item.clientId, item.clientTaskId);
    else if (item.kind === 'reminder') onRemoveClientReminder(item.clientId, item.reminderId);
    else if (item.kind === 'ticket') onRemoveTicket(item.ticketId);
  };

  const handleConfirmResolveTicket = (item) => {
    if (item.dueDate === todayStr) setCompletedTodayCount(c => c + 1);
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

  const openNewTaskModal = () => {
    setNewTaskDueDate(selectedDateBR);
    setIsNewTaskOpen(true);
  };

  const renderItemCard = (item, { isOverdue = false } = {}) => {
    const isResolvingThis = item.kind === 'ticket' && resolvingTicketId === item.ticketId;
    const canSnooze = item.kind !== 'ticket' && item.kind !== 'contactAlert' && !!item.dueDate;

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
          {item.kind === 'contactAlert' ? (
            <div style={{ marginTop: '2px', flexShrink: 0, width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Resolve sozinho ao registrar um novo contato com o cliente">
              <Clock size={14} style={{ color: isOverdue ? '#EF4444' : 'var(--badge-yellow)' }} />
            </div>
          ) : (
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
          )}

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '13px', fontWeight: '600', color: '#fff' }}>{item.title}</span>
              {item.origin === 'Pessoal' ? (
                <span className="type-badge" style={{ color: PESSOAL_COLOR.color, backgroundColor: PESSOAL_COLOR.bg }}>
                  {item.origin}
                </span>
              ) : (
                <span className={`type-badge ${TYPE_BADGE_CLASS[item.origin]}`}>
                  {item.origin}
                </span>
              )}
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
              {item.dueDate && (
                <span className={isOverdue ? 'date-overdue' : ''} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Clock size={11} />
                  {item.dueDate}
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
            {isEditable(item) && (
              <button className="btn-icon" style={{ width: '28px', height: '28px' }} title="Editar" onClick={() => openEditItemModal(item)}>
                <Pencil size={13} />
              </button>
            )}
            {isDeletable(item) && (
              <button className="btn-danger-icon" style={{ width: '28px', height: '28px' }} title="Excluir" onClick={() => handleDeleteItem(item)}>
                <Trash2 size={13} />
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
  };

  const sections = [
    ...(isViewingToday && overdueItems.length > 0
      ? [{ key: 'atrasadas', label: 'Atrasadas', color: '#EF4444', items: overdueItems, isOverdue: true }]
      : []),
    { key: 'dia', label: `Tarefas de ${selectedDateLabel}`, color: 'var(--green-primary)', items: dayItems, isOverdue: false },
    ...(noDueDateItems.length > 0
      ? [{ key: 'sem_prazo', label: 'Sem prazo definido', color: '#666', items: noDueDateItems, isOverdue: false }]
      : [])
  ];

  const totalVisibleCount = overdueItems.length + dayItems.length + noDueDateItems.length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%' }}>

      {/* Header: progress + date navigation + new task */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '240px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '600' }}>
              {totalCompletedTodayCount} de {totalTodayCount} concluídas hoje
            </span>
            <div style={{ width: '260px', maxWidth: '100%', height: '6px', backgroundColor: '#1E1E1E', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: `${progressPct}%`, height: '100%', backgroundColor: 'var(--badge-green)', transition: 'width 250ms ease-out' }} />
            </div>
          </div>

          <button className="btn-primary" onClick={openNewTaskModal}>
            <Plus size={16} />
            <span>Nova tarefa</span>
          </button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          {/* Date navigation */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button className="btn-icon" onClick={() => shiftDay(-1)} title="Dia anterior"><ChevronLeft size={16} /></button>
            <div style={{ width: '160px' }}>
              <CustomDatePicker value={selectedDateBR} onChange={setSelectedDateBR} />
            </div>
            <button className="btn-icon" onClick={() => shiftDay(1)} title="Próximo dia"><ChevronRight size={16} /></button>
            {!isViewingToday && (
              <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => setSelectedDateBR(todayStr)}>Hoje</button>
            )}
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
      </div>

      {/* Sections for the selected date */}
      {totalVisibleCount === 0 ? (
        <div className="empty-state" style={{ padding: '60px 20px' }}>
          <span className="empty-state-icon">🎉</span>
          <p>Nenhuma tarefa {activeFilter !== 'Todas' ? `em "${activeFilter}" ` : ''}para {selectedDateLabel === 'Hoje' ? 'hoje' : selectedDateLabel === 'Amanhã' ? 'amanhã' : selectedDateBR}.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {sections.map(section => {
            if (section.items.length === 0) return null;
            return (
              <div key={section.key} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: section.color }} />
                  <span style={{ fontSize: '12px', fontWeight: '800', color: section.color, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {section.label}
                  </span>
                  <span style={{ fontSize: '11px', color: '#666' }}>({section.items.length})</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {section.items.map(item => renderItemCard(item, { isOverdue: section.isOverdue }))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Concluídas — collapsed by default, scoped to the day being browsed */}
      {completedForSelectedDay.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button
            onClick={() => setIsCompletedOpen(o => !o)}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              background: 'none', border: 'none', padding: 0, cursor: 'pointer',
              color: '#666', alignSelf: 'flex-start'
            }}
          >
            <ChevronDown size={14} style={{ transform: isCompletedOpen ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 150ms ease-out' }} />
            <span style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Concluídas {selectedDateLabel === 'Hoje' ? 'hoje' : `em ${selectedDateBR}`}
            </span>
            <span style={{ fontSize: '11px', color: '#555' }}>({completedForSelectedDay.length})</span>
          </button>

          {isCompletedOpen && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {completedForSelectedDay.map(item => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    backgroundColor: '#141414', border: '1px solid #232323', borderRadius: '8px',
                    padding: '10px 16px'
                  }}
                >
                  <Check size={14} style={{ color: 'var(--badge-green)', flexShrink: 0 }} />
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '13px', color: '#888', textDecoration: 'line-through' }}>{item.title}</span>
                    {item.origin === 'Pessoal' ? (
                      <span className="type-badge" style={{ color: PESSOAL_COLOR.color, backgroundColor: PESSOAL_COLOR.bg }}>
                        {item.origin}
                      </span>
                    ) : (
                      <span className={`type-badge ${TYPE_BADGE_CLASS[item.origin]}`}>
                        {item.origin}
                      </span>
                    )}
                    {item.clientName && (
                      <span
                        style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#666', cursor: 'pointer' }}
                        onClick={() => onNavigate(`clientes/${item.clientId}`)}
                      >
                        <User size={10} />
                        {item.clientName}
                      </span>
                    )}
                  </div>
                  <button className="btn-icon" style={{ width: '28px', height: '28px' }} title="Desfazer conclusão" onClick={() => handleUndoComplete(item)}>
                    <Undo2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
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

      {/* Edit modal — shared by standalone/client tasks and reminders */}
      {editingItem && (
        <div className="modal-overlay" onClick={() => setEditingItem(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '420px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Editar Tarefa</h3>
              <button className="btn-icon" onClick={() => setEditingItem(null)}><X size={16} /></button>
            </div>
            <form onSubmit={handleSaveEditItem}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Título *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editTitle}
                    onChange={e => setEditTitle(e.target.value)}
                    autoFocus
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Prazo</label>
                  <CustomDatePicker value={editDueDate} onChange={setEditDueDate} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setEditingItem(null)}>Cancelar</button>
                <button type="submit" className="btn-primary">
                  <CheckSquare size={14} />
                  <span>Salvar</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
