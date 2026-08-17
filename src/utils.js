// ============================================================
// JetFlow — Date and Formatting Utilities
// ============================================================

export function parseBRDate(brDateStr) {
  if (!brDateStr) return new Date();
  const [day, month, year] = brDateStr.split('/').map(Number);
  return new Date(year, month - 1, day);
}

export function formatBRDate(dateObj) {
  const day = String(dateObj.getDate()).padStart(2, '0');
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const year = dateObj.getFullYear();
  return `${day}/${month}/${year}`;
}

export function toBRDate(isoDateStr) {
  if (!isoDateStr) return '';
  if (isoDateStr.includes('/')) return isoDateStr;
  const [year, month, day] = isoDateStr.split('-');
  return `${day}/${month}/${year}`;
}

export function toISODate(brDateStr) {
  if (!brDateStr) return '';
  if (brDateStr.includes('-')) return brDateStr;
  const [day, month, year] = brDateStr.split('/');
  return `${year}-${month}-${day}`;
}

export function calculateNextContactDate(criticality, baseDateStr = getTodayBR()) {
  const dateObj = parseBRDate(baseDateStr);
  let daysToAdd = 3;
  if (criticality === 'Crítico') daysToAdd = 1;
  else if (criticality === 'Atenção') daysToAdd = 2;
  
  dateObj.setDate(dateObj.getDate() + daysToAdd);
  return formatBRDate(dateObj);
}

export function getDateStatus(brDateStr, systemDateStr = getTodayBR()) {
  if (!brDateStr) return 'future';
  const dateObj = parseBRDate(brDateStr);
  const sysDateObj = parseBRDate(systemDateStr);

  const dTime = dateObj.getTime();
  const sTime = sysDateObj.getTime();

  if (dTime < sTime) {
    return 'overdue';
  } else if (dTime === sTime) {
    return 'today';
  }
  return 'future';
}

// ============================================================
// Live date/time (America/Sao_Paulo) — the one place in the app that
// reads the real clock. Reusable by any feature that needs "now",
// as opposed to the fixed demo date used elsewhere in the mock data.
// ============================================================

const APP_TIMEZONE = 'America/Sao_Paulo';

export function getSaoPauloDateParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat('pt-BR', {
    timeZone: APP_TIMEZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).formatToParts(date);
  const get = (type) => parts.find(p => p.type === type)?.value;
  return { day: get('day'), month: get('month'), year: get('year'), hour: get('hour'), minute: get('minute') };
}

export function getTodayBR() {
  const { day, month, year } = getSaoPauloDateParts();
  return `${day}/${month}/${year}`;
}

// Pushes a BR-format date string ("DD/MM/YYYY") forward (or back) by N days.
// Falls back to today when there's no date yet — used by every "snooze"
// action and by day-by-day navigation (e.g. the Tarefas queue).
export function addDaysToBRDate(brDateStr, days) {
  const base = brDateStr ? parseBRDate(brDateStr) : parseBRDate(getTodayBR());
  base.setDate(base.getDate() + days);
  return formatBRDate(base);
}

export function getNowTimeBR() {
  const { hour, minute } = getSaoPauloDateParts();
  return `${hour}:${minute}`;
}

// ============================================================
// CX lifecycle: phase and health score
// Both are computed from existing fields (stage, criticality,
// nextContactDate, open tickets) rather than stored — so they
// can never drift out of sync with the data that drives them.
// ============================================================

export function calculateHealthScore(client, clientTickets = [], systemDateStr = getTodayBR()) {
  let score = 100;

  if (client.criticality === 'Crítico') score -= 45;
  else if (client.criticality === 'Atenção') score -= 15;

  if (getDateStatus(client.nextContactDate, systemDateStr) === 'overdue') score -= 20;

  const openTickets = clientTickets.filter(t => t.status !== 'Resolvido');
  const openUrgent = openTickets.filter(t => t.priority === 'Urgente' || t.priority === 'Alta');
  score -= openUrgent.length * 20;
  score -= (openTickets.length - openUrgent.length) * 8;

  return Math.max(0, Math.min(100, score));
}

export function getHealthTier(score) {
  if (score >= 70) return { label: 'Saudável', color: '#10B981' };
  if (score >= 40) return { label: 'Atenção', color: '#F59E0B' };
  return { label: 'Em risco', color: '#EF4444' };
}

// Onboarding | Ativação | Ativo | Em Risco
export function getClientPhase(client, clientTickets = [], systemDateStr = getTodayBR()) {
  if (client.stage !== 'Finalizado') return 'Onboarding';

  const health = calculateHealthScore(client, clientTickets, systemDateStr);
  if (health < 40) return 'Em Risco';

  const daysSinceEntry = Math.round(
    (parseBRDate(systemDateStr).getTime() - parseBRDate(client.entryDate).getTime()) / (1000 * 60 * 60 * 24)
  );
  if (daysSinceEntry <= 60) return 'Ativação';

  return 'Ativo';
}

