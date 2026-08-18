import React, { useState } from 'react';
import { Plus, X, LifeBuoy, ArrowRight, RotateCcw, Mail, MessageCircle, LayoutGrid, Link, Edit2, Check, Trash2 } from 'lucide-react';
import CustomSelect from './CustomSelect';

const PRIORITY_BADGE = {
  'Urgente': 'badge-critico',
  'Alta': 'badge-critico',
  'Normal': 'badge-atencao',
  'Baixa': 'badge-estavel'
};

const ORIGEM_ICON = {
  'WhatsApp': MessageCircle,
  'E-mail': Mail,
  'Painel': LayoutGrid
};

const COLUMNS = [
  { status: 'Aberto', label: 'Aberto', accent: '#EF4444', nextLabel: 'Iniciar atendimento', nextStatus: 'Em Andamento' },
  { status: 'Em Andamento', label: 'Em Andamento', accent: '#F59E0B', nextLabel: 'Resolver', nextStatus: 'Resolvido' },
  { status: 'Resolvido', label: 'Resolvido', accent: '#10B981', nextLabel: 'Reabrir', nextStatus: 'Aberto' }
];

export default function SuporteView({ clients, tickets, viewOnly, onAddTicket, onUpdateTicketStatus, onUpdateTicketLink, onRemoveTicket, onNavigate }) {
  const [isNewTicketOpen, setIsNewTicketOpen] = useState(false);
  const [tClientId, setTClientId] = useState('');
  const [tSubject, setTSubject] = useState('');
  const [tDescription, setTDescription] = useState('');
  const [tPriority, setTPriority] = useState('Normal');
  const [tDiscordUrl, setTDiscordUrl] = useState('');

  const [editingLinkId, setEditingLinkId] = useState(null);
  const [editingLinkValue, setEditingLinkValue] = useState('');

  const getClient = (clientId) => clients.find(c => c.id === clientId);

  const resetForm = () => {
    setTClientId(''); setTSubject(''); setTDescription(''); setTPriority('Normal'); setTDiscordUrl('');
    setIsNewTicketOpen(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!tClientId || !tSubject.trim()) return;
    onAddTicket(tClientId, tSubject.trim(), tDescription.trim(), tPriority, tDiscordUrl.trim());
    resetForm();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <LifeBuoy size={20} style={{ color: 'var(--green-primary)' }} />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#fff', margin: 0 }}>Chamados de Suporte</h3>
              <span className="type-badge type-suporte">Suporte</span>
            </div>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{tickets.length} chamado{tickets.length !== 1 ? 's' : ''} no total</span>
          </div>
        </div>
        <button className="btn-primary vo-hide" onClick={() => setIsNewTicketOpen(true)}>
          <Plus size={16} />
          <span>Novo Chamado</span>
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', alignItems: 'start' }}>
        {COLUMNS.map(col => {
          const colTickets = tickets.filter(t => t.status === col.status);
          return (
            <div key={col.status} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 2px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: col.accent }} />
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#ccc', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{col.label}</span>
                <span style={{ fontSize: '11px', color: '#666' }}>({colTickets.length})</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', minHeight: '60px' }}>
                {colTickets.length === 0 ? (
                  <div style={{ border: '1px dashed #2A2A2A', borderRadius: '8px', padding: '20px', textAlign: 'center', color: '#555', fontSize: '12px' }}>
                    Nenhum chamado
                  </div>
                ) : (
                  colTickets.map(ticket => {
                    const client = getClient(ticket.clientId);
                    const OrigemIcon = ORIGEM_ICON[ticket.origem] || LayoutGrid;
                    const isEditingLink = editingLinkId === ticket.id;
                    return (
                      <div
                        key={ticket.id}
                        className="detail-card"
                        style={{ backgroundColor: '#161616', border: '1px solid #252525', borderLeft: `3px solid ${col.accent}`, borderRadius: '8px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                          <span style={{ fontSize: '13px', fontWeight: '700', color: '#fff', lineHeight: '1.4' }}>{ticket.subject}</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                            <span className={`badge ${PRIORITY_BADGE[ticket.priority] || 'badge-estavel'}`} style={{ fontSize: '9px' }}>{ticket.priority}</span>
                            <button
                              className="btn-danger-icon vo-hide"
                              style={{ width: '22px', height: '22px' }}
                              title="Excluir chamado"
                              onClick={() => {
                                if (window.confirm('Excluir este chamado de suporte? Essa ação não pode ser desfeita.')) {
                                  onRemoveTicket(ticket.id);
                                }
                              }}
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>

                        {ticket.description && (
                          <p style={{ fontSize: '12px', color: '#999', margin: 0, lineHeight: '1.4' }}>{ticket.description}</p>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span
                            style={{ fontSize: '12px', color: 'var(--green-primary)', fontWeight: '600', cursor: client ? 'pointer' : 'default' }}
                            onClick={() => client && onNavigate(`clientes/${client.id}`)}
                          >
                            {client ? client.name : 'Cliente removido'}
                          </span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#666', fontSize: '11px' }}>
                            <OrigemIcon size={11} />
                            <span>{ticket.createdDate}</span>
                          </div>
                        </div>

                        {isEditingLink ? (
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <input
                              type="url"
                              className="form-input"
                              style={{ flex: 1, fontSize: '12px', height: '30px' }}
                              autoFocus
                              placeholder="https://discord.com/channels/..."
                              value={editingLinkValue}
                              onChange={e => setEditingLinkValue(e.target.value)}
                              onKeyDown={e => { if (e.key === 'Enter') { onUpdateTicketLink(ticket.id, editingLinkValue.trim()); setEditingLinkId(null); } if (e.key === 'Escape') setEditingLinkId(null); }}
                            />
                            <button className="btn-icon" style={{ color: 'var(--green-primary)' }} onClick={() => { onUpdateTicketLink(ticket.id, editingLinkValue.trim()); setEditingLinkId(null); }}><Check size={14} /></button>
                            <button className="btn-icon" onClick={() => setEditingLinkId(null)}><X size={14} /></button>
                          </div>
                        ) : ticket.discordUrl ? (
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <a href={ticket.discordUrl} target="_blank" rel="noreferrer" className="btn-secondary" style={{ flex: 1, fontSize: '11px', padding: '6px', gap: '6px', justifyContent: 'center', color: '#5865F2', borderColor: 'rgba(88,101,242,0.4)' }}>
                              <Link size={12} />
                              <span>Abrir no Discord</span>
                            </a>
                            <button className="btn-icon vo-hide" style={{ width: '30px', height: '30px' }} onClick={() => { setEditingLinkId(ticket.id); setEditingLinkValue(ticket.discordUrl || ''); }} title="Editar link"><Edit2 size={12} /></button>
                          </div>
                        ) : (
                          <button
                            className="btn-secondary vo-hide"
                            style={{ fontSize: '11px', padding: '6px', justifyContent: 'center', gap: '6px', color: '#666' }}
                            onClick={() => { setEditingLinkId(ticket.id); setEditingLinkValue(''); }}
                          >
                            <Link size={11} />
                            <span>Adicionar link do Discord</span>
                          </button>
                        )}

                        <button
                          className="btn-secondary vo-hide"
                          style={{ justifyContent: 'center', fontSize: '11px', padding: '6px', gap: '6px' }}
                          onClick={() => onUpdateTicketStatus(ticket.id, col.nextStatus)}
                        >
                          {col.status === 'Resolvido' ? <RotateCcw size={12} /> : <ArrowRight size={12} />}
                          <span>{col.nextLabel}</span>
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {isNewTicketOpen && (
        <div className="modal-overlay" onClick={resetForm}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Novo Chamado</h3>
              <button className="btn-icon" onClick={resetForm}><X size={16} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Cliente *</label>
                  <CustomSelect value={tClientId} onChange={setTClientId} placeholder="Selecionar cliente..." options={clients.map(c => ({ value: c.id, label: c.name }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Assunto *</label>
                  <input type="text" className="form-input" value={tSubject} onChange={e => setTSubject(e.target.value)} placeholder="Resumo do problema..." required />
                </div>
                <div className="form-group">
                  <label className="form-label">Descrição</label>
                  <textarea className="form-textarea" rows={3} value={tDescription} onChange={e => setTDescription(e.target.value)} placeholder="Detalhes do chamado..." />
                </div>
                <div className="form-group">
                  <label className="form-label">Prioridade</label>
                  <CustomSelect value={tPriority} onChange={setTPriority} options={['Baixa', 'Normal', 'Alta', 'Urgente']} />
                </div>
                <div className="form-group">
                  <label className="form-label">Link da demanda no Discord</label>
                  <input type="url" className="form-input" value={tDiscordUrl} onChange={e => setTDiscordUrl(e.target.value)} placeholder="https://discord.com/channels/..." />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={resetForm}>Cancelar</button>
                <button type="submit" className="btn-primary">Abrir Chamado</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
