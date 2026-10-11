import { describe, it, expect } from 'vitest';
import {
  calculateLumpSumFV,
  calculateSIPFutureValue,
  calculateCombinedFutureValue,
  compareBuyNowVsInvest,
  calculateWhatIfSavings,
} from './financialCalculations';
import { compareSpendSaveInvest } from './aiEngine';

describe('Financial Calculations - Lump Sum Compound Growth', () => {
  it('matches prompt benchmark: ₹5,000 at 10% for 5 years ≈ ₹8,053', () => {
    const res = calculateLumpSumFV({ principal: 5000, annualRate: 10, years: 5, compounding: 'annually' });
    // Exact: 5000 * (1.10)^5 = 8052.55
    expect(res.futureValue).toBe(8053);
    expect(res.futureValueExact).toBeCloseTo(8052.55, 2);
    expect(res.estimatedGrowth).toBe(3053);
  });

  it('matches prompt benchmark: ₹5,000 at 10% for 10 years ≈ ₹12,969', () => {
    const res = calculateLumpSumFV({ principal: 5000, annualRate: 10, years: 10, compounding: 'annually' });
    // Exact: 5000 * (1.10)^10 = 12968.7123...
    expect(res.futureValue).toBe(12969);
    expect(res.futureValueExact).toBeCloseTo(12968.71, 2);
    expect(res.estimatedGrowth).toBe(7969);
  });

  it('matches prompt benchmark: ₹5,000 at 10% for 20 years ≈ ₹33,637', () => {
    const res = calculateLumpSumFV({ principal: 5000, annualRate: 10, years: 20, compounding: 'annually' });
    // Exact: 5000 * (1.10)^20 = 33637.4999...
    expect(res.futureValue).toBe(33637);
    expect(res.futureValueExact).toBeCloseTo(33637.50, 2);
    expect(res.estimatedGrowth).toBe(28637);
  });

  it('handles zero annual return: FV equals principal', () => {
    const res = calculateLumpSumFV({ principal: 5000, annualRate: 0, years: 10 });
    expect(res.futureValue).toBe(5000);
    expect(res.estimatedGrowth).toBe(0);
  });

  it('handles zero years: FV equals principal', () => {
    const res = calculateLumpSumFV({ principal: 5000, annualRate: 12, years: 0 });
    expect(res.futureValue).toBe(5000);
    expect(res.estimatedGrowth).toBe(0);
  });

  it('handles zero principal: FV is 0', () => {
    const res = calculateLumpSumFV({ principal: 0, annualRate: 12, years: 10 });
    expect(res.futureValue).toBe(0);
    expect(res.estimatedGrowth).toBe(0);
  });

  it('sanitizes negative inputs to non-negative values', () => {
    const res = calculateLumpSumFV({ principal: -5000, annualRate: -10, years: -5 });
    expect(res.principal).toBe(0);
    expect(res.futureValue).toBe(0);
    expect(res.estimatedGrowth).toBe(0);
  });

  it('handles decimal values accurately', () => {
    const res = calculateLumpSumFV({ principal: 5000.50, annualRate: 10.5, years: 3 });
    // 5000.50 * (1.105)^3 = 6746.88
    expect(res.futureValue).toBe(6747);
  });

  it('handles very large amounts within numerical boundaries', () => {
    const res = calculateLumpSumFV({ principal: 10000000, annualRate: 12, years: 10 });
    expect(res.futureValue).toBe(31058482);
    expect(Number.isFinite(res.futureValue)).toBe(true);
  });

  it('differentiates between annual and monthly compounding explicitly', () => {
    const annualRes = calculateLumpSumFV({ principal: 5000, annualRate: 10, years: 10, compounding: 'annually' });
    const monthlyRes = calculateLumpSumFV({ principal: 5000, annualRate: 10, years: 10, compounding: 'monthly' });
    // Annual: 5000 * 1.10^10 = 12969
    // Monthly: 5000 * (1 + 0.10/12)^120 = 13535
    expect(annualRes.futureValue).toBe(12969);
    expect(monthlyRes.futureValue).toBe(13535);
    expect(monthlyRes.futureValue).toBeGreaterThan(annualRes.futureValue);
  });
});

