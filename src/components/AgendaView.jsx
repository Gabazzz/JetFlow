import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Calendar, Video, MapPin, ExternalLink, RefreshCw, ChevronLeft, ChevronRight, LogOut, AlertCircle, Plus, X, Users, Clock as ClockIcon, Pencil, Trash2 } from 'lucide-react';
import CustomDatePicker from './CustomDatePicker';
import CustomSelect from './CustomSelect';
import { supabase, SUPABASE_URL } from '../lib/supabaseClient';
import { getTodayBR, getNowTimeBR, toISODate, parseBRDate, formatBRDate } from '../utils';

function formatEventTime(iso) {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' });
}

// 15-min slots covering business hours — a dropdown here keeps the same
// premium feel as the rest of the app instead of a native <input type="time">.
const TIME_OPTIONS = (() => {
  const opts = [];
  for (let h = 8; h <= 19; h++) {
    for (let m = 0; m < 60; m += 15) {
      if (h === 19 && m > 0) break;
      const hh = String(h).padStart(2, '0');
      const mm = String(m).padStart(2, '0');
      opts.push({ value: `${hh}:${mm}`, label: `${hh}:${mm}` });
    }
  }
  return opts;
})();

const DURATION_OPTIONS = [
  { value: 30, label: '30 min' },
  { value: 45, label: '45 min' },
  { value: 60, label: '1h' },
  { value: 90, label: '1h30' }
];

function addMinutesToTime(hhmm, minutes) {
  const [h, m] = hhmm.split(':').map(Number);
  const total = h * 60 + m + minutes;
  const eh = Math.floor((total % (24 * 60)) / 60);
  const em = total % 60;
  return `${String(eh).padStart(2, '0')}:${String(em).padStart(2, '0')}`;
}

