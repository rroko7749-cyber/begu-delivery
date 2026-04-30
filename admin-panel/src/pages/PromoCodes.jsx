import React, { useState, useEffect } from 'react';
import { getPromoCodes, createPromoCode, updatePromoCode, getPromoCodeStats } from '../services/api';

const PromoCodes = () => {
  const [promoCodes, setPromoCodes] = useState([]);
  const [selectedPromo, setSelectedPromo] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    discount_type: 'percentage',
    discount_value: '',
    max_uses: '',
    max_uses_per_user: 1,
    min_order_amount: '',
    valid_from: '',
    valid_until: '',
    is_active: true
  });

  useEffect(() => {
    loadPromoCodes();
  }, []);

  useEffect(() => {
    if (selectedPromo) {
      loadStats();
    }
  }, [selectedPromo]);

  const loadPromoCodes = async () => {
    try {
      const response = await getPromoCodes({ page: 1, limit: 100 });
      setPromoCodes(response.data);
    } catch (err) {
      setError('Ошибка загрузки промокодов');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    if (!selectedPromo) return;
    try {
      const response = await getPromoCodeStats(selectedPromo.id);
      setStats(response.data);
    } catch (err) {
      console.error('Ошибка загрузки статистики:', err);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await createPromoCode(formData);
      alert('Промокод создан');
      setShowCreateForm(false);
      setFormData({
        code: '',
        discount_type: 'percentage',
        discount_value: '',
        max_uses: '',
        max_uses_per_user: 1,
        min_order_amount: '',
        valid_from: '',
        valid_until: '',
        is_active: true
      });
      loadPromoCodes();
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка создания промокода');
      console.error(err);
    }
  };

  const handleToggleActive = async (promo) => {
    try {
      await updatePromoCode(promo.id, { is_active: !promo.is_active });
      alert(`Промокод ${!promo.is_active ? 'активирован' : 'деактивирован'}`);
      loadPromoCodes();
    } catch (err) {
      setError('Ошибка обновления промокода');
      console.error(err);
    }
  };

  if (loading) return <div className="loading">Загрузка...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1>Промокоды</h1>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="btn btn-primary"
        >
          {showCreateForm ? 'Отмена' : '+ Создать промокод'}
        </button>
      </div>

      {error && <div className="error" style={{ marginBottom: '20px' }}>{error}</div>}

      {showCreateForm && (
        <div className="card" style={{ marginBottom: '20px' }}>
          <h3 style={{ marginBottom: '20px' }}>Новый промокод</h3>
          <form onSubmit={handleCreate}>
            <div className="form-group">
              <label>Код промокода *</label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="SUMMER2026"
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div className="form-group">
                <label>Тип скидки *</label>
                <select
                  value={formData.discount_type}
                  onChange={(e) => setFormData({ ...formData, discount_type: e.target.value })}
                  required
                >
                  <option value="percentage">Процент</option>
                  <option value="fixed">Фиксированная сумма</option>
                </select>
              </div>

              <div className="form-group">
                <label>Размер скидки *</label>
                <input
                  type="number"
                  value={formData.discount_value}
                  onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                  placeholder={formData.discount_type === 'percentage' ? '10' : '100'}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div className="form-group">
                <label>Макс. использований (всего)</label>
                <input
                  type="number"
                  value={formData.max_uses}
                  onChange={(e) => setFormData({ ...formData, max_uses: e.target.value })}
                  placeholder="Без ограничений"
                />
              </div>

              <div className="form-group">
                <label>Макс. использований (на пользователя)</label>
                <input
                  type="number"
                  value={formData.max_uses_per_user}
                  onChange={(e) => setFormData({ ...formData, max_uses_per_user: e.target.value })}
                  placeholder="1"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Мин. сумма заказа</label>
              <input
                type="number"
                value={formData.min_order_amount}
                onChange={(e) => setFormData({ ...formData, min_order_amount: e.target.value })}
                placeholder="0"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div className="form-group">
                <label>Действует с</label>
                <input
                  type="datetime-local"
                  value={formData.valid_from}
                  onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Действует до</label>
                <input
                  type="datetime-local"
                  value={formData.valid_until}
                  onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  style={{ marginRight: '8px' }}
                />
                Активен
              </label>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
              Создать
            </button>
          </form>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: selectedPromo ? '1fr 1fr' : '1fr', gap: '20px' }}>
        <div className="card">
          <h3 style={{ marginBottom: '20px' }}>Список промокодов</h3>
          <table className="table">
            <thead>
              <tr>
                <th>Код</th>
                <th>Скидка</th>
                <th>Использовано</th>
                <th>Статус</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {promoCodes.map((promo) => (
                <tr
                  key={promo.id}
                  style={{
                    background: selectedPromo?.id === promo.id ? '#e3f2fd' : 'transparent'
                  }}
                >
                  <td
                    onClick={() => setSelectedPromo(promo)}
                    style={{ cursor: 'pointer', fontWeight: '600' }}
                  >
                    {promo.code}
                  </td>
                  <td>
                    {promo.discount_type === 'percentage'
                      ? `${promo.discount_value}%`
                      : `${promo.discount_value} ₽`}
                  </td>
                  <td>
                    {promo.used_count || 0}
                    {promo.max_uses ? ` / ${promo.max_uses}` : ''}
                  </td>
                  <td>
                    <span
                      style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '600',
                        background: promo.is_active ? '#28a74520' : '#6c757d20',
                        color: promo.is_active ? '#28a745' : '#6c757d'
                      }}
                    >
                      {promo.is_active ? 'Активен' : 'Неактивен'}
                    </span>
                  </td>
                  <td>
                    <button
                      onClick={() => handleToggleActive(promo)}
                      className="btn btn-secondary"
                      style={{ fontSize: '12px', padding: '4px 8px' }}
                    >
                      {promo.is_active ? 'Деактивировать' : 'Активировать'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {promoCodes.length === 0 && (
            <p style={{ textAlign: 'center', color: '#6c757d', padding: '20px' }}>
              Промокоды не найдены
            </p>
          )}
        </div>

        {selectedPromo && (
          <div className="card">
            <h3 style={{ marginBottom: '20px' }}>Детали промокода</h3>

            <div style={{ marginBottom: '20px' }}>
              <div style={{
                padding: '15px',
                background: selectedPromo.is_active ? '#28a74510' : '#6c757d10',
                borderRadius: '8px',
                marginBottom: '15px'
              }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '5px' }}>
                  {selectedPromo.code}
                </div>
                <div style={{ fontSize: '18px', color: '#6c757d' }}>
                  Скидка:{' '}
                  {selectedPromo.discount_type === 'percentage'
                    ? `${selectedPromo.discount_value}%`
                    : `${selectedPromo.discount_value} ₽`}
                </div>
              </div>

              <div className="form-group">
                <label>Статус</label>
                <div style={{ padding: '10px', background: '#f8f9fa', borderRadius: '4px' }}>
                  {selectedPromo.is_active ? 'Активен' : 'Неактивен'}
                </div>
              </div>

              <div className="form-group">
                <label>Использовано</label>
                <div style={{ padding: '10px', background: '#f8f9fa', borderRadius: '4px' }}>
                  {selectedPromo.used_count || 0}
                  {selectedPromo.max_uses ? ` из ${selectedPromo.max_uses}` : ' (без ограничений)'}
                </div>
              </div>

              <div className="form-group">
                <label>Макс. использований на пользователя</label>
                <div style={{ padding: '10px', background: '#f8f9fa', borderRadius: '4px' }}>
                  {selectedPromo.max_uses_per_user || 'Без ограничений'}
                </div>
              </div>

              {selectedPromo.min_order_amount && (
                <div className="form-group">
                  <label>Мин. сумма заказа</label>
                  <div style={{ padding: '10px', background: '#f8f9fa', borderRadius: '4px' }}>
                    {selectedPromo.min_order_amount} ₽
                  </div>
                </div>
              )}

              {selectedPromo.valid_from && (
                <div className="form-group">
                  <label>Действует с</label>
                  <div style={{ padding: '10px', background: '#f8f9fa', borderRadius: '4px' }}>
                    {new Date(selectedPromo.valid_from).toLocaleString('ru-RU')}
                  </div>
                </div>
              )}

              {selectedPromo.valid_until && (
                <div className="form-group">
                  <label>Действует до</label>
                  <div style={{ padding: '10px', background: '#f8f9fa', borderRadius: '4px' }}>
                    {new Date(selectedPromo.valid_until).toLocaleString('ru-RU')}
                  </div>
                </div>
              )}

              {stats && (
                <div style={{ marginTop: '20px', padding: '15px', background: '#f8f9fa', borderRadius: '8px' }}>
                  <h4 style={{ marginBottom: '10px' }}>Статистика</h4>
                  <div style={{ fontSize: '14px', color: '#6c757d' }}>
                    <div>Всего использований: {stats.total_uses}</div>
                    <div>Уникальных пользователей: {stats.unique_users}</div>
                    <div>Общая скидка: {stats.total_discount} ₽</div>
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

export default PromoCodes;
