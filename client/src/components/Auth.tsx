import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { loginUser, registerUser } from '../api';
import { User } from '../types';
import { LanguageSwitcher } from './LanguageSwitcher';
import './Auth.css';

interface AuthProps {
  onLogin: (user: User, token: string) => void;
}

export function Auth({ onLogin }: AuthProps) {
  const { t } = useTranslation();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = isLogin 
        ? await loginUser({ username: formData.username, password: formData.password })
        : await registerUser({ 
            username: formData.username, 
            password: formData.password, 
            email: formData.email || undefined 
          });

      if (response.success && response.user && response.token) {
        onLogin(response.user, response.token);
      } else {
        setError(response.message || 'Authentication failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleQuickLogin = async (username: string, password: string) => {
    setLoading(true);
    setError('');
    
    try {
      const response = await loginUser({ username, password });
      
      if (response.success && response.user && response.token) {
        onLogin(response.user, response.token);
      } else {
        setError(response.message || 'Quick login failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <LanguageSwitcher />
      <div className="auth-card">
        <h1 className="auth-title">{t('auth.title')}</h1>
        
        <div className="auth-tabs">
          <button 
            className={isLogin ? 'tab active' : 'tab'}
            onClick={() => setIsLogin(true)}
          >
            {t('auth.loginButton')}
          </button>
          <button 
            className={!isLogin ? 'tab active' : 'tab'}
            onClick={() => setIsLogin(false)}
          >
            {t('auth.registerButton')}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="username">{t('common.username')}</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              required
              minLength={3}
              maxLength={20}
              placeholder={t('common.username')}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">{t('common.password')}</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              required
              minLength={6}
              placeholder={t('common.password')}
            />
          </div>

          {!isLogin && (
            <div className="form-group">
              <label htmlFor="email">{t('common.email')}</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder={t('common.email')}
              />
            </div>
          )}

          {error && <div className="error-message">{error}</div>}

          <button 
            type="submit" 
            className="submit-button"
            disabled={loading}
          >
            {loading ? t('common.loading') : (isLogin ? t('auth.loginButton') : t('auth.registerButton'))}
          </button>
        </form>

        {/* Quick Login Buttons for Testing */}
        {isLogin && (
          <div className="quick-login-section">
            <div className="quick-login-divider">
              <span>Quick Login (Testing)</span>
            </div>
            <div className="quick-login-buttons">
              <button 
                type="button"
                className="quick-login-button marcos"
                onClick={() => handleQuickLogin('marcos', process.env.REACT_APP_TEST_MARCOS_PASSWORD || 'marcos')}
                disabled={loading}
              >
                👤 Login as Marcos
              </button>
              <button 
                type="button"
                className="quick-login-button michele"
                onClick={() => handleQuickLogin('michele', process.env.REACT_APP_TEST_MICHELE_PASSWORD || 'michele')}
                disabled={loading}
              >
                👤 Login as Michele
              </button>
            </div>
          </div>
        )}

        <p className="auth-footer">
          {isLogin ? t('auth.noAccount') + ' ' : t('auth.haveAccount') + ' '}
          <button 
            className="link-button"
            onClick={() => setIsLogin(!isLogin)}
          >
            {isLogin ? t('auth.registerHere') : t('auth.loginHere')}
          </button>
        </p>
      </div>
    </div>
  );
}