import React, { useState } from 'react';
import { 
  X, 
  ChevronDown, 
  ChevronRight, 
  Check, 
  Clock, 
  AlertCircle, 
  Edit3, 
  MoreHorizontal, 
  Plus, 
  Zap, 
  Link as LinkIcon, 
  MessageSquare,
  BookOpen, 
  Globe, 
  Settings, 
  GitBranch, 
  UserPlus
} from 'lucide-react';

const TIMELINE_STEPS = [
  { key: 'kickoff', label: 'Kickoff' },
  { key: 'import', label: 'Importação' },
  { key: 'config', label: 'Configuração' },
  { key: 'api', label: 'API' },
  { key: 'ia', label: 'IA' },
  { key: 'train', label: 'Treinamento' },
  { key: 'done', label: 'Finalizado' }
];

const STAGE_TO_INDEX = {
  'Novo': 0,
  'Kickoff': 1,
  'Configuração': 2,
  'Integrações': 3,
  'Treinamento': 4,
  'Acompanhamento': 5,
  'Finalizado': 6
};

export default function Client360View({ 
  client, 
  isDrawer = false, 
  onClose, 
  onUpdateChecklist, 
  onUpdateNextAction 
}) {
  const [openAccordions, setOpenAccordions] = useState({
    impl: true,
    api: true,
    ia: true
  });
  
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const toggleAccordion = (key) => {
    setOpenAccordions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage('');
    }, 3000);
  };

  const handleActionClick = (actionName) => {
    setDropdownOpen(false);
    showToast(`Ação "${actionName}" simulada com sucesso!`);
  };

  if (!client) {
    return (
      <div className="placeholder-container">
        <AlertCircle className="placeholder-icon" />
        <h2 className="placeholder-title">Cliente não encontrado</h2>
        <p className="placeholder-text">Por favor, selecione um cliente válido.</p>
      </div>
    );
  }

  // Calculate checklists completion progress
  const getModuleProgress = (moduleKey) => {
    const list = client.checklists[moduleKey] || [];
    if (list.length === 0) return { total: 0, checked: 0, pct: 0, allDone: false };
    const checked = list.filter(item => item.checked).length;
    const total = list.length;
    const pct = Math.round((checked / total) * 100);
    return { total, checked, pct, allDone: checked === total };
  };

  const progressImpl = getModuleProgress('impl');
  const progressApi = getModuleProgress('api');
  const progressIa = getModuleProgress('ia');

  // Calculate current active step index on the progress timeline
  const activeStepIndex = STAGE_TO_INDEX[client.stage] !== undefined ? STAGE_TO_INDEX[client.stage] : 0;
  const progressFillWidth = `${(activeStepIndex / (TIMELINE_STEPS.length - 1)) * 100}%`;

  const renderTimelineNode = (step, idx) => {
    let nodeClass = 'pending';
    let NodeIcon = () => <span style={{ fontSize: '11px' }}>{idx + 1}</span>;

    if (client.stage === 'Finalizado') {
      nodeClass = 'completed';
      NodeIcon = () => <Check size={12} />;
    } else if (idx < activeStepIndex) {
      nodeClass = 'completed';
      NodeIcon = () => <Check size={12} />;
    } else if (idx === activeStepIndex) {
      nodeClass = 'current';
      NodeIcon = () => <Clock size={12} className="spin-slow" />;
    }

    return (
      <div key={step.key} className={`timeline-step ${nodeClass}`}>
        <div className={`step-node ${nodeClass}`}>
          <NodeIcon />
        </div>
        <span className="step-label">{step.label}</span>
      </div>
    );
  };

  const clientInfoContent = (
    <>
      {/* Client Info Grid */}
      <section className="info-grid" aria-label="Informações Principais">
        <div className="info-item">
          <span className="info-label">Responsável</span>
          <span className="info-value">{client.owner}</span>
        </div>
        <div className="info-item">
          <span className="info-label">Telefone</span>
          <span className="info-value">{client.phone}</span>
        </div>
        <div className="info-item">
          <span className="info-label">WhatsApp</span>
          <span className="info-value" style={{ color: 'var(--green-primary)', fontWeight: '600' }}>
            {client.whatsapp}
          </span>
        </div>
        <div className="info-item">
          <span className="info-label">E-mail</span>
          <span className="info-value">{client.email}</span>
        </div>
        <div className="info-item">
          <span className="info-label">CNPJ</span>
          <span className="info-value">{client.cnpj}</span>
        </div>
        <div className="info-item">
          <span className="info-label">Plano contratado</span>
          <span className="info-value" style={{ color: 'var(--color-info)', fontWeight: '600' }}>
            {client.plan}
          </span>
        </div>
        <div className="info-item">
          <span className="info-label">Data de Entrada</span>
          <span className="info-value">{client.entryDate}</span>
        </div>
        <div className="info-item">
          <span className="info-label">Colaborador</span>
          <span className="info-value">{client.collaborator}</span>
        </div>
        <div className="info-item">
          <span className="info-label">Tipo de Implantação</span>
          <span className="info-value">{client.implType}</span>
        </div>
        <div className="info-item">
          <span className="info-label">Módulos Ativos</span>
          <span className="info-value">
            {client.modules.join(' · ')}
          </span>
        </div>
      </section>

      {/* Progress Timeline */}
      <div className="progress-timeline-container">
        <div className="progress-timeline">
          <div className="progress-line-bg" />
          <div className="progress-line-fill" style={{ width: progressFillWidth }} />
          {TIMELINE_STEPS.map((step, idx) => renderTimelineNode(step, idx))}
        </div>
      </div>

      {/* Next Action Card */}
      {client.nextAction !== '—' && (
        <div className="next-action-card">
          <div className="next-action-left">
            <span className="next-action-badge">
              <Zap size={12} />
              Próxima ação
            </span>
            <span className="next-action-text">"{client.nextAction}"</span>
            <span className="next-action-deadline">Prazo: {client.deadline}</span>
          </div>
          <button 
            className="btn-action-primary"
            onClick={() => {
              onUpdateNextAction(true);
              showToast('Próxima ação marcada como concluída!');
            }}
          >
            Concluir
          </button>
        </div>
      )}

      {/* Checklists accordions */}
      <section className="checklists-section" aria-label="Checklists por Módulo">
        {/* Onboarding Checklist */}
        <div className="accordion-item">
          <div className="accordion-header" id="accordion-header-impl" onClick={() => toggleAccordion('impl')}>
            <div className="accordion-title-area">
              {openAccordions.impl ? <ChevronDown className="accordion-chevron" /> : <ChevronRight className="accordion-chevron" />}
              <span className="accordion-title">Implantação</span>
            </div>
            <span className="accordion-progress">{progressImpl.checked}/{progressImpl.total} ({progressImpl.pct}%)</span>
          </div>
          {openAccordions.impl && (
            <div className="accordion-content">
              {client.checklists.impl.map((item, idx) => (
                <div 
                  key={item.id} 
                  className={`checklist-item ${item.checked ? 'checked' : ''}`}
                  onClick={() => onUpdateChecklist('impl', idx, !item.checked)}
                >
                  <div className="checklist-checkbox-wrapper">
                    <input 
                      type="checkbox" 
                      id={`checkbox-${item.id}`}
                      className="checklist-checkbox" 
                      checked={item.checked}
                      onChange={() => {}} // Controlled by wrapper click
                    />
                  </div>
                  <span className="checklist-text">{item.label}</span>
                </div>
              ))}
              {progressImpl.allDone && (
                <div className="module-completed-badge">
                  <span>Módulo concluído 🎉</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* API Checklist */}
        <div className="accordion-item">
          <div className="accordion-header" id="accordion-header-api" onClick={() => toggleAccordion('api')}>
            <div className="accordion-title-area">
              {openAccordions.api ? <ChevronDown className="accordion-chevron" /> : <ChevronRight className="accordion-chevron" />}
              <span className="accordion-title">API Oficial</span>
            </div>
            <span className="accordion-progress">{progressApi.checked}/{progressApi.total} ({progressApi.pct}%)</span>
          </div>
          {openAccordions.api && (
            <div className="accordion-content">
              {client.checklists.api.map((item, idx) => (
                <div 
                  key={item.id} 
                  className={`checklist-item ${item.checked ? 'checked' : ''}`}
                  onClick={() => onUpdateChecklist('api', idx, !item.checked)}
                >
                  <div className="checklist-checkbox-wrapper">
                    <input 
                      type="checkbox" 
                      id={`checkbox-${item.id}`}
                      className="checklist-checkbox" 
                      checked={item.checked}
                      onChange={() => {}}
                    />
                  </div>
                  <span className="checklist-text">{item.label}</span>
                </div>
              ))}
              {progressApi.allDone && (
                <div className="module-completed-badge">
                  <span>Módulo concluído 🎉</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* IA Checklist */}
        <div className="accordion-item">
          <div className="accordion-header" id="accordion-header-ia" onClick={() => toggleAccordion('ia')}>
            <div className="accordion-title-area">
              {openAccordions.ia ? <ChevronDown className="accordion-chevron" /> : <ChevronRight className="accordion-chevron" />}
              <span className="accordion-title">Inteligência Artificial</span>
            </div>
            <span className="accordion-progress">{progressIa.checked}/{progressIa.total} ({progressIa.pct}%)</span>
          </div>
          {openAccordions.ia && (
            <div className="accordion-content">
              {client.checklists.ia.map((item, idx) => (
                <div 
                  key={item.id} 
                  className={`checklist-item ${item.checked ? 'checked' : ''}`}
                  onClick={() => onUpdateChecklist('ia', idx, !item.checked)}
                >
                  <div className="checklist-checkbox-wrapper">
                    <input 
                      type="checkbox" 
                      id={`checkbox-${item.id}`}
                      className="checklist-checkbox" 
                      checked={item.checked}
                      onChange={() => {}}
                    />
                  </div>
                  <span className="checklist-text">{item.label}</span>
                </div>
              ))}
              {progressIa.allDone && (
                <div className="module-completed-badge">
                  <span>Módulo concluído 🎉</span>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Quick Links */}
      <div className="quick-links-container">
        <span className="quick-links-title">Links rápidos</span>
        <div className="quick-links-row">
          <a href="#" onClick={(e) => { e.preventDefault(); showToast('Redirecionando para o Discord...'); }} className="quick-link-btn">
            <MessageSquare size={13} className="quick-link-icon" />
            <span>Discord</span>
          </a>
          <a href="#" onClick={(e) => { e.preventDefault(); showToast('Abrindo CRM Jetsales...'); }} className="quick-link-btn">
            <GitBranch size={13} className="quick-link-icon" />
            <span>CRM</span>
          </a>
          <a href="#" onClick={(e) => { e.preventDefault(); showToast('Visualizando Site do cliente...'); }} className="quick-link-btn">
            <Globe size={13} className="quick-link-icon" />
            <span>Site</span>
          </a>
          <a href="#" onClick={(e) => { e.preventDefault(); showToast('Carregando Painel JetFlow...'); }} className="quick-link-btn">
            <Settings size={13} className="quick-link-icon" />
            <span>Painel</span>
          </a>
          <a href="#" onClick={(e) => { e.preventDefault(); showToast('Abrindo Meta Business Suite...'); }} className="quick-link-btn">
            <UserPlus size={13} className="quick-link-icon" />
            <span>Meta</span>
          </a>
          <a href="#" onClick={(e) => { e.preventDefault(); showToast('Abrindo documentação oficial...'); }} className="quick-link-btn">
            <BookOpen size={13} className="quick-link-icon" />
            <span>Documentação</span>
          </a>
        </div>
      </div>

      {/* Activity Log */}
      <section className="activity-log-section" aria-label="Histórico de Atividades">
        <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>Log de atividades</h3>
        <div className="log-timeline">
          <div className="log-line" />
          {client.logs.map((log, idx) => (
            <div key={idx} className="log-item">
              <div className="log-dot" />
              <span className="log-header-text">
                <span className="log-author">{log.author}</span> · {log.date}
              </span>
              <div className="log-content">{log.content}</div>
            </div>
          ))}
        </div>
      </section>
    </>
  );

  const headerActions = (
    <div className="client-header-actions">
      <button 
        id="btn-edit-client"
        className="btn-action-outline"
        onClick={() => showToast('Abertura de edição simulada!')}
      >
        <Edit3 size={14} />
        Editar
      </button>
      <button 
        id="btn-actions-dropdown"
        className="btn-action-outline"
        onClick={() => setDropdownOpen(!dropdownOpen)}
      >
        <MoreHorizontal size={14} />
        Ações
        <ChevronDown size={14} />
      </button>

      {dropdownOpen && (
        <div className="dropdown-menu">
          <button id="btn-action-redistribute" className="dropdown-item" onClick={() => handleActionClick('Redistribuir')}>
            Redistribuir cliente
          </button>
          <button id="btn-action-archive" className="dropdown-item" onClick={() => handleActionClick('Arquivar')}>
            Arquivar onboarding
          </button>
          <button id="btn-action-remind" className="dropdown-item" onClick={() => handleActionClick('Adicionar lembrete')}>
            Adicionar lembrete
          </button>
        </div>
      )}
    </div>
  );

  // If rendering inside the side Drawer of the Kanban Board
  if (isDrawer) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div className="drawer-header">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxWidth: '70%' }}>
            <h2 className="drawer-title" title={client.name}>{client.name}</h2>
            <span className="badge done" style={{ alignSelf: 'flex-start', fontSize: '9px' }}>
              {client.stage}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button id="btn-drawer-close" className="btn-close" onClick={onClose}>
              <X size={18} />
            </button>
          </div>
        </div>
        <div className="drawer-content">
          <div style={{ display: 'flex', justifyContent: 'flex-start', width: '100%', marginBottom: '-8px' }}>
            {headerActions}
          </div>
          {clientInfoContent}
        </div>

        {/* Toast Notifications */}
        {toastMessage && (
          <div className="toast">
            <Check size={14} style={{ color: 'var(--green-primary)' }} />
            <span>{toastMessage}</span>
          </div>
        )}
      </div>
    );
  }

  // If rendering in full-page mode
  return (
    <div className="client-full-page">
      <div className="client-full-header">
        <div className="client-header-title-area">
          <h1 className="page-title" style={{ margin: 0 }}>{client.name}</h1>
          <span className="badge done" style={{ fontSize: '11px', padding: '4px 10px' }}>
            {client.stage}
          </span>
        </div>
        {headerActions}
      </div>

      {clientInfoContent}

      {/* Toast Notifications */}
      {toastMessage && (
        <div className="toast">
          <Check size={14} style={{ color: 'var(--green-primary)' }} />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
