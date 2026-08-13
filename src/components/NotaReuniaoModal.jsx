import React, { useState } from 'react';
import {
  X, Sparkles, Eraser, Copy, RefreshCw, Building2, Calendar,
  Clock, Users, Target, ListChecks, ArrowRight, DollarSign,
  AlertTriangle, FileText, Video, Plus, Trash2, Check
} from 'lucide-react';
import CustomSelect from './CustomSelect';
import CustomDatePicker from './CustomDatePicker';
import { getTodayBR } from '../utils';

// Same topic vocabulary drives both "O que foi realizado" (done) and
// "Pendências" (still pending) — a topic is either one or the other.
const TOPIC_OPTIONS = [
  { id: 'config_iniciais', label: 'Configurações iniciais', realizadoPhrase: 'Configurações iniciais realizadas.', pendentePhrase: 'Configurações iniciais pendentes.' },
  { id: 'canais', label: 'Conexão de canais', realizadoPhrase: 'Canais conectados e validados.', pendentePhrase: 'Conexão de canais pendente.' },
  { id: 'atendimento', label: 'Atendimento', realizadoPhrase: 'Atendimento configurado.', pendentePhrase: 'Configuração do atendimento pendente.' },
  { id: 'chatbot', label: 'Chatbot', realizadoPhrase: 'Chatbot configurado e validado.', pendentePhrase: 'Configuração do chatbot pendente.' },
  { id: 'dashboard', label: 'Dashboard', realizadoPhrase: 'Dashboard apresentado e orientado.', pendentePhrase: 'Apresentação do dashboard pendente.' },
  { id: 'dashboard_ia', label: 'Dashboard de IA', realizadoPhrase: 'Dashboard de IA apresentado e orientado.', pendentePhrase: 'Apresentação do Dashboard de IA pendente.' },
  { id: 'gestao_leads', label: 'Gestão de Leads', realizadoPhrase: 'Gestão de leads configurada.', pendentePhrase: 'Configuração da gestão de leads pendente.' },
  { id: 'contatos', label: 'Contatos', realizadoPhrase: 'Contatos organizados e configurados.', pendentePhrase: 'Organização dos contatos pendente.' },
  { id: 'funil', label: 'Funil', realizadoPhrase: 'Funil configurado e validado.', pendentePhrase: 'Configuração do funil pendente.' },
  { id: 'automacoes', label: 'Automações', realizadoPhrase: 'Automações configuradas.', pendentePhrase: 'Configuração das automações pendente.' },
  { id: 'integracoes', label: 'Integrações', realizadoPhrase: 'Integrações configuradas.', pendentePhrase: 'Configuração das integrações pendente.' },
  { id: 'treinamento', label: 'Treinamento', realizadoPhrase: 'Orientações e treinamento realizados.', pendentePhrase: 'Treinamento pendente.' },
  { id: 'validacao', label: 'Validação', realizadoPhrase: 'Funcionalidades apresentadas e validadas.', pendentePhrase: 'Validação das funcionalidades pendente.' },
  { id: 'ajustes', label: 'Ajustes', realizadoPhrase: 'Ajustes realizados conforme solicitado.', pendentePhrase: 'Ajustes pendentes.' },
  { id: 'testes', label: 'Testes', realizadoPhrase: 'Testes realizados.', pendentePhrase: 'Testes pendentes.' },
  { id: 'outros', label: 'Outros', realizadoPhrase: 'Outras atividades realizadas conforme necessidade do cliente.', pendentePhrase: 'Outras pendências.' }
];

const STATUS_OPTIONS = [
  { value: 'Em andamento', emoji: '🟢' },
  { value: 'Aguardando cliente', emoji: '🟡' },
  { value: 'Próxima etapa agendada', emoji: '🔵' },
  { value: 'Ajustes pendentes', emoji: '🟠' },
  { value: 'Implantação concluída', emoji: '✅' }
];

const NUMERO_REUNIAO_OPTIONS = Array.from({ length: 20 }, (_, i) => `${i + 1}ª reunião`);

const UPSELL_PRODUCTS = ['Dashboard de IA', 'Automação', 'Chatbot', 'Canal adicional', 'Integração', 'Outro'];

const UPSELL_STATUS_PHRASE = {
  'Não identificado': (produtos) => `Produto(s) mencionado(s): ${produtos}.`,
  'Sem interesse': (produtos) => `Sem interesse em ${produtos}.`,
  'Interesse demonstrado': (produtos) => `Interesse demonstrado em ${produtos}.`,
  'Solicitar abordagem comercial': (produtos) => `Solicitar abordagem comercial para ${produtos}.`,
  'Encaminhado ao comercial': (produtos) => `Encaminhado ao comercial: ${produtos}.`,
  'Em negociação': (produtos) => `Em negociação: ${produtos}.`,
  'Convertido': (produtos) => `Convertido: ${produtos}.`
};

