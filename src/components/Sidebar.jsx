import React from 'react';
import { useApp } from '../context/AppContext';
import {
  LayoutDashboard, PlusCircle, Smartphone, Brain, Sparkles,
  GitCompareArrows, Target, Calculator, TrendingUp,
  MessageCircle, Shield, Menu, X, Zap, Database
} from 'lucide-react';

const navItems = [
  { section: 'Overview', items: [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'insights', label: 'AI Insights', icon: Sparkles },
  ]},
  { section: 'Capture & Manage', items: [
    { id: 'capture', label: 'AI Capture (SMS/Notif)', icon: Zap },
    { id: 'add-expense', label: 'Expenses & Cash', icon: PlusCircle },
  ]},
  { section: 'Simulate', items: [
    { id: 'what-if', label: 'What-If Simulator', icon: GitCompareArrows },
    { id: 'compare', label: 'Spend vs Save', icon: TrendingUp },
    { id: 'calculator', label: 'Future Value', icon: Calculator },
    { id: 'forecast', label: 'Spending Forecast', icon: Brain },
  ]},
  { section: 'Plan', items: [
    { id: 'goals', label: 'Goals', icon: Target },
  ]},
  { section: 'Help', items: [
    { id: 'ai-chat', label: 'AI Assistant', icon: MessageCircle },
    { id: 'privacy', label: 'Privacy & Security', icon: Shield },
  ]},
];

export default function Sidebar({ isOpen, onClose }) {
  const { state, dispatch, mongoStatus } = useApp();

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
            <h1>NexWorth</h1>
            <div className="logo-tagline">AI Financial Intelligence</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map(section => (
            <div key={section.section} className="sidebar-section">
              <div className="sidebar-section-title">{section.section}</div>
              {section.items.map(item => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    className={`nav-item ${state.currentPage === item.id ? 'active' : ''}`}
                    onClick={() => handleNav(item.id)}
                  >
                    <Icon className="nav-icon" size={18} />
                    <span>{item.label}</span>
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
                boxShadow: mongoStatus?.connected ? '0 0 6px #22C55E' : 'none'
              }} />
            </div>
            <div style={{ fontSize: 10, color: '#6B6B8D', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {mongoStatus?.connected ? `${mongoStatus.cluster} • ${mongoStatus.database}` : 'Connecting to Cluster0...'}
            </div>
          </div>

          <div className="privacy-badge">
            <Shield size={14} />
            <span>Encrypted & private</span>
          </div>
        </div>
      </aside>
    </>
  );
}
