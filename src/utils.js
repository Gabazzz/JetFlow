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
