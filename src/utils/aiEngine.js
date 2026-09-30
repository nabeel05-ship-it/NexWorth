// AI Engine for NexWorth - Generates insights, forecasts, and analysis
import { CATEGORIES, MONTH_NAMES } from './demoData';

function getCategoryName(catId) {
  const cat = CATEGORIES.find(c => c.id === catId);
  return cat ? cat.name : catId;
}

function getMonthExpenses(expenses, monthOffset = 0) {
  const now = new Date();
  const targetMonth = new Date(now.getFullYear(), now.getMonth() - monthOffset, 1);
  const nextMonth = new Date(now.getFullYear(), now.getMonth() - monthOffset + 1, 1);

  return expenses.filter(e => {
    const d = new Date(e.date);
    return d >= targetMonth && d < nextMonth;
  });
}

function getCategoryTotals(expenseList) {
  const totals = {};
  expenseList.forEach(e => {
    totals[e.category] = (totals[e.category] || 0) + e.amount;
  });
  return totals;
}

function getCategoryCounts(expenseList) {
  const counts = {};
  expenseList.forEach(e => {
    counts[e.category] = (counts[e.category] || 0) + 1;
  });
  return counts;
}

export function getMonthlyOverview(expenses, income) {
  const current = getMonthExpenses(expenses, 0);
  const previous = getMonthExpenses(expenses, 1);

  const currentTotal = current.reduce((s, e) => s + e.amount, 0);
  const previousTotal = previous.reduce((s, e) => s + e.amount, 0);

  const currentCategories = getCategoryTotals(current);
  const previousCategories = getCategoryTotals(previous);

  const savings = income - currentTotal;
  const savingsRate = income > 0 ? ((savings / income) * 100).toFixed(1) : 0;

  // Find top category
  let topCategory = '';
  let topAmount = 0;
  Object.entries(currentCategories).forEach(([cat, amount]) => {
    if (amount > topAmount) {
      topAmount = amount;
      topCategory = cat;
    }
  });

  // Find biggest change
  let biggestIncrease = { category: '', percentage: 0 };
  Object.entries(currentCategories).forEach(([cat, amount]) => {
    const prev = previousCategories[cat] || 0;
    if (prev > 0) {
      const change = ((amount - prev) / prev) * 100;
      if (change > biggestIncrease.percentage) {
        biggestIncrease = { category: cat, percentage: Math.round(change) };
      }
    }
  });

  return {
    currentTotal,
    previousTotal,
    savings,
    savingsRate,
    topCategory,
    topAmount,
    biggestIncrease,
    currentCategories,
    previousCategories,
    transactionCount: current.length,
    categoryCount: Object.keys(currentCategories).length,
  };
}

