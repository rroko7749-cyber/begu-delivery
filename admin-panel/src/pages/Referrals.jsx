import React, { useState, useEffect } from 'react';
import { getReferralStats, getReferralSettings, updateReferralSettings } from '../services/api';

const Referrals = () => {
  const [stats, setStats] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    referrer_bonus: '',
    referee_bonus: '',
    min_order_amount: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsRes, settingsRes] = await Promise.all([
        getReferralStats(),
        getReferralSettings()
      ]);
      setStats(statsRes.data);
      setSettings(settingsRes.data);
      setFormData({
        referrer_bonus: settingsRes.data.referrer_bonus || '',
        referee_bonus: settingsRes.data.referee_bonus || '',
        min_order_amount: settingsRes.data.min_order_amount || ''
      });
    } catch (err) {
      setError('Ошибка загрузки данных');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      await updateReferralSettings(formData);
      alert('Настройки сохранены');
      setEditMode(false);
      loadData();
    } catch (err) {
      setError('Ошибка сохранения настроек');
      console.error(err);
    }
  };

  if (loading) return <div className="loading">Загрузка...</div>;

  return (
    <div>
      <h1 style={{ marginBottom: '30px' }}>Реферальная программа</h1>

      {error && <div className="error" style={{ marginBottom: '20px' }}>{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <div className="card" style={{ borderLeft: '4px solid #3498db' }}>
          <div style={{ color: '#6c757d', fontSize: '14px', marginBottom: '10px' }}>
            Всего рефералов
          </div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#3498db' }}>
            {stats?.total_referrals || 0}
          </div>
        </div>

        <div className="card" style={{ borderLeft: '4px solid #2ecc71' }}>
          <div style={{ color: '#6c757d', fontSize: '14px', marginBottom: '10px' }}>
            Активных рефералов
          </div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#2ecc71' }}>
            {stats?.active_referrals || 0}
          </div>
        </div>

        <div className="card" style={{ borderLeft: '4px solid #f39c12' }}>
          <div style={{ color: '#6c757d', fontSize: '14px', marginBottom: '10px' }}>
            Выплачено бонусов
          </div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#f39c12' }}>
            {stats?.total_bonuses || 0} ₽
          </div>
        </div>

        <div className="card" style={{ borderLeft: '4px solid #e74c3c' }}>
          <div style={{ color: '#6c757d', fontSize: '14px', marginBottom: '10px' }}>
            Заказов по рефералам
          </div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#e74c3c' }}>
            {stats?.total_orders || 0}
          </div>
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3>Настройки реферальной программы</h3>
          {!editMode && (
            <button
              onClick={() => setEditMode(true)}
              className="btn btn-primary"
            >
              Редактировать
            </button>
          )}
        </div>

        {editMode ? (
          <form onSubmit={handleSaveSettings}>
            <div className="form-group">
              <label>Бонус реферера (₽) *</label>
              <input
                type="number"
                value={formData.referrer_bonus}
                onChange={(e) => setFormData({ ...formData, referrer_bonus: e.target.value })}
                placeholder="100"
                required
              />
              <small style={{ color: '#6c757d' }}>
                Сумма, которую получит пользователь за приглашение друга
              </small>
            </div>

            <div className="form-group">
              <label>Бонус приглашённого (₽) *</label>
              <input
                type="number"
                value={formData.referee_bonus}
                onChange={(e) => setFormData({ ...formData, referee_bonus: e.target.value })}
                placeholder="50"
                required
              />
              <small style={{ color: '#6c757d' }}>
                Сумма, которую получит новый пользователь при регистрации по реферальной ссылке
              </small>
            </div>

            <div className="form-group">
              <label>Мин. сумма заказа для активации (₽)</label>
              <input
                type="number"
                value={formData.min_order_amount}
                onChange={(e) => setFormData({ ...formData, min_order_amount: e.target.value })}
                placeholder="0"
              />
              <small style={{ color: '#6c757d' }}>
                Минимальная сумма первого заказа приглашённого для начисления бонусов
              </small>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                Сохранить
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditMode(false);
                  setFormData({
                    referrer_bonus: settings.referrer_bonus || '',
                    referee_bonus: settings.referee_bonus || '',
                    min_order_amount: settings.min_order_amount || ''
                  });
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
            <div className="form-group">
              <label>Бонус реферера</label>
              <div style={{ padding: '10px', background: '#f8f9fa', borderRadius: '4px' }}>
                {settings?.referrer_bonus || 0} ₽
              </div>
            </div>

            <div className="form-group">
              <label>Бонус приглашённого</label>
              <div style={{ padding: '10px', background: '#f8f9fa', borderRadius: '4px' }}>
                {settings?.referee_bonus || 0} ₽
              </div>
            </div>

            <div className="form-group">
              <label>Мин. сумма заказа для активации</label>
              <div style={{ padding: '10px', background: '#f8f9fa', borderRadius: '4px' }}>
                {settings?.min_order_amount || 0} ₽
              </div>
            </div>
          </div>
        )}
      </div>

      {stats?.top_referrers && stats.top_referrers.length > 0 && (
        <div className="card" style={{ marginTop: '20px' }}>
          <h3 style={{ marginBottom: '20px' }}>Топ рефереров</h3>
          <table className="table">
            <thead>
              <tr>
                <th>Пользователь</th>
                <th>Телефон</th>
                <th>Приглашено</th>
                <th>Активных</th>
                <th>Заработано</th>
              </tr>
            </thead>
            <tbody>
              {stats.top_referrers.map((referrer, index) => (
                <tr key={index}>
                  <td>{referrer.full_name || '—'}</td>
                  <td>{referrer.phone}</td>
                  <td>{referrer.total_referrals}</td>
                  <td>{referrer.active_referrals}</td>
                  <td style={{ fontWeight: '600', color: '#28a745' }}>
                    {referrer.total_earned} ₽
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Referrals;
