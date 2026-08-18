import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, AlertCircle, LogOut } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import jetflowLogo from '../assets/jetflow-logo.webp';

// Segundo passo do login, mostrado só para quem ativou 2FA: a senha já foi
// aceita (a sessão existe), mas ela ainda está em aal1 — o app só libera os
// dados depois que o código do autenticador eleva a sessão para aal2.
export default function TwoFactorChallenge({ onVerified, onSignOut }) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [factorId, setFactorId] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    (async () => {
      const { data, error: listErr } = await supabase.auth.mfa.listFactors();
      if (listErr) {
        setError('Não foi possível carregar seu método de verificação.');
        return;
      }
      const totp = (data?.totp || []).find(f => f.status === 'verified');
      if (!totp) {
        setError('Nenhum autenticador ativo encontrado nesta conta.');
        return;
      }
      setFactorId(totp.id);
      inputRef.current?.focus();
    })();
  }, []);

  const handleVerify = async (e) => {
    e?.preventDefault();
    if (!factorId || code.length !== 6 || verifying) return;
    setVerifying(true);
    setError('');
    try {
      const { data: challenge, error: chErr } = await supabase.auth.mfa.challenge({ factorId });
      if (chErr) throw chErr;
      const { error: vErr } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challenge.id,
        code
      });
      if (vErr) throw vErr;
      onVerified();
    } catch (err) {
      setError(/invalid/i.test(err.message || '') ? 'Código incorreto ou expirado. Tente o próximo.' : (err.message || 'Falha na verificação.'));
      setCode('');
      inputRef.current?.focus();
    } finally {
      setVerifying(false);
    }
  };

  // 6 dígitos é o código inteiro — envia sozinho, evita um clique à toa.
  const handleChange = (value) => {
    const digits = value.replace(/\D/g, '').slice(0, 6);
    setCode(digits);
    setError('');
  };

  useEffect(() => {
    if (code.length === 6 && factorId && !verifying) handleVerify();
  }, [code]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-primary)', padding: '20px' }}>
      <div style={{ width: '100%', maxWidth: '380px', backgroundColor: '#161616', border: '1px solid #252525', borderRadius: '12px', padding: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '28px' }}>
          <img src={jetflowLogo} alt="JetFlow" style={{ maxWidth: '220px', width: '100%', height: 'auto' }} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <ShieldCheck size={17} style={{ color: 'var(--green-primary)' }} />
          <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#fff', margin: 0 }}>Verificação em duas etapas</h2>
        </div>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
          Digite o código de 6 dígitos do seu aplicativo autenticador.
        </p>

        <form onSubmit={handleVerify}>
          <input
            ref={inputRef}
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            className="form-input"
            value={code}
            onChange={e => handleChange(e.target.value)}
            placeholder="000000"
            disabled={verifying || !factorId}
            style={{ width: '100%', boxSizing: 'border-box', textAlign: 'center', fontSize: '24px', letterSpacing: '8px', textIndent: '8px', fontWeight: '700', padding: '12px' }}
          />

          {error && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', marginTop: '14px', padding: '10px 12px', backgroundColor: '#2A1414', border: '1px solid rgba(239, 68, 68, 0.35)', borderRadius: '6px' }}>
              <AlertCircle size={13} style={{ color: '#EF4444', flexShrink: 0, marginTop: '1px' }} />
              <span style={{ fontSize: '12px', color: '#EF4444' }}>{error}</span>
            </div>
          )}

          <button
            type="submit"
            className="btn-primary"
            style={{ width: '100%', justifyContent: 'center', marginTop: '20px', padding: '10px' }}
            disabled={verifying || code.length !== 6 || !factorId}
          >
            {verifying ? 'Verificando...' : 'Confirmar'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '18px' }}>
          <button
            type="button"
            onClick={onSignOut}
            style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '12px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
          >
            <LogOut size={11} />
            <span>Entrar com outra conta</span>
          </button>
        </div>
      </div>
    </div>
  );
}
