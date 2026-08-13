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

export function calculateNextContactDate(criticality, baseDateStr = '30/06/2026') {
  const dateObj = parseBRDate(baseDateStr);
  let daysToAdd = 3;
  if (criticality === 'Crítico') daysToAdd = 1;
  else if (criticality === 'Atenção') daysToAdd = 2;
  
  dateObj.setDate(dateObj.getDate() + daysToAdd);
  return formatBRDate(dateObj);
}

export function getDateStatus(brDateStr, systemDateStr = '30/06/2026') {
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

export function calculateHealthScore(client, clientTickets = [], systemDateStr = '30/06/2026') {
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
export function getClientPhase(client, clientTickets = [], systemDateStr = '30/06/2026') {
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
  'Onboarding': { color: 'var(--green-primary)', bg: '#1E351F', border: 'rgba(101, 255, 75, 0.3)' },
  'Ativação': { color: '#38BDF8', bg: '#0F2733', border: 'rgba(56, 189, 248, 0.35)' },
  'Ativo': { color: '#10B981', bg: '#0F2A20', border: 'rgba(16, 185, 129, 0.35)' },
  'Em Risco': { color: '#EF4444', bg: '#2A1414', border: 'rgba(239, 68, 68, 0.35)' }
};
