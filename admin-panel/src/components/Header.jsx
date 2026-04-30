import React, { useState, useEffect } from 'react';
import { MdLogout, MdSearch } from 'react-icons/md';
import { logout } from '../services/api';
import axios from 'axios';

const Header = ({ onLogout }) => {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/v1/admin-auth/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfile(response.data);
    } catch (error) {
      console.error('Load profile error:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      onLogout();
    }
  };

  const roleLabels = {
    super_admin: 'Супер Админ',
    admin: 'Администратор',
    manager: 'Менеджер',
    support: 'Поддержка',
    analyst: 'Аналитик'
  };

  return (
    <header style={{
      background: 'white',
      padding: '1rem 2rem',
      borderBottom: '1px solid var(--gray-200)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
      position: 'sticky',
      top: 0,
      zIndex: 10
    }}>
      <div style={{ flex: 1, maxWidth: '500px' }}>
        <div style={{ position: 'relative' }}>
          <MdSearch style={{
            position: 'absolute',
            left: '1rem',
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: '1.25rem',
            color: 'var(--gray-400)'
          }} />
          <input
            type="text"
            placeholder="Поиск..."
            style={{
              width: '100%',
              padding: '0.625rem 1rem 0.625rem 2.75rem',
              border: '1px solid var(--gray-300)',
              borderRadius: 'var(--radius-lg)',
              fontSize: '0.875rem',
              transition: 'var(--transition)',
              background: 'var(--gray-50)'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = 'var(--primary)';
              e.target.style.background = 'white';
              e.target.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.1)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'var(--gray-300)';
              e.target.style.background = 'var(--gray-50)';
              e.target.style.boxShadow = 'none';
            }}
          />
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{
          height: '32px',
          width: '1px',
          background: 'var(--gray-300)'
        }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: '600',
            fontSize: '0.875rem',
            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
          }}>
            {profile ? (profile.full_name || profile.username).charAt(0).toUpperCase() : 'A'}
          </div>
          <div>
            <div style={{
              fontSize: '0.875rem',
              fontWeight: '600',
              color: 'var(--gray-900)'
            }}>
              {profile ? (profile.full_name || profile.username) : 'Загрузка...'}
            </div>
            <div style={{
              fontSize: '0.75rem',
              color: 'var(--gray-500)'
            }}>
              {profile ? roleLabels[profile.role] || profile.role : '...'}
            </div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          style={{
            padding: '0.625rem 1rem',
            borderRadius: 'var(--radius)',
            border: '1px solid var(--gray-300)',
            background: 'white',
            color: 'var(--gray-700)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.875rem',
            fontWeight: '600',
            transition: 'var(--transition)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--gray-50)';
            e.currentTarget.style.borderColor = 'var(--gray-400)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'white';
            e.currentTarget.style.borderColor = 'var(--gray-300)';
          }}
        >
          <MdLogout style={{ fontSize: '1.125rem' }} />
          Выйти
        </button>
      </div>
    </header>
  );
};

export default Header;
