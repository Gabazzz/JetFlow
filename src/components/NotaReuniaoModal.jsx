import React, { useState, useEffect, useRef } from 'react';
import {
  X, Sparkles, Eraser, Copy, RefreshCw, Building2, Calendar,
  Clock, Users, DollarSign, Plus, Trash2
} from 'lucide-react';
import CustomSelect from './CustomSelect';
import CustomDatePicker from './CustomDatePicker';
import { getTodayBR, getChecklistDiff, getItemDoneText, getItemPendingText } from '../utils';

const STATUS_OPTIONS = [
  { value: 'Em andamento', emoji: '🟢' },
  { value: 'Aguardando cliente', emoji: '🟡' },
  { value: 'Próxima etapa agendada', emoji: '🔵' },
  { value: 'Ajustes pendentes', emoji: '🟠' },
  { value: 'Implantação concluída', emoji: '✅' }
];

const NUMERO_REUNIAO_BASE = Array.from({ length: 8 }, (_, i) => `${i + 1}ª reunião`);
const NUMERO_REUNIAO_OPTIONS = [...NUMERO_REUNIAO_BASE, 'Retreinamento', 'Outro'];

const UPSELL_STATUS_PHRASE = {
  'Interesse demonstrado': (produtos) => `Interesse demonstrado em ${produtos}.`,
  'Solicitar abordagem comercial': (produtos) => `Solicitar abordagem comercial para ${produtos}.`,
  'Encaminhado ao comercial': (produtos) => `Encaminhado ao comercial: ${produtos}.`,
  'Em negociação': (produtos) => `Em negociação: ${produtos}.`,
  'Sem interesse': (produtos) => `Sem interesse em ${produtos}.`
};

const EMPTY_DIFF = { moduleGroups: [], doneSteps: [], pendingSteps: [] };

function SectionHeader({ number, title }) {
  return (
    <div className="nota-section-header">
      <span className="nota-section-header-label">{number}. {title}</span>
      <span className="nota-section-header-line" />
    </div>
  );
}

