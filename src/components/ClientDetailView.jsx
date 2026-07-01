import React, { useState } from 'react';
import { 
  Edit2, Save, X, Plus, Trash2, ArrowLeft, Heart, 
  ExternalLink, Link, AlertTriangle, CheckSquare, PlusCircle 
} from 'lucide-react';
import { toBRDate, toISODate, getDateStatus } from '../utils';

export default function ClientDetailView({ 
  client, 
  plans, 
  modules, 
  availableOffers, 
  onUpdateClient, 
  onRegisterContact,
  onAddReminder,
  onEditReminder,
  onRemoveReminder,
  onNavigate 
}) {
  // Editing states for sections
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [isEditingPlan, setIsEditingPlan] = useState(false);
  const [isEditingOffers, setIsEditingOffers] = useState(false);
  const [isEditingSla, setIsEditingSla] = useState(false);
  const [isEditingObs, setIsEditingObs] = useState(false);

  // Link Modal Editing State
  const [isEditingLinks, setIsEditingLinks] = useState(false);

  // Reminder Modals state
  const [isAddReminderOpen, setIsAddReminderOpen] = useState(false);
  const [editingReminderObj, setEditingReminderObj] = useState(null); // reminder object

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

  // Form states for SLA Section
  const [criticality, setCriticality] = useState(client.criticality);
  const [justification, setJustification] = useState(client.criticalityJustification || '');

  // Form states for Observation Section
  const [observations, setObservations] = useState(client.observations || '');

  // Form states for Quick Links Modal
  const [linkCrm, setLinkCrm] = useState(client.quickLinks?.crm || '');
  const [linkDiscordInt, setLinkDiscordInt] = useState(client.quickLinks?.discordIntegration || '');
  const [linkSite, setLinkSite] = useState(client.quickLinks?.site || '');
  const [linkDeskUrl, setLinkDeskUrl] = useState(client.quickLinks?.deskPlatformUrl || '');
  const [linkDeskEmail, setLinkDeskEmail] = useState(client.quickLinks?.deskPlatformEmail || '');
  const [linkDiscordSupportList, setLinkDiscordSupportList] = useState(client.quickLinks?.discordSupport || []);

  // Form states for Add Reminder Modal
  const [remTitle, setRemTitle] = useState('');
  const [remDesc, setRemDesc] = useState('');
  const [remDeadline, setRemDeadline] = useState('');
  const [remCriticality, setRemCriticality] = useState('Normal');

  // Form states for Edit Reminder Modal
  const [editRemTitle, setEditRemTitle] = useState('');
  const [editRemDesc, setEditRemDesc] = useState('');
  const [editRemDeadline, setEditRemDeadline] = useState('');
  const [editRemCriticality, setEditRemCriticality] = useState('Normal');

  // Save Info Section
  const handleSaveInfo = () => {
    onUpdateClient(client.id, {
      name, phone, whatsapp, email, cnpj, entryDate, responsible
    });
    setIsEditingInfo(false);
  };

  // Save Plan Section
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

  // Save SLA Recurrence Section
  const handleSaveSla = () => {
    onUpdateClient(client.id, {
      criticality,
      criticalityJustification: justification
    });
    // Let App recalculate nextContactDate with new criticality
    setTimeout(() => {
      // Small delay to allow state propagate
      onUpdateClient(client.id, {
        nextContactDate: calculateNextContactDate(criticality, '30/06/2026')
      });
    }, 50);
    setIsEditingSla(false);
  };

  // Save Obs Section
  const handleSaveObs = () => {
    onUpdateClient(client.id, { observations });
    setIsEditingObs(false);
  };

  // Save Quick Links Modal
  const handleSaveLinks = (e) => {
    e.preventDefault();
    onUpdateClient(client.id, {
      quickLinks: {
        crm: linkCrm,
        discordIntegration: linkDiscordInt,
        discordSupport: linkDiscordSupportList,
        site: linkSite,
        deskPlatformUrl: linkDeskUrl,
        deskPlatformEmail: linkDeskEmail
      }
    });
    setIsEditingLinks(false);
  };

  const handleAddDiscordSupportLink = () => {
    setLinkDiscordSupportList(prev => [
      ...prev,
      { id: `ds_${Date.now()}`, label: 'Canal de Suporte Extra', url: '' }
    ]);
  };

  const handleRemoveDiscordSupportLink = (id) => {
    setLinkDiscordSupportList(prev => prev.filter(item => item.id !== id));
  };

  const handleUpdateDiscordSupportLink = (id, field, val) => {
    setLinkDiscordSupportList(prev => prev.map(item => 
      item.id === id ? { ...item, [field]: val } : item
    ));
  };

  // Add Custom Reminder Submit
  const handleAddReminderSubmit = (e) => {
    e.preventDefault();
    if (!remTitle.trim() || !remDeadline) return;
    
    const brDeadline = toBRDate(remDeadline);
    onAddReminder(client.id, remTitle, remDesc, brDeadline, remCriticality);
    
    // Reset Form & Close
    setRemTitle('');
    setRemDesc('');
    setRemDeadline('');
    setRemCriticality('Normal');
    setIsAddReminderOpen(false);
  };

  // Edit Custom Reminder Handlers
  const handleOpenEditReminder = (rem) => {
    setEditingReminderObj(rem);
    setEditRemTitle(rem.title);
    setEditRemDesc(rem.description || '');
    setEditRemDeadline(toISODate(rem.deadline));
    setEditRemCriticality(rem.criticality);
  };

  const handleSaveEditReminderSubmit = (e) => {
    e.preventDefault();
    if (!editingReminderObj) return;

    const brDeadline = toBRDate(editRemDeadline);
    onEditReminder(client.id, editingReminderObj.id, {
      title: editRemTitle,
      description: editRemDesc,
      deadline: brDeadline,
      criticality: editRemCriticality
    });

    setEditingReminderObj(null);
  };

  // Verification helper for Site link
  const hasOfficialApiModule = client.activeModules?.includes('API Oficial');

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
                  <input type="text" className="form-input" placeholder="DD/MM/AAAA" value={entryDate} onChange={e => setEntryDate(e.target.value)} />
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

          {/* New Section: Links Rápidos */}
          <div className="detail-card">
            <div className="section-header">
              <h3 className="section-title">Links Rápidos</h3>
              <button className="btn-secondary" onClick={() => setIsEditingLinks(true)}>
                <Edit2 size={12} />
                <span>Editar Links</span>
              </button>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
              {client.quickLinks?.crm && (
                <a href={client.quickLinks.crm} target="_blank" rel="noreferrer" className="btn-secondary">
                  <Link size={14} style={{ color: 'var(--green-primary)' }} />
                  <span>CRM Active</span>
                </a>
              )}
              {client.quickLinks?.discordIntegration && (
                <a href={client.quickLinks.discordIntegration} target="_blank" rel="noreferrer" className="btn-secondary">
                  <Link size={14} style={{ color: '#5865F2' }} />
                  <span>Discord - Demandas</span>
                </a>
              )}
              {client.quickLinks?.discordSupport && client.quickLinks.discordSupport.map(ds => (
                <a key={ds.id} href={ds.url} target="_blank" rel="noreferrer" className="btn-secondary">
                  <Link size={14} style={{ color: '#5865F2' }} />
                  <span>{ds.label}</span>
                </a>
              ))}
              {client.quickLinks?.site && hasOfficialApiModule && (
                <a href={client.quickLinks.site} target="_blank" rel="noreferrer" className="btn-secondary">
                  <ExternalLink size={14} style={{ color: 'var(--green-primary)' }} />
                  <span>Site do Cliente</span>
                </a>
              )}
              {client.quickLinks?.deskPlatformUrl && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <a href={client.quickLinks.deskPlatformUrl} target="_blank" rel="noreferrer" className="btn-secondary">
                    <ExternalLink size={14} />
                    <span>Plataforma Atendimento</span>
                  </a>
                  {client.quickLinks.deskPlatformEmail && (
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      ({client.quickLinks.deskPlatformEmail})
                    </span>
                  )}
                </div>
              )}

              {/* Empty links state */}
              {(!client.quickLinks?.crm && 
                !client.quickLinks?.discordIntegration && 
                (!client.quickLinks?.discordSupport || client.quickLinks.discordSupport.length === 0) &&
                !client.quickLinks?.site && 
                !client.quickLinks?.deskPlatformUrl) && (
                <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                  Nenhum link rápido cadastrado para este cliente.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Details Panel (Right) */}
        <div className="detail-sidebar">
          
          {/* Section 4: SLA / Criticidade (Automatic Contact Recurrence Card) */}
          <div className="detail-card">
            <div className="section-header">
              <h3 className="section-title">Ciclo SLA & Criticidade</h3>
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className={`badge ${
                    client.criticality === 'Crítico' ? 'badge-critico' : 
                    client.criticality === 'Atenção' ? 'badge-atencao' : 'badge-estavel'
                  }`} style={{ fontSize: '11px', padding: '4px 10px' }}>
                    {client.criticality}
                  </span>
                  
                  <span className="cycle-badge">
                    {client.criticality === 'Crítico' && 'Contato diário'}
                    {client.criticality === 'Atenção' && 'Dia sim, dia não'}
                    {client.criticality === 'Estável' && 'A cada 3 dias'}
                  </span>
                </div>

                <div className="detail-item">
                  <span className="detail-item-label">Próximo Contato Operacional</span>
                  <strong style={{ fontSize: '15px', color: 'var(--text-primary)', marginTop: '4px' }}>
                    {client.nextContactDate || 'Não definido'}
                  </strong>
                </div>

                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                  Justificativa: {client.criticalityJustification || 'Sem justificativa.'}
                </p>

                <button 
                  className="btn-primary" 
                  style={{ width: '100%', justifyContent: 'center', marginTop: '4px' }}
                  onClick={() => {
                    onRegisterContact(client.id, 'Registrado contato de ciclo via botão detalhe');
                    alert('Contato registrado e próximo vencimento atualizado!');
                  }}
                >
                  <CheckSquare size={14} />
                  <span>Registrar Contato Feito</span>
                </button>
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

          {/* Section 5: List of custom reminders */}
          <div className="detail-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 className="section-title">Lembretes Ativos ({client.reminders?.length || 0})</h3>
              <button 
                className="btn-secondary" 
                style={{ padding: '4px 8px', fontSize: '11px' }}
                onClick={() => setIsAddReminderOpen(true)}
              >
                <Plus size={12} />
                <span>Adicionar</span>
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {(!client.reminders || client.reminders.length === 0) ? (
                <div style={{ color: 'var(--text-secondary)', fontSize: '13px', textAlign: 'center', padding: '12px 0' }}>
                  Nenhum lembrete cadastrado.
                </div>
              ) : (
                client.reminders.map(rem => {
                  let badgeClass = 'badge-estavel';
                  if (rem.criticality === 'Urgente') badgeClass = 'badge-critico';
                  if (rem.criticality === 'Normal') badgeClass = 'badge-atencao';

                  const status = getDateStatus(rem.deadline, '30/06/2026');
                  let dateClass = 'date-future';
                  if (status === 'overdue') dateClass = 'date-overdue';
                  else if (status === 'today') dateClass = 'date-today';

                  return (
                    <div 
                      key={rem.id}
                      style={{ 
                        backgroundColor: 'var(--bg-primary)', 
                        border: '1px solid var(--border-color)', 
                        borderRadius: 'var(--radius)', 
                        padding: '12px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                        <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>{rem.title}</span>
                        <span className={`badge ${badgeClass}`} style={{ fontSize: '8px', padding: '1px 4px' }}>{rem.criticality}</span>
                      </div>
                      
                      {rem.description && <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{rem.description}</p>}
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                        <span className={dateClass} style={{ fontSize: '11px' }}>
                          Prazo: {rem.deadline}
                        </span>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button 
                            className="btn-icon" 
                            style={{ width: '22px', height: '22px' }} 
                            onClick={() => handleOpenEditReminder(rem)}
                          >
                            <Edit2 size={10} />
                          </button>
                          <button 
                            className="btn-danger-icon" 
                            style={{ width: '22px', height: '22px' }} 
                            onClick={() => onRemoveReminder(client.id, rem.id)}
                          >
                            <Trash2 size={10} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
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

      {/* Edit Quick Links Modal */}
      {isEditingLinks && (
        <div className="modal-overlay" onClick={() => setIsEditingLinks(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '650px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Editar Links Rápidos</h3>
              <button className="btn-icon" onClick={() => setIsEditingLinks(false)}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSaveLinks}>
              <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">CRM Active (URL)</label>
                    <input 
                      type="url" 
                      className="form-input" 
                      value={linkCrm} 
                      onChange={e => setLinkCrm(e.target.value)}
                      placeholder="https://activecrm..."
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Discord - Demandas de Integração (URL)</label>
                    <input 
                      type="url" 
                      className="form-input" 
                      value={linkDiscordInt} 
                      onChange={e => setLinkDiscordInt(e.target.value)}
                      placeholder="https://discord..."
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Site do Cliente (URL)</label>
                    <input 
                      type="url" 
                      className="form-input" 
                      value={linkSite} 
                      onChange={e => setLinkSite(e.target.value)}
                      placeholder="https://..."
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Plataforma Atendimento (URL)</label>
                    <input 
                      type="url" 
                      className="form-input" 
                      value={linkDeskUrl} 
                      onChange={e => setLinkDeskUrl(e.target.value)}
                      placeholder="https://atendimento..."
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Plataforma Atendimento (E-mail vinculado)</label>
                    <input 
                      type="email" 
                      className="form-input" 
                      value={linkDeskEmail} 
                      onChange={e => setLinkDeskEmail(e.target.value)}
                      placeholder="email@atendimento.com"
                    />
                  </div>
                </div>

                {/* Discord Support Multi-entries list */}
                <div style={{ marginTop: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span className="form-label" style={{ fontWeight: '600' }}>Canais de Suporte Discord</span>
                    <button 
                      type="button" 
                      className="btn-secondary" 
                      style={{ padding: '4px 8px', fontSize: '11px' }}
                      onClick={handleAddDiscordSupportLink}
                    >
                      <PlusCircle size={12} />
                      <span>Adicionar Canal</span>
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {linkDiscordSupportList.length === 0 ? (
                      <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Nenhum canal de suporte Discord cadastrado.</span>
                    ) : (
                      linkDiscordSupportList.map(item => (
                        <div key={item.id} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                          <input 
                            type="text" 
                            className="form-input" 
                            style={{ flex: 1, fontSize: '12px' }}
                            value={item.label} 
                            placeholder="Label (Ex: Suporte DevOps)"
                            onChange={e => handleUpdateDiscordSupportLink(item.id, 'label', e.target.value)}
                          />
                          <input 
                            type="url" 
                            className="form-input" 
                            style={{ flex: 2, fontSize: '12px' }}
                            value={item.url} 
                            placeholder="Discord URL"
                            onChange={e => handleUpdateDiscordSupportLink(item.id, 'url', e.target.value)}
                          />
                          <button 
                            type="button" 
                            className="btn-danger-icon" 
                            onClick={() => handleRemoveDiscordSupportLink(item.id)}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setIsEditingLinks(false)}>Cancelar</button>
                <button type="submit" className="btn-primary">Salvar Links</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Custom Reminder Modal */}
      {isAddReminderOpen && (
        <div className="modal-overlay" onClick={() => setIsAddReminderOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Novo Lembrete para {client.name}</h3>
              <button className="btn-icon" onClick={() => setIsAddReminderOpen(false)}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleAddReminderSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Título do Lembrete *</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={remTitle} 
                    onChange={e => setRemTitle(e.target.value)} 
                    placeholder="O que precisa ser feito?"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Descrição (Opcional)</label>
                  <textarea 
                    className="form-textarea" 
                    value={remDesc} 
                    onChange={e => setRemDesc(e.target.value)} 
                    placeholder="Mais detalhes..."
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Prazo de Conclusão *</label>
                  <input 
                    type="date" 
                    className="form-input" 
                    value={remDeadline} 
                    onChange={e => setRemDeadline(e.target.value)} 
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Criticidade</label>
                  <select 
                    className="form-select" 
                    value={remCriticality} 
                    onChange={e => setRemCriticality(e.target.value)}
                  >
                    <option value="Baixo">Baixo</option>
                    <option value="Normal">Normal</option>
                    <option value="Urgente">Urgente</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setIsAddReminderOpen(false)}>Cancelar</button>
                <button type="submit" className="btn-primary">Adicionar Lembrete</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Custom Reminder Modal */}
      {editingReminderObj && (
        <div className="modal-overlay" onClick={() => setEditingReminderObj(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Editar Lembrete</h3>
              <button className="btn-icon" onClick={() => setEditingReminderObj(null)}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSaveEditReminderSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Título do Lembrete *</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={editRemTitle} 
                    onChange={e => setEditRemTitle(e.target.value)} 
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Descrição</label>
                  <textarea 
                    className="form-textarea" 
                    value={editRemDesc} 
                    onChange={e => setEditRemDesc(e.target.value)} 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Prazo *</label>
                  <input 
                    type="date" 
                    className="form-input" 
                    value={editRemDeadline} 
                    onChange={e => setEditRemDeadline(e.target.value)} 
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Criticidade</label>
                  <select 
                    className="form-select" 
                    value={editRemCriticality} 
                    onChange={e => setEditRemCriticality(e.target.value)}
                  >
                    <option value="Baixo">Baixo</option>
                    <option value="Normal">Normal</option>
                    <option value="Urgente">Urgente</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setEditingReminderObj(null)}>Cancelar</button>
                <button type="submit" className="btn-primary">Salvar Lembrete</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
