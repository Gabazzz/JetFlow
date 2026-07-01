import React, { useState } from 'react';
import { Search, Plus, X, List, Kanban, Check } from 'lucide-react';
import KanbanView from './KanbanView';
import { calculateNextContactDate } from '../utils';

export default function ClientsListView({ 
  clients, 
  plans, 
  modules, 
  onAddClient, 
  onNavigate,
  onUpdateClientStage,
  onUpdateClientNextAction,
  onUpdateClientCriticality,
  onRegisterContact
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('lista'); // 'lista' or 'kanban'
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Popover State: { clientId, type: 'contato' | 'acao' | 'criticidade' }
  const [activePopover, setActivePopover] = useState(null);
  const [popoverObs, setPopoverObs] = useState('');
  const [popoverAction, setPopoverAction] = useState('');

  // Form State for new client
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [entryDate, setEntryDate] = useState('30/06/2026'); // DD/MM/AAAA default
  const [selectedPlan, setSelectedPlan] = useState('');
  const [selectedModules, setSelectedModules] = useState([]);
  const [criticality, setCriticality] = useState('Estável');
  const [justification, setJustification] = useState('');
  const [observations, setObservations] = useState('');

  // Search filter
  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.plan.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleToggleModule = (modName) => {
    setSelectedModules(prev => 
      prev.includes(modName) ? prev.filter(m => m !== modName) : [...prev, modName]
    );
  };

  const handleOpenModal = () => {
    setIsModalOpen(true);
    if (plans.length > 0) {
      setSelectedPlan(plans[0].name);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setName('');
    setPhone('');
    setEmail('');
    setWhatsapp('');
    setCnpj('');
    setEntryDate('30/06/2026');
    setSelectedModules([]);
    setCriticality('Estável');
    setJustification('');
    setObservations('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    // Auto calculate next contact date based on criticality
    const nextContact = calculateNextContactDate(criticality, '30/06/2026');

    const newClient = {
      id: `c_${Date.now()}`,
      name,
      phone,
      whatsapp: whatsapp || phone,
      email,
      cnpj,
      entryDate,
      responsible: 'Gabriel Almeida',
      plan: selectedPlan,
      activeModules: selectedModules,
      criticality,
      criticalityJustification: justification,
      observations,
      stage: 'Novo',
      nextAction: 'Reunião de kickoff pendente',
      nextContactDate: nextContact,
      reminders: [],
      quickLinks: {
        crm: '',
        discordIntegration: '',
        discordSupport: [],
        site: '',
        deskPlatformUrl: '',
        deskPlatformEmail: ''
      },
      meetings: [],
      tasks: [],
      interestOffers: []
    };

    onAddClient(newClient);
    handleCloseModal();
  };

  const handleOpenPopover = (clientId, type, currentVal = '') => {
    setActivePopover({ clientId, type });
    if (type === 'contato') {
      setPopoverObs('');
    } else if (type === 'acao') {
      setPopoverAction(currentVal);
    }
  };

  const handleConfirmContact = (clientId) => {
    onRegisterContact(clientId, popoverObs);
    setActivePopover(null);
  };

  const handleConfirmAction = (clientId) => {
    onUpdateClientNextAction(clientId, popoverAction);
    setActivePopover(null);
  };

  const handleConfirmCriticality = (clientId, newCrit) => {
    onUpdateClientCriticality(clientId, newCrit);
    setActivePopover(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%', position: 'relative' }}>
      
      {/* Click-away blocker overlay for popovers */}
      {activePopover && (
        <div 
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999, cursor: 'default' }}
          onClick={() => setActivePopover(null)}
        />
      )}

      {/* Top search, toggle and creation row */}
      <div className="search-bar-row">
        <div className="search-input-wrapper">
          <Search size={16} className="search-icon" />
          <input 
            type="text" 
            className="search-input" 
            placeholder="Buscar por nome do cliente ou plano..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        {/* List / Kanban Mode Toggle */}
        <div className="toggle-group">
          <button 
            className={`toggle-btn ${viewMode === 'lista' ? 'active' : ''}`}
            onClick={() => setViewMode('lista')}
          >
            <List size={14} />
            <span>Lista</span>
          </button>
          <button 
            className={`toggle-btn ${viewMode === 'kanban' ? 'active' : ''}`}
            onClick={() => setViewMode('kanban')}
          >
            <Kanban size={14} />
            <span>Kanban</span>
          </button>
        </div>

        <button className="btn-primary" onClick={handleOpenModal}>
          <Plus size={16} />
          <span>Novo Cliente</span>
        </button>
      </div>

      {/* Conditional View Rendering */}
      {viewMode === 'kanban' ? (
        <KanbanView 
          clients={filteredClients}
          onUpdateClientStage={onUpdateClientStage}
          onUpdateClientNextAction={onUpdateClientNextAction}
          onNavigate={onNavigate}
        />
      ) : (
        <div className="table-container" style={{ overflow: 'visible' }}>
          {filteredClients.length === 0 ? (
            <div className="empty-state">
              <span className="empty-state-icon">👥</span>
              <p>Nenhum cliente encontrado.</p>
            </div>
          ) : (
            <table className="client-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Plano</th>
                  <th>Módulos Ativos</th>
                  <th>Criticidade</th>
                  <th style={{ textAlign: 'right', width: '280px' }}>Ações Rápidas</th>
                </tr>
              </thead>
              <tbody>
                {filteredClients.map(client => {
                  let badgeClass = 'badge-estavel';
                  if (client.criticality === 'Crítico') badgeClass = 'badge-critico';
                  if (client.criticality === 'Atenção') badgeClass = 'badge-atencao';

                  const isPopoverActive = activePopover && activePopover.clientId === client.id;

                  return (
                    <tr key={client.id} onClick={() => onNavigate(`clientes/${client.id}`)}>
                      <td style={{ fontWeight: '600' }}>{client.name}</td>
                      <td>{client.plan}</td>
                      <td>
                        <div className="module-pills">
                          {client.activeModules && client.activeModules.length > 0 ? (
                            client.activeModules.map(mod => (
                              <span key={mod} className="module-pill">{mod}</span>
                            ))
                          ) : (
                            <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>Nenhum</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${badgeClass}`}>{client.criticality}</span>
                      </td>

                      {/* Hover Actions Menu Cell */}
                      <td style={{ position: 'relative', width: '280px', zIndex: isPopoverActive ? 1000 : 10 }}>
                        <div className="row-actions">
                          <button 
                            className="btn-secondary" 
                            style={{ padding: '4px 8px', fontSize: '11px' }}
                            onClick={(e) => { e.stopPropagation(); handleOpenPopover(client.id, 'contato'); }}
                          >
                            Registrar Contato
                          </button>
                          <button 
                            className="btn-secondary" 
                            style={{ padding: '4px 8px', fontSize: '11px' }}
                            onClick={(e) => { e.stopPropagation(); handleOpenPopover(client.id, 'acao', client.nextAction); }}
                          >
                            Próxima Ação
                          </button>
                          <button 
                            className="btn-secondary" 
                            style={{ padding: '4px 8px', fontSize: '11px' }}
                            onClick={(e) => { e.stopPropagation(); handleOpenPopover(client.id, 'criticidade'); }}
                          >
                            Criticidade
                          </button>
                          <button 
                            className="btn-secondary" 
                            style={{ padding: '4px 8px', fontSize: '11px', color: 'var(--green-primary)' }}
                            onClick={(e) => { e.stopPropagation(); onNavigate(`clientes/${client.id}`); }}
                          >
                            Detalhes →
                          </button>
                        </div>

                        {/* Inline Popovers */}
                        {isPopoverActive && (
                          <div 
                            className="quick-popover" 
                            style={{ right: '10px', top: '40px' }}
                            onClick={(e) => e.stopPropagation()} // Prevent row click navigation
                          >
                            {activePopover.type === 'contato' && (
                              <>
                                <span className="form-label" style={{ fontWeight: '600' }}>Registrar Contato</span>
                                <textarea 
                                  className="form-textarea" 
                                  rows="2"
                                  placeholder="O que foi tratado? (opcional)"
                                  value={popoverObs}
                                  onChange={e => setPopoverObs(e.target.value)}
                                  style={{ width: '100%', fontSize: '12px' }}
                                />
                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                  <button className="btn-secondary" style={{ padding: '4px 8px', fontSize: '11px' }} onClick={() => setActivePopover(null)}>Cancelar</button>
                                  <button className="btn-primary" style={{ padding: '4px 8px', fontSize: '11px' }} onClick={() => handleConfirmContact(client.id)}>Confirmar</button>
                                </div>
                              </>
                            )}

                            {activePopover.type === 'acao' && (
                              <>
                                <span className="form-label" style={{ fontWeight: '600' }}>Editar Próxima Ação</span>
                                <input 
                                  type="text" 
                                  className="form-input"
                                  value={popoverAction}
                                  onChange={e => setPopoverAction(e.target.value)}
                                  onKeyDown={e => { if (e.key === 'Enter') handleConfirmAction(client.id); }}
                                  style={{ width: '100%', fontSize: '12px', height: '32px' }}
                                  autoFocus
                                />
                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                  <button className="btn-secondary" style={{ padding: '4px 8px', fontSize: '11px' }} onClick={() => setActivePopover(null)}>Cancelar</button>
                                  <button className="btn-primary" style={{ padding: '4px 8px', fontSize: '11px' }} onClick={() => handleConfirmAction(client.id)}>Salvar</button>
                                </div>
                              </>
                            )}

                            {activePopover.type === 'criticidade' && (
                              <>
                                <span className="form-label" style={{ fontWeight: '600', marginBottom: '4px' }}>Alterar Criticidade</span>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                  <button 
                                    className="btn-secondary" 
                                    style={{ justifyContent: 'center', color: 'var(--badge-red)' }} 
                                    onClick={() => handleConfirmCriticality(client.id, 'Crítico')}
                                  >
                                    Crítico (1 dia)
                                  </button>
                                  <button 
                                    className="btn-secondary" 
                                    style={{ justifyContent: 'center', color: 'var(--badge-yellow)' }} 
                                    onClick={() => handleConfirmCriticality(client.id, 'Atenção')}
                                  >
                                    Atenção (2 dias)
                                  </button>
                                  <button 
                                    className="btn-secondary" 
                                    style={{ justifyContent: 'center', color: 'var(--badge-green)' }} 
                                    onClick={() => handleConfirmCriticality(client.id, 'Estável')}
                                  >
                                    Estável (3 dias)
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Novo Cliente Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Cadastrar Novo Cliente</h3>
              <button className="btn-icon" onClick={handleCloseModal}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Nome do Cliente *</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={name} 
                      onChange={e => setName(e.target.value)} 
                      placeholder="Razão Social ou Nome Fantasia"
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">CNPJ</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={cnpj} 
                      onChange={e => setCnpj(e.target.value)} 
                      placeholder="00.000.000/0001-00"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Telefone</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={phone} 
                      onChange={e => setPhone(e.target.value)} 
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">WhatsApp</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={whatsapp} 
                      onChange={e => setWhatsapp(e.target.value)} 
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">E-mail</label>
                    <input 
                      type="email" 
                      className="form-input" 
                      value={email} 
                      onChange={e => setEmail(e.target.value)} 
                      placeholder="contato@cliente.com"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Data de Entrada</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={entryDate} 
                      onChange={e => setEntryDate(e.target.value)} 
                      placeholder="DD/MM/AAAA"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Plano</label>
                    <select 
                      className="form-select" 
                      value={selectedPlan} 
                      onChange={e => setSelectedPlan(e.target.value)}
                    >
                      {plans.map(p => (
                        <option key={p.id} value={p.name}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Nível de Criticidade</label>
                    <select 
                      className="form-select" 
                      value={criticality} 
                      onChange={e => setCriticality(e.target.value)}
                    >
                      <option value="Estável">Estável</option>
                      <option value="Atenção">Atenção</option>
                      <option value="Crítico">Crítico</option>
                    </select>
                  </div>
                  {criticality !== 'Estável' && (
                    <div className="form-group full-width">
                      <label className="form-label">Justificativa da Criticidade</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        value={justification} 
                        onChange={e => setJustification(e.target.value)}
                        placeholder="Descreva o motivo de atenção/crítico..."
                        required
                      />
                    </div>
                  )}
                  <div className="form-group full-width">
                    <label className="form-label">Módulos Contratados</label>
                    <div className="checkbox-group">
                      {modules.map(mod => (
                        <label key={mod.id} className="checkbox-label">
                          <input 
                            type="checkbox" 
                            checked={selectedModules.includes(mod.name)}
                            onChange={() => handleToggleModule(mod.name)}
                          />
                          <span>{mod.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="form-group full-width">
                    <label className="form-label">Observações</label>
                    <textarea 
                      className="form-textarea" 
                      rows="3" 
                      value={observations} 
                      onChange={e => setObservations(e.target.value)} 
                      placeholder="Observações gerais adicionais..."
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={handleCloseModal}>Cancelar</button>
                <button type="submit" className="btn-primary">Criar Cliente</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
