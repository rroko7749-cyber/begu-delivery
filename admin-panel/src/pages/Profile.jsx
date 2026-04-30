import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { MdPerson, MdEmail, MdCalendarToday, MdLock, MdSecurity, MdVerifiedUser, MdEdit, MdAdminPanelSettings } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/v1/admin-auth/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfile(response.data);
    } catch (err) {
      setError('Ошибка загрузки профиля');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (passwordData.new_password !== passwordData.confirm_password) {
      setError('Пароли не совпадают');
      return;
    }

    if (passwordData.new_password.length < 6) {
      setError('Пароль должен быть не менее 6 символов');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.put('/api/v1/admin-auth/change-password', {
        current_password: passwordData.current_password,
        new_password: passwordData.new_password
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSuccess('Пароль успешно изменён');
      setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
      setShowPasswordForm(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка изменения пароля');
    }
  };

  if (loading) return <div className="loading">Загрузка...</div>;

  const roleColors = {
    super_admin: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    admin: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
    manager: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
    support: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    analyst: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
  };

  const roleNames = {
    super_admin: 'Супер Администратор',
    admin: 'Администратор',
    manager: 'Менеджер',
    support: 'Поддержка',
    analyst: 'Аналитик'
  };

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{
        marginBottom: '2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h1 style={{
            fontSize: '2rem',
            fontWeight: '700',
            color: 'var(--gray-900)',
            margin: 0,
            marginBottom: '0.5rem'
          }}>
            Профиль администратора
          </h1>
          <p style={{
            color: 'var(--gray-500)',
            fontSize: '0.875rem',
            margin: 0
          }}>
            Управление личными данными и безопасностью
          </p>
        </div>
        {profile?.role === 'super_admin' && (
          <button
            onClick={() => navigate('/admins')}
            className="btn btn-primary"
          >
            <MdAdminPanelSettings style={{ fontSize: '1.25rem' }} />
            Управление администраторами
          </button>
        )}
      </div>

      {error && (
        <div className="error" style={{
          marginBottom: '1.5rem',
          animation: 'fadeIn 0.3s ease-out'
        }}>
          {error}
        </div>
      )}
      {success && (
        <div className="success" style={{
          marginBottom: '1.5rem',
          animation: 'fadeIn 0.3s ease-out'
        }}>
          {success}
        </div>
      )}

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
        gap: '1.5rem',
        marginBottom: '1.5rem'
      }}>
        <div className="card fade-in">
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1.5rem',
            marginBottom: '2rem',
            paddingBottom: '1.5rem',
            borderBottom: '1px solid var(--gray-200)'
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: roleColors[profile?.role] || roleColors.admin,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '2rem',
              fontWeight: '700',
              boxShadow: '0 8px 24px rgba(99, 102, 241, 0.3)'
            }}>
              {profile?.username?.charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
              <h2 style={{
                fontSize: '1.5rem',
                fontWeight: '700',
                color: 'var(--gray-900)',
                margin: 0,
                marginBottom: '0.5rem'
              }}>
                {profile?.full_name || profile?.username}
              </h2>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.375rem 0.875rem',
                borderRadius: '9999px',
                background: roleColors[profile?.role] || roleColors.admin,
                color: 'white',
                fontSize: '0.8125rem',
                fontWeight: '600',
                boxShadow: '0 4px 12px rgba(99, 102, 241, 0.25)'
              }}>
                <MdVerifiedUser style={{ fontSize: '1rem' }} />
                {roleNames[profile?.role] || 'Администратор'}
              </div>
            </div>
          </div>

          <h3 style={{
            fontSize: '1rem',
            fontWeight: '600',
            color: 'var(--gray-900)',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <MdPerson style={{ fontSize: '1.25rem', color: 'var(--primary)' }} />
            Личная информация
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.8125rem',
                fontWeight: '600',
                color: 'var(--gray-600)',
                marginBottom: '0.5rem'
              }}>
                <MdPerson style={{ fontSize: '1rem' }} />
                Логин
              </label>
              <div style={{
                padding: '0.75rem 1rem',
                background: 'var(--gray-50)',
                borderRadius: 'var(--radius)',
                border: '1px solid var(--gray-200)',
                color: 'var(--gray-900)',
                fontWeight: '500'
              }}>
                {profile?.username}
              </div>
            </div>

            <div>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.8125rem',
                fontWeight: '600',
                color: 'var(--gray-600)',
                marginBottom: '0.5rem'
              }}>
                <MdEmail style={{ fontSize: '1rem' }} />
                Email
              </label>
              <div style={{
                padding: '0.75rem 1rem',
                background: 'var(--gray-50)',
                borderRadius: 'var(--radius)',
                border: '1px solid var(--gray-200)',
                color: profile?.email ? 'var(--gray-900)' : 'var(--gray-400)',
                fontWeight: '500'
              }}>
                {profile?.email || 'Не указан'}
              </div>
            </div>

            <div>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.8125rem',
                fontWeight: '600',
                color: 'var(--gray-600)',
                marginBottom: '0.5rem'
              }}>
                <MdCalendarToday style={{ fontSize: '1rem' }} />
                Дата регистрации
              </label>
              <div style={{
                padding: '0.75rem 1rem',
                background: 'var(--gray-50)',
                borderRadius: 'var(--radius)',
                border: '1px solid var(--gray-200)',
                color: 'var(--gray-900)',
                fontWeight: '500'
              }}>
                {profile?.created_at ? new Date(profile.created_at).toLocaleString('ru-RU') : '—'}
              </div>
            </div>

            <div>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.8125rem',
                fontWeight: '600',
                color: 'var(--gray-600)',
                marginBottom: '0.5rem'
              }}>
                <MdCalendarToday style={{ fontSize: '1rem' }} />
                Последний вход
              </label>
              <div style={{
                padding: '0.75rem 1rem',
                background: 'var(--gray-50)',
                borderRadius: 'var(--radius)',
                border: '1px solid var(--gray-200)',
                color: 'var(--gray-900)',
                fontWeight: '500'
              }}>
                {profile?.last_login_at ? new Date(profile.last_login_at).toLocaleString('ru-RU') : '—'}
              </div>
            </div>
          </div>
        </div>

        <div className="card fade-in" style={{ animation: 'fadeIn 0.5s ease-out 0.1s both' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.5rem',
            paddingBottom: '1.5rem',
            borderBottom: '1px solid var(--gray-200)'
          }}>
            <h3 style={{
              fontSize: '1rem',
              fontWeight: '600',
              color: 'var(--gray-900)',
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <MdSecurity style={{ fontSize: '1.25rem', color: 'var(--primary)' }} />
              Безопасность
            </h3>
            {!showPasswordForm && (
              <button
                onClick={() => setShowPasswordForm(true)}
                className="btn btn-primary"
                style={{
                  padding: '0.5rem 1rem',
                  fontSize: '0.875rem'
                }}
              >
                <MdEdit style={{ fontSize: '1rem' }} />
                Изменить пароль
              </button>
            )}
          </div>

          {showPasswordForm ? (
            <form onSubmit={handleChangePassword}>
              <div className="form-group">
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <MdLock style={{ fontSize: '1rem', color: 'var(--primary)' }} />
                  Текущий пароль *
                </label>
                <input
                  type="password"
                  value={passwordData.current_password}
                  onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                  placeholder="Введите текущий пароль"
                  required
                />
              </div>

              <div className="form-group">
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <MdLock style={{ fontSize: '1rem', color: 'var(--primary)' }} />
                  Новый пароль *
                </label>
                <input
                  type="password"
                  value={passwordData.new_password}
                  onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                  placeholder="Минимум 6 символов"
                  required
                />
              </div>

              <div className="form-group">
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <MdLock style={{ fontSize: '1rem', color: 'var(--primary)' }} />
                  Подтвердите новый пароль *
                </label>
                <input
                  type="password"
                  value={passwordData.confirm_password}
                  onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                  placeholder="Повторите новый пароль"
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  <MdLock style={{ fontSize: '1rem' }} />
                  Сохранить
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordForm(false);
                    setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
                    setError('');
                  }}
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                >
                  Отмена
                </button>
              </div>
            </form>
          ) : (
            <div>
              <div style={{
                padding: '1.5rem',
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(139, 92, 246, 0.08) 100%)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid rgba(99, 102, 241, 0.2)',
                marginBottom: '1.5rem'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  marginBottom: '1rem'
                }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: 'var(--radius)',
                    background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
                  }}>
                    <MdLock style={{ fontSize: '1.5rem', color: 'white' }} />
                  </div>
                  <div>
                    <div style={{
                      fontWeight: '600',
                      color: 'var(--gray-900)',
                      marginBottom: '0.25rem'
                    }}>
                      Пароль установлен
                    </div>
                    <div style={{
                      fontSize: '0.8125rem',
                      color: 'var(--gray-600)'
                    }}>
                      Последнее изменение: {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('ru-RU') : '—'}
                    </div>
                  </div>
                </div>
                <p style={{
                  color: 'var(--gray-600)',
                  fontSize: '0.875rem',
                  margin: 0,
                  lineHeight: '1.6'
                }}>
                  Регулярно меняйте пароль для обеспечения безопасности вашей учетной записи. Используйте надежные пароли длиной не менее 6 символов.
                </p>
              </div>

              <div style={{
                padding: '1rem 1.25rem',
                background: 'var(--gray-50)',
                borderRadius: 'var(--radius)',
                border: '1px solid var(--gray-200)'
              }}>
                <div style={{
                  fontSize: '0.8125rem',
                  color: 'var(--gray-600)',
                  lineHeight: '1.6'
                }}>
                  <div style={{ fontWeight: '600', marginBottom: '0.5rem', color: 'var(--gray-700)' }}>
                    Рекомендации по безопасности:
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '1.25rem' }}>
                    <li>Используйте уникальный пароль</li>
                    <li>Не сообщайте пароль третьим лицам</li>
                    <li>Меняйте пароль каждые 3-6 месяцев</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
