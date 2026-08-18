import { supabase } from './supabaseClient';

// ============================================================
// Supabase <-> JetFlow data mapping.
//
// The DB schema mirrors the app's existing JS shapes closely: first-class
// queryable fields become real columns, everything nested/variable-shaped
// (checklists, quick links, activity history, etc.) stays as JSONB on the
// client row itself — same object shape the components already expect, so
// nothing downstream of App.jsx's state needs to change.
// ============================================================

export function clientFromRow(row) {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    whatsapp: row.whatsapp,
    email: row.email,
    cnpj: row.cnpj,
    entryDate: row.entry_date,
    responsible: row.responsible,
    plan: row.plan,
    activeModules: row.active_modules || [],
    criticality: row.criticality,
    criticalityJustification: row.criticality_justification,
    contractType: row.contract_type,
    connections: row.connections,
    users: row.users_count,
    usersEstimated: row.users_estimated,
    observations: row.observations,
    stage: row.stage,
    nextAction: row.next_action,
    nextContactDate: row.next_contact_date,
    lastUpdated: row.last_updated || {},
    lastContacts: row.last_contacts || [],
    activityHistory: row.activity_history || [],
    checklists: row.checklists || {},
    checklistBaseline: row.checklist_baseline || {},
    reminders: row.reminders || [],
    quickLinks: row.quick_links || {},
    meetings: row.meetings || [],
    tasks: row.tasks || [],
    interestOffers: row.interest_offers || [],
    meetingNotesCount: row.meeting_notes_count || 0
  };
}

export function clientToRow(client, userId) {
  return {
    id: client.id,
    user_id: userId,
    name: client.name || '',
    phone: client.phone || '',
    whatsapp: client.whatsapp || '',
    email: client.email || '',
    cnpj: client.cnpj || '',
    entry_date: client.entryDate || '',
    responsible: client.responsible || '',
    plan: client.plan || '',
    active_modules: client.activeModules || [],
    criticality: client.criticality || 'Estável',
    criticality_justification: client.criticalityJustification || '',
    contract_type: client.contractType || '',
    connections: client.connections ?? null,
    users_count: client.users ?? null,
    users_estimated: !!client.usersEstimated,
    observations: client.observations || '',
    stage: client.stage || 'Novo',
    next_action: client.nextAction || '',
    next_contact_date: client.nextContactDate || '',
    last_updated: client.lastUpdated || {},
    last_contacts: client.lastContacts || [],
    activity_history: client.activityHistory || [],
    checklists: client.checklists || {},
    checklist_baseline: client.checklistBaseline || {},
    reminders: client.reminders || [],
    quick_links: client.quickLinks || {},
    meetings: client.meetings || [],
    tasks: client.tasks || [],
    interest_offers: client.interestOffers || [],
    meeting_notes_count: client.meetingNotesCount || 0
  };
}

export function ticketFromRow(row) {
  return {
    id: row.id,
    clientId: row.client_id,
    subject: row.subject,
    description: row.description,
    priority: row.priority,
    status: row.status,
    createdDate: row.created_date,
    origem: row.origem,
    discordUrl: row.discord_url,
    resolutionNote: row.resolution_note || ''
  };
}

export function ticketToRow(t, userId) {
  return {
    id: t.id,
    user_id: userId,
    client_id: t.clientId,
    subject: t.subject || '',
    description: t.description || '',
    priority: t.priority || 'Normal',
    status: t.status || 'Aberto',
    created_date: t.createdDate || '',
    origem: t.origem || '',
    discord_url: t.discordUrl || '',
    resolution_note: t.resolutionNote || ''
  };
}

// Standalone tasks — "avulsas", not tied to any client.
export function taskFromRow(row) {
  return {
    id: row.id,
    title: row.title,
    dueDate: row.due_date || '',
    completed: !!row.completed,
    completedAt: row.completed_at || '',
    createdAt: row.created_at
  };
}

export function taskToRow(t, userId) {
  return {
    id: t.id,
    user_id: userId,
    title: t.title || '',
    due_date: t.dueDate || '',
    completed: !!t.completed,
    completed_at: t.completedAt || null
  };
}

export function catalogFromRows(rows) {
  return (rows || []).map(r => ({
    id: r.id,
    name: r.name,
    ...(r.checklist !== undefined ? { checklist: r.checklist || [] } : {})
  }));
}

export function catalogToRow(table, item, userId) {
  const row = { id: item.id, user_id: userId, name: item.name };
  if (table === 'modules') row.checklist = item.checklist || [];
  return row;
}

