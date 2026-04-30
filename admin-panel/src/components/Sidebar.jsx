import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  MdDashboard,
  MdDeliveryDining,
  MdShoppingCart,
  MdSupport,
  MdCardGiftcard,
  MdPeople,
  MdSettings,
  MdHistory,
  MdAdminPanelSettings,
  MdPerson,
  MdMap
} from 'react-icons/md';

const Sidebar = () => {
  const location = useLocation();

  const menuItems = [
    { path: '/', label: 'Дашборд', icon: MdDashboard },
    { path: '/couriers', label: 'Курьеры', icon: MdDeliveryDining },
    { path: '/courier-map', label: 'Карта курьеров', icon: MdMap },
    { path: '/orders', label: 'Заказы', icon: MdShoppingCart },
    { path: '/support', label: 'Поддержка', icon: MdSupport },
    { path: '/promo-codes', label: 'Промокоды', icon: MdCardGiftcard },
    { path: '/referrals', label: 'Рефералы', icon: MdPeople },
    { path: '/settings', label: 'Настройки', icon: MdSettings },
    { path: '/audit', label: 'Аудит', icon: MdHistory },
    { path: '/profile', label: 'Профиль', icon: MdPerson }
  ];

  return (
    <div style={{
      width: '280px',
      background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)',
      color: 'white',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      position: 'sticky',
      top: 0,
      boxShadow: '4px 0 24px rgba(0, 0, 0, 0.12)'
    }}>
      <div style={{
        padding: '2rem 1.5rem',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          marginBottom: '0.5rem'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.5rem',
            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.4)'
          }}>
            🚀
          </div>
          <div>
            <h2 style={{
              fontSize: '1.25rem',
              fontWeight: '700',
              margin: 0,
              background: 'linear-gradient(135deg, #fff 0%, #e0e7ff 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              БегуДоставка
            </h2>
            <p style={{
              fontSize: '0.75rem',
              color: 'rgba(255, 255, 255, 0.6)',
              margin: 0,
              fontWeight: '500'
            }}>
              Админ панель
            </p>
          </div>
        </div>
      </div>

      <nav style={{
        flex: 1,
        overflowY: 'auto',
        padding: '1rem 0'
      }}>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '0.875rem 1.5rem',
                color: isActive ? 'white' : 'rgba(255, 255, 255, 0.7)',
                textDecoration: 'none',
                background: isActive
                  ? 'linear-gradient(90deg, rgba(99, 102, 241, 0.2) 0%, transparent 100%)'
                  : 'transparent',
                borderLeft: isActive ? '3px solid #6366f1' : '3px solid transparent',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative',
                fontWeight: isActive ? '600' : '500',
                fontSize: '0.875rem'
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  e.currentTarget.style.color = 'white';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)';
                }
              }}
            >
              <Icon style={{
                marginRight: '0.875rem',
                fontSize: '1.25rem',
                opacity: isActive ? 1 : 0.8
              }} />
              <span>{item.label}</span>
              {isActive && (
                <div style={{
                  position: 'absolute',
                  right: '1rem',
                  width: '6px',
                  height: '6px',
                  background: '#6366f1',
                  borderRadius: '50%',
                  boxShadow: '0 0 8px rgba(99, 102, 241, 0.8)'
                }} />
              )}
            </Link>
          );
        })}
      </nav>

      <div style={{
        padding: '1rem 1.5rem',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        fontSize: '0.75rem',
        color: 'rgba(255, 255, 255, 0.5)',
        textAlign: 'center'
      }}>
        <div>© 2026 БегуДоставка</div>
        <div style={{ marginTop: '0.25rem' }}>v1.0.0</div>
      </div>
    </div>
  );
};

export default Sidebar;
