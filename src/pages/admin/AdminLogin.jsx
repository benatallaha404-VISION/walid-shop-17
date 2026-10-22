// src/pages/admin/AdminLogin.jsx
import React, { useState, useRef, useEffect } from 'react';
import { Lock, Eye, EyeOff, ShieldCheck, AlertCircle } from 'lucide-react';
import { getSetting } from '../../api.js';

export default function AdminLogin({ onSuccess }) {
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const storedPw = (await getSetting('admin_password')) || 'WALID123';
      if (password === storedPw) {
        sessionStorage.setItem('admin_auth', '1');
        onSuccess();
      } else {
        setError('كلمة المرور غير صحيحة. Mot de passe incorrect.');
        setShake(true);
        setPassword('');
        setTimeout(() => setShake(false), 600);
      }
    } catch (err) {
      if (password === 'WALID123') {
        sessionStorage.setItem('admin_auth', '1');
        onSuccess();
      } else {
        setError('كلمة المرور غير صحيحة. Mot de passe incorrect.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1207 50%, #0d0d0d 100%)',
      padding: '24px',
      fontFamily: "'Inter', 'Outfit', sans-serif",
    }}>
      {/* Background decorative elements */}
      <div style={{
        position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none',
      }}>
        <div style={{
          position: 'absolute', top: '15%', left: '10%',
          width: 400, height: 400, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(212,175,55,0.08) 0%, transparent 70%)',
        }} />
        <div style={{
          position: 'absolute', bottom: '15%', right: '10%',
          width: 300, height: 300, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(212,175,55,0.06) 0%, transparent 70%)',
        }} />
      </div>

      <div style={{
        width: '100%', maxWidth: 420, position: 'relative',
        animation: shake ? 'adminShake 0.5s ease' : 'adminFadeIn 0.5s ease',
      }}>
        {/* Logo / Icon */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 80, height: 80, borderRadius: '50%',
            background: 'linear-gradient(135deg, #d4af37, #b8860b)',
            boxShadow: '0 0 40px rgba(212,175,55,0.35)',
            marginBottom: 16,
          }}>
            <ShieldCheck size={38} color="#fff" strokeWidth={1.8} />
          </div>
          <h1 style={{
            margin: 0, fontSize: 26, fontWeight: 800, letterSpacing: 0.5,
            background: 'linear-gradient(135deg, #d4af37, #f5d563)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            Walid Shop Admin
          </h1>
          <p style={{ margin: '6px 0 0', color: 'rgba(255,255,255,0.45)', fontSize: 13 }}>
            لوحة التحكم — Panneau d'administration
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(212,175,55,0.2)',
          borderRadius: 20,
          padding: 36,
          backdropFilter: 'blur(12px)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
        }}>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 24 }}>
              <label style={{
                display: 'block', fontSize: 13, fontWeight: 700,
                color: 'rgba(255,255,255,0.7)', marginBottom: 8, letterSpacing: 0.3,
              }}>
                <Lock size={13} style={{ marginRight: 6, verticalAlign: 'middle', color: '#d4af37' }} />
                كلمة المرور / Mot de passe
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  ref={inputRef}
                  id="admin-password-input"
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(''); }}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    padding: '14px 48px 14px 16px',
                    background: 'rgba(255,255,255,0.06)',
                    border: `1.5px solid ${error ? 'rgba(239,68,68,0.6)' : 'rgba(212,175,55,0.25)'}`,
                    borderRadius: 12,
                    color: '#fff',
                    fontSize: 16,
                    outline: 'none',
                    transition: 'border-color 0.2s',
                    letterSpacing: showPw ? 0 : 3,
                  }}
                  onFocus={e => {
                    e.target.style.borderColor = 'rgba(212,175,55,0.7)';
                    e.target.style.boxShadow = '0 0 0 3px rgba(212,175,55,0.1)';
                  }}
                  onBlur={e => {
                    e.target.style.borderColor = error ? 'rgba(239,68,68,0.6)' : 'rgba(212,175,55,0.25)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(p => !p)}
                  style={{
                    position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'rgba(255,255,255,0.4)', padding: 2,
                  }}
                >
                  {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
              {error && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  marginTop: 8, color: '#f87171', fontSize: 12, fontWeight: 600,
                  animation: 'adminFadeIn 0.3s ease',
                }}>
                  <AlertCircle size={13} />
                  {error}
                </div>
              )}
            </div>

            <button
              id="admin-login-btn"
              type="submit"
              disabled={loading || !password}
              style={{
                width: '100%', padding: '14px',
                background: loading || !password
                  ? 'rgba(212,175,55,0.3)'
                  : 'linear-gradient(135deg, #d4af37, #b8860b)',
                border: 'none', borderRadius: 12,
                color: loading || !password ? 'rgba(255,255,255,0.4)' : '#fff',
                fontSize: 15, fontWeight: 700, cursor: loading || !password ? 'not-allowed' : 'pointer',
                letterSpacing: 0.5,
                transition: 'all 0.2s',
                boxShadow: loading || !password ? 'none' : '0 8px 24px rgba(212,175,55,0.3)',
              }}
            >
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <span style={{
                    width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: '#fff', borderRadius: '50%',
                    animation: 'adminSpin 0.7s linear infinite',
                    display: 'inline-block',
                  }} />
                  جاري التحقق...
                </span>
              ) : (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <Lock size={15} />
                  دخول — Se connecter
                </span>
              )}
            </button>
          </form>
        </div>

        <p style={{
          textAlign: 'center', marginTop: 20, color: 'rgba(255,255,255,0.25)', fontSize: 11,
        }}>
          Walid Shop © {new Date().getFullYear()} — Accès restreint
        </p>
      </div>

      <style>{`
        @keyframes adminFadeIn {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes adminShake {
          0%, 100% { transform: translateX(0); }
          15%       { transform: translateX(-10px); }
          30%       { transform: translateX(10px); }
          45%       { transform: translateX(-8px); }
          60%       { transform: translateX(8px); }
          75%       { transform: translateX(-4px); }
          90%       { transform: translateX(4px); }
        }
        @keyframes adminSpin {
          to { transform: rotate(360deg); }
        }
        #admin-login-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 12px 32px rgba(212,175,55,0.4) !important;
        }
        #admin-login-btn:active:not(:disabled) {
          transform: translateY(0);
        }
      `}</style>
    </div>
  );
}
