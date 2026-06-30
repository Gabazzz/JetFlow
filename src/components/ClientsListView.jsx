import React, { useState } from 'react';
import { Search, Plus, X } from 'lucide-react';

export default function ClientsListView({ clients, plans, modules, onAddClient, onNavigate }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State for new client
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [entryDate, setEntryDate] = useState(new Date().toISOString().slice(0, 10));
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
    // Set default plan if available
    if (plans.length > 0) {
      setSelectedPlan(plans[0].name);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    // Reset Form
    setName('');
    setPhone('');
    setEmail('');
    setWhatsapp('');
    setCnpj('');
    setEntryDate(new Date().toISOString().slice(0, 10));
    setSelectedModules([]);
    setCriticality('Estável');
    setJustification('');
    setObservations('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newClient = {
      id: `c_${Date.now()}`,
      name,
      phone,
      whatsapp: whatsapp || phone,
      email,
      cnpj,
      entryDate,
      responsible: 'Gabriel Almeida', // Default logged-in specialist
      plan: selectedPlan,
      activeModules: selectedModules,
      criticality,
      criticalityJustification: justification,
      observations,
      stage: 'Novo', // Starts in the first column of Kanban
      nextAction: 'Reunião de kickoff pendente',
      reminder: null,
      interestOffers: [],
      meetings: [],
      tasks: []
    };

    onAddClient(newClient);
    handleCloseModal();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%' }}>
      {/* Search and Action Row */}
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
        <button className="btn-primary" onClick={handleOpenModal}>
          <Plus size={16} />
          <span>Novo Cliente</span>
        </button>
      </div>

      {/* Clients Table / List */}
      <div className="table-container">
        {filteredClients.length === 0 ? (
          <div className="empty-state">
            <span className="empty-state-icon">👥</span>
            <p>Nenhum cliente encontrado.</p>
          </div>
        ) : (
          <table className="client-table">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Plano</th>
                <th>Módulos Ativos</th>
                <th>Criticidade</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.map(client => {
                let badgeClass = 'badge-estavel';
                if (client.criticality === 'Crítico') badgeClass = 'badge-critico';
                if (client.criticality === 'Atenção') badgeClass = 'badge-atencao';

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
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

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
                      type="date" 
                      className="form-input" 
                      value={entryDate} 
                      onChange={e => setEntryDate(e.target.value)} 
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