export function generateInsights(expenses, income, budgets) {
  const insights = [];
  const overview = getMonthlyOverview(expenses, income);
  const current = getMonthExpenses(expenses, 0);
  const currentCategoryCounts = getCategoryCounts(current);

  // Monthly summary
  insights.push({
    type: 'summary',
    icon: '📊',
    title: 'Monthly Summary',
    text: `This month you spent ₹${overview.currentTotal.toLocaleString('en-IN')} across ${overview.transactionCount} transactions in ${overview.categoryCount} categories.`,
    priority: 1,
  });

  // Savings insight
  if (overview.savings > 0) {
    insights.push({
      type: 'positive',
      icon: '💰',
      title: 'Savings Status',
      text: `You have ₹${overview.savings.toLocaleString('en-IN')} remaining this month (${overview.savingsRate}% savings rate). ${parseFloat(overview.savingsRate) >= 20 ? 'Great job maintaining a healthy savings rate!' : 'Consider looking at ways to increase your savings.'}`,
      priority: 2,
    });
  } else {
    insights.push({
      type: 'warning',
      icon: '⚠️',
      title: 'Over Budget',
      text: `Your expenses have exceeded your income by ₹${Math.abs(overview.savings).toLocaleString('en-IN')}. Review your spending to identify areas you can adjust.`,
      priority: 1,
    });
  }

  // Top expense category
  if (overview.topCategory) {
    insights.push({
      type: 'info',
      icon: '📈',
      title: 'Top Expense Category',
      text: `${getCategoryName(overview.topCategory)} is your largest expense category at ₹${overview.topAmount.toLocaleString('en-IN')}, with ${currentCategoryCounts[overview.topCategory] || 0} transactions this month.`,
      priority: 3,
    });
  }

  // Spending trend
  if (overview.previousTotal > 0) {
    const change = ((overview.currentTotal - overview.previousTotal) / overview.previousTotal * 100).toFixed(1);
    if (change > 5) {
      insights.push({
        type: 'warning',
        icon: '📊',
        title: 'Spending Trend',
        text: `Your overall spending increased by ${change}% compared with last month (₹${overview.previousTotal.toLocaleString('en-IN')} → ₹${overview.currentTotal.toLocaleString('en-IN')}).`,
        priority: 2,
      });
    } else if (change < -5) {
      insights.push({
        type: 'positive',
        icon: '✅',
        title: 'Spending Trend',
        text: `Your overall spending decreased by ${Math.abs(change)}% compared with last month. You're spending more carefully.`,
        priority: 2,
      });
    }
  }

  // Category increase alerts
  if (overview.biggestIncrease.percentage > 15) {
    insights.push({
      type: 'alert',
      icon: '🔔',
      title: `${getCategoryName(overview.biggestIncrease.category)} Spending Alert`,
      text: `Your ${getCategoryName(overview.biggestIncrease.category)} spending increased by ${overview.biggestIncrease.percentage}% compared with last month.`,
      priority: 2,
    });
  }

  // Budget warnings
  if (budgets) {
    Object.entries(overview.currentCategories).forEach(([cat, amount]) => {
      const budget = budgets[cat];
      if (budget) {
        const usage = (amount / budget) * 100;
        if (usage >= 90 && usage < 100) {
          insights.push({
            type: 'warning',
            icon: '⚡',
            title: `${getCategoryName(cat)} Budget`,
            text: `Your ${getCategoryName(cat)} budget is ${Math.round(usage)}% used (₹${amount.toLocaleString('en-IN')} of ₹${budget.toLocaleString('en-IN')}). You have ₹${(budget - amount).toLocaleString('en-IN')} remaining.`,
            priority: 2,
          });
        } else if (usage >= 100) {
          insights.push({
            type: 'alert',
            icon: '🚨',
            title: `${getCategoryName(cat)} Over Budget`,
            text: `You've exceeded your ${getCategoryName(cat)} budget by ₹${(amount - budget).toLocaleString('en-IN')} (${Math.round(usage)}% used).`,
            priority: 1,
          });
        }
      }
    });
  }

  return insights.sort((a, b) => a.priority - b.priority);
}

export function generateExpenseStory(expenses, income, budgets) {
  const overview = getMonthlyOverview(expenses, income);
  const now = new Date();
  const monthName = MONTH_NAMES[now.getMonth()];

  let story = `In ${monthName}, you spent a total of ₹${overview.currentTotal.toLocaleString('en-IN')}. `;

  if (overview.topCategory) {
    story += `Your largest spending category was ${getCategoryName(overview.topCategory)} at ₹${overview.topAmount.toLocaleString('en-IN')}. `;
  }

  if (overview.previousTotal > 0) {
    const change = ((overview.currentTotal - overview.previousTotal) / overview.previousTotal * 100).toFixed(0);
    if (change > 0) {
      story += `Overall spending increased by ${change}% compared with the previous month. `;
    } else if (change < 0) {
      story += `Overall spending decreased by ${Math.abs(change)}% compared with the previous month — well done! `;
    }
  }

  if (overview.biggestIncrease.percentage > 15) {
    story += `${getCategoryName(overview.biggestIncrease.category)} saw the biggest increase at ${overview.biggestIncrease.percentage}%. `;
  }

  story += `You have ₹${Math.max(0, overview.savings).toLocaleString('en-IN')} remaining after expenses`;

  if (budgets) {
    const budgetRemaining = Object.entries(overview.currentCategories).reduce((total, [cat, amount]) => {
      const budget = budgets[cat] || 0;
      return total + Math.max(0, budget - amount);
    }, 0);
    if (budgetRemaining > 0) {
      story += `, with approximately ₹${budgetRemaining.toLocaleString('en-IN')} of budget allocation still available`;
    }
  }
  story += '.';

  return story;
}

