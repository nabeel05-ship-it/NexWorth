import React, { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { CATEGORIES, MONTH_NAMES } from '../utils/demoData';
import { generateInsights, generateExpenseStory, getMonthlyOverview } from '../utils/aiEngine';
import { Sparkles, TrendingUp, TrendingDown } from 'lucide-react';
import {
  Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale,
  LinearScale, BarElement, PointElement, LineElement, Filler
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Filler);

export default function AIInsights() {
  const { state } = useApp();
  const { expenses, user } = state;

  const overview = useMemo(() => getMonthlyOverview(expenses, user.monthlyIncome), [expenses, user.monthlyIncome]);
  const insights = useMemo(() => generateInsights(expenses, user.monthlyIncome, user.budgets), [expenses, user.monthlyIncome, user.budgets]);
  const story = useMemo(() => generateExpenseStory(expenses, user.monthlyIncome, user.budgets), [expenses, user.monthlyIncome, user.budgets]);

  const now = new Date();
  const monthName = MONTH_NAMES[now.getMonth()];

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

  return (
    <div>
      <div className="page-header">
        <div className="flex items-center gap-1">
          <h2>AI Insights</h2>
          <span className="ai-badge"><Sparkles size={12} /> Powered by AI</span>
        </div>
        <p className="subtitle">Intelligent analysis of your spending patterns and behaviour</p>
      </div>

      {/* AI Expense Story */}
      <div className="card card-glow mb-3" style={{ background: 'linear-gradient(135deg, #FFF7F0 0%, #FFF1E3 100%)', border: '1px solid rgba(252, 108, 38, 0.25)' }}>
        <div className="flex items-center gap-1 mb-2">
          <Sparkles size={18} color="var(--primary)" />
          <h3 style={{ fontFamily: "'Space Grotesk'", fontSize: 18 }}>Your {monthName} Expense Story</h3>
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

      {/* Insights + Chart */}
      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <div className="card-title"><Sparkles size={16} /> AI Analysis</div>
          </div>
          {insights.map((insight, i) => (
            <div key={i} className={`insight-card ${insight.type}`}>
              <span className="insight-icon">{insight.icon}</span>
              <div className="insight-content">
                <h4>{insight.title}</h4>
                <p>{insight.text}</p>
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