export const PHASE_META = {
  'Onboarding': { color: 'var(--type-onboarding)', bg: 'rgba(91, 157, 255, 0.12)', border: 'rgba(91, 157, 255, 0.35)' },
  'Ativação': { color: '#38BDF8', bg: '#0F2733', border: 'rgba(56, 189, 248, 0.35)' },
  'Ativo': { color: '#10B981', bg: '#0F2A20', border: 'rgba(16, 185, 129, 0.35)' },
  'Em Risco': { color: '#EF4444', bg: '#2A1414', border: 'rgba(239, 68, 68, 0.35)' }
};

// Coarse "tipo de demanda" (Onboarding vs CS) derived from the same phase
// already computed by getClientPhase — kept separate from PHASE_META
// because it answers a different question ("what kind of work is this")
// rather than "how far along is this client's lifecycle".
export function getDemandType(phase) {
  return phase === 'Onboarding' ? 'Onboarding' : 'CS';
}

// Whether a client has finished onboarding — i.e. sits on the last
// configured Kanban stage (stages is the account's own ordered list, since
// stage names are fully customizable in Configurações > Kanban). Used to
// scope CS-only signals, like the no-contact alert below, away from
// clients still mid-implantação.
export function isClientPostOnboarding(client, stages = []) {
  if (!stages || stages.length === 0) return false;
  return client.stage === stages[stages.length - 1];
}

// Days since the client's most recent registered contact — lastContacts is
// newest-first (see handleRegisterContact in App.jsx), so index 0 is the
// one that matters; lastUpdated.date is the fallback for clients that
// don't have a lastContacts entry yet. Returns null when there's no date
// to compare at all.
export function getDiasSemContato(client, systemDateStr = getTodayBR()) {
  const contacts = client.lastContacts || [];
  const lastDateStr = contacts.length > 0 ? contacts[0].date : client.lastUpdated?.date;
  if (!lastDateStr) return null;
  const diffMs = parseBRDate(systemDateStr).getTime() - parseBRDate(lastDateStr).getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

// Automatic "sem contato" risk signal for post-onboarding (CS) clients —
// purely additive to the manual criticality field, never overwrites it.
// Returns null whenever the signal shouldn't show at all (client still
// onboarding, no contact date to compare, or under the Atenção threshold),
// so every call site can render nothing by default without extra checks.
export function getContactAlert(client, stages, profile, systemDateStr = getTodayBR()) {
  if (!isClientPostOnboarding(client, stages)) return null;
  const dias = getDiasSemContato(client, systemDateStr);
  if (dias === null) return null;
  const diasAtencao = profile?.alertDiasAtencao ?? 15;
  const diasRisco = profile?.alertDiasRisco ?? 30;
  if (dias < diasAtencao) return null;
  return { dias, level: dias >= diasRisco ? 'risco' : 'atencao' };
}

// ============================================================
// Implantação: etapas adicionais + diff de checklist por reunião
//
// Módulos Contratados / checklists são a fonte única do estado da
// implantação (ver ClientDetailView). A Nota de Reunião não mantém
// sua própria lista de "o que foi feito" — ela lê esse mesmo estado
// e o compara com um "checklistBaseline" (o retrato salvo da última
// vez que uma nota foi gerada) para descobrir o que mudou de pendente
// para concluído especificamente nesta reunião.
// ============================================================

export function createDefaultAdditionalSteps() {
  return [
    { id: 'bm', label: 'Verificação de BM', checked: false, doneText: 'Verificação de BM realizada.', pendingText: 'Verificar BM.' },
    { id: 'gupshup', label: 'Conexão com GupShup', checked: false, doneText: 'GupShup conectado e validado.', pendingText: 'Conectar GupShup.' }
  ];
}

export function getItemDoneText(item) {
  return item.doneText || `${item.label} realizado.`;
}

export function getItemPendingText(item) {
  return item.pendingText || `${item.label} pendente.`;
}

// Everything the checklist still has to say since the last note: what's
// already checked but not yet reported ("done", freshly this meeting) and
// what's still unchecked ("pending", checkable live from the note itself).
// Old items already checked as of the last note stay out entirely — the
// user is never asked to re-review something already reported (regra do
// item 8/30). idx is the item's real index in client.checklists[moduleName],
// so the note UI can toggle it straight through onUpdateChecklist.
export function getChecklistDiff(client) {
  const checklists = client.checklists || {};
  const baseline = client.checklistBaseline || {};
  const activeModules = client.activeModules || [];

  const moduleGroups = activeModules.map(modName => {
    const items = checklists[modName] || [];
    const baseMap = new Map((baseline[modName] || []).map(b => [b.label, b.checked]));
    const done = [];
    const pending = [];
    items.forEach((item, idx) => {
      if (item.checked) {
        if (!baseMap.get(item.label)) done.push({ item, idx });
      } else {
        pending.push({ item, idx });
      }
    });
    return { moduleName: modName, done, pending };
  }).filter(m => m.done.length > 0 || m.pending.length > 0);

  const steps = client.additionalSteps || [];
  const stepsBaseMap = new Map((client.additionalStepsBaseline || []).map(b => [b.id, b.checked]));
  const doneSteps = [];
  const pendingSteps = [];
  steps.forEach(step => {
    if (step.checked) {
      if (!stepsBaseMap.get(step.id)) doneSteps.push(step);
    } else {
      pendingSteps.push(step);
    }
  });

  return { moduleGroups, doneSteps, pendingSteps };
}
