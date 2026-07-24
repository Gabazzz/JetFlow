import { supabase } from '../lib/supabase';
import { 
  initialProfile, 
  initialPlans, 
  initialModules, 
  initialAvailableOffers, 
  initialStages 
} from '../data/data';

// ============================================================
// PROFILE SERVICE
// ============================================================
export async function getProfileService(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error || !data) {
    return initialProfile;
  }
  return {
    name: data.name || initialProfile.name,
    role: data.role || initialProfile.role,
    avatarInitials: data.avatar_initials || 'CX',
    avatarUrl: data.avatar_url || ''
  };
}

export async function updateProfileService(userId, profileData) {
  const initials = profileData.name
    ? profileData.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'CX';

  const { data, error } = await supabase
    .from('profiles')
    .upsert({
      id: userId,
      name: profileData.name,
      role: profileData.role,
      avatar_initials: initials,
      avatar_url: profileData.avatarUrl || null,
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    console.error('Error updating profile in Supabase:', error);
    throw error;
  }
  return {
    name: data.name,
    role: data.role,
    avatarInitials: data.avatar_initials,
    avatarUrl: data.avatar_url || ''
  };
}

// ============================================================
// OPTIONS & SUPPORT TABLES SERVICE (Plans, Modules, Offers, Stages)
// ============================================================
export async function getPlansService() {
  const { data, error } = await supabase.from('plans').select('*').order('name');
  if (error || !data || data.length === 0) {
    return initialPlans;
  }
  return data;
}

export async function addPlanService(planObj) {
  const { data, error } = await supabase
    .from('plans')
    .insert({ id: planObj.id || `plan_${Date.now()}`, name: planObj.name })
    .select();
  if (error) throw error;
  return data[0];
}

export async function editPlanService(id, newName) {
  const { data, error } = await supabase
    .from('plans')
    .update({ name: newName })
    .eq('id', id)
    .select();
  if (error) throw error;
  return data[0];
}

export async function removePlanService(id) {
  const { error } = await supabase.from('plans').delete().eq('id', id);
  if (error) throw error;
}

export async function getModulesService() {
  const { data, error } = await supabase.from('modules').select('*').order('name');
  if (error || !data || data.length === 0) {
    return initialModules;
  }
  return data;
}

export async function addModuleService(moduleObj) {
  const { data, error } = await supabase
    .from('modules')
    .insert({ 
      id: moduleObj.id || `mod_${Date.now()}`, 
      name: moduleObj.name, 
      emoji: moduleObj.emoji || '📦' 
    })
    .select();
  if (error) throw error;
  return data[0];
}

export async function editModuleService(id, updates) {
  const updatePayload = typeof updates === 'string' ? { name: updates } : updates;
  const { data, error } = await supabase
    .from('modules')
    .update(updatePayload)
    .eq('id', id)
    .select();
  if (error) throw error;
  return data[0];
}

export async function removeModuleService(id) {
  const { error } = await supabase.from('modules').delete().eq('id', id);
  if (error) throw error;
}

export async function getOffersService() {
  const { data, error } = await supabase.from('available_offers').select('*').order('name');
  if (error || !data || data.length === 0) {
    return initialAvailableOffers;
  }
  return data;
}

export async function addOfferService(offerObj) {
  const { data, error } = await supabase
    .from('available_offers')
    .insert({ id: offerObj.id || `off_${Date.now()}`, name: offerObj.name })
    .select();
  if (error) throw error;
  return data[0];
}

export async function editOfferService(id, newName) {
  const { data, error } = await supabase
    .from('available_offers')
    .update({ name: newName })
    .eq('id', id)
    .select();
  if (error) throw error;
  return data[0];
}

export async function removeOfferService(id) {
  const { error } = await supabase.from('available_offers').delete().eq('id', id);
  if (error) throw error;
}

export async function getStagesService() {
  const { data, error } = await supabase.from('stages').select('*').order('position');
  if (error || !data || data.length === 0) {
    return initialStages;
  }
  return data.map(s => s.name);
}

export async function addStageService(stageName) {
  const { data, error } = await supabase
    .from('stages')
    .insert({ 
      id: `stg_${Date.now()}`, 
      name: stageName, 
      position: Date.now() 
    })
    .select();
  if (error) throw error;
  return data[0].name;
}

export async function editStageService(oldName, newName) {
  const { error } = await supabase
    .from('stages')
    .update({ name: newName })
    .eq('name', oldName);
  if (error) throw error;

  // Also update clients with this stage
  await supabase
    .from('clients')
    .update({ stage: newName })
    .eq('stage', oldName);
}

export async function removeStageService(stageName) {
  const { error } = await supabase.from('stages').delete().eq('name', stageName);
  if (error) throw error;
}

export async function reorderStagesService(newStagesList) {
  // Update positions in Supabase
  for (let i = 0; i < newStagesList.length; i++) {
    const sName = newStagesList[i];
    await supabase
      .from('stages')
      .update({ position: i + 1 })
      .eq('name', sName);
  }
}

// ============================================================
// CLIENTS & RELATED SUB-RECORDS SERVICE (Strict RLS by owner_id)
// ============================================================
export async function getClientsService(userId) {
  if (!userId) return [];

  // Fetch clients for logged in user
  const { data: clientsData, error: clientErr } = await supabase
    .from('clients')
    .select('*')
    .eq('owner_id', userId)
    .order('created_at', { ascending: false });

  if (clientErr) {
    console.error('Error fetching clients from Supabase:', clientErr);
    return [];
  }

  if (!clientsData || clientsData.length === 0) {
    return [];
  }

  const clientIds = clientsData.map(c => c.id);

  // Fetch sub-records concurrently
  const [
    { data: modulesData },
    { data: checklistsData },
    { data: remindersData },
    { data: contactsData },
    { data: activityData }
  ] = await Promise.all([
    supabase.from('client_modules').select('*').in('client_id', clientIds),
    supabase.from('checklists').select('*').in('client_id', clientIds),
    supabase.from('reminders').select('*').in('client_id', clientIds),
    supabase.from('last_contacts').select('*').in('client_id', clientIds).order('created_at', { ascending: false }),
    supabase.from('activity_history').select('*').in('client_id', clientIds).order('created_at', { ascending: false })
  ]);

  // Combine into client domain models
  return clientsData.map(client => {
    const activeMods = (modulesData || [])
      .filter(m => m.client_id === client.id)
      .map(m => m.module_name);

    // Group checklists by module_name
    const checklistsMap = {};
    (checklistsData || [])
      .filter(c => c.client_id === client.id)
      .forEach(item => {
        if (!checklistsMap[item.module_name]) {
          checklistsMap[item.module_name] = [];
        }
        checklistsMap[item.module_name].push({
          id: item.id,
          label: item.label,
          checked: item.checked
        });
      });

    const remindersList = (remindersData || [])
      .filter(r => r.client_id === client.id)
      .map(r => ({
        id: r.id,
        title: r.title,
        description: r.description,
        deadline: r.deadline,
        criticality: r.criticality
      }));

    const lastContactsList = (contactsData || [])
      .filter(c => c.client_id === client.id)
      .map(c => ({
        id: c.id,
        date: c.date,
        obs: c.obs
      }));

    const activityList = (activityData || [])
      .filter(a => a.client_id === client.id)
      .map(a => ({
        id: a.id,
        avatar: a.avatar,
        name: a.name,
        action: a.action,
        date: a.date,
        isObservation: a.is_observation
      }));

    return {
      id: client.id,
      owner_id: client.owner_id,
      name: client.name,
      phone: client.phone || '',
      whatsapp: client.whatsapp || '',
      email: client.email || '',
      cnpj: client.cnpj || '',
      entryDate: client.entry_date || '',
      responsible: client.responsible || '',
      plan: client.plan || '',
      activeModules: activeMods,
      criticality: client.criticality || 'Estável',
      criticalityJustification: client.criticality_justification || '',
      observations: client.observations || '',
      stage: client.stage || 'Novo',
      nextAction: client.next_action || '',
      nextContactDate: client.next_contact_date || '',
      quickLinks: client.quick_links || {},
      checklists: checklistsMap,
      reminders: remindersList,
      lastContacts: lastContactsList,
      activityHistory: activityList
    };
  });
}

export async function createClientService(userId, clientInput, defaultChecklistTemplates = {}) {
  if (!userId) throw new Error('Usuário não autenticado.');

  const clientPayload = {
    owner_id: userId,
    name: clientInput.name,
    phone: clientInput.phone || '',
    whatsapp: clientInput.whatsapp || '',
    email: clientInput.email || '',
    cnpj: clientInput.cnpj || '',
    entry_date: clientInput.entryDate || new Date().toLocaleDateString('pt-BR'),
    responsible: clientInput.responsible || '',
    plan: clientInput.plan || '',
    criticality: clientInput.criticality || 'Estável',
    criticality_justification: clientInput.criticalityJustification || '',
    observations: clientInput.observations || '',
    stage: clientInput.stage || 'Novo',
    next_action: clientInput.nextAction || '',
    next_contact_date: clientInput.nextContactDate || '',
    quick_links: clientInput.quickLinks || {}
  };

  const { data: newClient, error: clientErr } = await supabase
    .from('clients')
    .insert(clientPayload)
    .select()
    .single();

  if (clientErr) {
    console.error('Error creating client in Supabase:', clientErr);
    throw clientErr;
  }

  const clientId = newClient.id;

  // Insert active modules & default checklists
  const activeModules = clientInput.activeModules || [];
  if (activeModules.length > 0) {
    const modulesPayload = activeModules.map(modName => ({
      client_id: clientId,
      owner_id: userId,
      module_name: modName
    }));
    await supabase.from('client_modules').insert(modulesPayload);

    // Insert checklist items based on template
    const checklistsToInsert = [];
    activeModules.forEach(modName => {
      const template = defaultChecklistTemplates[modName] || [];
      template.forEach(item => {
        checklistsToInsert.push({
          client_id: clientId,
          owner_id: userId,
          module_name: modName,
          label: item.label,
          checked: item.checked || false
        });
      });
    });

    if (checklistsToInsert.length > 0) {
      await supabase.from('checklists').insert(checklistsToInsert);
    }
  }

  // Insert initial activity history
  const userProfile = await getProfileService(userId);
  await supabase.from('activity_history').insert({
    client_id: clientId,
    owner_id: userId,
    avatar: userProfile.avatarInitials || 'CX',
    name: userProfile.name || 'Especialista CX',
    action: 'Criou o cliente no sistema',
    date: `${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
    is_observation: false
  });

  return clientId;
}

export async function updateClientService(clientId, updates) {
  const payload = {};
  if (updates.name !== undefined) payload.name = updates.name;
  if (updates.phone !== undefined) payload.phone = updates.phone;
  if (updates.whatsapp !== undefined) payload.whatsapp = updates.whatsapp;
  if (updates.email !== undefined) payload.email = updates.email;
  if (updates.cnpj !== undefined) payload.cnpj = updates.cnpj;
  if (updates.entryDate !== undefined) payload.entry_date = updates.entryDate;
  if (updates.responsible !== undefined) payload.responsible = updates.responsible;
  if (updates.plan !== undefined) payload.plan = updates.plan;
  if (updates.criticality !== undefined) payload.criticality = updates.criticality;
  if (updates.criticalityJustification !== undefined) payload.criticality_justification = updates.criticalityJustification;
  if (updates.observations !== undefined) payload.observations = updates.observations;
  if (updates.stage !== undefined) payload.stage = updates.stage;
  if (updates.nextAction !== undefined) payload.next_action = updates.nextAction;
  if (updates.nextContactDate !== undefined) payload.next_contact_date = updates.nextContactDate;
  if (updates.quickLinks !== undefined) payload.quick_links = updates.quickLinks;
  payload.updated_at = new Date().toISOString();

  const { error } = await supabase
    .from('clients')
    .update(payload)
    .eq('id', clientId);

  if (error) throw error;
}

export async function deleteClientService(clientId) {
  const { error } = await supabase.from('clients').delete().eq('id', clientId);
  if (error) throw error;
}

export async function toggleChecklistService(clientId, userId, moduleName, itemLabel, newCheckedState) {
  const { data: existing } = await supabase
    .from('checklists')
    .select('id')
    .eq('client_id', clientId)
    .eq('module_name', moduleName)
    .eq('label', itemLabel)
    .maybeSingle();

  if (existing) {
    await supabase
      .from('checklists')
      .update({ checked: newCheckedState })
      .eq('id', existing.id);
  } else {
    await supabase
      .from('checklists')
      .insert({
        client_id: clientId,
        owner_id: userId,
        module_name: moduleName,
        label: itemLabel,
        checked: newCheckedState
      });
  }
}

export async function addReminderService(clientId, userId, reminderData) {
  const { data, error } = await supabase
    .from('reminders')
    .insert({
      client_id: clientId,
      owner_id: userId,
      title: reminderData.title,
      description: reminderData.description || '',
      deadline: reminderData.deadline || '',
      criticality: reminderData.criticality || 'Normal'
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function removeReminderService(reminderId) {
  const { error } = await supabase.from('reminders').delete().eq('id', reminderId);
  if (error) throw error;
}

export async function addLastContactService(clientId, userId, obsText) {
  const dateStr = new Date().toLocaleDateString('pt-BR');
  const { data, error } = await supabase
    .from('last_contacts')
    .insert({
      client_id: clientId,
      owner_id: userId,
      date: dateStr,
      obs: obsText
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function addActivityHistoryService(clientId, userId, actionText, isObservation = false) {
  const userProfile = await getProfileService(userId);
  const nowStr = `${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;

  const { data, error } = await supabase
    .from('activity_history')
    .insert({
      client_id: clientId,
      owner_id: userId,
      avatar: userProfile.avatarInitials || 'CX',
      name: userProfile.name || 'Especialista CX',
      action: actionText,
      date: nowStr,
      is_observation: isObservation
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}
