import React from 'react';
import { useApp } from '../context/AppContext';
import {
  LayoutDashboard, PlusCircle, Upload, Brain, Sparkles,
  GitCompareArrows, Target, Calculator, TrendingUp,
  MessageCircle, Shield, Menu, X
} from 'lucide-react';

const navItems = [
  { section: 'Overview', items: [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'insights', label: 'AI Insights', icon: Sparkles },
  ]},
  { section: 'Manage', items: [
    { id: 'add-expense', label: 'Add Expense', icon: PlusCircle },
    { id: 'import', label: 'Import Statement', icon: Upload },
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
  const { state, dispatch } = useApp();

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
          <div className="privacy-badge">
            <Shield size={14} />
            <span>Your data stays private</span>
          </div>
        </div>
      </aside>
    </>
  );
}
