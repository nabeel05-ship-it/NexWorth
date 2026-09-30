import React, { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { CATEGORIES, MONTH_NAMES } from '../utils/demoData';
import { getMonthlyOverview, generateInsights, generateExpenseStory } from '../utils/aiEngine';
import {
  Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale,
  LinearScale, BarElement, PointElement, LineElement, Filler
} from 'chart.js';
import { Doughnut, Bar, Line } from 'react-chartjs-2';
import { TrendingUp, TrendingDown, ArrowRight, Sparkles, Target } from 'lucide-react';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Filler);

export default function Dashboard() {
  const { state, dispatch } = useApp();
  const { expenses, user, goals } = state;

  const overview = useMemo(() => getMonthlyOverview(expenses, user.monthlyIncome), [expenses, user.monthlyIncome]);
  const insights = useMemo(() => generateInsights(expenses, user.monthlyIncome, user.budgets), [expenses, user.monthlyIncome, user.budgets]);
  const story = useMemo(() => generateExpenseStory(expenses, user.monthlyIncome, user.budgets), [expenses, user.monthlyIncome, user.budgets]);

  const now = new Date();
  const monthName = MONTH_NAMES[now.getMonth()];

  // Recent expenses (this month)
  const recentExpenses = useMemo(() => {
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    return expenses
      .filter(e => {
        const d = new Date(e.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 6);
  }, [expenses]);

  // Doughnut chart data
  const doughnutData = useMemo(() => {
    const cats = Object.entries(overview.currentCategories).sort((a, b) => b[1] - a[1]);
    return {
      labels: cats.map(([id]) => CATEGORIES.find(c => c.id === id)?.name || id),
      datasets: [{
        data: cats.map(([, v]) => v),
        backgroundColor: cats.map(([id]) => CATEGORIES.find(c => c.id === id)?.color || '#A0A0B0'),
        borderWidth: 0,
        hoverOffset: 8,
      }],
    };
  }, [overview.currentCategories]);

  // Monthly comparison bar chart
  const barData = useMemo(() => {
    const prevMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
    return {
      labels: CATEGORIES.slice(0, 7).map(c => c.name),
      datasets: [
        {
          label: MONTH_NAMES[prevMonth],
          data: CATEGORIES.slice(0, 7).map(c => overview.previousCategories[c.id] || 0),
          backgroundColor: 'rgba(215, 206, 195, 0.65)',
          borderRadius: 6,
          borderSkipped: false,
        },
        {
          label: monthName,
          data: CATEGORIES.slice(0, 7).map(c => overview.currentCategories[c.id] || 0),
          backgroundColor: '#FC6C26',
          borderRadius: 6,
          borderSkipped: false,
        },
      ],
    };
  }, [overview]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { color: '#655E57', font: { size: 12, weight: '500' }, padding: 16, usePointStyle: true, pointStyleWidth: 8 },
      },
      tooltip: {
        backgroundColor: '#FFFFFF',
        borderColor: 'rgba(252, 108, 38, 0.25)',
        borderWidth: 1,
        titleColor: '#1A1714',
        bodyColor: '#655E57',
        titleFont: { size: 13, weight: '600' },
        bodyFont: { size: 12 },
        padding: 12,
        cornerRadius: 10,
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)',
        callbacks: {
          label: function (ctx) {
            return `₹${ctx.parsed.toLocaleString('en-IN')}`;
          }
        }
      },
    },
  };

  const barOptions = {
    ...chartOptions,
    scales: {
      x: { grid: { display: false }, ticks: { color: '#8E877F', font: { size: 11 } } },
      y: {
        grid: { color: 'rgba(0, 0, 0, 0.04)' },
        ticks: {
          color: '#8E877F', font: { size: 11 },
          callback: (v) => `₹${(v / 1000).toFixed(0)}k`
        }
      },
    },
    plugins: {
      ...chartOptions.plugins,
      tooltip: {
        ...chartOptions.plugins.tooltip,
        callbacks: {
          label: function (ctx) {
            return `${ctx.dataset.label}: ₹${ctx.parsed.y.toLocaleString('en-IN')}`;
          }
        }
      }
    }
  };

  const doughnutOptions = {
    ...chartOptions,
    cutout: '72%',
    plugins: {
      ...chartOptions.plugins,
      tooltip: {
        ...chartOptions.plugins.tooltip,
        callbacks: {
          label: function (ctx) {
            const pct = ((ctx.parsed / overview.currentTotal) * 100).toFixed(1);
            return `${ctx.label}: ₹${ctx.parsed.toLocaleString('en-IN')} (${pct}%)`;
          }
        }
      }
    }
  };

  const spendingChange = overview.previousTotal > 0
    ? ((overview.currentTotal - overview.previousTotal) / overview.previousTotal * 100).toFixed(1)
    : 0;

  // Budget usage
  const budgetUsage = useMemo(() => {
    if (!user.budgets) return [];
    return Object.entries(user.budgets)
      .map(([catId, budget]) => {
        const spent = overview.currentCategories[catId] || 0;
        const percentage = budget > 0 ? Math.min(100, (spent / budget) * 100) : 0;
        const cat = CATEGORIES.find(c => c.id === catId);
        return { catId, name: cat?.name || catId, icon: cat?.icon || '📌', budget, spent, percentage, remaining: budget - spent };
      })
      .sort((a, b) => b.percentage - a.percentage);
  }, [user.budgets, overview.currentCategories]);

  return (
    <div>
      <div className="page-header">
        <h2>Dashboard</h2>
        <p className="subtitle">{monthName} {now.getFullYear()} — Financial Overview</p>
      </div>

      {/* AI Story Card */}
      <div className="card card-glow mb-3" style={{ background: 'linear-gradient(135deg, #FFF7F0 0%, #FFF1E3 100%)', border: '1px solid rgba(252, 108, 38, 0.25)' }}>
        <div className="flex items-center gap-1 mb-1">
          <span className="ai-badge"><Sparkles size={12} /> AI Expense Story</span>
        </div>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7 }}>{story}</p>
      </div>

      {/* Stat Cards */}
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-icon apricot">💰</div>
          <div className="stat-label">Monthly Income</div>
          <div className="stat-value">₹{user.monthlyIncome.toLocaleString('en-IN')}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon purple">📊</div>
          <div className="stat-label">Total Expenses</div>
          <div className="stat-value">₹{overview.currentTotal.toLocaleString('en-IN')}</div>
          <div className={`stat-change ${spendingChange > 0 ? 'negative' : 'positive'}`}>
            {spendingChange > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            {Math.abs(spendingChange)}% vs last month
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green">💵</div>
          <div className="stat-label">Savings</div>
          <div className="stat-value" style={{ color: overview.savings >= 0 ? 'var(--success)' : 'var(--danger)' }}>
            ₹{overview.savings.toLocaleString('en-IN')}
          </div>
          <div className="stat-change" style={{ color: 'var(--text-muted)' }}>
            {overview.savingsRate}% savings rate
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon red">🏷️</div>
          <div className="stat-label">Top Expense</div>
          <div className="stat-value" style={{ fontSize: 20 }}>
            {CATEGORIES.find(c => c.id === overview.topCategory)?.icon} {CATEGORIES.find(c => c.id === overview.topCategory)?.name}
          </div>
          <div className="stat-change" style={{ color: 'var(--text-muted)' }}>
            ₹{overview.topAmount.toLocaleString('en-IN')}
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="chart-row">
        <div className="card">
          <div className="card-header">
            <div className="card-title"><span className="card-icon">🍩</span> Spending Breakdown</div>
          </div>
          <div className="chart-container" style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: '80%', maxWidth: 280 }}>
              <Doughnut data={doughnutData} options={doughnutOptions} />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title"><span className="card-icon">📊</span> Monthly Comparison</div>
          </div>
          <div className="chart-container" style={{ height: 280 }}>
            <Bar data={barData} options={barOptions} />
          </div>
        </div>
      </div>

      {/* Budget Status + AI Insights Row */}
      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <div className="card-title"><span className="card-icon">📋</span> Budget Status</div>
          </div>
          {budgetUsage.slice(0, 5).map(b => (
            <div key={b.catId} style={{ marginBottom: 14 }}>
              <div className="flex justify-between items-center mb-1">
                <span style={{ fontSize: 13 }}>{b.icon} {b.name}</span>
                <span style={{ fontSize: 12, color: b.remaining >= 0 ? 'var(--text-muted)' : 'var(--danger)' }}>
                  ₹{b.spent.toLocaleString('en-IN')} / ₹{b.budget.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="progress-bar">
                <div
                  className={`progress-fill ${b.percentage >= 100 ? 'danger' : b.percentage >= 80 ? 'apricot' : ''}`}
                  style={{ width: `${Math.min(100, b.percentage)}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title"><span className="card-icon">✨</span> AI Alerts</div>
            <span className="ai-badge"><Sparkles size={10} /> AI</span>
          </div>
          {insights.slice(0, 4).map((insight, i) => (
            <div key={i} className={`insight-card ${insight.type}`} style={{ padding: 12, marginBottom: 8 }}>
              <span className="insight-icon" style={{ fontSize: 18 }}>{insight.icon}</span>
              <div className="insight-content">
                <p style={{ fontSize: 13 }}>{insight.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Goals + Recent Transactions Row */}
      <div className="grid-2 mt-3">
        <div className="card">
          <div className="card-header">
            <div className="card-title"><Target size={16} /> Goals Progress</div>
            <button className="btn btn-ghost btn-sm" onClick={() => dispatch({ type: 'SET_PAGE', payload: 'goals' })}>
              View All <ArrowRight size={14} />
            </button>
          </div>
          {goals.slice(0, 3).map(goal => {
            const progress = ((goal.currentAmount / goal.targetAmount) * 100).toFixed(0);
            return (
              <div key={goal.id} style={{ marginBottom: 16 }}>
                <div className="flex justify-between items-center mb-1">
                  <span style={{ fontSize: 14 }}>{goal.icon} {goal.name}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)' }}>{progress}%</span>
                </div>
                <div className="flex justify-between items-center mb-1">
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    ₹{goal.currentAmount.toLocaleString('en-IN')} / ₹{goal.targetAmount.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${Math.min(100, progress)}%` }} />
                </div>
              </div>
            );
          })}
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title"><span className="card-icon">📝</span> Recent Transactions</div>
            <button className="btn btn-ghost btn-sm" onClick={() => dispatch({ type: 'SET_PAGE', payload: 'add-expense' })}>
              View All <ArrowRight size={14} />
            </button>
          </div>
          <ul className="expense-list">
            {recentExpenses.map(exp => {
              const cat = CATEGORIES.find(c => c.id === exp.category);
              return (
                <li key={exp.id} className="expense-item" style={{ padding: '10px 0' }}>
                  <div className="expense-cat-icon" style={{ background: `${cat?.color}20`, width: 34, height: 34, fontSize: 15 }}>
                    {cat?.icon}
                  </div>
                  <div className="expense-info">
                    <div className="expense-name">{exp.name}</div>
                    <div className="expense-meta">
                      <span>{cat?.name}</span>
                      <span>{new Date(exp.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                    </div>
                  </div>
                  <div className="expense-amount">-₹{exp.amount.toLocaleString('en-IN')}</div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
