import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, Users, CheckSquare, AlertTriangle, 
  Edit2, Trash2, X, Plus, Phone, Mail, List, Zap, Sparkles,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import { parseBRDate, getDateStatus, toBRDate } from '../utils';
import CustomDatePicker from './CustomDatePicker';

export default function DashboardView({ 
  clients, 
  onAddReminder, 
  onUpdateReminder, 
  onRemoveReminder, 
  onRegisterContact, 
  onNavigate 
}) {
  const [activeModal, setActiveModal] = useState(null);
  
  // Quick Reminder Form State
  const [quickTitle, setQuickTitle] = useState('');
  const [quickClientId, setQuickClientId] = useState('');
  const [quickDate, setQuickDate] = useState('');

  // Editing reminder state
  const [editingReminder, setEditingReminder] = useState(null);
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

  // Sort clients by criticality and gap for "Precisam de Atenção"
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
          criticality: r.criticality
        });
      });
    }
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

  mergedReminders.sort((a, b) => {
    return parseBRDate(a.deadline).getTime() - parseBRDate(b.deadline).getTime();
  });

  const handleQuickAddReminder = (e) => {
    e.preventDefault();
    if (!quickTitle.trim() || !quickClientId || !quickDate) return;
    onAddReminder(quickClientId, quickTitle, '', quickDate, 'Normal');
    setQuickTitle('');
    setQuickClientId('');
    setQuickDate('');
  };

  const handleOpenEditReminder = (item) => {
    setEditingReminder(item);
    setEditTitle(item.title);
    setEditDescription(item.description || '');
    setEditDeadline(item.deadline);
    setEditCriticality(item.criticality);
  };

  const handleSaveEditReminder = (e) => {
    e.preventDefault();
    if (!editingReminder) return;

    if (editingReminder.type === 'custom') {
      onUpdateReminder(editingReminder.clientId, editingReminder.id, {
        title: editTitle,
        description: editDescription,
        deadline: editDeadline,
        criticality: editCriticality
      });
    } else {
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
        onRegisterContact(item.clientId, 'Contato de ciclo registrado');
      }
      setDismissingReminderIds(prev => prev.filter(id => id !== item.id));
    }, 150);
  };

  // Convert "30/06/2026" to "JUN 30"
  const formatDateBadge = (brDateStr) => {
    try {
      const parts = brDateStr.split('/');
      if (parts.length === 3) {
        const months = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
        const monthIndex = parseInt(parts[1], 10) - 1;
        return {
          month: months[monthIndex],
          day: parts[0]
        };
      }
    } catch(e) {}
    return { month: 'JUN', day: '30' };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%' }}>
      
      {/* Top KPI Cards Row */}
      <div className="grid-cards" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <button className="kpi-card" onClick={() => setActiveModal('reunioes')}>
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
            <span className="kpi-label">Reuniões Hoje</span>
            <CalendarIcon size={18} style={{ color: 'var(--green-primary)' }} />
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
          <span className="kpi-subtitle">Em implantação</span>
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
          <span className="kpi-subtitle">SLA crítico ativo</span>
        </button>
      </div>

      {/* Main Dashboard Layout (Split Column left & right) */}
      <div className="dashboard-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '20px', alignItems: 'start' }}>
        
        {/* LEFT COLUMN: Activities & Reminders */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Section Header: Lista de atividades de hoje */}
          <div className="dashboard-section" style={{ backgroundColor: '#161616', border: '1px solid #252525', borderRadius: '8px', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <List size={18} style={{ color: 'var(--green-primary)' }} />
                <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#fff', margin: 0 }}>Lista de atividades de hoje</h3>
              </div>
              <button 
                className="btn-secondary" 
                style={{ background: 'none', border: 'none', color: '#666', fontSize: '11px', fontWeight: '700' }}
                onClick={() => setActiveModal('reunioes')}
              >
                VER TUDO
              </button>
            </div>

            {/* List items formatted as in reference Image 3 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {meetingsToday.length === 0 ? (
                <div className="empty-state" style={{ padding: '24px' }}>
                  <span className="empty-state-icon">📅</span>
                  <p>Nenhuma atividade agendada para hoje.</p>
                </div>
              ) : (
                meetingsToday.map(m => {
                  const badge = formatDateBadge(todayStr);
                  return (
                    <div 
                      key={m.id} 
                      className="daily-activity-item"
                      style={{ 
                        backgroundColor: '#1C1C1C', 
                        border: '1px solid #252525', 
                        borderRadius: '6px', 
                        padding: '14px', 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        gap: '16px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        {/* Gray date block */}
                        <div style={{ width: '48px', height: '48px', backgroundColor: '#2E2E2E', borderRadius: '6px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <span style={{ fontSize: '9px', fontWeight: '800', color: '#888' }}>{badge.month}</span>
                          <span style={{ fontSize: '16px', fontWeight: '800', color: '#fff' }}>{badge.day}</span>
                        </div>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span style={{ fontSize: '14px', fontWeight: '700', color: '#fff' }}>
                            {m.title} - <span style={{ color: 'var(--green-primary)' }}>{m.clientName}</span>
                          </span>
                          <span style={{ fontSize: '11px', color: '#888' }}>
                            🕐 {m.time} - 16:00 · Responsável: Gabriel Almeida
                          </span>
                        </div>
                      </div>

                      {/* Right action button */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                        <span style={{ fontSize: '9px', fontWeight: '700', color: '#555' }}>PRÓXIMA AÇÃO</span>
                        <button 
                          className="btn-secondary" 
                          style={{ 
                            fontSize: '11px', 
                            padding: '6px 12px', 
                            border: '1px solid var(--green-primary)', 
                            color: 'var(--green-primary)', 
                            backgroundColor: 'transparent',
                            borderRadius: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                          onClick={() => {
                            onRegisterContact(m.clientId, `Reunião concluída: ${m.title}`);
                            alert('Contato registrado e ciclo atualizado!');
                          }}
                        >
                          <Phone size={11} />
                          <span>Ligar para cliente às {m.time}</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Section: Lembretes Ativos */}
          <div className="dashboard-section" style={{ backgroundColor: '#161616', border: '1px solid #252525', borderRadius: '8px', padding: '20px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#fff', marginBottom: '14px' }}>Lembretes Gerais</h3>

            {/* Quick Reminder Form */}
            <form onSubmit={handleQuickAddReminder} className="quick-reminder-bar" style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
              <input 
                type="text" 
                className="form-input" 
                placeholder="O que fazer?" 
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
              <div style={{ flex: 1, minWidth: '120px' }}>
                <CustomDatePicker value={quickDate} onChange={setNewDate => setQuickDate(setNewDate)} />
              </div>
              <button type="submit" className="btn-primary" style={{ padding: '8px 14px', height: '38px' }}>
                <Plus size={14} />
                <span>Adicionar</span>
              </button>
            </form>

            <div className="reminders-list" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {mergedReminders.slice(0, 6).map(item => {
                const isDismissing = dismissingReminderIds.includes(item.id);
                const status = getDateStatus(item.deadline, todayStr);
                
                let statusClass = 'date-future';
                if (status === 'overdue') statusClass = 'date-overdue';
                else if (status === 'today') statusClass = 'date-today';

                return (
                  <div key={item.id} className={`reminder-item ${isDismissing ? 'item-fadeout' : ''}`} style={{ backgroundColor: '#1B1B1B', border: '1px solid #252525', padding: '12px', borderRadius: '6px' }}>
                    <div className="reminder-info">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span 
                          style={{ cursor: 'pointer', color: 'var(--green-primary)', fontWeight: '600' }}
                          onClick={() => onNavigate(`clientes/${item.clientId}`)}
                        >
                          {item.clientName}
                        </span>
                        {item.type === 'cycle' && <span className="cycle-badge">Ciclo SLA</span>}
                      </div>
                      <p style={{ margin: '4px 0', fontSize: '13px', fontWeight: '700', color: '#fff' }}>{item.title}</p>
                      <span className={statusClass} style={{ fontSize: '12px' }}>
                        Prazo: {item.deadline}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {item.type === 'custom' && (
                        <button className="btn-icon" onClick={() => handleOpenEditReminder(item)}><Edit2 size={13} /></button>
                      )}
                      <button className="btn-danger-icon" onClick={() => handleDismissReminder(item)}><Trash2 size={13} /></button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Attention List, CTA Banner, Monthly Calendar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Section: Precisam de Atenção */}
          <div className="dashboard-section" style={{ backgroundColor: '#161616', border: '1px solid #252525', borderRadius: '8px', padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Zap size={16} style={{ color: 'var(--badge-red)' }} />
              <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#fff', margin: 0 }}>Precisam de atenção</h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {slaClients.map(client => {
                const initials = client.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
                let badgeClass = client.criticality === 'Crítico' ? 'badge-critico' : 'badge-atencao';
                
                // Gap calculations
                const lastContact = client.lastContacts?.[0];
                let daysText = 'HÁ 3 DIAS SEM CONTATO';
                if (lastContact) {
                  try {
                    const diff = parseBRDate(todayStr).getTime() - parseBRDate(lastContact.date).getTime();
                    const days = Math.round(diff / (1000 * 60 * 60 * 24));
                    daysText = days === 0 ? 'CONTATO HOJE' : `HÁ ${days} DIAS SEM CONTATO`;
                  } catch(e) {}
                }

                return (
                  <div 
                    key={client.id} 
                    className="at-risk-card"
                    style={{ 
                      backgroundColor: '#1E1E1E', 
                      border: '1px solid #2A2A2A', 
                      borderRadius: '8px', 
                      padding: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px'
                    }}
                  >
                    {/* Dark circle initials */}
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#2E2E2E', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '700', color: 'var(--green-primary)' }}>
                      {initials}
                    </div>

                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span 
                          style={{ fontSize: '13px', fontWeight: '700', color: '#fff', cursor: 'pointer' }}
                          onClick={() => onNavigate(`clientes/${client.id}`)}
                        >
                          {client.name}
                        </span>
                        <span className={`badge ${badgeClass}`} style={{ fontSize: '8px', padding: '1px 4px' }}>
                          {client.criticality}
                        </span>
                      </div>
                      
                      {/* Red/Yellow warning text */}
                      <span style={{ fontSize: '9px', fontWeight: '800', color: 'var(--badge-red)', letterSpacing: '0.5px' }}>
                        {daysText}
                      </span>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', fontSize: '11px', color: '#aaa' }}>
                        <span>Próxima Ação:</span>
                        <button 
                          style={{ 
                            background: 'none', 
                            border: 'none', 
                            color: 'var(--green-primary)', 
                            fontWeight: '700', 
                            fontSize: '11px', 
                            padding: 0,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                          onClick={() => onRegisterContact(client.id, `Ligar para ${client.name} realizado`)}
                        >
                          <Phone size={10} />
                          <span>Ligar agora</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Banner: Automatize seu Follow-up (matching the green banner card in Image 3) */}
          <div 
            style={{ 
              backgroundColor: 'var(--green-primary)', 
              color: '#000', 
              borderRadius: '8px', 
              padding: '20px', 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '12px',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Sparkles size={24} strokeWidth={2.5} style={{ color: '#000' }} />
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <h4 style={{ fontSize: '15px', fontWeight: '800', margin: 0 }}>Automatize seu Follow-up</h4>
              <p style={{ fontSize: '12px', fontWeight: '600', opacity: 0.8, margin: 0, lineHeight: '1.4' }}>
                Reduza em 40% o tempo gasto com clientes atrasados.
              </p>
            </div>

            <button 
              style={{ 
                backgroundColor: '#000', 
                color: '#fff', 
                fontWeight: '700', 
                fontSize: '11px', 
                padding: '8px 16px', 
                borderRadius: '6px', 
                border: 'none',
                cursor: 'pointer',
                alignSelf: 'flex-start',
                marginTop: '4px'
              }}
              onClick={() => alert('IA Follow-up ativada!')}
            >
              Ativar IA
            </button>
          </div>

          {/* Widget: Visão Mensal Calendar Grid */}
          <div 
            style={{ 
              backgroundColor: '#161616', 
              border: '1px solid #252525', 
              borderRadius: '8px', 
              padding: '16px' 
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <span style={{ fontSize: '11px', fontWeight: '800', color: '#fff', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Visão Mensal</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button className="btn-icon" style={{ width: '22px', height: '22px', color: '#666' }}><ChevronLeft size={12} /></button>
                <span style={{ fontSize: '10px', fontWeight: '800', color: '#aaa', textTransform: 'uppercase' }}>Junho 2026</span>
                <button className="btn-icon" style={{ width: '22px', height: '22px', color: '#666' }}><ChevronRight size={12} /></button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', textAlign: 'center', marginBottom: '6px' }}>
              {['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'].map(d => (
                <span key={d} style={{ fontSize: '8px', color: '#444', fontWeight: '800' }}>{d}</span>
              ))}
            </div>

            {/* Simulated days for June 2026 starting on Mon (1) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
              {Array.from({ length: 30 }).map((_, idx) => {
                const dayNum = idx + 1;
                const isSystemToday = dayNum === 30; // 30/06
                
                return (
                  <div 
                    key={idx}
                    style={{ 
                      height: '24px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      fontSize: '10px',
                      fontWeight: isSystemToday ? '800' : '500',
                      borderRadius: '4px',
                      color: isSystemToday ? '#000' : '#555',
                      backgroundColor: isSystemToday ? 'var(--green-primary)' : 'transparent',
                      border: isSystemToday ? 'none' : 'none'
                    }}
                  >
                    {dayNum}
                  </div>
                );
              })}
            </div>
            
            {/* Status indicators */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '12px', borderTop: '1px solid #222', paddingTop: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '9px', fontWeight: '700', color: '#555' }}>
                <span style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: 'var(--green-primary)' }}></span>
                <span>COMPROMISSOS</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '9px', fontWeight: '700', color: '#555' }}>
                <span style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: '#444' }}></span>
                <span>LIVRE</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* KPI Details Modal */}
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
                  <CustomDatePicker
                    value={editDeadline}
                    onChange={setEditDeadline}
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
