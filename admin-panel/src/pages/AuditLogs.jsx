import React, { useState, useEffect } from 'react';
import { getAuditLogs, getAuditStats } from '../services/api';
import { MdHistory, MdPerson, MdFilterList, MdRefresh, MdInfo, MdTrendingUp, MdEvent, MdGroup, MdCategory } from 'react-icons/md';

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    action: '',
    user_id: '',
    page: 1,
    limit: 50
  });
  const [selectedLog, setSelectedLog] = useState(null);

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    try {
      const [logsRes, statsRes] = await Promise.all([
        getAuditLogs(filters),
        getAuditStats()
      ]);
      setLogs(logsRes.data.logs || []);
      setStats(statsRes.data);
    } catch (err) {
      setError('Ошибка загрузки логов');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getActionColor = (action) => {
    if (action.includes('create')) return 'var(--success)';
    if (action.includes('update')) return 'var(--info)';
    if (action.includes('delete')) return 'var(--error)';
    if (action.includes('login')) return 'var(--primary)';
    return 'var(--gray-500)';
  };

  const getActionLabel = (action) => {
    const labels = {
      'user.login': 'Вход',
      'user.logout': 'Выход',
      'user.create': 'Создание пользователя',
      'user.update': 'Обновление пользователя',
      'user.delete': 'Удаление пользователя',
      'order.create': 'Создание заказа',
      'order.update': 'Обновление заказа',
      'order.cancel': 'Отмена заказа',
      'courier.verify': 'Верификация курьера',
      'promo.create': 'Создание промокода',
      'promo.update': 'Обновление промокода',
      'settings.update': 'Изменение настроек',
      'support.create': 'Создание тикета',
      'support.update': 'Обновление тикета'
    };
    return labels[action] || action;
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
            Журнал аудита
          </h1>
          <p style={{
            color: 'var(--gray-500)',
            fontSize: '0.875rem',
            margin: 0
          }}>
            История всех действий в системе
          </p>
        </div>
        <button
          onClick={() => loadData()}
          className="btn btn-secondary"
        >
          <MdRefresh style={{ fontSize: '1.25rem' }} />
          Обновить
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

      {stats && stats.overall && (
        <div className="stats-grid" style={{ marginBottom: '2rem' }}>
          <div className="stat-card fade-in">
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '1rem'
            }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: 'var(--radius-lg)',
                background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 16px rgba(99, 102, 241, 0.25)'
              }}>
                <MdHistory style={{ fontSize: '1.75rem', color: 'white' }} />
              </div>
            </div>
            <h3 style={{
              fontSize: '0.875rem',
              color: 'var(--gray-600)',
              marginBottom: '0.5rem',
              fontWeight: '500'
            }}>
              Всего событий
            </h3>
            <div className="value">
              {stats.overall.total_logs || 0}
            </div>
          </div>

          <div className="stat-card fade-in" style={{ animation: 'fadeIn 0.5s ease-out 0.1s both' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '1rem'
            }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: 'var(--radius-lg)',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 16px rgba(16, 185, 129, 0.25)'
              }}>
                <MdEvent style={{ fontSize: '1.75rem', color: 'white' }} />
              </div>
            </div>
            <h3 style={{
              fontSize: '0.875rem',
              color: 'var(--gray-600)',
              marginBottom: '0.5rem',
              fontWeight: '500'
            }}>
              За сегодня
            </h3>
            <div className="value">
              {stats.today_events || 0}
            </div>
          </div>

          <div className="stat-card fade-in" style={{ animation: 'fadeIn 0.5s ease-out 0.2s both' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '1rem'
            }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: 'var(--radius-lg)',
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 16px rgba(245, 158, 11, 0.25)'
              }}>
                <MdGroup style={{ fontSize: '1.75rem', color: 'white' }} />
              </div>
            </div>
            <h3 style={{
              fontSize: '0.875rem',
              color: 'var(--gray-600)',
              marginBottom: '0.5rem',
              fontWeight: '500'
            }}>
              Уникальных пользователей
            </h3>
            <div className="value">
              {stats.overall.unique_users || 0}
            </div>
          </div>

          <div className="stat-card fade-in" style={{ animation: 'fadeIn 0.5s ease-out 0.3s both' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '1rem'
            }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: 'var(--radius-lg)',
                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 16px rgba(239, 68, 68, 0.25)'
              }}>
                <MdCategory style={{ fontSize: '1.75rem', color: 'white' }} />
              </div>
            </div>
            <h3 style={{
              fontSize: '0.875rem',
              color: 'var(--gray-600)',
              marginBottom: '0.5rem',
              fontWeight: '500'
            }}>
              Типов действий
            </h3>
            <div className="value">
              {stats.overall.unique_actions || 0}
            </div>
          </div>
        </div>
      )}

      <div className="card fade-in" style={{ marginBottom: '1.5rem' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          marginBottom: '1rem',
          paddingBottom: '1rem',
          borderBottom: '1px solid var(--gray-200)'
        }}>
          <MdFilterList style={{ fontSize: '1.25rem', color: 'var(--primary)' }} />
          <h3 style={{
            fontSize: '1rem',
            fontWeight: '600',
            color: 'var(--gray-900)',
            margin: 0
          }}>
            Фильтры
          </h3>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div className="form-group" style={{ marginBottom: 0, flex: '1 1 300px' }}>
            <label>Действие</label>
            <select
              value={filters.action}
              onChange={(e) => setFilters({ ...filters, action: e.target.value, page: 1 })}
            >
              <option value="">Все действия</option>
              <option value="user.login">Вход</option>
              <option value="user.logout">Выход</option>
              <option value="user.create">Создание пользователя</option>
              <option value="user.update">Обновление пользователя</option>
              <option value="user.delete">Удаление пользователя</option>
              <option value="order.create">Создание заказа</option>
              <option value="order.update">Обновление заказа</option>
              <option value="order.cancel">Отмена заказа</option>
              <option value="courier.verify">Верификация курьера</option>
              <option value="promo.create">Создание промокода</option>
              <option value="promo.update">Обновление промокода</option>
              <option value="settings.update">Изменение настроек</option>
              <option value="support.create">Создание тикета</option>
              <option value="support.update">Обновление тикета</option>
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0, flex: '1 1 300px' }}>
            <label>ID пользователя</label>
            <input
              type="text"
              value={filters.user_id}
              onChange={(e) => setFilters({ ...filters, user_id: e.target.value, page: 1 })}
              placeholder="Фильтр по пользователю"
            />
          </div>
          <button
            onClick={() => setFilters({ action: '', user_id: '', page: 1, limit: 50 })}
            className="btn btn-secondary"
          >
            <MdRefresh style={{ fontSize: '1rem' }} />
            Сбросить
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selectedLog ? '2fr 1fr' : '1fr', gap: '1.5rem' }}>
        <div className="card fade-in">
          <h3 style={{
            fontSize: '1.125rem',
            fontWeight: '600',
            color: 'var(--gray-900)',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <MdHistory style={{ fontSize: '1.5rem', color: 'var(--primary)' }} />
            События
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Время</th>
                  <th>Действие</th>
                  <th>Пользователь</th>
                  <th>IP</th>
                  <th>Детали</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr
                    key={log.id}
                    onClick={() => setSelectedLog(log)}
                    style={{
                      cursor: 'pointer',
                      background: selectedLog?.id === log.id ? 'rgba(99, 102, 241, 0.05)' : 'transparent'
                    }}
                  >
                    <td style={{ fontSize: '0.8125rem', whiteSpace: 'nowrap', color: 'var(--gray-600)' }}>
                      {new Date(log.created_at).toLocaleString('ru-RU')}
                    </td>
                    <td>
                      <span
                        style={{
                          padding: '0.25rem 0.625rem',
                          borderRadius: '9999px',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          background: getActionColor(log.action) + '20',
                          color: getActionColor(log.action),
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {getActionLabel(log.action)}
                      </span>
                    </td>
                    <td style={{ fontWeight: '500' }}>#{log.user_id || '—'}</td>
                    <td style={{ fontSize: '0.8125rem', fontFamily: 'monospace', color: 'var(--gray-600)' }}>
                      {log.ip_address || '—'}
                    </td>
                    <td>
                      <button
                        className="btn btn-secondary"
                        style={{ fontSize: '0.75rem', padding: '0.375rem 0.75rem' }}
                      >
                        <MdInfo style={{ fontSize: '0.875rem' }} />
                        Подробнее
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {logs.length === 0 && (
            <div style={{
              textAlign: 'center',
              padding: '3rem',
              color: 'var(--gray-500)'
            }}>
              <MdHistory style={{
                fontSize: '3rem',
                marginBottom: '1rem',
                opacity: 0.5
              }} />
              <p style={{ margin: 0, fontSize: '0.875rem' }}>
                Логи не найдены
              </p>
            </div>
          )}

          {logs.length > 0 && (
            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'center', gap: '0.75rem', alignItems: 'center' }}>
              <button
                onClick={() => setFilters({ ...filters, page: Math.max(1, filters.page - 1) })}
                disabled={filters.page === 1}
                className="btn btn-secondary"
              >
                ← Назад
              </button>
              <span style={{
                padding: '0.5rem 1rem',
                color: 'var(--gray-700)',
                fontWeight: '600',
                fontSize: '0.875rem'
              }}>
                Страница {filters.page}
              </span>
              <button
                onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                disabled={logs.length < filters.limit}
                className="btn btn-secondary"
              >
                Вперёд →
              </button>
            </div>
          )}
        </div>

        {selectedLog && (
          <div className="card fade-in">
            <h3 style={{
              fontSize: '1rem',
              fontWeight: '600',
              color: 'var(--gray-900)',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <MdInfo style={{ fontSize: '1.25rem', color: 'var(--primary)' }} />
              Детали события
            </h3>

            <div className="form-group">
              <label style={{ fontSize: '0.8125rem' }}>ID события</label>
              <div style={{
                padding: '0.75rem 1rem',
                background: 'var(--gray-50)',
                borderRadius: 'var(--radius)',
                fontFamily: 'monospace',
                fontSize: '0.875rem',
                color: 'var(--gray-900)',
                border: '1px solid var(--gray-200)'
              }}>
                {selectedLog.id}
              </div>
            </div>

            <div className="form-group">
              <label style={{ fontSize: '0.8125rem' }}>Действие</label>
              <div style={{
                padding: '0.75rem 1rem',
                background: 'var(--gray-50)',
                borderRadius: 'var(--radius)',
                fontSize: '0.875rem',
                color: 'var(--gray-900)',
                border: '1px solid var(--gray-200)'
              }}>
                {getActionLabel(selectedLog.action)}
              </div>
            </div>

            <div className="form-group">
              <label style={{ fontSize: '0.8125rem' }}>Пользователь</label>
              <div style={{
                padding: '0.75rem 1rem',
                background: 'var(--gray-50)',
                borderRadius: 'var(--radius)',
                fontSize: '0.875rem',
                color: 'var(--gray-900)',
                border: '1px solid var(--gray-200)'
              }}>
                #{selectedLog.user_id || 'Система'}
              </div>
            </div>

            <div className="form-group">
              <label style={{ fontSize: '0.8125rem' }}>IP адрес</label>
              <div style={{
                padding: '0.75rem 1rem',
                background: 'var(--gray-50)',
                borderRadius: 'var(--radius)',
                fontFamily: 'monospace',
                fontSize: '0.875rem',
                color: 'var(--gray-900)',
                border: '1px solid var(--gray-200)'
              }}>
                {selectedLog.ip_address || '—'}
              </div>
            </div>

            <div className="form-group">
              <label style={{ fontSize: '0.8125rem' }}>User Agent</label>
              <div style={{
                padding: '0.75rem 1rem',
                background: 'var(--gray-50)',
                borderRadius: 'var(--radius)',
                fontSize: '0.75rem',
                wordBreak: 'break-all',
                color: 'var(--gray-700)',
                border: '1px solid var(--gray-200)',
                lineHeight: '1.5'
              }}>
                {selectedLog.user_agent || '—'}
              </div>
            </div>

            <div className="form-group">
              <label style={{ fontSize: '0.8125rem' }}>Время</label>
              <div style={{
                padding: '0.75rem 1rem',
                background: 'var(--gray-50)',
                borderRadius: 'var(--radius)',
                fontSize: '0.875rem',
                color: 'var(--gray-900)',
                border: '1px solid var(--gray-200)'
              }}>
                {new Date(selectedLog.created_at).toLocaleString('ru-RU')}
              </div>
            </div>

            {selectedLog.details && (
              <div className="form-group">
                <label style={{ fontSize: '0.8125rem' }}>Дополнительные данные</label>
                <div style={{
                  padding: '0.75rem 1rem',
                  background: 'var(--gray-50)',
                  borderRadius: 'var(--radius)',
                  fontFamily: 'monospace',
                  fontSize: '0.75rem',
                  maxHeight: '200px',
                  overflowY: 'auto',
                  border: '1px solid var(--gray-200)'
                }}>
                  <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all', color: 'var(--gray-700)' }}>
                    {JSON.stringify(selectedLog.details, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditLogs;
