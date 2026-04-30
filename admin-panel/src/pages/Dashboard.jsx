import React, { useState, useEffect } from 'react';
import { getStats, getOrders } from '../services/api';
import { MdPeople, MdDeliveryDining, MdShoppingCart, MdAttachMoney, MdTrendingUp, MdTrendingDown } from 'react-icons/md';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsRes, ordersRes] = await Promise.all([
        getStats(),
        getOrders({ limit: 10 })
      ]);
      setStats(statsRes.data);
      setRecentOrders(ordersRes.data);
    } catch (err) {
      setError('Ошибка загрузки данных');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Загрузка...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!stats) return null;

  const statCards = [
    {
      label: 'Всего пользователей',
      value: (parseInt(stats.total_clients) + parseInt(stats.total_couriers)) || 0,
      icon: MdPeople,
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      trend: '+12%'
    },
    {
      label: 'Активных курьеров',
      value: stats.total_couriers || 0,
      icon: MdDeliveryDining,
      gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      trend: '+8%'
    },
    {
      label: 'Заказов сегодня',
      value: stats.orders_today || 0,
      icon: MdShoppingCart,
      gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
      trend: '+24%'
    },
    {
      label: 'Выручка сегодня',
      value: `${stats.revenue_today || 0} ₽`,
      icon: MdAttachMoney,
      gradient: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
      trend: '+15%'
    }
  ];

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
            Дашборд
          </h1>
          <p style={{
            color: 'var(--gray-500)',
            fontSize: '0.875rem',
            margin: 0
          }}>
            Добро пожаловать в панель управления БегуДоставка
          </p>
        </div>
      </div>

      <div className="stats-grid" style={{ marginBottom: '2rem' }}>
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div
              key={index}
              className="stat-card fade-in"
              style={{
                animation: `fadeIn 0.5s ease-out ${index * 0.1}s both`
              }}
            >
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
                  background: card.gradient,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 8px 16px rgba(99, 102, 241, 0.25)'
                }}>
                  <Icon style={{ fontSize: '1.75rem', color: 'white' }} />
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  padding: '0.25rem 0.625rem',
                  borderRadius: '9999px',
                  background: 'rgba(16, 185, 129, 0.1)',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  color: 'var(--success)'
                }}>
                  <MdTrendingUp style={{ fontSize: '1rem' }} />
                  {card.trend}
                </div>
              </div>
              <h3 style={{
                fontSize: '0.875rem',
                color: 'var(--gray-600)',
                marginBottom: '0.5rem',
                fontWeight: '500'
              }}>
                {card.label}
              </h3>
              <div className="value" style={{
                fontSize: '2rem',
                fontWeight: '700',
                color: 'var(--gray-900)'
              }}>
                {card.value}
              </div>
            </div>
          );
        })}
      </div>

      <div className="card fade-in" style={{
        animation: 'fadeIn 0.5s ease-out 0.4s both'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem'
        }}>
          <h3 style={{
            fontSize: '1.125rem',
            fontWeight: '600',
            color: 'var(--gray-900)',
            margin: 0
          }}>
            Последние заказы
          </h3>
          <button className="btn btn-secondary" style={{ fontSize: '0.875rem' }}>
            Все заказы
          </button>
        </div>
        {recentOrders.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '3rem',
            color: 'var(--gray-500)'
          }}>
            <MdShoppingCart style={{
              fontSize: '3rem',
              marginBottom: '1rem',
              opacity: 0.5
            }} />
            <p style={{ margin: 0, fontSize: '0.875rem' }}>
              Заказов пока нет
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Клиент</th>
                  <th>Курьер</th>
                  <th>Статус</th>
                  <th>Сумма</th>
                  <th>Дата</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id}>
                    <td style={{ fontWeight: '600', color: 'var(--primary)' }}>
                      #{order.id}
                    </td>
                    <td>{order.client_phone}</td>
                    <td style={{ color: order.courier_phone ? 'var(--gray-900)' : 'var(--gray-400)' }}>
                      {order.courier_phone || '—'}
                    </td>
                    <td>
                      <span className={`badge badge-${order.status}`}>
                        {order.status}
                      </span>
                    </td>
                    <td style={{ fontWeight: '600' }}>
                      {order.final_price} ₽
                    </td>
                    <td style={{ color: 'var(--gray-500)', fontSize: '0.875rem' }}>
                      {new Date(order.created_at).toLocaleString('ru-RU')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
