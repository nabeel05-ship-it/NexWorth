import React, { useState, useMemo } from 'react';
import { compareSpendSaveInvest } from '../utils/aiEngine';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { TrendingUp } from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export default function SpendSaveInvest() {
  const [amount, setAmount] = useState(5000);
  const [activeTab, setActiveTab] = useState(0);

  const timeframes = [
    { years: [1, 3, 5], label: 'Short Term' },
    { years: [5, 10, 15], label: 'Medium Term' },
    { years: [5, 10, 20], label: 'Long Term' },
  ];

  const comparisons = useMemo(() => compareSpendSaveInvest(amount, timeframes[activeTab].years), [amount, activeTab]);

  const chartData = useMemo(() => ({
    labels: comparisons.map(c => `${c.years} Years`),
    datasets: [
      {
        label: 'Spend Now',
        data: comparisons.map(c => c.spend),
        backgroundColor: 'rgba(255, 61, 113, 0.6)',
        borderRadius: 6,
        borderSkipped: false,
      },
      {
        label: 'Savings Account (est. 4%)',
        data: comparisons.map(c => c.savings),
        backgroundColor: 'rgba(215, 206, 195, 0.75)',
        borderRadius: 6,
        borderSkipped: false,
      },
      {
        label: 'FD (est. 7%)',
        data: comparisons.map(c => c.fd),
        backgroundColor: 'rgba(217, 119, 6, 0.75)',
        borderRadius: 6,
        borderSkipped: false,
      },
      {
        label: 'SIP/Investment (est. 12%)',
        data: comparisons.map(c => c.sip),
        backgroundColor: '#FC6C26',
        borderRadius: 6,
        borderSkipped: false,
      },
    ],
  }), [comparisons]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: { grid: { display: false }, ticks: { color: '#8E877F', font: { size: 12 } } },
      y: {
        grid: { color: 'rgba(0, 0, 0, 0.04)' },
        ticks: { color: '#8E877F', font: { size: 11 }, callback: v => v >= 100000 ? `₹${(v / 100000).toFixed(1)}L` : `₹${(v / 1000).toFixed(0)}k` },
      },
    },
    plugins: {
      legend: {
        position: 'bottom',
        labels: { color: '#655E57', font: { size: 11, weight: '500' }, usePointStyle: true, pointStyleWidth: 8, padding: 16 },
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
        callbacks: { label: (ctx) => `${ctx.dataset.label}: ₹${ctx.parsed.y.toLocaleString('en-IN')}` },
      },
    },
  };

  return (
    <div>
      <div className="page-header">
        <h2>Spend vs Save vs Invest</h2>
        <p className="subtitle">Compare how an amount could grow under different scenarios</p>
      </div>

      {/* Amount Input */}
      <div className="card mb-3">
        <div className="card-title mb-2">Enter an amount to compare</div>
        <div className="flex items-center gap-2">
          <span style={{ fontSize: 24, fontWeight: 700, fontFamily: "'Space Grotesk'", color: 'var(--accent)' }}>₹</span>
          <input
            className="form-input"
            type="number"
            value={amount}
            onChange={e => setAmount(parseInt(e.target.value) || 0)}
            min="100"
            style={{ maxWidth: 200, fontSize: 22, fontWeight: 700, fontFamily: "'Space Grotesk'" }}
          />
          <div className="btn-group">
            {[1000, 2000, 5000, 10000].map(v => (
              <button key={v} className={`btn btn-sm ${amount === v ? 'btn-primary' : 'btn-outline'}`} onClick={() => setAmount(v)}>
                ₹{v.toLocaleString('en-IN')}
              </button>
            ))}
          </div>
        </div>

        <div className="tabs mt-2">
          {timeframes.map((tf, i) => (
            <button key={i} className={`tab ${activeTab === i ? 'active' : ''}`} onClick={() => setActiveTab(i)}>
              {tf.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '14px 18px', background: '#FFF7EE', border: '1px solid rgba(252, 108, 38, 0.2)', borderRadius: 'var(--radius-md)', marginBottom: 20, fontSize: 14, color: 'var(--text-secondary)' }}>
        💡 You have ₹{amount.toLocaleString('en-IN')}. Here's what could happen depending on how you use it — for your awareness and consideration.
      </div>

      {/* Comparison Cards */}
      {comparisons.map((comp, ci) => (
        <div key={ci} className="mb-3">
          <h3 style={{ fontSize: 16, color: 'var(--text-muted)', marginBottom: 12, fontFamily: "'Space Grotesk'" }}>
            After {comp.years} {comp.years === 1 ? 'Year' : 'Years'}
          </h3>
          <div className="compare-grid">
            <div className="compare-card spend">
              <h4>💸 Spend Now</h4>
              <div className="compare-amount">₹{comp.spend.toLocaleString('en-IN')}</div>
              <div className="compare-label">Amount spent today</div>
              <div style={{ marginTop: 12, fontSize: 12, color: 'var(--text-muted)' }}>
                The item or experience you wanted
              </div>
            </div>

            <div className="compare-card fd">
              <h4>🏦 FD Scenario</h4>
              <div className="compare-amount">₹{comp.fd.toLocaleString('en-IN')}</div>
              <div className="compare-label">Illustrative FD maturity @ 7% p.a.</div>
              <div style={{ marginTop: 12 }}>
                <span className="badge badge-warning">
                  +₹{(comp.fd - comp.spend).toLocaleString('en-IN')} estimated interest
                </span>
              </div>
            </div>

            <div className="compare-card sip">
              <h4>📈 Investment Scenario</h4>
              <div className="compare-amount">₹{comp.sip.toLocaleString('en-IN')}</div>
              <div className="compare-label">Illustrative SIP @ 12% p.a.</div>
              <div style={{ marginTop: 12 }}>
                <span className="badge badge-success">
                  Total invested: ₹{comp.totalInvestedSIP.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Chart */}
      <div className="card mt-3">
        <div className="card-header">
          <div className="card-title"><TrendingUp size={16} /> Visual Comparison</div>
        </div>
        <div className="chart-container" style={{ height: 320 }}>
          <Bar data={chartData} options={chartOptions} />
        </div>
      </div>

      <div className="disclaimer mt-3">
        ⚠️ <strong>Important:</strong> The FD and investment values shown above are illustrative estimates based on assumed rates of return. FD rates vary by bank and tenure. Investment returns (SIP/equity) are not guaranteed and are subject to market risks. These scenarios are provided for financial awareness only — they are not recommendations. Your decision to spend, save, or invest is entirely yours.
      </div>
    </div>
  );
}
