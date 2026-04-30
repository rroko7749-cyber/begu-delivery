import React, { useState, useEffect } from 'react';
import { getSettings, updateSetting, deleteSetting } from '../services/api';

const Settings = () => {
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingSetting, setEditingSetting] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    key: '',
    value: '',
    description: ''
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await getSettings();
      setSettings(response.data);
    } catch (err) {
      setError('Ошибка загрузки настроек');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (setting) => {
    setEditingSetting(setting.key);
    setFormData({
      key: setting.key,
      value: setting.value,
      description: setting.description || ''
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await updateSetting(formData.key, formData.value, formData.description);
      alert('Настройка сохранена');
      setEditingSetting(null);
      setShowCreateForm(false);
      setFormData({ key: '', value: '', description: '' });
      loadSettings();
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка сохранения настройки');
      console.error(err);
    }
  };

  const handleDelete = async (key) => {
    if (!confirm(`Удалить настройку "${key}"?`)) return;

    try {
      await deleteSetting(key);
      alert('Настройка удалена');
      loadSettings();
    } catch (err) {
      setError('Ошибка удаления настройки');
      console.error(err);
    }
  };

  const handleCancel = () => {
    setEditingSetting(null);
    setShowCreateForm(false);
    setFormData({ key: '', value: '', description: '' });
  };

  if (loading) return <div className="loading">Загрузка...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1>Настройки системы</h1>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="btn btn-primary"
        >
          {showCreateForm ? 'Отмена' : '+ Добавить настройку'}
        </button>
      </div>

      {error && <div className="error" style={{ marginBottom: '20px' }}>{error}</div>}

      {showCreateForm && (
        <div className="card" style={{ marginBottom: '20px' }}>
          <h3 style={{ marginBottom: '20px' }}>Новая настройка</h3>
          <form onSubmit={handleSave}>
            <div className="form-group">
              <label>Ключ *</label>
              <input
                type="text"
                value={formData.key}
                onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                placeholder="delivery_base_price"
                required
              />
              <small style={{ color: '#6c757d' }}>
                Уникальный идентификатор настройки (только латиница, цифры и подчёркивания)
              </small>
            </div>

            <div className="form-group">
              <label>Значение *</label>
              <input
                type="text"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                placeholder="100"
                required
              />
            </div>

            <div className="form-group">
              <label>Описание</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Базовая стоимость доставки в рублях"
                rows="2"
              />
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                Создать
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="btn btn-secondary"
                style={{ flex: 1 }}
              >
                Отмена
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        <h3 style={{ marginBottom: '20px' }}>Список настроек</h3>

        {settings.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#6c757d', padding: '20px' }}>
            Настройки не найдены
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {settings.map((setting) => (
              <div
                key={setting.key}
                style={{
                  padding: '15px',
                  border: '1px solid #dee2e6',
                  borderRadius: '8px',
                  background: editingSetting === setting.key ? '#e3f2fd' : 'white'
                }}
              >
                {editingSetting === setting.key ? (
                  <form onSubmit={handleSave}>
                    <div className="form-group">
                      <label>Ключ</label>
                      <input
                        type="text"
                        value={formData.key}
                        disabled
                        style={{ background: '#e9ecef', cursor: 'not-allowed' }}
                      />
                    </div>

                    <div className="form-group">
                      <label>Значение *</label>
                      <input
                        type="text"
                        value={formData.value}
                        onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Описание</label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        rows="2"
                      />
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                        Сохранить
                      </button>
                      <button
                        type="button"
                        onClick={handleCancel}
                        className="btn btn-secondary"
                        style={{ flex: 1 }}
                      >
                        Отмена
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '10px' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '600', fontSize: '16px', marginBottom: '5px' }}>
                          {setting.key}
                        </div>
                        {setting.description && (
                          <div style={{ fontSize: '14px', color: '#6c757d', marginBottom: '10px' }}>
                            {setting.description}
                          </div>
                        )}
                        <div style={{
                          padding: '8px 12px',
                          background: '#f8f9fa',
                          borderRadius: '4px',
                          fontFamily: 'monospace',
                          fontSize: '14px'
                        }}>
                          {setting.value}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', marginLeft: '15px' }}>
                        <button
                          onClick={() => handleEdit(setting)}
                          className="btn btn-primary"
                          style={{ fontSize: '12px', padding: '6px 12px' }}
                        >
                          Изменить
                        </button>
                        <button
                          onClick={() => handleDelete(setting.key)}
                          className="btn btn-secondary"
                          style={{ fontSize: '12px', padding: '6px 12px' }}
                        >
                          Удалить
                        </button>
                      </div>
                    </div>
                    <div style={{ fontSize: '12px', color: '#6c757d' }}>
                      Обновлено: {new Date(setting.updated_at).toLocaleString('ru-RU')}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card" style={{ marginTop: '20px', background: '#fff3cd', border: '1px solid #ffc107' }}>
        <h4 style={{ marginBottom: '10px', color: '#856404' }}>⚠️ Важно</h4>
        <p style={{ fontSize: '14px', color: '#856404', margin: 0 }}>
          Изменение системных настроек может повлиять на работу приложения.
          Убедитесь, что вы понимаете назначение настройки перед её изменением.
        </p>
      </div>
    </div>
  );
};

export default Settings;