export function profileFromRow(row) {
  return {
    name: row.name,
    role: row.role,
    avatarInitials: row.avatar_initials,
    avatarUrl: row.avatar_url || undefined,
    alertDiasAtencao: row.alert_dias_atencao ?? 15,
    alertDiasRisco: row.alert_dias_risco ?? 30
  };
}

// Loads every collection for the signed-in user in one go.
export async function loadAllData(userId) {
  const queries = {
    profile: supabase.from('profiles').select('*').eq('user_id', userId).maybeSingle(),
    plans: supabase.from('plans').select('*'),
    modules: supabase.from('modules').select('*'),
    offers: supabase.from('offers').select('*'),
    stages: supabase.from('stages').select('*').order('position'),
    clients: supabase.from('clients').select('*'),
    tickets: supabase.from('tickets').select('*'),
    tasks: supabase.from('tasks').select('*')
  };
  const keys = Object.keys(queries);
  const results = await Promise.all(Object.values(queries));
  const [profileRes, plansRes, modulesRes, offersRes, stagesRes, clientsRes, ticketsRes, tasksRes] = results;

  // supabase-js resolves (never rejects) with { data: null, error } on
  // failure — sem checar isso aqui, uma query falha vira silenciosamente
  // "0 clientes"/"sem planos" etc., indistinguível de a conta realmente
  // não ter nada.
  const failed = keys.filter((k, i) => results[i].error);
  if (failed.length > 0) {
    const firstError = results.find(r => r.error)?.error?.message || '';
    throw new Error(`Falha ao carregar dados (${failed.join(', ')}). ${firstError}`.trim());
  }

  return {
    profile: profileRes.data ? profileFromRow(profileRes.data) : null,
    plans: catalogFromRows(plansRes.data),
    modules: catalogFromRows(modulesRes.data),
    offers: catalogFromRows(offersRes.data),
    stages: (stagesRes.data || []).map(r => r.name),
    clients: (clientsRes.data || []).map(clientFromRow),
    tickets: (ticketsRes.data || []).map(ticketFromRow),
    tasks: (tasksRes.data || []).map(taskFromRow)
  };
}

// Generic "diff against last known ids, delete what's gone, upsert the rest"
// sync for a simple id-keyed table (plans/modules/offers/clients/tickets).
// Keeps every existing handler in App.jsx untouched — this only intercepts
// at the point local state actually changes.
export async function syncTable(table, rows, toRow, lastIdsRef, idKey = 'id') {
  const currentIds = new Set(rows.map(r => r[idKey]));
  const removedIds = [...lastIdsRef.current].filter(id => !currentIds.has(id));

  // lastIdsRef só avança depois que delete/upsert realmente confirmam
  // sucesso — se avançasse antes (como fazia aqui) e a chamada falhasse
  // (rede, RLS), a próxima sincronização já não veria mais o id removido
  // pra tentar de novo, e a linha ficava órfã no banco pra sempre.
  if (removedIds.length > 0) {
    const { error } = await supabase.from(table).delete().in(idKey, removedIds);
    if (error) {
      console.error(`syncTable(${table}): falha ao deletar`, error);
      return;
    }
  }
  if (rows.length > 0) {
    const { error } = await supabase.from(table).upsert(rows.map(toRow));
    if (error) {
      console.error(`syncTable(${table}): falha ao salvar`, error);
      return;
    }
  }
  lastIdsRef.current = currentIds;
}

// Stages are a plain ordered string[] in the app — turn them into
// (name, position) rows on sync, diffing by name.
export async function syncStages(stages, lastNamesRef, userId) {
  const currentNames = new Set(stages);
  const removedNames = [...lastNamesRef.current].filter(n => !currentNames.has(n));
  lastNamesRef.current = currentNames;

  if (removedNames.length > 0) {
    await supabase.from('stages').delete().in('name', removedNames);
  }
  if (stages.length > 0) {
    await supabase.from('stages').upsert(
      stages.map((name, position) => ({ user_id: userId, name, position }))
    );
  }
}

export async function syncProfile(profile, userId) {
  await supabase.from('profiles').update({
    name: profile.name || '',
    role: profile.role || '',
    avatar_initials: profile.avatarInitials || '',
    avatar_url: profile.avatarUrl || null,
    alert_dias_atencao: profile.alertDiasAtencao ?? 15,
    alert_dias_risco: profile.alertDiasRisco ?? 30,
    updated_at: new Date().toISOString()
  }).eq('user_id', userId);
}
