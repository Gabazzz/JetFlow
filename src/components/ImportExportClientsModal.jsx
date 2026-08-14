import React, { useState, useRef, useMemo } from 'react';
import { X, Upload, FileSpreadsheet, Check, AlertCircle, ArrowLeft } from 'lucide-react';
import CustomSelect from './CustomSelect';
import { IMPORTABLE_FIELDS, guessColumnMapping, parseXlsxFile, buildImportPlan } from '../lib/clientImportExport';

const DUPLICATE_MODES = [
  { value: 'atualizar', label: 'Atualizar existente', description: 'Preenche só os campos vindos da planilha; o que já estava preenchido e veio em branco é mantido.' },
  { value: 'substituir', label: 'Substituir', description: 'Sobrescreve os campos vindos da planilha, mesmo os que vierem em branco.' },
  { value: 'ignorar', label: 'Ignorar (duplica)', description: 'Não procura cliente existente — toda linha vira um cadastro novo, mesmo repetido.' }
];

const FIELD_OPTIONS = [{ value: '', label: 'Não importar' }, ...IMPORTABLE_FIELDS.map(f => ({ value: f.key, label: f.label }))];

export default function ImportExportClientsModal({ clients, stages, profileName, onImport, onClose }) {
  const [step, setStep] = useState('upload'); // upload | map | result
  const [fileName, setFileName] = useState('');
  const [headers, setHeaders] = useState([]);
  const [rows, setRows] = useState([]);
  const [mapping, setMapping] = useState([]);
  const [duplicateMode, setDuplicateMode] = useState('atualizar');
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [resultSummary, setResultSummary] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileSelected = async (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    setParseError('');
    setIsParsing(true);
    try {
      const { headers: parsedHeaders, rows: parsedRows } = await parseXlsxFile(file);
      if (parsedHeaders.length === 0) {
        setParseError('Não encontrei nenhuma coluna nessa planilha.');
        setIsParsing(false);
        return;
      }
      setFileName(file.name);
      setHeaders(parsedHeaders);
      setRows(parsedRows);
      setMapping(guessColumnMapping(parsedHeaders));
      setStep('map');
    } catch (err) {
      setParseError('Não consegui ler esse arquivo. Confirme se é um .xlsx válido.');
    } finally {
      setIsParsing(false);
    }
  };

  const plan = useMemo(() => {
    if (step !== 'map') return null;
    return buildImportPlan({ headers, rows, mapping, existingClients: clients, duplicateMode, stages, profileName });
  }, [step, headers, rows, mapping, duplicateMode, clients, stages, profileName]);

  const hasNameMapped = mapping.includes('name');

  const handleConfirmImport = async () => {
    if (!plan) return;
    setIsImporting(true);
    await onImport({ created: plan.created, updated: plan.updated });
    setResultSummary({ created: plan.created.length, updated: plan.updated.length, skipped: plan.skipped });
    setIsImporting(false);
    setStep('result');
  };

  const handleBackToUpload = () => {
    setStep('upload');
    setFileName('');
    setHeaders([]);
    setRows([]);
    setMapping([]);
    setParseError('');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '620px' }}>
        <div className="modal-header">
          <h3 className="modal-title">Importar Clientes</h3>
          <button className="btn-icon" onClick={onClose}><X size={16} /></button>
        </div>

        {step === 'upload' && (
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Envie uma planilha .xlsx com os clientes. No próximo passo você escolhe o que cada coluna representa.
            </p>
            <div
              onClick={() => !isParsing && fileInputRef.current.click()}
              style={{
                border: '1px dashed #333',
                borderRadius: '10px',
                padding: '40px 20px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '10px',
                cursor: isParsing ? 'default' : 'pointer',
                color: '#666'
              }}
            >
              <Upload size={26} style={{ color: isParsing ? '#444' : 'var(--green-primary)' }} />
              <span style={{ fontSize: '13px', fontWeight: '600', color: '#ccc' }}>
                {isParsing ? 'Lendo planilha...' : 'Clique para escolher um arquivo .xlsx'}
              </span>
              <input ref={fileInputRef} type="file" accept=".xlsx,.xls" onChange={handleFileSelected} style={{ display: 'none' }} />
            </div>
            {parseError && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', backgroundColor: '#2A1414', border: '1px solid rgba(239, 68, 68, 0.35)', borderRadius: '6px' }}>
                <AlertCircle size={14} style={{ color: '#EF4444', flexShrink: 0 }} />
                <span style={{ fontSize: '12px', color: '#EF4444' }}>{parseError}</span>
              </div>
            )}
          </div>
        )}

        {step === 'map' && (
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-secondary)' }}>
              <FileSpreadsheet size={14} style={{ color: 'var(--green-primary)' }} />
              <span>{fileName} — {rows.length} linha{rows.length !== 1 ? 's' : ''}</span>
              <button type="button" onClick={handleBackToUpload} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#666', fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <ArrowLeft size={11} />
                Trocar arquivo
              </button>
            </div>

            <div className="form-group">
              <label className="form-label">O que fazer com clientes já existentes?</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {DUPLICATE_MODES.map(mode => (
                  <label
                    key={mode.value}
                    style={{
                      display: 'flex',
                      gap: '10px',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: `1px solid ${duplicateMode === mode.value ? 'var(--green-primary)' : '#252525'}`,
                      backgroundColor: duplicateMode === mode.value ? 'rgba(101, 255, 75, 0.06)' : '#161616',
                      cursor: 'pointer'
                    }}
                  >
                    <input
                      type="radio"
                      name="duplicateMode"
                      checked={duplicateMode === mode.value}
                      onChange={() => setDuplicateMode(mode.value)}
                      style={{ marginTop: '3px', accentColor: 'var(--green-primary)' }}
                    />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ fontSize: '13px', fontWeight: '700', color: '#fff' }}>{mode.label}</span>
                      <span style={{ fontSize: '11px', color: '#888' }}>{mode.description}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Colunas encontradas na planilha</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {headers.map((header, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ flex: 1, fontSize: '13px', color: '#ccc', padding: '8px 10px', backgroundColor: '#161616', border: '1px solid #252525', borderRadius: '6px' }} title={header}>
                      {header || `Coluna ${idx + 1}`}
                    </span>
                    <span style={{ color: '#444', fontSize: '12px' }}>→</span>
                    <div style={{ flex: 1 }}>
                      <CustomSelect
                        value={mapping[idx] || ''}
                        onChange={v => setMapping(prev => prev.map((m, i) => i === idx ? v : m))}
                        options={FIELD_OPTIONS}
                      />
                    </div>
                  </div>
                ))}
              </div>
              {!hasNameMapped && (
                <span style={{ fontSize: '11px', color: 'var(--badge-red)', marginTop: '6px', display: 'block' }}>
                  Mapeie ao menos uma coluna para "Nome" — linhas sem nome são ignoradas.
                </span>
              )}
            </div>

            {plan && (
              <div style={{ display: 'flex', gap: '16px', padding: '12px 14px', backgroundColor: '#161616', border: '1px solid #252525', borderRadius: '8px', fontSize: '12px' }}>
                <span style={{ color: 'var(--green-primary)', fontWeight: '700' }}>{plan.created.length} novo{plan.created.length !== 1 ? 's' : ''}</span>
                <span style={{ color: '#38BDF8', fontWeight: '700' }}>{plan.updated.length} {duplicateMode === 'substituir' ? 'substituído' : 'atualizado'}{plan.updated.length !== 1 ? 's' : ''}</span>
                {plan.skipped > 0 && <span style={{ color: '#888' }}>{plan.skipped} ignorado{plan.skipped !== 1 ? 's' : ''} (sem nome)</span>}
              </div>
            )}
          </div>
        )}

        {step === 'result' && resultSummary && (
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', padding: '30px 20px', textAlign: 'center' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#1E351F', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Check size={24} style={{ color: 'var(--green-primary)' }} />
            </div>
            <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#fff', margin: 0 }}>Importação concluída</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
              {resultSummary.created} cliente{resultSummary.created !== 1 ? 's' : ''} criado{resultSummary.created !== 1 ? 's' : ''}, {resultSummary.updated} atualizado{resultSummary.updated !== 1 ? 's' : ''}
              {resultSummary.skipped > 0 ? `, ${resultSummary.skipped} ignorado${resultSummary.skipped !== 1 ? 's' : ''} sem nome` : ''}.
            </p>
          </div>
        )}

        <div className="modal-footer">
          {step === 'map' && (
            <>
              <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
              <button type="button" className="btn-primary" disabled={!hasNameMapped || isImporting} onClick={handleConfirmImport}>
                {isImporting ? 'Importando...' : 'Confirmar Importação'}
              </button>
            </>
          )}
          {step === 'upload' && (
            <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
          )}
          {step === 'result' && (
            <button type="button" className="btn-primary" onClick={onClose}>Concluir</button>
          )}
        </div>
      </div>
    </div>
  );
}
