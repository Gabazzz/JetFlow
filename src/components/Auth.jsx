import React, { useState } from 'react';
import { LogIn, UserPlus, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import jetflowLogo from '../assets/jetflow-logo.webp';

export default function Auth() {
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [signupMessage, setSignupMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSignupMessage('');
    setLoading(true);

    if (mode === 'login') {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) setError(signInError.message === 'Invalid login credentials' ? 'E-mail ou senha incorretos.' : signInError.message);
    } else {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name: name.trim() } }
      });
      if (signUpError) {
        setError(signUpError.message);
      } else if (!data.session) {
        setSignupMessage('Conta criada! Verifique seu e-mail para confirmar antes de entrar.');
      }
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-primary)', padding: '20px' }}>
      <div style={{ width: '100%', maxWidth: '380px', backgroundColor: '#161616', border: '1px solid #252525', borderRadius: '12px', padding: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '28px' }}>
          <img src={jetflowLogo} alt="JetFlow" style={{ maxWidth: '220px', width: '100%', height: 'auto' }} />
        </div>

        <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#fff', marginBottom: '4px' }}>
          {mode === 'login' ? 'Entrar no JetFlow' : 'Criar sua conta'}
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
          {mode === 'login' ? 'Seus clientes e dados são só seus.' : 'Cada conta tem sua própria carteira de clientes, privada.'}
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {mode === 'signup' && (
              <div className="form-group">
                <label className="form-label">Nome</label>
                <input type="text" className="form-input" value={name} onChange={e => setName(e.target.value)} placeholder="Seu nome" required />
              </div>
            )}
            <div className="form-group">
              <label className="form-label">E-mail</label>
              <input type="email" className="form-input" value={email} onChange={e => setEmail(e.target.value)} placeholder="voce@jetsales.com.br" required />
            </div>
            <div className="form-group">
              <label className="form-label">Senha</label>
              <input type="password" className="form-input" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" minLength={6} required />
            </div>
          </div>

          {error && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', marginTop: '14px', padding: '10px 12px', backgroundColor: '#2A1414', border: '1px solid rgba(239, 68, 68, 0.35)', borderRadius: '6px' }}>
              <AlertCircle size={13} style={{ color: '#EF4444', flexShrink: 0, marginTop: '1px' }} />
              <span style={{ fontSize: '12px', color: '#EF4444' }}>{error}</span>
            </div>
          )}
          {signupMessage && (
            <div style={{ marginTop: '14px', padding: '10px 12px', backgroundColor: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.35)', borderRadius: '6px' }}>
              <span style={{ fontSize: '12px', color: 'var(--badge-green)' }}>{signupMessage}</span>
            </div>
          )}

          <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '20px', padding: '10px' }} disabled={loading}>
            {mode === 'login' ? <LogIn size={14} /> : <UserPlus size={14} />}
            <span>{loading ? 'Aguarde...' : mode === 'login' ? 'Entrar' : 'Criar conta'}</span>
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '18px' }}>
          <button
            type="button"
            onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); setSignupMessage(''); }}
            style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '12px', cursor: 'pointer' }}
          >
            {mode === 'login' ? 'Não tem conta? ' : 'Já tem conta? '}
            <span style={{ color: 'var(--green-primary)', fontWeight: '600' }}>{mode === 'login' ? 'Criar uma' : 'Entrar'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
