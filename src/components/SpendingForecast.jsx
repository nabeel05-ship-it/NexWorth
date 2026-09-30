import React, { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { getSpendingForecast } from '../utils/aiEngine';
import { MONTH_NAMES } from '../utils/demoData';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement,
  Filler, Tooltip, Legend
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { Brain, TrendingUp, TrendingDown, Minus } from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

export default function SpendingForecast() {
  const { state } = useApp();
  const { expenses } = state;

  const now = new Date();
  const forecast = useMemo(() => getSpendingForecast(expenses), [expenses]);

  // Month labels
  const labels = useMemo(() => {
    const result = [];
    for (let i = 2; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      result.push(MONTH_NAMES[d.getMonth()]);
    }
    for (let i = 1; i <= 3; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      result.push(`${MONTH_NAMES[d.getMonth()]} (est.)`);
    }
    return result;
  }, []);

  const chartData = useMemo(() => ({
    labels,
    datasets: [
      {
        label: 'Actual Spending',
        data: [...forecast.historical, null, null, null],
        borderColor: '#FC6C26',
        backgroundColor: 'rgba(252, 108, 38, 0.12)',
        fill: true,
        tension: 0.4,
        pointRadius: 5,
        pointBackgroundColor: '#FC6C26',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointHoverRadius: 8,
      },
      {
        label: 'Estimated Spending',
        data: [null, null, forecast.historical[2], ...forecast.forecasted],
        borderColor: '#FFF4D6',
        backgroundColor: 'rgba(255, 244, 214, 0.08)',
        fill: true,
        borderDash: [8, 4],
        tension: 0.4,
        pointRadius: 5,
        pointBackgroundColor: '#FFF4D6',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointHoverRadius: 8,
      },
    ],
  }), [forecast, labels]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { intersect: false, mode: 'index' },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#6B6B8D', font: { size: 11 } } },
      y: {
        grid: { color: 'rgba(255,255,255,0.03)' },
        ticks: { color: '#6B6B8D', font: { size: 11 }, callback: v => `₹${(v / 1000).toFixed(0)}k` },
      },
    },
    plugins: {
      legend: {
        position: 'bottom',
        labels: { color: '#A0A0C0', font: { size: 12 }, usePointStyle: true, pointStyleWidth: 8, padding: 16 },
      },
      tooltip: {
        backgroundColor: '#1E1A17',
        borderColor: 'rgba(252, 108, 38, 0.3)',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        callbacks: { label: (ctx) => ctx.parsed.y !== null ? `${ctx.dataset.label}: ₹${ctx.parsed.y.toLocaleString('en-IN')}` : '' },
      },
    },
  };

  const TrendIcon = forecast.trend === 'increasing' ? TrendingUp : forecast.trend === 'decreasing' ? TrendingDown : Minus;
  const trendColor = forecast.trend === 'increasing' ? 'var(--danger)' : forecast.trend === 'decreasing' ? 'var(--success)' : 'var(--text-muted)';

  return (
    <div>
      <div className="page-header">
        <div className="flex items-center gap-1">
          <h2>Spending Forecast</h2>
          <span className="ai-badge"><Brain size={12} /> AI Powered</span>
        </div>
        <p className="subtitle">Estimated future spending based on your current patterns</p>
      </div>

      {/* Trend Summary */}
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-label">Current Month</div>
          <div className="stat-value">₹{forecast.historical[2]?.toLocaleString('en-IN') || '0'}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Next Month (est.)</div>
          <div className="stat-value" style={{ color: 'var(--accent)' }}>₹{forecast.forecasted[0]?.toLocaleString('en-IN') || '0'}</div>
          <div className="stat-change" style={{ color: 'var(--text-muted)' }}>Estimated</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Spending Trend</div>
          <div className="stat-value flex items-center gap-1" style={{ color: trendColor }}>
            <TrendIcon size={20} />
            {forecast.trend.charAt(0).toUpperCase() + forecast.trend.slice(1)}
          </div>
          <div className="stat-change" style={{ color: trendColor }}>
            ~₹{forecast.trendAmount.toLocaleString('en-IN')}/month {forecast.trend === 'increasing' ? '↑' : forecast.trend === 'decreasing' ? '↓' : '→'}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">3-Month Est. Total</div>
          <div className="stat-value">₹{forecast.forecasted.reduce((s, v) => s + v, 0).toLocaleString('en-IN')}</div>
          <div className="stat-change" style={{ color: 'var(--text-muted)' }}>Next 3 months</div>
        </div>
      </div>

      {/* Chart */}
      <div className="card mt-3">
        <div className="card-header">
          <div className="card-title">📈 Spending Trajectory</div>
        </div>
        <div className="chart-container" style={{ height: 360 }}>
          <Line data={chartData} options={chartOptions} />
        </div>
      </div>

      {/* Historical Data */}
      <div className="card mt-3">
        <div className="card-title mb-2">📋 Monthly Breakdown</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
          {forecast.historical.map((amount, i) => {
            const d = new Date(now.getFullYear(), now.getMonth() - (2 - i), 1);
            const isCurrentMonth = i === 2;
            return (
              <div key={i} className="scenario-box" style={isCurrentMonth ? { background: 'rgba(252,108,38,0.1)', borderColor: 'rgba(252,108,38,0.25)' } : {}}>
                <div className="scenario-label">{MONTH_NAMES[d.getMonth()]}</div>
                <div className="scenario-value" style={{ fontSize: 20 }}>₹{amount.toLocaleString('en-IN')}</div>
                <div className="scenario-note">{isCurrentMonth ? 'Current' : 'Actual'}</div>
              </div>
            );
          })}
          {forecast.forecasted.map((amount, i) => {
            const d = new Date(now.getFullYear(), now.getMonth() + i + 1, 1);
            return (
              <div key={`f${i}`} className="scenario-box" style={{ background: 'rgba(255,244,214,0.08)', borderColor: 'rgba(255,244,214,0.2)' }}>
                <div className="scenario-label">{MONTH_NAMES[d.getMonth()]}</div>
                <div className="scenario-value" style={{ fontSize: 20, color: 'var(--accent)' }}>₹{amount.toLocaleString('en-IN')}</div>
                <div className="scenario-note">Estimated</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="disclaimer mt-3">
        ⚠️ These forecasts are estimates based on your recent spending patterns using trend analysis. Actual spending will vary based on your choices and circumstances. These projections are not guaranteed predictions.
      </div>
    </div>
  );
}
