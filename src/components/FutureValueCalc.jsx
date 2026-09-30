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

  const result = useMemo(() => calculateFutureValue({ initialAmount, monthlyContribution, annualReturn, years }), [initialAmount, monthlyContribution, annualReturn, years]);

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
        <p className="subtitle">Estimate how your money could grow over time with compounding</p>
      </div>

      <div className="simulator-grid">
        {/* Inputs */}
        <div className="simulator-panel">
          <div className="card-title mb-2"><Calculator size={16} /> Calculator Inputs</div>

          <div className="form-group">
            <label className="form-label">Initial Amount (₹)</label>
            <input className="form-input" type="number" value={initialAmount} onChange={e => setInitialAmount(parseInt(e.target.value) || 0)} min="0" step="1000" />
          </div>

          <div className="form-group">
            <label className="form-label">Monthly Contribution (₹): ₹{monthlyContribution.toLocaleString('en-IN')}</label>
            <input type="range" min="0" max="50000" step="500" value={monthlyContribution} onChange={e => setMonthlyContribution(parseInt(e.target.value))} style={{ width: '100%', accentColor: '#FC6C26' }} />
            <input className="form-input mt-1" type="number" value={monthlyContribution} onChange={e => setMonthlyContribution(parseInt(e.target.value) || 0)} min="0" />
          </div>

          <div className="form-group">
            <label className="form-label">Expected Annual Return (%): {annualReturn}%</label>
            <input type="range" min="0" max="25" step="0.5" value={annualReturn} onChange={e => setAnnualReturn(parseFloat(e.target.value))} style={{ width: '100%', accentColor: '#FFF4D6' }} />
            <div className="flex justify-between" style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
              <span>0%</span>
              <span>FD ~7%</span>
              <span>Equity ~12%</span>
              <span>25%</span>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Time Period: {years} {years === 1 ? 'Year' : 'Years'}</label>
            <input type="range" min="1" max="30" value={years} onChange={e => setYears(parseInt(e.target.value))} style={{ width: '100%', accentColor: '#FC6C26' }} />
            <div className="flex justify-between" style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
              <span>1 year</span>
              <span>30 years</span>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="simulator-panel">
          <div className="card-title mb-2">📊 Illustrative Results</div>

          <div className="scenario-result">
            <div className="scenario-box">
              <div className="scenario-label">Initial Amount</div>
              <div className="scenario-value" style={{ fontSize: 18, color: 'var(--text-primary)' }}>₹{initialAmount.toLocaleString('en-IN')}</div>
            </div>
            <div className="scenario-box">
              <div className="scenario-label">Total Contributions</div>
              <div className="scenario-value" style={{ fontSize: 18, color: 'var(--primary)' }}>₹{(monthlyContribution * years * 12).toLocaleString('en-IN')}</div>
            </div>
            <div className="scenario-box">
              <div className="scenario-label">Total Invested</div>
              <div className="scenario-value" style={{ fontSize: 18 }}>₹{result.totalInvested.toLocaleString('en-IN')}</div>
            </div>
            <div className="scenario-box" style={{ background: 'rgba(5, 150, 105, 0.06)', borderColor: 'rgba(5, 150, 105, 0.2)' }}>
              <div className="scenario-label">Est. Growth</div>
              <div className="scenario-value" style={{ color: 'var(--success)' }}>₹{result.estimatedGrowth.toLocaleString('en-IN')}</div>
              <div className="scenario-note">Illustrative</div>
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
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 8 }}>
              After {years} years @ {annualReturn}% p.a. (assumed)
            </div>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="card mt-3">
        <div className="card-header">
          <div className="card-title">📈 Growth Visualization</div>
        </div>
        <div className="chart-container" style={{ height: 340 }}>
          <Line data={chartData} options={chartOptions} />
        </div>
      </div>

      <div className="disclaimer mt-3">
        ⚠️ This calculator provides illustrative estimates based on assumed constant annual returns with monthly compounding. Actual investment returns are not guaranteed and may vary. Past performance does not indicate future results. This tool is for financial awareness only.
      </div>
    </div>
  );
}
