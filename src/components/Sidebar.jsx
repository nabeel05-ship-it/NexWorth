import React from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { useApp } from '../context/AppContext';
import LanguageSwitcher from './LanguageSwitcher';
import {
  LayoutDashboard, PlusCircle, Brain, Sparkles,
  GitCompareArrows, Target, Calculator, TrendingUp,
  MessageCircle, Shield, Menu, X, Zap, Database
} from 'lucide-react';
import { EASE_FINTECH } from '../utils/motionVariants';

export default function Sidebar({ isOpen, onClose }) {
  const { state, dispatch, mongoStatus, t } = useApp();
  const shouldReduceMotion = useReducedMotion();

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
      {/* Mobile Menu Trigger */}
      <motion.button
        className="mobile-menu-btn"
        onClick={onClose}
        whileTap={shouldReduceMotion ? undefined : { scale: 0.92 }}
        whileHover={shouldReduceMotion ? undefined : { scale: 1.05 }}
        aria-label="Toggle navigation menu"
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={isOpen ? 'close' : 'open'}
            initial={{ opacity: 0, rotate: -45 }}
            animate={{ opacity: 1, rotate: 0 }}
            exit={{ opacity: 0, rotate: 45 }}
            transition={{ duration: 0.15 }}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            {isOpen ? <X size={20} /> : <Menu size={20} />}
          </motion.span>
        </AnimatePresence>
      </motion.button>

      {/* Mobile Drawer Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(26, 23, 20, 0.4)',
              backdropFilter: 'blur(3px)',
              zIndex: 90,
            }}
          />
        )}
      </AnimatePresence>

      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <img
            src="/nexworth-logo.png"
            alt="NexWorth"
            className="logo-icon logo-icon--img"
          />
          <div>
            <h1>{t('brand_name')}</h1>
            <div className="logo-tagline">{t('brand_tagline')}</div>
          </div>
        </div>

        {/* Language Switcher Bar */}
        <div style={{ padding: '0 12px 14px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6, letterSpacing: 0.5 }}>
            {t('lang_select')}
          </div>
          <LanguageSwitcher compact={false} style={{ width: '100%', justifyContent: 'space-between' }} />
        </div>

        <nav className="sidebar-nav">
          {navSections.map(section => (
            <div key={section.titleKey} className="sidebar-section">
              <div className="sidebar-section-title">{t(section.titleKey)}</div>
              {section.items.map(item => {
                const Icon = item.icon;
                const isActive = state.currentPage === item.id;
                return (
                  <motion.button
                    key={item.id}
                    className={`nav-item ${isActive ? 'active' : ''}`}
                    onClick={() => handleNav(item.id)}
                    whileHover={shouldReduceMotion ? undefined : { x: 3, transition: { duration: 0.15, ease: EASE_FINTECH } }}
                    whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
                    style={{ position: 'relative' }}
                  >
                    <Icon className="nav-icon" size={18} />
                    <span>{t(item.labelKey)}</span>
                    {item.id === 'ai-chat' && (
                      <span className="ai-badge" style={{ marginLeft: 'auto', fontSize: 9 }}>AI</span>
                    )}
                  </motion.button>
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
            border: `1px solid ${mongoStatus?.connected ? 'rgba(34, 197, 94, 0.25)' : (mongoStatus?.backendReachable ? 'rgba(245, 158, 11, 0.25)' : 'rgba(252, 108, 38, 0.25)')}`,
            marginBottom: 10,
            display: 'flex',
            flexDirection: 'column',
            gap: 4
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 11,
              fontWeight: 700,
              color: mongoStatus?.connected ? '#16A34A' : (mongoStatus?.backendReachable ? '#D97706' : '#D95000')
            }}>
              <Database size={13} />
              <span>{t('mongo_cloud')}</span>
              <motion.span
                animate={shouldReduceMotion ? undefined : { scale: [1, 1.25, 1], opacity: [0.8, 1, 0.8] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                style={{
                  marginLeft: 'auto',
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  background: mongoStatus?.connected ? '#22C55E' : (mongoStatus?.backendReachable ? '#F59E0B' : '#EF4444'),
                  display: 'inline-block',
                }}
              />
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
              {mongoStatus?.checking
                ? t('mongo_checking')
                : mongoStatus?.connected
                ? t('mongo_active', { cluster: mongoStatus.cluster })
                : mongoStatus?.backendReachable
                ? t('mongo_standby')
                : t('mongo_offline')}
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

