/**
 * Financial Calculation Engine for NexWorth
 * Provides verified mathematical formulas for:
 * 1. One-time (lump-sum) compound growth: FV = P * (1 + r)^n
 * 2. Recurring monthly investments (SIP / Annuity Due)
 * 3. Recurring fixed deposits (RD)
 * 4. Purchase opportunity cost comparison (Buy Now vs Invest)
 *
 * All formulas strictly validate boundaries (negative, zero, large, decimal values)
 * and make compounding frequency explicit.
 */

/**
 * Calculates Future Value of a one-time investment.
 * Formula (Annual compounding): FV = P * (1 + r)^n
 * Formula (Monthly compounding): FV = P * (1 + r/12)^(12 * n)
 *
 * @param {Object} params
 * @param {number} params.principal - Initial amount (P)
 * @param {number} params.annualRate - Annual return percentage (e.g. 10 for 10%)
 * @param {number} params.years - Duration in years (n)
 * @param {'annually'|'monthly'} [params.compounding='annually'] - Compounding frequency
 * @returns {Object} { principal, futureValue, estimatedGrowth, yearlyData }
 */
export function calculateLumpSumFV({
  principal = 0,
  annualRate = 0,
  years = 0,
  compounding = 'annually',
}) {
  const p = Math.max(0, Math.min(1e12, Number(principal) || 0));
  const r = Math.max(0, Math.min(100, Number(annualRate) || 0)) / 100;
  const n = Math.max(0, Math.min(100, Number(years) || 0));

  if (p === 0 || n === 0) {
    return {
      principal: p,
      futureValue: p,
      estimatedGrowth: 0,
      yearlyData: [{ year: 0, invested: p, value: p }],
    };
  }

  let futureValueExact = p;
  if (r > 0) {
    if (compounding === 'monthly') {
      const monthlyRate = r / 12;
      futureValueExact = p * Math.pow(1 + monthlyRate, n * 12);
    } else {
      // Standard annual compounding: FV = P * (1 + r)^n
      futureValueExact = p * Math.pow(1 + r, n);
    }
  }

  const futureValue = Math.round(futureValueExact);
  const estimatedGrowth = Math.max(0, futureValue - p);

  // Generate progression timeline for charts
  const yearlyData = [];
  const fullYears = Math.floor(n);
  for (let y = 0; y <= fullYears; y++) {
    let val = p;
    if (r > 0) {
      if (compounding === 'monthly') {
        val = p * Math.pow(1 + r / 12, y * 12);
      } else {
        val = p * Math.pow(1 + r, y);
      }
    }
    yearlyData.push({
      year: y,
      invested: p,
      value: Math.round(val),
    });
  }

  return {
    principal: p,
    futureValue,
    futureValueExact,
    estimatedGrowth,
    compounding,
    yearlyData,
  };
}

/**
 * Calculates Future Value of recurring monthly contributions (SIP / Annuity Due).
 * Deposits made at the start of each month.
 * Formula: M * [((1 + i)^N - 1) / i] * (1 + i), where i = r / 12, N = months
 *
 * @param {Object} params
 * @param {number} params.monthlyContribution - Amount deposited each month (M)
 * @param {number} params.annualRate - Annual return percentage (e.g. 12 for 12%)
 * @param {number} params.months - Duration in months (N)
 * @returns {Object} { totalInvested, futureValue, estimatedGrowth }
 */
export function calculateSIPFutureValue({
  monthlyContribution = 0,
  annualRate = 0,
  months = 0,
}) {
  const m = Math.max(0, Math.min(1e10, Number(monthlyContribution) || 0));
  const r = Math.max(0, Math.min(100, Number(annualRate) || 0)) / 100;
  const totalMonths = Math.max(0, Math.min(1200, Math.round(Number(months) || 0)));

  const totalInvested = m * totalMonths;
  if (m === 0 || totalMonths === 0) {
    return { totalInvested: 0, futureValue: 0, estimatedGrowth: 0 };
  }

  const monthlyRate = r / 12;
  let futureValueExact = totalInvested;

  if (monthlyRate > 0) {
    futureValueExact =
      m * ((Math.pow(1 + monthlyRate, totalMonths) - 1) / monthlyRate) * (1 + monthlyRate);
  }

  const futureValue = Math.round(futureValueExact);
  const estimatedGrowth = Math.max(0, futureValue - totalInvested);

  return {
    totalInvested,
    futureValue,
    futureValueExact,
    estimatedGrowth,
  };
}

