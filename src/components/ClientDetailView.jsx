import React, { useState } from 'react';
import { 
  Edit2, Save, X, Plus, Trash2, ArrowLeft, Heart, 
  ExternalLink, Link, CheckSquare, PlusCircle, Check,
  ChevronDown, ChevronRight, Clock
} from 'lucide-react';
import { toBRDate, toISODate, getDateStatus } from '../utils';
import CustomDatePicker from './CustomDatePicker';

export default function ClientDetailView({ 
  client, 
  plans, 
  modules, 
  stages,
  availableOffers, 
  onUpdateClient, 
  onRegisterContact,
  onAddReminder,
  onEditReminder,
  onRemoveReminder,
  onUpdateChecklist,
  onNavigate 
}) {
  const todayStr = '30/06/2026';

  // Editing states
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [isEditingPlan, setIsEditingPlan] = useState(false);
  const [isEditingOffers, setIsEditingOffers] = useState(false);
  const [isEditingSla, setIsEditingSla] = useState(false);
  const [isEditingObs, setIsEditingObs] = useState(false);
  const [isEditingLinks, setIsEditingLinks] = useState(false);
  const [isAddReminderOpen, setIsAddReminderOpen] = useState(false);
  const [editingReminderObj, setEditingReminderObj] = useState(null);

  // Accordions state
  const [expandedModules, setExpandedModules] = useState({});
  const [showFullHistory, setShowFullHistory] = useState(false);
  const [showFullContacts, setShowFullContacts] = useState(false);

  // Info form state
  const [name, setName] = useState(client.name);
  const [phone, setPhone] = useState(client.phone);
  const [whatsapp, setWhatsapp] = useState(client.whatsapp);
  const [email, setEmail] = useState(client.email);
  const [cnpj, setCnpj] = useState(client.cnpj);
  const [entryDate, setEntryDate] = useState(client.entryDate);
  const [responsible, setResponsible] = useState(client.responsible);

  // Plan form state
  const [plan, setPlan] = useState(client.plan);
  const [activeModules, setActiveModules] = useState(client.activeModules || []);

  // Offers state
  const [interestOffers, setInterestOffers] = useState(client.interestOffers || []);
  const [selectedNewOffer, setSelectedNewOffer] = useState('');
  const [newOfferStatus, setNewOfferStatus] = useState('Interessado');

  // SLA form state
  const [criticality, setCriticality] = useState(client.criticality);
  const [justification, setJustification] = useState(client.criticalityJustification || '');

  // Obs state
  const [observations, setObservations] = useState(client.observations || '');

  // Quick Links form state
  const [linkCrm, setLinkCrm] = useState(client.quickLinks?.crm || '');
  const [linkDiscordInt, setLinkDiscordInt] = useState(client.quickLinks?.discordIntegration || '');
  const [linkSite, setLinkSite] = useState(client.quickLinks?.site || '');
  const [linkDeskUrl, setLinkDeskUrl] = useState(client.quickLinks?.deskPlatformUrl || '');
  const [linkDeskEmail, setLinkDeskEmail] = useState(client.quickLinks?.deskPlatformEmail || '');
  const [linkDiscordSupportList, setLinkDiscordSupportList] = useState(client.quickLinks?.discordSupport || []);

  // Add Reminder form state
  const [remTitle, setRemTitle] = useState('');
  const [remDesc, setRemDesc] = useState('');
  const [remDeadline, setRemDeadline] = useState('');
  const [remCriticality, setRemCriticality] = useState('Normal');

  // Edit Reminder form state
  const [editRemTitle, setEditRemTitle] = useState('');
  const [editRemDesc, setEditRemDesc] = useState('');
  const [editRemDeadline, setEditRemDeadline] = useState('');
  const [editRemCriticality, setEditRemCriticality] = useState('Normal');

  const hasOfficialApiModule = client.activeModules?.includes('API Oficial');

  // ---- Handlers ----

  const handleSaveInfo = () => {
    onUpdateClient(client.id, { name, phone, whatsapp, email, cnpj, entryDate, responsible,
      lastUpdated: { date: todayStr, time: new Date().toLocaleTimeString('pt-BR', {hour:'2-digit',minute:'2-digit'}), user: responsible || client.responsible }
    });
    setIsEditingInfo(false);
  };

  const handleSavePlan = () => {
    onUpdateClient(client.id, { plan, activeModules });
    setIsEditingPlan(false);
  };

  const handleToggleModule = (modName) => {
    setActiveModules(prev => prev.includes(modName) ? prev.filter(m => m !== modName) : [...prev, modName]);
  };

  const handleAddOffer = () => {
    if (!selectedNewOffer) return;
    const updated = [...interestOffers, { id: `io_${Date.now()}`, name: selectedNewOffer, status: newOfferStatus }];
    setInterestOffers(updated);
    onUpdateClient(client.id, { interestOffers: updated });
    setSelectedNewOffer('');
  };

  const handleRemoveOffer = (id) => {
    const updated = interestOffers.filter(o => o.id !== id);
    setInterestOffers(updated);
    onUpdateClient(client.id, { interestOffers: updated });
  };

  const handleOfferStatusChange = (id, status) => {
    const updated = interestOffers.map(o => o.id === id ? { ...o, status } : o);
    setInterestOffers(updated);
    onUpdateClient(client.id, { interestOffers: updated });
  };

  const handleSaveSla = () => {
    onUpdateClient(client.id, { criticality, criticalityJustification: justification });
    setIsEditingSla(false);
  };

  const handleSaveObs = () => {
    onUpdateClient(client.id, { observations });
    setIsEditingObs(false);
  };

  const handleSaveLinks = (e) => {
    e.preventDefault();
    onUpdateClient(client.id, {
      quickLinks: { crm: linkCrm, discordIntegration: linkDiscordInt, discordSupport: linkDiscordSupportList, site: linkSite, deskPlatformUrl: linkDeskUrl, deskPlatformEmail: linkDeskEmail }
    });
    setIsEditingLinks(false);
  };

  const handleAddReminderSubmit = (e) => {
    e.preventDefault();
    if (!remTitle.trim() || !remDeadline) return;
    onAddReminder(client.id, remTitle, remDesc, remDeadline, remCriticality);
    setRemTitle(''); setRemDesc(''); setRemDeadline(''); setRemCriticality('Normal');
    setIsAddReminderOpen(false);
  };

  const handleOpenEditReminder = (rem) => {
    setEditingReminderObj(rem);
    setEditRemTitle(rem.title);
    setEditRemDesc(rem.description || '');
    setEditRemDeadline(rem.deadline);
    setEditRemCriticality(rem.criticality);
  };

  const handleSaveEditReminder = (e) => {
    e.preventDefault();
    if (!editingReminderObj) return;
    onEditReminder(client.id, editingReminderObj.id, { title: editRemTitle, description: editRemDesc, deadline: editRemDeadline, criticality: editRemCriticality });
    setEditingReminderObj(null);
  };

  // Checklist toggle
  const handleToggleChecklist = (moduleName, index) => {
    const currentList = client.checklists?.[moduleName] || [];
    const updated = currentList.map((item, i) => i === index ? { ...item, checked: !item.checked } : item);
    onUpdateChecklist(client.id, moduleName, updated);
  };

  const toggleAccordion = (modName) => {
    setExpandedModules(prev => ({ ...prev, [modName]: !prev[modName] }));
  };

  // Stage Timeline calculation
  const allStages = stages || ['Novo', 'Kickoff', 'Configuração', 'Treinamento', 'Finalizado'];
  const currentStageIndex = allStages.indexOf(client.stage);
  const progressPct = allStages.length > 1
    ? Math.round((currentStageIndex / (allStages.length - 1)) * 100)
    : 0;
  const fillWidth = allStages.length > 1
    ? `${(currentStageIndex / (allStages.length - 1)) * 96}%`
    : '0%';

  // Status dot
  const getStatusDot = () => {
    if (client.criticality === 'Crítico') return 'status-dot-red';
    if (client.criticality === 'Atenção') return 'status-dot-yellow';
    return 'status-dot-green';
  };

  const stageStatusLabel = client.stage === 'Finalizado' ? 'Onboarding Concluído' : 'Onboarding Ativo';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%' }}>

      {/* ── DETAIL HEADER ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button className="btn-icon" onClick={() => onNavigate('clientes')} title="Voltar">
            <ArrowLeft size={16} />
          </button>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <h2 className="view-title" style={{ margin: 0 }}>{client.name}</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                <span className={`status-dot ${getStatusDot()}`}></span>
                {stageStatusLabel}
              </span>
              {client.lastUpdated && (
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  <Clock size={11} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                  Atualizado em {client.lastUpdated.date} às {client.lastUpdated.time} por {client.lastUpdated.user}
                </span>
              )}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
          <button className="btn-secondary" onClick={() => setIsEditingInfo(v => !v)}>
            <Edit2 size={14} />
            <span>Editar</span>
          </button>
        </div>
      </div>

      {/* ── ONBOARDING STAGE TIMELINE ── */}
      <div className="timeline-tracker-container">
        <div className="timeline-tracker-header">
          <span className="timeline-tracker-title">Progresso do Onboarding</span>
          <span className="timeline-tracker-progress-val">Progresso: {progressPct}%</span>
        </div>
        <div className="timeline-tracker-steps">
          <div className="timeline-tracker-line-bg" />
          <div className="timeline-tracker-line-fill" style={{ width: fillWidth }} />
          {allStages.map((stage, idx) => {
            const isCompleted = idx < currentStageIndex;
            const isActive = idx === currentStageIndex;
            let circleClass = 'timeline-tracker-circle';
            if (isCompleted) circleClass += ' timeline-tracker-circle-completed';
            if (isActive) circleClass += ' timeline-tracker-circle-active';
            return (
              <div key={stage} className={`timeline-tracker-step-node ${isActive ? 'timeline-tracker-step-node-active' : ''}`}>
                <div className={circleClass}>
                  {isCompleted && <Check size={12} color="#000" />}
                  {isActive && <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--green-primary)' }} />}
                </div>
                <span className="timeline-tracker-step-label">{stage}</span>
              </div>
            );
          })}
        </div>
        <div style={{ height: '4px', backgroundColor: 'var(--border-color)', borderRadius: '2px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: fillWidth, backgroundColor: 'var(--green-primary)', borderRadius: '2px', transition: 'width 300ms ease-in-out' }} />
        </div>
      </div>

      <div className="detail-layout">
        {/* ── LEFT PANEL ── */}
        <div className="detail-main">

          {/* Section 1: Info */}
          <div className="detail-card">
            <div className="section-header">
              <h3 className="section-title">Informações Gerais</h3>
              {!isEditingInfo ? (
                <button className="btn-secondary" onClick={() => setIsEditingInfo(true)}><Edit2 size={12} /><span>Editar</span></button>
              ) : (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn-secondary" onClick={() => setIsEditingInfo(false)}>Cancelar</button>
                  <button className="btn-primary" onClick={handleSaveInfo} style={{ padding: '8px 14px', fontSize: '13px' }}><Save size={12} /><span>Salvar</span></button>
                </div>
              )}
            </div>
            {!isEditingInfo ? (
              <div className="detail-row">
                {[['Nome', client.name], ['CNPJ', client.cnpj || '—'], ['Telefone', client.phone || '—'], ['WhatsApp', client.whatsapp || '—'], ['E-mail', client.email || '—'], ['Data de Entrada', client.entryDate || '—'], ['Responsável', client.responsible || '—']].map(([label, val]) => (
                  <div className="detail-item" key={label}>
                    <span className="detail-item-label">{label}</span>
                    <span className="detail-item-value">{val}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="form-grid">
                {[['Nome', name, setName, 'text'], ['CNPJ', cnpj, setCnpj, 'text'], ['Telefone', phone, setPhone, 'text'], ['WhatsApp', whatsapp, setWhatsapp, 'text'], ['E-mail', email, setEmail, 'email'], ['Responsável', responsible, setResponsible, 'text']].map(([label, val, setter, type]) => (
                  <div className="form-group" key={label}>
                    <label className="form-label">{label}</label>
                    <input type={type} className="form-input" value={val} onChange={e => setter(e.target.value)} />
                  </div>
                ))}
                <div className="form-group">
                  <label className="form-label">Data de Entrada</label>
                  <CustomDatePicker value={entryDate} onChange={setEntryDate} />
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Plano e Módulos */}
          <div className="detail-card">
            <div className="section-header">
              <h3 className="section-title">Plano e Módulos Ativos</h3>
              {!isEditingPlan ? (
                <button className="btn-secondary" onClick={() => setIsEditingPlan(true)}><Edit2 size={12} /><span>Editar</span></button>
              ) : (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn-secondary" onClick={() => setIsEditingPlan(false)}>Cancelar</button>
                  <button className="btn-primary" onClick={handleSavePlan} style={{ padding: '8px 14px', fontSize: '13px' }}><Save size={12} /><span>Salvar</span></button>
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
                    {client.activeModules?.length > 0 ? client.activeModules.map(mod => (
                      <span key={mod} className="module-pill" style={{ padding: '4px 10px', fontSize: '12px' }}>{mod}</span>
                    )) : <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Nenhum módulo ativo.</span>}
                  </div>
                </div>
              </div>
            ) : (
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Selecionar Plano</label>
                  <select className="form-select" value={plan} onChange={e => setPlan(e.target.value)}>
                    {plans.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                  </select>
                </div>
                <div className="form-group full-width">
                  <label className="form-label">Módulos Ativos</label>
                  <div className="checkbox-group">
                    {modules.map(mod => (
                      <label key={mod.id} className="checkbox-label">
                        <input type="checkbox" checked={activeModules.includes(mod.name)} onChange={() => handleToggleModule(mod.name)} />
                        <span>{mod.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Module Checklists Accordions */}
          {client.activeModules && client.activeModules.length > 0 && (
            <div className="detail-card">
              <div className="section-header" style={{ marginBottom: '16px' }}>
                <h3 className="section-title">Checklists de Implantação</h3>
              </div>
              <div className="accordion-container">
                {client.activeModules.map(modName => {
                  const checklist = client.checklists?.[modName] || [];
                  const done = checklist.filter(i => i.checked).length;
                  const total = checklist.length;
                  const isExpanded = expandedModules[modName];
                  const allDone = total > 0 && done === total;

                  return (
                    <div key={modName} className="accordion-item">
                      <div className="accordion-trigger" onClick={() => toggleAccordion(modName)}>
                        <div className="accordion-header-left">
                          {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                          <span className="accordion-title">{modName}</span>
                        </div>
                        <div className="accordion-header-right">
                          <span className="accordion-progress-text">{done}/{total} concluídos</span>
                          {allDone && <Check size={14} style={{ color: 'var(--green-primary)' }} />}
                        </div>
                      </div>
                      {isExpanded && (
                        <div className="accordion-content">
                          {checklist.length === 0 ? (
                            <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Nenhum item de checklist configurado.</span>
                          ) : (
                            checklist.map((item, idx) => (
                              <label key={idx} className="checklist-item">
                                <input
                                  type="checkbox"
                                  checked={item.checked}
                                  onChange={() => handleToggleChecklist(modName, idx)}
                                />
                                <span style={{ textDecoration: item.checked ? 'line-through' : 'none', color: item.checked ? 'var(--text-secondary)' : 'var(--text-primary)' }}>
                                  {item.label}
                                </span>
                              </label>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Section 4: Ofertas de Interesse */}
          <div className="detail-card">
            <div className="section-header">
              <h3 className="section-title">Ofertas de Interesse</h3>
              <button className={`btn-secondary ${isEditingOffers ? 'active' : ''}`} onClick={() => setIsEditingOffers(!isEditingOffers)}>
                <Edit2 size={12} /><span>{isEditingOffers ? 'Parar' : 'Gerenciar'}</span>
              </button>
            </div>
            {isEditingOffers && (
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', backgroundColor: 'var(--bg-primary)', padding: '16px', borderRadius: 'var(--radius)', border: '1px solid var(--border-color)' }}>
                <div className="form-group" style={{ flex: 2 }}>
                  <label className="form-label">Adicionar Oferta</label>
                  <select className="form-select" value={selectedNewOffer} onChange={e => setSelectedNewOffer(e.target.value)}>
                    <option value="">Selecione...</option>
                    {availableOffers.map(off => <option key={off.id} value={off.name}>{off.name}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Status</label>
                  <select className="form-select" value={newOfferStatus} onChange={e => setNewOfferStatus(e.target.value)}>
                    <option value="Interessado">Interessado</option>
                    <option value="Em análise">Em análise</option>
                    <option value="Convertido">Convertido</option>
                  </select>
                </div>
                <button className="btn-primary" onClick={handleAddOffer} style={{ height: '42px', padding: '0 16px' }}><Plus size={16} /><span>Adicionar</span></button>
              </div>
            )}
            <div className="offers-list">
              {interestOffers.length === 0 ? (
                <div className="empty-state" style={{ padding: '24px' }}><span className="empty-state-icon">💡</span><p>Nenhuma oferta vinculada.</p></div>
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
                          <select className="offer-status-select" value={off.status} onChange={e => handleOfferStatusChange(off.id, e.target.value)}>
                            <option value="Interessado">Interessado</option>
                            <option value="Em análise">Em análise</option>
                            <option value="Convertido">Convertido</option>
                          </select>
                          <button className="btn-danger-icon" onClick={() => handleRemoveOffer(off.id)}><Trash2 size={14} /></button>
                        </>
                      ) : (
                        <span className={`badge ${off.status === 'Convertido' ? 'badge-estavel' : off.status === 'Em análise' ? 'badge-atencao' : 'badge-critico'}`} style={{ fontSize: '10px' }}>{off.status}</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Section 5: Links Rápidos */}
          <div className="detail-card">
            <div className="section-header">
              <h3 className="section-title">Links Rápidos</h3>
              <button className="btn-secondary" onClick={() => setIsEditingLinks(true)}><Edit2 size={12} /><span>Editar</span></button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
              {client.quickLinks?.crm && (
                <a href={client.quickLinks.crm} target="_blank" rel="noreferrer" className="btn-secondary"><Link size={14} style={{ color: 'var(--green-primary)' }} /><span>CRM Active</span></a>
              )}
              {client.quickLinks?.discordIntegration && (
                <a href={client.quickLinks.discordIntegration} target="_blank" rel="noreferrer" className="btn-secondary"><Link size={14} style={{ color: '#5865F2' }} /><span>Discord Demandas</span></a>
              )}
              {(client.quickLinks?.discordSupport || []).map(ds => (
                <a key={ds.id} href={ds.url} target="_blank" rel="noreferrer" className="btn-secondary"><Link size={14} style={{ color: '#5865F2' }} /><span>{ds.label}</span></a>
              ))}
              {client.quickLinks?.site && hasOfficialApiModule && (
                <a href={client.quickLinks.site} target="_blank" rel="noreferrer" className="btn-secondary"><ExternalLink size={14} style={{ color: 'var(--green-primary)' }} /><span>Site do Cliente</span></a>
              )}
              {client.quickLinks?.deskPlatformUrl && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <a href={client.quickLinks.deskPlatformUrl} target="_blank" rel="noreferrer" className="btn-secondary"><ExternalLink size={14} /><span>Plataforma Atendimento</span></a>
                  {client.quickLinks.deskPlatformEmail && <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>({client.quickLinks.deskPlatformEmail})</span>}
                </div>
              )}
              {!client.quickLinks?.crm && !client.quickLinks?.discordIntegration && !(client.quickLinks?.discordSupport?.length) && !client.quickLinks?.site && !client.quickLinks?.deskPlatformUrl && (
                <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Nenhum link rápido cadastrado.</span>
              )}
            </div>
          </div>

          {/* Section 6: Activity History */}
          <div className="detail-card">
            <div className="section-header">
              <h3 className="section-title">Histórico de Atividades</h3>
            </div>
            {(!client.activityHistory || client.activityHistory.length === 0) ? (
              <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Nenhuma atividade registrada.</span>
            ) : (
              <>
                <div className="vertical-timeline">
                  {(showFullHistory ? client.activityHistory : client.activityHistory.slice(0, 3)).map((entry, idx) => (
                    <div key={idx} className="vertical-timeline-node">
                      <div className="vertical-timeline-dot" />
                      <div className="vertical-timeline-avatar">{entry.avatar}</div>
                      <div className="vertical-timeline-details">
                        <span className={entry.isObservation ? 'observation-text' : ''}>{entry.action}</span>
                        <span className="vertical-timeline-meta">{entry.name} · {entry.date}</span>
                      </div>
                    </div>
                  ))}
                </div>
                {client.activityHistory.length > 3 && (
                  <button className="btn-secondary" style={{ marginTop: '12px', fontSize: '12px' }} onClick={() => setShowFullHistory(v => !v)}>
                    {showFullHistory ? 'Ocultar log' : `Ver log completo (${client.activityHistory.length} entradas)`}
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* ── RIGHT SIDEBAR ── */}
        <div className="detail-sidebar">

          {/* SLA Contact Cycle */}
          <div className="detail-card">
            <div className="section-header">
              <h3 className="section-title">Ciclo SLA & Criticidade</h3>
              {!isEditingSla ? (
                <button className="btn-secondary" onClick={() => setIsEditingSla(true)}><Edit2 size={12} /></button>
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
                  <span className={`badge ${client.criticality === 'Crítico' ? 'badge-critico' : client.criticality === 'Atenção' ? 'badge-atencao' : 'badge-estavel'}`} style={{ fontSize: '11px', padding: '4px 10px' }}>{client.criticality}</span>
                  <span className="cycle-badge">
                    {client.criticality === 'Crítico' && 'Contato diário'}
                    {client.criticality === 'Atenção' && 'Dia sim, dia não'}
                    {client.criticality === 'Estável' && 'A cada 3 dias'}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-item-label">Próximo Contato Operacional</span>
                  <strong style={{ fontSize: '15px', color: 'var(--text-primary)', marginTop: '4px' }}>{client.nextContactDate || 'Não definido'}</strong>
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                  {client.criticalityJustification || 'Sem justificativa.'}
                </p>
                <button className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => onRegisterContact(client.id, 'Contato de ciclo registrado via detalhe')}>
                  <CheckSquare size={14} /><span>Registrar Contato Feito</span>
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
                  <textarea className="form-textarea" rows="3" value={justification} onChange={e => setJustification(e.target.value)} placeholder="Descreva o motivo..." />
                </div>
              </div>
            )}
          </div>

          {/* Last Contact History */}
          <div className="detail-card">
            <div className="section-header">
              <h3 className="section-title">Último Contato</h3>
            </div>
            {(!client.lastContacts || client.lastContacts.length === 0) ? (
              <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Nenhum contato registrado.</span>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {(showFullContacts ? client.lastContacts : client.lastContacts.slice(0, 1)).map((lc, idx) => (
                  <div key={idx} className="last-contact-block">
                    <span style={{ fontSize: '11px', color: 'var(--green-primary)', fontWeight: '600' }}>{lc.date}</span>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>{lc.obs}</p>
                  </div>
                ))}
                {client.lastContacts.length > 1 && (
                  <button className="btn-secondary" style={{ fontSize: '11px', padding: '4px 8px' }} onClick={() => setShowFullContacts(v => !v)}>
                    {showFullContacts ? 'Ocultar' : `Ver histórico completo (${client.lastContacts.length})`}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Reminders List */}
          <div className="detail-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 className="section-title">Lembretes ({client.reminders?.length || 0})</h3>
              <button className="btn-secondary" style={{ padding: '4px 8px', fontSize: '11px' }} onClick={() => setIsAddReminderOpen(true)}>
                <Plus size={12} /><span>Adicionar</span>
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
              {(!client.reminders || client.reminders.length === 0) ? (
                <div style={{ color: 'var(--text-secondary)', fontSize: '13px', textAlign: 'center', padding: '12px 0' }}>Nenhum lembrete cadastrado.</div>
              ) : (
                client.reminders.map(rem => {
                  const status = getDateStatus(rem.deadline, todayStr);
                  let dateClass = 'date-future';
                  if (status === 'overdue') dateClass = 'date-overdue';
                  else if (status === 'today') dateClass = 'date-today';
                  const badgeClass = rem.criticality === 'Urgente' ? 'badge-critico' : rem.criticality === 'Normal' ? 'badge-atencao' : 'badge-estavel';
                  return (
                    <div key={rem.id} style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius)', padding: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                        <span style={{ fontSize: '13px', fontWeight: '600' }}>{rem.title}</span>
                        <span className={`badge ${badgeClass}`} style={{ fontSize: '8px', padding: '1px 4px' }}>{rem.criticality}</span>
                      </div>
                      {rem.description && <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{rem.description}</p>}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                        <span className={dateClass} style={{ fontSize: '11px' }}>Prazo: {rem.deadline}</span>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button className="btn-icon" style={{ width: '22px', height: '22px' }} onClick={() => handleOpenEditReminder(rem)}><Edit2 size={10} /></button>
                          <button className="btn-danger-icon" style={{ width: '22px', height: '22px' }} onClick={() => onRemoveReminder(client.id, rem.id)}><Trash2 size={10} /></button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Observations */}
          <div className="detail-card">
            <div className="section-header">
              <h3 className="section-title">Observações Gerais</h3>
              {!isEditingObs ? (
                <button className="btn-secondary" onClick={() => setIsEditingObs(true)}><Edit2 size={12} /></button>
              ) : (
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button className="btn-icon" onClick={() => setIsEditingObs(false)}><X size={12} /></button>
                  <button className="btn-icon" onClick={handleSaveObs} style={{ color: 'var(--green-primary)' }}><Save size={12} /></button>
                </div>
              )}
            </div>
            {!isEditingObs ? (
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>{client.observations || 'Nenhuma observação cadastrada.'}</p>
            ) : (
              <textarea className="form-textarea" rows="6" value={observations} onChange={e => setObservations(e.target.value)} placeholder="Observações de onboarding..." />
            )}
          </div>
        </div>
      </div>

      {/* ── MODALS ── */}

      {/* Links Modal */}
      {isEditingLinks && (
        <div className="modal-overlay" onClick={() => setIsEditingLinks(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '650px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Editar Links Rápidos</h3>
              <button className="btn-icon" onClick={() => setIsEditingLinks(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleSaveLinks}>
              <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                <div className="form-grid">
                  {[['CRM Active (URL)', linkCrm, setLinkCrm, 'url'], ['Discord Demandas (URL)', linkDiscordInt, setLinkDiscordInt, 'url'], ['Site do Cliente (URL)', linkSite, setLinkSite, 'url'], ['Plataforma Atendimento (URL)', linkDeskUrl, setLinkDeskUrl, 'url'], ['Plataforma Atendimento (E-mail)', linkDeskEmail, setLinkDeskEmail, 'email']].map(([label, val, setter, type]) => (
                    <div className="form-group" key={label}>
                      <label className="form-label">{label}</label>
                      <input type={type} className="form-input" value={val} onChange={e => setter(e.target.value)} placeholder="https://..." />
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span className="form-label" style={{ fontWeight: '600' }}>Canais de Suporte Discord</span>
                    <button type="button" className="btn-secondary" style={{ padding: '4px 8px', fontSize: '11px' }} onClick={() => setLinkDiscordSupportList(prev => [...prev, { id: `ds_${Date.now()}`, label: 'Novo Canal', url: '' }])}>
                      <PlusCircle size={12} /><span>Adicionar</span>
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {linkDiscordSupportList.length === 0 ? (
                      <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Nenhum canal adicionado.</span>
                    ) : (
                      linkDiscordSupportList.map(item => (
                        <div key={item.id} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                          <input type="text" className="form-input" style={{ flex: 1, fontSize: '12px' }} value={item.label} onChange={e => setLinkDiscordSupportList(prev => prev.map(i => i.id === item.id ? { ...i, label: e.target.value } : i))} />
                          <input type="url" className="form-input" style={{ flex: 2, fontSize: '12px' }} value={item.url} onChange={e => setLinkDiscordSupportList(prev => prev.map(i => i.id === item.id ? { ...i, url: e.target.value } : i))} />
                          <button type="button" className="btn-danger-icon" onClick={() => setLinkDiscordSupportList(prev => prev.filter(i => i.id !== item.id))}><Trash2 size={14} /></button>
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

      {/* Add Reminder Modal */}
      {isAddReminderOpen && (
        <div className="modal-overlay" onClick={() => setIsAddReminderOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Novo Lembrete — {client.name}</h3>
              <button className="btn-icon" onClick={() => setIsAddReminderOpen(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleAddReminderSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Título *</label>
                  <input type="text" className="form-input" value={remTitle} onChange={e => setRemTitle(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Descrição</label>
                  <textarea className="form-textarea" value={remDesc} onChange={e => setRemDesc(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Prazo *</label>
                  <CustomDatePicker value={remDeadline} onChange={setRemDeadline} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Criticidade</label>
                  <select className="form-select" value={remCriticality} onChange={e => setRemCriticality(e.target.value)}>
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

      {/* Edit Reminder Modal */}
      {editingReminderObj && (
        <div className="modal-overlay" onClick={() => setEditingReminderObj(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Editar Lembrete</h3>
              <button className="btn-icon" onClick={() => setEditingReminderObj(null)}><X size={16} /></button>
            </div>
            <form onSubmit={handleSaveEditReminder}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Título *</label>
                  <input type="text" className="form-input" value={editRemTitle} onChange={e => setEditRemTitle(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Descrição</label>
                  <textarea className="form-textarea" value={editRemDesc} onChange={e => setEditRemDesc(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Prazo *</label>
                  <CustomDatePicker value={editRemDeadline} onChange={setEditRemDeadline} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Criticidade</label>
                  <select className="form-select" value={editRemCriticality} onChange={e => setEditRemCriticality(e.target.value)}>
                    <option value="Baixo">Baixo</option>
                    <option value="Normal">Normal</option>
                    <option value="Urgente">Urgente</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setEditingReminderObj(null)}>Cancelar</button>
                <button type="submit" className="btn-primary">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