function DynamicListField({ items, onAdd, onRemove, placeholder, addLabel }) {
  const [value, setValue] = useState('');
  const handleAdd = () => {
    if (!value.trim()) return;
    onAdd(value.trim());
    setValue('');
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {items.map((item, idx) => (
        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ flex: 1, fontSize: '13px', padding: '8px 10px', backgroundColor: '#1B1B1B', border: '1px solid #2A2A2A', borderRadius: '6px', color: '#ddd' }}>{item}</span>
          <button type="button" className="btn-danger-icon" onClick={() => onRemove(idx)} title="Remover"><Trash2 size={13} /></button>
        </div>
      ))}
      <div style={{ display: 'flex', gap: '8px' }}>
        <input
          type="text"
          className="form-input"
          style={{ flex: 1 }}
          value={value}
          onChange={e => setValue(e.target.value)}
          placeholder={placeholder}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAdd(); } }}
        />
        <button type="button" className="btn-secondary" onClick={handleAdd}>
          <Plus size={14} />
          <span>{addLabel}</span>
        </button>
      </div>
    </div>
  );
}

const initialFormState = () => ({
  numeroReuniao: '',
  data: getTodayBR(),
  proximaReuniao: '',
  duracaoHoras: '',
  duracaoMinutos: '',
  participantes: [],
  status: 'Em andamento',
  objetivo: '',
  realizado: [],
  detalheManual: '',
  pendencias: [],
  proximaEtapa: [],
  upsellProdutos: [],
  upsellStatus: 'Interesse demonstrado',
  pontosAtencao: [],
  observacoes: '',
  gravacao: ''
});

function buildNotaText(form, responsavelNome) {
  const lines = [];

  const numero = form.numeroReuniao.trim();
  lines.push(`IMPLANTAÇÃO TÉCNICA – ${numero.toUpperCase()} (${responsavelNome})`);
  lines.push('');

  lines.push(`📅 Data: ${form.data}`);
  if (form.proximaReuniao) lines.push(`📅 Próxima reunião: ${form.proximaReuniao}`);

  const h = parseInt(form.duracaoHoras, 10) || 0;
  const m = parseInt(form.duracaoMinutos, 10) || 0;
  if (h > 0 || m > 0) {
    let duracaoStr = '';
    if (h > 0 && m > 0) duracaoStr = `${h}h e ${m}min`;
    else if (h > 0) duracaoStr = `${h}h`;
    else duracaoStr = `${m}min`;
    lines.push(`⏱️ Duração: ${duracaoStr}`);
  }

  if (form.participantes.length > 0) lines.push(`👥 Participantes: ${form.participantes.join(', ')}`);

  lines.push('');
  const statusMeta = STATUS_OPTIONS.find(s => s.value === form.status) || STATUS_OPTIONS[0];
  lines.push(`${statusMeta.emoji} STATUS: ${statusMeta.value}`);

  if (form.objetivo.trim()) {
    lines.push('');
    lines.push('🎯 OBJETIVO:');
    lines.push(form.objetivo.trim());
  }

  const realizadoPhrases = TOPIC_OPTIONS
    .filter(opt => form.realizado.includes(opt.id))
    .map(opt => opt.realizadoPhrase);
  if (form.detalheManual.trim()) realizadoPhrases.push(form.detalheManual.trim());
  if (realizadoPhrases.length > 0) {
    lines.push('');
    lines.push('🛠️ REALIZADO:');
    realizadoPhrases.forEach(p => lines.push(`• ${p}`));
  }

  if (form.pendencias.length > 0) {
    lines.push('');
    lines.push('🔍 PENDÊNCIAS:');
    form.pendencias.forEach(p => lines.push(`• ${p}`));
  }

  if (form.proximaEtapa.length > 0) {
    lines.push('');
    lines.push('➡️ PRÓXIMA ETAPA:');
    form.proximaEtapa.forEach(p => lines.push(`• ${p}`));
  }

  if (form.upsellProdutos.length > 0) {
    lines.push('');
    lines.push('💰 UPSELL / OPORTUNIDADE:');
    const phraseFn = UPSELL_STATUS_PHRASE[form.upsellStatus] || UPSELL_STATUS_PHRASE['Não identificado'];
    lines.push(phraseFn(form.upsellProdutos.join(', ')));
  }

  if (form.pontosAtencao.length > 0) {
    lines.push('');
    lines.push('⚠️ PONTOS DE ATENÇÃO:');
    form.pontosAtencao.forEach(p => lines.push(`• ${p}`));
  }

  if (form.observacoes.trim()) {
    lines.push('');
    lines.push('📝 OBSERVAÇÕES:');
    lines.push(form.observacoes.trim());
  }

  if (form.gravacao.trim()) {
    lines.push('');
    lines.push('🎥 GRAVAÇÃO:');
    lines.push(form.gravacao.trim());
  }

  return lines.join('\n');
}

