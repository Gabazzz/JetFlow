import { getTodayBR, getNowTimeBR, calculateNextContactDate, createDefaultAdditionalSteps } from '../utils';

// ExceljS is loaded lazily (dynamic import) so the ~250KB (gzipped) parser
// only ever hits the bundle for users who actually open Exportar/Importar,
// instead of bloating the app's main chunk for everyone.
async function loadExcelJS() {
  const mod = await import('exceljs');
  return mod.default || mod;
}

// The deliberately small set of "basic info" fields exposed to
// import/export — everything nested (checklists, reminders, quick links,
// module list, activity history...) stays out of the spreadsheet and is
// filled in later from the client's own page.
export const IMPORTABLE_FIELDS = [
  { key: 'name', label: 'Nome' },
  { key: 'phone', label: 'Telefone' },
  { key: 'whatsapp', label: 'WhatsApp' },
  { key: 'email', label: 'Email' },
  { key: 'cnpj', label: 'CNPJ' },
  { key: 'responsible', label: 'Responsável' },
  { key: 'plan', label: 'Plano' },
  { key: 'criticality', label: 'Criticidade' },
  { key: 'stage', label: 'Etapa' },
  { key: 'entryDate', label: 'Data de Entrada' },
  { key: 'observations', label: 'Observações' }
];

const GUESS_PATTERNS = [
  ['name', /^nome|cliente$/i],
  ['whatsapp', /whats ?app/i],
  ['phone', /telefone|fone|tel\.?$/i],
  ['email', /e-?mail/i],
  ['cnpj', /cnpj/i],
  ['responsible', /respons[aá]vel/i],
  ['plan', /plano/i],
  ['criticality', /criticidade|prioridade/i],
  ['stage', /etapa|est[aá]gio|status/i],
  ['entryDate', /entrada|data/i],
  ['observations', /observ/i]
];

export function guessColumnMapping(headers) {
  return headers.map(h => {
    const clean = String(h || '').trim();
    const found = GUESS_PATTERNS.find(([, pattern]) => pattern.test(clean));
    return found ? found[0] : '';
  });
}

function cellToValue(cell) {
  const v = cell.value;
  if (v == null) return '';
  if (v instanceof Date) return v;
  if (typeof v === 'object') {
    if (typeof v.text === 'string') return v.text;
    if (Array.isArray(v.richText)) return v.richText.map(rt => rt.text).join('');
    if (v.result !== undefined) return v.result;
    return '';
  }
  return v;
}

function normalizeDateCell(value) {
  if (value == null || value === '') return '';
  if (value instanceof Date) {
    const day = String(value.getDate()).padStart(2, '0');
    const month = String(value.getMonth() + 1).padStart(2, '0');
    return `${day}/${month}/${value.getFullYear()}`;
  }
  const str = String(value).trim();
  const isoMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) return `${isoMatch[3]}/${isoMatch[2]}/${isoMatch[1]}`;
  return str;
}

function normalizeCriticality(value) {
  const v = String(value || '').trim().toLowerCase();
  if (v.startsWith('cr')) return 'Crítico';
  if (v.startsWith('at')) return 'Atenção';
  if (v.startsWith('es')) return 'Estável';
  return '';
}

function normalizeStage(value, stages) {
  const v = String(value || '').trim();
  if (!v) return '';
  const match = (stages || []).find(s => s.toLowerCase() === v.toLowerCase());
  return match || '';
}

// Downloads an .xlsx with one row per client, columns = IMPORTABLE_FIELDS.
export async function exportClientsToXlsx(clients) {
  const ExcelJS = await loadExcelJS();
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Clientes');

  sheet.columns = IMPORTABLE_FIELDS.map(f => ({ header: f.label, key: f.key, width: 26 }));
  clients.forEach(c => {
    sheet.addRow({
      name: c.name || '',
      phone: c.phone || '',
      whatsapp: c.whatsapp || '',
      email: c.email || '',
      cnpj: c.cnpj || '',
      responsible: c.responsible || '',
      plan: c.plan || '',
      criticality: c.criticality || '',
      stage: c.stage || '',
      entryDate: c.entryDate || '',
      observations: c.observations || ''
    });
  });
  sheet.getRow(1).font = { bold: true };

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `jetflow-clientes-${getTodayBR().split('/').reverse().join('-')}.xlsx`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

// Reads an uploaded .xlsx into { headers, rows } — raw cell values, no
// field mapping applied yet (that happens interactively in the modal).
export async function parseXlsxFile(file) {
  const ExcelJS = await loadExcelJS();
  const buffer = await file.arrayBuffer();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  const sheet = workbook.worksheets[0];
  if (!sheet) return { headers: [], rows: [] };

  const headerRow = sheet.getRow(1);
  const headers = [];
  const colCount = Math.max(sheet.columnCount, headerRow.cellCount);
  for (let i = 1; i <= colCount; i++) {
    headers.push(String(cellToValue(headerRow.getCell(i))).trim());
  }

  const rows = [];
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const values = [];
    for (let i = 1; i <= colCount; i++) {
      values.push(cellToValue(row.getCell(i)));
    }
    const isBlank = values.every(v => v === '' || v == null);
    if (!isBlank) rows.push(values);
  });

  return { headers, rows };
}

