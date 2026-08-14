import React, { useState, useRef } from 'react';
import { User, Layers, Tag, Box, Plus, Trash2, Edit2, Check, X, Camera, GripVertical, Kanban, LogOut, ChevronDown, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

export default function ConfiguracoesView({
  profile, onUpdateProfile,
  accountEmail, onSignOut,
  plans, onAddPlan, onEditPlan, onRemovePlan,
  modules, onAddModule, onEditModule, onRemoveModule, onUpdateModuleChecklist,
  offers, onAddOffer, onEditOffer, onRemoveOffer,
  stages, onAddStage, onEditStage, onRemoveStage, onReorderStages
}) {
  const [activeTab, setActiveTab] = useState('perfil');
  const fileInputRef = useRef(null);

  // Profile
  const [profileName, setProfileName] = useState(profile.name);
  const [profileRole, setProfileRole] = useState(profile.role);
  const [profileAvatar, setProfileAvatar] = useState(profile.avatarUrl || '');
  const [profileSaved, setProfileSaved] = useState(false);

  // Password change (real, via Supabase Auth — separate from the profile save above)
  const [newPassword, setNewPassword] = useState('');
  const [passwordStatus, setPasswordStatus] = useState(''); // '' | 'saving' | 'saved' | error message

  // Inline add states
  const [addingPlan, setAddingPlan] = useState(false);
  const [newPlanName, setNewPlanName] = useState('');
  const [addingModule, setAddingModule] = useState(false);
  const [newModuleName, setNewModuleName] = useState('');
  const [expandedModuleId, setExpandedModuleId] = useState(null);
  const [newStepText, setNewStepText] = useState('');
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
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2000);
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
            <div key={getKey(item)} className={`settings-list-item ${isEditingThis ? 'edit-mode-active' : ''}`}>
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

            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '12px', marginTop: '12px' }}>
              {profileSaved && <span style={{ fontSize: '12px', color: 'var(--badge-green)', fontWeight: '600' }}>Salvo!</span>}
              <button type="submit" className="btn-primary">Salvar Perfil</button>
            </div>
          </form>
        )}

        {activeTab === 'perfil' && (
          <div style={{ paddingTop: '24px', marginTop: '24px', borderTop: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <h3 className="section-title" style={{ fontSize: '14px' }}>Acesso e Login</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Sua conta é privada — só você vê os clientes cadastrados nela.
              </p>
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">E-mail</label>
                <input type="email" className="form-input" value={accountEmail || ''} disabled />
              </div>
              <div className="form-group">
                <label className="form-label">Nova senha</label>
                <input
                  type="password"
                  className="form-input"
                  value={newPassword}
                  onChange={e => { setNewPassword(e.target.value); setPasswordStatus(''); }}
                  placeholder="Deixe em branco para manter a atual"
                  minLength={6}
                />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  disabled={!newPassword.trim() || passwordStatus === 'saving'}
                  onClick={async () => {
                    setPasswordStatus('saving');
                    const { error } = await supabase.auth.updateUser({ password: newPassword });
                    if (error) { setPasswordStatus(error.message); return; }
                    setNewPassword('');
                    setPasswordStatus('saved');
                  }}
                >
                  Atualizar senha
                </button>
                {passwordStatus === 'saved' && <span style={{ fontSize: '12px', color: 'var(--badge-green)', fontWeight: '600' }}>Senha atualizada!</span>}
                {passwordStatus && passwordStatus !== 'saving' && passwordStatus !== 'saved' && (
                  <span style={{ fontSize: '12px', color: 'var(--badge-red)' }}>{passwordStatus}</span>
                )}
              </div>
              <button type="button" className="btn-secondary" style={{ color: 'var(--badge-red)', borderColor: 'rgba(239, 68, 68, 0.3)' }} onClick={onSignOut}>
                <LogOut size={13} />
                <span>Sair da conta</span>
              </button>
            </div>
          </div>
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
                    className={`settings-kanban-stage-row ${isEditingThis ? 'edit-mode-active' : ''}`}
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
        {activeTab === 'modulos' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 className="section-title">Gerenciar Módulos</h3>
              {!addingModule && (
                <button className="btn-primary" style={{ padding: '8px 14px', fontSize: '13px' }} onClick={() => setAddingModule(true)}>
                  <Plus size={14} /><span>Adicionar</span>
                </button>
              )}
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '-8px' }}>
              Clique em um módulo para configurar as etapas do checklist de implantação dele. É esse checklist que aparece no Detalhe do Cliente e na Nota de Reunião.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {modules.map(mod => {
                const isEditingThis = editingModuleId === mod.id;
                const isExpanded = expandedModuleId === mod.id;
                const checklist = mod.checklist || [];

                const addStep = () => {
                  if (!newStepText.trim()) return;
                  onUpdateModuleChecklist(mod.id, [...checklist, { label: newStepText.trim(), checked: false }]);
                  setNewStepText('');
                };

                return (
                  <div
                    key={mod.id}
                    className={`settings-list-item ${isEditingThis ? 'edit-mode-active' : ''}`}
                    style={{ flexDirection: 'column', alignItems: 'stretch', gap: isExpanded ? '14px' : 0 }}
                  >
                    {!isEditingThis ? (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                        <button
                          type="button"
                          onClick={() => { setExpandedModuleId(isExpanded ? null : mod.id); setNewStepText(''); }}
                          style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 0, flex: 1, textAlign: 'left' }}
                        >
                          {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                          <span style={{ fontWeight: '500' }}>{mod.name}</span>
                          <span style={{ fontSize: '11px', color: '#666' }}>({checklist.length} etapa{checklist.length !== 1 ? 's' : ''})</span>
                        </button>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button className="btn-icon" onClick={() => { setEditingModuleId(mod.id); setEditModuleName(mod.name); }} title="Renomear"><Edit2 size={14} /></button>
                          <button className="btn-danger-icon" onClick={() => onRemoveModule(mod.id)} title="Remover"><Trash2 size={14} /></button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', width: '100%', gap: '12px', alignItems: 'center' }}>
                        <input
                          type="text" className="form-input" style={{ flex: 1 }}
                          value={editModuleName} onChange={e => setEditModuleName(e.target.value)}
                          autoFocus
                          onKeyDown={e => { if (e.key === 'Enter') { onEditModule(mod.id, editModuleName); setEditingModuleId(null); } if (e.key === 'Escape') setEditingModuleId(null); }}
                        />
                        <button className="btn-icon" style={{ color: 'var(--green-primary)' }} onClick={() => { onEditModule(mod.id, editModuleName); setEditingModuleId(null); }}><Check size={14} /></button>
                        <button className="btn-icon" style={{ color: 'var(--badge-red)' }} onClick={() => setEditingModuleId(null)}><X size={14} /></button>
                      </div>
                    )}

                    {isExpanded && (
                      <div style={{ paddingLeft: '22px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {checklist.length === 0 && (
                          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Nenhuma etapa configurada ainda.</span>
                        )}
                        {checklist.map((step, idx) => (
                          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <input
                              type="text" className="form-input" style={{ flex: 1, fontSize: '13px' }}
                              value={step.label}
                              onChange={e => {
                                const updated = checklist.map((s, i) => i === idx ? { ...s, label: e.target.value } : s);
                                onUpdateModuleChecklist(mod.id, updated);
                              }}
                            />
                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#888', whiteSpace: 'nowrap', cursor: 'pointer' }}>
                              <input
                                type="checkbox" className="premium-check"
                                checked={!!step.checked}
                                onChange={() => {
                                  const updated = checklist.map((s, i) => i === idx ? { ...s, checked: !s.checked } : s);
                                  onUpdateModuleChecklist(mod.id, updated);
                                }}
                              />
                              Já vem marcado
                            </label>
                            <button
                              className="btn-danger-icon"
                              onClick={() => onUpdateModuleChecklist(mod.id, checklist.filter((_, i) => i !== idx))}
                              title="Remover etapa"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        ))}
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <input
                            type="text" className="form-input" style={{ flex: 1 }}
                            placeholder="Nova etapa..."
                            value={newStepText}
                            onChange={e => setNewStepText(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addStep(); } }}
                          />
                          <button type="button" className="btn-secondary" onClick={addStep}>
                            <Plus size={14} /><span>Adicionar etapa</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {modules.length === 0 && !addingModule && (
                <div className="empty-state"><span className="empty-state-icon">📋</span><p>Nenhum módulo cadastrado. Clique em Adicionar.</p></div>
              )}

              {addingModule && (
                <div className="settings-inline-add-row">
                  <input
                    type="text" className="form-input" style={{ flex: 1 }}
                    value={newModuleName} onChange={e => setNewModuleName(e.target.value)}
                    placeholder="Nome do novo módulo..."
                    autoFocus
                    onKeyDown={e => handleKeyDownInlineAdd(e, confirmAddModule, () => { setAddingModule(false); setNewModuleName(''); })}
                  />
                  <button className="btn-icon" style={{ color: 'var(--green-primary)' }} onClick={confirmAddModule}><Check size={16} /></button>
                  <button className="btn-icon" style={{ color: 'var(--badge-red)' }} onClick={() => { setAddingModule(false); setNewModuleName(''); }}><X size={16} /></button>
                </div>
              )}
            </div>
          </div>
        )}

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
