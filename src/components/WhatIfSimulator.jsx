import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { calculateWhatIf } from '../utils/aiEngine';
import { CATEGORIES } from '../utils/demoData';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { GitCompareArrows, Zap, TrendingUp, Calculator } from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const PRESET_SCENARIOS = [
  { label: 'Reduce food spending by ₹1,000/month', amount: 1000, months: 12, icon: '🍕' },
  { label: 'Save ₹2,000 every month', amount: 2000, months: 12, icon: '💰' },
  { label: 'Cut shopping by ₹1,500/month', amount: 1500, months: 12, icon: '🛍️' },
  { label: 'Save ₹5,000/month for 6 months', amount: 5000, months: 6, icon: '🎯' },
  { label: 'Save for laptop — ₹5,000/month × 12', amount: 5000, months: 12, icon: '💻' },
];

export default function WhatIfSimulator() {
  const [amount, setAmount] = useState(2000);
  const [months, setMonths] = useState(12);
  const [annualReturn, setAnnualReturn] = useState(12);
  const [activePreset, setActivePreset] = useState(null);

  const result = useMemo(() => calculateWhatIf({ amount, months, annualReturn }), [amount, months, annualReturn]);

  const handlePreset = (preset, index) => {
    setAmount(preset.amount);
    setMonths(preset.months);
    setActivePreset(index);
  };

  // Chart data
  const chartData = useMemo(() => {
    const periods = [];
    const savedData = [];
    const investedData = [];
    const fdData = [];

    for (let m = 0; m <= months; m += Math.max(1, Math.floor(months / 6))) {
      periods.push(`${m}m`);
      const mResult = calculateWhatIf({ amount, months: m, annualReturn });
      savedData.push(mResult.totalSaved);
      investedData.push(mResult.investedValue);
      fdData.push(mResult.fdValue);
    }

    return {
      labels: periods,
      datasets: [
        {
          label: 'Total Saved',
          data: savedData,
          backgroundColor: 'rgba(215, 206, 195, 0.65)',
          borderRadius: 4,
          borderSkipped: false,
        },
        {
          label: 'Illustrative FD Value',
          data: fdData,
          backgroundColor: 'rgba(217, 119, 6, 0.75)',
          borderRadius: 4,
          borderSkipped: false,
        },
        {
          label: 'Illustrative Investment Value',
          data: investedData,
          backgroundColor: '#FC6C26',
          borderRadius: 4,
          borderSkipped: false,
        },
      ],
    };
  }, [amount, months, annualReturn]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: { grid: { display: false }, ticks: { color: '#8E877F', font: { size: 11 } } },
      y: {
        grid: { color: 'rgba(0, 0, 0, 0.04)' },
        ticks: { color: '#8E877F', font: { size: 11 }, callback: v => `₹${(v/1000).toFixed(0)}k` },
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
        callbacks: {
          label: (ctx) => `${ctx.dataset.label}: ₹${ctx.parsed.y.toLocaleString('en-IN')}`,
        },
      },
    },
  };

  return (
    <div>
      <div className="page-header">
        <div className="flex items-center gap-1">
          <h2>What-If Simulator</h2>
          <span className="ai-badge"><Zap size={12} /> Interactive</span>
        </div>
        <p className="subtitle">Explore how small financial changes could affect your future</p>
      </div>

      {/* Preset Scenarios */}
      <div className="card mb-3">
        <div className="card-title mb-2">⚡ Quick Scenarios</div>
        <div className="flex gap-1" style={{ flexWrap: 'wrap' }}>
          {PRESET_SCENARIOS.map((preset, i) => (
            <button
              key={i}
              className={`btn ${activePreset === i ? 'btn-primary' : 'btn-outline'} btn-sm`}
              onClick={() => handlePreset(preset, i)}
            >
              {preset.icon} {preset.label}
            </button>
          ))}
        </div>
      </div>

      <div className="simulator-grid">
        {/* Input Panel */}
        <div className="simulator-panel">
          <div className="card-title mb-2"><Calculator size={16} /> Configure Scenario</div>

          <div className="form-group">
            <label className="form-label">Monthly Saving / Reduction Amount (₹)</label>
            <input
              className="form-input"
              type="number"
              value={amount}
              onChange={e => { setAmount(parseInt(e.target.value) || 0); setActivePreset(null); }}
              min="100"
              step="500"
            />
            <input
              type="range"
              min="100"
              max="20000"
              step="100"
              value={amount}
              onChange={e => { setAmount(parseInt(e.target.value)); setActivePreset(null); }}
              style={{ width: '100%', marginTop: 8, accentColor: '#FC6C26' }}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Time Period (Months): {months}</label>
            <input
              type="range"
              min="1"
              max="60"
              value={months}
              onChange={e => setMonths(parseInt(e.target.value))}
              style={{ width: '100%', accentColor: '#FC6C26' }}
            />
            <div className="flex justify-between" style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
              <span>1 month</span>
              <span>60 months</span>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Assumed Annual Return (%): {annualReturn}%</label>
            <input
              type="range"
              min="0"
              max="20"
              step="0.5"
              value={annualReturn}
              onChange={e => setAnnualReturn(parseFloat(e.target.value))}
              style={{ width: '100%', accentColor: '#FFF4D6' }}
            />
            <div className="flex justify-between" style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
              <span>0%</span>
              <span>Savings ~4%</span>
              <span>FD ~7%</span>
              <span>Equity ~12-15%</span>
              <span>20%</span>
            </div>
          </div>

          <div className="disclaimer">
            ℹ️ These are illustrative scenarios based on assumed returns. Actual investment returns are not guaranteed and may vary significantly.
          </div>
        </div>

        {/* Results Panel */}
        <div className="simulator-panel">
          <div className="card-title mb-2"><TrendingUp size={16} /> Scenario Results</div>

          <div className="scenario-result">
            <div className="scenario-box">
              <div className="scenario-label">Monthly</div>
              <div className="scenario-value">₹{amount.toLocaleString('en-IN')}</div>
              <div className="scenario-note">per month</div>
            </div>
            <div className="scenario-box">
              <div className="scenario-label">Total Saved</div>
              <div className="scenario-value">₹{result.totalSaved.toLocaleString('en-IN')}</div>
              <div className="scenario-note">in {months} months</div>
            </div>
            <div className="scenario-box" style={{ background: '#FFFDF9', borderColor: 'rgba(217, 119, 6, 0.25)' }}>
              <div className="scenario-label">FD Value (est.)</div>
              <div className="scenario-value" style={{ color: 'var(--accent-dark)' }}>₹{result.fdValue.toLocaleString('en-IN')}</div>
              <div className="scenario-note">@7% p.a. assumed</div>
            </div>
            <div className="scenario-box" style={{ background: 'rgba(5, 150, 105, 0.06)', borderColor: 'rgba(5, 150, 105, 0.2)' }}>
              <div className="scenario-label">Investment (est.)</div>
              <div className="scenario-value" style={{ color: 'var(--success)' }}>₹{result.investedValue.toLocaleString('en-IN')}</div>
              <div className="scenario-note">@{annualReturn}% p.a. assumed</div>
            </div>
          </div>

          {result.estimatedGrowth > 0 && (
            <div style={{
              marginTop: 16, padding: '14px 18px', background: '#FFF7F0',
              borderRadius: 'var(--radius-md)', border: '1px solid rgba(252,108,38,0.2)'
            }}>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                💡 By saving ₹{amount.toLocaleString('en-IN')}/month for {months} months, your total saved amount of ₹{result.totalSaved.toLocaleString('en-IN')} could illustratively grow to ₹{result.investedValue.toLocaleString('en-IN')} — an estimated gain of <span style={{ color: 'var(--success)', fontWeight: 600 }}>₹{result.estimatedGrowth.toLocaleString('en-IN')}</span> under the assumed {annualReturn}% annual return.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Chart */}
      <div className="card mt-3">
        <div className="card-header">
          <div className="card-title">📈 Growth Over Time</div>
        </div>
        <div className="chart-container" style={{ height: 300 }}>
          <Bar data={chartData} options={chartOptions} />
        </div>
      </div>
    </div>
  );
}
