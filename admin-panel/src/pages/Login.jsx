import React, { useState } from 'react';
import axios from 'axios';
import { MdLock, MdPerson, MdLogin } from 'react-icons/md';

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post('/api/v1/admin-auth/login', {
        username,
        password
      });

      const { access_token } = response.data;
      localStorage.setItem('token', access_token);
      onLogin();
    } catch (err) {
      setError(err.response?.data?.error || 'Неверный логин или пароль');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '2rem',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'radial-gradient(circle at 20% 50%, rgba(99, 102, 241, 0.3) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(139, 92, 246, 0.3) 0%, transparent 50%)',
        pointerEvents: 'none'
      }} />

      <div style={{
        width: '440px',
        maxWidth: '100%',
        position: 'relative',
        zIndex: 1
      }}>
        <div style={{
          background: 'white',
          borderRadius: 'var(--radius-xl)',
          padding: '3rem',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <div style={{
            textAlign: 'center',
            marginBottom: '2rem'
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              borderRadius: 'var(--radius-xl)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2.5rem',
              margin: '0 auto 1.5rem',
              boxShadow: '0 8px 24px rgba(99, 102, 241, 0.4)'
            }}>
              🚀
            </div>
            <h2 style={{
              fontSize: '1.75rem',
              fontWeight: '700',
              margin: 0,
              marginBottom: '0.5rem',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              БегуДоставка
            </h2>
            <p style={{
              color: 'var(--gray-500)',
              fontSize: '0.875rem',
              margin: 0,
              fontWeight: '500'
            }}>
              Панель администратора
            </p>
          </div>

          {error && (
            <div className="error" style={{
              marginBottom: '1.5rem',
              animation: 'fadeIn 0.3s ease-out'
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <MdPerson style={{ fontSize: '1.125rem', color: 'var(--primary)' }} />
                Логин
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Введите логин"
                required
                disabled={loading}
                autoFocus
                style={{
                  paddingLeft: '1rem'
                }}
              />
            </div>
            <div className="form-group">
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <MdLock style={{ fontSize: '1.125rem', color: 'var(--primary)' }} />
                Пароль
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Введите пароль"
                required
                disabled={loading}
                style={{
                  paddingLeft: '1rem'
                }}
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '0.875rem',
                fontSize: '1rem',
                marginTop: '0.5rem'
              }}
              disabled={loading}
            >
              <MdLogin style={{ fontSize: '1.25rem' }} />
              {loading ? 'Вход...' : 'Войти в систему'}
            </button>
          </form>

          <div style={{
            marginTop: '2rem',
            padding: '1rem 1.25rem',
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(139, 92, 246, 0.08) 100%)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid rgba(99, 102, 241, 0.2)',
            fontSize: '0.8125rem'
          }}>
            <div style={{
              fontWeight: '600',
              color: 'var(--gray-700)',
              marginBottom: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <div style={{
                width: '6px',
                height: '6px',
                background: 'var(--primary)',
                borderRadius: '50%'
              }} />
              Данные для входа по умолчанию
            </div>
            <div style={{ color: 'var(--gray-600)', lineHeight: '1.6' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                <span>Логин:</span>
                <code style={{
                  background: 'white',
                  padding: '0.125rem 0.5rem',
                  borderRadius: 'var(--radius-sm)',
                  fontWeight: '600',
                  color: 'var(--primary)'
                }}>admin</code>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Пароль:</span>
                <code style={{
                  background: 'white',
                  padding: '0.125rem 0.5rem',
                  borderRadius: 'var(--radius-sm)',
                  fontWeight: '600',
                  color: 'var(--primary)'
                }}>admin123</code>
              </div>
            </div>
          </div>
        </div>

        <div style={{
          textAlign: 'center',
          marginTop: '1.5rem',
          color: 'white',
          fontSize: '0.875rem',
          textShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
        }}>
          © 2026 БегуДоставка. Все права защищены.
        </div>
      </div>
    </div>
  );
};

export default Login;