// Shared by "O que foi realizado" and "O que ficou pendente" — both read the
// same live checklist diff, just filtered to done vs. pending, and render
// each item as a toggleable pill instead of a checkbox row.
function ModulePillGrid({ groups, onToggle, emptyText }) {
  if (groups.length === 0) {
    return <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{emptyText}</span>;
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {groups.map(g => (
        <div key={g.groupName}>
          <span className="nota-module-group-label">{g.groupName}</span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
            {g.items.map(it => (
              <button
                key={it.key}
                type="button"
                className={`preset-pill ${it.checked ? 'active' : ''}`}
                onClick={() => onToggle(it)}
              >
                {it.label}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function buildPillGroups(moduleGroups, steps, done) {
  const groups = moduleGroups
    .filter(m => (done ? m.done.length > 0 : m.pending.length > 0))
    .map(m => ({
      groupName: m.moduleName,
      items: (done ? m.done : m.pending).map(({ item, idx }) => ({
        key: `${m.moduleName}__${idx}`,
        label: item.label,
        checked: done,
        moduleName: m.moduleName,
        idx
      }))
    }));
  if (steps.length > 0) {
    groups.push({
      groupName: 'Etapas Adicionais',
      items: steps.map(step => ({ key: `step__${step.id}`, label: step.label, checked: done, stepId: step.id }))
    });
  }
  return groups;
}

const initialFormState = () => ({
  numeroReuniao: '',
  data: getTodayBR(),
  proximaReuniao: '',
  duracaoTexto: '',
  participantes: [],
  status: 'Em andamento',
  upsellProdutos: [],
  upsellStatus: 'Interesse demonstrado',
  upsellObservacao: '',
  observacoes: '',
  gravacoes: ['']
});

function computeRealizadoLines(diff) {
  const lines = [];
  diff.moduleGroups.forEach(m => {
    m.done.forEach(({ item }) => lines.push(getItemDoneText(item)));
  });
  diff.doneSteps.forEach(step => lines.push(getItemDoneText(step)));
  return lines;
}

function computePendenciaLines(diff) {
  const lines = [];
  diff.moduleGroups.forEach(m => {
    m.pending.forEach(({ item }) => lines.push(getItemPendingText(item)));
  });
  diff.pendingSteps.forEach(step => lines.push(getItemPendingText(step)));
  return lines;
}

function buildNotaText(form, diff, responsavelNome) {
  const lines = [];

  const numero = form.numeroReuniao.trim();
  lines.push(`IMPLANTAÇÃO TÉCNICA – ${numero.toUpperCase()} (${responsavelNome})`);
  lines.push('');

  lines.push(`📅 Data: ${form.data}`);
  if (form.proximaReuniao) lines.push(`📅 Próxima reunião: ${form.proximaReuniao}`);
  if (form.duracaoTexto.trim()) lines.push(`⏱️ Duração: ${form.duracaoTexto.trim()}`);
  if (form.participantes.length > 0) lines.push(`👥 Participantes: ${form.participantes.join(', ')}`);

  lines.push('');
  const statusMeta = STATUS_OPTIONS.find(s => s.value === form.status) || STATUS_OPTIONS[0];
  lines.push(`${statusMeta.emoji} STATUS: ${statusMeta.value}`);

  const realizadoLines = computeRealizadoLines(diff);
  if (realizadoLines.length > 0) {
    lines.push('');
    lines.push('🛠️ REALIZADO:');
    realizadoLines.forEach(p => lines.push(`• ${p}`));
  }

  const pendenciaLines = computePendenciaLines(diff);
  if (pendenciaLines.length > 0) {
    lines.push('');
    lines.push('🔍 PENDÊNCIAS:');
    pendenciaLines.forEach(p => lines.push(`• ${p}`));
  }

  if (form.upsellProdutos.length > 0) {
    lines.push('');
    lines.push('💰 UPSELL / OPORTUNIDADE:');
    const phraseFn = UPSELL_STATUS_PHRASE[form.upsellStatus] || UPSELL_STATUS_PHRASE['Interesse demonstrado'];
    lines.push(phraseFn(form.upsellProdutos.join(', ')));
    if (form.upsellObservacao.trim()) lines.push(form.upsellObservacao.trim());
  }

  if (form.observacoes.trim()) {
    lines.push('');
    lines.push('📝 OBSERVAÇÕES:');
    lines.push(form.observacoes.trim());
  }

  const gravacoesValidas = form.gravacoes.map(g => g.trim()).filter(Boolean);
  if (gravacoesValidas.length > 0) {
    lines.push('');
    lines.push('🎥 GRAVAÇÃO:');
    gravacoesValidas.forEach(g => lines.push(gravacoesValidas.length > 1 ? `• ${g}` : g));
  }

  return lines.join('\n');
}

export default function NotaReuniaoModal({ clients, contextClient, profile, availableOffers, onUpdateClient, onUpdateChecklist, onUpdateAdditionalSteps, onClose }) {
  const [selectedClientId, setSelectedClientId] = useState('');
  const [form, setForm] = useState(initialFormState());
  const [participantInput, setParticipantInput] = useState('');
  const [generatedNote, setGeneratedNote] = useState(null);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const [showValidation, setShowValidation] = useState(false);

  const lastClientId = useRef(null);
  const generatedOnceRef = useRef(false);

  const client = contextClient || clients.find(c => c.id === selectedClientId) || null;

  // O checklist é a fonte do "o que foi feito" — lido ao vivo a cada render,
  // então marcar/desmarcar um item aqui dentro (ou na tela do cliente,
  // enquanto o modal está aberto) atualiza a nota na hora.
  const diff = client ? getChecklistDiff(client) : EMPTY_DIFF;

  useEffect(() => {
    if (client?.id !== lastClientId.current) {
      lastClientId.current = client?.id || null;
      generatedOnceRef.current = false;
      if (client) {
        const count = client.meetingNotesCount || 0;
        const defaultNumero = count < NUMERO_REUNIAO_BASE.length ? NUMERO_REUNIAO_BASE[count] : 'Outro';
        setForm(prev => ({ ...prev, numeroReuniao: defaultNumero }));
      }
    }
  }, [client?.id]);

  const setField = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  const handleToggleModuleItem = (moduleName, idx) => {
    if (!client) return;
    const items = (client.checklists || {})[moduleName] || [];
    const updated = items.map((it, i) => i === idx ? { ...it, checked: !it.checked } : it);
    onUpdateChecklist(client.id, moduleName, updated);
  };

  const handleToggleStep = (stepId) => {
    if (!client) return;
    const steps = client.additionalSteps || [];
    const updated = steps.map(s => s.id === stepId ? { ...s, checked: !s.checked } : s);
    onUpdateAdditionalSteps(client.id, updated);
  };

  const handleTogglePillItem = (it) => {
    if (it.stepId) handleToggleStep(it.stepId);
    else handleToggleModuleItem(it.moduleName, it.idx);
  };

  const toggleUpsellProduto = (produto) => {
    setForm(prev => ({
      ...prev,
      upsellProdutos: prev.upsellProdutos.includes(produto) ? prev.upsellProdutos.filter(p => p !== produto) : [...prev.upsellProdutos, produto]
    }));
  };

  const addParticipant = () => {
    const name = participantInput.trim();
    if (!name || form.participantes.includes(name)) return;
    setField('participantes', [...form.participantes, name]);
    setParticipantInput('');
  };

  const removeParticipant = (name) => {
    setField('participantes', form.participantes.filter(p => p !== name));
  };

  const updateGravacao = (idx, value) => setForm(prev => ({ ...prev, gravacoes: prev.gravacoes.map((g, i) => i === idx ? value : g) }));
  const addGravacao = () => setForm(prev => ({ ...prev, gravacoes: [...prev.gravacoes, ''] }));
  const removeGravacao = (idx) => setForm(prev => ({ ...prev, gravacoes: prev.gravacoes.filter((_, i) => i !== idx) }));

  const isFormDirty = () => {
    const initial = initialFormState();
    return (
      form.numeroReuniao !== '' ||
      form.proximaReuniao !== '' ||
      form.duracaoTexto !== '' ||
      form.participantes.length > 0 ||
      form.status !== initial.status ||
      form.upsellProdutos.length > 0 ||
      form.upsellObservacao !== '' ||
      form.observacoes !== '' ||
      form.gravacoes.some(g => g.trim() !== '') ||
      generatedNote !== null ||
      (!contextClient && selectedClientId !== '')
    );
  };

  const isValid = () => !!client && form.numeroReuniao.trim() !== '';

  const handleGenerate = () => {
    if (!isValid()) {
      setShowValidation(true);
      return;
    }
    setShowValidation(false);
    setGeneratedNote(buildNotaText(form, diff, profile.name));
    generatedOnceRef.current = true;
    setCopyFeedback(false);
    setCopyError(false);
  };

  const handleClear = () => {
    if (isFormDirty() && !window.confirm('Limpar informações?\nTodos os dados preenchidos serão removidos.')) return;
    setForm(initialFormState());
    setParticipantInput('');
    setGeneratedNote(null);
    generatedOnceRef.current = false;
    setCopyFeedback(false);
    setCopyError(false);
    setShowValidation(false);
    if (!contextClient) setSelectedClientId('');
  };

  const handleCopy = async () => {
    if (!generatedNote) return;
    try {
      await navigator.clipboard.writeText(generatedNote);
      setCopyError(false);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2500);
    } catch {
      setCopyError(true);
    }
  };

  // A nota é uma fotografia da reunião: só quando o modal fecha — e uma
  // nota chegou a ser gerada — o "retrato" salvo do checklist avança, para
  // que a próxima reunião comece o diff do zero, e o contador de reuniões
  // sobe (usado para pré-selecionar "Qual reunião?" na próxima nota).
  // Marcar itens aqui dentro já grava no checklist real na hora; isso só
  // controla o que conta como "já reportado" pela próxima nota.
  const handleClose = () => {
    if (generatedOnceRef.current && client) {
      onUpdateClient(client.id, {
        checklistBaseline: JSON.parse(JSON.stringify(client.checklists || {})),
        additionalStepsBaseline: JSON.parse(JSON.stringify(client.additionalSteps || [])),
        meetingNotesCount: (client.meetingNotesCount || 0) + 1
      });
    }
    onClose();
  };

  const doneGroups = buildPillGroups(diff.moduleGroups, diff.doneSteps, true);
  const pendingGroups = buildPillGroups(diff.moduleGroups, diff.pendingSteps, false);
  const offerNames = (availableOffers || []).map(o => o.name);

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content nota-reuniao-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">📝 Nova Nota de Reunião</h3>
          <button className="btn-icon" onClick={handleClose}><X size={16} /></button>
        </div>

        <div className="modal-body nota-reuniao-layout">
          {/* ── FORM COLUMN ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '26px' }}>

            {/* Client context — obrigatório, fora da numeração */}
            {contextClient ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', backgroundColor: '#1E351F', border: '1px solid rgba(101, 255, 75, 0.3)', borderRadius: '8px' }}>
                <Building2 size={15} style={{ color: 'var(--green-primary)' }} />
                <span style={{ fontSize: '13px', color: '#fff' }}>Cliente: <strong style={{ color: 'var(--green-primary)' }}>{contextClient.name}</strong></span>
              </div>
            ) : (
              <div className="form-group">
                <label className="form-label">Cliente *</label>
                <CustomSelect
                  value={selectedClientId}
                  onChange={setSelectedClientId}
                  placeholder="Selecionar cliente..."
                  options={clients.map(c => ({ value: c.id, label: c.name }))}
                />
                {showValidation && !client && <span style={{ fontSize: '11px', color: 'var(--badge-red)' }}>Selecione o cliente.</span>}
              </div>
            )}

            {/* 1. DADOS DA REUNIÃO */}
            <div className="nota-section">
              <SectionHeader number={1} title="Dados da Reunião" />

              <div className="form-group">
                <label className="form-label">Qual reunião? *</label>
                <CustomSelect
                  value={form.numeroReuniao}
                  onChange={v => setField('numeroReuniao', v)}
                  placeholder="Selecionar..."
                  options={NUMERO_REUNIAO_OPTIONS}
                />
                {showValidation && !form.numeroReuniao.trim() && <span style={{ fontSize: '11px', color: 'var(--badge-red)' }}>Selecione a reunião.</span>}
              </div>

              <div className="form-group">
                <label className="form-label"><Clock size={11} style={{ verticalAlign: '-1px', marginRight: '4px' }} />Duração</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder='Ex: "1h", "1 hora e 30 min", "45 minutos"'
                  value={form.duracaoTexto}
                  onChange={e => setField('duracaoTexto', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label"><Users size={11} style={{ verticalAlign: '-1px', marginRight: '4px' }} />Participantes</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    className="form-input"
                    style={{ flex: 1 }}
                    placeholder="Nome e Enter para adicionar..."
                    value={participantInput}
                    onChange={e => setParticipantInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addParticipant(); } }}
                  />
                  <button type="button" className="btn-secondary" onClick={addParticipant}><Plus size={14} /></button>
                </div>
                {form.participantes.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '2px' }}>
                    {form.participantes.map(p => (
                      <span key={p} className="badge" style={{ backgroundColor: '#1E1E1E', border: '1px solid #333', color: '#ddd', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        {p}
                        <X size={11} style={{ cursor: 'pointer' }} onClick={() => removeParticipant(p)} />
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label"><Calendar size={11} style={{ verticalAlign: '-1px', marginRight: '4px' }} />Data da reunião</label>
                  <CustomDatePicker value={form.data} onChange={v => setField('data', v)} />
                </div>
                <div className="form-group">
                  <label className="form-label"><Calendar size={11} style={{ verticalAlign: '-1px', marginRight: '4px' }} />Próxima reunião</label>
                  <CustomDatePicker value={form.proximaReuniao} onChange={v => setField('proximaReuniao', v)} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Status da implantação</label>
                <CustomSelect
                  value={form.status}
                  onChange={v => setField('status', v)}
                  options={STATUS_OPTIONS.map(s => ({ value: s.value, label: `${s.emoji} ${s.value}` }))}
                />
              </div>
            </div>

            {/* 2. O QUE FOI REALIZADO */}
            <div className="nota-section">
              <SectionHeader number={2} title="O que foi realizado" />
              {!client ? (
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Selecione o cliente para ver o checklist.</span>
              ) : (
                <ModulePillGrid
                  groups={doneGroups}
                  onToggle={handleTogglePillItem}
                  emptyText="Nada marcado como realizado ainda nesta reunião."
                />
              )}
            </div>

            {/* 3. O QUE FICOU PENDENTE */}
            <div className="nota-section">
              <SectionHeader number={3} title="O que ficou pendente" />
              {!client ? (
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Selecione o cliente para ver o checklist.</span>
              ) : (
                <ModulePillGrid
                  groups={pendingGroups}
                  onToggle={handleTogglePillItem}
                  emptyText="Nenhuma pendência — tudo em dia."
                />
              )}
            </div>

            {/* 4. POSSÍVEL UPSELL */}
            <div className="nota-section">
              <SectionHeader number={4} title="Possível Upsell" />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {offerNames.map(produto => (
                  <button
                    key={produto}
                    type="button"
                    className={`preset-pill ${form.upsellProdutos.includes(produto) ? 'active' : ''}`}
                    onClick={() => toggleUpsellProduto(produto)}
                  >
                    {produto}
                  </button>
                ))}
              </div>
              {form.upsellProdutos.length > 0 && (
                <div style={{ marginTop: '4px' }}>
                  <CustomSelect
                    value={form.upsellStatus}
                    onChange={v => setField('upsellStatus', v)}
                    options={Object.keys(UPSELL_STATUS_PHRASE)}
                  />
                </div>
              )}
              <div className="form-group" style={{ marginTop: '4px' }}>
                <label className="form-label"><DollarSign size={11} style={{ verticalAlign: '-1px', marginRight: '4px' }} />Observação sobre o possível upsell</label>
                <textarea
                  className="form-textarea"
                  rows={2}
                  placeholder="Ex: cliente demonstrou interesse em X pelo motivo Y..."
                  value={form.upsellObservacao}
                  onChange={e => setField('upsellObservacao', e.target.value)}
                />
              </div>
            </div>

            {/* 5. OBSERVAÇÕES */}
            <div className="nota-section">
              <SectionHeader number={5} title="Observações" />
              <textarea
                className="form-textarea"
                rows={4}
                placeholder="Qualquer outra informação relevante da reunião..."
                value={form.observacoes}
                onChange={e => setField('observacoes', e.target.value)}
              />
            </div>

            {/* 6. GRAVAÇÃO */}
            <div className="nota-section">
              <SectionHeader number={6} title="Gravação" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {form.gravacoes.map((link, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="url"
                      className="form-input"
                      style={{ flex: 1 }}
                      placeholder="https://..."
                      value={link}
                      onChange={e => updateGravacao(idx, e.target.value)}
                    />
                    {form.gravacoes.length > 1 && (
                      <button type="button" className="btn-danger-icon" onClick={() => removeGravacao(idx)} title="Remover">
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                ))}
                <button type="button" className="nota-add-dashed-btn" onClick={addGravacao}>
                  <Plus size={13} />
                  <span>Adicionar outra gravação</span>
                </button>
              </div>
            </div>
          </div>

          {/* ── PREVIEW COLUMN ── */}
          <div className="nota-reuniao-preview">
            <span className="form-label" style={{ display: 'block', marginBottom: '10px' }}>Pré-visualização da nota</span>
            <div className="nota-reuniao-preview-box">
              {generatedNote ? (
                <pre>{generatedNote}</pre>
              ) : (
                <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Preencha as informações e clique em "Gerar nota".</span>
              )}
            </div>
            {copyError && <span style={{ fontSize: '11px', color: 'var(--badge-red)' }}>Não foi possível copiar automaticamente — selecione o texto acima e copie manualmente.</span>}
          </div>
        </div>

        <div className="modal-footer" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
            <div>
              {copyFeedback && <span style={{ fontSize: '12px', color: 'var(--badge-green)', fontWeight: '600' }}>✓ Nota copiada!</span>}
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="button" className="btn-secondary" onClick={handleClear}>
                <Eraser size={14} />
                <span>Limpar</span>
              </button>
              {generatedNote && (
                <button type="button" className="btn-secondary" onClick={handleGenerate}>
                  <RefreshCw size={14} />
                  <span>Gerar Novamente</span>
                </button>
              )}
            </div>
          </div>
          {generatedNote ? (
            <button type="button" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={handleCopy}>
              <Copy size={14} />
              <span>Copiar Nota</span>
            </button>
          ) : (
            <button type="button" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={handleGenerate}>
              <Sparkles size={14} />
              <span>Gerar Nota</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
