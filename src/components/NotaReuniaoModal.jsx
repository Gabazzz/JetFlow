import React, { useState, useEffect, useRef } from 'react';
import {
  X, Sparkles, Eraser, Copy, Building2, Calendar,
  Clock, Users, DollarSign, Plus, Trash2, Link
} from 'lucide-react';
import CustomSelect from './CustomSelect';
import CustomDatePicker from './CustomDatePicker';
import { getTodayBR, getChecklistDiff, getItemNoteText, OPPORTUNITY_STATUS_OPTIONS, getClientCrmLink } from '../utils';

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
  'Convertido': (produtos) => `Convertido: ${produtos}.`,
  'Sem interesse': (produtos) => `Sem interesse em ${produtos}.`
};

const EMPTY_DIFF = { moduleGroups: [] };

function SectionHeader({ number, title }) {
  return (
    <div className="nota-section-header">
      <span className="nota-section-header-number">{number}</span>
      <span className="nota-section-header-label">{title}</span>
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
          {g.concluido && (
            <span
              title="Módulo concluído — a nota mostra só o aviso de conclusão"
              style={{ marginLeft: '6px', fontSize: '11px', color: 'var(--green-primary)' }}
            >
              ✅ concluído
            </span>
          )}
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

function buildPillGroups(moduleGroups, done) {
  return moduleGroups
    .filter(m => (done ? m.done.length > 0 : m.pending.length > 0))
    .map(m => ({
      groupName: m.moduleName,
      // Mesma regra da nota: sem pendência nenhuma, o módulo fechou. Aqui é só
      // um selo ao lado do nome — as etapas continuam listadas e clicáveis,
      // senão não daria para desmarcar nada depois de fechar o módulo.
      concluido: done && m.pending.length === 0,
      items: (done ? m.done : m.pending).map(({ item, idx }) => ({
        key: `${m.moduleName}__${idx}`,
        label: item.label,
        checked: done,
        moduleName: m.moduleName,
        idx
      }))
    }));
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

// Same grouping as the pill UI (per module, plus "Etapas Adicionais") —
// keeps the generated text scannable by topic instead of one flat list
// mixing items from every module together.
function computeGroupedLines(diff, done) {
  const groups = [];
  diff.moduleGroups.forEach(m => {
    const entries = done ? m.done : m.pending;
    if (entries.length === 0) return;
    groups.push({
      groupName: m.moduleName,
      // Sem nenhuma pendência = o módulo fechou, e aí a nota diz isso em uma
      // linha em vez de listar as etapas. Só aparece na reunião em que ele
      // fecha: módulo concluído antes já sai do diff e nem chega aqui, então
      // o aviso não se repete a cada nota.
      concluido: done && m.pending.length === 0,
      // Mesmo texto nas duas seções: o cabeçalho (REALIZADO / PENDÊNCIAS) já
      // diz o estado, então a etapa entra como foi escrita, sem sufixo.
      lines: entries.map(({ item }) => getItemNoteText(item))
    });
  });
  return groups;
}

function pushGroupedSection(lines, title, groups) {
  if (groups.length === 0) return;
  lines.push('');
  lines.push(title);
  groups.forEach((g, i) => {
    if (i > 0) lines.push('');
    if (g.concluido) {
      lines.push(`✅ ${g.groupName} concluído!`);
      return;
    }
    lines.push(`${g.groupName}:`);
    g.lines.forEach(l => lines.push(`• ${l}`));
  });
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

  pushGroupedSection(lines, '🛠️ REALIZADO:', computeGroupedLines(diff, true));
  pushGroupedSection(lines, '🔍 PENDÊNCIAS:', computeGroupedLines(diff, false));

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

export default function NotaReuniaoModal({ clients, contextClient, profile, availableOffers, onUpdateClient, onUpdateChecklist, onClose }) {
  const [selectedClientId, setSelectedClientId] = useState('');
  const [form, setForm] = useState(initialFormState());
  const [participantInput, setParticipantInput] = useState('');
  const [hasGenerated, setHasGenerated] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const [showValidation, setShowValidation] = useState(false);

  const lastClientId = useRef(null);
  const copiedOnceRef = useRef(false);

  const client = contextClient || clients.find(c => c.id === selectedClientId) || null;
  const crmLink = getClientCrmLink(client);

  // O checklist é a fonte do "o que foi feito" — lido ao vivo a cada render,
  // então marcar/desmarcar um item aqui dentro (ou na tela do cliente,
  // enquanto o modal está aberto) atualiza a nota na hora.
  const diff = client ? getChecklistDiff(client) : EMPTY_DIFF;

  // O texto é derivado do estado atual, não uma cópia tirada no clique de
  // "Gerar Nota". Antes ele era um retrato congelado: marcar uma etapa depois
  // de gerar mudava a pílula na tela mas não o texto, e a pessoa copiava uma
  // nota dizendo "pendente" para algo que acabara de concluir.
  const notaText = client ? buildNotaText(form, diff, profile.name) : '';

  const defaultNumeroFor = (c) => {
    if (!c) return '';
    const count = c.meetingNotesCount || 0;
    return count < NUMERO_REUNIAO_BASE.length ? NUMERO_REUNIAO_BASE[count] : 'Outro';
  };

  // Trocar de cliente recomeça a nota do zero. Antes só o "Qual reunião?" era
  // reposto, então observações, participantes e o upsell marcado seguiam na
  // tela — e o upsell chegava a ser gravado no cliente errado ao gerar.
  useEffect(() => {
    if (client?.id === lastClientId.current) return;
    lastClientId.current = client?.id || null;
    copiedOnceRef.current = false;
    setHasGenerated(false);
    setParticipantInput('');
    setShowValidation(false);
    setCopyFeedback(false);
    setCopyError(false);
    setForm({ ...initialFormState(), numeroReuniao: defaultNumeroFor(client) });
    // Só o id entra nas dependências: o objeto `client` muda de identidade a
    // cada marcação de checklist, e reagir a ele zeraria o formulário no meio
    // do preenchimento. Dentro do efeito ele já é o do render atual.
  }, [client?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const setField = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  const handleToggleModuleItem = (moduleName, idx) => {
    if (!client) return;
    const items = (client.checklists || {})[moduleName] || [];
    const updated = items.map((it, i) => i === idx ? { ...it, checked: !it.checked } : it);
    onUpdateChecklist(client.id, moduleName, updated);
  };

  const handleTogglePillItem = (it) => handleToggleModuleItem(it.moduleName, it.idx);

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

  // "Sujo" = tem conteúdo digitado que se perderia. O "Qual reunião?" é
  // comparado com o padrão calculado, e não com vazio: ele já nasce
  // preenchido, então tratá-lo como alteração deixaria o formulário sempre
  // sujo e faria pedir confirmação à toa.
  const isFormDirty = () => {
    const initial = initialFormState();
    return (
      form.numeroReuniao !== defaultNumeroFor(client) ||
      form.proximaReuniao !== '' ||
      form.duracaoTexto !== '' ||
      form.participantes.length > 0 ||
      form.status !== initial.status ||
      form.upsellProdutos.length > 0 ||
      form.upsellObservacao !== '' ||
      form.observacoes !== '' ||
      form.gravacoes.some(g => g.trim() !== '') ||
      hasGenerated
    );
  };

  // Trocar de cliente zera a nota — então avisa antes, em vez de descartar o
  // que já foi preenchido sem perguntar.
  const handleSelectClient = (novoId) => {
    if (novoId === selectedClientId) return;
    if (selectedClientId && isFormDirty() &&
        !window.confirm('Trocar de cliente vai recomeçar esta nota do zero.\nO que você já preencheu será descartado. Continuar?')) {
      return;
    }
    setSelectedClientId(novoId);
  };

  const isValid = () => !!client && form.numeroReuniao.trim() !== '';

  // O upsell marcado na Seção 4 não fica só no texto copiado — vira (ou
  // atualiza) uma oportunidade real em client.interestOffers, pra dar pra
  // achar depois no card do cliente e na aba Oportunidades. Faz upsert por
  // nome do produto: se já existe uma oportunidade com esse nome, só troca
  // o status; senão cria uma nova.
  const syncUpsellToOpportunities = () => {
    if (!client || form.upsellProdutos.length === 0) return;
    const existing = client.interestOffers || [];
    const updated = [...existing];
    form.upsellProdutos.forEach((produto, i) => {
      const idx = updated.findIndex(o => o.name === produto);
      if (idx >= 0) updated[idx] = { ...updated[idx], status: form.upsellStatus };
      else updated.push({ id: `io_${Date.now()}_${i}`, name: produto, status: form.upsellStatus });
    });
    onUpdateClient(client.id, { interestOffers: updated });
  };

  const handleGenerate = () => {
    if (!isValid()) {
      setShowValidation(true);
      return;
    }
    setShowValidation(false);
    syncUpsellToOpportunities();
    setHasGenerated(true);
    setCopyFeedback(false);
    setCopyError(false);
  };

  const handleClear = () => {
    if (isFormDirty() && !window.confirm('Limpar informações?\nTodos os dados preenchidos serão removidos.')) return;
    // Limpar apaga o conteúdo da nota, mas mantém o cliente: quem clica aqui
    // quer refazer a nota daquele cliente, não recomeçar a escolha. Com o
    // cliente preservado dá para repor o padrão de "Qual reunião?" em vez de
    // devolver o campo obrigatório em branco. Para trocar de cliente existe o
    // próprio seletor, que já avisa antes de descartar.
    setForm({ ...initialFormState(), numeroReuniao: defaultNumeroFor(client) });
    setParticipantInput('');
    setHasGenerated(false);
    copiedOnceRef.current = false;
    setCopyFeedback(false);
    setCopyError(false);
    setShowValidation(false);
  };

  const handleCopy = async () => {
    if (!hasGenerated || !notaText) return;
    try {
      await navigator.clipboard.writeText(notaText);
      // Copiar é o que caracteriza a nota como entregue — é esse gesto que
      // autoriza avançar o "já reportado" ao fechar.
      copiedOnceRef.current = true;
      // Se o upsell mudou depois de gerar, o que vale é o que foi copiado.
      syncUpsellToOpportunities();
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
    // Um clique fora do modal fecha a nota. Trocar de cliente e "Limpar" já
    // avisavam antes de descartar o preenchimento; fechar não avisava nada —
    // e era o jeito mais fácil de perder participantes, observações e links
    // sem querer. (Nota já gerada tem o aviso próprio, logo abaixo.)
    if (!hasGenerated && isFormDirty() &&
        !window.confirm('Fechar sem gerar a nota?\nO que você preencheu será descartado.')) {
      return;
    }
    if (client && hasGenerated) {
      // Copiada: a nota foi entregue, então os itens contam como reportados.
      // Gerada mas não copiada: antes isso avançava o baseline do mesmo jeito,
      // e um clique fora do modal fazia os itens sumirem da próxima nota sem
      // aviso. Agora a decisão é de quem está usando.
      const reportar = copiedOnceRef.current || window.confirm(
        'Você gerou a nota mas não clicou em "Copiar Nota".\n\n' +
        'OK = marcar os itens como já reportados (some da próxima nota).\n' +
        'Cancelar = manter tudo para a próxima nota.'
      );
      if (reportar) {
        onUpdateClient(client.id, {
          checklistBaseline: JSON.parse(JSON.stringify(client.checklists || {})),
          meetingNotesCount: (client.meetingNotesCount || 0) + 1
        });
      }
    }
    onClose();
  };

  const doneGroups = buildPillGroups(diff.moduleGroups, true);
  const pendingGroups = buildPillGroups(diff.moduleGroups, false);
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

            {/* Client context — obrigatório, fora da numeração */}
            {contextClient ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', padding: '10px 14px', backgroundColor: '#1E351F', border: '1px solid rgba(101, 255, 75, 0.3)', borderRadius: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Building2 size={15} style={{ color: 'var(--green-primary)' }} />
                  <span style={{ fontSize: '13px', color: '#fff' }}>Cliente: <strong style={{ color: 'var(--green-primary)' }}>{contextClient.name}</strong></span>
                </div>
                {crmLink && (
                  <a href={crmLink} target="_blank" rel="noreferrer" className="btn-secondary" style={{ padding: '5px 10px', fontSize: '11px', gap: '6px' }}>
                    <Link size={12} />
                    <span>Acesso ao CRM</span>
                  </a>
                )}
              </div>
            ) : (
              <div className="form-group">
                <label className="form-label">Cliente *</label>
                <CustomSelect
                  value={selectedClientId}
                  onChange={handleSelectClient}
                  placeholder="Selecionar cliente..."
                  options={clients.map(c => ({ value: c.id, label: c.name }))}
                />
                {showValidation && !client && <span style={{ fontSize: '11px', color: 'var(--badge-red)' }}>Selecione o cliente.</span>}
                {crmLink && (
                  <a href={crmLink} target="_blank" rel="noreferrer" className="btn-secondary" style={{ marginTop: '8px', alignSelf: 'flex-start', padding: '5px 10px', fontSize: '11px', gap: '6px' }}>
                    <Link size={12} />
                    <span>Acesso ao CRM</span>
                  </a>
                )}
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
                    options={OPPORTUNITY_STATUS_OPTIONS}
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
              {hasGenerated ? (
                <pre>{notaText}</pre>
              ) : (
                <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Preencha as informações e clique em "Gerar nota".</span>
              )}
            </div>
            {hasGenerated && (
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginTop: '8px' }}>
                A nota acompanha o que você marcar no checklist — o texto acima é sempre o que será copiado.
              </span>
            )}
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
            </div>
          </div>
          {hasGenerated ? (
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