export default function NotaReuniaoModal({ clients, contextClient, profile, onClose }) {
  const [selectedClientId, setSelectedClientId] = useState('');
  const [form, setForm] = useState(initialFormState());
  const [participantInput, setParticipantInput] = useState('');
  const [generatedNote, setGeneratedNote] = useState(null);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const [showValidation, setShowValidation] = useState(false);

  const client = contextClient || clients.find(c => c.id === selectedClientId) || null;

  const setField = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  const toggleRealizado = (id) => {
    setForm(prev => ({
      ...prev,
      realizado: prev.realizado.includes(id) ? prev.realizado.filter(r => r !== id) : [...prev.realizado, id]
    }));
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

  const isFormDirty = () => {
    const initial = initialFormState();
    return (
      form.numeroReuniao !== '' ||
      form.proximaReuniao !== '' ||
      form.duracaoHoras !== '' ||
      form.duracaoMinutos !== '' ||
      form.participantes.length > 0 ||
      form.status !== initial.status ||
      form.objetivo !== '' ||
      form.realizado.length > 0 ||
      form.detalheManual !== '' ||
      form.pendencias.length > 0 ||
      form.proximaEtapa.length > 0 ||
      form.upsellProdutos.length > 0 ||
      form.pontosAtencao.length > 0 ||
      form.observacoes !== '' ||
      form.gravacao !== '' ||
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
    setGeneratedNote(buildNotaText(form, profile.name));
    setCopyFeedback(false);
    setCopyError(false);
  };

  const handleClear = () => {
    if (isFormDirty() && !window.confirm('Limpar informações?\nTodos os dados preenchidos serão removidos.')) return;
    setForm(initialFormState());
    setParticipantInput('');
    setGeneratedNote(null);
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

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content nota-reuniao-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">📝 Nova Nota de Reunião</h3>
          <button className="btn-icon" onClick={onClose}><X size={16} /></button>
        </div>

        <div className="modal-body nota-reuniao-layout">
          {/* ── FORM COLUMN ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

            {/* Client context */}
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

            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Número da reunião *</label>
                <CustomSelect
                  value={form.numeroReuniao}
                  onChange={v => setField('numeroReuniao', v)}
                  placeholder="Selecionar..."
                  options={NUMERO_REUNIAO_OPTIONS}
                />
                {showValidation && !form.numeroReuniao.trim() && <span style={{ fontSize: '11px', color: 'var(--badge-red)' }}>Selecione o número da reunião.</span>}
              </div>
              <div className="form-group">
                <label className="form-label"><Calendar size={11} style={{ verticalAlign: '-1px', marginRight: '4px' }} />Data da reunião</label>
                <CustomDatePicker value={form.data} onChange={v => setField('data', v)} />
              </div>
              <div className="form-group">
                <label className="form-label"><Calendar size={11} style={{ verticalAlign: '-1px', marginRight: '4px' }} />Próxima reunião</label>
                <CustomDatePicker value={form.proximaReuniao} onChange={v => setField('proximaReuniao', v)} />
              </div>
              <div className="form-group">
                <label className="form-label"><Clock size={11} style={{ verticalAlign: '-1px', marginRight: '4px' }} />Duração</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input type="number" min="0" className="form-input" placeholder="Horas" value={form.duracaoHoras} onChange={e => setField('duracaoHoras', e.target.value)} />
                  <input type="number" min="0" className="form-input" placeholder="Minutos" value={form.duracaoMinutos} onChange={e => setField('duracaoMinutos', e.target.value)} />
                </div>
              </div>
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

            <div className="form-group">
              <label className="form-label">Status da implantação</label>
              <CustomSelect
                value={form.status}
                onChange={v => setField('status', v)}
                options={STATUS_OPTIONS.map(s => ({ value: s.value, label: `${s.emoji} ${s.value}` }))}
              />
            </div>

            <div className="form-group">
              <label className="form-label"><Target size={11} style={{ verticalAlign: '-1px', marginRight: '4px' }} />Objetivo da reunião</label>
              <input type="text" className="form-input" placeholder="Ex.: Configurar e validar o chatbot de atendimento." value={form.objetivo} onChange={e => setField('objetivo', e.target.value)} />
            </div>

            <div className="form-group">
              <label className="form-label"><ListChecks size={11} style={{ verticalAlign: '-1px', marginRight: '4px' }} />O que foi realizado</label>
              <div className="checkbox-group" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
                {TOPIC_OPTIONS.map(opt => (
                  <label key={opt.id} className="checkbox-label">
                    <input type="checkbox" className="premium-check" checked={form.realizado.includes(opt.id)} onChange={() => toggleRealizado(opt.id)} />
                    <span>{opt.label}</span>
                  </label>
                ))}
              </div>
              <input
                type="text"
                className="form-input"
                style={{ marginTop: '8px' }}
                placeholder="+ Adicionar detalhe: algum detalhe específico que aconteceu nesta reunião?"
                value={form.detalheManual}
                onChange={e => setField('detalheManual', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">🔍 Pendências</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
                {TOPIC_OPTIONS.map(topic => {
                  const active = form.pendencias.includes(topic.pendentePhrase);
                  return (
                    <button
                      key={topic.id}
                      type="button"
                      className={`preset-pill ${active ? 'active' : ''}`}
                      onClick={() => setField('pendencias', active
                        ? form.pendencias.filter(p => p !== topic.pendentePhrase)
                        : [...form.pendencias, topic.pendentePhrase])}
                    >
                      {active && <Check size={11} />}
                      <span>{topic.label}</span>
                    </button>
                  );
                })}
              </div>
              <DynamicListField
                items={form.pendencias}
                onAdd={(v) => setField('pendencias', [...form.pendencias, v])}
                onRemove={(idx) => setField('pendencias', form.pendencias.filter((_, i) => i !== idx))}
                placeholder="Outra pendência..."
                addLabel="Adicionar pendência"
              />
            </div>

            <div className="form-group">
              <label className="form-label"><ArrowRight size={11} style={{ verticalAlign: '-1px', marginRight: '4px' }} />Próxima etapa</label>
              <DynamicListField
                items={form.proximaEtapa}
                onAdd={(v) => setField('proximaEtapa', [...form.proximaEtapa, v])}
                onRemove={(idx) => setField('proximaEtapa', form.proximaEtapa.filter((_, i) => i !== idx))}
                placeholder="Ex.: Configuração das automações"
                addLabel="Adicionar próxima etapa"
              />
            </div>

            <div className="form-group">
              <label className="form-label"><DollarSign size={11} style={{ verticalAlign: '-1px', marginRight: '4px' }} />Upsell / Oportunidade</label>
              <div className="checkbox-group" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
                {UPSELL_PRODUCTS.map(produto => (
                  <label key={produto} className="checkbox-label">
                    <input type="checkbox" className="premium-check" checked={form.upsellProdutos.includes(produto)} onChange={() => toggleUpsellProduto(produto)} />
                    <span>{produto}</span>
                  </label>
                ))}
              </div>
              {form.upsellProdutos.length > 0 && (
                <div style={{ marginTop: '8px' }}>
                  <CustomSelect
                    value={form.upsellStatus}
                    onChange={v => setField('upsellStatus', v)}
                    options={Object.keys(UPSELL_STATUS_PHRASE)}
                  />
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label"><AlertTriangle size={11} style={{ verticalAlign: '-1px', marginRight: '4px' }} />Pontos de atenção</label>
              <DynamicListField
                items={form.pontosAtencao}
                onAdd={(v) => setField('pontosAtencao', [...form.pontosAtencao, v])}
                onRemove={(idx) => setField('pontosAtencao', form.pontosAtencao.filter((_, i) => i !== idx))}
                placeholder="Ex.: Aguardar acesso ao Instagram"
                addLabel="Adicionar"
              />
            </div>

            <div className="form-group">
              <label className="form-label"><FileText size={11} style={{ verticalAlign: '-1px', marginRight: '4px' }} />Observações</label>
              <textarea className="form-textarea" rows={2} placeholder="Alguma observação adicional?" value={form.observacoes} onChange={e => setField('observacoes', e.target.value)} />
            </div>

            <div className="form-group">
              <label className="form-label"><Video size={11} style={{ verticalAlign: '-1px', marginRight: '4px' }} />Link da gravação</label>
              <input type="url" className="form-input" placeholder="https://..." value={form.gravacao} onChange={e => setField('gravacao', e.target.value)} />
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

        <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
          <div>
            {copyFeedback && <span style={{ fontSize: '12px', color: 'var(--green-primary)', fontWeight: '600' }}>✓ Nota copiada!</span>}
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
            {generatedNote ? (
              <button type="button" className="btn-primary" onClick={handleCopy}>
                <Copy size={14} />
                <span>Copiar Nota</span>
              </button>
            ) : (
              <button type="button" className="btn-primary" onClick={handleGenerate}>
                <Sparkles size={14} />
                <span>Gerar Nota</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
