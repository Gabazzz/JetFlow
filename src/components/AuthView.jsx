import React, { useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { LogIn, UserPlus, Lock, Mail, User, Shield, AlertTriangle } from 'lucide-react';

export default function AuthView({ onAuthSuccess }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('Especialista de Implantação');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setInfoMsg('');

    if (!isSupabaseConfigured) {
      setErrorMsg('⚠️ O Supabase ainda não foi configurado com suas credenciais reais no arquivo .env!');
      return;
    }

    if (!email || !password) {
      setErrorMsg('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    setLoading(true);

    try {
      if (isSignUp) {
        if (!name) {
          setErrorMsg('Por favor, insira o seu nome completo.');
          setLoading(false);
          return;
        }

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name,
              role: role || 'Especialista de Implantação'
            }
          }
        });

        if (error) throw error;

        if (data?.session) {
          setInfoMsg('Conta criada com sucesso! Redirecionando...');
          if (onAuthSuccess) onAuthSuccess(data.session);
        } else {
          setInfoMsg('Conta criada! Por favor, verifique seu e-mail para confirmar o cadastro ou faça login.');
          setIsSignUp(false);
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (error) throw error;

        if (data?.session) {
          if (onAuthSuccess) onAuthSuccess(data.session);
        }
      }
    } catch (err) {
      console.error('Auth error:', err);
      let message = err.message || 'Ocorreu um erro ao tentar autenticar.';
      if (message.includes('Invalid login credentials')) {
        message = 'E-mail ou senha incorretos.';
      } else if (message.includes('User already registered')) {
        message = 'Este e-mail já está cadastrado no sistema.';
      }
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0B0B0B',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      fontFamily: 'Inter, system-ui, sans-serif'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '420px',
        backgroundColor: '#161616',
        borderRadius: '16px',
        border: '1px solid #282828',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8), 0 1px 0 rgba(255, 255, 255, 0.05) inset',
        padding: '36px 32px',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px'
      }}>
        {/* Header / Brand */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', textAlign: 'center' }}>
          <div style={{
            backgroundColor: 'var(--green-primary, #65FF4B)',
            padding: '10px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 20px rgba(101, 255, 75, 0.3)'
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 22H22L12 2Z" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#FFF', margin: 0 }}>JetFlow</h1>
            <p style={{ fontSize: '13px', color: '#888', margin: '4px 0 0 0' }}>
              Gestão de Implantação de Clientes CX
            </p>
          </div>
        </div>

        {!isSupabaseConfigured && (
          <div style={{
            backgroundColor: 'rgba(245, 158, 11, 0.1)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            borderRadius: '10px',
            padding: '12px 14px',
            display: 'flex',
            gap: '10px',
            alignItems: 'flex-start'
          }}>
            <AlertTriangle size={18} style={{ color: '#F59E0B', flexShrink: 0, marginTop: '2px' }} />
            <div style={{ fontSize: '12px', color: '#CCC', lineHeight: '1.4' }}>
              <strong>Atenção:</strong> O projeto precisa das credenciais do Supabase no arquivo <code>.env</code> (veja <code>supabase_schema.sql</code> para o script SQL).
            </div>
          </div>
        )}

        {/* Tab switcher: Login / Signup */}
        <div style={{
          display: 'flex',
          backgroundColor: '#0D0D0D',
          padding: '4px',
          borderRadius: '10px',
          border: '1px solid #222'
        }}>
          <button
            type="button"
            onClick={() => { setIsSignUp(false); setErrorMsg(''); setInfoMsg(''); }}
            style={{
              flex: 1,
              padding: '10px 0',
              fontSize: '13px',
              fontWeight: '700',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: !isSignUp ? '#1E1E1E' : 'transparent',
              color: !isSignUp ? 'var(--green-primary, #65FF4B)' : '#666',
              transition: 'all 150ms ease'
            }}
          >
            Entrar
          </button>
          <button
            type="button"
            onClick={() => { setIsSignUp(true); setErrorMsg(''); setInfoMsg(''); }}
            style={{
              flex: 1,
              padding: '10px 0',
              fontSize: '13px',
              fontWeight: '700',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: isSignUp ? '#1E1E1E' : 'transparent',
              color: isSignUp ? 'var(--green-primary, #65FF4B)' : '#666',
              transition: 'all 150ms ease'
            }}
          >
            Criar Conta
          </button>
        </div>

        {/* Alert Messages */}
        {errorMsg && (
          <div style={{
            backgroundColor: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '8px',
            padding: '10px 14px',
            fontSize: '13px',
            color: '#EF4444',
            lineHeight: '1.4'
          }}>
            {errorMsg}
          </div>
        )}

        {infoMsg && (
          <div style={{
            backgroundColor: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '8px',
            padding: '10px 14px',
            fontSize: '13px',
            color: '#10B981',
            lineHeight: '1.4'
          }}>
            {infoMsg}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {isSignUp && (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#AAA' }}>Nome Completo *</label>
                <div style={{ position: 'relative' }}>
                  <User size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#666' }} />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Seu nome..."
                    style={{
                      width: '100%',
                      padding: '10px 12px 10px 38px',
                      backgroundColor: '#0D0D0D',
                      border: '1px solid #282828',
                      borderRadius: '8px',
                      color: '#FFF',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#AAA' }}>Cargo / Função</label>
                <div style={{ position: 'relative' }}>
                  <Shield size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#666' }} />
                  <input
                    type="text"
                    value={role}
                    onChange={e => setRole(e.target.value)}
                    placeholder="Ex: Especialista de Implantação"
                    style={{
                      width: '100%',
                      padding: '10px 12px 10px 38px',
                      backgroundColor: '#0D0D0D',
                      border: '1px solid #282828',
                      borderRadius: '8px',
                      color: '#FFF',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>
            </>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', fontWeight: '600', color: '#AAA' }}>E-mail *</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#666' }} />
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="seu.email@empresa.com"
                style={{
                  width: '100%',
                  padding: '10px 12px 10px 38px',
                  backgroundColor: '#0D0D0D',
                  border: '1px solid #282828',
                  borderRadius: '8px',
                  color: '#FFF',
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', fontWeight: '600', color: '#AAA' }}>Senha *</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#666' }} />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: '100%',
                  padding: '10px 12px 10px 38px',
                  backgroundColor: '#0D0D0D',
                  border: '1px solid #282828',
                  borderRadius: '8px',
                  color: '#FFF',
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: '8px',
              width: '100%',
              padding: '12px',
              backgroundColor: 'var(--green-primary, #65FF4B)',
              color: '#000',
              fontWeight: '800',
              fontSize: '14px',
              border: 'none',
              borderRadius: '8px',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              opacity: loading ? 0.7 : 1,
              transition: 'all 150ms ease'
            }}
          >
            {loading ? (
              <span>Carregando...</span>
            ) : isSignUp ? (
              <>
                <UserPlus size={18} />
                <span>Criar Conta de CX</span>
              </>
            ) : (
              <>
                <LogIn size={18} />
                <span>Entrar no JetFlow</span>
              </>
            )}
          </button>
        </form>

        <div style={{ textTransform: 'uppercase', letterSpacing: '1px', fontSize: '10px', color: '#444', textAlign: 'center', marginTop: '8px' }}>
          JetFlow • Isolamento de Dados por Especialista
        </div>
      </div>
    </div>
  );
}
