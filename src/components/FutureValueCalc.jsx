import React, { useState, useMemo } from 'react';
import { calculateFutureValue } from '../utils/aiEngine';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement,
  Filler, Tooltip, Legend
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { Calculator } from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

export default function FutureValueCalc() {
  const [initialAmount, setInitialAmount] = useState(10000);
  const [monthlyContribution, setMonthlyContribution] = useState(2000);
  const [annualReturn, setAnnualReturn] = useState(12);
  const [years, setYears] = useState(10);
  const [compounding, setCompounding] = useState('annually'); // 'annually' | 'monthly'

  const result = useMemo(() => calculateFutureValue({
    initialAmount,
    monthlyContribution,
    annualReturn,
    years,
    compounding,
  }), [initialAmount, monthlyContribution, annualReturn, years, compounding]);

  const applyPreset = (preset) => {
    setInitialAmount(preset.initial);
    setMonthlyContribution(preset.monthly);
    setAnnualReturn(preset.rate);
    setYears(preset.years);
    if (preset.compounding) setCompounding(preset.compounding);
  };

  const chartData = useMemo(() => ({
    labels: result.yearlyData.map(d => `Year ${d.year}`),
    datasets: [
      {
        label: 'Total Invested',
        data: result.yearlyData.map(d => d.invested),
        borderColor: '#D97706',
        backgroundColor: 'rgba(217, 119, 6, 0.08)',
        fill: true,
        tension: 0.3,
        pointRadius: 3,
        pointHoverRadius: 6,
      },
      {
        label: 'Illustrative Value',
        data: result.yearlyData.map(d => d.value),
        borderColor: '#FC6C26',
        backgroundColor: 'rgba(252, 108, 38, 0.12)',
        fill: true,
        tension: 0.3,
        pointRadius: 3,
        pointHoverRadius: 6,
      },
    ],
  }), [result]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { intersect: false, mode: 'index' },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#8E877F', font: { size: 11 } } },
      y: {
        grid: { color: 'rgba(0, 0, 0, 0.04)' },
        ticks: {
          color: '#8E877F', font: { size: 11 },
          callback: v => v >= 100000 ? `₹${(v / 100000).toFixed(1)}L` : `₹${(v / 1000).toFixed(0)}k`
        },
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
        <h2>Future Value Calculator</h2>
        <p className="subtitle">Estimate how money grows over time with compound growth</p>
      </div>

      {/* Benchmark Scenarios Bar */}
      <div className="card mb-3">
        <div className="card-title mb-2">🎯 Quick Problem Benchmark Presets</div>
        <div className="flex gap-1" style={{ flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => applyPreset({ initial: 5000, monthly: 0, rate: 10, years: 10, compounding: 'annually' })}
          >
            ⭐ Benchmark: ₹5,000 @ 10% for 10 yrs (₹12,969)
          </button>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => applyPreset({ initial: 5000, monthly: 0, rate: 10, years: 5, compounding: 'annually' })}
          >
            ⏱️ 5 Years: ₹5,000 @ 10% (₹8,053)
          </button>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => applyPreset({ initial: 5000, monthly: 0, rate: 10, years: 20, compounding: 'annually' })}
          >
            🚀 20 Years: ₹5,000 @ 10% (₹33,637)
          </button>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => applyPreset({ initial: 10000, monthly: 2000, rate: 12, years: 10, compounding: 'annually' })}
          >
            💼 Combined: ₹10k + ₹2k/mo @ 12%
          </button>
        </div>
      </div>

      <div className="simulator-grid">
        {/* Inputs */}
        <div className="simulator-panel">
          <div className="card-title mb-2"><Calculator size={16} /> Calculator Inputs</div>

          <div className="form-group">
            <label className="form-label">Initial Amount (₹)</label>
            <input className="form-input" type="number" value={initialAmount} onChange={e => setInitialAmount(Math.max(0, parseInt(e.target.value) || 0))} min="0" step="500" />
            <div className="flex justify-between" style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
              <span>₹0 (Pure SIP)</span>
              <span>₹5,000 (Benchmark)</span>
              <span>₹50,000</span>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Monthly Contribution (₹): ₹{monthlyContribution.toLocaleString('en-IN')}</label>
            <input type="range" min="0" max="50000" step="500" value={monthlyContribution} onChange={e => setMonthlyContribution(parseInt(e.target.value))} style={{ width: '100%', accentColor: '#FC6C26' }} />
            <div className="flex items-center gap-1 mt-1">
              <input className="form-input" type="number" value={monthlyContribution} onChange={e => setMonthlyContribution(Math.max(0, parseInt(e.target.value) || 0))} min="0" style={{ flex: 1 }} />
              {monthlyContribution > 0 && (
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setMonthlyContribution(0)} title="Set to 0 for pure one-time calculation">
                  Clear to 0
                </button>
              )}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Expected Annual Return (%): {annualReturn}%</label>
            <input type="range" min="0" max="25" step="0.5" value={annualReturn} onChange={e => setAnnualReturn(parseFloat(e.target.value))} style={{ width: '100%', accentColor: '#FFF4D6' }} />
            <div className="flex justify-between" style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
              <span>0% (Cash)</span>
              <span>FD ~7%</span>
              <span>Equity ~10-12%</span>
              <span>25%</span>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Time Period: {years} {years === 1 ? 'Year' : 'Years'}</label>
            <input type="range" min="1" max="30" value={years} onChange={e => setYears(parseInt(e.target.value))} style={{ width: '100%', accentColor: '#FC6C26' }} />
            <div className="flex justify-between" style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
              <span>1 year</span>
              <span>5 yrs</span>
              <span>10 yrs</span>
              <span>20 yrs</span>
              <span>30 yrs</span>
            </div>
          </div>

          {/* Explicit Compounding Frequency */}
          <div className="form-group" style={{ paddingTop: 8, borderTop: '1px solid var(--border)' }}>
            <label className="form-label" style={{ marginBottom: 6 }}>Compounding Frequency (Lump-Sum)</label>
            <div className="btn-group" style={{ width: '100%', display: 'flex' }}>
              <button
                type="button"
                className={`btn btn-sm ${compounding === 'annually' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setCompounding('annually')}
                style={{ flex: 1 }}
              >
                Annual: FV = P × (1+r)ⁿ
              </button>
              <button
                type="button"
                className={`btn btn-sm ${compounding === 'monthly' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setCompounding('monthly')}
                style={{ flex: 1 }}
              >
                Monthly: (1 + r/12)¹²ⁿ
              </button>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="simulator-panel">
          <div className="card-title mb-2">📊 Illustrative Results</div>

          <div className="scenario-result">
            <div className="scenario-box">
              <div className="scenario-label">Initial One-Time</div>
              <div className="scenario-value" style={{ fontSize: 18, color: 'var(--text-primary)' }}>₹{initialAmount.toLocaleString('en-IN')}</div>
              <div className="scenario-note">{compounding === 'annually' ? 'Annual compounding' : 'Monthly compounding'}</div>
            </div>
            <div className="scenario-box">
              <div className="scenario-label">Total Monthly Added</div>
              <div className="scenario-value" style={{ fontSize: 18, color: 'var(--primary)' }}>₹{(monthlyContribution * years * 12).toLocaleString('en-IN')}</div>
              <div className="scenario-note">{monthlyContribution > 0 ? `₹${monthlyContribution.toLocaleString('en-IN')}/mo × ${years * 12}m` : 'None (Pure Lump Sum)'}</div>
            </div>
            <div className="scenario-box">
              <div className="scenario-label">Total Invested</div>
              <div className="scenario-value" style={{ fontSize: 18 }}>₹{result.totalInvested.toLocaleString('en-IN')}</div>
              <div className="scenario-note">Principal + Contributions</div>
            </div>
            <div className="scenario-box" style={{ background: 'rgba(5, 150, 105, 0.06)', borderColor: 'rgba(5, 150, 105, 0.2)' }}>
              <div className="scenario-label">Est. Growth</div>
              <div className="scenario-value" style={{ color: 'var(--success)' }}>₹{result.estimatedGrowth.toLocaleString('en-IN')}</div>
              <div className="scenario-note">Illustrative gain</div>
            </div>
          </div>

          {/* Final value highlight */}
          <div style={{
            marginTop: 20, padding: '24px', textAlign: 'center',
            background: 'linear-gradient(135deg, #FFF7F0 0%, #FFF1E3 100%)',
            borderRadius: 'var(--radius-lg)', border: '1px solid rgba(252, 108, 38, 0.25)',
          }}>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>Estimated Future Value</div>
            <div style={{ fontFamily: "'Space Grotesk'", fontSize: 36, fontWeight: 800, color: 'var(--primary)' }}>
              ₹{result.totalValue.toLocaleString('en-IN')}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 8, fontWeight: 500 }}>
              After {years} {years === 1 ? 'year' : 'years'} @ {annualReturn}% p.a. ({compounding === 'annually' ? 'Annual Compounding' : 'Monthly Compounding'})
            </div>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="card mt-3">
        <div className="card-header">
          <div className="card-title">📈 Growth Visualization Over Time</div>
        </div>
        <div className="chart-container" style={{ height: 340 }}>
          <Line data={chartData} options={chartOptions} />
        </div>
      </div>

      <div className="disclaimer mt-3">
        ⚠️ <strong>Important Financial Disclaimer:</strong> This calculator provides illustrative scenarios based on an assumed constant annual return of {annualReturn}% with {compounding === 'annually' ? 'annual' : 'monthly'} compounding. Actual investment returns are not guaranteed, vary with market fluctuations, and may be positive or negative. Past performance does not indicate future results. This tool is designed strictly for financial awareness and opportunity cost education.
      </div>
    </div>
  );
}
