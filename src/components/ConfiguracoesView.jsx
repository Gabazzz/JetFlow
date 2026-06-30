import React, { useState, useRef } from 'react';
import { User, Layers, Tag, Box, Plus, Trash2, Edit2, Check, X, Camera } from 'lucide-react';

export default function ConfiguracoesView({ 
  profile, 
  onUpdateProfile,
  plans, 
  onAddPlan, 
  onEditPlan, 
  onRemovePlan,
  modules, 
  onAddModule, 
  onEditModule, 
  onRemoveModule,
  offers, 
  onAddOffer, 
  onEditOffer, 
  onRemoveOffer 
}) {
  const [activeTab, setActiveTab] = useState('perfil'); // perfil, planos, modulos, ofertas
  const fileInputRef = useRef(null);

  // Perfil state
  const [profileName, setProfileName] = useState(profile.name);
  const [profileRole, setProfileRole] = useState(profile.role);
  const [profileAvatar, setProfileAvatar] = useState(profile.avatarUrl || '');

  // Add Item states
  const [newPlanName, setNewPlanName] = useState('');
  const [newModuleName, setNewModuleName] = useState('');
  const [newOfferName, setNewOfferName] = useState('');

  // Row editing states
  const [editingPlanId, setEditingPlanId] = useState(null);
  const [editPlanName, setEditPlanName] = useState('');

  const [editingModuleId, setEditingModuleId] = useState(null);
  const [editModuleName, setEditModuleName] = useState('');

  const [editingOfferId, setEditingOfferId] = useState(null);
  const [editOfferName, setEditOfferName] = useState('');

  // Profile Simulated Picture Upload
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setProfileAvatar(url);
    }
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    onUpdateProfile({
      name: profileName,
      role: profileRole,
      avatarUrl: profileAvatar,
      avatarInitials: profileName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    });
    alert('Perfil atualizado com sucesso!');
  };

  // Add Handlers
  const handleCreatePlan = (e) => {
    e.preventDefault();
    if (!newPlanName.trim()) return;
    onAddPlan({ id: `plan_${Date.now()}`, name: newPlanName });
    setNewPlanName('');
  };

  const handleCreateModule = (e) => {
    e.preventDefault();
    if (!newModuleName.trim()) return;
    onAddModule({ id: `mod_${Date.now()}`, name: newModuleName });
    setNewModuleName('');
  };

  const handleCreateOffer = (e) => {
    e.preventDefault();
    if (!newOfferName.trim()) return;
    onAddOffer({ id: `off_${Date.now()}`, name: newOfferName });
    setNewOfferName('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%' }}>
      {/* Tabs Menu */}
      <div className="tabs-bar">
        <button 
          className={`tab-btn ${activeTab === 'perfil' ? 'active' : ''}`}
          onClick={() => setActiveTab('perfil')}
        >
          Meu Perfil
        </button>
        <button 
          className={`tab-btn ${activeTab === 'planos' ? 'active' : ''}`}
          onClick={() => setActiveTab('planos')}
        >
          Planos
        </button>
        <button 
          className={`tab-btn ${activeTab === 'modulos' ? 'active' : ''}`}
          onClick={() => setActiveTab('modulos')}
        >
          Módulos
        </button>
        <button 
          className={`tab-btn ${activeTab === 'ofertas' ? 'active' : ''}`}
          onClick={() => setActiveTab('ofertas')}
        >
          Ofertas
        </button>
      </div>

      {/* Tab Content Panel */}
      <div className="settings-layout">
        {/* Tab 1: Perfil */}
        {activeTab === 'perfil' && (
          <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <h3 className="section-title">Meu Perfil de Especialista</h3>
            
            <div className="profile-setup">
              <div 
                className="profile-avatar-upload" 
                onClick={() => fileInputRef.current.click()}
                title="Clique para trocar foto"
              >
                {profileAvatar ? (
                  <img src={profileAvatar} alt="Profile" />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'var(--text-secondary)' }}>
                    <Camera size={20} />
                    <span className="upload-text">Upload</span>
                  </div>
                )}
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  accept="image/*" 
                  style={{ display: 'none' }} 
                />
              </div>

              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Nome Completo</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={profileName} 
                    onChange={e => setProfileName(e.target.value)} 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Cargo / Função</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={profileRole} 
                    onChange={e => setProfileRole(e.target.value)} 
                    required 
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
              <button type="submit" className="btn-primary">
                Salvar Perfil
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Planos */}
        {activeTab === 'planos' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 className="section-title">Gerenciar Planos</h3>
            </div>

            {/* Add New Plan form */}
            <form onSubmit={handleCreatePlan} style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Nome do Novo Plano</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={newPlanName} 
                  onChange={e => setNewPlanName(e.target.value)}
                  placeholder="Ex: StartUP, Gold, Premium..."
                />
              </div>
              <button type="submit" className="btn-primary" style={{ height: '42px' }}>
                <Plus size={16} />
                <span>Adicionar</span>
              </button>
            </form>

            {/* List of Plans */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>
              {plans.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-state-icon">📋</span>
                  <p>Nenhum plano cadastrado. Adicione um acima.</p>
                </div>
              ) : (
                plans.map(p => {
                  const isEditingThis = editingPlanId === p.id;
                  return (
                    <div key={p.id} className="settings-list-item">
                      {!isEditingThis ? (
                        <>
                          <span style={{ fontWeight: '500' }}>{p.name}</span>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button 
                              className="btn-icon" 
                              onClick={() => { setEditingPlanId(p.id); setEditPlanName(p.name); }}
                              title="Editar plano"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button 
                              className="btn-danger-icon" 
                              onClick={() => onRemovePlan(p.id)}
                              title="Excluir plano"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </>
                      ) : (
                        <div style={{ display: 'flex', width: '100%', gap: '12px', alignItems: 'center' }}>
                          <input 
                            type="text" 
                            className="form-input" 
                            style={{ flex: 1 }}
                            value={editPlanName} 
                            onChange={e => setEditPlanName(e.target.value)} 
                          />
                          <button 
                            className="btn-icon" 
                            style={{ color: 'var(--green-primary)' }}
                            onClick={() => { onEditPlan(p.id, editPlanName); setEditingPlanId(null); }}
                          >
                            <Check size={14} />
                          </button>
                          <button 
                            className="btn-icon" 
                            style={{ color: 'var(--badge-red)' }}
                            onClick={() => setEditingPlanId(null)}
                          >
                            <X size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Módulos */}
        {activeTab === 'modulos' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 className="section-title">Gerenciar Módulos</h3>
            </div>

            {/* Add New Module form */}
            <form onSubmit={handleCreateModule} style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Nome do Novo Módulo</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={newModuleName} 
                  onChange={e => setNewModuleName(e.target.value)}
                  placeholder="Ex: Disparo em Massa, Webhook Avançado..."
                />
              </div>
              <button type="submit" className="btn-primary" style={{ height: '42px' }}>
                <Plus size={16} />
                <span>Adicionar</span>
              </button>
            </form>

            {/* List of Modules */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>
              {modules.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-state-icon">⚙️</span>
                  <p>Nenhum módulo cadastrado. Adicione um acima.</p>
                </div>
              ) : (
                modules.map(m => {
                  const isEditingThis = editingModuleId === m.id;
                  return (
                    <div key={m.id} className="settings-list-item">
                      {!isEditingThis ? (
                        <>
                          <span style={{ fontWeight: '500' }}>{m.name}</span>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button 
                              className="btn-icon" 
                              onClick={() => { setEditingModuleId(m.id); setEditModuleName(m.name); }}
                              title="Editar módulo"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button 
                              className="btn-danger-icon" 
                              onClick={() => onRemoveModule(m.id)}
                              title="Excluir módulo"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </>
                      ) : (
                        <div style={{ display: 'flex', width: '100%', gap: '12px', alignItems: 'center' }}>
                          <input 
                            type="text" 
                            className="form-input" 
                            style={{ flex: 1 }}
                            value={editModuleName} 
                            onChange={e => setEditModuleName(e.target.value)} 
                          />
                          <button 
                            className="btn-icon" 
                            style={{ color: 'var(--green-primary)' }}
                            onClick={() => { onEditModule(m.id, editModuleName); setEditingModuleId(null); }}
                          >
                            <Check size={14} />
                          </button>
                          <button 
                            className="btn-icon" 
                            style={{ color: 'var(--badge-red)' }}
                            onClick={() => setEditingModuleId(null)}
                          >
                            <X size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Tab 4: Ofertas */}
        {activeTab === 'ofertas' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 className="section-title">Gerenciar Ofertas de Upsell</h3>
            </div>

            {/* Add New Offer form */}
            <form onSubmit={handleCreateOffer} style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Nome da Nova Oferta comercial</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={newOfferName} 
                  onChange={e => setNewOfferName(e.target.value)}
                  placeholder="Ex: Treinamento Extra, Módulo Beta..."
                />
              </div>
              <button type="submit" className="btn-primary" style={{ height: '42px' }}>
                <Plus size={16} />
                <span>Adicionar</span>
              </button>
            </form>

            {/* List of Offers */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>
              {offers.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-state-icon">🏷️</span>
                  <p>Nenhuma oferta cadastrada. Adicione uma acima.</p>
                </div>
              ) : (
                offers.map(o => {
                  const isEditingThis = editingOfferId === o.id;
                  return (
                    <div key={o.id} className="settings-list-item">
                      {!isEditingThis ? (
                        <>
                          <span style={{ fontWeight: '500' }}>{o.name}</span>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button 
                              className="btn-icon" 
                              onClick={() => { setEditingOfferId(o.id); setEditOfferName(o.name); }}
                              title="Editar oferta"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button 
                              className="btn-danger-icon" 
                              onClick={() => onRemoveOffer(o.id)}
                              title="Excluir oferta"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </>
                      ) : (
                        <div style={{ display: 'flex', width: '100%', gap: '12px', alignItems: 'center' }}>
                          <input 
                            type="text" 
                            className="form-input" 
                            style={{ flex: 1 }}
                            value={editOfferName} 
                            onChange={e => setEditOfferName(e.target.value)} 
                          />
                          <button 
                            className="btn-icon" 
                            style={{ color: 'var(--green-primary)' }}
                            onClick={() => { onEditOffer(o.id, editOfferName); setEditingOfferId(null); }}
                          >
                            <Check size={14} />
                          </button>
                          <button 
                            className="btn-icon" 
                            style={{ color: 'var(--badge-red)' }}
                            onClick={() => setEditingOfferId(null)}
                          >
                            <X size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
