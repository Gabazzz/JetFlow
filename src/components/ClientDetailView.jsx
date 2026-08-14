import React, { useState } from 'react';
import {
  Edit2, Save, X, Plus, Trash2, ArrowLeft, Heart,
  ExternalLink, Link, CheckSquare, PlusCircle, Check,
  ChevronDown, ChevronRight, Clock, Building, User, Info, CheckCircle,
  AlertTriangle, AlertCircle, MessageSquarePlus, LifeBuoy, ArrowRight, RotateCcw,
  Hash, Wifi, Users as UsersIcon
} from 'lucide-react';
import { toBRDate, toISODate, getDateStatus, parseBRDate, getClientPhase, PHASE_META, calculateHealthScore, getHealthTier, calculateNextContactDate, createDefaultAdditionalSteps, getTodayBR } from '../utils';
import CustomDatePicker from './CustomDatePicker';
import CustomSelect from './CustomSelect';
import { moduleChecklistsTemplate } from '../data/data';

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
  onUpdateAdditionalSteps,
  onCompleteTask,
  tickets,
  onAddTicket,
  onUpdateTicketStatus,
  onUpdateTicketLink,
  onNavigate
}) {
  const todayStr = getTodayBR();

  // Section Editing states
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [isEditingPlan, setIsEditingPlan] = useState(false);
  const [isEditingOffers, setIsEditingOffers] = useState(false);
  const [isEditingSla, setIsEditingSla] = useState(false);
  const [isEditingObs, setIsEditingObs] = useState(false);
  const [isEditingLinks, setIsEditingLinks] = useState(false);
  const [isAddReminderOpen, setIsAddReminderOpen] = useState(false);
  const [editingReminderObj, setEditingReminderObj] = useState(null);
  const [isRegisterContactOpen, setIsRegisterContactOpen] = useState(false);
  const [registerContactNote, setRegisterContactNote] = useState('');
  const [isNewTicketOpen, setIsNewTicketOpen] = useState(false);
  const [newTicketSubject, setNewTicketSubject] = useState('');
  const [newTicketDescription, setNewTicketDescription] = useState('');
  const [newTicketPriority, setNewTicketPriority] = useState('Normal');
  const [newTicketDiscordUrl, setNewTicketDiscordUrl] = useState('');
  const [editingTicketLinkId, setEditingTicketLinkId] = useState(null);
  const [editingTicketLinkValue, setEditingTicketLinkValue] = useState('');

  const [isConcludeActionOpen, setIsConcludeActionOpen] = useState(false);
  const [nextActionText, setNextActionText] = useState('');
  const [nextActionDate, setNextActionDate] = useState('');

  const [newLinkLabel, setNewLinkLabel] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');

  const TICKET_PRIORITY_BADGE = {
    'Urgente': 'badge-critico',
    'Alta': 'badge-critico',
    'Normal': 'badge-atencao',
    'Baixa': 'badge-estavel'
  };
  const TICKET_NEXT = {
    'Aberto': { label: 'Iniciar atendimento', status: 'Em Andamento' },
    'Em Andamento': { label: 'Resolver', status: 'Resolvido' },
    'Resolvido': { label: 'Reabrir', status: 'Aberto' }
  };

  // Accordions states
  const [expandedModules, setExpandedModules] = useState({
    'WhatsApp Business': true,
    'Implantação e Setup': true
  });
  const [showDoneModules, setShowDoneModules] = useState({});
  const [showFullHistory, setShowFullHistory] = useState(false);
  const [showFullContacts, setShowFullContacts] = useState(false);

  // Info Form States
  const [name, setName] = useState(client.name);
  const [phone, setPhone] = useState(client.phone);
  const [whatsapp, setWhatsapp] = useState(client.whatsapp);
  const [email, setEmail] = useState(client.email);
  const [cnpj, setCnpj] = useState(client.cnpj);
  const [entryDate, setEntryDate] = useState(client.entryDate);
  const [responsible, setResponsible] = useState(client.responsible);
  const [contractType, setContractType] = useState(client.contractType || '');
  const [connections, setConnections] = useState(client.connections ?? '');
  const [usersCount, setUsersCount] = useState(client.users ?? '');
  const [usersEstimated, setUsersEstimated] = useState(client.usersEstimated || false);

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

  // Links Form States
  const [linkCrm, setLinkCrm] = useState(client.quickLinks?.crm || '');
  const [linkDiscordInt, setLinkDiscordInt] = useState(client.quickLinks?.discordIntegration || '');
  const [linkSite, setLinkSite] = useState(client.quickLinks?.site || '');
  const [linkDeskUrl, setLinkDeskUrl] = useState(client.quickLinks?.deskPlatformUrl || '');
  const [linkDeskEmail, setLinkDeskEmail] = useState(client.quickLinks?.deskPlatformEmail || '');
  const [linkDiscordSupportList, setLinkDiscordSupportList] = useState(client.quickLinks?.discordSupport || []);
  const [linkDealId, setLinkDealId] = useState(client.quickLinks?.dealId || '');

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
      contractType,
      connections: connections === '' ? null : Number(connections),
      users: usersCount === '' ? null : Number(usersCount),
      usersEstimated,
      lastUpdated: {
        date: todayStr,
        time: new Date().toLocaleTimeString('pt-BR', {hour:'2-digit',minute:'2-digit'}),
        user: responsible || client.responsible
      }
    });
    setIsEditingInfo(false);
  };

  const handleSavePlan = () => {
    // Newly added modules need their checklist (and baseline) seeded from the
    // template — otherwise getChecklistDiff finds zero items and the module
    // never shows up in the meeting note.
    const existingChecklists = client.checklists || {};
    const existingBaseline = client.checklistBaseline || {};
    const checklists = { ...existingChecklists };
    const checklistBaseline = { ...existingBaseline };
    activeModules.forEach(modName => {
      if (!checklists[modName] && moduleChecklistsTemplate[modName]) {
        checklists[modName] = JSON.parse(JSON.stringify(moduleChecklistsTemplate[modName]));
        checklistBaseline[modName] = JSON.parse(JSON.stringify(moduleChecklistsTemplate[modName]));
      }
    });

    onUpdateClient(client.id, { plan, activeModules, checklists, checklistBaseline });
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
      quickLinks: { dealId: linkDealId, crm: linkCrm, discordIntegration: linkDiscordInt, discordSupport: linkDiscordSupportList, site: linkSite, deskPlatformUrl: linkDeskUrl, deskPlatformEmail: linkDeskEmail }
    });
    setIsEditingLinks(false);
  };

  const handleAddCustomLink = () => {
    if (!newLinkLabel.trim() || !newLinkUrl.trim()) return;
    setLinkDiscordSupportList(prev => [...prev, { id: `link_${Date.now()}`, label: newLinkLabel.trim(), url: newLinkUrl.trim() }]);
    setNewLinkLabel('');
    setNewLinkUrl('');
  };

  const handleRemoveCustomLink = (id) => {
    setLinkDiscordSupportList(prev => prev.filter(l => l.id !== id));
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

  // Stage Timeline calculation (matching Reunião -> Importação -> Configuração -> API -> IA -> Treinamento -> Finalizado)
  const allStages = stages || ['Novo', 'Kickoff', 'Configuração', 'Treinamento', 'Finalizado'];
  const currentStageIndex = allStages.indexOf(client.stage);
  
  const progressPct = allStages.length > 1
    ? Math.round((currentStageIndex / (allStages.length - 1)) * 100)
    : 0;

  const fillWidth = allStages.length > 1
    ? `${(currentStageIndex / (allStages.length - 1)) * 100}%`
    : '0%';

  const getStatusDot = () => {
    if (client.criticality === 'Crítico') return 'status-dot-red';
    if (client.criticality === 'Atenção') return 'status-dot-yellow';
    return 'status-dot-green';
  };

  const criticalityMeta = {
    'Crítico': { color: '#EF4444', Icon: AlertTriangle, badgeClass: 'badge-critico' },
    'Atenção': { color: '#F59E0B', Icon: AlertCircle, badgeClass: 'badge-atencao' },
    'Estável': { color: '#10B981', Icon: CheckCircle, badgeClass: 'badge-estavel' }
  }[client.criticality] || { color: '#10B981', Icon: CheckCircle, badgeClass: 'badge-estavel' };

  const clientTickets = tickets || [];
  const phase = getClientPhase(client, clientTickets, todayStr);
  const phaseMeta = PHASE_META[phase];
  const healthScore = calculateHealthScore(client, clientTickets, todayStr);
  const healthTier = getHealthTier(healthScore);

  // Get initials for Colaborador Atribuído avatar
  const getColabInitials = (name) => {
    if (!name) return 'GA';
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', padding: '0 8px' }}>
      
      {/* ── BREADCRUMBS ── */}
      <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-secondary)', letterSpacing: '1px' }}>
        CLIENTES &gt; DETALHE DO CLIENTE
      </div>

      {/* ── DETAIL HEADER (JETSALES STYLE) ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {/* Green square building icon */}
          <div style={{ width: '48px', height: '48px', backgroundColor: '#1B2E1C', border: '1px solid rgba(101, 255, 75, 0.2)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--green-primary)' }}>
            <Building size={24} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#fff', margin: 0 }}>{client.name}</h2>
              <span
                className="badge"
                style={{
                  backgroundColor: phaseMeta.bg,
                  color: phaseMeta.color,
                  border: `1px solid ${phaseMeta.border}`,
                  fontSize: '9px',
                  fontWeight: '700',
                  padding: '3px 8px',
                  borderRadius: '12px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <span className={`status-dot ${getStatusDot()}`} style={{ width: '6px', height: '6px', margin: 0 }}></span>
                {phase.toUpperCase()}
              </span>
              <span
                title={`Health Score: ${healthScore}/100`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '10px',
                  fontWeight: '700',
                  color: healthTier.color,
                  padding: '3px 8px',
                  borderRadius: '12px',
                  border: `1px solid ${healthTier.color}55`,
                  backgroundColor: `${healthTier.color}18`
                }}
              >
                <Heart size={11} fill={healthTier.color} stroke="none" />
                {healthScore}/100 · {healthTier.label}
              </span>
            </div>
            {client.lastUpdated && (
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Última atualização: {client.lastUpdated.date}, {client.lastUpdated.time} por {client.lastUpdated.user}
              </span>
            )}
          </div>
        </div>

        {/* Buttons on the right */}
        <div style={{ display: 'flex', gap: '10px' }}>
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
              gap: '6px'
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
              boxShadow: 'none'
            }}
            onClick={() => setIsRegisterContactOpen(true)}
          >
            <MessageSquarePlus size={14} strokeWidth={2.5} />
            <span>Registrar Contato</span>
          </button>
        </div>
      </div>

      {/* ── PRÓXIMA AÇÃO ── */}
      {client.nextAction && (() => {
        const status = getDateStatus(client.nextContactDate, todayStr);
        const statusClass = status === 'overdue' ? 'date-overdue' : status === 'today' ? 'date-today' : 'date-future';
        const accentColor = status === 'overdue' ? '#EF4444' : status === 'today' ? '#F59E0B' : 'var(--green-primary)';

        let deadlineLabel = `Prazo: ${client.nextContactDate}`;
        if (status === 'overdue' && client.nextContactDate) {
          const days = Math.round((parseBRDate(todayStr).getTime() - parseBRDate(client.nextContactDate).getTime()) / (1000 * 60 * 60 * 24));
          deadlineLabel = `Atrasado há ${days} dia${days > 1 ? 's' : ''} (${client.nextContactDate})`;
        } else if (status === 'today') {
          deadlineLabel = `Vence hoje (${client.nextContactDate})`;
        }

        return (
          <div style={{ backgroundColor: '#161616', border: `1px solid ${accentColor}`, borderRadius: '8px', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Clock size={18} style={{ color: accentColor, flexShrink: 0 }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ fontSize: '10px', fontWeight: '700', color: '#666', textTransform: 'uppercase', letterSpacing: '1px' }}>Próxima Ação</span>
                <span style={{ fontSize: '14px', fontWeight: '700', color: '#fff' }}>{client.nextAction}</span>
                <span className={statusClass} style={{ fontSize: '12px' }}>{deadlineLabel}</span>
              </div>
            </div>
            <button
              className="btn-primary"
              style={{ backgroundColor: 'var(--green-primary)', color: '#000', fontWeight: '700', padding: '8px 16px', borderRadius: '6px', fontSize: '13px', gap: '6px' }}
              onClick={() => {
                setNextActionText('');
                setNextActionDate(calculateNextContactDate(client.criticality, todayStr));
                setIsConcludeActionOpen(true);
              }}
            >
              <CheckSquare size={13} />
              <span>Concluir</span>
            </button>
          </div>
        );
      })()}

      {/* ── TWO COLUMN LAYOUT ── */}
      <div className="detail-layout" style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '20px', alignItems: 'start' }}>
        
        {/* ── LEFT COLUMN: INFO & QUICK LINKS ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Card: Informações do Cliente */}
          <div className={`detail-card ${isEditingInfo ? 'edit-mode-active' : ''}`} style={{ backgroundColor: '#161616', border: '1px solid #252525', borderRadius: '8px', padding: '20px' }}>
            <h3 style={{ fontSize: '10px', fontWeight: '700', color: '#555', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>
              INFORMAÇÕES DO CLIENTE
            </h3>

            {!isEditingInfo ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '10px', color: '#666', textTransform: 'uppercase' }}>Responsável</span>
                  <span style={{ fontSize: '14px', fontWeight: '700', color: '#fff' }}>{client.responsible || '—'}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '10px', color: '#666', textTransform: 'uppercase' }}>Telefone</span>
                  <span style={{ fontSize: '14px', fontWeight: '700', color: '#fff' }}>{client.phone || '—'}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '10px', color: '#666', textTransform: 'uppercase' }}>E-mail</span>
                  <span style={{ fontSize: '14px', fontWeight: '700', color: '#fff' }}>{client.email || '—'}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '10px', color: '#666', textTransform: 'uppercase' }}>CNPJ</span>
                  <span style={{ fontSize: '14px', fontWeight: '700', color: '#fff' }}>{client.cnpj || '—'}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <span style={{ fontSize: '10px', color: '#666', textTransform: 'uppercase' }}>Plano Contratado</span>
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
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '10px', color: '#666', textTransform: 'uppercase' }}>Data de Entrada</span>
                  <span style={{ fontSize: '14px', fontWeight: '700', color: '#fff' }}>{client.entryDate || '—'}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '10px', color: '#666', textTransform: 'uppercase' }}>Tipo de Contrato</span>
                  <span style={{ fontSize: '14px', fontWeight: '700', color: '#fff' }}>{client.contractType || '—'}</span>
                </div>
                <div style={{ display: 'flex', gap: '20px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontSize: '10px', color: '#666', textTransform: 'uppercase' }}>Conexões</span>
                    <span style={{ fontSize: '14px', fontWeight: '700', color: '#fff' }}>{client.connections ?? '—'}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontSize: '10px', color: '#666', textTransform: 'uppercase' }}>Usuários</span>
                    <span style={{ fontSize: '14px', fontWeight: '700', color: '#fff' }}>
                      {client.users ?? '—'}{client.users != null && client.usersEstimated ? ' (estimado)' : ''}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <span style={{ fontSize: '10px', color: '#666', textTransform: 'uppercase' }}>Colaborador Atribuído</span>
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
                <div className="form-group">
                  <label className="form-label">Tipo de Contrato</label>
                  <CustomSelect value={contractType} onChange={setContractType} options={['Mensal', 'Trimestral', 'Semestral', 'Anual']} placeholder="Selecionar..." />
                </div>
                <div className="form-group">
                  <label className="form-label">Conexões</label>
                  <input type="number" min="0" className="form-input" value={connections} onChange={e => setConnections(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Usuários</label>
                  <input type="number" min="0" className="form-input" value={usersCount} onChange={e => setUsersCount(e.target.value)} />
                  <label className="checkbox-label" style={{ marginTop: '6px' }}>
                    <input type="checkbox" className="premium-check" checked={usersEstimated} onChange={e => setUsersEstimated(e.target.checked)} />
                    <span>Quantidade estimada</span>
                  </label>
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
              <h3 style={{ fontSize: '10px', fontWeight: '700', color: '#555', textTransform: 'uppercase', letterSpacing: '1px', margin: 0 }}>
                LINKS RÁPIDOS
              </h3>
              <button 
                className="btn-secondary" 
                style={{ padding: '4px 8px', fontSize: '11px', border: '1px solid #333' }}
                onClick={() => setIsEditingLinks(true)}
              >
                Configurar
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {client.quickLinks?.dealId && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', backgroundColor: '#1B1B1B', border: '1px solid #2A2A2A', borderRadius: '6px', fontSize: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Hash size={14} style={{ color: '#888' }} />
                    <span style={{ color: '#fff' }}>Deal ID</span>
                  </div>
                  <span style={{ color: '#aaa', fontWeight: '700' }}>{client.quickLinks.dealId}</span>
                </div>
              )}
              {client.quickLinks?.crm && (
                <a href={client.quickLinks.crm} target="_blank" rel="noreferrer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', backgroundColor: '#1B1B1B', border: '1px solid #2A2A2A', borderRadius: '6px', color: '#fff', textDecoration: 'none', fontSize: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Link size={14} style={{ color: 'var(--green-primary)' }} />
                    <span>Acesso ao CRM</span>
                  </div>
                  <ExternalLink size={11} style={{ color: '#666' }} />
                </a>
              )}
              {client.quickLinks?.discordIntegration && (
                <a href={client.quickLinks.discordIntegration} target="_blank" rel="noreferrer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', backgroundColor: '#1B1B1B', border: '1px solid #2A2A2A', borderRadius: '6px', color: '#fff', textDecoration: 'none', fontSize: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Link size={14} style={{ color: '#5865F2' }} />
                    <span>Comunidade Discord</span>
                  </div>
                  <ExternalLink size={11} style={{ color: '#666' }} />
                </a>
              )}
              {(client.quickLinks?.discordSupport || []).map(ds => (
                <a key={ds.id} href={ds.url} target="_blank" rel="noreferrer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', backgroundColor: '#1B1B1B', border: '1px solid #2A2A2A', borderRadius: '6px', color: '#fff', textDecoration: 'none', fontSize: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Link size={14} style={{ color: '#5865F2' }} />
                    <span>{ds.label}</span>
                  </div>
                  <ExternalLink size={11} style={{ color: '#666' }} />
                </a>
              ))}
              {client.quickLinks?.site && hasOfficialApiModule && (
                <a href={client.quickLinks.site} target="_blank" rel="noreferrer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', backgroundColor: '#1B1B1B', border: '1px solid #2A2A2A', borderRadius: '6px', color: '#fff', textDecoration: 'none', fontSize: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ExternalLink size={14} style={{ color: 'var(--green-primary)' }} />
                    <span>Documentação API</span>
                  </div>
                  <ExternalLink size={11} style={{ color: '#666' }} />
                </a>
              )}
              {client.quickLinks?.deskPlatformUrl && (
                <a href={client.quickLinks.deskPlatformUrl} target="_blank" rel="noreferrer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', backgroundColor: '#1B1B1B', border: '1px solid #2A2A2A', borderRadius: '6px', color: '#fff', textDecoration: 'none', fontSize: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ExternalLink size={14} style={{ color: '#aaa' }} />
                    <span>Plataforma Jetsales</span>
                  </div>
                  <ExternalLink size={11} style={{ color: '#666' }} />
                </a>
              )}
              
              {!client.quickLinks?.dealId && !client.quickLinks?.crm && !client.quickLinks?.discordIntegration && !(client.quickLinks?.discordSupport?.length) && !client.quickLinks?.site && !client.quickLinks?.deskPlatformUrl && (
                <span style={{ color: 'var(--text-secondary)', fontSize: '12px', textAlign: 'center', padding: '8px 0' }}>Nenhum link configurado.</span>
              )}
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN: TIMELINE, MODULE ACCORDIONS, HISTORY ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Section: Linha do tempo de onboarding */}
          <div className="timeline-tracker-container" style={{ backgroundColor: '#161616', border: '1px solid #252525', borderRadius: '8px', padding: '20px' }}>
            <div className="timeline-tracker-header" style={{ marginBottom: '20px' }}>
              <span className="timeline-tracker-title" style={{ fontSize: '10px', color: '#555', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '700' }}>
                LINHA DO TEMPO DE ONBOARDING
              </span>
              <span className="timeline-tracker-progress-val" style={{ color: 'var(--green-primary)', fontWeight: '700', fontSize: '13px' }}>
                PROGRESSO: {progressPct}%
              </span>
            </div>
            
            <div className="timeline-tracker-steps" style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', alignItems: 'flex-start', padding: '0 10px' }}>
              <div className="timeline-tracker-line-bg" style={{ position: 'absolute', left: '20px', right: '20px', top: '16px', height: '2px', backgroundColor: '#252525', zIndex: 1 }} />
              <div className="timeline-tracker-line-fill" style={{ position: 'absolute', left: '20px', top: '16px', height: '2px', width: `calc(${fillWidth} - 40px)`, backgroundColor: 'var(--green-primary)', zIndex: 2, transition: 'width 300ms ease-in-out' }} />
              
              {allStages.map((stage, idx) => {
                const isCompleted = idx < currentStageIndex;
                const isActive = idx === currentStageIndex;
                const isPending = idx > currentStageIndex;
                
                let stepStateText = 'PENDENTE';
                if (isCompleted) stepStateText = 'CONCLUÍDO';
                if (isActive) stepStateText = 'EM CURSO';

                return (
                  <div key={stage} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', zIndex: 3, width: '60px' }}>
                    <div 
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
                        boxShadow: isActive ? '0 0 8px rgba(101,255,75,0.4)' : 'none'
                      }}
                    >
                      {isCompleted ? (
                        <Check size={16} strokeWidth={3} color="#000" />
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
          </div>

          {/* Section: Módulos Contratados (Checklist Accordion) */}
          <div className={`detail-card ${isEditingPlan ? 'edit-mode-active' : ''}`} style={{ backgroundColor: '#161616', border: '1px solid #252525', borderRadius: '8px', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '10px', fontWeight: '700', color: '#555', textTransform: 'uppercase', letterSpacing: '1px', margin: 0 }}>
                MÓDULOS CONTRATADOS
              </h3>
              {!isEditingPlan && (
                <button className="btn-secondary" style={{ padding: '4px 8px', fontSize: '11px' }} onClick={() => { setPlan(client.plan); setActiveModules(client.activeModules || []); setIsEditingPlan(true); }}>
                  <Edit2 size={11} />
                  <span>Editar</span>
                </button>
              )}
            </div>

            {isEditingPlan ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Plano Contratado</label>
                  <CustomSelect value={plan} onChange={setPlan} options={plans.map(p => ({ value: p.name, label: p.name }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Módulos Ativos</label>
                  <div className="checkbox-group">
                    {modules.map(mod => (
                      <label key={mod.id} className="checkbox-label">
                        <input
                          type="checkbox"
                          className="premium-check"
                          checked={activeModules.includes(mod.name)}
                          onChange={() => handleToggleModule(mod.name)}
                        />
                        <span>{mod.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setIsEditingPlan(false)}>Cancelar</button>
                  <button className="btn-primary" style={{ flex: 1 }} onClick={handleSavePlan}>Salvar</button>
                </div>
              </div>
            ) : (
            <div className="accordion-container" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {client.activeModules && client.activeModules.map(modName => {
                const checklist = client.checklists?.[modName] || [];
                const done = checklist.filter(i => i.checked).length;
                const total = checklist.length;
                const isExpanded = expandedModules[modName];
                const allDone = total > 0 && done === total;

                return (
                  <div key={modName} style={{ border: '1px solid #252525', borderRadius: '6px', backgroundColor: '#161616', overflow: 'hidden' }}>
                    <div 
                      style={{ 
                        padding: '12px 16px', 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        cursor: 'pointer', 
                        backgroundColor: '#1C1C1C' 
                      }}
                      onClick={() => toggleAccordion(modName)}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <input
                          type="checkbox"
                          className="premium-check"
                          checked={allDone}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleMarkAllConcluded(modName);
                          }}
                        />
                        <span style={{ fontSize: '13px', fontWeight: '700', color: '#fff' }}>{modName}</span>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {checklist.length > 0 && (
                          <span style={{ fontSize: '11px', color: '#666' }}>{done}/{total} tarefas</span>
                        )}
                        <button 
                          type="button"
                          className="btn-secondary"
                          style={{ padding: '2px 8px', fontSize: '10px', border: '1px solid #333' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkAllConcluded(modName);
                          }}
                        >
                          Marcar todos
                        </button>
                        {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      </div>
                    </div>

                    {isExpanded && (() => {
                      // A tarefa já concluída não continua sendo apresentada como
                      // "a fazer" — só as pendentes aparecem por padrão; as
                      // concluídas ficam recolhidas atrás de um contador.
                      const indexed = checklist.map((item, idx) => ({ item, idx }));
                      const pendingItems = indexed.filter(x => !x.item.checked);
                      const doneItems = indexed.filter(x => x.item.checked);
                      const showDone = !!showDoneModules[modName];
                      return (
                        <div style={{ padding: '14px 16px', backgroundColor: '#111', display: 'flex', flexDirection: 'column', gap: '10px', borderTop: '1px solid #252525' }}>
                          {checklist.length === 0 ? (
                            <span style={{ color: '#555', fontSize: '12px' }}>Nenhuma tarefa neste checklist.</span>
                          ) : (
                            <>
                              {pendingItems.length === 0 && (
                                <span style={{ color: 'var(--green-primary)', fontSize: '12px', fontWeight: '600' }}>✓ Checklist concluído.</span>
                              )}
                              {pendingItems.map(({ item, idx }) => (
                                <label key={idx} className="checklist-item" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
                                  <input
                                    type="checkbox"
                                    className="premium-check"
                                    checked={item.checked}
                                    onChange={() => handleToggleChecklist(modName, idx)}
                                  />
                                  <span style={{ color: '#ccc' }}>{item.label}</span>
                                </label>
                              ))}
                              {doneItems.length > 0 && (
                                <div style={{ marginTop: pendingItems.length > 0 ? '2px' : 0 }}>
                                  <button
                                    type="button"
                                    onClick={() => setShowDoneModules(prev => ({ ...prev, [modName]: !prev[modName] }))}
                                    style={{ background: 'none', border: 'none', padding: 0, color: '#555', fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                                  >
                                    {showDone ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
                                    <span>{doneItems.length} concluída{doneItems.length > 1 ? 's' : ''}</span>
                                  </button>
                                  {showDone && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px' }}>
                                      {doneItems.map(({ item, idx }) => (
                                        <label key={idx} className="checklist-item" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
                                          <input
                                            type="checkbox"
                                            className="premium-check"
                                            checked={item.checked}
                                            onChange={() => handleToggleChecklist(modName, idx)}
                                          />
                                          <span style={{ textDecoration: 'line-through', color: '#555' }}>{item.label}</span>
                                        </label>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                );
              })}
            </div>
            )}
          </div>

          {/* Section: Etapas Adicionais (Verificação de BM, Conexão com GupShup) */}
          <div className="detail-card" style={{ backgroundColor: '#161616', border: '1px solid #252525', borderRadius: '8px', padding: '20px' }}>
            <h3 style={{ fontSize: '10px', fontWeight: '700', color: '#555', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>
              ETAPAS ADICIONAIS
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {(client.additionalSteps || createDefaultAdditionalSteps()).map(step => (
                <label key={step.id} className="checklist-item" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
                  <input
                    type="checkbox"
                    className="premium-check"
                    checked={step.checked}
                    onChange={() => {
                      const updated = (client.additionalSteps || createDefaultAdditionalSteps()).map(s => s.id === step.id ? { ...s, checked: !s.checked } : s);
                      onUpdateAdditionalSteps(client.id, updated);
                    }}
                  />
                  <span style={{ color: step.checked ? '#555' : '#ccc', textDecoration: step.checked ? 'line-through' : 'none' }}>{step.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Section: Tarefas */}
          {(client.tasks && client.tasks.length > 0) && (
            <div className="detail-card" style={{ backgroundColor: '#161616', border: '1px solid #252525', borderRadius: '8px', padding: '20px' }}>
              <h3 style={{ fontSize: '10px', fontWeight: '700', color: '#555', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>
                TAREFAS ({client.tasks.length})
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {client.tasks.map(task => (
                  <label
                    key={task.id}
                    className="checklist-item"
                    style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', backgroundColor: '#1B1B1B', border: '1px solid #2A2A2A', borderRadius: '6px', cursor: 'pointer' }}
                  >
                    <input
                      type="checkbox"
                      className="premium-check"
                      checked={false}
                      onChange={() => onCompleteTask(client.id, task.id)}
                    />
                    <span style={{ fontSize: '13px', color: '#ccc', flex: 1 }}>{task.text}</span>
                    {task.deadline && <span style={{ fontSize: '11px', color: '#666' }}>{task.deadline}</span>}
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Section: Chamados de Suporte */}
          <div className="detail-card" style={{ backgroundColor: '#161616', border: '1px solid #252525', borderRadius: '8px', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '10px', fontWeight: '700', color: '#555', textTransform: 'uppercase', letterSpacing: '1px', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <LifeBuoy size={12} />
                CHAMADOS DE SUPORTE {tickets && tickets.length > 0 ? `(${tickets.length})` : ''}
              </h3>
              <button className="btn-secondary" style={{ padding: '4px 8px', fontSize: '11px' }} onClick={() => setIsNewTicketOpen(true)}>
                <Plus size={11} />
                <span>Novo</span>
              </button>
            </div>

            {(!tickets || tickets.length === 0) ? (
              <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Nenhum chamado registrado.</span>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {tickets.map(ticket => {
                  const next = TICKET_NEXT[ticket.status];
                  const accent = ticket.status === 'Aberto' ? '#EF4444' : ticket.status === 'Em Andamento' ? '#F59E0B' : '#10B981';
                  const isEditingLink = editingTicketLinkId === ticket.id;
                  return (
                    <div key={ticket.id} style={{ backgroundColor: '#1B1B1B', border: '1px solid #2A2A2A', borderLeft: `3px solid ${accent}`, borderRadius: '6px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                        <span style={{ fontSize: '13px', fontWeight: '700', color: '#fff' }}>{ticket.subject}</span>
                        <span className={`badge ${TICKET_PRIORITY_BADGE[ticket.priority] || 'badge-estavel'}`} style={{ fontSize: '9px', flexShrink: 0 }}>{ticket.priority}</span>
                      </div>
                      {ticket.description && <p style={{ fontSize: '12px', color: '#999', margin: 0 }}>{ticket.description}</p>}

                      {isEditingLink ? (
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <input
                            type="url"
                            className="form-input"
                            style={{ flex: 1, fontSize: '12px', height: '30px' }}
                            autoFocus
                            placeholder="https://discord.com/channels/..."
                            value={editingTicketLinkValue}
                            onChange={e => setEditingTicketLinkValue(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') { onUpdateTicketLink(ticket.id, editingTicketLinkValue.trim()); setEditingTicketLinkId(null); } if (e.key === 'Escape') setEditingTicketLinkId(null); }}
                          />
                          <button className="btn-icon" style={{ color: 'var(--green-primary)' }} onClick={() => { onUpdateTicketLink(ticket.id, editingTicketLinkValue.trim()); setEditingTicketLinkId(null); }}><Check size={14} /></button>
                          <button className="btn-icon" onClick={() => setEditingTicketLinkId(null)}><X size={14} /></button>
                        </div>
                      ) : ticket.discordUrl ? (
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <a href={ticket.discordUrl} target="_blank" rel="noreferrer" className="btn-secondary" style={{ flex: 1, fontSize: '11px', padding: '6px', gap: '6px', justifyContent: 'center', color: '#5865F2', borderColor: 'rgba(88,101,242,0.4)' }}>
                            <MessageSquarePlus size={12} />
                            <span>Abrir no Discord</span>
                          </a>
                          <button className="btn-icon" style={{ width: '30px', height: '30px' }} onClick={() => { setEditingTicketLinkId(ticket.id); setEditingTicketLinkValue(ticket.discordUrl || ''); }} title="Editar link"><Edit2 size={12} /></button>
                        </div>
                      ) : (
                        <button
                          className="btn-secondary"
                          style={{ fontSize: '11px', padding: '6px', justifyContent: 'center', gap: '6px', color: '#666' }}
                          onClick={() => { setEditingTicketLinkId(ticket.id); setEditingTicketLinkValue(''); }}
                        >
                          <Link size={11} />
                          <span>Adicionar link do Discord</span>
                        </button>
                      )}

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '11px', color: '#666' }}>{ticket.status} · {ticket.createdDate}</span>
                        <button
                          className="btn-secondary"
                          style={{ fontSize: '11px', padding: '4px 8px', gap: '4px' }}
                          onClick={() => onUpdateTicketStatus(ticket.id, next.status)}
                        >
                          {ticket.status === 'Resolvido' ? <RotateCcw size={11} /> : <ArrowRight size={11} />}
                          <span>{next.label}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section: Histórico de Atividades */}
          <div className="detail-card" style={{ backgroundColor: '#161616', border: '1px solid #252525', borderRadius: '8px', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '10px', fontWeight: '700', color: '#555', textTransform: 'uppercase', letterSpacing: '1px', margin: 0 }}>
                HISTÓRICO DE ATIVIDADES
              </h3>
              <button 
                className="btn-secondary" 
                style={{ padding: '4px 8px', fontSize: '11px', border: 'none', background: 'none', color: 'var(--text-secondary)' }}
                onClick={() => setShowFullHistory(!showFullHistory)}
              >
                Ver log completo
              </button>
            </div>

            {(!client.activityHistory || client.activityHistory.length === 0) ? (
              <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Nenhuma atividade registrada.</span>
            ) : (
              <div className="vertical-timeline" style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {(showFullHistory ? client.activityHistory : client.activityHistory.slice(0, 3)).map((entry, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '12px', position: 'relative' }}>
                    
                    {/* Avatar node */}
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

                      {/* Observations bubble block (matching the gray chat bubble in image 1) */}
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
            <div className={`detail-card ${isEditingSla ? 'edit-mode-active' : ''}`} style={{ backgroundColor: '#161616', border: '1px solid #252525', borderLeft: `3px solid ${criticalityMeta.color}`, borderRadius: '8px', padding: '20px' }}>
              <div className="section-header" style={{ marginBottom: '14px' }}>
                <h3 style={{ fontSize: '10px', fontWeight: '700', color: '#555', textTransform: 'uppercase', letterSpacing: '1px', margin: 0 }}>Ciclo SLA & Criticidade</h3>
                <button className="btn-secondary" style={{ padding: '4px 8px', fontSize: '11px' }} onClick={() => setIsEditingSla(true)}><Edit2 size={11} /></button>
              </div>

              {!isEditingSla ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className={`badge ${criticalityMeta.badgeClass}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                      <criticalityMeta.Icon size={12} />
                      {client.criticality}
                    </span>
                    <span style={{ fontSize: '11px', color: '#666' }}>
                      {client.criticality === 'Crítico' ? 'Contato diário' : client.criticality === 'Atenção' ? 'Dia sim, dia não' : 'A cada 3 dias'}
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    Próximo contato: <strong className={getDateStatus(client.nextContactDate, todayStr) === 'overdue' ? 'date-overdue' : getDateStatus(client.nextContactDate, todayStr) === 'today' ? 'date-today' : ''} style={{ color: '#fff' }}>{client.nextContactDate}</strong>
                  </div>
                  <p style={{ fontSize: '12px', color: '#666', margin: 0 }}>{client.criticalityJustification || 'Sem justificativa.'}</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <CustomSelect value={criticality} onChange={setCriticality} options={['Estável', 'Atenção', 'Crítico']} />
                  <input type="text" className="form-input" placeholder="Justificativa..." value={justification} onChange={e => setJustification(e.target.value)} />
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn-secondary" style={{ flex: 1, padding: '4px' }} onClick={() => setIsEditingSla(false)}>Cancelar</button>
                    <button className="btn-primary" style={{ flex: 1, padding: '4px' }} onClick={handleSaveSla}>Salvar</button>
                  </div>
                </div>
              )}
            </div>

            {/* Obs Card */}
            <div className={`detail-card ${isEditingObs ? 'edit-mode-active' : ''}`} style={{ backgroundColor: '#161616', border: '1px solid #252525', borderRadius: '8px', padding: '20px' }}>
              <div className="section-header" style={{ marginBottom: '14px' }}>
                <h3 style={{ fontSize: '10px', fontWeight: '700', color: '#555', textTransform: 'uppercase', letterSpacing: '1px', margin: 0 }}>Observações</h3>
                <button className="btn-secondary" style={{ padding: '4px 8px', fontSize: '11px' }} onClick={() => setIsEditingObs(true)}><Edit2 size={11} /></button>
              </div>
              
              {!isEditingObs ? (
                <p style={{ fontSize: '12px', color: '#aaa', margin: 0, whiteSpace: 'pre-wrap', lineHeight: '1.4' }}>{client.observations || 'Nenhuma observação.'}</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <textarea className="form-textarea" rows={3} value={observations} onChange={e => setObservations(e.target.value)} />
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn-secondary" style={{ flex: 1, padding: '4px' }} onClick={() => setIsEditingObs(false)}>Cancelar</button>
                    <button className="btn-primary" style={{ flex: 1, padding: '4px' }} onClick={handleSaveObs}>Salvar</button>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Register Contact Modal */}
      {isRegisterContactOpen && (
        <div className="modal-overlay" onClick={() => setIsRegisterContactOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Registrar Contato</h3>
              <button className="btn-icon" onClick={() => setIsRegisterContactOpen(false)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">O que foi feito com o cliente?</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  autoFocus
                  value={registerContactNote}
                  onChange={e => setRegisterContactNote(e.target.value)}
                  placeholder="Ex: Alinhamento sobre configuração do WhatsApp..."
                />
              </div>
              <p style={{ fontSize: '11px', color: '#666', margin: 0 }}>
                Isso atualiza o ciclo de SLA e registra no histórico de atividades.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setIsRegisterContactOpen(false)}>Cancelar</button>
              <button
                className="btn-primary"
                onClick={() => {
                  onRegisterContact(client.id, registerContactNote.trim() || 'Contato registrado');
                  setRegisterContactNote('');
                  setIsRegisterContactOpen(false);
                }}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Conclude Action Modal */}
      {isConcludeActionOpen && (
        <div className="modal-overlay" onClick={() => setIsConcludeActionOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Concluir e Definir Próxima Ação</h3>
              <button className="btn-icon" onClick={() => setIsConcludeActionOpen(false)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '12px', color: '#666', margin: 0 }}>
                Concluindo: <strong style={{ color: '#ccc' }}>{client.nextAction}</strong>
              </p>
              <div className="form-group">
                <label className="form-label">Qual a próxima ação?</label>
                <input
                  type="text"
                  className="form-input"
                  autoFocus
                  value={nextActionText}
                  onChange={e => setNextActionText(e.target.value)}
                  placeholder="Ex: Acompanhar uso do módulo de automação"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Prazo</label>
                <CustomDatePicker value={nextActionDate} onChange={setNextActionDate} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setIsConcludeActionOpen(false)}>Cancelar</button>
              <button
                className="btn-primary"
                onClick={() => {
                  onRegisterContact(client.id, `Ação concluída: ${client.nextAction}`);
                  onUpdateClient(client.id, {
                    nextAction: nextActionText.trim() || 'Acompanhar cliente',
                    nextContactDate: nextActionDate || client.nextContactDate
                  });
                  setIsConcludeActionOpen(false);
                }}
              >
                Concluir e Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Ticket Modal */}
      {isNewTicketOpen && (
        <div className="modal-overlay" onClick={() => setIsNewTicketOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Novo Chamado</h3>
              <button className="btn-icon" onClick={() => setIsNewTicketOpen(false)}><X size={16} /></button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              if (!newTicketSubject.trim()) return;
              onAddTicket(client.id, newTicketSubject.trim(), newTicketDescription.trim(), newTicketPriority, newTicketDiscordUrl.trim());
              setNewTicketSubject(''); setNewTicketDescription(''); setNewTicketPriority('Normal'); setNewTicketDiscordUrl('');
              setIsNewTicketOpen(false);
            }}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Assunto *</label>
                  <input type="text" className="form-input" value={newTicketSubject} onChange={e => setNewTicketSubject(e.target.value)} placeholder="Resumo do problema..." required autoFocus />
                </div>
                <div className="form-group">
                  <label className="form-label">Descrição</label>
                  <textarea className="form-textarea" rows={3} value={newTicketDescription} onChange={e => setNewTicketDescription(e.target.value)} placeholder="Detalhes do chamado..." />
                </div>
                <div className="form-group">
                  <label className="form-label">Prioridade</label>
                  <CustomSelect value={newTicketPriority} onChange={setNewTicketPriority} options={['Baixa', 'Normal', 'Alta', 'Urgente']} />
                </div>
                <div className="form-group">
                  <label className="form-label">Link da demanda no Discord</label>
                  <input type="url" className="form-input" value={newTicketDiscordUrl} onChange={e => setNewTicketDiscordUrl(e.target.value)} placeholder="https://discord.com/channels/..." />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setIsNewTicketOpen(false)}>Cancelar</button>
                <button type="submit" className="btn-primary">Abrir Chamado</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Links Modal */}
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
                  <div className="form-group">
                    <label className="form-label">Deal ID</label>
                    <input type="text" className="form-input" value={linkDealId} onChange={e => setLinkDealId(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">CRM Active (URL)</label>
                    <input type="url" className="form-input" value={linkCrm} onChange={e => setLinkCrm(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Discord Demandas (URL)</label>
                    <input type="url" className="form-input" value={linkDiscordInt} onChange={e => setLinkDiscordInt(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Site do Cliente (URL)</label>
                    <input type="url" className="form-input" value={linkSite} onChange={e => setLinkSite(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Plataforma Atendimento (URL)</label>
                    <input type="url" className="form-input" value={linkDeskUrl} onChange={e => setLinkDeskUrl(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Plataforma Atendimento (E-mail)</label>
                    <input type="email" className="form-input" value={linkDeskEmail} onChange={e => setLinkDeskEmail(e.target.value)} />
                  </div>
                </div>

                <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid var(--border-color)' }}>
                  <label className="form-label" style={{ display: 'block', marginBottom: '10px' }}>Links Adicionais</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '10px' }}>
                    {linkDiscordSupportList.map(l => (
                      <div key={l.id} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px', padding: '8px 12px', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius)' }}>
                          <span style={{ fontSize: '13px', fontWeight: '600' }}>{l.label}</span>
                          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{l.url}</span>
                        </div>
                        <button type="button" className="btn-danger-icon" onClick={() => handleRemoveCustomLink(l.id)} title="Remover"><Trash2 size={14} /></button>
                      </div>
                    ))}
                    {linkDiscordSupportList.length === 0 && (
                      <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Nenhum link adicional. Use pra threads do Discord, planilhas, docs etc.</span>
                    )}
                  </div>
                  <div className="settings-inline-add-row">
                    <input
                      type="text"
                      className="form-input"
                      style={{ flex: '0 0 40%' }}
                      placeholder="Nome do link..."
                      value={newLinkLabel}
                      onChange={e => setNewLinkLabel(e.target.value)}
                    />
                    <input
                      type="url"
                      className="form-input"
                      style={{ flex: 1 }}
                      placeholder="https://..."
                      value={newLinkUrl}
                      onChange={e => setNewLinkUrl(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddCustomLink(); } }}
                    />
                    <button type="button" className="btn-icon" style={{ color: 'var(--green-primary)' }} onClick={handleAddCustomLink} title="Adicionar link">
                      <Plus size={16} />
                    </button>
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
    </div>
  );
}
