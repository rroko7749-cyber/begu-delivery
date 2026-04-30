import React, { useState, useEffect, useRef } from 'react';
import { MdMyLocation, MdRefresh, MdFilterList, MdPerson, MdDirectionsBike } from 'react-icons/md';

const CourierMap = () => {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [couriers, setCouriers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // all, active, idle
  const [selectedCourier, setSelectedCourier] = useState(null);

  // Инициализация Яндекс.Карт
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://api-maps.yandex.ru/2.1/?apikey=YOUR_API_KEY&lang=ru_RU';
    script.async = true;
    script.onload = initMap;
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  const initMap = () => {
    if (window.ymaps) {
      window.ymaps.ready(() => {
        const mapInstance = new window.ymaps.Map(mapRef.current, {
          center: [55.751574, 37.573856], // Москва
          zoom: 12,
          controls: ['zoomControl', 'fullscreenControl']
        });
        setMap(mapInstance);
        loadCouriers();
      });
    }
  };

  // Загрузка курьеров
  const loadCouriers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/v1/courier-tracking', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load couriers');
      }

      const data = await response.json();

      // Фильтруем курьеров с координатами
      const couriersWithLocation = data.filter(c => c.lat && c.lng);

      setCouriers(couriersWithLocation);
      if (map) {
        updateMapMarkers(couriersWithLocation);
      }
    } catch (err) {
      setError('Ошибка загрузки курьеров');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Обновление маркеров на карте
  const updateMapMarkers = (couriersList) => {
    if (!map || !window.ymaps) return;

    // Очистка старых маркеров
    map.geoObjects.removeAll();

    couriersList.forEach((courier) => {
      if (filter !== 'all' && courier.status !== filter) return;

      const placemark = new window.ymaps.Placemark(
        [courier.lat, courier.lng],
        {
          balloonContent: `
            <div style="padding: 10px;">
              <strong>${courier.name}</strong><br/>
              <span style="color: ${courier.status === 'active' ? '#10b981' : '#6b7280'}">
                ${courier.status === 'active' ? '🟢 Активен' : '⚪ Свободен'}
              </span><br/>
              ${courier.current_order ? `📦 ${courier.current_order}` : 'Нет заказа'}<br/>
              📊 Заказов сегодня: ${courier.orders_today}
            </div>
          `
        },
        {
          preset: courier.status === 'active' ? 'islands#greenDotIcon' : 'islands#grayDotIcon'
        }
      );

      placemark.events.add('click', () => {
        setSelectedCourier(courier);
      });

      map.geoObjects.add(placemark);
    });
  };

  // Обновление маркеров при изменении фильтра
  useEffect(() => {
    if (map && couriers.length > 0) {
      updateMapMarkers(couriers);
    }
  }, [filter, map, couriers]);

  // WebSocket для обновления позиций в реальном времени
  useEffect(() => {
    const ws = new WebSocket('ws://localhost:3000');

    ws.onopen = () => {
      console.log('WebSocket connected');
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'courier_location_update') {
          setCouriers((prev) =>
            prev.map((c) =>
              c.id === data.courier_id
                ? { ...c, lat: data.lat, lng: data.lng, status: data.status }
                : c
            )
          );
        }
      } catch (err) {
        console.error('WebSocket message error:', err);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
    };

    return () => {
      ws.close();
    };
  }, []);

  const getStatusColor = (status) => {
    return status === 'active' ? 'var(--success)' : 'var(--gray-500)';
  };

  const filteredCouriers = couriers.filter(
    (c) => filter === 'all' || c.status === filter
  );

  return (
    <div style={{ padding: '2rem', height: 'calc(100vh - 80px)' }}>
      <div style={{
        marginBottom: '1.5rem',
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
            Карта курьеров
          </h1>
          <p style={{
            color: 'var(--gray-500)',
            fontSize: '0.875rem',
            margin: 0
          }}>
            Отслеживание местоположения курьеров в реальном времени
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={loadCouriers}
            className="btn btn-secondary"
          >
            <MdRefresh style={{ fontSize: '1.25rem' }} />
            Обновить
          </button>
        </div>
      </div>

      {error && (
        <div className="error" style={{ marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}

      <div style={{
        display: 'grid',
        gridTemplateColumns: '350px 1fr',
        gap: '1.5rem',
        height: 'calc(100% - 120px)'
      }}>
        {/* Боковая панель со списком курьеров */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          overflowY: 'auto'
        }}>
          <div className="card" style={{ padding: '1rem' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '1rem'
            }}>
              <MdFilterList style={{ fontSize: '1.25rem', color: 'var(--primary)' }} />
              <h3 style={{
                fontSize: '1rem',
                fontWeight: '600',
                color: 'var(--gray-900)',
                margin: 0
              }}>
                Фильтр
              </h3>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                onClick={() => setFilter('all')}
                className={filter === 'all' ? 'btn btn-primary' : 'btn btn-secondary'}
                style={{ flex: 1, fontSize: '0.875rem', padding: '0.5rem' }}
              >
                Все ({couriers.length})
              </button>
              <button
                onClick={() => setFilter('active')}
                className={filter === 'active' ? 'btn btn-primary' : 'btn btn-secondary'}
                style={{ flex: 1, fontSize: '0.875rem', padding: '0.5rem' }}
              >
                Активные ({couriers.filter(c => c.status === 'active').length})
              </button>
              <button
                onClick={() => setFilter('idle')}
                className={filter === 'idle' ? 'btn btn-primary' : 'btn btn-secondary'}
                style={{ flex: 1, fontSize: '0.875rem', padding: '0.5rem' }}
              >
                Свободные ({couriers.filter(c => c.status === 'idle').length})
              </button>
            </div>
          </div>

          {filteredCouriers.map((courier) => (
            <div
              key={courier.id}
              className="card"
              style={{
                padding: '1rem',
                cursor: 'pointer',
                border: selectedCourier?.id === courier.id ? '2px solid var(--primary)' : '1px solid var(--gray-200)',
                transition: 'var(--transition)'
              }}
              onClick={() => {
                setSelectedCourier(courier);
                if (map) {
                  map.setCenter([courier.lat, courier.lng], 15, { duration: 300 });
                }
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '1.25rem',
                  fontWeight: '700',
                  boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
                }}>
                  <MdDirectionsBike />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontWeight: '600',
                    color: 'var(--gray-900)',
                    marginBottom: '0.25rem'
                  }}>
                    {courier.name}
                  </div>
                  <div style={{
                    fontSize: '0.8125rem',
                    color: 'var(--gray-600)',
                    marginBottom: '0.25rem'
                  }}>
                    {courier.phone}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{
                      padding: '0.125rem 0.5rem',
                      borderRadius: '9999px',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      background: getStatusColor(courier.status) + '20',
                      color: getStatusColor(courier.status)
                    }}>
                      {courier.status === 'active' ? '🟢 Активен' : '⚪ Свободен'}
                    </span>
                  </div>
                  {courier.current_order && (
                    <div style={{
                      fontSize: '0.75rem',
                      color: 'var(--gray-600)',
                      marginTop: '0.5rem'
                    }}>
                      📦 {courier.current_order}
                    </div>
                  )}
                  <div style={{
                    fontSize: '0.75rem',
                    color: 'var(--gray-500)',
                    marginTop: '0.25rem'
                  }}>
                    📊 Заказов сегодня: {courier.orders_today}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {filteredCouriers.length === 0 && (
            <div className="card" style={{
              padding: '2rem',
              textAlign: 'center',
              color: 'var(--gray-500)'
            }}>
              <MdPerson style={{ fontSize: '3rem', opacity: 0.5, marginBottom: '0.5rem' }} />
              <p style={{ margin: 0, fontSize: '0.875rem' }}>
                Нет курьеров
              </p>
            </div>
          )}
        </div>

        {/* Карта */}
        <div className="card" style={{ padding: 0, overflow: 'hidden', position: 'relative' }}>
          {loading && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(255, 255, 255, 0.9)',
              zIndex: 10
            }}>
              <div className="loading">Загрузка карты...</div>
            </div>
          )}
          <div
            ref={mapRef}
            style={{
              width: '100%',
              height: '100%',
              minHeight: '500px'
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default CourierMap;
