import React, { useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Calendar as CalendarIcon, 
  User, 
  ExternalLink,
  Clock,
  X,
  Check
} from 'lucide-react';
import { upcomingAgendaEvents } from '../data/agenda';

export default function AgendaView({ 
  clients, 
  agendaEvents, 
  onAddEvent, 
  onNavigate 
}) {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 5, 29)); // June 29, 2026
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Modal Form State
  const [newTitle, setNewTitle] = useState('');
  const [newClientId, setNewClientId] = useState('');
  const [newType, setNewType] = useState('Reunião');
  const [newStartTime, setNewStartTime] = useState('09:00');
  const [newEndTime, setNewEndTime] = useState('09:45');
  const [newResponsible, setNewResponsible] = useState('Gabriel');
  const [newDescription, setNewDescription] = useState('');

  // Date Nav
  const handlePrevDay = () => {
    const prev = new Date(currentDate);
    prev.setDate(prev.getDate() - 1);
    setCurrentDate(prev);
  };

  const handleNextDay = () => {
    const next = new Date(currentDate);
    next.setDate(next.getDate() + 1);
    setCurrentDate(next);
  };

  const handleToday = () => {
    setCurrentDate(new Date(2026, 5, 29));
  };

  const formatDatePT = (date) => {
    const daysPT = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
    const monthsPT = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return `${daysPT[date.getDay()]}, ${date.getDate()} de ${monthsPT[date.getMonth()]} de ${date.getFullYear()}`;
  };

  // Position calculation for hourly blocks (08:00 - 19:00, 11 hours, 64px height per hour)
  // Grid height = 11 * 64px = 704px
  const calculatePosition = (startTime, endTime) => {
    try {
      const [startH, startM] = startTime.split(':').map(Number);
      const [endH, endM] = endTime.split(':').map(Number);
      
      const startMinutes = (startH - 8) * 60 + startM;
      const endMinutes = (endH - 8) * 60 + endM;
      
      // 64px per 60 minutes = 1.0667px per minute
      const top = (startMinutes * 64) / 60;
      const height = ((endMinutes - startMinutes) * 64) / 60;
      
      return {
        top: `${top}px`,
        height: `${height}px`
      };
    } catch (err) {
      return { top: '0px', height: '50px' };
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!newTitle || !newClientId) return;

    const selectedClient = clients.find(c => c.id === newClientId);
    const clientName = selectedClient ? selectedClient.name : 'Outro';

    const newEvent = {
      id: `evt_custom_${Date.now()}`,
      startTime: newStartTime,
      endTime: newEndTime,
      type: newType,
      clientName: clientName,
      clientId: newClientId,
      responsible: newResponsible,
      description: newTitle // using title as description for prompt mapping
    };

    onAddEvent(newEvent);
    setIsModalOpen(false);

    // Reset Form
    setNewTitle('');
    setNewClientId('');
    setNewType('Reunião');
    setNewStartTime('09:00');
    setNewEndTime('09:45');
    setNewResponsible('Gabriel');
  };

  // Check if active date is today (June 29, 2026) to render mock events, otherwise empty schedule
  const isMockDay = currentDate.getDate() === 29 && currentDate.getMonth() === 5 && currentDate.getFullYear() === 2026;
  const activeEvents = isMockDay ? agendaEvents : [];

  const hoursArray = Array.from({ length: 12 }, (_, i) => {
    const h = i + 8;
    return `${h.toString().padStart(2, '0')}:00`;
  });

  return (
    <div className="agenda-layout">
      {/* Left Column: Daily grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div className="agenda-nav-bar">
          <div className="agenda-nav-left">
            <button id="btn-agenda-prev" className="btn-nav-arrow" onClick={handlePrevDay} aria-label="Dia Anterior">
              <ChevronLeft size={16} />
            </button>
            <span className="agenda-nav-title" id="agenda-date-display">{formatDatePT(currentDate)}</span>
            <button id="btn-agenda-next" className="btn-nav-arrow" onClick={handleNextDay} aria-label="Próximo Dia">
              <ChevronRight size={16} />
            </button>
            <button 
              id="btn-agenda-today"
              className="btn-action-outline" 
              style={{ padding: '6px 12px', fontSize: '12px', marginLeft: '8px' }}
              onClick={handleToday}
            >
              Hoje
            </button>
          </div>
          <button 
            id="btn-new-event"
            className="btn-action-primary"
            onClick={() => setIsModalOpen(true)}
          >
            <Plus size={16} />
            Novo evento
          </button>
        </div>

        {/* Time Grid Card */}
        <div className="agenda-grid-card">
          <div className="agenda-hours-scroll">
            {/* The absolute events overlays */}
            <div style={{ position: 'absolute', left: '76px', right: '4px', top: '0', bottom: '0', pointerEvents: 'none' }}>
              {activeEvents.map((evt) => {
                const pos = calculatePosition(evt.startTime, evt.endTime);
                const typeClass = evt.type.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                return (
                  <div 
                    key={evt.id} 
                    className={`agenda-event-block ${typeClass}`}
                    style={{ ...pos, pointerEvents: 'auto' }}
                  >
                    <div className="event-block-header">
                      <span className="event-block-client">{evt.clientName}</span>
                      <span className="event-block-time">{evt.startTime} – {evt.endTime}</span>
                    </div>
                    <div className="event-block-desc">{evt.description}</div>
                    <div className="event-block-footer">
                      <span className="event-block-owner">Resp: {evt.responsible}</span>
                      <span 
                        className="event-block-link"
                        onClick={(e) => {
                          e.stopPropagation();
                          onNavigate(`clientes/${evt.clientId}`);
                        }}
                      >
                        Ver cliente
                        <ExternalLink size={10} />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Hours horizontal row lines */}
            {hoursArray.map((hour, idx) => (
              <div key={hour} className="agenda-hour-row">
                <div className="agenda-hour-label">{hour}</div>
                <div className="agenda-events-col"></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Column: Mini Calendar & Upcoming Events */}
      <div className="agenda-right-panel">
        {/* Calendar visual */}
        <div className="calendar-card" style={{ padding: '16px' }}>
          <div className="calendar-header" style={{ marginBottom: '8px' }}>
            <span className="calendar-title" style={{ fontSize: '13px' }}>Junho 2026</span>
          </div>
          <div className="calendar-grid" style={{ gap: '4px' }}>
            <div className="calendar-day-name" style={{ fontSize: '9px' }}>D</div>
            <div className="calendar-day-name" style={{ fontSize: '9px' }}>S</div>
            <div className="calendar-day-name" style={{ fontSize: '9px' }}>T</div>
            <div className="calendar-day-name" style={{ fontSize: '9px' }}>Q</div>
            <div className="calendar-day-name" style={{ fontSize: '9px' }}>Q</div>
            <div className="calendar-day-name" style={{ fontSize: '9px' }}>S</div>
            <div className="calendar-day-name" style={{ fontSize: '9px' }}>S</div>
            <div className="calendar-day empty"></div>
            {Array.from({ length: 30 }, (_, i) => i + 1).map(day => (
              <div 
                key={day} 
                className={`calendar-day ${day === currentDate.getDate() ? 'today' : ''}`}
                style={{ fontSize: '10px', height: '22px' }}
              >
                {day}
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming list */}
        <div className="agenda-upcoming-section">
          <span className="agenda-upcoming-title">Próximos compromissos</span>
          <div className="agenda-upcoming-list">
            {upcomingAgendaEvents.map(evt => (
              <div key={evt.id} className="agenda-upcoming-card">
                <div className="upcoming-card-top">
                  <span className="upcoming-card-client">{evt.clientName}</span>
                  <span className="upcoming-card-day">{evt.day}</span>
                </div>
                <div className="upcoming-card-desc">{evt.description}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <Clock size={10} />
                    {evt.time}
                  </span>
                  <span 
                    className="client-name-link" 
                    style={{ fontSize: '11px' }}
                    onClick={() => onNavigate(`clientes/${evt.clientId}`)}
                  >
                    Ver 360
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* [+ Novo Evento] Modal Dialog */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Agendar Novo Evento</h3>
              <button className="modal-close-btn" onClick={() => setIsModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleFormSubmit}>
              <div className="form-group">
                <label className="form-label" htmlFor="evt-title">Descrição do Evento</label>
                <input 
                  type="text" 
                  id="evt-title"
                  className="form-input" 
                  placeholder="Ex: Alinhamento de escopo" 
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="evt-client">Cliente Relacionado</label>
                <select 
                  id="evt-client"
                  className="form-select"
                  value={newClientId}
                  onChange={(e) => setNewClientId(e.target.value)}
                  required
                >
                  <option value="">Selecione um cliente...</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="evt-type">Tipo de Evento</label>
                  <select 
                    id="evt-type"
                    className="form-select"
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                  >
                    <option value="Reunião">Reunião</option>
                    <option value="Técnico">Técnico</option>
                    <option value="Treinamento">Treinamento</option>
                    <option value="Follow-up">Follow-up</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="evt-resp">Responsável</label>
                  <input 
                    type="text" 
                    id="evt-resp"
                    className="form-input"
                    value={newResponsible}
                    onChange={(e) => setNewResponsible(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="evt-start">Hora de Início</label>
                  <input 
                    type="time" 
                    id="evt-start"
                    className="form-input"
                    value={newStartTime}
                    onChange={(e) => setNewStartTime(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="evt-end">Hora de Fim</label>
                  <input 
                    type="time" 
                    id="evt-end"
                    className="form-input"
                    value={newEndTime}
                    onChange={(e) => setNewEndTime(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn-action-outline"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="btn-action-primary"
                >
                  Salvar evento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
