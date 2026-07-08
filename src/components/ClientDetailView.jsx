import React, { useState, useEffect } from 'react';
import { 
  Edit2, Save, X, Plus, Trash2, ArrowLeft, Heart, 
  ExternalLink, Link, CheckSquare, Check,
  ChevronDown, ChevronRight, Clock, Building, User, Info, CheckCircle
} from 'lucide-react';
import { toBRDate, toISODate, getDateStatus } from '../utils';
import CustomDatePicker from './CustomDatePicker';
import PremiumSelect from './PremiumSelect';

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

  // Section Editing states
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [isEditingPlan, setIsEditingPlan] = useState(false);
  const [isEditingOffers, setIsEditingOffers] = useState(false);
  const [isEditingSla, setIsEditingSla] = useState(false);
  const [isEditingObs, setIsEditingObs] = useState(false);
  const [isEditingLinks, setIsEditingLinks] = useState(false);
  const [isAddReminderOpen, setIsAddReminderOpen] = useState(false);
  const [editingReminderObj, setEditingReminderObj] = useState(null);

  // Actions Dropdown Menu state
  const [showActionsDropdown, setShowActionsDropdown] = useState(false);
  const [showMoveKanbanPopup, setShowMoveKanbanPopup] = useState(false);
  const [showCriticalityPopup, setShowCriticalityPopup] = useState(false);

  // Accordions states
  const [expandedModules, setExpandedModules] = useState({
    'WhatsApp Business': true,
    'Implantação e Setup': true
  });
  const [showFullHistory, setShowFullHistory] = useState(false);

  // Info Form States
  const [name, setName] = useState(client.name);
  const [phone, setPhone] = useState(client.phone);
  const [whatsapp, setWhatsapp] = useState(client.whatsapp);
  const [email, setEmail] = useState(client.email);
  const [cnpj, setCnpj] = useState(client.cnpj);
  const [entryDate, setEntryDate] = useState(client.entryDate);
  const [responsible, setResponsible] = useState(client.responsible);

  // Plan Form States
  const [plan, setPlan] = useState(client.plan);
  const [activeModules, setActiveModules] = useState(client.activeModules || []);

  // Offers States
  const [interestOffers, setInterestOffers] = useState(client.interestOffers || []);
  const [selectedNewOffer, setSelectedNewOffer] = useState('');
  const [newOfferStatus, setNewOfferStatus] = useState('Interessado');

  // SLA Form States
  const [criticality, setCriticality] = useState(client.criticality);
  const [justification, setJustification] = useState(client.criticalityJustification || '');

  // Obs Form State
  const [observations, setObservations] = useState(client.observations || '');

  // Dynamic Links List state
  const [quickLinksList, setQuickLinksList] = useState([]);

  // Initialize quickLinksList from client data
  useEffect(() => {
    const list = [];
    const ql = client.quickLinks || {};
    if (ql.crm) list.push({ id: 'crm', label: 'Acesso ao CRM', url: ql.crm, isDefault: true });
    if (ql.discordIntegration) list.push({ id: 'discord', label: 'Comunidade Discord', url: ql.discordIntegration, isDefault: true });
    if (ql.site) list.push({ id: 'site', label: 'Documentação API', url: ql.site, isDefault: true });
    if (ql.deskPlatformUrl) list.push({ id: 'deskUrl', label: 'Plataforma Jetsales', url: ql.deskPlatformUrl, isDefault: true });
    
    if (ql.discordSupport && Array.isArray(ql.discordSupport)) {
      ql.discordSupport.forEach(item => {
        list.push({ id: item.id || `custom_${Math.random()}`, label: item.label, url: item.url });
      });
    }
    setQuickLinksList(list);
  }, [client]);

  // Add Reminder Form States
  const [remTitle, setRemTitle] = useState('');
  const [remDesc, setRemDesc] = useState('');
  const [remDeadline, setRemDeadline] = useState('');
  const [remCriticality, setRemCriticality] = useState('Normal');

  // Edit Reminder Form States
  const [editRemTitle, setEditRemTitle] = useState('');
  const [editRemDesc, setEditRemDesc] = useState('');
  const [editRemDeadline, setEditRemDeadline] = useState('');
  const [editRemCriticality, setEditRemCriticality] = useState('Normal');

  const hasOfficialApiModule = client.activeModules?.includes('API Oficial');

  // ---- Handlers ----

  const handleSaveInfo = () => {
    onUpdateClient(client.id, { 
      name, phone, whatsapp, email, cnpj, entryDate, responsible,
      lastUpdated: { 
        date: todayStr, 
        time: new Date().toLocaleTimeString('pt-BR', {hour:'2-digit',minute:'2-digit'}), 
        user: responsible || client.responsible 
      }
    });
    setIsEditingInfo(false);
  };

  const handleSavePlan = () => {
    onUpdateClient(client.id, { plan, activeModules });
    setIsEditingPlan(false);
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
    if (e) e.preventDefault();
    
    // Convert unified list back to client scheme
    const newLinks = {
      crm: '',
      discordIntegration: '',
      site: '',
      deskPlatformUrl: '',
      discordSupport: []
    };

    quickLinksList.forEach(item => {
      if (item.id === 'crm') newLinks.crm = item.url;
      else if (item.id === 'discord') newLinks.discordIntegration = item.url;
      else if (item.id === 'site') newLinks.site = item.url;
      else if (item.id === 'deskUrl') newLinks.deskPlatformUrl = item.url;
      else {
        if (item.label.trim() && item.url.trim()) {
          newLinks.discordSupport.push({ id: item.id, label: item.label, url: item.url });
        }
      }
    });

    onUpdateClient(client.id, { quickLinks: newLinks });
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

  const handleMarkAllConcluded = (moduleName) => {
    const currentList = client.checklists?.[moduleName] || [];
    const updated = currentList.map(item => ({ ...item, checked: true }));
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
    ? `${(currentStageIndex / (allStages.length - 1)) * 100}%`
    : '0%';

  const getStatusColor = () => {
    if (client.criticality === 'Crítico') return '#EF4444';
    if (client.criticality === 'Atenção') return '#F59E0B';
    return '#10B981';
  };

  const stageStatusLabel = client.stage === 'Finalizado' ? 'ONBOARDING CONCLUÍDO' : 'ONBOARDING ATIVO';

  const getColabInitials = (name) => {
    if (!name) return 'GA';
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', padding: '0 8px' }}>
      
      {/* ── BREADCRUMBS ── */}
      <div style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-secondary)', letterSpacing: '1px' }}>
        CLIENTES &gt; DETALHE DO CLIENTE
      </div>

      {/* ── DETAIL HEADER (JETSALES STYLE) ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '48px', height: '48px', backgroundColor: '#1B2E1C', border: '1px solid rgba(101, 255, 75, 0.2)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--green-primary)' }}>
            <Building size={24} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#fff', margin: 0 }}>{client.name}</h2>
              <span 
                className="badge" 
                style={{ 
                  backgroundColor: '#1E351F', 
                  color: 'var(--green-primary)', 
                  border: '1px solid rgba(101, 255, 75, 0.3)', 
                  fontSize: '9px', 
                  fontWeight: '700', 
                  padding: '3px 8px', 
                  borderRadius: '12px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <span className="status-dot" style={{ width: '6px', height: '6px', margin: 0, backgroundColor: getStatusColor() }}></span>
                {stageStatusLabel}
              </span>
            </div>
            {client.lastUpdated && (
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Última atualização: {client.lastUpdated.date}, {client.lastUpdated.time} por {client.lastUpdated.user}
              </span>
            )}
          </div>
        </div>

        {/* Action Button Dropdown */}
        <div style={{ display: 'flex', gap: '10px', position: 'relative' }}>
          <button 
            className="btn-secondary" 
            style={{ 
              backgroundColor: 'transparent', 
              border: '1px solid var(--border-color)', 
              color: '#fff', 
              fontWeight: '600',
              padding: '8px 16px',
              borderRadius: '6px',
              fontSize: '13px',
              gap: '6px',
              cursor: 'pointer'
            }}
            onClick={() => setIsEditingInfo(v => !v)}
          >
            <Edit2 size={13} />
            <span>Editar</span>
          </button>
          
          <button 
            className="btn-primary" 
            style={{ 
              backgroundColor: 'var(--green-primary)', 
              color: '#000', 
              fontWeight: '700',
              padding: '8px 20px',
              borderRadius: '6px',
              fontSize: '13px',
              gap: '6px',
              boxShadow: 'none',
              cursor: 'pointer'
            }}
            onClick={() => setShowActionsDropdown(!showActionsDropdown)}
          >
            <span>Ações</span>
            <ChevronDown size={14} strokeWidth={3} />
          </button>

          {showActionsDropdown && (
            <>
              <div 
                style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1010 }}
                onClick={() => {
                  setShowActionsDropdown(false);
                  setShowMoveKanbanPopup(false);
                  setShowCriticalityPopup(false);
                }}
              />
              <div 
                className="premium-action-popup"
                style={{
                  position: 'absolute',
                  top: '42px',
                  right: 0,
                  width: '220px',
                  backgroundColor: '#161616',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: '12px',
                  boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
                  zIndex: 1020,
                  padding: '8px 0',
                  display: 'flex',
                  flexDirection: 'column',
                  animation: 'premiumDropdownOpen 200ms cubic-bezier(0.16, 1, 0.3, 1)',
                  transformOrigin: 'top right'
                }}
              >
                <div 
                  onClick={() => { setIsEditingInfo(true); setShowActionsDropdown(false); }}
                  style={{ padding: '10px 16px', fontSize: '13px', color: '#FFF', cursor: 'pointer', fontWeight: '600' }}
                  className="sidebar-popup-item"
                >
                  ✏️ Editar informações
                </div>
                
                <div 
                  onClick={() => { setShowMoveKanbanPopup(!showMoveKanbanPopup); setShowCriticalityPopup(false); }}
                  style={{ padding: '10px 16px', fontSize: '13px', color: '#FFF', cursor: 'pointer', fontWeight: '600', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  className="sidebar-popup-item"
                >
                  <span>📋 Mover no Kanban</span>
                  <ChevronRight size={12} />
                </div>

                {showMoveKanbanPopup && (
                  <div 
                    style={{
                      padding: '8px 12px',
                      backgroundColor: '#1C1C1C',
                      borderBottom: '1px solid #282828',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px'
                    }}
                  >
                    <PremiumSelect
                      value={client.stage}
                      onChange={(val) => {
                        onUpdateClient(client.id, { stage: val });
                        setShowMoveKanbanPopup(false);
                        setShowActionsDropdown(false);
                      }}
                      options={allStages.map(s => ({ value: s, label: s }))}
                      placeholder="Mudar etapa..."
                    />
                  </div>
                )}

                <div 
                  onClick={() => { setIsAddReminderOpen(true); setShowActionsDropdown(false); }}
                  style={{ padding: '10px 16px', fontSize: '13px', color: '#FFF', cursor: 'pointer', fontWeight: '600' }}
                  className="sidebar-popup-item"
                >
                  🔔 Adicionar lembrete
                </div>

                <div 
                  onClick={() => { setShowCriticalityPopup(!showCriticalityPopup); setShowMoveKanbanPopup(false); }}
                  style={{ padding: '10px 16px', fontSize: '13px', color: '#FFF', cursor: 'pointer', fontWeight: '600', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  className="sidebar-popup-item"
                >
                  <span>⚠️ Escalar criticidade</span>
                  <ChevronRight size={12} />
                </div>

                {showCriticalityPopup && (
                  <div 
                    style={{
                      padding: '8px 12px',
                      backgroundColor: '#1C1C1C',
                      display: 'flex',
                      gap: '4px',
                      justifyContent: 'center'
                    }}
                  >
                    {['Crítico', 'Atenção', 'Estável'].map(crit => (
                      <button
                        key={crit}
                        onClick={() => {
                          onUpdateClient(client.id, { criticality: crit });
                          setShowCriticalityPopup(false);
                          setShowActionsDropdown(false);
                        }}
                        style={{
                          flex: 1,
                          fontSize: '10px',
                          padding: '6px 4px',
                          border: '1px solid #333',
                          backgroundColor: client.criticality === crit ? 'var(--green-primary)' : 'transparent',
                          color: client.criticality === crit ? '#000' : '#FFF',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontWeight: '700'
                        }}
                      >
                        {crit === 'Crítico' ? '🔴' : crit === 'Atenção' ? '🟡' : '🟢'}
                      </button>
                    ))}
                  </div>
                )}

                <div 
                  onClick={() => {
                    if (window.confirm("Deseja arquivar este cliente? (Mover para Finalizado)")) {
                      onUpdateClient(client.id, { stage: 'Finalizado' });
                      setShowActionsDropdown(false);
                    }
                  }}
                  style={{ padding: '10px 16px', fontSize: '13px', color: '#FF5D5D', cursor: 'pointer', fontWeight: '600' }}
                  className="sidebar-popup-item"
                >
                  🗑️ Arquivar cliente
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── TWO COLUMN LAYOUT ── */}
      <div className="detail-layout" style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '20px', alignItems: 'start' }}>
        
        {/* ── LEFT COLUMN: INFO & QUICK LINKS ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Card: Informações do Cliente */}
          <div className="detail-card" style={{ backgroundColor: '#161616', border: '1px solid #252525', borderRadius: '8px', padding: '20px' }}>
            <h3 style={{ fontSize: '12px', fontWeight: '800', color: '#666', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '16px' }}>
              INFORMAÇÕES DO CLIENTE
            </h3>

            {!isEditingInfo ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', borderBottom: '1px solid #2E2E2E', paddingBottom: '10px' }}>
                  <span style={{ fontSize: '12px', color: '#666', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Responsável</span>
                  <span style={{ fontSize: '15px', fontWeight: '500', color: '#fff' }}>{client.responsible || '—'}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', borderBottom: '1px solid #2E2E2E', paddingBottom: '10px' }}>
                  <span style={{ fontSize: '12px', color: '#666', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Telefone</span>
                  <span style={{ fontSize: '15px', fontWeight: '500', color: '#fff' }}>{client.phone || '—'}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', borderBottom: '1px solid #2E2E2E', paddingBottom: '10px' }}>
                  <span style={{ fontSize: '12px', color: '#666', textTransform: 'uppercase', letterSpacing: '0.08em' }}>E-mail</span>
                  <span style={{ fontSize: '15px', fontWeight: '500', color: '#fff' }}>{client.email || '—'}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', borderBottom: '1px solid #2E2E2E', paddingBottom: '10px' }}>
                  <span style={{ fontSize: '12px', color: '#666', textTransform: 'uppercase', letterSpacing: '0.08em' }}>CNPJ</span>
                  <span style={{ fontSize: '15px', fontWeight: '500', color: '#fff' }}>{client.cnpj || '—'}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', borderBottom: '1px solid #2E2E2E', paddingBottom: '10px' }}>
                  <span style={{ fontSize: '12px', color: '#666', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Plano Contratado</span>
                  <div>
                    <span 
                      style={{ 
                        fontSize: '11px', 
                        color: 'var(--green-primary)', 
                        backgroundColor: '#1E351F', 
                        border: '1px solid rgba(101, 255, 75, 0.3)', 
                        padding: '3px 8px', 
                        borderRadius: '4px',
                        fontWeight: '700',
                        display: 'inline-block'
                      }}
                    >
                      {client.plan}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', borderBottom: '1px solid #2E2E2E', paddingBottom: '10px' }}>
                  <span style={{ fontSize: '12px', color: '#666', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Data de Entrada</span>
                  <span style={{ fontSize: '15px', fontWeight: '500', color: '#fff' }}>{client.entryDate || '—'}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <span style={{ fontSize: '12px', color: '#666', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Colaborador Atribuído</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#2E2E2E', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '700', color: 'var(--green-primary)' }}>
                      {getColabInitials(client.responsible)}
                    </div>
                    <span style={{ fontSize: '13px', fontWeight: '600', color: '#fff' }}>{client.responsible || 'Especialista'}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Responsável</label>
                  <input type="text" className="form-input" value={responsible} onChange={e => setResponsible(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Telefone</label>
                  <input type="text" className="form-input" value={phone} onChange={e => setPhone(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">E-mail</label>
                  <input type="email" className="form-input" value={email} onChange={e => setEmail(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">CNPJ</label>
                  <input type="text" className="form-input" value={cnpj} onChange={e => setCnpj(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Data de Entrada</label>
                  <CustomDatePicker value={entryDate} onChange={setEntryDate} />
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                  <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setIsEditingInfo(false)}>Cancelar</button>
                  <button className="btn-primary" style={{ flex: 1 }} onClick={handleSaveInfo}>Salvar</button>
                </div>
              </div>
            )}
          </div>

          {/* Card: Links Rápidos */}
          <div className="detail-card" style={{ backgroundColor: '#161616', border: '1px solid #252525', borderRadius: '8px', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '12px', fontWeight: '800', color: '#666', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>
                LINKS RÁPIDOS
              </h3>
              <button 
                className="btn-secondary" 
                style={{ padding: '4px 8px', fontSize: '11px', border: '1px solid #333', cursor: 'pointer' }}
                onClick={() => setIsEditingLinks(true)}
              >
                Configurar
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {quickLinksList.map((linkItem, idx) => {
                if (!linkItem.url) return null;
                return (
                  <a 
                    key={linkItem.id || idx} 
                    href={linkItem.url} 
                    target="_blank" 
                    rel="noreferrer" 
                    style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      padding: '10px 12px', 
                      backgroundColor: '#1B1B1B', 
                      border: '1px solid #2A2A2A', 
                      borderRadius: '6px', 
                      color: '#fff', 
                      textDecoration: 'none', 
                      fontSize: '12px',
                      transition: 'border-color 150ms ease'
                    }}
                    className="client-link-card-hover"
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Link size={14} style={{ color: linkItem.id === 'discord' ? '#5865F2' : 'var(--green-primary)' }} />
                      <span>{linkItem.label}</span>
                    </div>
                    <ExternalLink size={11} style={{ color: '#666' }} />
                  </a>
                );
              })}
              
              {quickLinksList.filter(l => l.url).length === 0 && (
                <span style={{ color: 'var(--text-secondary)', fontSize: '12px', textAlign: 'center', padding: '8px 0' }}>
                  Nenhum link configurado.
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN: TIMELINE, MODULE ACCORDIONS, HISTORY ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Section: Linha do tempo de onboarding */}
          <div className="timeline-tracker-container" style={{ backgroundColor: '#161616', border: '1px solid #252525', borderRadius: '8px', padding: '20px' }}>
            <div className="timeline-tracker-header" style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="timeline-tracker-title" style={{ fontSize: '12px', color: '#666', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: '800' }}>
                LINHA DO TEMPO DE ONBOARDING
              </span>
              <span className="timeline-tracker-progress-val" style={{ color: 'var(--green-primary)', fontWeight: '800', fontSize: '13px' }}>
                PROGRESSO: {progressPct}%
              </span>
            </div>
            
            <div className="timeline-tracker-steps" style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', alignItems: 'flex-start', padding: '0 10px' }}>
              <div className="timeline-tracker-line-bg" style={{ position: 'absolute', left: '20px', right: '20px', top: '16px', height: '2px', backgroundColor: '#252525', zIndex: 1 }} />
              <div className="timeline-tracker-line-fill" style={{ position: 'absolute', left: '20px', top: '16px', height: '2px', width: `calc(${fillWidth} - 40px)`, backgroundColor: 'var(--green-primary)', zIndex: 2, transition: 'width 300ms ease-in-out' }} />
              
              {allStages.map((stage, idx) => {
                const isCompleted = idx < currentStageIndex;
                const isActive = idx === currentStageIndex;
                
                let stepStateText = 'PENDENTE';
                if (isCompleted) stepStateText = 'CONCLUÍDO';
                if (isActive) stepStateText = 'EM CURSO';

                return (
                  <div key={stage} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', zIndex: 3, width: '60px' }}>
                    <div 
                      className={isActive ? 'timeline-tracker-circle-active' : ''}
                      style={{ 
                        width: '32px', 
                        height: '32px', 
                        borderRadius: '50%', 
                        backgroundColor: isCompleted ? 'var(--green-primary)' : '#161616', 
                        border: isCompleted 
                          ? '2px solid var(--green-primary)' 
                          : isActive 
                            ? '2px solid var(--green-primary)' 
                            : '2px solid #333', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        transition: 'all 200ms ease'
                      }}
                    >
                      {isCompleted ? (
                        <Check size={16} strokeWidth={4} color="#000" />
                      ) : isActive ? (
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--green-primary)' }} />
                      ) : (
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#444' }} />
                      )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', textAlign: 'center' }}>
                      <span style={{ fontSize: '11px', fontWeight: '700', color: isActive ? 'var(--green-primary)' : '#fff' }}>{stage}</span>
                      <span style={{ fontSize: '9px', fontWeight: '700', color: isCompleted ? 'var(--green-primary)' : isActive ? 'var(--green-primary)' : '#666', letterSpacing: '0.5px' }}>
                        {stepStateText}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Linear progress bar below steps */}
            <div style={{ width: '100%', height: '4px', backgroundColor: '#222', borderRadius: '2px', marginTop: '20px', overflow: 'hidden' }}>
              <div style={{ width: `${progressPct}%`, height: '100%', backgroundColor: 'var(--green-primary)', transition: 'width 300ms ease' }} />
            </div>
          </div>

          {/* Section: Módulos Contratados (Checklist Accordion) */}
          <div className="detail-card" style={{ backgroundColor: '#161616', border: '1px solid #252525', borderRadius: '8px', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '12px', fontWeight: '800', color: '#666', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>
                MÓDULOS CONTRATADOS
              </h3>
            </div>

            <div className="accordion-container" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {client.activeModules && client.activeModules.map(modName => {
                const checklist = client.checklists?.[modName] || [];
                const done = checklist.filter(i => i.checked).length;
                const total = checklist.length;
                const isExpanded = expandedModules[modName];
                const pct = total > 0 ? Math.round((done / total) * 100) : 0;

                return (
                  <div key={modName} style={{ border: '1px solid #252525', borderRadius: '6px', backgroundColor: '#161616', overflow: 'hidden', position: 'relative' }}>
                    
                    {/* Header */}
                    <div 
                      style={{ 
                        padding: '12px 16px', 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        cursor: 'pointer', 
                        backgroundColor: '#1C1C1C',
                        position: 'relative'
                      }}
                      onClick={() => toggleAccordion(modName)}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '13px', fontWeight: '700', color: '#fff' }}>{modName}</span>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }} onClick={e => e.stopPropagation()}>
                        {checklist.length > 0 && (
                          <span style={{ fontSize: '11px', color: '#888', fontWeight: '600' }}>({done}/{total})</span>
                        )}
                        <button 
                          type="button"
                          className="btn-secondary"
                          style={{ padding: '2px 8px', fontSize: '10px', border: '1px solid #333', cursor: 'pointer' }}
                          onClick={() => handleMarkAllConcluded(modName)}
                        >
                          Marcar todos
                        </button>
                        <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }} onClick={() => toggleAccordion(modName)}>
                          {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </div>
                      </div>

                      {/* Header progress line */}
                      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '2px', backgroundColor: '#282828' }}>
                        <div style={{ width: `${pct}%`, height: '100%', backgroundColor: 'var(--green-primary)', transition: 'width 200ms ease' }} />
                      </div>
                    </div>

                    {isExpanded && (
                      <div style={{ padding: '14px 16px', backgroundColor: '#111', display: 'flex', flexDirection: 'column', gap: '10px', borderTop: '1px solid #252525' }}>
                        {checklist.length === 0 ? (
                          <span style={{ color: '#555', fontSize: '12px' }}>Nenhuma tarefa pendente neste checklist.</span>
                        ) : (
                          checklist.map((item, idx) => (
                            <div 
                              key={idx} 
                              style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                              onClick={() => handleToggleChecklist(modName, idx)}
                            >
                              <div 
                                className={`custom-checkbox-circle ${item.checked ? 'checked' : ''}`}
                                style={{ width: '18px', height: '18px', flexShrink: 0 }}
                              >
                                {item.checked && <Check size={10} strokeWidth={4} color="#000" />}
                              </div>
                              <span style={{ 
                                textDecoration: item.checked ? 'line-through' : 'none', 
                                color: item.checked ? '#555' : '#ccc',
                                opacity: item.checked ? 0.6 : 1,
                                transition: 'all 200ms ease',
                                fontSize: '13px'
                              }}>
                                {item.label}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section: Histórico de Atividades */}
          <div className="detail-card" style={{ backgroundColor: '#161616', border: '1px solid #252525', borderRadius: '8px', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '12px', fontWeight: '800', color: '#666', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>
                HISTÓRICO DE ATIVIDADES
              </h3>
              <button 
                className="btn-secondary" 
                style={{ padding: '4px 8px', fontSize: '11px', border: 'none', background: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
                onClick={() => setShowFullHistory(!showFullHistory)}
              >
                {showFullHistory ? 'Ver últimas 3' : 'Ver histórico completo'}
              </button>
            </div>

            {(!client.activityHistory || client.activityHistory.length === 0) ? (
              <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Nenhuma atividade registrada.</span>
            ) : (
              <div className="vertical-timeline" style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {(showFullHistory ? client.activityHistory : client.activityHistory.slice(0, 3)).map((entry, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '12px', position: 'relative' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#252525', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '700', color: 'var(--green-primary)', flexShrink: 0 }}>
                      {entry.avatar}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                      <div style={{ fontSize: '13px', color: '#fff' }}>
                        <strong>{entry.name}</strong>{' '}
                        {entry.isObservation ? (
                          <span style={{ color: '#aaa' }}>adicionou uma observação</span>
                        ) : (
                          <span style={{ color: 'var(--green-primary)' }}>{entry.action}</span>
                        )}
                      </div>
                      <span style={{ fontSize: '11px', color: '#666' }}>{entry.date}</span>

                      {entry.isObservation && (
                        <div style={{ marginTop: '6px', padding: '10px 14px', backgroundColor: '#222', border: '1px solid #333', borderRadius: '6px', fontSize: '12px', color: '#aaa', fontStyle: 'italic', lineHeight: '1.4' }}>
                          "{entry.action.replace('Observação do cliente: ', '')}"
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Lembretes / Observações details card */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            
            {/* Criticality & SLA card */}
            <div 
              className="detail-card" 
              style={{ 
                backgroundColor: '#1F1F1F', // highlighted background
                border: '1px solid #2E2E2E', 
                borderLeft: client.criticality === 'Crítico'
                  ? '4px solid #EF4444'
                  : client.criticality === 'Atenção'
                    ? '4px solid #F59E0B'
                    : '4px solid #10B981',
                borderRadius: '8px', 
                padding: '20px' 
              }}
            >
              <div className="section-header" style={{ marginBottom: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '12px', fontWeight: '800', color: '#666', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>Ciclo SLA & Criticidade</h3>
                <button className="btn-secondary" style={{ padding: '4px 8px', fontSize: '11px', border: '1px solid #333', cursor: 'pointer' }} onClick={() => setIsEditingSla(true)}>
                  <Edit2 size={11} />
                </button>
              </div>
              
              {!isEditingSla ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className={`badge ${client.criticality === 'Crítico' ? 'badge-critico' : client.criticality === 'Atenção' ? 'badge-atencao' : 'badge-estavel'}`}>{client.criticality}</span>
                    <span style={{ fontSize: '11px', color: '#aaa', fontWeight: '600' }}>
                      {client.criticality === 'Crítico' ? 'Contato diário' : client.criticality === 'Atenção' ? 'Dia sim, dia não' : 'A cada 3 dias'}
                    </span>
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                    Próximo contato: <strong style={{ color: '#fff' }}>{client.nextContactDate}</strong>
                  </div>
                  <p style={{ fontSize: '12px', color: '#aaa', margin: 0 }}>{client.criticalityJustification || 'Sem justificativa.'}</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <PremiumSelect
                    value={criticality}
                    onChange={setCriticality}
                    options={[
                      { value: 'Estável', label: '🟢 Estável' },
                      { value: 'Atenção', label: '🟡 Atenção' },
                      { value: 'Crítico', label: '🔴 Crítico' }
                    ]}
                    placeholder="Mudar criticidade"
                  />
                  <input type="text" className="form-input" placeholder="Justificativa..." value={justification} onChange={e => setJustification(e.target.value)} />
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn-secondary" style={{ flex: 1, padding: '6px' }} onClick={() => setIsEditingSla(false)}>Cancelar</button>
                    <button className="btn-primary" style={{ flex: 1, padding: '6px' }} onClick={handleSaveSla}>Salvar</button>
                  </div>
                </div>
              )}
            </div>

            {/* Obs Card */}
            <div 
              className="detail-card" 
              style={{ 
                backgroundColor: '#141414', // observations background
                border: '1px solid #2E2E2E', 
                borderRadius: '8px', 
                padding: '20px',
                minHeight: '120px'
              }}
            >
              <div className="section-header" style={{ marginBottom: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '12px', fontWeight: '800', color: '#666', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>Observações</h3>
                <button className="btn-secondary" style={{ padding: '4px 8px', fontSize: '11px', border: '1px solid #333', cursor: 'pointer' }} onClick={() => setIsEditingObs(true)}>
                  <Edit2 size={11} />
                </button>
              </div>
              
              {!isEditingObs ? (
                <p style={{ fontSize: '12.5px', color: '#aaa', margin: 0, whiteSpace: 'pre-wrap', lineHeight: '1.4' }}>{client.observations || 'Nenhuma observação.'}</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <textarea className="form-textarea" rows={3} value={observations} onChange={e => setObservations(e.target.value)} />
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn-secondary" style={{ flex: 1, padding: '6px' }} onClick={() => setIsEditingObs(false)}>Cancelar</button>
                    <button className="btn-primary" style={{ flex: 1, padding: '6px' }} onClick={handleSaveObs}>Salvar</button>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Dynamic Links Configurator Modal */}
      {isEditingLinks && (
        <div className="modal-overlay" onClick={() => setIsEditingLinks(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '650px', backgroundColor: '#161616', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="modal-header">
              <h3 className="modal-title">Editar Links Rápidos</h3>
              <button className="btn-icon" onClick={() => setIsEditingLinks(false)}><X size={16} /></button>
            </div>
            <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              <span className="form-label" style={{ marginBottom: '12px', display: 'block', color: '#888' }}>
                Configure os links padrão ou adicione links dinâmicos e personalizados para o cliente.
              </span>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {quickLinksList.map((item, index) => (
                  <div key={item.id} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={item.label}
                      disabled={item.isDefault}
                      onChange={e => {
                        const newList = [...quickLinksList];
                        newList[index].label = e.target.value;
                        setQuickLinksList(newList);
                      }}
                      placeholder="Nome do Link"
                      style={{ flex: 1, height: '36px' }}
                    />
                    <input 
                      type="url" 
                      className="form-input" 
                      value={item.url}
                      onChange={e => {
                        const newList = [...quickLinksList];
                        newList[index].url = e.target.value;
                        setQuickLinksList(newList);
                      }}
                      placeholder="https://..."
                      style={{ flex: 2, height: '36px' }}
                    />
                    <button 
                      type="button" 
                      className="btn-danger-icon"
                      style={{ height: '36px', width: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      onClick={() => {
                        setQuickLinksList(quickLinksList.filter(l => l.id !== item.id));
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                
                <button 
                  type="button" 
                  className="btn-secondary" 
                  onClick={() => {
                    setQuickLinksList([...quickLinksList, { id: `custom_${Date.now()}`, label: 'Novo Link', url: '' }]);
                  }}
                  style={{ marginTop: '8px', width: '100%', gap: '6px', height: '36px', cursor: 'pointer' }}
                >
                  <Plus size={14} />
                  <span>Adicionar link</span>
                </button>
              </div>
            </div>
            
            <div className="modal-footer">
              <button type="button" className="btn-secondary" onClick={() => setIsEditingLinks(false)}>Cancelar</button>
              <button type="button" className="btn-primary" onClick={() => handleSaveLinks()}>Salvar Links</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Reminder Modal */}
      {isAddReminderOpen && (
        <div className="modal-overlay" onClick={() => setIsAddReminderOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Novo Lembrete</h3>
              <button className="btn-icon" onClick={() => setIsAddReminderOpen(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleAddReminderSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Título do Lembrete</label>
                  <input type="text" className="form-input" value={remTitle} onChange={e => setRemTitle(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Descrição</label>
                  <textarea className="form-textarea" rows="2" value={remDesc} onChange={e => setRemDesc(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Criticidade</label>
                  <PremiumSelect
                    value={remCriticality}
                    onChange={setRemCriticality}
                    options={[
                      { value: 'Baixo', label: 'Baixo' },
                      { value: 'Normal', label: 'Normal' },
                      { value: 'Urgente', label: 'Urgente' }
                    ]}
                    placeholder="Selecione a criticidade"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Prazo</label>
                  <CustomDatePicker value={remDeadline} onChange={setRemDeadline} required />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setIsAddReminderOpen(false)}>Cancelar</button>
                <button type="submit" className="btn-primary">Criar Lembrete</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
