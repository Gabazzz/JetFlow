import React, { useState } from 'react';
import { Edit2, Save, X, Plus, Trash2, ArrowLeft, Heart } from 'lucide-react';

export default function ClientDetailView({ 
  client, 
  plans, 
  modules, 
  availableOffers, 
  onUpdateClient, 
  onNavigate 
}) {
  // Editing states for sections
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [isEditingPlan, setIsEditingPlan] = useState(false);
  const [isEditingOffers, setIsEditingOffers] = useState(false);
  const [isEditingReminder, setIsEditingReminder] = useState(false);
  const [isEditingSla, setIsEditingSla] = useState(false);
  const [isEditingObs, setIsEditingObs] = useState(false);

  // Form states for Info Section
  const [name, setName] = useState(client.name);
  const [phone, setPhone] = useState(client.phone);
  const [whatsapp, setWhatsapp] = useState(client.whatsapp);
  const [email, setEmail] = useState(client.email);
  const [cnpj, setCnpj] = useState(client.cnpj);
  const [entryDate, setEntryDate] = useState(client.entryDate);
  const [responsible, setResponsible] = useState(client.responsible);

  // Form states for Plan Section
  const [plan, setPlan] = useState(client.plan);
  const [activeModules, setActiveModules] = useState(client.activeModules || []);

  // Form states for Offers Section
  const [interestOffers, setInterestOffers] = useState(client.interestOffers || []);
  const [selectedNewOffer, setSelectedNewOffer] = useState('');
  const [newOfferStatus, setNewOfferStatus] = useState('Interessado');

  // Form states for Reminder Section
  const [reminderText, setReminderText] = useState(client.reminder?.text || '');
  const [reminderDeadline, setReminderDeadline] = useState(client.reminder?.deadline || '');

  // Form states for SLA Section
  const [criticality, setCriticality] = useState(client.criticality);
  const [justification, setJustification] = useState(client.criticalityJustification || '');

  // Form states for Observation Section
  const [observations, setObservations] = useState(client.observations || '');

  // Section Save Handlers
  const handleSaveInfo = () => {
    onUpdateClient(client.id, {
      name, phone, whatsapp, email, cnpj, entryDate, responsible
    });
    setIsEditingInfo(false);
  };

  const handleSavePlan = () => {
    onUpdateClient(client.id, {
      plan, activeModules
    });
    setIsEditingPlan(false);
  };

  const handleToggleModule = (modName) => {
    setActiveModules(prev => 
      prev.includes(modName) ? prev.filter(m => m !== modName) : [...prev, modName]
    );
  };

  // Add Interest Offer
  const handleAddOffer = () => {
    if (!selectedNewOffer) return;
    const newOfferItem = {
      id: `io_${Date.now()}`,
      name: selectedNewOffer,
      status: newOfferStatus
    };
    const updated = [...interestOffers, newOfferItem];
    setInterestOffers(updated);
    onUpdateClient(client.id, { interestOffers: updated });
    setSelectedNewOffer('');
  };

  // Remove Interest Offer
  const handleRemoveOffer = (offerId) => {
    const updated = interestOffers.filter(o => o.id !== offerId);
    setInterestOffers(updated);
    onUpdateClient(client.id, { interestOffers: updated });
  };

  // Update Status of existing Interest Offer
  const handleOfferStatusChange = (offerId, newStatus) => {
    const updated = interestOffers.map(o => 
      o.id === offerId ? { ...o, status: newStatus } : o
    );
    setInterestOffers(updated);
    onUpdateClient(client.id, { interestOffers: updated });
  };

  const handleSaveReminder = () => {
    onUpdateClient(client.id, {
      reminder: reminderText.trim() ? { text: reminderText, deadline: reminderDeadline } : null
    });
    setIsEditingReminder(false);
  };

  const handleSaveSla = () => {
    onUpdateClient(client.id, {
      criticality,
      criticalityJustification: justification
    });
    setIsEditingSla(false);
  };

  const handleSaveObs = () => {
    onUpdateClient(client.id, {
      observations
    });
    setIsEditingObs(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%' }}>
      {/* Detail Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button className="btn-icon" onClick={() => onNavigate('clientes')} title="Voltar">
          <ArrowLeft size={16} />
        </button>
        <div>
          <h2 className="view-title">{client.name}</h2>
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Fase atual: <strong>{client.stage}</strong></span>
        </div>
      </div>

      <div className="detail-layout">
        {/* Main Details Panel (Left) */}
        <div className="detail-main">
          {/* Section 1: Informações Gerais */}
          <div className="detail-card">
            <div className="section-header">
              <h3 className="section-title">Informações Gerais</h3>
              {!isEditingInfo ? (
                <button className="btn-secondary" onClick={() => setIsEditingInfo(true)}>
                  <Edit2 size={12} />
                  <span>Editar</span>
                </button>
              ) : (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn-secondary" onClick={() => setIsEditingInfo(false)}>Cancelar</button>
                  <button className="btn-primary" onClick={handleSaveInfo} style={{ padding: '8px 14px', fontSize: '13px' }}>
                    <Save size={12} />
                    <span>Salvar</span>
                  </button>
                </div>
              )}
            </div>

            {!isEditingInfo ? (
              <div className="detail-row">
                <div className="detail-item">
                  <span className="detail-item-label">Nome do Cliente</span>
                  <span className="detail-item-value">{client.name}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-item-label">CNPJ</span>
                  <span className="detail-item-value">{client.cnpj || '—'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-item-label">Telefone</span>
                  <span className="detail-item-value">{client.phone || '—'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-item-label">WhatsApp</span>
                  <span className="detail-item-value">{client.whatsapp || '—'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-item-label">E-mail</span>
                  <span className="detail-item-value">{client.email || '—'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-item-label">Data de Entrada</span>
                  <span className="detail-item-value">{client.entryDate || '—'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-item-label">Responsável</span>
                  <span className="detail-item-value">{client.responsible || '—'}</span>
                </div>
              </div>
            ) : (
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Nome</label>
                  <input type="text" className="form-input" value={name} onChange={e => setName(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">CNPJ</label>
                  <input type="text" className="form-input" value={cnpj} onChange={e => setCnpj(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Telefone</label>
                  <input type="text" className="form-input" value={phone} onChange={e => setPhone(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">WhatsApp</label>
                  <input type="text" className="form-input" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">E-mail</label>
                  <input type="email" className="form-input" value={email} onChange={e => setEmail(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Data de Entrada</label>
                  <input type="date" className="form-input" value={entryDate} onChange={e => setEntryDate(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Responsável</label>
                  <input type="text" className="form-input" value={responsible} onChange={e => setResponsible(e.target.value)} />
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Plano e Módulos */}
          <div className="detail-card">
            <div className="section-header">
              <h3 className="section-title">Plano e Módulos Ativos</h3>
              {!isEditingPlan ? (
                <button className="btn-secondary" onClick={() => setIsEditingPlan(true)}>
                  <Edit2 size={12} />
                  <span>Editar</span>
                </button>
              ) : (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn-secondary" onClick={() => setIsEditingPlan(false)}>Cancelar</button>
                  <button className="btn-primary" onClick={handleSavePlan} style={{ padding: '8px 14px', fontSize: '13px' }}>
                    <Save size={12} />
                    <span>Salvar</span>
                  </button>
                </div>
              )}
            </div>

            {!isEditingPlan ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="detail-item">
                  <span className="detail-item-label">Plano Contratado</span>
                  <span className="detail-item-value" style={{ fontSize: '16px', color: 'var(--green-primary)', fontWeight: '600' }}>{client.plan}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-item-label">Módulos Ativos</span>
                  <div className="module-pills" style={{ marginTop: '8px' }}>
                    {client.activeModules && client.activeModules.length > 0 ? (
                      client.activeModules.map(mod => (
                        <span key={mod} className="module-pill" style={{ padding: '4px 10px', fontSize: '12px' }}>{mod}</span>
                      ))
                    ) : (
                      <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Nenhum módulo ativo contratado.</span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Selecionar Plano</label>
                  <select className="form-select" value={plan} onChange={e => setPlan(e.target.value)}>
                    {plans.map(p => (
                      <option key={p.id} value={p.name}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group full-width">
                  <label className="form-label">Módulos Ativos</label>
                  <div className="checkbox-group">
                    {modules.map(mod => (
                      <label key={mod.id} className="checkbox-label">
                        <input 
                          type="checkbox" 
                          checked={activeModules.includes(mod.name)}
                          onChange={() => handleToggleModule(mod.name)}
                        />
                        <span>{mod.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Ofertas de Interesse */}
          <div className="detail-card">
            <div className="section-header">
              <h3 className="section-title">Ofertas de Interesse</h3>
              <button 
                className={`btn-secondary ${isEditingOffers ? 'active' : ''}`} 
                onClick={() => setIsEditingOffers(!isEditingOffers)}
              >
                <Edit2 size={12} />
                <span>{isEditingOffers ? 'Parar de Editar' : 'Gerenciar'}</span>
              </button>
            </div>

            {/* If in edit mode, show the adding row */}
            {isEditingOffers && (
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', backgroundColor: 'var(--bg-primary)', padding: '16px', borderRadius: 'var(--radius)', border: '1px solid var(--border-color)' }}>
                <div className="form-group" style={{ flex: 2 }}>
                  <label className="form-label">Adicionar Oferta</label>
                  <select 
                    className="form-select" 
                    value={selectedNewOffer} 
                    onChange={e => setSelectedNewOffer(e.target.value)}
                  >
                    <option value="">Selecione uma oferta...</option>
                    {availableOffers.map(off => (
                      <option key={off.id} value={off.name}>{off.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Status</label>
                  <select 
                    className="form-select" 
                    value={newOfferStatus} 
                    onChange={e => setNewOfferStatus(e.target.value)}
                  >
                    <option value="Interessado">Interessado</option>
                    <option value="Em análise">Em análise</option>
                    <option value="Convertido">Convertido</option>
                  </select>
                </div>
                <button className="btn-primary" onClick={handleAddOffer} style={{ height: '42px', padding: '0 16px' }}>
                  <Plus size={16} />
                  <span>Adicionar</span>
                </button>
              </div>
            )}

            <div className="offers-list">
              {interestOffers.length === 0 ? (
                <div className="empty-state" style={{ padding: '24px' }}>
                  <span className="empty-state-icon">💡</span>
                  <p>Nenhuma oferta de interesse vinculada.</p>
                </div>
              ) : (
                interestOffers.map(off => (
                  <div key={off.id} className="offer-row">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Heart size={14} style={{ color: 'var(--green-primary)', fill: off.status === 'Convertido' ? 'var(--green-primary)' : 'none' }} />
                      <span style={{ fontWeight: '500' }}>{off.name}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      {isEditingOffers ? (
                        <>
                          <select 
                            className="offer-status-select" 
                            value={off.status}
                            onChange={e => handleOfferStatusChange(off.id, e.target.value)}
                          >
                            <option value="Interessado">Interessado</option>
                            <option value="Em análise">Em análise</option>
                            <option value="Convertido">Convertido</option>
                          </select>
                          <button className="btn-danger-icon" onClick={() => handleRemoveOffer(off.id)} title="Remover">
                            <Trash2 size={14} />
                          </button>
                        </>
                      ) : (
                        <span className={`badge ${
                          off.status === 'Convertido' ? 'badge-estavel' : 
                          off.status === 'Em análise' ? 'badge-atencao' : 'badge-critico'
                        }`} style={{ fontSize: '10px' }}>
                          {off.status}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Details Panel (Right) */}
        <div className="detail-sidebar">
          {/* Section 4: Lembrete Ativo */}
          <div className="detail-card">
            <div className="section-header">
              <h3 className="section-title">Lembrete Ativo</h3>
              {!isEditingReminder ? (
                <button className="btn-secondary" onClick={() => setIsEditingReminder(true)}>
                  <Edit2 size={12} />
                </button>
              ) : (
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button className="btn-icon" onClick={() => setIsEditingReminder(false)}><X size={12} /></button>
                  <button className="btn-icon" onClick={handleSaveReminder} style={{ color: 'var(--green-primary)' }}><Save size={12} /></button>
                </div>
              )}
            </div>

            {!isEditingReminder ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {client.reminder ? (
                  <>
                    <p style={{ fontSize: '14px', lineHeight: '1.5' }}>{client.reminder.text}</p>
                    <span style={{ fontSize: '12px', color: 'var(--green-primary)', fontWeight: '500' }}>
                      Prazo: {client.reminder.deadline || 'Sem prazo'}
                    </span>
                  </>
                ) : (
                  <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Nenhum lembrete ativo definido para este cliente.</span>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Texto do Lembrete</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={reminderText} 
                    onChange={e => setReminderText(e.target.value)} 
                    placeholder="Descrição..."
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Prazo</label>
                  <input 
                    type="date" 
                    className="form-input" 
                    value={reminderDeadline} 
                    onChange={e => setReminderDeadline(e.target.value)} 
                  />
                </div>
              </div>
            )}
          </div>

          {/* Section 5: SLA / Criticidade */}
          <div className="detail-card">
            <div className="section-header">
              <h3 className="section-title">SLA & Criticidade</h3>
              {!isEditingSla ? (
                <button className="btn-secondary" onClick={() => setIsEditingSla(true)}>
                  <Edit2 size={12} />
                </button>
              ) : (
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button className="btn-icon" onClick={() => setIsEditingSla(false)}><X size={12} /></button>
                  <button className="btn-icon" onClick={handleSaveSla} style={{ color: 'var(--green-primary)' }}><Save size={12} /></button>
                </div>
              )}
            </div>

            {!isEditingSla ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="detail-item">
                  <span className="detail-item-label">Status</span>
                  <div style={{ marginTop: '6px' }}>
                    <span className={`badge ${
                      client.criticality === 'Crítico' ? 'badge-critico' : 
                      client.criticality === 'Atenção' ? 'badge-atencao' : 'badge-estavel'
                    }`} style={{ fontSize: '12px', padding: '6px 12px' }}>
                      {client.criticality}
                    </span>
                  </div>
                </div>
                <div className="detail-item">
                  <span className="detail-item-label">Justificativa</span>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.4', marginTop: '4px' }}>
                    {client.criticalityJustification || 'Nenhuma justificativa preenchida.'}
                  </p>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Criticidade</label>
                  <select className="form-select" value={criticality} onChange={e => setCriticality(e.target.value)}>
                    <option value="Estável">Estável</option>
                    <option value="Atenção">Atenção</option>
                    <option value="Crítico">Crítico</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Justificativa</label>
                  <textarea 
                    className="form-textarea" 
                    rows="3" 
                    value={justification} 
                    onChange={e => setJustification(e.target.value)}
                    placeholder="Descreva o motivo..."
                  />
                </div>
              </div>
            )}
          </div>

          {/* Section 6: Observações Gerais */}
          <div className="detail-card">
            <div className="section-header">
              <h3 className="section-title">Observações Gerais</h3>
              {!isEditingObs ? (
                <button className="btn-secondary" onClick={() => setIsEditingObs(true)}>
                  <Edit2 size={12} />
                </button>
              ) : (
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button className="btn-icon" onClick={() => setIsEditingObs(false)}><X size={12} /></button>
                  <button className="btn-icon" onClick={handleSaveObs} style={{ color: 'var(--green-primary)' }}><Save size={12} /></button>
                </div>
              )}
            </div>

            {!isEditingObs ? (
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                {client.observations || 'Nenhuma observação cadastrada.'}
              </p>
            ) : (
              <textarea 
                className="form-textarea" 
                rows="6" 
                value={observations} 
                onChange={e => setObservations(e.target.value)} 
                placeholder="Observações de onboarding..."
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
