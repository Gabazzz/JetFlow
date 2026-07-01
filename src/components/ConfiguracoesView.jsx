import React, { useState, useRef } from 'react';
import { User, Layers, Tag, Box, Plus, Trash2, Edit2, Check, X, Camera, GripVertical, Kanban } from 'lucide-react';

export default function ConfiguracoesView({ 
  profile, onUpdateProfile,
  plans, onAddPlan, onEditPlan, onRemovePlan,
  modules, onAddModule, onEditModule, onRemoveModule,
  offers, onAddOffer, onEditOffer, onRemoveOffer,
  stages, onAddStage, onEditStage, onRemoveStage, onReorderStages
}) {
  const [activeTab, setActiveTab] = useState('perfil');
  const fileInputRef = useRef(null);

  // Profile
  const [profileName, setProfileName] = useState(profile.name);
  const [profileRole, setProfileRole] = useState(profile.role);
  const [profileAvatar, setProfileAvatar] = useState(profile.avatarUrl || '');

  // Inline add states
  const [addingPlan, setAddingPlan] = useState(false);
  const [newPlanName, setNewPlanName] = useState('');
  const [addingModule, setAddingModule] = useState(false);
  const [newModuleName, setNewModuleName] = useState('');
  const [addingOffer, setAddingOffer] = useState(false);
  const [newOfferName, setNewOfferName] = useState('');
  const [addingStage, setAddingStage] = useState(false);
  const [newStageName, setNewStageName] = useState('');

  // Edit states
  const [editingPlanId, setEditingPlanId] = useState(null);
  const [editPlanName, setEditPlanName] = useState('');
  const [editingModuleId, setEditingModuleId] = useState(null);
  const [editModuleName, setEditModuleName] = useState('');
  const [editingOfferId, setEditingOfferId] = useState(null);
  const [editOfferName, setEditOfferName] = useState('');
  const [editingStage, setEditingStage] = useState(null);
  const [editStageName, setEditStageName] = useState('');

  // Drag state for stages
  const [draggedStage, setDraggedStage] = useState(null);
  const [dragOverStage, setDragOverStage] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) setProfileAvatar(URL.createObjectURL(file));
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    onUpdateProfile({
      name: profileName, role: profileRole, avatarUrl: profileAvatar,
      avatarInitials: profileName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    });
    alert('Perfil atualizado com sucesso!');
  };

  // Inline add handlers with Enter/Esc support
  const handleKeyDownInlineAdd = (e, confirmFn, cancelFn) => {
    if (e.key === 'Enter') { e.preventDefault(); confirmFn(); }
    if (e.key === 'Escape') cancelFn();
  };

  // Plans
  const confirmAddPlan = () => {
    if (!newPlanName.trim()) return;
    onAddPlan({ id: `plan_${Date.now()}`, name: newPlanName });
    setNewPlanName(''); setAddingPlan(false);
  };

  // Modules
  const confirmAddModule = () => {
    if (!newModuleName.trim()) return;
    onAddModule({ id: `mod_${Date.now()}`, name: newModuleName });
    setNewModuleName(''); setAddingModule(false);
  };

  // Offers
  const confirmAddOffer = () => {
    if (!newOfferName.trim()) return;
    onAddOffer({ id: `off_${Date.now()}`, name: newOfferName });
    setNewOfferName(''); setAddingOffer(false);
  };

  // Stages
  const confirmAddStage = () => {
    if (!newStageName.trim()) return;
    onAddStage(newStageName);
    setNewStageName(''); setAddingStage(false);
  };

  const confirmEditStage = () => {
    if (!editStageName.trim()) return;
    onEditStage(editingStage, editStageName);
    setEditingStage(null);
  };

  // Drag reorder for stages
  const handleStageDragStart = (e, stage) => {
    setDraggedStage(stage);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleStageDragOver = (e, stage) => {
    e.preventDefault();
    setDragOverStage(stage);
  };

  const handleStageDrop = (e, targetStage) => {
    e.preventDefault();
    if (!draggedStage || draggedStage === targetStage) {
      setDraggedStage(null); setDragOverStage(null); return;
    }
    const newOrder = [...stages];
    const fromIdx = newOrder.indexOf(draggedStage);
    const toIdx = newOrder.indexOf(targetStage);
    newOrder.splice(fromIdx, 1);
    newOrder.splice(toIdx, 0, draggedStage);
    onReorderStages(newOrder);
    setDraggedStage(null); setDragOverStage(null);
  };

  const tabs = [
    { id: 'perfil', label: 'Meu Perfil', icon: User },
    { id: 'kanban', label: 'Kanban', icon: Kanban },
    { id: 'planos', label: 'Planos', icon: Layers },
    { id: 'modulos', label: 'Módulos', icon: Box },
    { id: 'ofertas', label: 'Ofertas', icon: Tag },
  ];

  const renderInlineListSection = ({
    title, items, getKey, getName,
    editingId, editName, setEditName, onStartEdit, onConfirmEdit, onCancelEdit, onRemove,
    addingKey, isAdding, setIsAdding, newName, setNewName, onConfirmAdd
  }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 className="section-title">{title}</h3>
        {!isAdding && (
          <button className="btn-primary" style={{ padding: '8px 14px', fontSize: '13px' }} onClick={() => setIsAdding(true)}>
            <Plus size={14} /><span>Adicionar</span>
          </button>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {items.map(item => {
          const isEditingThis = editingId === getKey(item);
          return (
            <div key={getKey(item)} className="settings-list-item">
              {!isEditingThis ? (
                <>
                  <span style={{ fontWeight: '500' }}>{getName(item)}</span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn-icon" onClick={() => { onStartEdit(item); }} title="Editar"><Edit2 size={14} /></button>
                    <button className="btn-danger-icon" onClick={() => onRemove(getKey(item))} title="Remover"><Trash2 size={14} /></button>
                  </div>
                </>
              ) : (
                <div style={{ display: 'flex', width: '100%', gap: '12px', alignItems: 'center' }}>
                  <input
                    type="text" className="form-input" style={{ flex: 1 }}
                    value={editName} onChange={e => setEditName(e.target.value)}
                    autoFocus
                    onKeyDown={e => { if (e.key === 'Enter') onConfirmEdit(getKey(item)); if (e.key === 'Escape') onCancelEdit(); }}
                  />
                  <button className="btn-icon" style={{ color: 'var(--green-primary)' }} onClick={() => onConfirmEdit(getKey(item))}><Check size={14} /></button>
                  <button className="btn-icon" style={{ color: 'var(--badge-red)' }} onClick={onCancelEdit}><X size={14} /></button>
                </div>
              )}
            </div>
          );
        })}

        {items.length === 0 && !isAdding && (
          <div className="empty-state"><span className="empty-state-icon">📋</span><p>Nenhum item cadastrado. Clique em Adicionar.</p></div>
        )}

        {/* Inline Add Row */}
        {isAdding && (
          <div className="settings-inline-add-row">
            <input
              type="text" className="form-input" style={{ flex: 1 }}
              value={newName} onChange={e => setNewName(e.target.value)}
              placeholder="Nome do novo item..."
              autoFocus
              onKeyDown={e => handleKeyDownInlineAdd(e, onConfirmAdd, () => { setIsAdding(false); setNewName(''); })}
            />
            <button className="btn-icon" style={{ color: 'var(--green-primary)' }} onClick={onConfirmAdd}><Check size={16} /></button>
            <button className="btn-icon" style={{ color: 'var(--badge-red)' }} onClick={() => { setIsAdding(false); setNewName(''); }}><X size={16} /></button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%' }}>
      {/* Tabs */}
      <div className="tabs-bar">
        {tabs.map(tab => (
          <button key={tab.id} className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`} onClick={() => setActiveTab(tab.id)}>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="settings-layout">

        {/* Tab: Perfil */}
        {activeTab === 'perfil' && (
          <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <h3 className="section-title">Meu Perfil de Especialista</h3>
            <div className="profile-setup">
              <div className="profile-avatar-upload" onClick={() => fileInputRef.current.click()} title="Clique para trocar foto">
                {profileAvatar ? (
                  <img src={profileAvatar} alt="Profile" />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'var(--text-secondary)' }}>
                    <Camera size={20} /><span className="upload-text">Upload</span>
                  </div>
                )}
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" style={{ display: 'none' }} />
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Nome Completo</label>
                  <input type="text" className="form-input" value={profileName} onChange={e => setProfileName(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Cargo / Função</label>
                  <input type="text" className="form-input" value={profileRole} onChange={e => setProfileRole(e.target.value)} required />
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
              <button type="submit" className="btn-primary">Salvar Perfil</button>
            </div>
          </form>
        )}

        {/* Tab: Kanban Stages */}
        {activeTab === 'kanban' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 className="section-title">Etapas do Kanban</h3>
              {!addingStage && (
                <button className="btn-primary" style={{ padding: '8px 14px', fontSize: '13px' }} onClick={() => setAddingStage(true)}>
                  <Plus size={14} /><span>Nova Etapa</span>
                </button>
              )}
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '-8px' }}>
              Arraste as etapas para reordenar. As mudanças são aplicadas ao quadro em tempo real.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {stages.map(stage => {
                const isEditingThis = editingStage === stage;
                const isDraggedOver = dragOverStage === stage;
                return (
                  <div
                    key={stage}
                    className="settings-kanban-stage-row"
                    draggable
                    onDragStart={e => handleStageDragStart(e, stage)}
                    onDragOver={e => handleStageDragOver(e, stage)}
                    onDrop={e => handleStageDrop(e, stage)}
                    onDragEnd={() => { setDraggedStage(null); setDragOverStage(null); }}
                    style={{ opacity: draggedStage === stage ? 0.4 : 1, border: isDraggedOver ? '1px solid var(--green-primary)' : '1px solid var(--border-color)' }}
                  >
                    <GripVertical size={16} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
                    {!isEditingThis ? (
                      <>
                        <span style={{ flex: 1, fontWeight: '500' }}>{stage}</span>
                        <button className="btn-icon" onClick={() => { setEditingStage(stage); setEditStageName(stage); }} title="Editar"><Edit2 size={14} /></button>
                        <button className="btn-danger-icon" onClick={() => { if (window.confirm(`Remover a etapa "${stage}"?`)) onRemoveStage(stage); }} title="Remover"><Trash2 size={14} /></button>
                      </>
                    ) : (
                      <>
                        <input
                          type="text" className="form-input" style={{ flex: 1 }}
                          value={editStageName} onChange={e => setEditStageName(e.target.value)}
                          autoFocus
                          onKeyDown={e => { if (e.key === 'Enter') confirmEditStage(); if (e.key === 'Escape') setEditingStage(null); }}
                        />
                        <button className="btn-icon" style={{ color: 'var(--green-primary)' }} onClick={confirmEditStage}><Check size={14} /></button>
                        <button className="btn-icon" style={{ color: 'var(--badge-red)' }} onClick={() => setEditingStage(null)}><X size={14} /></button>
                      </>
                    )}
                  </div>
                );
              })}

              {stages.length === 0 && !addingStage && (
                <div className="empty-state"><span className="empty-state-icon">📋</span><p>Nenhuma etapa configurada.</p></div>
              )}

              {addingStage && (
                <div className="settings-inline-add-row">
                  <input
                    type="text" className="form-input" style={{ flex: 1 }}
                    value={newStageName} onChange={e => setNewStageName(e.target.value)}
                    placeholder="Nome da nova etapa..."
                    autoFocus
                    onKeyDown={e => handleKeyDownInlineAdd(e, confirmAddStage, () => { setAddingStage(false); setNewStageName(''); })}
                  />
                  <button className="btn-icon" style={{ color: 'var(--green-primary)' }} onClick={confirmAddStage}><Check size={16} /></button>
                  <button className="btn-icon" style={{ color: 'var(--badge-red)' }} onClick={() => { setAddingStage(false); setNewStageName(''); }}><X size={16} /></button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab: Planos */}
        {activeTab === 'planos' && renderInlineListSection({
          title: 'Gerenciar Planos', items: plans,
          getKey: p => p.id, getName: p => p.name,
          editingId: editingPlanId, editName: editPlanName, setEditName: setEditPlanName,
          onStartEdit: (p) => { setEditingPlanId(p.id); setEditPlanName(p.name); },
          onConfirmEdit: (id) => { onEditPlan(id, editPlanName); setEditingPlanId(null); },
          onCancelEdit: () => setEditingPlanId(null),
          onRemove: onRemovePlan,
          isAdding: addingPlan, setIsAdding: setAddingPlan,
          newName: newPlanName, setNewName: setNewPlanName,
          onConfirmAdd: confirmAddPlan
        })}

        {/* Tab: Módulos */}
        {activeTab === 'modulos' && renderInlineListSection({
          title: 'Gerenciar Módulos', items: modules,
          getKey: m => m.id, getName: m => m.name,
          editingId: editingModuleId, editName: editModuleName, setEditName: setEditModuleName,
          onStartEdit: (m) => { setEditingModuleId(m.id); setEditModuleName(m.name); },
          onConfirmEdit: (id) => { onEditModule(id, editModuleName); setEditingModuleId(null); },
          onCancelEdit: () => setEditingModuleId(null),
          onRemove: onRemoveModule,
          isAdding: addingModule, setIsAdding: setAddingModule,
          newName: newModuleName, setNewName: setNewModuleName,
          onConfirmAdd: confirmAddModule
        })}

        {/* Tab: Ofertas */}
        {activeTab === 'ofertas' && renderInlineListSection({
          title: 'Gerenciar Ofertas de Upsell', items: offers,
          getKey: o => o.id, getName: o => o.name,
          editingId: editingOfferId, editName: editOfferName, setEditName: setEditOfferName,
          onStartEdit: (o) => { setEditingOfferId(o.id); setEditOfferName(o.name); },
          onConfirmEdit: (id) => { onEditOffer(id, editOfferName); setEditingOfferId(null); },
          onCancelEdit: () => setEditingOfferId(null),
          onRemove: onRemoveOffer,
          isAdding: addingOffer, setIsAdding: setAddingOffer,
          newName: newOfferName, setNewName: setNewOfferName,
          onConfirmAdd: confirmAddOffer
        })}
      </div>
    </div>
  );
}