export function getSpendingForecast(expenses) {
  const months = [];
  for (let i = 2; i >= 0; i--) {
    const monthExpenses = getMonthExpenses(expenses, i);
    const total = monthExpenses.reduce((s, e) => s + e.amount, 0);
    months.push(total);
  }

  // Simple linear regression for forecast
  const n = months.length;
  const avg = months.reduce((s, v) => s + v, 0) / n;

  // Weighted recent trend
  const trend = months.length >= 2 ? (months[months.length - 1] - months[0]) / (months.length - 1) : 0;

  const forecast1 = Math.max(0, Math.round(months[months.length - 1] + trend * 0.6));
  const forecast2 = Math.max(0, Math.round(forecast1 + trend * 0.4));
  const forecast3 = Math.max(0, Math.round(forecast2 + trend * 0.3));

  return {
    historical: months,
    forecasted: [forecast1, forecast2, forecast3],
    trend: trend > 0 ? 'increasing' : trend < 0 ? 'decreasing' : 'stable',
    trendAmount: Math.abs(Math.round(trend)),
  };
}

export function calculateWhatIf(scenario) {
  const { type, amount, months = 12, annualReturn = 12 } = scenario;
  const monthlyReturn = annualReturn / 100 / 12;

  const results = {
    monthlySaving: amount,
    totalSaved: amount * months,
    months,
  };

  // SIP-style future value
  if (monthlyReturn > 0) {
    results.investedValue = Math.round(
      amount * ((Math.pow(1 + monthlyReturn, months) - 1) / monthlyReturn) * (1 + monthlyReturn)
    );
  } else {
    results.investedValue = amount * months;
  }

  results.estimatedGrowth = results.investedValue - results.totalSaved;

  // FD scenario (annual compounding)
  const fdRate = 7.0; // Assumed FD rate
  results.fdValue = Math.round(results.totalSaved * Math.pow(1 + fdRate / 100, months / 12));

  return results;
}

export function calculateFutureValue({ initialAmount, monthlyContribution, annualReturn, years }) {
  const monthlyReturn = annualReturn / 100 / 12;
  const months = years * 12;

  // Future value of initial amount
  const fvInitial = initialAmount * Math.pow(1 + monthlyReturn, months);

  // Future value of monthly contributions (annuity)
  let fvContributions = 0;
  if (monthlyReturn > 0) {
    fvContributions = monthlyContribution * ((Math.pow(1 + monthlyReturn, months) - 1) / monthlyReturn) * (1 + monthlyReturn);
  } else {
    fvContributions = monthlyContribution * months;
  }

  const totalInvested = initialAmount + (monthlyContribution * months);
  const totalValue = Math.round(fvInitial + fvContributions);
  const estimatedGrowth = totalValue - totalInvested;

  // Generate yearly data for chart
  const yearlyData = [];
  for (let y = 0; y <= years; y++) {
    const m = y * 12;
    const fvI = initialAmount * Math.pow(1 + monthlyReturn, m);
    let fvC = 0;
    if (monthlyReturn > 0) {
      fvC = monthlyContribution * ((Math.pow(1 + monthlyReturn, m) - 1) / monthlyReturn) * (1 + monthlyReturn);
    } else {
      fvC = monthlyContribution * m;
    }
    yearlyData.push({
      year: y,
      invested: Math.round(initialAmount + monthlyContribution * m),
      value: Math.round(fvI + fvC),
    });
  }

  return { totalInvested, totalValue, estimatedGrowth, yearlyData };
}

