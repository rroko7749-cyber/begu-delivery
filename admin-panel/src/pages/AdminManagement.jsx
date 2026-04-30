import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { MdPersonAdd, MdPerson, MdEmail, MdLock, MdDelete, MdEdit, MdToggleOn, MdToggleOff, MdAdminPanelSettings, MdVerifiedUser, MdCalendarToday } from 'react-icons/md';

const AdminManagement = () => {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    full_name: '',
    email: '',
    role: 'support'
  });

  const roleLabels = {
    super_admin: 'Суперадмин',
    admin: 'Администратор',
    manager: 'Менеджер',
    support: 'Поддержка',
    analyst: 'Аналитик'
  };

  const roleDescriptions = {
    super_admin: 'Полный доступ ко всему, включая управление админами',
    admin: 'Управление всеми разделами, кроме других админов',
    manager: 'Управление заказами, курьерами, промокодами',
    support: 'Только тикеты поддержки и чаты',
    analyst: 'Только просмотр статистики и отчётов'
  };

  const roleColors = {
    super_admin: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    admin: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
    manager: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
    support: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    analyst: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
  };

  useEffect(() => {
    loadAdmins();
  }, []);

  const loadAdmins = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/v1/admin-management', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAdmins(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка загрузки админов');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/v1/admin-management', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSuccess('Админ успешно создан');
      setShowCreateForm(false);
      setFormData({ username: '', password: '', full_name: '', email: '', role: 'support' });
      loadAdmins();
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка создания админа');
    }
  };

  const handleUpdate = async (id, updates) => {
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      await axios.put(`/api/v1/admin-management/${id}`, updates, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSuccess('Админ обновлён');
      setEditingAdmin(null);
      loadAdmins();
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка обновления админа');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Вы уверены, что хотите удалить этого админа?')) return;

    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/v1/admin-management/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSuccess('Админ удалён');
      loadAdmins();
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка удаления админа');
    }
  };

  const handleResetPassword = async (id) => {
    const newPassword = prompt('Введите новый пароль (минимум 6 символов):');
    if (!newPassword || newPassword.length < 6) {
      alert('Пароль должен быть не менее 6 символов');
      return;
    }

    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      await axios.post(`/api/v1/admin-management/${id}/reset-password`, {
        new_password: newPassword
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSuccess('Пароль сброшен');
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка сброса пароля');
    }
  };

  if (loading) return <div className="loading">Загрузка...</div>;

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
            Управление администраторами
          </h1>
          <p style={{
            color: 'var(--gray-500)',
            fontSize: '0.875rem',
            margin: 0
          }}>
            Создание и управление учетными записями администраторов
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="btn btn-primary"
        >
          <MdPersonAdd style={{ fontSize: '1.25rem' }} />
          {showCreateForm ? 'Отмена' : 'Добавить админа'}
        </button>
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

      {showCreateForm && (
        <div className="card fade-in" style={{ marginBottom: '2rem' }}>
          <h3 style={{
            fontSize: '1.125rem',
            fontWeight: '600',
            color: 'var(--gray-900)',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <MdPersonAdd style={{ fontSize: '1.5rem', color: 'var(--primary)' }} />
            Новый администратор
          </h3>
          <form onSubmit={handleCreate}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '1rem'
            }}>
              <div className="form-group">
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <MdPerson style={{ fontSize: '1rem', color: 'var(--primary)' }} />
                  Логин *
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="admin_ivanov"
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
                  Пароль *
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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
                  <MdPerson style={{ fontSize: '1rem', color: 'var(--primary)' }} />
                  ФИО
                </label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="Иванов Иван Иванович"
                />
              </div>

              <div className="form-group">
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <MdEmail style={{ fontSize: '1rem', color: 'var(--primary)' }} />
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="admin@example.com"
                />
              </div>
            </div>

            <div className="form-group">
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <MdAdminPanelSettings style={{ fontSize: '1rem', color: 'var(--primary)' }} />
                Роль *
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                required
              >
                <option value="support">Поддержка</option>
                <option value="analyst">Аналитик</option>
                <option value="manager">Менеджер</option>
                <option value="admin">Администратор</option>
                <option value="super_admin">Суперадмин</option>
              </select>
              <small style={{
                color: 'var(--gray-600)',
                display: 'block',
                marginTop: '0.5rem',
                fontSize: '0.8125rem'
              }}>
                {roleDescriptions[formData.role]}
              </small>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
              <MdPersonAdd style={{ fontSize: '1.125rem' }} />
              Создать администратора
            </button>
          </form>
        </div>
      )}

      <div className="card fade-in">
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
          paddingBottom: '1rem',
          borderBottom: '1px solid var(--gray-200)'
        }}>
          <h3 style={{
            fontSize: '1.125rem',
            fontWeight: '600',
            color: 'var(--gray-900)',
            margin: 0
          }}>
            Список администраторов
          </h3>
          <div style={{
            padding: '0.5rem 1rem',
            background: 'var(--gray-100)',
            borderRadius: 'var(--radius)',
            fontSize: '0.875rem',
            fontWeight: '600',
            color: 'var(--gray-700)'
          }}>
            Всего: {admins.length}
          </div>
        </div>

        {admins.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '3rem',
            color: 'var(--gray-500)'
          }}>
            <MdPerson style={{
              fontSize: '3rem',
              marginBottom: '1rem',
              opacity: 0.5
            }} />
            <p style={{ margin: 0, fontSize: '0.875rem' }}>
              Нет администраторов
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {admins.map((admin, index) => (
              <div
                key={admin.id}
                className="fade-in"
                style={{
                  padding: '1.5rem',
                  border: '1px solid var(--gray-200)',
                  borderRadius: 'var(--radius-lg)',
                  background: admin.is_active ? 'white' : 'var(--gray-50)',
                  transition: 'var(--transition)',
                  animation: `fadeIn 0.3s ease-out ${index * 0.05}s both`
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                  e.currentTarget.style.borderColor = 'var(--gray-300)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.borderColor = 'var(--gray-200)';
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                      <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        background: roleColors[admin.role],
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '1.25rem',
                        fontWeight: '700',
                        boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
                      }}>
                        {(admin.full_name || admin.username).charAt(0).toUpperCase()}
                      </div>
                      <div style={{ flex: 1 }}>
                        <h4 style={{
                          margin: 0,
                          marginBottom: '0.25rem',
                          fontSize: '1.125rem',
                          fontWeight: '600',
                          color: 'var(--gray-900)'
                        }}>
                          {admin.full_name || admin.username}
                        </h4>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <span style={{
                            padding: '0.25rem 0.75rem',
                            borderRadius: '9999px',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            background: roleColors[admin.role],
                            color: 'white',
                            boxShadow: '0 2px 8px rgba(99, 102, 241, 0.2)'
                          }}>
                            {roleLabels[admin.role]}
                          </span>
                          {!admin.is_active && (
                            <span style={{
                              padding: '0.25rem 0.75rem',
                              borderRadius: '9999px',
                              fontSize: '0.75rem',
                              fontWeight: '600',
                              background: 'rgba(239, 68, 68, 0.1)',
                              color: 'var(--error)'
                            }}>
                              Деактивирован
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                      gap: '0.75rem',
                      fontSize: '0.875rem',
                      color: 'var(--gray-600)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <MdPerson style={{ fontSize: '1rem', color: 'var(--gray-400)' }} />
                        <span><strong>Логин:</strong> {admin.username}</span>
                      </div>

                      {admin.email && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <MdEmail style={{ fontSize: '1rem', color: 'var(--gray-400)' }} />
                          <span><strong>Email:</strong> {admin.email}</span>
                        </div>
                      )}

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <MdCalendarToday style={{ fontSize: '1rem', color: 'var(--gray-400)' }} />
                        <span><strong>Создан:</strong> {new Date(admin.created_at).toLocaleDateString('ru-RU')}</span>
                      </div>

                      {admin.last_login_at && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <MdCalendarToday style={{ fontSize: '1rem', color: 'var(--gray-400)' }} />
                          <span><strong>Последний вход:</strong> {new Date(admin.last_login_at).toLocaleDateString('ru-RU')}</span>
                        </div>
                      )}
                    </div>

                    <div style={{
                      marginTop: '0.75rem',
                      padding: '0.75rem',
                      background: 'var(--gray-50)',
                      borderRadius: 'var(--radius)',
                      fontSize: '0.8125rem',
                      color: 'var(--gray-600)',
                      fontStyle: 'italic'
                    }}>
                      {roleDescriptions[admin.role]}
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: '160px' }}>
                    <button
                      onClick={() => handleUpdate(admin.id, { is_active: !admin.is_active })}
                      className="btn btn-secondary"
                      style={{
                        fontSize: '0.8125rem',
                        padding: '0.5rem 0.875rem',
                        justifyContent: 'center'
                      }}
                    >
                      {admin.is_active ? (
                        <>
                          <MdToggleOff style={{ fontSize: '1rem' }} />
                          Деактивировать
                        </>
                      ) : (
                        <>
                          <MdToggleOn style={{ fontSize: '1rem' }} />
                          Активировать
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleResetPassword(admin.id)}
                      className="btn btn-secondary"
                      style={{
                        fontSize: '0.8125rem',
                        padding: '0.5rem 0.875rem',
                        justifyContent: 'center'
                      }}
                    >
                      <MdLock style={{ fontSize: '1rem' }} />
                      Сбросить пароль
                    </button>

                    <button
                      onClick={() => handleDelete(admin.id)}
                      className="btn btn-danger"
                      style={{
                        fontSize: '0.8125rem',
                        padding: '0.5rem 0.875rem',
                        justifyContent: 'center'
                      }}
                    >
                      <MdDelete style={{ fontSize: '1rem' }} />
                      Удалить
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminManagement;
