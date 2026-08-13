import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, Video, MapPin, ExternalLink, RefreshCw, ChevronLeft, ChevronRight, LogOut, AlertCircle } from 'lucide-react';
import CustomDatePicker from './CustomDatePicker';
import { supabase, SUPABASE_URL } from '../lib/supabaseClient';
import { getTodayBR, toISODate, parseBRDate, formatBRDate } from '../utils';

function formatEventTime(iso) {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' });
}

export default function AgendaView() {
  const [dateBR, setDateBR] = useState(getTodayBR());
  const [status, setStatus] = useState({ loading: true, connected: false, email: null });
  const [connecting, setConnecting] = useState(false);
  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventsError, setEventsError] = useState('');

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
    </div>
  );
}
