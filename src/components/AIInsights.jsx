import React, { useMemo, useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import LanguageSwitcher from './LanguageSwitcher';
import { CATEGORIES, MONTH_NAMES } from '../utils/demoData';
import { generateInsights, generateExpenseStory, getMonthlyOverview, analyzeSpendingPatterns } from '../utils/aiEngine';
import { fetchEmailStatus, sendTestEmail, checkOverbudgetAlert } from '../utils/api';
import { Sparkles, TrendingUp, TrendingDown, Clock, Coffee, Target, ArrowRight, Zap, RefreshCw, Mail, Send, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';

import {
  Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale,
  LinearScale, BarElement, PointElement, LineElement, Filler
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Filler);

export default function AIInsights() {
  const { state, dispatch, t } = useApp();
  const { expenses, user, goals } = state;

  const overview = useMemo(() => getMonthlyOverview(expenses, user.monthlyIncome), [expenses, user.monthlyIncome]);
  const insights = useMemo(() => generateInsights(expenses, user.monthlyIncome, user.budgets), [expenses, user.monthlyIncome, user.budgets]);
  const story = useMemo(() => generateExpenseStory(expenses, user.monthlyIncome, user.budgets), [expenses, user.monthlyIncome, user.budgets]);
  const patterns = useMemo(() => analyzeSpendingPatterns(expenses, user.monthlyIncome, goals), [expenses, user.monthlyIncome, goals]);

  const now = new Date();
  const monthName = MONTH_NAMES[now.getMonth()];

  // Email Notification State
  const [emailStatus, setEmailStatus] = useState({ configured: false, emailUser: null, defaultRecipient: '' });
  const [testRecipient, setTestRecipient] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailResult, setEmailResult] = useState(null);
  const [autoAlertStatus, setAutoAlertStatus] = useState(null);

  useEffect(() => {
    fetchEmailStatus().then(status => {
      setEmailStatus(status);
      if (status.defaultRecipient) {
        setTestRecipient(status.defaultRecipient);
      }
    });
  }, []);

  // Automatic Over-Budget Email Alert Trigger when expenses exceed income
  useEffect(() => {
    if (overview.currentTotal > user.monthlyIncome) {
      checkOverbudgetAlert({
        currentTotal: overview.currentTotal,
        monthlyIncome: user.monthlyIncome,
        recipient: testRecipient || undefined,
        monthName,
      }).then(res => {
        setAutoAlertStatus(res);
      });
    }
  }, [overview.currentTotal, user.monthlyIncome, monthName]);

  const handleSendTestEmail = async () => {
    setSendingEmail(true);
    setEmailResult(null);
    const res = await sendTestEmail(testRecipient.trim() || undefined);
    setEmailResult(res);
    setSendingEmail(false);
  };

  const handleTriggerOverbudgetTest = async () => {
    setSendingEmail(true);
    setEmailResult(null);
    const simulatedDeficit = overview.currentTotal > user.monthlyIncome ? overview.currentTotal : user.monthlyIncome + 3800;
    const res = await checkOverbudgetAlert({
      currentTotal: simulatedDeficit,
      monthlyIncome: user.monthlyIncome,
      recipient: testRecipient.trim() || undefined,
      force: true,
      monthName,
    });
    setEmailResult(res);
    setSendingEmail(false);
  };

  // Category trend data
  const trendData = useMemo(() => {
    const categories = Object.keys(overview.currentCategories);
    return {
      labels: categories.map(id => CATEGORIES.find(c => c.id === id)?.name || id),
      datasets: [
        {
          label: 'Last Month',
          data: categories.map(id => overview.previousCategories[id] || 0),
          backgroundColor: 'rgba(215, 206, 195, 0.65)',
          borderRadius: 6,
          borderSkipped: false,
        },
        {
          label: 'This Month',
          data: categories.map(id => overview.currentCategories[id] || 0),
          backgroundColor: '#FC6C26',
          borderRadius: 6,
          borderSkipped: false,
        },
      ],
    };
  }, [overview]);

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
    scales: {
      x: {
        grid: { color: 'rgba(0, 0, 0, 0.04)' },
        ticks: { color: '#8E877F', font: { size: 11 }, callback: v => `₹${(v/1000).toFixed(1)}k` },
      },
      y: {
        grid: { display: false },
        ticks: { color: '#1A1714', font: { size: 12, weight: '500' } },
      },
    },
    plugins: {
      legend: {
        position: 'top',
        labels: { color: '#655E57', font: { size: 11, weight: '500' }, usePointStyle: true, pointStyleWidth: 8 },
      },
      tooltip: {
        backgroundColor: '#FFFFFF',
        borderColor: 'rgba(252, 108, 38, 0.25)',
        borderWidth: 1,
        titleColor: '#1A1714',
        bodyColor: '#655E57',
        padding: 12,
        cornerRadius: 10,
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)',
        callbacks: {
          label: (ctx) => `${ctx.dataset.label}: ₹${ctx.parsed.x.toLocaleString('en-IN')}`,
        },
      },
    },
  };

  // Category changes
  const categoryChanges = useMemo(() => {
    return Object.entries(overview.currentCategories)
      .map(([catId, amount]) => {
        const prev = overview.previousCategories[catId] || 0;
        const change = prev > 0 ? ((amount - prev) / prev * 100) : (amount > 0 ? 100 : 0);
        const cat = CATEGORIES.find(c => c.id === catId);
        return { catId, name: cat?.name || catId, icon: cat?.icon || '📌', amount, prev, change: Math.round(change) };
      })
      .sort((a, b) => Math.abs(b.change) - Math.abs(a.change));
  }, [overview]);

  const handleInsightAction = (query) => {
    dispatch({ type: 'SET_CHAT_QUERY', payload: query });
  };

  return (
    <div>
      <div className="page-header">
        <div className="flex justify-between items-center" style={{ flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div className="flex items-center gap-1">
              <h2>{t('ins_title')}</h2>
              <span className="ai-badge"><Sparkles size={12} /> Powered by AI</span>
            </div>
            <p className="subtitle">{t('ins_subtitle')}</p>
          </div>
          <LanguageSwitcher compact={false} />
        </div>
      </div>

      {/* AI SPENDING PATTERN SECTION */}
      <div className="card mb-3" style={{ background: '#FFFFFF', border: '1px solid rgba(252, 108, 38, 0.2)', boxShadow: '0 8px 24px rgba(252, 108, 38, 0.06)' }}>
        <div className="flex justify-between items-center mb-2" style={{ flexWrap: 'wrap', gap: 10 }}>
          <div className="flex items-center gap-2">
            <span style={{ fontSize: 22 }}>🧬</span>
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: 'var(--text)' }}>{t('ins_pattern_title')}</h3>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Frequency • Category • Amount Size • Time Distribution • Recurring Subscriptions
              </div>
            </div>
          </div>
          <span className="ai-badge" style={{ background: 'rgba(252, 108, 38, 0.1)', color: 'var(--primary)', borderColor: 'rgba(252, 108, 38, 0.3)' }}>
            Behavioral Intelligence
          </span>
        </div>

        {/* AI Summary Banner */}
        <div style={{ padding: '14px 18px', background: 'linear-gradient(135deg, #FFF7F0 0%, #FFF1E3 100%)', borderRadius: 12, border: '1px solid rgba(252, 108, 38, 0.2)', marginBottom: 20 }}>
          <div className="flex items-center gap-1 mb-1">
            <Sparkles size={16} color="var(--primary)" />
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)', letterSpacing: 0.3 }}>AI EXECUTIVE SUMMARY</span>
          </div>
          <p style={{ fontSize: 14.5, color: '#2B2620', lineHeight: 1.6, margin: 0, fontWeight: 500 }}>
            "{patterns.summaryText}"
          </p>
        </div>

        {/* Pattern Pillars Grid */}
        <div className="grid-3 mb-3" style={{ gap: 14 }}>
          {/* Pillar 1: Frequency & Amount */}
          <div style={{ background: 'var(--bg-secondary)', padding: 14, borderRadius: 12, border: '1px solid var(--border)' }}>
            <div className="flex items-center gap-1 mb-2">
              <Zap size={16} color="var(--primary)" />
              <div style={{ fontSize: 13, fontWeight: 600 }}>{t('ins_frequency_title')}</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {patterns.activeCategories.slice(0, 3).map(cat => (
                <div key={cat.catId} style={{ fontSize: 12, background: '#FFFFFF', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border)' }}>
                  <div className="flex justify-between items-center mb-1">
                    <span style={{ fontWeight: 600 }}>{cat.icon} {cat.name}</span>
                    <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 6, background: 'rgba(252, 108, 38, 0.1)', color: cat.tagColor, fontWeight: 600 }}>
                      {cat.patternType}
                    </span>
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>
                    ₹{cat.total.toLocaleString('en-IN')} across {cat.count} txns (avg ₹{cat.avg.toLocaleString('en-IN')})
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pillar 2: Small Expenses Leak */}
          <div style={{ background: 'var(--bg-secondary)', padding: 14, borderRadius: 12, border: '1px solid var(--border)' }}>
            <div className="flex items-center gap-1 mb-2">
              <Coffee size={16} color="#D97706" />
              <div style={{ fontSize: 13, fontWeight: 600 }}>{t('ins_micro_title')}</div>
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>
              ₹{patterns.totalSmallValue.toLocaleString('en-IN')}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
              {t('ins_micro_desc')} ({patterns.allSmallCount} txns)
            </div>
            <div style={{ fontSize: 11, color: '#78350F', background: '#FEF3C7', padding: '6px 10px', borderRadius: 6, lineHeight: 1.4 }}>
              ⚠️ {t('ins_micro_warning')}
            </div>
          </div>

          {/* Pillar 3: Time Pattern & Recurring */}
          <div style={{ background: 'var(--bg-secondary)', padding: 14, borderRadius: 12, border: '1px solid var(--border)' }}>
            <div className="flex items-center gap-1 mb-2">
              <Clock size={16} color="#4F46E5" />
              <div style={{ fontSize: 13, fontWeight: 600 }}>{t('ins_time_title')}</div>
            </div>
            <div style={{ marginBottom: 10 }}>
              <div className="flex justify-between items-center mb-1">
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{t('ins_weekend_leakage')}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#4F46E5' }}>{patterns.weekendPct}%</span>
              </div>
              <div className="progress-bar" style={{ height: 6 }}>
                <div className="progress-fill" style={{ width: `${patterns.weekendPct}%`, background: '#4F46E5' }} />
              </div>
            </div>
            <div style={{ borderTop: '1px dashed var(--border)', paddingTop: 8 }}>
              <div className="flex justify-between items-center">
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{t('ins_recurring')}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>₹{patterns.recurringTotal.toLocaleString('en-IN')}/mo</span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                {patterns.subscriptions.length} active (Netflix, WiFi, Gym, etc.)
              </div>
            </div>
          </div>
        </div>

        {/* Actionable Benefit Card (The "Direct Fayda") */}
        <div style={{
          background: 'linear-gradient(135deg, #1C1917 0%, #292524 100%)',
          color: '#FFFFFF',
          padding: '18px 20px',
          borderRadius: 14,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
        }}>
          <div style={{ maxWidth: 650 }}>
            <div className="flex items-center gap-1 mb-1">
              <Target size={18} color="#FC6C26" />
              <span style={{ fontSize: 13, fontWeight: 700, color: '#FC6C26', letterSpacing: 0.5 }}>
                {t('ins_benefit_title')}
              </span>
            </div>
            <div style={{ fontSize: 14, lineHeight: 1.6, color: '#E7E5E4' }}>
              {patterns.opportunity.explanation}
            </div>
          </div>
          <button
            className="btn btn-primary"
            style={{ padding: '12px 20px', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 16px rgba(252, 108, 38, 0.4)' }}
            onClick={() => handleInsightAction(patterns.opportunity.suggestedQuery)}
          >
            <span>{t('ins_ask_money_btn')}: "{patterns.opportunity.suggestedQuery}"</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>

      {/* AI Expense Story */}
      <div className="card card-glow mb-3" style={{ background: 'linear-gradient(135deg, #FFF7F0 0%, #FFF1E3 100%)', border: '1px solid rgba(252, 108, 38, 0.25)' }}>
        <div className="flex items-center gap-1 mb-2">
          <Sparkles size={18} color="var(--primary)" />
          <h3 style={{ fontFamily: "'Space Grotesk'", fontSize: 18 }}>{t('ins_story_title')} ({monthName})</h3>
        </div>
        <p style={{ fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.8, maxWidth: 700 }}>{story}</p>
      </div>

      {/* Key Metrics */}
      <div className="stat-grid mb-3">
        <div className="stat-card">
          <div className="stat-label">Transactions</div>
          <div className="stat-value">{overview.transactionCount}</div>
          <div className="stat-change" style={{ color: 'var(--text-muted)' }}>This month</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Avg. Per Transaction</div>
          <div className="stat-value">₹{overview.transactionCount > 0 ? Math.round(overview.currentTotal / overview.transactionCount).toLocaleString('en-IN') : 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Categories Used</div>
          <div className="stat-value">{overview.categoryCount}</div>
          <div className="stat-change" style={{ color: 'var(--text-muted)' }}>of {CATEGORIES.length} total</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Spending Change</div>
          <div className="stat-value" style={{ color: overview.currentTotal > overview.previousTotal ? 'var(--danger)' : 'var(--success)' }}>
            {overview.previousTotal > 0 ? `${((overview.currentTotal - overview.previousTotal) / overview.previousTotal * 100).toFixed(0)}%` : 'N/A'}
          </div>
          <div className={`stat-change ${overview.currentTotal > overview.previousTotal ? 'negative' : 'positive'}`}>
            {overview.currentTotal > overview.previousTotal ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            vs last month
          </div>
        </div>
      </div>

      {/* Automated Email Notifications (Gmail SMTP) */}
      <div className="card mb-3" style={{ background: '#FFFFFF', border: '1px solid rgba(252, 108, 38, 0.25)', boxShadow: '0 8px 24px rgba(0, 0, 0, 0.04)' }}>
        <div className="flex justify-between items-center mb-2" style={{ flexWrap: 'wrap', gap: 10 }}>
          <div className="flex items-center gap-2">
            <div style={{
              width: 38, height: 38, borderRadius: 10, background: 'rgba(252, 108, 38, 0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)'
            }}>
              <Mail size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: 17, fontWeight: 700, margin: 0, color: 'var(--text)' }}>
                {t('email_title')}
              </h3>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {t('email_subtitle')}
              </div>
            </div>
          </div>

          <div>
            {emailStatus.configured ? (
              <span className="ai-badge" style={{ background: '#DCFCE7', color: '#16A34A', borderColor: '#86EFAC' }}>
                <CheckCircle2 size={12} /> {t('email_active_badge')} ({emailStatus.emailUser})
              </span>
            ) : (
              <span className="ai-badge" style={{ background: '#FEF3C7', color: '#D97706', borderColor: '#FDE68A' }}>
                <AlertTriangle size={12} /> {t('email_unconfigured_badge')}
              </span>
            )}
          </div>
        </div>

        {/* Trigger Condition Banner */}
        <div style={{
          padding: '12px 16px',
          borderRadius: 10,
          background: overview.currentTotal > user.monthlyIncome ? '#FEF2F2' : 'var(--bg-secondary)',
          border: `1px solid ${overview.currentTotal > user.monthlyIncome ? '#FCA5A5' : 'var(--border)'}`,
          marginBottom: 16
        }}>
          <div className="flex items-center gap-2">
            {overview.currentTotal > user.monthlyIncome ? (
              <span style={{ fontSize: 16 }}>🚨</span>
            ) : (
              <span style={{ fontSize: 16 }}>⚡</span>
            )}
            <div style={{ fontSize: 13, color: overview.currentTotal > user.monthlyIncome ? '#991B1B' : 'var(--text)', lineHeight: 1.5 }}>
              {overview.currentTotal > user.monthlyIncome ? (
                <span>
                  <strong>{t('email_rule_active')}</strong>
                </span>
              ) : (
                <span>
                  <strong>{t('email_rule_normal')}</strong>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Test Email Controls */}
        <div style={{
          background: 'var(--bg-secondary)',
          padding: 16,
          borderRadius: 12,
          border: '1px solid var(--border)'
        }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>
            {t('email_send_test')} (Gmail SMTP)
          </div>

          <div className="flex gap-2" style={{ flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ flex: 1, minWidth: 260 }}>
              <input
                type="email"
                className="form-input"
                placeholder="Enter recipient email (e.g. your_email@gmail.com)..."
                value={testRecipient}
                onChange={e => setTestRecipient(e.target.value)}
                style={{ background: '#FFFFFF', fontSize: 13 }}
              />
            </div>
            <button
              className="btn btn-primary btn-sm flex items-center gap-1"
              onClick={handleSendTestEmail}
              disabled={sendingEmail}
            >
              <Send size={14} />
              {sendingEmail ? 'Sending...' : t('email_send_test')}
            </button>
            <button
              className="btn btn-outline btn-sm flex items-center gap-1"
              onClick={handleTriggerOverbudgetTest}
              disabled={sendingEmail}
              title="Simulate the over-budget alert email with live figures"
            >
              <span>{t('email_simulate_overbudget')}</span>
            </button>
          </div>

          {/* Feedback Message */}
          {emailResult && (
            <div style={{
              marginTop: 12,
              padding: '10px 14px',
              borderRadius: 8,
              fontSize: 12.5,
              lineHeight: 1.5,
              background: (emailResult.success || emailResult.sent) ? '#F0FDF4' : '#FFFBEB',
              border: `1px solid ${(emailResult.success || emailResult.sent) ? '#86EFAC' : '#FDE68A'}`,
              color: (emailResult.success || emailResult.sent) ? '#166534' : '#92400E'
            }}>
              {(emailResult.success || emailResult.sent) ? (
                <div>
                  <strong>✅ Success:</strong> {emailResult.message}
                  {emailResult.messageId && <div style={{ fontSize: 11, color: '#15803D', marginTop: 2 }}>ID: {emailResult.messageId}</div>}
                  {emailResult.previewUrl && (
                    <div style={{ marginTop: 8 }}>
                      <a
                        href={emailResult.previewUrl}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '6px 14px',
                          borderRadius: 6,
                          background: '#166534',
                          color: '#FFFFFF',
                          textDecoration: 'none',
                          fontWeight: 600,
                          fontSize: 12,
                          boxShadow: '0 2px 8px rgba(22, 101, 52, 0.25)',
                        }}
                      >
                        <span>🔗 Open Email Preview in Browser</span>
                        <ArrowRight size={14} />
                      </a>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <strong>⚠️ Note:</strong> {emailResult.error || emailResult.warning}
                  <div style={{ fontSize: 11.5, marginTop: 4, color: '#78350F' }}>
                    💡 To send real emails via Gmail SMTP, add <code>EMAIL_USER=your_email@gmail.com</code> and <code>EMAIL_PASS=your_16_char_app_password</code> in <code>.env</code>. Credentials are never exposed to the frontend.
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Insights + Chart */}
      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <div className="card-title"><Sparkles size={16} /> AI Analysis Alerts</div>
          </div>
          {insights.map((insight, i) => (
            <div key={i} className={`insight-card ${insight.type}`} style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex' }}>
                <span className="insight-icon">{insight.icon}</span>
                <div className="insight-content">
                  <h4>{insight.title}</h4>
                  <p>{insight.text}</p>
                  
                  {insight.action && (
                    <button 
                      className="btn btn-outline btn-sm" 
                      style={{ marginTop: 12, fontSize: 12, display: 'inline-flex', alignSelf: 'flex-start', background: '#FFFFFF' }}
                      onClick={() => handleInsightAction(insight.actionQuery)}
                    >
                      {insight.action}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div>
          {/* Category Comparison Chart */}
          <div className="card mb-2">
            <div className="card-header">
              <div className="card-title">📊 Category Trends</div>
            </div>
            <div className="chart-container" style={{ height: 300 }}>
              <Bar data={trendData} options={barOptions} />
            </div>
          </div>

          {/* Category Changes */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">📈 Category Changes</div>
            </div>
            {categoryChanges.slice(0, 5).map(cat => (
              <div key={cat.catId} className="flex justify-between items-center" style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <div className="flex items-center gap-1">
                  <span style={{ fontSize: 18 }}>{cat.icon}</span>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>{cat.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      ₹{cat.prev.toLocaleString('en-IN')} → ₹{cat.amount.toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>
                <span style={{
                  fontSize: 14, fontWeight: 600,
                  color: cat.change > 0 ? 'var(--danger)' : cat.change < 0 ? 'var(--success)' : 'var(--text-muted)',
                }}>
                  {cat.change > 0 ? '+' : ''}{cat.change}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="disclaimer mt-3">
        ℹ️ These insights are generated by analyzing your expense data patterns. They are for informational purposes only and do not constitute financial advice. The AI helps you understand your spending — how you use this information is entirely your choice.
      </div>
    </div>
  );
}