/**
 * Combines initial lump-sum and recurring monthly contributions over a multi-year horizon.
 * Used by the Future Value Calculator.
 *
 * @param {Object} params
 * @param {number} params.initialAmount - Initial one-time principal
 * @param {number} params.monthlyContribution - Monthly recurring contribution
 * @param {number} params.annualReturn - Expected annual return (%)
 * @param {number} params.years - Investment horizon in years
 * @param {'annually'|'monthly'} [params.compounding='annually'] - Lump-sum compounding basis
 * @returns {Object} { initialAmount, totalInvested, totalValue, estimatedGrowth, yearlyData }
 */
export function calculateCombinedFutureValue({
  initialAmount = 0,
  monthlyContribution = 0,
  annualReturn = 0,
  years = 1,
  compounding = 'annually',
}) {
  const p = Math.max(0, Math.min(1e12, Number(initialAmount) || 0));
  const m = Math.max(0, Math.min(1e10, Number(monthlyContribution) || 0));
  const r = Math.max(0, Math.min(100, Number(annualReturn) || 0));
  const n = Math.max(1, Math.min(100, Math.round(Number(years) || 1)));

  const totalMonths = n * 12;
  const totalInvested = p + m * totalMonths;

  // 1. Initial lump sum growth
  const lumpSumRes = calculateLumpSumFV({
    principal: p,
    annualRate: r,
    years: n,
    compounding,
  });

  // 2. Monthly contributions growth
  const sipRes = calculateSIPFutureValue({
    monthlyContribution: m,
    annualRate: r,
    months: totalMonths,
  });

  const totalValue = lumpSumRes.futureValue + sipRes.futureValue;
  const estimatedGrowth = Math.max(0, totalValue - totalInvested);

  // Generate progression timeline for chart
  const yearlyData = [];
  for (let y = 0; y <= n; y++) {
    const monthsElapsed = y * 12;
    const investedSoFar = p + m * monthsElapsed;

    const lumpSoFar = calculateLumpSumFV({
      principal: p,
      annualRate: r,
      years: y,
      compounding,
    }).futureValue;

    const sipSoFar = calculateSIPFutureValue({
      monthlyContribution: m,
      annualRate: r,
      months: monthsElapsed,
    }).futureValue;

    yearlyData.push({
      year: y,
      invested: investedSoFar,
      value: lumpSoFar + sipSoFar,
    });
  }

  return {
    initialAmount: p,
    monthlyContribution: m,
    totalInvested,
    totalValue,
    estimatedGrowth,
    compounding,
    yearlyData,
  };
}

/**
 * Buy Now vs Invest Comparison Engine.
 * Compares spending an amount today against investing that SAME amount ONCE across multiple time periods.
 * Optionally supports recurring spending habit comparison if isRecurring is enabled.
 *
 * @param {Object} params
 * @param {number} params.amount - Purchase amount (e.g. 5000)
 * @param {number[]} [params.yearsList=[5, 10, 20]] - Periods to compare
 * @param {boolean} [params.isRecurring=false] - Whether amount is spent every month (habit) vs once (purchase)
 * @param {number} [params.savingsRate=4.0] - Savings account annual interest (%)
 * @param {number} [params.fdRate=7.0] - Fixed deposit annual interest (%)
 * @param {number} [params.equityRate=12.0] - Equity / index annual return (%)
 * @returns {Array<Object>} Comparison data for each time horizon
 */