function timeToMinutes(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

function minutesToHHMM(total) {
  const h = Math.floor(total / 60) % 24;
  const m = total % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

// São Paulo has had no DST since 2019 — the offset is always -03:00, so wall
// time/date can be read straight off the UTC fields of (instant - 3h). Same
// trick the Edge Functions use, kept consistent here for the conflict check
// and for prefilling the edit form from an event's ISO start/end.
function isoToSPParts(iso) {
  const d = new Date(iso);
  const shifted = new Date(d.getTime() - 3 * 60 * 60 * 1000);
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
    minutes: shifted.getUTCHours() * 60 + shifted.getUTCMinutes()
  };
}

function isoToSPDateBR(iso) {
  const { year, month, day } = isoToSPParts(iso);
  return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
}

function isoToSPMinutes(iso) {
  return isoToSPParts(iso).minutes;
}

function closestDurationOption(minutes) {
  return DURATION_OPTIONS.reduce((best, opt) =>
    Math.abs(opt.value - minutes) < Math.abs(best - minutes) ? opt.value : best
  , DURATION_OPTIONS[0].value);
}

export default function AgendaView({ clients = [], accountEmail = '', profile, onUpdateClient, onAddClientActivity }) {
  const [dateBR, setDateBR] = useState(getTodayBR());
  const [status, setStatus] = useState({ loading: true, connected: false, email: null });
  const [connecting, setConnecting] = useState(false);
  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventsError, setEventsError] = useState('');

  const [isNewMeetingOpen, setIsNewMeetingOpen] = useState(false);
  const [meetingStep, setMeetingStep] = useState('form');
  const [editingEventId, setEditingEventId] = useState(null);
  const [meetingClientId, setMeetingClientId] = useState('');
  const [meetingTitle, setMeetingTitle] = useState('');
  const [meetingDateBR, setMeetingDateBR] = useState(dateBR);
  const [meetingTime, setMeetingTime] = useState('09:00');
  const [meetingDuration, setMeetingDuration] = useState(30);
  const [guestEmails, setGuestEmails] = useState([]);
  const [guestInput, setGuestInput] = useState('');
  const [timeConflictError, setTimeConflictError] = useState('');
  const [isCreatingMeeting, setIsCreatingMeeting] = useState(false);
  const [createError, setCreateError] = useState('');
  const [createReauthRequired, setCreateReauthRequired] = useState(false);
  const [createdEvent, setCreatedEvent] = useState(null);
  const [deletingEventId, setDeletingEventId] = useState(null);

  // Other timed events on the day being scheduled — feeds the conflict
  // check below. Excludes the event currently being edited (so an
  // unmoved meeting doesn't block its own slot) and all-day events
  // (holidays/reminders shouldn't eat every slot in the day).
  const [meetingDayEvents, setMeetingDayEvents] = useState([]);

  const checkStatus = useCallback(async () => {
    const { data, error } = await supabase.functions.invoke('google-calendar-status');
    if (error) {
      setStatus({ loading: false, connected: false, email: null });
      return;
    }
    setStatus({ loading: false, connected: !!data.connected, email: data.email });
  }, []);

  useEffect(() => {
    checkStatus();
    // The consent screen opens in a new tab — when the user comes back to
    // this one, re-check whether the connection went through.
    window.addEventListener('focus', checkStatus);
    return () => window.removeEventListener('focus', checkStatus);
  }, [checkStatus]);

  const loadEvents = useCallback(async () => {
    setEventsLoading(true);
    setEventsError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const isoDate = toISODate(dateBR);
      const res = await fetch(`${SUPABASE_URL}/functions/v1/google-calendar-events?date=${isoDate}`, {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'Erro ao buscar eventos.');
      if (data.reauthRequired) {
        setStatus({ loading: false, connected: false, email: null });
        setEvents([]);
        return;
      }
      setEvents(data.events || []);
    } catch (e) {
      setEventsError(e.message || 'Erro ao buscar eventos.');
      setEvents([]);
    } finally {
      setEventsLoading(false);
    }
  }, [dateBR]);

  useEffect(() => {
    if (status.connected) loadEvents();
  }, [status.connected, dateBR, loadEvents]);

  const loadMeetingDayEvents = useCallback(async (brDate, excludeId) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const isoDate = toISODate(brDate);
      const res = await fetch(`${SUPABASE_URL}/functions/v1/google-calendar-events?date=${isoDate}`, {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      const data = await res.json();
      if (!res.ok || data.error || data.reauthRequired) {
        setMeetingDayEvents([]);
        return;
      }
      setMeetingDayEvents((data.events || []).filter(ev => !ev.allDay && ev.id !== excludeId));
    } catch {
      setMeetingDayEvents([]);
    }
  }, []);

  useEffect(() => {
    if (!isNewMeetingOpen) return;
    loadMeetingDayEvents(meetingDateBR, editingEventId);
  }, [isNewMeetingOpen, meetingDateBR, editingEventId, loadMeetingDayEvents]);

  // Slots that would overlap another meeting (at the currently chosen
  // duration) are dropped from the list entirely, rather than shown
  // disabled — once the picked start time clears the conflicting event's
  // end, it reappears on its own.
  const availableTimeOptions = useMemo(() => {
    return TIME_OPTIONS.filter(opt => {
      const slotStart = timeToMinutes(opt.value);
      const slotEnd = slotStart + meetingDuration;
      return !meetingDayEvents.some(ev => {
        const evStart = isoToSPMinutes(ev.start);
        const evEnd = isoToSPMinutes(ev.end);
        return slotStart < evEnd && evStart < slotEnd;
      });
    });
  }, [meetingDayEvents, meetingDuration]);

  const handleConnect = async () => {
    setConnecting(true);
    const { data, error } = await supabase.functions.invoke('google-oauth-start');
    setConnecting(false);
    if (error || !data?.url) {
      alert('Não foi possível iniciar a conexão com o Google. Tente novamente.');
      return;
    }
    window.open(data.url, '_blank', 'noopener,noreferrer');
  };

  const handleDisconnect = async () => {
    if (!window.confirm('Desconectar sua Google Agenda do JetFlow?')) return;
    await supabase.functions.invoke('google-calendar-disconnect');
    setStatus({ loading: false, connected: false, email: null });
    setEvents([]);
  };

  const shiftDay = (delta) => {
    const d = parseBRDate(dateBR);
    d.setDate(d.getDate() + delta);
    setDateBR(formatBRDate(d));
  };

  const selectedMeetingClient = clients.find(c => c.id === meetingClientId) || null;

  const resetMeetingModalState = () => {
    setMeetingClientId('');
    setMeetingTitle('');
    setMeetingTime('09:00');
    setMeetingDuration(30);
    setGuestInput('');
    setTimeConflictError('');
    setCreateError('');
    setCreateReauthRequired(false);
    setCreatedEvent(null);
    setMeetingStep('form');
    setMeetingDayEvents([]);
  };

  const openNewMeetingModal = () => {
    setEditingEventId(null);
    resetMeetingModalState();
    setMeetingDateBR(dateBR);
    setGuestEmails(accountEmail ? [accountEmail] : []);
    setIsNewMeetingOpen(true);
  };

  const openEditMeetingModal = (ev) => {
    const startMin = isoToSPMinutes(ev.start);
    const endMin = isoToSPMinutes(ev.end);
    const attendees = ev.attendees || [];
    const matchedClient = clients.find(c => c.email && attendees.includes(c.email)) || null;

    setEditingEventId(ev.id);
    resetMeetingModalState();
    setMeetingClientId(matchedClient ? matchedClient.id : '');
    setMeetingTitle(ev.title || '');
    setMeetingDateBR(isoToSPDateBR(ev.start));
    setMeetingTime(minutesToHHMM(startMin));
    setMeetingDuration(closestDurationOption(Math.max(15, endMin - startMin)));
    setGuestEmails(attendees);
    setIsNewMeetingOpen(true);
  };

  const handleMeetingClientChange = (clientId) => {
    setMeetingClientId(clientId);
    const client = clients.find(c => c.id === clientId);
    if (client) {
      if (!editingEventId && !meetingTitle.trim()) setMeetingTitle(`Reunião com ${client.name}`);
      if (client.email) {
        setGuestEmails(prev => prev.includes(client.email) ? prev : [...prev, client.email]);
      }
    }
  };

  const addGuestEmail = () => {
    const email = guestInput.trim();
    if (!email || guestEmails.includes(email)) {
      setGuestInput('');
      return;
    }
    setGuestEmails(prev => [...prev, email]);
    setGuestInput('');
  };

  const removeGuestEmail = (email) => {
    setGuestEmails(prev => prev.filter(e => e !== email));
  };

  const handleSubmitMeetingForm = (e) => {
    e.preventDefault();
    if (!meetingTitle.trim()) return;
    const timeOk = availableTimeOptions.some(o => o.value === meetingTime);
    if (!timeOk) {
      setTimeConflictError('Esse horário conflita com outra reunião nesse dia — escolha outro.');
      return;
    }
    setTimeConflictError('');
    setCreateError('');
    setCreateReauthRequired(false);
    setMeetingStep('preview');
  };

  const handleSubmitMeeting = async () => {
    setIsCreatingMeeting(true);
    setCreateError('');
    setCreateReauthRequired(false);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const endpoint = editingEventId ? 'google-calendar-update-event' : 'google-calendar-create-event';
      const payload = {
        title: meetingTitle.trim(),
        date: toISODate(meetingDateBR),
        time: meetingTime,
        durationMinutes: meetingDuration,
        guests: guestEmails
      };
      if (editingEventId) payload.eventId = editingEventId;

      const res = await fetch(`${SUPABASE_URL}/functions/v1/${endpoint}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setCreateError(data.error || 'Erro ao salvar reunião.');
        setCreateReauthRequired(!!data.reauthRequired);
        return;
      }
      setCreatedEvent(data.event);
      if (selectedMeetingClient) {
        onAddClientActivity(
          selectedMeetingClient.id,
          editingEventId
            ? `Editou reunião no Google Agenda: ${meetingTitle.trim()}`
            : `Agendou reunião no Google Agenda: ${meetingTitle.trim()}`
        );
      }
      if (meetingDateBR === dateBR) loadEvents();
      setMeetingStep('success');
    } catch (e) {
      setCreateError('Erro ao salvar reunião. Tente novamente.');
    } finally {
      setIsCreatingMeeting(false);
    }
  };

  const handleDeleteEvent = async (ev) => {
    if (!window.confirm(`Excluir "${ev.title}"? Um cancelamento será enviado aos participantes.`)) return;
    setDeletingEventId(ev.id);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${SUPABASE_URL}/functions/v1/google-calendar-delete-event`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId: ev.id })
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        alert(data.error || 'Erro ao excluir reunião.');
        return;
      }
      loadEvents();
    } catch (e) {
      alert('Erro ao excluir reunião. Tente novamente.');
    } finally {
      setDeletingEventId(null);
    }
  };

  if (status.loading) {
    return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>Carregando...</div>;
  }

  if (!status.connected) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px', gap: '16px', textAlign: 'center' }}>
        <div style={{ backgroundColor: '#161616', border: '1px solid #252525', borderRadius: '8px', padding: '40px', maxWidth: '420px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
          <Calendar size={28} style={{ color: 'var(--green-primary)' }} />
          <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#fff', margin: 0 }}>Conectar Google Agenda</h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
            Veja os compromissos do dia direto no JetFlow, com acesso rápido ao Google Meet de cada reunião.
          </p>
          <button className="btn-primary" onClick={handleConnect} disabled={connecting} style={{ marginTop: '6px' }}>
            <Calendar size={14} />
            <span>{connecting ? 'Abrindo...' : 'Conectar Google Agenda'}</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button className="btn-icon" onClick={() => shiftDay(-1)} title="Dia anterior"><ChevronLeft size={16} /></button>
          <div style={{ width: '160px' }}>
            <CustomDatePicker value={dateBR} onChange={setDateBR} />
          </div>
          <button className="btn-icon" onClick={() => shiftDay(1)} title="Próximo dia"><ChevronRight size={16} /></button>
          <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => setDateBR(getTodayBR())}>Hoje</button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button className="btn-primary" onClick={openNewMeetingModal}>
            <Plus size={16} />
            <span>Nova Reunião</span>
          </button>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
            Conectado {status.email ? `como ${status.email}` : ''}
          </span>
          <button className="btn-icon" onClick={loadEvents} title="Atualizar"><RefreshCw size={14} /></button>
          <button className="btn-icon" onClick={handleDisconnect} title="Desconectar"><LogOut size={14} /></button>
        </div>
      </div>

      {eventsLoading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>Carregando eventos...</div>
      ) : eventsError ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '14px 16px', backgroundColor: '#2A1414', border: '1px solid rgba(239, 68, 68, 0.35)', borderRadius: '8px' }}>
          <AlertCircle size={15} style={{ color: '#EF4444', flexShrink: 0 }} />
          <span style={{ fontSize: '13px', color: '#EF4444' }}>{eventsError}</span>
        </div>
      ) : events.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px', backgroundColor: '#161616', border: '1px solid #252525', borderRadius: '8px' }}>
          Nenhum compromisso nesse dia.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {events.map(ev => (
            <div key={ev.id} style={{ backgroundColor: '#161616', border: '1px solid #252525', borderRadius: '8px', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--green-primary)', minWidth: '90px' }}>
                  {ev.allDay ? 'Dia inteiro' : `${formatEventTime(ev.start)} – ${formatEventTime(ev.end)}`}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span style={{ fontSize: '14px', fontWeight: '600', color: '#fff' }}>{ev.title}</span>
                  {ev.location && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                      <MapPin size={11} />{ev.location}
                    </span>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {!ev.allDay && (
                  <button className="btn-icon" onClick={() => openEditMeetingModal(ev)} title="Editar reunião">
                    <Pencil size={14} />
                  </button>
                )}
                <button
                  className="btn-danger-icon"
                  onClick={() => handleDeleteEvent(ev)}
                  disabled={deletingEventId === ev.id}
                  title="Excluir reunião"
                >
                  <Trash2 size={14} />
                </button>
                {ev.htmlLink && (
                  <a href={ev.htmlLink} target="_blank" rel="noreferrer" className="btn-icon" title="Abrir no Google Agenda">
                    <ExternalLink size={14} />
                  </a>
                )}
                {ev.meetLink && (
                  <a href={ev.meetLink} target="_blank" rel="noreferrer" className="btn-primary" style={{ padding: '8px 14px', fontSize: '12px' }}>
                    <Video size={13} />
                    <span>Entrar no Meet</span>
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New/edit meeting modal — creates or updates a real event on the
          user's primary Google Calendar (Meet link + email invites via
          sendUpdates=all), with same-day slots already taken filtered
          out of the Horário dropdown. */}
      {isNewMeetingOpen && (
        <div className="modal-overlay" onClick={() => setIsNewMeetingOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3 className="modal-title">{editingEventId ? 'Editar Reunião' : 'Nova Reunião'}</h3>
              <button className="btn-icon" onClick={() => setIsNewMeetingOpen(false)}><X size={16} /></button>
            </div>

            {meetingStep === 'form' && (
              <form onSubmit={handleSubmitMeetingForm}>
                <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Cliente (opcional)</label>
                    <CustomSelect
                      value={meetingClientId}
                      onChange={handleMeetingClientChange}
                      options={[{ value: '', label: 'Sem cliente vinculado' }, ...clients.map(c => ({ value: c.id, label: c.name }))]}
                    />
                    {selectedMeetingClient && !selectedMeetingClient.email && (
                      <span style={{ fontSize: '11px', color: 'var(--badge-yellow)', marginTop: '6px', display: 'block' }}>
                        Esse cliente não tem e-mail cadastrado — adicione manualmente abaixo se quiser incluí-lo.
                      </span>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Título *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={meetingTitle}
                      onChange={e => setMeetingTitle(e.target.value)}
                      placeholder="Ex: Onboarding — Kickoff"
                      required
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '12px' }}>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label className="form-label">Data</label>
                      <CustomDatePicker value={meetingDateBR} onChange={setMeetingDateBR} />
                    </div>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label className="form-label">Horário</label>
                      <CustomSelect value={meetingTime} onChange={setMeetingTime} options={availableTimeOptions} />
                    </div>
                  </div>
                  {availableTimeOptions.length === 0 && (
                    <span style={{ fontSize: '11px', color: 'var(--badge-yellow)', marginTop: '-8px' }}>
                      Nenhum horário livre nesse dia com essa duração.
                    </span>
                  )}
                  {timeConflictError && (
                    <span style={{ fontSize: '11px', color: 'var(--badge-red)', marginTop: '-8px' }}>{timeConflictError}</span>
                  )}

                  <div className="form-group">
                    <label className="form-label">Duração</label>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {DURATION_OPTIONS.map(opt => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setMeetingDuration(opt.value)}
                          style={{
                            padding: '6px 14px',
                            borderRadius: '20px',
                            fontSize: '12px',
                            fontWeight: '700',
                            border: `1px solid ${meetingDuration === opt.value ? 'var(--green-primary)' : '#2A2A2A'}`,
                            backgroundColor: meetingDuration === opt.value ? 'rgba(101, 255, 75, 0.1)' : '#161616',
                            color: meetingDuration === opt.value ? 'var(--green-primary)' : '#aaa',
                            cursor: 'pointer'
                          }}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Convidados</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="email"
                        className="form-input"
                        style={{ flex: 1 }}
                        value={guestInput}
                        onChange={e => setGuestInput(e.target.value)}
                        placeholder="email@exemplo.com"
                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addGuestEmail(); } }}
                      />
                      <button type="button" className="btn-secondary" onClick={addGuestEmail}><Plus size={14} /></button>
                    </div>
                    {guestEmails.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '2px' }}>
                        {guestEmails.map(email => (
                          <span key={email} className="badge" style={{ backgroundColor: '#1E1E1E', border: '1px solid #333', color: '#ddd', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            {email}
                            <X size={11} style={{ cursor: 'pointer' }} onClick={() => removeGuestEmail(email)} />
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn-secondary" onClick={() => setIsNewMeetingOpen(false)}>Cancelar</button>
                  <button type="submit" className="btn-primary">Pré-visualizar</button>
                </div>
              </form>
            )}

            {meetingStep === 'preview' && (
              <>
                <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ backgroundColor: '#161616', border: '1px solid #252525', borderRadius: '8px', padding: '16px' }}>
                    <span style={{ fontSize: '15px', fontWeight: '700', color: '#fff' }}>{meetingTitle}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '10px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                      <Calendar size={13} />
                      <span>{meetingDateBR}</span>
                      <ClockIcon size={13} style={{ marginLeft: '8px' }} />
                      <span>{meetingTime} – {addMinutesToTime(meetingTime, meetingDuration)}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', marginTop: '10px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                      <Users size={13} style={{ marginTop: '2px', flexShrink: 0 }} />
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {guestEmails.length > 0 ? guestEmails.map((email, i) => <span key={i}>{email}</span>) : <span>Nenhum convidado</span>}
                      </div>
                    </div>
                  </div>

                  {createError && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '10px 12px', backgroundColor: '#2A1414', border: '1px solid rgba(239, 68, 68, 0.35)', borderRadius: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                        <AlertCircle size={14} style={{ color: '#EF4444', flexShrink: 0, marginTop: '1px' }} />
                        <span style={{ fontSize: '12px', color: '#EF4444' }}>{createError}</span>
                      </div>
                      {createReauthRequired && (
                        <button type="button" className="btn-secondary" style={{ alignSelf: 'flex-start', padding: '6px 12px', fontSize: '12px' }} onClick={handleConnect} disabled={connecting}>
                          {connecting ? 'Abrindo...' : 'Reconectar Google Agenda'}
                        </button>
                      )}
                    </div>
                  )}
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn-secondary" onClick={() => setMeetingStep('form')} disabled={isCreatingMeeting}>Voltar</button>
                  <button type="button" className="btn-primary" onClick={handleSubmitMeeting} disabled={isCreatingMeeting}>
                    {isCreatingMeeting ? (editingEventId ? 'Salvando...' : 'Criando...') : (editingEventId ? 'Salvar Alterações' : 'Criar Reunião')}
                  </button>
                </div>
              </>
            )}

            {meetingStep === 'success' && createdEvent && (
              <>
                <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', padding: '30px 20px', textAlign: 'center' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'rgba(16, 185, 129, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Calendar size={22} style={{ color: 'var(--badge-green)' }} />
                  </div>
                  <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#fff', margin: 0 }}>
                    {editingEventId ? 'Reunião atualizada!' : 'Reunião criada!'}
                  </h3>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
                    {editingEventId ? 'Alterações enviadas por e-mail aos participantes.' : 'Convite enviado por e-mail para os participantes.'}
                  </p>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
                    {createdEvent.htmlLink && (
                      <a href={createdEvent.htmlLink} target="_blank" rel="noreferrer" className="btn-secondary">
                        <ExternalLink size={13} />
                        <span>Abrir no Google Agenda</span>
                      </a>
                    )}
                    {createdEvent.meetLink && (
                      <a href={createdEvent.meetLink} target="_blank" rel="noreferrer" className="btn-primary">
                        <Video size={13} />
                        <span>Entrar no Meet</span>
                      </a>
                    )}
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn-primary" onClick={() => setIsNewMeetingOpen(false)}>Concluir</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
