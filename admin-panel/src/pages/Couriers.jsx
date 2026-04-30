import React, { useState, useEffect } from 'react';
import { getPendingCouriers, getCourierDetails, verifyCourier } from '../services/api';

const Couriers = () => {
  const [couriers, setCouriers] = useState([]);
  const [selectedCourier, setSelectedCourier] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    loadCouriers();
  }, []);

  const loadCouriers = async () => {
    try {
      const response = await getPendingCouriers();
      setCouriers(response.data);
    } catch (err) {
      setError('Ошибка загрузки курьеров');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCourier = async (id) => {
    try {
      const response = await getCourierDetails(id);
      setSelectedCourier(response.data);
      setRejectionReason('');
    } catch (err) {
      setError('Ошибка загрузки данных курьера');
      console.error(err);
    }
  };

  const handleVerify = async (status) => {
    if (!selectedCourier) return;

    if (status === 'rejected' && !rejectionReason.trim()) {
      setError('Укажите причину отклонения');
      return;
    }

    try {
      await verifyCourier(selectedCourier.id, status, status === 'rejected' ? rejectionReason : null);
      setError('');
      alert(`Курьер ${status === 'verified' ? 'одобрен' : 'отклонён'}`);
      setSelectedCourier(null);
      loadCouriers();
    } catch (err) {
      setError('Ошибка обработки заявки');
      console.error(err);
    }
  };

  if (loading) return <div className="loading">Загрузка...</div>;

  return (
    <div>
      <h1 style={{ marginBottom: '30px' }}>Верификация курьеров</h1>

      {error && <div className="error" style={{ marginBottom: '20px' }}>{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: selectedCourier ? '1fr 2fr' : '1fr', gap: '20px' }}>
        <div className="card">
          <h3 style={{ marginBottom: '20px' }}>Ожидают проверки ({couriers.length})</h3>
          {couriers.length === 0 ? (
            <p style={{ color: '#6c757d', textAlign: 'center', padding: '20px' }}>
              Нет заявок на проверку
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {couriers.map((courier) => (
                <div
                  key={courier.id}
                  onClick={() => handleSelectCourier(courier.id)}
                  style={{
                    padding: '15px',
                    border: '1px solid #dee2e6',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    background: selectedCourier?.id === courier.id ? '#e3f2fd' : 'white',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ fontWeight: '600', marginBottom: '5px' }}>
                    {courier.full_name}
                  </div>
                  <div style={{ fontSize: '14px', color: '#6c757d' }}>
                    {courier.phone}
                  </div>
                  <div style={{ fontSize: '12px', color: '#6c757d', marginTop: '5px' }}>
                    {new Date(courier.created_at).toLocaleDateString('ru-RU')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {selectedCourier && (
          <div className="card">
            <h3 style={{ marginBottom: '20px' }}>Детали заявки</h3>

            <div style={{ marginBottom: '20px' }}>
              <div className="form-group">
                <label>ФИО</label>
                <div style={{ padding: '10px', background: '#f8f9fa', borderRadius: '4px' }}>
                  {selectedCourier.full_name}
                </div>
              </div>

              <div className="form-group">
                <label>Телефон</label>
                <div style={{ padding: '10px', background: '#f8f9fa', borderRadius: '4px' }}>
                  {selectedCourier.phone}
                </div>
              </div>

              <div className="form-group">
                <label>Email</label>
                <div style={{ padding: '10px', background: '#f8f9fa', borderRadius: '4px' }}>
                  {selectedCourier.email || '—'}
                </div>
              </div>

              <div className="form-group">
                <label>Тип транспорта</label>
                <div style={{ padding: '10px', background: '#f8f9fa', borderRadius: '4px' }}>
                  {selectedCourier.vehicle_type || '—'}
                </div>
              </div>

              <div className="form-group">
                <label>Номер транспорта</label>
                <div style={{ padding: '10px', background: '#f8f9fa', borderRadius: '4px' }}>
                  {selectedCourier.vehicle_number || '—'}
                </div>
              </div>

              <div className="form-group">
                <label>Дата регистрации</label>
                <div style={{ padding: '10px', background: '#f8f9fa', borderRadius: '4px' }}>
                  {new Date(selectedCourier.created_at).toLocaleString('ru-RU')}
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ marginBottom: '10px' }}>Документы</h4>
              {selectedCourier.passport_photo && (
                <div style={{ marginBottom: '10px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
                    Фото паспорта
                  </label>
                  <img
                    src={selectedCourier.passport_photo}
                    alt="Паспорт"
                    style={{ maxWidth: '100%', borderRadius: '8px', border: '1px solid #dee2e6' }}
                  />
                </div>
              )}
              {selectedCourier.driver_license_photo && (
                <div style={{ marginBottom: '10px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
                    Водительское удостоверение
                  </label>
                  <img
                    src={selectedCourier.driver_license_photo}
                    alt="Права"
                    style={{ maxWidth: '100%', borderRadius: '8px', border: '1px solid #dee2e6' }}
                  />
                </div>
              )}
            </div>

            <div className="form-group">
              <label>Причина отклонения (если отклоняете)</label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Укажите причину отклонения заявки"
                rows="3"
              />
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => handleVerify('verified')}
                className="btn btn-primary"
                style={{ flex: 1 }}
              >
                Одобрить
              </button>
              <button
                onClick={() => handleVerify('rejected')}
                className="btn btn-secondary"
                style={{ flex: 1 }}
              >
                Отклонить
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Couriers;