export function compareBuyNowVsInvest({
  amount = 5000,
  yearsList = [5, 10, 20],
  isRecurring = false,
  savingsRate = 4.0,
  fdRate = 7.0,
  equityRate = 12.0,
}) {
  const p = Math.max(0, Math.min(1e10, Number(amount) || 0));

  return yearsList.map(y => {
    const years = Math.max(1, Number(y) || 1);

    if (!isRecurring) {
      // ONE-TIME PURCHASE: Compare spending P today vs investing P once
      const spend = p;
      const savings = calculateLumpSumFV({ principal: p, annualRate: savingsRate, years, compounding: 'annually' }).futureValue;
      const fd = calculateLumpSumFV({ principal: p, annualRate: fdRate, years, compounding: 'annually' }).futureValue;
      const equity = calculateLumpSumFV({ principal: p, annualRate: equityRate, years, compounding: 'annually' }).futureValue;

      return {
        years,
        isRecurring: false,
        spend,
        savings,
        fd,
        equity,
        totalInvested: p,
        potentialDifference: equity - spend,
        savingsGain: savings - spend,
        fdGain: fd - spend,
        equityGain: equity - spend,
      };
    } else {
      // RECURRING HABIT: Compare spending P every month vs investing P every month
      const totalMonths = years * 12;
      const spend = p * totalMonths;
      const savings = calculateSIPFutureValue({ monthlyContribution: p, annualRate: savingsRate, months: totalMonths }).futureValue;
      const fd = calculateSIPFutureValue({ monthlyContribution: p, annualRate: fdRate, months: totalMonths }).futureValue;
      const equity = calculateSIPFutureValue({ monthlyContribution: p, annualRate: equityRate, months: totalMonths }).futureValue;

      return {
        years,
        isRecurring: true,
        spend,
        savings,
        fd,
        equity,
        totalInvested: spend,
        potentialDifference: equity - spend,
        savingsGain: savings - spend,
        fdGain: fd - spend,
        equityGain: equity - spend,
      };
    }
  });
}

/**
 * What-If Recurring Monthly Savings Simulator.
 * Uses consistent recurring contribution timeline across all instruments:
 * - Cash: total saved with 0% interest
 * - Fixed Income (RD): Recurring Deposit at 7.0% p.a.
 * - Investment (SIP): Monthly SIP at user-configured rate (e.g. 12% p.a.)
 *
 * @param {Object} params
 * @param {number} params.amount - Monthly savings amount
 * @param {number} params.months - Duration in months
 * @param {number} params.annualReturn - Expected investment return (%)
 * @param {number} [params.fdRate=7.0] - Fixed income rate (%)
 * @returns {Object}
 */
export function calculateWhatIfSavings({
  amount = 2000,
  months = 12,
  annualReturn = 12,
  fdRate = 7.0,
}) {
  const m = Math.max(0, Math.min(1e10, Number(amount) || 0));
  const rawMonths = Number(months);
  const totalMonths = isNaN(rawMonths) ? 12 : Math.max(0, Math.min(1200, Math.round(rawMonths)));
  const userRate = Math.max(0, Math.min(100, Number(annualReturn) || 0));

  const totalSaved = m * totalMonths;

  // Recurring deposit for fixed income (consistent monthly deposit schedule)
  const fdRes = calculateSIPFutureValue({
    monthlyContribution: m,
    annualRate: fdRate,
    months: totalMonths,
  });

  // Recurring investment for equity / user rate
  const investRes = calculateSIPFutureValue({
    monthlyContribution: m,
    annualRate: userRate,
    months: totalMonths,
  });

  return {
    monthlySaving: m,
    months: totalMonths,
    totalSaved,
    fdValue: fdRes.futureValue,
    fdGrowth: fdRes.estimatedGrowth,
    investedValue: investRes.futureValue,
    estimatedGrowth: investRes.estimatedGrowth,
    annualReturn: userRate,
    fdRate,
  };
}
