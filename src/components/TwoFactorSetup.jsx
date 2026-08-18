import React, { useState, useEffect, useCallback } from 'react';
import { ShieldCheck, ShieldOff, AlertCircle, Copy, Check } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

// Ativação/remoção do 2FA (TOTP) da própria conta. O fluxo tem três estados:
// 'off' (nenhum fator), 'enrolling' (QR na tela, esperando o código) e 'on'
// (fator verificado). O código só vira fator ativo depois do verify — um
// enroll abandonado no meio é limpo na próxima tentativa, senão o Supabase
// recusa criar outro.
export default function TwoFactorSetup({ viewOnly }) {
  const [state, setState] = useState('loading');
  const [factor, setFactor] = useState(null);
  const [enrollData, setEnrollData] = useState(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [secretCopied, setSecretCopied] = useState(false);

  const refresh = useCallback(async () => {
    const { data, error: listErr } = await supabase.auth.mfa.listFactors();
    if (listErr) {
      setError(listErr.message);
      setState('off');
      return;
    }
    const verified = (data?.totp || []).find(f => f.status === 'verified');
    setFactor(verified || null);
    setState(verified ? 'on' : 'off');
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const handleStartEnroll = async () => {
    setBusy(true);
    setError('');
    try {
      // Limpa tentativas anteriores que ficaram pela metade.
      const { data: existing } = await supabase.auth.mfa.listFactors();
      for (const f of (existing?.totp || []).filter(f => f.status !== 'verified')) {
        await supabase.auth.mfa.unenroll({ factorId: f.id });
      }
      const { data, error: enrollErr } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: `JetFlow ${new Date().getFullYear()}`
      });
      if (enrollErr) throw enrollErr;
      setEnrollData(data);
      setCode('');
      setState('enrolling');
    } catch (err) {
      setError(err.message || 'Não foi possível iniciar a ativação.');
    } finally {
      setBusy(false);
    }
  };

  const handleConfirm = async () => {
    if (code.length !== 6 || !enrollData) return;
    setBusy(true);
    setError('');
    try {
      const { data: challenge, error: chErr } = await supabase.auth.mfa.challenge({ factorId: enrollData.id });
      if (chErr) throw chErr;
      const { error: vErr } = await supabase.auth.mfa.verify({
        factorId: enrollData.id,
        challengeId: challenge.id,
        code
      });
      if (vErr) throw vErr;
      setEnrollData(null);
      setCode('');
      await refresh();
    } catch (err) {
      setError(/invalid/i.test(err.message || '') ? 'Código incorreto. Confira o app e tente o próximo.' : (err.message || 'Falha ao confirmar.'));
      setCode('');
    } finally {
      setBusy(false);
    }
  };

  const handleCancelEnroll = async () => {
    if (enrollData) await supabase.auth.mfa.unenroll({ factorId: enrollData.id }).catch(() => {});
    setEnrollData(null);
    setCode('');
    setError('');
    setState('off');
  };

  const handleDisable = async () => {
    if (!factor) return;
    if (!window.confirm('Desativar a verificação em duas etapas?\nSua conta passa a ser protegida só pela senha.')) return;
    setBusy(true);
    setError('');
    const { error: unErr } = await supabase.auth.mfa.unenroll({ factorId: factor.id });
    if (unErr) setError(unErr.message);
    await refresh();
    setBusy(false);
  };

  const copySecret = async () => {
    try {
      await navigator.clipboard.writeText(enrollData.totp.secret);
      setSecretCopied(true);
      setTimeout(() => setSecretCopied(false), 2500);
    } catch {
      setError('Não foi possível copiar — selecione o código e copie manualmente.');
    }
  };

  return (
    <div style={{ paddingTop: '24px', marginTop: '24px', borderTop: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <h3 className="section-title" style={{ fontSize: '14px' }}>Verificação em Duas Etapas (2FA)</h3>
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
          Além da senha, o login passa a pedir um código que só existe no seu celular. Se alguém descobrir sua senha, ainda assim não entra.
        </p>
      </div>

      {state === 'loading' && (
        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Carregando...</span>
      )}

      {state === 'on' && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', padding: '14px 16px', backgroundColor: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShieldCheck size={17} style={{ color: 'var(--badge-green)', flexShrink: 0 }} />
            <div>
              <span style={{ fontSize: '13px', color: '#fff', fontWeight: '600', display: 'block' }}>2FA ativo nesta conta</span>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                Ativado em {factor?.created_at ? new Date(factor.created_at).toLocaleDateString('pt-BR') : '—'}
              </span>
            </div>
          </div>
          <button
            type="button"
            className="btn-secondary vo-hide"
            style={{ color: 'var(--badge-red)', borderColor: 'rgba(239, 68, 68, 0.3)' }}
            onClick={handleDisable}
            disabled={busy || viewOnly}
          >
            <ShieldOff size={13} />
            <span>Desativar</span>
          </button>
        </div>
      )}

      {state === 'off' && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', padding: '14px 16px', backgroundColor: '#1B1B1B', border: '1px solid #2A2A2A', borderRadius: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShieldOff size={17} style={{ color: 'var(--badge-yellow)', flexShrink: 0 }} />
            <span style={{ fontSize: '13px', color: '#fff' }}>2FA desativado</span>
          </div>
          <button type="button" className="btn-primary vo-hide" onClick={handleStartEnroll} disabled={busy || viewOnly}>
            <ShieldCheck size={13} />
            <span>{busy ? 'Aguarde...' : 'Ativar 2FA'}</span>
          </button>
        </div>
      )}

      {state === 'enrolling' && enrollData && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '20px', backgroundColor: '#1B1B1B', border: '1px solid #2A2A2A', borderRadius: '8px' }}>
          <span style={{ fontSize: '13px', color: '#fff', fontWeight: '600' }}>
            1. Escaneie o QR code no Google Authenticator, Authy ou 1Password
          </span>

          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div style={{ backgroundColor: '#fff', padding: '12px', borderRadius: '8px', lineHeight: 0 }}>
              <img src={enrollData.totp.qr_code} alt="QR code do 2FA" style={{ width: '180px', height: '180px', display: 'block' }} />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
              Não consegue escanear? Digite este código no app:
            </span>
            <div style={{ display: 'flex', gap: '6px' }}>
              <input type="text" className="form-input" readOnly value={enrollData.totp.secret} style={{ flex: 1, fontSize: '12px', fontFamily: 'monospace' }} />
              <button type="button" className="btn-icon" onClick={copySecret} title="Copiar código">
                {secretCopied ? <Check size={14} style={{ color: 'var(--green-primary)' }} /> : <Copy size={14} />}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">2. Digite o código de 6 dígitos que aparecer no app</label>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              className="form-input"
              value={code}
              onChange={e => { setCode(e.target.value.replace(/\D/g, '').slice(0, 6)); setError(''); }}
              placeholder="000000"
              style={{ textAlign: 'center', fontSize: '20px', letterSpacing: '8px', fontWeight: '700' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button type="button" className="btn-secondary" onClick={handleCancelEnroll} disabled={busy}>Cancelar</button>
            <button type="button" className="btn-primary" onClick={handleConfirm} disabled={busy || code.length !== 6}>
              {busy ? 'Confirmando...' : 'Ativar'}
            </button>
          </div>
        </div>
      )}

      {error && (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', padding: '10px 12px', backgroundColor: '#2A1414', border: '1px solid rgba(239, 68, 68, 0.35)', borderRadius: '6px' }}>
          <AlertCircle size={13} style={{ color: '#EF4444', flexShrink: 0, marginTop: '1px' }} />
          <span style={{ fontSize: '12px', color: '#EF4444' }}>{error}</span>
        </div>
      )}
    </div>
  );
}
