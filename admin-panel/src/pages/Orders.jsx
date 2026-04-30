import React, { useState, useEffect } from 'react';
import { getOrders, getOrderDetails } from '../services/api';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    page: 1,
    limit: 20
  });

  useEffect(() => {
    loadOrders();
  }, [filters]);

  const loadOrders = async () => {
    try {
      const response = await getOrders(filters);
      setOrders(response.data);
    } catch (err) {
      setError('Ошибка загрузки заказов');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOrder = async (id) => {
    try {
      const response = await getOrderDetails(id);
      setSelectedOrder(response.data);
    } catch (err) {
      setError('Ошибка загрузки деталей заказа');
      console.error(err);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: '#ffc107',
      accepted: '#17a2b8',
      picked_up: '#007bff',
      in_transit: '#6f42c1',
      delivered: '#28a745',
      cancelled: '#dc3545'
    };
    return colors[status] || '#6c757d';
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending: 'Ожидает',
      accepted: 'Принят',
      picked_up: 'Забран',
      in_transit: 'В пути',
      delivered: 'Доставлен',
      cancelled: 'Отменён'
    };
    return labels[status] || status;
  };

  if (loading) return <div className="loading">Загрузка...</div>;

  return (
    <div>
      <h1 style={{ marginBottom: '30px' }}>Заказы</h1>

      {error && <div className="error" style={{ marginBottom: '20px' }}>{error}</div>}

      <div className="card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
            <label>Статус</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
            >
              <option value="">Все</option>
              <option value="pending">Ожидает</option>
              <option value="accepted">Принят</option>
              <option value="picked_up">Забран</option>
              <option value="in_transit">В пути</option>
              <option value="delivered">Доставлен</option>
              <option value="cancelled">Отменён</option>
            </select>
          </div>
          <button
            onClick={() => setFilters({ status: '', page: 1, limit: 20 })}
            className="btn btn-secondary"
            style={{ marginTop: '24px' }}
          >
            Сбросить
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selectedOrder ? '1fr 1fr' : '1fr', gap: '20px' }}>
        <div className="card">
          <h3 style={{ marginBottom: '20px' }}>Список заказов</h3>
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
              {orders.map((order) => (
                <tr
                  key={order.id}
                  onClick={() => handleSelectOrder(order.id)}
                  style={{
                    cursor: 'pointer',
                    background: selectedOrder?.id === order.id ? '#e3f2fd' : 'transparent'
                  }}
                >
                  <td>#{order.id}</td>
                  <td>{order.customer_phone}</td>
                  <td>{order.courier_phone || '—'}</td>
                  <td>
                    <span
                      style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '600',
                        background: getStatusColor(order.status) + '20',
                        color: getStatusColor(order.status)
                      }}
                    >
                      {getStatusLabel(order.status)}
                    </span>
                  </td>
                  <td>{order.total_price} ₽</td>
                  <td>{new Date(order.created_at).toLocaleDateString('ru-RU')}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {orders.length === 0 && (
            <p style={{ textAlign: 'center', color: '#6c757d', padding: '20px' }}>
              Заказы не найдены
            </p>
          )}
        </div>

        {selectedOrder && (
          <div className="card">
            <h3 style={{ marginBottom: '20px' }}>Детали заказа #{selectedOrder.id}</h3>

            <div style={{ marginBottom: '20px' }}>
              <div style={{
                padding: '15px',
                background: getStatusColor(selectedOrder.status) + '10',
                borderRadius: '8px',
                marginBottom: '15px'
              }}>
                <div style={{ fontSize: '14px', color: '#6c757d', marginBottom: '5px' }}>
                  Статус
                </div>
                <div style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  color: getStatusColor(selectedOrder.status)
                }}>
                  {getStatusLabel(selectedOrder.status)}
                </div>
              </div>

              <div className="form-group">
                <label>Клиент</label>
                <div style={{ padding: '10px', background: '#f8f9fa', borderRadius: '4px' }}>
                  {selectedOrder.customer_phone}
                </div>
              </div>

              <div className="form-group">
                <label>Курьер</label>
                <div style={{ padding: '10px', background: '#f8f9fa', borderRadius: '4px' }}>
                  {selectedOrder.courier_phone || 'Не назначен'}
                </div>
              </div>

              <div className="form-group">
                <label>Откуда</label>
                <div style={{ padding: '10px', background: '#f8f9fa', borderRadius: '4px' }}>
                  {selectedOrder.pickup_address}
                </div>
              </div>

              <div className="form-group">
                <label>Куда</label>
                <div style={{ padding: '10px', background: '#f8f9fa', borderRadius: '4px' }}>
                  {selectedOrder.delivery_address}
                </div>
              </div>

              <div className="form-group">
                <label>Описание груза</label>
                <div style={{ padding: '10px', background: '#f8f9fa', borderRadius: '4px' }}>
                  {selectedOrder.package_description || '—'}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className="form-group">
                  <label>Вес</label>
                  <div style={{ padding: '10px', background: '#f8f9fa', borderRadius: '4px' }}>
                    {selectedOrder.package_weight} кг
                  </div>
                </div>

                <div className="form-group">
                  <label>Размер</label>
                  <div style={{ padding: '10px', background: '#f8f9fa', borderRadius: '4px' }}>
                    {selectedOrder.package_size}
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label>Комментарий</label>
                <div style={{ padding: '10px', background: '#f8f9fa', borderRadius: '4px' }}>
                  {selectedOrder.comment || '—'}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className="form-group">
                  <label>Стоимость доставки</label>
                  <div style={{ padding: '10px', background: '#f8f9fa', borderRadius: '4px' }}>
                    {selectedOrder.delivery_price} ₽
                  </div>
                </div>

                <div className="form-group">
                  <label>Итого</label>
                  <div style={{
                    padding: '10px',
                    background: '#28a745',
                    color: 'white',
                    borderRadius: '4px',
                    fontWeight: '600'
                  }}>
                    {selectedOrder.total_price} ₽
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label>Создан</label>
                <div style={{ padding: '10px', background: '#f8f9fa', borderRadius: '4px' }}>
                  {new Date(selectedOrder.created_at).toLocaleString('ru-RU')}
                </div>
              </div>

              {selectedOrder.delivered_at && (
                <div className="form-group">
                  <label>Доставлен</label>
                  <div style={{ padding: '10px', background: '#f8f9fa', borderRadius: '4px' }}>
                    {new Date(selectedOrder.delivered_at).toLocaleString('ru-RU')}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;