export function compareSpendSaveInvest(amount, years = [5, 10, 20]) {
  const fdRate = 7.0;
  const sipReturn = 12.0;

  return years.map(y => {
    const months = y * 12;
    const monthlyReturn = sipReturn / 100 / 12;

    // Spend
    const spend = amount;

    // FD (lump sum compound interest)
    const fd = Math.round(amount * Math.pow(1 + fdRate / 100, y));

    // SIP (monthly contribution)
    let sip;
    if (monthlyReturn > 0) {
      sip = Math.round(
        amount * ((Math.pow(1 + monthlyReturn, months) - 1) / monthlyReturn) * (1 + monthlyReturn)
      );
    } else {
      sip = amount * months;
    }

    // Savings account (assume 4%)
    const savings = Math.round(amount * Math.pow(1 + 0.04, y));

    return {
      years: y,
      spend,
      savings,
      fd,
      sip,
      totalInvestedSIP: amount * months,
    };
  });
}

export function processAIChat(query, expenses, income, budgets, goals) {
  const q = query.toLowerCase();
  const overview = getMonthlyOverview(expenses, income);
  const now = new Date();
  const monthName = MONTH_NAMES[now.getMonth()];

  // Category spending queries
  for (const cat of CATEGORIES) {
    if (q.includes(cat.name.toLowerCase()) && (q.includes('spend') || q.includes('how much') || q.includes('total'))) {
      const amount = overview.currentCategories[cat.id] || 0;
      const prevAmount = overview.previousCategories[cat.id] || 0;
      let response = `In ${monthName}, you spent ₹${amount.toLocaleString('en-IN')} on ${cat.name}.`;
      if (prevAmount > 0) {
        const change = ((amount - prevAmount) / prevAmount * 100).toFixed(0);
        response += ` ${change > 0 ? `That's ${change}% more` : `That's ${Math.abs(change)}% less`} than last month (₹${prevAmount.toLocaleString('en-IN')}).`;
      }
      if (budgets && budgets[cat.id]) {
        response += ` Your ${cat.name} budget is ₹${budgets[cat.id].toLocaleString('en-IN')}, with ₹${Math.max(0, budgets[cat.id] - amount).toLocaleString('en-IN')} remaining.`;
      }
      return response;
    }
  }

  // Most spending query
  if (q.includes('most') || q.includes('highest') || q.includes('largest') || q.includes('top')) {
    return `Your highest expense category this month is ${getCategoryName(overview.topCategory)} at ₹${overview.topAmount.toLocaleString('en-IN')}.`;
  }

  // Increase/change query
  if (q.includes('increase') || q.includes('change') || q.includes('different') || q.includes('compare')) {
    if (overview.biggestIncrease.percentage > 0) {
      return `Compared with last month, your biggest spending increase is in ${getCategoryName(overview.biggestIncrease.category)} (up ${overview.biggestIncrease.percentage}%). Your total spending ${overview.currentTotal > overview.previousTotal ? 'increased' : 'decreased'} from ₹${overview.previousTotal.toLocaleString('en-IN')} to ₹${overview.currentTotal.toLocaleString('en-IN')}.`;
    }
    return `Your spending is relatively stable compared with last month. Total: ₹${overview.currentTotal.toLocaleString('en-IN')} this month vs ₹${overview.previousTotal.toLocaleString('en-IN')} last month.`;
  }

  // Save query
  if (q.includes('save') || q.includes('saving')) {
    const match = q.match(/(\d[\d,]*)/);
    if (match) {
      const amount = parseInt(match[1].replace(/,/g, ''));
      const annual = amount * 12;
      return `If you save ₹${amount.toLocaleString('en-IN')} per month, you would save ₹${annual.toLocaleString('en-IN')} in a year. With an illustrative 12% annual return through investments, that could grow to approximately ₹${Math.round(amount * ((Math.pow(1 + 0.01, 12) - 1) / 0.01) * 1.01).toLocaleString('en-IN')} in 1 year. (This is an estimate based on assumed returns.)`;
    }
    return `You currently have ₹${overview.savings.toLocaleString('en-IN')} remaining this month after expenses. Your savings rate is ${overview.savingsRate}%.`;
  }

  // Reduce spending query
  if (q.includes('reduce') || q.includes('cut') || q.includes('less')) {
    const match = q.match(/(\d[\d,]*)/);
    if (match) {
      const amount = parseInt(match[1].replace(/,/g, ''));
      return `If you reduce spending by ₹${amount.toLocaleString('en-IN')} per month:\n\n• 6-month saving: ₹${(amount * 6).toLocaleString('en-IN')}\n• 12-month saving: ₹${(amount * 12).toLocaleString('en-IN')}\n• With an illustrative 12% annual return, ₹${amount.toLocaleString('en-IN')}/month could grow to approximately ₹${Math.round(amount * ((Math.pow(1 + 0.01, 12) - 1) / 0.01) * 1.01).toLocaleString('en-IN')} in 1 year.\n\n(Estimates based on assumed returns. Actual results may vary.)`;
    }
    return `To find areas where you can reduce spending, look at your top categories: ${getCategoryName(overview.topCategory)} (₹${overview.topAmount.toLocaleString('en-IN')}) is your largest.`;
  }

  // Goal query
  if (q.includes('goal') || q.includes('laptop') || q.includes('target')) {
    if (goals && goals.length > 0) {
      const goalSummaries = goals.map(g => {
        const progress = ((g.currentAmount / g.targetAmount) * 100).toFixed(0);
        const remaining = g.targetAmount - g.currentAmount;
        const targetDate = new Date(g.targetDate);
        const monthsLeft = Math.max(1, (targetDate.getFullYear() - now.getFullYear()) * 12 + targetDate.getMonth() - now.getMonth());
        const monthlyNeeded = Math.round(remaining / monthsLeft);
        return `${g.icon} ${g.name}: ${progress}% complete (₹${g.currentAmount.toLocaleString('en-IN')} / ₹${g.targetAmount.toLocaleString('en-IN')}). Need approximately ₹${monthlyNeeded.toLocaleString('en-IN')}/month.`;
      }).join('\n');
      return `Here are your financial goals:\n\n${goalSummaries}`;
    }
    return 'You have no goals set yet. Create a goal to start tracking your progress!';
  }

  // Budget query
  if (q.includes('budget')) {
    if (budgets) {
      const budgetLines = Object.entries(budgets).map(([cat, budget]) => {
        const spent = overview.currentCategories[cat] || 0;
        const remaining = budget - spent;
        return `${getCategoryName(cat)}: ₹${spent.toLocaleString('en-IN')} / ₹${budget.toLocaleString('en-IN')} (${remaining >= 0 ? `₹${remaining.toLocaleString('en-IN')} remaining` : `₹${Math.abs(remaining).toLocaleString('en-IN')} over`})`;
      }).join('\n');
      return `Here's your budget status for ${monthName}:\n\n${budgetLines}`;
    }
    return 'You have no budgets set. Go to settings to configure your category budgets.';
  }

  // Default response
  return `Here's a quick summary: In ${monthName}, you spent ₹${overview.currentTotal.toLocaleString('en-IN')} total. Your top category is ${getCategoryName(overview.topCategory)} (₹${overview.topAmount.toLocaleString('en-IN')}). You have ₹${Math.max(0, overview.savings).toLocaleString('en-IN')} remaining.\n\nTry asking about specific categories, budgets, goals, or savings scenarios!`;
}
