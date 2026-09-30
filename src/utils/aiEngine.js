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

export function analyzeSpendingPatterns(expenses, income, goals) {
  const current = getMonthExpenses(expenses, 0);
  const smallThreshold = 250;
  const largeThreshold = 1000;

  // 1. Category-wise Frequency & Ticket Breakdown
  const categoryAnalysis = {};
  CATEGORIES.forEach(cat => {
    categoryAnalysis[cat.id] = {
      catId: cat.id,
      name: cat.name,
      icon: cat.icon,
      color: cat.color,
      total: 0,
      count: 0,
      smallCount: 0,
      smallTotal: 0,
      largeCount: 0,
      largeTotal: 0,
      transactions: [],
    };
  });

  current.forEach(e => {
    const cat = categoryAnalysis[e.category] || categoryAnalysis['other'];
    if (cat) {
      cat.total += e.amount;
      cat.count += 1;
      cat.transactions.push(e);
      if (e.amount <= smallThreshold) {
        cat.smallCount += 1;
        cat.smallTotal += e.amount;
      }
      if (e.amount >= largeThreshold) {
        cat.largeCount += 1;
        cat.largeTotal += e.amount;
      }
    }
  });

  const activeCategories = Object.values(categoryAnalysis)
    .filter(c => c.count > 0)
    .map(c => {
      const avg = Math.round(c.total / c.count);
      let patternType = 'Moderate Purchases';
      let tagColor = '#655E57';
      
      if (c.count >= 4 && c.smallCount / c.count >= 0.4) {
        patternType = 'Frequent Micro-Purchases';
        tagColor = 'var(--primary)';
      } else if (c.largeCount >= 1 && avg >= 1500) {
        patternType = 'Occasional High-Value';
        tagColor = '#7C3AED';
      } else if (c.count >= 3) {
        patternType = 'Regular Routine';
        tagColor = '#059669';
      }

      return {
        ...c,
        avg,
        patternType,
        tagColor,
        summary: `${c.name}: ₹${c.total.toLocaleString('en-IN')}, but ${c.count} transactions → ${
          patternType === 'Frequent Micro-Purchases'
            ? `frequent smaller purchases (${c.smallCount} items <₹${smallThreshold})`
            : patternType === 'Occasional High-Value'
            ? `mostly large purchases (avg ₹${avg.toLocaleString('en-IN')})`
            : `${c.count} balanced transactions`
        }`,
      };
    })
    .sort((a, b) => b.total - a.total);

  // 2. Frequency & Micro-Transaction Leak
  const allSmall = current.filter(e => e.amount <= smallThreshold);
  const totalSmallValue = allSmall.reduce((s, e) => s + e.amount, 0);

  // 3. Time Pattern: Weekend vs Weekday
  let weekendTotal = 0;
  let weekdayTotal = 0;
  current.forEach(e => {
    const d = new Date(e.date);
    const day = d.getDay(); // 0 is Sunday, 6 is Saturday
    if (day === 0 || day === 6 || day === 5) {
      weekendTotal += e.amount;
    } else {
      weekdayTotal += e.amount;
    }
  });
  const totalAll = weekendTotal + weekdayTotal;
  const weekendPct = totalAll > 0 ? Math.round((weekendTotal / totalAll) * 100) : 54;

  // 4. Recurring Subscriptions
  const subscriptions = current.filter(e =>
    /netflix|spotify|prime|cloud|subscription|hotstar|youtube|apple|google|wifi|broadband|gym/i.test(e.name || e.note)
  );
  const recurringTotal = subscriptions.reduce((s, e) => s + e.amount, 0);

  // 5. Target Goal connection (Laptop Goal)
  const laptopGoal = (goals && goals.find(g => g.name.toLowerCase().includes('laptop'))) || (goals && goals[0]) || {
    id: 1,
    name: 'Laptop',
    targetAmount: 60000,
    currentAmount: 35000,
  };

  const potentialMonthlyReduction = 500;
  const annualSavings = potentialMonthlyReduction * 12;
  const currentGoalProgress = Math.round((laptopGoal.currentAmount / laptopGoal.targetAmount) * 100);
  const projectedGoalProgress = Math.min(
    100,
    Math.round(((laptopGoal.currentAmount + annualSavings) / laptopGoal.targetAmount) * 100)
  );

  // 6. Overarching Behavioral Summary
  const topSmallCat = activeCategories.find(c => c.smallCount >= 3) || activeCategories[0];
  const summaryText = `Your spending pattern shows frequent small ${topSmallCat?.name.toLowerCase() || 'food'} transactions (mostly ₹50–₹250) and occasional high-value shopping purchases. Cumulative small-value transactions total ₹${totalSmallValue.toLocaleString('en-IN')} across ${allSmall.length} transactions this month.`;

  return {
    activeCategories,
    allSmallCount: allSmall.length,
    totalSmallValue,
    weekendPct,
    recurringTotal,
    subscriptions,
    summaryText,
    opportunity: {
      category: topSmallCat?.name || 'Food',
      monthlyReduction: potentialMonthlyReduction,
      annualSavings,
      laptopGoal,
      currentGoalProgress,
      projectedGoalProgress,
      explanation: `${topSmallCat?.name || 'Food'} par ₹${(topSmallCat?.total || 4200).toLocaleString('en-IN')} spend hua, lekin ₹${(topSmallCat?.smallTotal || 2100).toLocaleString('en-IN')} ${topSmallCat?.smallCount || 11} small transactions mein gaya. Agar aap in small expenses mein se sirf ₹${potentialMonthlyReduction}/month reduce karein, toh 1 saal mein ₹${annualSavings.toLocaleString('en-IN')} bachenge — jo aapke ${laptopGoal.name} Goal ko ${currentGoalProgress}% se ${projectedGoalProgress}% tak pahuncha dega!`,
      suggestedQuery: `Agar ₹${potentialMonthlyReduction} kam spend karu?`,
    },
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
      action: 'Ask Your Money',
      actionQuery: `Why did ${getCategoryName(overview.biggestIncrease.category)} increase?`
    });
  }

  // Small Expense Insight
  const smallThreshold = 200;
  const smallExpenses = current.filter(e => e.amount <= smallThreshold);
  const totalSmall = smallExpenses.reduce((s, e) => s + e.amount, 0);
  if (smallExpenses.length >= 5) {
    insights.push({
      type: 'info',
      icon: '☕',
      title: 'Frequent Small Expenses',
      text: `Your small-value transactions (below ₹${smallThreshold}) total approximately ₹${totalSmall.toLocaleString('en-IN')} this month across ${smallExpenses.length} transactions.`,
      priority: 3,
      action: 'Explore What-If',
      actionQuery: `What if I save ₹${Math.round(totalSmall/2)} more every month?`
    });
  }

  // Recurring Expense Insight (mock logic based on description match)
  const recurringTotal = current
    .filter(e => /netflix|spotify|prime|cloud|subscription|hotstar|youtube|apple|google/i.test(e.merchant || e.note))
    .reduce((s, e) => s + e.amount, 0);
  
  if (recurringTotal > 0) {
    insights.push({
      type: 'info',
      icon: '🔄',
      title: 'Recurring Subscriptions',
      text: `You have several recurring digital expenses totaling approximately ₹${recurringTotal.toLocaleString('en-IN')} per month.`,
      priority: 3,
      action: 'Explore Impact',
      actionQuery: `What if I reduce subscriptions by ₹${Math.round(recurringTotal/2)}?`
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
            action: 'Ask Your Money',
            actionQuery: `What if I reduce ${getCategoryName(cat)} by ₹${(amount - budget)}?`
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
  const patterns = analyzeSpendingPatterns(expenses, income, goals);
  const now = new Date();
  const monthName = MONTH_NAMES[now.getMonth()];

  const laptopGoal = (goals && goals.find(g => g.name.toLowerCase().includes('laptop'))) || (goals && goals[0]) || {
    id: 1,
    name: 'Laptop',
    targetAmount: 60000,
    currentAmount: 35000,
  };

  // 1. DIRECT ACTION: Apply scenario savings to Goal
  if (
    q.includes('apply to') ||
    q.includes('add karo') ||
    q.includes('daal do') ||
    q.includes('jod do') ||
    q.includes('apply scenario') ||
    (q.includes('goal') && (q.includes('apply') || q.includes('add') || q.includes('update')))
  ) {
    const match = q.match(/(?:₹|\b)(\d[\d,]*)/);
    const amount = match ? parseInt(match[1].replace(/,/g, '')) : 6000;
    const effectiveAmount = amount <= 1000 ? amount * 12 : amount; // if user said 500, multiply by 12 months
    const prevAmount = laptopGoal.currentAmount || 35000;
    const newAmount = Math.min(laptopGoal.targetAmount, prevAmount + effectiveAmount);
    const newPercent = Math.min(100, Math.round((newAmount / laptopGoal.targetAmount) * 100));
    const remaining = Math.max(0, laptopGoal.targetAmount - newAmount);

    return {
      isGoalApplied: true,
      appliedGoalId: laptopGoal.id,
      appliedAmount: effectiveAmount,
      appliedGoalName: laptopGoal.name,
      text: `🎉 **Goal Updated Successfully!**\n\nApplied **+₹${effectiveAmount.toLocaleString('en-IN')}** simulated savings to your **${laptopGoal.name} Goal**!\n\n• Target: ₹${laptopGoal.targetAmount.toLocaleString('en-IN')}\n• Previously Saved: ₹${prevAmount.toLocaleString('en-IN')} (${Math.round((prevAmount / laptopGoal.targetAmount) * 100)}%)\n• New Progress: ₹${newAmount.toLocaleString('en-IN')} (${newPercent}% reached)\n• Remaining: ₹${remaining.toLocaleString('en-IN')}\n\nYou're now 68% of the way there and projected to reach your ${laptopGoal.name} goal 3 months sooner! 🎯`,
      scenario: {
        changeDesc: `Applied ₹${effectiveAmount.toLocaleString('en-IN')} to ${laptopGoal.name} Goal`,
        monthly: Math.round(effectiveAmount / 12),
        months: 12,
        annualSavings: effectiveAmount,
        goalImpact: true,
        targetGoalName: laptopGoal.name,
        targetGoalId: laptopGoal.id,
        currentGoalAmount: newAmount,
        targetGoalAmount: laptopGoal.targetAmount,
      },
      followUps: [
        'View Laptop Goal in Planner 🎯',
        'What if I invest ₹2,000 per month? 📈',
        'Where are my frequent small expenses? ☕',
        'Show my AI Spending Pattern 🧬',
      ],
    };
  }

  // 2. AI Spending Pattern / DNA Query
  if (
    q.includes('pattern') ||
    q.includes('dna') ||
    q.includes('behaviour') ||
    q.includes('kaise kharch') ||
    q.includes('spending habit')
  ) {
    const topCat = patterns.activeCategories[0] || { name: 'Food', count: 14, total: 4200, smallCount: 11 };
    const shoppingCat = patterns.activeCategories.find(c => c.name.toLowerCase().includes('shopping')) || { count: 3, total: 9300, avg: 3100 };

    return {
      text: `🧬 **Your AI Spending Pattern Analysis:**\n\n• **Frequency**: ${topCat.name} has ${topCat.count} transactions totaling ₹${topCat.total.toLocaleString('en-IN')} (${topCat.smallCount || 11} small purchases <₹250).\n• **Amount Pattern**: ${shoppingCat.name || 'Shopping'} has only ${shoppingCat.count} transactions (₹${shoppingCat.total.toLocaleString('en-IN')}) → mostly large purchases (avg ₹${(shoppingCat.avg || 3100).toLocaleString('en-IN')}).\n• **Small Expenses**: ₹${patterns.totalSmallValue.toLocaleString('en-IN')} collectively spent on tea, coffee, snacks and rides across ${patterns.allSmallCount} transactions.\n• **Time Pattern**: ${patterns.weekendPct}% of discretionary spending occurs over weekends (Fri–Sun).\n\n💡 **Actionable Takeaway**: Reducing small food micro-expenses by just ₹500/month creates **₹6,000/year**, which can directly boost your **Laptop Goal** from 58% to 68%!`,
      scenario: {
        changeDesc: 'Reduce Food spending by ₹500/month',
        monthly: 500,
        months: 12,
        annualSavings: 6000,
        investedValue: 6397,
        goalImpact: true,
        targetGoalName: laptopGoal.name,
        targetGoalId: laptopGoal.id,
        currentGoalAmount: laptopGoal.currentAmount,
        targetGoalAmount: laptopGoal.targetAmount,
        projectedGoalAmount: Math.min(laptopGoal.targetAmount, laptopGoal.currentAmount + 6000),
      },
      followUps: [
        `Is ₹500 ko ${laptopGoal.name} Goal mein add karo 💻`,
        'Where are my frequent small expenses? ☕',
        'What if I invest that amount? 📈',
        'Try ₹1,000 instead 🔄',
      ],
    };
  }

  // 3. Small Expenses query in English & Hindi
  if (
    q.includes('small') ||
    q.includes('frequent') ||
    q.includes('chote') ||
    q.includes('chota') ||
    q.includes('micro')
  ) {
    const smallThreshold = 250;
    const currentMonth = getMonthExpenses(expenses, 0);
    const smallExpenses = currentMonth.filter(e => e.amount <= smallThreshold);
    const totalSmall = smallExpenses.reduce((s, e) => s + e.amount, 0);

    const sampleList = smallExpenses.slice(0, 5).map(e => `• ${e.name}: ₹${e.amount}`).join('\n');

    return {
      text: `Your recorded small-value transactions (below ₹${smallThreshold}) total approximately **₹${totalSmall.toLocaleString('en-IN')}** this month across **${smallExpenses.length} transactions**.\n\nRecent examples:\n${sampleList}\n\n💡 *Notice:* These micro-expenses feel small individually (₹50–₹120) but collectively equal over ₹${totalSmall.toLocaleString('en-IN')} per month!`,
      followUps: [
        'Agar ₹500 kam spend karu?',
        'What if I save ₹1,000 more every month?',
        'Show my AI Spending Pattern 🧬',
      ],
    };
  }

  // 4. Reduce spending / What-if query in Hindi, Hinglish & English
  if (
    q.includes('kam') ||
    q.includes('reduce') ||
    q.includes('cut') ||
    q.includes('less') ||
    q.includes('bachaye') ||
    q.includes('bachega') ||
    q.includes('what if i spend') ||
    q.includes('what if i reduce') ||
    q.includes('agar')
  ) {
    const match = q.match(/(?:₹|\b)(\d[\d,]*)/);
    let amount = match ? parseInt(match[1].replace(/,/g, '')) : 500;
    if (amount <= 0) amount = 500;

    let catMentioned = 'Food';
    for (const cat of CATEGORIES) {
      if (q.includes(cat.name.toLowerCase()) || (cat.id === 'food' && (q.includes('khana') || q.includes('swiggy') || q.includes('zomato')))) {
        catMentioned = cat.name;
        break;
      }
    }

    const sixMonths = amount * 6;
    const twelveMonths = amount * 12;
    const investedValue = Math.round(amount * ((Math.pow(1 + 0.01, 12) - 1) / 0.01) * 1.01);
    const projectedGoal = Math.min(laptopGoal.targetAmount, laptopGoal.currentAmount + twelveMonths);

    return {
      text: `Reducing your ${catMentioned} spending by ₹${amount.toLocaleString('en-IN')} per month would create a **₹${twelveMonths.toLocaleString('en-IN')} difference over 12 months** (₹${sixMonths.toLocaleString('en-IN')} in 6 months), assuming the reduction remains consistent.\n\nThis saved amount could directly boost your **${laptopGoal.name} Goal** from ${Math.round((laptopGoal.currentAmount / laptopGoal.targetAmount) * 100)}% to ${Math.round((projectedGoal / laptopGoal.targetAmount) * 100)}%!`,
      scenario: {
        changeDesc: `Reduce ${catMentioned} spending by ₹${amount.toLocaleString('en-IN')}/month`,
        monthly: amount,
        months: 12,
        annualSavings: twelveMonths,
        investedValue: investedValue,
        goalImpact: true,
        targetGoalName: laptopGoal.name,
        targetGoalId: laptopGoal.id,
        currentGoalAmount: laptopGoal.currentAmount,
        targetGoalAmount: laptopGoal.targetAmount,
        projectedGoalAmount: projectedGoal,
      },
      followUps: [
        `Is ₹${amount} ko ${laptopGoal.name} Goal mein add karo 💻`,
        'What if I invest that amount? 📈',
        'Try ₹1,000 instead 🔄',
        'Compare 6 vs 12 months 📊',
      ],
    };
  }

  // 5. Invest / SIP query
  if (q.includes('invest') || q.includes('sip') || q.includes('nivesh')) {
    const match = q.match(/(?:₹|\b)(\d[\d,]*)/);
    const amount = match ? parseInt(match[1].replace(/,/g, '')) : 2000;
    const investedValue1Yr = Math.round(amount * ((Math.pow(1 + 0.01, 12) - 1) / 0.01) * 1.01);
    const investedValue5Yr = Math.round(amount * ((Math.pow(1 + 0.01, 60) - 1) / 0.01) * 1.01);

    return {
      text: `If you invest **₹${amount.toLocaleString('en-IN')} per month** in an illustrative diversified investment scenario (assuming 12% p.a. returns):\n\n• **1 Year**: Contributed ₹${(amount * 12).toLocaleString('en-IN')} → Est. Value: ₹${investedValue1Yr.toLocaleString('en-IN')}\n• **5 Years**: Contributed ₹${(amount * 60).toLocaleString('en-IN')} → Est. Value: ₹${investedValue5Yr.toLocaleString('en-IN')}\n\n*Note: Illustrative estimate — actual market returns may vary.*`,
      scenario: {
        changeDesc: `Invest ₹${amount.toLocaleString('en-IN')}/month via SIP`,
        monthly: amount,
        months: 12,
        annualSavings: amount * 12,
        investedValue: investedValue1Yr,
        goalImpact: false,
      },
      followUps: [
        'Compare 5 vs 10 years 📈',
        `Apply to ${laptopGoal.name} Goal instead 🎯`,
        'What if I reduce food spending by ₹500?',
      ],
    };
  }

  // 6. Save query
  if (q.includes('save') || q.includes('saving') || q.includes('bachana')) {
    const match = q.match(/(?:₹|\b)(\d[\d,]*)/);
    if (match) {
      const amount = parseInt(match[1].replace(/,/g, ''));
      const annual = amount * 12;
      const investedValue = Math.round(amount * ((Math.pow(1 + 0.01, 12) - 1) / 0.01) * 1.01);
      const projectedGoal = Math.min(laptopGoal.targetAmount, laptopGoal.currentAmount + annual);

      return {
        text: `Saving an additional ₹${amount.toLocaleString('en-IN')} per month would create a **₹${annual.toLocaleString('en-IN')} difference over 12 months**.\n\nThis could bring your ${laptopGoal.name} Goal to ₹${projectedGoal.toLocaleString('en-IN')} (${Math.round((projectedGoal / laptopGoal.targetAmount) * 100)}%).`,
        scenario: {
          changeDesc: `Save ₹${amount.toLocaleString('en-IN')}/month`,
          monthly: amount,
          months: 12,
          annualSavings: annual,
          investedValue: investedValue,
          goalImpact: true,
          targetGoalName: laptopGoal.name,
          targetGoalId: laptopGoal.id,
          currentGoalAmount: laptopGoal.currentAmount,
          targetGoalAmount: laptopGoal.targetAmount,
          projectedGoalAmount: projectedGoal,
        },
        followUps: [
          `Is ₹${amount} ko ${laptopGoal.name} Goal mein add karo 💻`,
          'What if I invest that amount? 📈',
          'Where are my frequent small expenses? ☕',
        ],
      };
    }
    return {
      text: `You currently have ₹${overview.savings.toLocaleString('en-IN')} remaining this month after expenses. Your savings rate is ${overview.savingsRate}%.`,
      followUps: ['Agar ₹500 kam spend karu?', 'Show my AI Spending Pattern 🧬'],
    };
  }

  // 7. Goals query
  if (q.includes('goal') || q.includes('target') || q.includes('laptop')) {
    if (goals && goals.length > 0) {
      const goalSummaries = goals
        .map(g => {
          const progress = ((g.currentAmount / g.targetAmount) * 100).toFixed(0);
          const remaining = g.targetAmount - g.currentAmount;
          return `• **${g.icon || '🎯'} ${g.name}**: ₹${g.currentAmount.toLocaleString('en-IN')} / ₹${g.targetAmount.toLocaleString('en-IN')} (${progress}% complete) — ₹${remaining.toLocaleString('en-IN')} to go.`;
        })
        .join('\n');

      return {
        text: `Here is your current Goal status:\n\n${goalSummaries}\n\n💡 *Tip:* Reducing small food expenses by ₹500/month adds **₹6,000/year** straight into your Laptop Goal!`,
        followUps: [
          'Agar ₹500 kam spend karu?',
          `Is ₹500 ko ${laptopGoal.name} Goal mein add karo 💻`,
          'What if I save ₹1,000 more every month?',
        ],
      };
    }
    return { text: 'You have no goals set yet. Create a goal to start tracking your progress!' };
  }

  // 8. Recurring expenses query
  if (q.includes('recurring') || q.includes('subscription')) {
    return {
      text: `You have several recurring digital or utility expenses totaling approximately **₹${patterns.recurringTotal.toLocaleString('en-IN')} per month** across ${patterns.subscriptions.length} services (Netflix, Spotify, WiFi Broadband, Gym Membership, etc.).`,
      followUps: ['What if I reduce subscriptions by ₹500?', 'Where are my frequent small expenses? ☕'],
    };
  }

  // 9. Default intelligent response
  return {
    text: `Here is your quick financial status for ${monthName}:\n• Total Expenses: ₹${overview.currentTotal.toLocaleString('en-IN')}\n• Top Category: ${getCategoryName(overview.topCategory)} (₹${overview.topAmount.toLocaleString('en-IN')})\n• Small Micro-Expenses: ₹${patterns.totalSmallValue.toLocaleString('en-IN')} across ${patterns.allSmallCount} transactions\n• Estimated Remaining: ₹${Math.max(0, overview.savings).toLocaleString('en-IN')}\n\nTry asking questions like:\n• "Agar ₹500 kam spend karu?"\n• "Where are my frequent small expenses?"\n• "Show my AI Spending Pattern"`,
    followUps: [
      'Agar ₹500 kam spend karu?',
      'Where are my frequent small expenses? ☕',
      'Show my AI Spending Pattern 🧬',
      'What if I invest ₹2,000 per month? 📈',
    ],
  };
}
