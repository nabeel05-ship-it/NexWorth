import React from 'react';
import { useApp } from '../context/AppContext';
import LanguageSwitcher from './LanguageSwitcher';
import {
  LayoutDashboard, PlusCircle, Brain, Sparkles,
  GitCompareArrows, Target, Calculator, TrendingUp,
  MessageCircle, Shield, Menu, X, Zap, Database
} from 'lucide-react';

export default function Sidebar({ isOpen, onClose }) {
  const { state, dispatch, mongoStatus, t } = useApp();

  const navSections = [
    {
      titleKey: 'nav_overview',
      items: [
        { id: 'dashboard', labelKey: 'nav_dashboard', icon: LayoutDashboard },
        { id: 'insights', labelKey: 'nav_insights', icon: Sparkles },
      ],
    },
    {
      titleKey: 'nav_capture_manage',
      items: [
        { id: 'capture', labelKey: 'nav_capture', icon: Zap },
        { id: 'add-expense', labelKey: 'nav_expenses', icon: PlusCircle },
      ],
    },
    {
      titleKey: 'nav_simulate',
      items: [
        { id: 'what-if', labelKey: 'nav_what_if', icon: GitCompareArrows },
        { id: 'compare', labelKey: 'nav_compare', icon: TrendingUp },
        { id: 'calculator', labelKey: 'nav_calculator', icon: Calculator },
        { id: 'forecast', labelKey: 'nav_forecast', icon: Brain },
      ],
    },
    {
      titleKey: 'nav_plan',
      items: [
        { id: 'goals', labelKey: 'nav_goals', icon: Target },
      ],
    },
    {
      titleKey: 'nav_help',
      items: [
        { id: 'ai-chat', labelKey: 'nav_ai_chat', icon: MessageCircle },
        { id: 'privacy', labelKey: 'nav_privacy', icon: Shield },
      ],
    },
  ];

  const handleNav = (pageId) => {
    dispatch({ type: 'SET_PAGE', payload: pageId });
    onClose?.();
  };

  return (
    <>
      <button className="mobile-menu-btn" onClick={onClose}>
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <div className="logo-icon">N</div>
          <div>
            <h1>{t('brand_name')}</h1>
            <div className="logo-tagline">{t('brand_tagline')}</div>
          </div>
        </div>

        {/* Language Switcher Bar */}
        <div style={{ padding: '0 12px 14px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6, letterSpacing: 0.5 }}>
            {t('lang_select')} / Language
          </div>
          <LanguageSwitcher compact={false} style={{ width: '100%', justifyContent: 'space-between' }} />
        </div>

        <nav className="sidebar-nav">
          {navSections.map(section => (
            <div key={section.titleKey} className="sidebar-section">
              <div className="sidebar-section-title">{t(section.titleKey)}</div>
              {section.items.map(item => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    className={`nav-item ${state.currentPage === item.id ? 'active' : ''}`}
                    onClick={() => handleNav(item.id)}
                  >
                    <Icon className="nav-icon" size={18} />
                    <span>{t(item.labelKey)}</span>
                    {item.id === 'ai-chat' && (
                      <span className="ai-badge" style={{ marginLeft: 'auto', fontSize: 9 }}>AI</span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          {/* Live MongoDB Status Card */}
          <div style={{
            padding: '10px 12px',
            borderRadius: 12,
            background: mongoStatus?.connected ? 'rgba(34, 197, 94, 0.08)' : 'rgba(252, 108, 38, 0.08)',
            border: `1px solid ${mongoStatus?.connected ? 'rgba(34, 197, 94, 0.25)' : 'rgba(252, 108, 38, 0.25)'}`,
            marginBottom: 10,
            display: 'flex',
            flexDirection: 'column',
            gap: 4
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, color: mongoStatus?.connected ? '#16A34A' : '#D95000' }}>
              <Database size={13} />
              <span>MongoDB Cloud</span>
              <span style={{
                marginLeft: 'auto',
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: mongoStatus?.connected ? '#22C55E' : '#F59E0B',
              }} />
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
              {mongoStatus?.connected
                ? `Active: ${mongoStatus.cluster}`
                : `Connecting to ${mongoStatus.cluster}...`}
            </div>
          </div>

          <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6, padding: '4px 6px' }}>
            <Shield size={13} color="var(--success)" />
            <span>{t('nav_privacy')}</span>
          </div>
        </div>
      </aside>
    </>
  );
}
