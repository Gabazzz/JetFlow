import React, { useState } from 'react';
import { Bell, Plus, X, Calendar, Clock, Trash2, CheckCircle2 } from 'lucide-react';

export default function LembretesView({ 
  clients, 
  reminders, 
  onAddReminder, 
  onDismissReminder, 
  onDelayReminder, 
  onNavigate 
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [dismissingIds, setDismissingIds] = useState([]);

  // Form State
  const [title, setTitle] = useState('');
  const [clientId, setClientId] = useState('');
  const [dateTime, setDateTime] = useState('');
  const [observation, setObservation] = useState('');
  const [responsible, setResponsible] = useState('Gabriel Almeida');

  const handleOpenModal = () => {
    setIsModalOpen(true);
    // Set default datetime to today + 2 hours
    const now = new Date();
    now.setHours(now.getHours() + 2);
    // format as YYYY-MM-DDThh:mm
    const formatted = now.toISOString().slice(0, 16);
    setDateTime(formatted);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTitle('');
    setClientId('');
    setObservation('');
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!title || !clientId || !dateTime) return;

    const selectedClient = clients.find(c => c.id === clientId);
    const clientName = selectedClient ? selectedClient.name : 'Outro';

    // Parse date to decide period category
    const parsedDate = new Date(dateTime);
    const today = new Date(2026, 5, 29); // June 29, 2026
    const tomorrow = new Date(2026, 5, 30);
    
    let category = 'proximos';
    if (parsedDate.toDateString() === today.toDateString()) {
      category = 'hoje';
    } else if (parsedDate.toDateString() === tomorrow.toDateString()) {
      category = 'amanha';
    }

    const timeString = parsedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newReminder = {
      id: `rem_${Date.now()}`,
      title,
      clientName,
      clientId,
      description: observation,
      time: timeString,
      responsible,
      category
    };

    onAddReminder(newReminder);
    handleCloseModal();
  };

  const triggerDismiss = (reminderId) => {
    // 1. Add ID to dismissing array to trigger exit animation class (.item-fade-out)
    setDismissingIds(prev => [...prev, reminderId]);

    // 2. Wait 150ms (the duration of fade-out animation)
    setTimeout(() => {
      onDismissReminder(reminderId);
      // Clean up from dismissing array
      setDismissingIds(prev => prev.filter(id => id !== reminderId));
    }, 150);
  };

  // Group reminders by period
  const remindersHoje = reminders.filter(r => r.category === 'hoje');
  const remindersAmanha = reminders.filter(r => r.category === 'amanha');
  const remindersProximos = reminders.filter(r => r.category === 'proximos');

  const renderReminderList = (list, titleLabel) => {
    if (list.length === 0) return null;

    return (
      <div className="reminder-group-section">
        <h3 className="reminder-group-title">{titleLabel}</h3>
        {list.map((rem) => {
          const isDismissing = dismissingIds.includes(rem.id);
          return (
            <div 
              key={rem.id} 
              id={`reminder-card-${rem.id}`}
              className={`reminder-card ${isDismissing ? 'item-fade-out' : ''}`}
            >
              <div className="reminder-bell-wrapper">
                <Bell size={18} />
              </div>
              
              <div className="reminder-content">
                <span className="reminder-title">{rem.title}</span>
                {rem.description && <p className="reminder-desc">{rem.description}</p>}
                <div className="reminder-meta">
                  <span>Horário: <strong>{rem.time}</strong></span>
                  <span> · </span>
                  <span 
                    className="client-name-link"
                    onClick={() => onNavigate(`clientes/${rem.clientId}`)}
                  >
                    Cliente: {rem.clientName}
                  </span>
                  <span> · </span>
                  <span>Criado por: {rem.responsible}</span>
                </div>
              </div>

              <div className="reminder-actions">
                <button 
                  className="btn-action-outline"
                  style={{ padding: '6px 12px', fontSize: '11.5px' }}
                  onClick={() => onDelayReminder(rem.id)}
                >
                  Adiar 1h
                </button>
                <button 
                  className="btn-action-outline"
                  style={{ 
                    padding: '6px 12px', 
                    fontSize: '11.5px', 
                    color: 'var(--color-critical)',
                    borderColor: 'rgba(239, 68, 68, 0.2)' 
                  }}
                  onClick={() => triggerDismiss(rem.id)}
                >
                  Dispensar
                </button>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const hasAnyReminder = reminders.length > 0;

  return (
    <div className="reminders-layout">
      {/* Header Row */}
      <div className="reminders-header-row">
        <h2 style={{ fontSize: '16px', fontWeight: '600' }}>Controle de Lembretes</h2>
        <button 
          id="btn-new-reminder"
          className="btn-action-primary"
          onClick={handleOpenModal}
        >
          <Plus size={16} />
          Novo lembrete
        </button>
      </div>

      {/* Reminder Groups */}
      <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
        {!hasAnyReminder ? (
          <div className="empty-state-container">
            <Bell className="empty-state-icon" style={{ animation: 'pulse-border 2s infinite' }} />
            <span className="empty-state-text">Nenhum lembrete ativo. Você está em dia.</span>
          </div>
        ) : (
          <>
            {renderReminderList(remindersHoje, 'Hoje')}
            {renderReminderList(remindersAmanha, 'Amanhã')}
            {renderReminderList(remindersProximos, 'Próximos dias')}
          </>
        )}
      </div>

      {/* [+ Novo Lembrete] Modal Dialog */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Adicionar Novo Lembrete</h3>
              <button className="modal-close-btn" onClick={handleCloseModal}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit}>
              <div className="form-group">
                <label className="form-label" htmlFor="rem-title">Título do Lembrete</label>
                <input 
                  type="text" 
                  id="rem-title"
                  className="form-input" 
                  placeholder="Ex: Ligar para confirmar kickoff"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="rem-client">Cliente Relacionado</label>
                <select 
                  id="rem-client"
                  className="form-select"
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  required
                >
                  <option value="">Selecione o cliente...</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="rem-datetime">Data e Hora de Disparo</label>
                <input 
                  type="datetime-local" 
                  id="rem-datetime"
                  className="form-input"
                  value={dateTime}
                  onChange={(e) => setDateTime(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="rem-obs">Observações (Opcional)</label>
                <textarea 
                  id="rem-obs"
                  className="form-textarea" 
                  placeholder="Observação detalhada..."
                  value={observation}
                  onChange={(e) => setObservation(e.target.value)}
                />
              </div>

              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn-action-outline"
                  onClick={handleCloseModal}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="btn-action-primary"
                >
                  Salvar lembrete
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