function buildNewClientFromFields(fields, profileName) {
  const entryDate = fields.entryDate || getTodayBR();
  const criticality = fields.criticality || 'Estável';
  const stage = fields.stage || 'Novo';
  const initials = (profileName || '').split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return {
    id: `c_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    name: fields.name,
    cnpj: fields.cnpj || '',
    phone: fields.phone || '',
    whatsapp: fields.whatsapp || '',
    email: fields.email || '',
    entryDate,
    plan: fields.plan || '',
    criticality,
    criticalityJustification: '',
    activeModules: [],
    observations: fields.observations || '',
    responsible: fields.responsible || profileName || '',
    stage,
    nextAction: 'Reunião de Alinhamento inicial',
    nextContactDate: calculateNextContactDate(criticality, entryDate),
    checklists: {},
    checklistBaseline: {},
    additionalSteps: createDefaultAdditionalSteps(),
    additionalStepsBaseline: createDefaultAdditionalSteps(),
    reminders: [],
    lastUpdated: { date: getTodayBR(), time: getNowTimeBR(), user: profileName || '' },
    lastContacts: [{ date: entryDate, obs: 'Cliente importado via planilha.' }],
    activityHistory: [{
      avatar: initials,
      name: profileName || '',
      action: 'Cliente importado via planilha',
      date: `${getTodayBR()} às ${getNowTimeBR()}`,
      isObservation: false
    }],
    quickLinks: { crm: '', discordIntegration: '', discordSupport: [], site: '', deskPlatformUrl: '', deskPlatformEmail: '' },
    meetings: [],
    tasks: [],
    interestOffers: []
  };
}

// Turns parsed rows + a header->field mapping into a concrete plan: which
// clients get created, which get patched (and with what), and how many
// rows were skipped for having no usable name. Never touches nested data
// (checklists, reminders, etc.) — only the mapped basic fields.
export function buildImportPlan({ headers, rows, mapping, existingClients, duplicateMode, stages, profileName }) {
  const created = [];
  const updated = [];
  let skipped = 0;

  const cnpjIndex = new Map();
  const nameIndex = new Map();
  existingClients.forEach(c => {
    const cnpjKey = (c.cnpj || '').replace(/\D/g, '');
    if (cnpjKey) cnpjIndex.set(cnpjKey, c);
    if (c.name && c.name.trim()) nameIndex.set(c.name.trim().toLowerCase(), c);
  });

  rows.forEach(rowValues => {
    const fields = {};
    mapping.forEach((fieldKey, colIdx) => {
      if (!fieldKey) return;
      const raw = rowValues[colIdx];
      if (fieldKey === 'entryDate') fields[fieldKey] = normalizeDateCell(raw);
      else if (fieldKey === 'criticality') fields[fieldKey] = normalizeCriticality(raw);
      else if (fieldKey === 'stage') fields[fieldKey] = normalizeStage(raw, stages);
      else fields[fieldKey] = raw == null ? '' : String(raw).trim();
    });

    if (!fields.name || !fields.name.trim()) {
      skipped += 1;
      return;
    }
    fields.name = fields.name.trim();

    let match = null;
    if (duplicateMode !== 'ignorar') {
      const cnpjKey = (fields.cnpj || '').replace(/\D/g, '');
      if (cnpjKey && cnpjIndex.has(cnpjKey)) match = cnpjIndex.get(cnpjKey);
      else if (nameIndex.has(fields.name.toLowerCase())) match = nameIndex.get(fields.name.toLowerCase());
    }

    if (match) {
      if (duplicateMode === 'substituir') {
        updated.push({ id: match.id, name: match.name, fields: { ...fields } });
      } else {
        const patch = {};
        Object.entries(fields).forEach(([k, v]) => { if (v !== '' && v != null) patch[k] = v; });
        updated.push({ id: match.id, name: match.name, fields: patch });
      }
    } else {
      created.push(buildNewClientFromFields(fields, profileName));
    }
  });

  return { created, updated, skipped, totalRows: rows.length };
}