describe('Financial Calculations - Buy Now vs Invest', () => {
  it('correctly compares one-time purchase against investing that same amount ONCE', () => {
    const comparison = compareBuyNowVsInvest({
      amount: 5000,
      yearsList: [5, 10, 20],
      isRecurring: false,
      savingsRate: 4.0,
      fdRate: 7.0,
      equityRate: 12.0,
    });

    expect(comparison).toHaveLength(3);

    // 10 Years Horizon Check
    const tenYear = comparison.find(c => c.years === 10);
    expect(tenYear).toBeDefined();
    // One-time purchase cost is exactly ₹5,000 (NOT ₹6,00,000!)
    expect(tenYear.spend).toBe(5000);
    expect(tenYear.totalInvested).toBe(5000);

    // Savings @ 4%: 5000 * (1.04)^10 = 7401
    expect(tenYear.savings).toBe(7401);

    // FD @ 7%: 5000 * (1.07)^10 = 9836
    expect(tenYear.fd).toBe(9836);

    // Equity @ 12%: 5000 * (1.12)^10 = 15529
    expect(tenYear.equity).toBe(15529);

    // Monotonic progression: Spend <= Savings < FD < Equity
    expect(tenYear.equity).toBeGreaterThan(tenYear.fd);
    expect(tenYear.fd).toBeGreaterThan(tenYear.savings);
    expect(tenYear.savings).toBeGreaterThan(tenYear.spend);

    // Potential difference communicates growth above purchase
    expect(tenYear.potentialDifference).toBe(15529 - 5000);
  });

  it('supports recurring habit mode when explicitly selected', () => {
    const comparison = compareBuyNowVsInvest({
      amount: 500,
      yearsList: [1, 5],
      isRecurring: true,
      savingsRate: 4.0,
      fdRate: 7.0,
      equityRate: 12.0,
    });

    const oneYear = comparison.find(c => c.years === 1);
    expect(oneYear.spend).toBe(6000); // 500 * 12 months
    expect(oneYear.totalInvested).toBe(6000);
    expect(oneYear.equity).toBeGreaterThan(oneYear.spend);
  });
});

describe('Financial Calculations - What-If Simulator Consistency', () => {
  it('maintains consistent recurring contribution timing so 12% equity strictly beats 7% FD', () => {
    const res = calculateWhatIfSavings({
      amount: 2000,
      months: 12,
      annualReturn: 12,
      fdRate: 7.0,
    });

    // Total cash saved (0%): ₹24,000
    expect(res.totalSaved).toBe(24000);

    // 7% RD monthly contribution over 12m: ₹24,930 (exact: 24,929.58)
    expect(res.fdValue).toBe(24930);
    expect(res.fdGrowth).toBe(930);

    // 12% SIP monthly contribution over 12m: ₹25,619 (exact: 25,618.65)
    expect(res.investedValue).toBe(25619);
    expect(res.estimatedGrowth).toBe(1619);

    // Strict validation: Equity (12%) > FD (7%) > Cash (0%)
    expect(res.investedValue).toBeGreaterThan(res.fdValue);
    expect(res.fdValue).toBeGreaterThan(res.totalSaved);
  });

  it('handles boundary of zero months or zero amount gracefully', () => {
    const resZero = calculateWhatIfSavings({ amount: 0, months: 12, annualReturn: 12 });
    expect(resZero.totalSaved).toBe(0);
    expect(resZero.investedValue).toBe(0);

    const resZeroMonths = calculateWhatIfSavings({ amount: 2000, months: 0, annualReturn: 12 });
    expect(resZeroMonths.months).toBe(0);
    expect(resZeroMonths.totalSaved).toBe(0);
    expect(resZeroMonths.investedValue).toBe(0);
  });
});

describe('Financial Calculations - Combined Future Value Calculator', () => {
  it('calculates combined lump sum + recurring contributions correctly', () => {
    const res = calculateCombinedFutureValue({
      initialAmount: 10000,
      monthlyContribution: 2000,
      annualReturn: 12,
      years: 10,
      compounding: 'annually',
    });

    // Initial lump sum: 10,000 * 1.12^10 = 31,058
    // SIP: 2,000/mo for 120m @ 12% = 464,678
    // Total invested: 10,000 + 2,000 * 120 = 250,000
    expect(res.totalInvested).toBe(250000);
    expect(res.totalValue).toBe(31058 + 464678);
    expect(res.yearlyData).toHaveLength(11); // Year 0 to Year 10
  });

  it('handles pure lump sum when monthlyContribution is 0', () => {
    const res = calculateCombinedFutureValue({
      initialAmount: 5000,
      monthlyContribution: 0,
      annualReturn: 10,
      years: 10,
      compounding: 'annually',
    });

    expect(res.totalInvested).toBe(5000);
    expect(res.totalValue).toBe(12969); // Exact match with prompt requirement
    expect(res.estimatedGrowth).toBe(7969);
  });

  it('verifies compareSpendSaveInvest outputs valid defined numbers for all metrics', () => {
    const results = compareSpendSaveInvest(5000, [1, 3, 5], false);
    expect(results).toHaveLength(3);
    results.forEach(r => {
      expect(typeof r.spend).toBe('number');
      expect(typeof r.savings).toBe('number');
      expect(typeof r.fd).toBe('number');
      expect(typeof r.sip).toBe('number');
      expect(r.spend).toBeGreaterThan(0);
      expect(r.sip).toBeGreaterThan(r.fd);
    });
  });
});
