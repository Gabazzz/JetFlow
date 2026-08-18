import React, { useMemo } from 'react';
import { TrendingUp, Building2, Trash2 } from 'lucide-react';
import CustomSelect from './CustomSelect';
import { OPPORTUNITY_STATUS_OPTIONS } from '../utils';

// Kanban por status — mesma vocabulário do upsell na Nota de Reunião e do
// card "Interesse em Ofertas" no Cliente 360, só que juntando todos os
// clientes numa visão só, pra dar pra achar "onde ficou aquela oportunidade
// que marquei" sem precisar abrir cliente por cliente.
const COLUMN_ACCENT = {
  'Interesse demonstrado': '#F59E0B',
  'Solicitar abordagem comercial': '#F59E0B',
  'Encaminhado ao comercial': '#3B82F6',
  'Em negociação': '#3B82F6',
  'Convertido': '#10B981',
  'Sem interesse': '#666'
};

export default function OportunidadesView({ clients, onNavigate, onUpdateClient }) {
  const allOpportunities = useMemo(() => {
    const list = [];
    (clients || []).forEach(client => {
      (client.interestOffers || []).forEach(offer => {
        list.push({ ...offer, clientId: client.id, clientName: client.name });
      });
    });
    return list;
  }, [clients]);

  const stats = useMemo(() => {
    const abertas = allOpportunities.filter(o => o.status !== 'Convertido' && o.status !== 'Sem interesse').length;
    const convertidas = allOpportunities.filter(o => o.status === 'Convertido').length;
    return { abertas, convertidas, total: allOpportunities.length };
  }, [allOpportunities]);

  const handleStatusChange = (clientId, offerId, status) => {
    const client = (clients || []).find(c => c.id === clientId);
    if (!client) return;
    const updated = (client.interestOffers || []).map(o => o.id === offerId ? { ...o, status } : o);
    onUpdateClient(clientId, { interestOffers: updated });
  };

  const handleRemove = (clientId, offerId) => {
    const client = (clients || []).find(c => c.id === clientId);
    if (!client) return;
    const updated = (client.interestOffers || []).filter(o => o.id !== offerId);
    onUpdateClient(clientId, { interestOffers: updated });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <TrendingUp size={20} style={{ color: 'var(--green-primary)' }} />
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#fff', margin: 0 }}>Oportunidades</h3>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              {stats.abertas} em aberto · {stats.convertidas} convertida{stats.convertidas !== 1 ? 's' : ''} · {stats.total} no total
            </span>
          </div>
        </div>
      </div>

      {allOpportunities.length === 0 ? (
        <div className="detail-card" style={{ backgroundColor: '#161616', border: '1px solid #252525', borderRadius: '8px', padding: '40px', textAlign: 'center' }}>
          <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
            Nenhuma oportunidade registrada ainda. Marque um upsell na Nota de Reunião ou adicione direto no card "Interesse em Ofertas" do cliente.
          </span>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '16px', alignItems: 'start' }}>
          {OPPORTUNITY_STATUS_OPTIONS.map(status => {
            const colOpportunities = allOpportunities.filter(o => o.status === status);
            const accent = COLUMN_ACCENT[status] || '#666';
            return (
              <div key={status} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 2px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: accent }} />
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#ccc', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{status}</span>
                  <span style={{ fontSize: '11px', color: '#666' }}>({colOpportunities.length})</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', minHeight: '60px' }}>
                  {colOpportunities.length === 0 ? (
                    <div style={{ border: '1px dashed #2A2A2A', borderRadius: '8px', padding: '20px', textAlign: 'center', color: '#555', fontSize: '12px' }}>
                      Nenhuma
                    </div>
                  ) : (
                    colOpportunities.map(offer => (
                      <div
                        key={`${offer.clientId}_${offer.id}`}
                        className="detail-card"
                        style={{ backgroundColor: '#161616', border: '1px solid #252525', borderLeft: `3px solid ${accent}`, borderRadius: '8px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                          <span style={{ fontSize: '13px', fontWeight: '700', color: '#fff', lineHeight: '1.4' }}>{offer.name}</span>
                          <button
                            className="btn-danger-icon"
                            style={{ width: '22px', height: '22px', flexShrink: 0 }}
                            title="Remover oportunidade"
                            onClick={() => {
                              if (window.confirm('Remover esta oportunidade?')) handleRemove(offer.clientId, offer.id);
                            }}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>

                        <span
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: 'var(--green-primary)', fontWeight: '600', cursor: 'pointer' }}
                          onClick={() => onNavigate(`clientes/${offer.clientId}`)}
                        >
                          <Building2 size={12} />
                          {offer.clientName}
                        </span>

                        <CustomSelect
                          value={offer.status}
                          onChange={v => handleStatusChange(offer.clientId, offer.id, v)}
                          options={OPPORTUNITY_STATUS_OPTIONS}
                        />
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
