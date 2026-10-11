import { CATEGORIES, MONTH_NAMES } from './demoData';
import {
  calculateLumpSumFV,
  calculateSIPFutureValue,
  calculateCombinedFutureValue,
  compareBuyNowVsInvest,
  calculateWhatIfSavings,
} from './financialCalculations';
import { getTranslation, getLocalizedMonthName } from './translations';

function getCategoryName(catId, lang = 'en') {
  if (!catId) return '';
  const key = 'cat_' + catId.toLowerCase();
  const tr = getTranslation(key, lang);
  if (tr && tr !== key) return tr;
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

export function analyzeSpendingPatterns(expenses, income, goals, lang = 'en') {
  const current = getMonthExpenses(expenses, 0);
  const smallThreshold = 250;
  const largeThreshold = 1000;

  // 1. Category-wise Frequency & Ticket Breakdown
  const categoryAnalysis = {};
  CATEGORIES.forEach(cat => {
    categoryAnalysis[cat.id] = {
      catId: cat.id,
      name: getCategoryName(cat.id, lang),
      rawName: cat.name,
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
        patternType = lang === 'kn' ? 'ಪುನರಾವರ್ತಿತ ಸಣ್ಣ ಖರ್ಚುಗಳು' : lang === 'hi' ? 'लगातार छोटे खर्च (Micro-Purchases)' : 'Frequent Micro-Purchases';
        tagColor = 'var(--primary)';
      } else if (c.largeCount >= 1 && avg >= 1500) {
        patternType = lang === 'kn' ? 'ಸಾಂದರ್ಭಿಕ ದೊಡ್ಡ ಖರ್ಚುಗಳು' : lang === 'hi' ? 'कभी-कभार बड़े खर्च' : 'Occasional High-Value';
        tagColor = '#7C3AED';
      } else if (c.count >= 3) {
        patternType = lang === 'kn' ? 'ನಿಯಮಿತ ಖರ್ಚುಗಳು' : lang === 'hi' ? 'नियमित दिनचर्या' : 'Regular Routine';
        tagColor = '#059669';
      } else {
        patternType = lang === 'kn' ? 'ಮಧ್ಯಮ ಮಟ್ಟದ ಖರ್ಚುಗಳು' : lang === 'hi' ? 'मध्यम स्तर के खर्च' : 'Moderate Purchases';
      }

      return {
        ...c,
        avg,
        patternType,
        tagColor,
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
  const topSmallCatName = topSmallCat?.name || getCategoryName('food', lang);

  let summaryText = `Your spending pattern shows frequent small ${topSmallCatName.toLowerCase()} transactions (mostly ₹50–₹250) and occasional high-value shopping purchases. Cumulative small-value transactions total ₹${totalSmallValue.toLocaleString('en-IN')} across ${allSmall.length} transactions this month.`;
  if (lang === 'hi') {
    summaryText = `आपके खर्च का पैटर्न दिखाता है कि ${topSmallCatName} में लगातार छोटे लेन-देन (अधिकतर ₹50–₹250) और कभी-कभार खरीदारी के बड़े खर्च होते हैं। इस महीने कुल ₹${totalSmallValue.toLocaleString('en-IN')} के छोटे लेन-देन ${allSmall.length} बार हुए हैं।`;
  } else if (lang === 'kn') {
    summaryText = `ನಿಮ್ಮ ಖರ್ಚಿನ ಮಾದರಿಯು ${topSmallCatName} ನಲ್ಲಿ ಸಣ್ಣ ಮೊತ್ತದ ಪುನರಾವರ್ತಿತ ವಹಿವಾಟುಗಳನ್ನು (ಹೆಚ್ಚಾಗಿ ₹50–₹250) ಮತ್ತು ಸಾಂದರ್ಭಿಕ ದೊಡ್ಡ ಶಾಪಿಂಗ್ ಖರ್ಚುಗಳನ್ನು ತೋರಿಸುತ್ತದೆ. ಈ ತಿಂಗಳು ${allSmall.length} ವಹಿವಾಟುಗಳಲ್ಲಿ ಒಟ್ಟು ₹${totalSmallValue.toLocaleString('en-IN')} ಸಣ್ಣ ಖರ್ಚುಗಳಾಗಿವೆ.`;
  }

  let explanation = `₹${(topSmallCat?.total || 4200).toLocaleString('en-IN')} was spent on ${topSmallCatName}, but ₹${(topSmallCat?.smallTotal || 2100).toLocaleString('en-IN')} went into ${topSmallCat?.smallCount || 11} micro-transactions (<₹250). Reducing just ₹${potentialMonthlyReduction}/month in these small expenses creates ₹${annualSavings.toLocaleString('en-IN')}/year — pushing your ${laptopGoal.name} Goal from ${currentGoalProgress}% to ${projectedGoalProgress}%!`;
  if (lang === 'hi') {
    explanation = `${topSmallCatName} पर ₹${(topSmallCat?.total || 4200).toLocaleString('en-IN')} खर्च हुआ, जिसमें से ₹${(topSmallCat?.smallTotal || 2100).toLocaleString('en-IN')} छोटे खर्चों (${topSmallCat?.smallCount || 11} बार) में गया। यदि आप इनमें से केवल ₹${potentialMonthlyReduction}/माह बचाएं, तो 1 वर्ष में ₹${annualSavings.toLocaleString('en-IN')} बचेंगे — जो आपके ${laptopGoal.name} लक्ष्य को ${currentGoalProgress}% से ${projectedGoalProgress}% तक पहुँचा देगा!`;
  } else if (lang === 'kn') {
    explanation = `${topSmallCatName} ಗಾಗಿ ₹${(topSmallCat?.total || 4200).toLocaleString('en-IN')} ಖರ್ಚಾಗಿದೆ, ಇದರಲ್ಲಿ ₹${(topSmallCat?.smallTotal || 2100).toLocaleString('en-IN')} ಮೊತ್ತವು ಸಣ್ಣ ಪುಟ್ಟ ಖರ್ಚುಗಳಲ್ಲೇ (${topSmallCat?.smallCount || 11} ವಹಿವಾಟುಗಳು) ಹೋಗಿದೆ. ನೀವು ಈ ಸಣ್ಣ ಖರ್ಚುಗಳಿಂದ ತಿಂಗಳಿಗೆ ಕೇವಲ ₹${potentialMonthlyReduction} ಉಳಿಸಿದರೆ, 1 ವರ್ಷದಲ್ಲಿ ₹${annualSavings.toLocaleString('en-IN')} ಉಳಿತಾಯವಾಗುತ್ತದೆ — ಇದು ನಿಮ್ಮ ${laptopGoal.name} ಗುರಿಯನ್ನು ${currentGoalProgress}% ರಿಂದ ${projectedGoalProgress}% ತಲುಪಲು ನೆರವಾಗುತ್ತದೆ!`;
  }

  const suggestedQuery = lang === 'kn'
    ? `ತಿಂಗಳಿಗೆ ₹${potentialMonthlyReduction} ಕಡಿಮೆ ಖರ್ಚು ಮಾಡಿದರೆ?`
    : lang === 'hi'
    ? `अगर ₹${potentialMonthlyReduction} कम खर्च करूँ तो?`
    : `Agar ₹${potentialMonthlyReduction} kam spend karu?`;

  return {
    activeCategories,
    allSmallCount: allSmall.length,
    totalSmallValue,
    weekendPct,
    recurringTotal,
    subscriptions,
    summaryText,
    opportunity: {
      category: topSmallCatName,
      monthlyReduction: potentialMonthlyReduction,
      annualSavings,
      laptopGoal,
      currentGoalProgress,
      projectedGoalProgress,
      explanation,
      suggestedQuery,
    },
  };
}

export function generateInsights(expenses, income, budgets, lang = 'en') {
  const insights = [];
  const overview = getMonthlyOverview(expenses, income);
  const current = getMonthExpenses(expenses, 0);
  const currentCategoryCounts = getCategoryCounts(current);

  // Monthly summary
  if (lang === 'kn') {
    insights.push({
      type: 'summary',
      icon: '📊',
      title: 'ಮಾಸಿಕ ಸಾರಾಂಶ',
      text: `ಈ ತಿಂಗಳು ನೀವು ${overview.categoryCount} ವರ್ಗಗಳಲ್ಲಿ ${overview.transactionCount} ವಹಿವಾಟುಗಳ ಮೂಲಕ ₹${overview.currentTotal.toLocaleString('en-IN')} ಖರ್ಚು ಮಾಡಿದ್ದೀರಿ.`,
      priority: 1,
    });
  } else if (lang === 'hi') {
    insights.push({
      type: 'summary',
      icon: '📊',
      title: 'मासिक सारांश',
      text: `इस महीने आपने ${overview.categoryCount} श्रेणियों में ${overview.transactionCount} लेन-देन के माध्यम से ₹${overview.currentTotal.toLocaleString('en-IN')} खर्च किए।`,
      priority: 1,
    });
  } else {
    insights.push({
      type: 'summary',
      icon: '📊',
      title: 'Monthly Summary',
      text: `This month you spent ₹${overview.currentTotal.toLocaleString('en-IN')} across ${overview.transactionCount} transactions in ${overview.categoryCount} categories.`,
      priority: 1,
    });
  }

  // Savings insight
  if (overview.savings > 0) {
    if (lang === 'kn') {
      insights.push({
        type: 'positive',
        icon: '💰',
        title: 'ಉಳಿತಾಯ ಸ್ಥಿತಿ',
        text: `ಈ ತಿಂಗಳು ನಿಮ್ಮಲ್ಲಿ ₹${overview.savings.toLocaleString('en-IN')} ಉಳಿತಾಯವಿದೆ (${overview.savingsRate}% ಉಳಿತಾಯದ ಪ್ರಮಾಣ). ${parseFloat(overview.savingsRate) >= 20 ? 'ಉತ್ತಮ ಉಳಿತಾಯ ದರವನ್ನು ಮುಂದುವರಿಸಿದ್ದೀರಿ!' : 'ನಿಮ್ಮ ಉಳಿತಾಯವನ್ನು ಹೆಚ್ಚಿಸುವ ಮಾರ್ಗಗಳನ್ನು ಪರಿಗಣಿಸಿ.'}`,
        priority: 2,
      });
    } else if (lang === 'hi') {
      insights.push({
        type: 'positive',
        icon: '💰',
        title: 'बचत स्थिति',
        text: `इस महीने आपके पास ₹${overview.savings.toLocaleString('en-IN')} की बचत बची है (${overview.savingsRate}% बचत दर)। ${parseFloat(overview.savingsRate) >= 20 ? 'उत्कृष्ट बचत दर बनाए रखने के लिए बधाई!' : 'अपनी बचत को बढ़ाने के विकल्पों पर विचार करें।'}`,
        priority: 2,
      });
    } else {
      insights.push({
        type: 'positive',
        icon: '💰',
        title: 'Savings Status',
        text: `You have ₹${overview.savings.toLocaleString('en-IN')} remaining this month (${overview.savingsRate}% savings rate). ${parseFloat(overview.savingsRate) >= 20 ? 'Great job maintaining a healthy savings rate!' : 'Consider looking at ways to increase your savings.'}`,
        priority: 2,
      });
    }
  } else {
    if (lang === 'kn') {
      insights.push({
        type: 'warning',
        icon: '⚠️',
        title: 'ಬಜೆಟ್ ಮೀರಿದೆ',
        text: `ನಿಮ್ಮ ಖರ್ಚುಗಳು ಮಾಸಿಕ ಆದಾಯಕ್ಕಿಂತ ₹${Math.abs(overview.savings).toLocaleString('en-IN')} ಹೆಚ್ಚಾಗಿವೆ. ಖರ್ಚುಗಳನ್ನು ನಿಯಂತ್ರಿಸಲು ಪರಿಶೀಲಿಸಿ.`,
        priority: 1,
      });
    } else if (lang === 'hi') {
      insights.push({
        type: 'warning',
        icon: '⚠️',
        title: 'बजट से अधिक',
        text: `आपके खर्चे आपकी आय से ₹${Math.abs(overview.savings).toLocaleString('en-IN')} अधिक हो गए हैं। कृपया अपने खर्चों की समीक्षा करें।`,
        priority: 1,
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
  }

  // Top expense category
  if (overview.topCategory) {
    const topCatName = getCategoryName(overview.topCategory, lang);
    if (lang === 'kn') {
      insights.push({
        type: 'info',
        icon: '📈',
        title: 'ಪ್ರಮುಖ ಖರ್ಚಿನ ವರ್ಗ',
        text: `${topCatName} ₹${overview.topAmount.toLocaleString('en-IN')} ಮೊತ್ತದೊಂದಿಗೆ ನಿಮ್ಮ ಅತಿ ದೊಡ್ಡ ಖರ್ಚಿನ ವರ್ಗವಾಗಿದೆ, ಈ ತಿಂಗಳು ${currentCategoryCounts[overview.topCategory] || 0} ವಹಿವಾಟುಗಳು ನಡೆದಿವೆ.`,
        priority: 3,
      });
    } else if (lang === 'hi') {
      insights.push({
        type: 'info',
        icon: '📈',
        title: 'प्रमुख खर्च श्रेणी',
        text: `${topCatName} ₹${overview.topAmount.toLocaleString('en-IN')} के साथ आपका सबसे बड़ा खर्च क्षेत्र है, जिसमें इस महीने ${currentCategoryCounts[overview.topCategory] || 0} लेन-देन दर्ज हुए हैं।`,
        priority: 3,
      });
    } else {
      insights.push({
        type: 'info',
        icon: '📈',
        title: 'Top Expense Category',
        text: `${topCatName} is your largest expense category at ₹${overview.topAmount.toLocaleString('en-IN')}, with ${currentCategoryCounts[overview.topCategory] || 0} transactions this month.`,
        priority: 3,
      });
    }
  }

  // Spending trend
  if (overview.previousTotal > 0) {
    const change = ((overview.currentTotal - overview.previousTotal) / overview.previousTotal * 100).toFixed(1);
    if (change > 5) {
      if (lang === 'kn') {
        insights.push({
          type: 'warning',
          icon: '📊',
          title: 'ಖರ್ಚಿನ ಪ್ರವೃತ್ತಿ',
          text: `ಕಳೆದ ತಿಂಗಳಿಗಿಂತ ನಿಮ್ಮ ಒಟ್ಟು ಖರ್ಚು ${change}% ಹೆಚ್ಚಾಗಿದೆ (₹${overview.previousTotal.toLocaleString('en-IN')} → ₹${overview.currentTotal.toLocaleString('en-IN')}).`,
          priority: 2,
        });
      } else if (lang === 'hi') {
        insights.push({
          type: 'warning',
          icon: '📊',
          title: 'खर्च का रुझान',
          text: `पिछले महीने की तुलना में आपका कुल खर्च ${change}% बढ़ गया है (₹${overview.previousTotal.toLocaleString('en-IN')} → ₹${overview.currentTotal.toLocaleString('en-IN')})।`,
          priority: 2,
        });
      } else {
        insights.push({
          type: 'warning',
          icon: '📊',
          title: 'Spending Trend',
          text: `Your overall spending increased by ${change}% compared with last month (₹${overview.previousTotal.toLocaleString('en-IN')} → ₹${overview.currentTotal.toLocaleString('en-IN')}).`,
          priority: 2,
        });
      }
    } else if (change < -5) {
      if (lang === 'kn') {
        insights.push({
          type: 'positive',
          icon: '✅',
          title: 'ಖರ್ಚಿನ ಪ್ರವೃತ್ತಿ',
          text: `ಕಳೆದ ತಿಂಗಳಿಗಿಂತ ನಿಮ್ಮ ಒಟ್ಟು ಖರ್ಚು ${Math.abs(change)}% ಕಡಿಮೆಯಾಗಿದೆ. ನೀವು ಎಚ್ಚರಿಕೆಯಿಂದ ಉಳಿತಾಯ ಮಾಡುತ್ತಿದ್ದೀರಿ.`,
          priority: 2,
        });
      } else if (lang === 'hi') {
        insights.push({
          type: 'positive',
          icon: '✅',
          title: 'खर्च का रुझान',
          text: `पिछले महीने की तुलना में आपका कुल खर्च ${Math.abs(change)}% घट गया है। आप समझदारी से बचत कर रहे हैं।`,
          priority: 2,
        });
      } else {
        insights.push({
          type: 'positive',
          icon: '✅',
          title: 'Spending Trend',
          text: `Your overall spending decreased by ${Math.abs(change)}% compared with last month. You're spending more carefully.`,
          priority: 2,
        });
      }
    }
  }

  // Category increase alerts
  if (overview.biggestIncrease.percentage > 15) {
    const incCat = getCategoryName(overview.biggestIncrease.category, lang);
    insights.push({
      type: 'alert',
      icon: '🔔',
      title: lang === 'kn' ? `${incCat} ಖರ್ಚು ಎಚ್ಚರಿಕೆ` : lang === 'hi' ? `${incCat} खर्च चेतावनी` : `${incCat} Spending Alert`,
      text: lang === 'kn'
        ? `ಕಳೆದ ತಿಂಗಳಿಗಿಂತ ನಿಮ್ಮ ${incCat} ಖರ್ಚು ${overview.biggestIncrease.percentage}% ಹೆಚ್ಚಾಗಿದೆ.`
        : lang === 'hi'
        ? `पिछले महीने की तुलना में आपका ${incCat} खर्च ${overview.biggestIncrease.percentage}% बढ़ गया है।`
        : `Your ${incCat} spending increased by ${overview.biggestIncrease.percentage}% compared with last month.`,
      priority: 2,
      action: lang === 'kn' ? 'ನಿಮ್ಮ ಹಣವನ್ನು ಕೇಳಿ' : lang === 'hi' ? 'अपने पैसों से पूछें' : 'Ask Your Money',
      actionQuery: lang === 'kn' ? `${incCat} ಖರ್ಚು ಏಕೆ ಹೆಚ್ಚಾಯಿತು?` : lang === 'hi' ? `${incCat} खर्च क्यों बढ़ा?` : `Why did ${incCat} increase?`,
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
      title: lang === 'kn' ? 'ಸಣ್ಣ ಪುಟ್ಟ ಖರ್ಚುಗಳು' : lang === 'hi' ? 'बार-बार होने वाले छोटे खर्च' : 'Frequent Small Expenses',
      text: lang === 'kn'
        ? `₹${smallThreshold} ಕ್ಕಿಂತ ಕಡಿಮೆ ಮೌಲ್ಯದ ಸಣ್ಣ ವಹಿವಾಟುಗಳ ಒಟ್ಟು ಮೊತ್ತ ಈ ತಿಂಗಳು ${smallExpenses.length} ವಹಿವಾಟುಗಳಲ್ಲಿ ಸುಮಾರು ₹${totalSmall.toLocaleString('en-IN')} ಆಗಿದೆ.`
        : lang === 'hi'
        ? `₹${smallThreshold} से कम के छोटे लेन-देन का कुल योग इस महीने ${smallExpenses.length} लेन-देन में लगभग ₹${totalSmall.toLocaleString('en-IN')} है।`
        : `Your small-value transactions (below ₹${smallThreshold}) total approximately ₹${totalSmall.toLocaleString('en-IN')} this month across ${smallExpenses.length} transactions.`,
      priority: 3,
      action: lang === 'kn' ? 'ವಾಟ್-ಇಫ್ ನೋಡಿ' : lang === 'hi' ? 'व्हाट-इफ देखें' : 'Explore What-If',
      actionQuery: lang === 'kn' ? `ತಿಂಗಳಿಗೆ ₹${Math.round(totalSmall/2)} ಹೆಚ್ಚು ಉಳಿಸಿದರೆ?` : lang === 'hi' ? `अगर हर महीने ₹${Math.round(totalSmall/2)} ज्यादा बचाऊं?` : `What if I save ₹${Math.round(totalSmall/2)} more every month?`,
    });
  }

  // Recurring Expense Insight
  const recurringTotal = current
    .filter(e => /netflix|spotify|prime|cloud|subscription|hotstar|youtube|apple|google/i.test(e.merchant || e.note))
    .reduce((s, e) => s + e.amount, 0);

  if (recurringTotal > 0) {
    insights.push({
      type: 'info',
      icon: '🔄',
      title: lang === 'kn' ? 'ಮರುಕಳಿಸುವ ಚಂದಾದಾರಿಕೆಗಳು' : lang === 'hi' ? 'आवर्ती सदस्यताएं' : 'Recurring Subscriptions',
      text: lang === 'kn'
        ? `ನೀವು ಮಾಸಿಕ ಸುಮಾರು ₹${recurringTotal.toLocaleString('en-IN')} ಮೊತ್ತದ ಮರುಕಳಿಸುವ ಡಿಜಿಟಲ್ ಚಂದಾದಾರಿಕೆಗಳನ್ನು ಹೊಂದಿದ್ದೀರಿ.`
        : lang === 'hi'
        ? `आपके पास कई आवर्ती सदस्यताएं हैं जिनका कुल मासिक खर्च लगभग ₹${recurringTotal.toLocaleString('en-IN')} है।`
        : `You have several recurring digital expenses totaling approximately ₹${recurringTotal.toLocaleString('en-IN')} per month.`,
      priority: 3,
      action: lang === 'kn' ? 'ಪರಿಣಾಮ ತಿಳಿಯಿರಿ' : lang === 'hi' ? 'प्रभाव देखें' : 'Explore Impact',
      actionQuery: lang === 'kn' ? `ಚಂದಾದಾರಿಕೆಗಳನ್ನು ₹${Math.round(recurringTotal/2)} ಕಡಿಮೆ ಮಾಡಿದರೆ?` : lang === 'hi' ? `अगर सब्सक्रिप्शन ₹${Math.round(recurringTotal/2)} कम कर दूं?` : `What if I reduce subscriptions by ₹${Math.round(recurringTotal/2)}?`,
    });
  }

  // Budget warnings
  if (budgets) {
    Object.entries(overview.currentCategories).forEach(([cat, amount]) => {
      const budget = budgets[cat];
      if (budget) {
        const usage = (amount / budget) * 100;
        const catName = getCategoryName(cat, lang);
        if (usage >= 90 && usage < 100) {
          insights.push({
            type: 'warning',
            icon: '⚡',
            title: lang === 'kn' ? `${catName} ಬಜೆಟ್` : lang === 'hi' ? `${catName} बजट` : `${catName} Budget`,
            text: lang === 'kn'
              ? `ನಿಮ್ಮ ${catName} ಬಜೆಟ್‌ನ ${Math.round(usage)}% ಬಳಸಲಾಗಿದೆ (₹${amount.toLocaleString('en-IN')} / ₹${budget.toLocaleString('en-IN')}). ನಿಮ್ಮಲ್ಲಿ ₹${(budget - amount).toLocaleString('en-IN')} ಉಳಿಕೆಯಾಗಿದೆ.`
              : lang === 'hi'
              ? `आपका ${catName} बजट ${Math.round(usage)}% उपयोग हो चुका है (₹${amount.toLocaleString('en-IN')} / ₹${budget.toLocaleString('en-IN')})। आपके पास ₹${(budget - amount).toLocaleString('en-IN')} शेष हैं।`
              : `Your ${catName} budget is ${Math.round(usage)}% used (₹${amount.toLocaleString('en-IN')} of ₹${budget.toLocaleString('en-IN')}). You have ₹${(budget - amount).toLocaleString('en-IN')} remaining.`,
            priority: 2,
          });
        } else if (usage >= 100) {
          insights.push({
            type: 'alert',
            icon: '🚨',
            title: lang === 'kn' ? `${catName} ಬಜೆಟ್ ಮೀರಿದೆ` : lang === 'hi' ? `${catName} बजट से अधिक` : `${catName} Over Budget`,
            text: lang === 'kn'
              ? `ನಿಮ್ಮ ${catName} ಖರ್ಚು ನಿಗದಿಪಡಿಸಿದ ಬಜೆಟ್‌ಗಿಂತ ₹${(amount - budget).toLocaleString('en-IN')} ಹೆಚ್ಚಾಗಿದೆ (${Math.round(usage)}% ಬಳಸಲಾಗಿದೆ).`
              : lang === 'hi'
              ? `आपका ${catName} खर्च तय बजट से ₹${(amount - budget).toLocaleString('en-IN')} अधिक हो गया है (${Math.round(usage)}% प्रयुक्त)।`
              : `You've exceeded your ${catName} budget by ₹${(amount - budget).toLocaleString('en-IN')} (${Math.round(usage)}% used).`,
            priority: 1,
            action: lang === 'kn' ? 'ನಿಮ್ಮ ಹಣವನ್ನು ಕೇಳಿ' : lang === 'hi' ? 'अपने पैसों से पूछें' : 'Ask Your Money',
            actionQuery: lang === 'kn' ? `${catName} ಖರ್ಚನ್ನು ₹${(amount - budget)} ಕಡಿಮೆ ಮಾಡಿದರೆ?` : lang === 'hi' ? `अगर मैं ${catName} ₹${(amount - budget)} कम करूँ?` : `What if I reduce ${catName} by ₹${(amount - budget)}?`,
          });
        }
      }
    });
  }

  return insights.sort((a, b) => a.priority - b.priority);
}

export function generateExpenseStory(expenses, income, budgets, lang = 'en') {
  const overview = getMonthlyOverview(expenses, income);
  const now = new Date();
  const monthName = getLocalizedMonthName(now.getMonth(), lang);

  const topCategoryName = overview.topCategory ? getCategoryName(overview.topCategory, lang) : '';

  if (lang === 'hi') {
    let story = `${monthName} में, आपने कुल ₹${overview.currentTotal.toLocaleString('en-IN')} खर्च किए। `;
    if (overview.topCategory) {
      story += `आपका सबसे बड़ा खर्च ${topCategoryName} में ₹${overview.topAmount.toLocaleString('en-IN')} था। `;
    }
    if (overview.previousTotal > 0) {
      const change = ((overview.currentTotal - overview.previousTotal) / overview.previousTotal * 100).toFixed(0);
      if (change > 0) {
        story += `पिछले महीने की तुलना में आपका कुल खर्च ${change}% बढ़ गया। `;
      } else if (change < 0) {
        story += `पिछले महीने की तुलना में खर्च ${Math.abs(change)}% कम हुआ — बहुत बढ़िया! `;
      }
    }
    if (overview.biggestIncrease.percentage > 15) {
      const incCat = getCategoryName(overview.biggestIncrease.category, lang);
      story += `${incCat} में सबसे अधिक ${overview.biggestIncrease.percentage}% की वृद्धि दर्ज की गई। `;
    }
    story += `खर्चों के बाद आपके पास ₹${Math.max(0, overview.savings).toLocaleString('en-IN')} शेष बचे हैं।`;
    return story;
  }

  if (lang === 'kn') {
    let story = `${monthName} ತಿಂಗಳಲ್ಲಿ, ನೀವು ಒಟ್ಟು ₹${overview.currentTotal.toLocaleString('en-IN')} ಖರ್ಚು ಮಾಡಿದ್ದೀರಿ. `;
    if (overview.topCategory) {
      story += `ನಿಮ್ಮ ಅತಿ ಹೆಚ್ಚು ಖರ್ಚು ₹${overview.topAmount.toLocaleString('en-IN')} ಮೊತ್ತದೊಂದಿಗೆ ${topCategoryName} ವರ್ಗದಲ್ಲಿದೆ. `;
    }
    if (overview.previousTotal > 0) {
      const change = ((overview.currentTotal - overview.previousTotal) / overview.previousTotal * 100).toFixed(0);
      if (change > 0) {
        story += `ಕಳೆದ ತಿಂಗಳಿಗಿಂತ ನಿಮ್ಮ ಒಟ್ಟು ಖರ್ಚು ${change}% ಹೆಚ್ಚಾಗಿದೆ. `;
      } else if (change < 0) {
        story += `ಕಳೆದ ತಿಂಗಳಿಗಿಂತ ಖರ್ಚು ${Math.abs(change)}% ಕಡಿಮೆಯಾಗಿದೆ — ಉತ್ತಮ ಉಳಿತಾಯ! `;
      }
    }
    if (overview.biggestIncrease.percentage > 15) {
      const incCat = getCategoryName(overview.biggestIncrease.category, lang);
      story += `${incCat} ವರ್ಗದಲ್ಲಿ ಅತಿ ಹೆಚ್ಚು ${overview.biggestIncrease.percentage}% ಹೆಚ್ಚಳ ಕಂಡುಬಂದಿದೆ. `;
    }
    story += `ಖರ್ಚಿನ ನಂತರ ನಿಮ್ಮಲ್ಲಿ ₹${Math.max(0, overview.savings).toLocaleString('en-IN')} ಉಳಿಕೆಯಾಗಿದೆ.`;
    return story;
  }

  let story = `In ${monthName}, you spent a total of ₹${overview.currentTotal.toLocaleString('en-IN')}. `;
  if (overview.topCategory) {
    story += `Your largest spending category was ${topCategoryName} at ₹${overview.topAmount.toLocaleString('en-IN')}. `;
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
    const incCat = getCategoryName(overview.biggestIncrease.category, lang);
    story += `${incCat} saw the biggest increase at ${overview.biggestIncrease.percentage}%. `;
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
  const { amount = 2000, months = 12, annualReturn = 12, fdRate = 7.0 } = scenario;
  return calculateWhatIfSavings({ amount, months, annualReturn, fdRate });
}

export function calculateFutureValue({ initialAmount = 10000, monthlyContribution = 2000, annualReturn = 12, years = 10, compounding = 'annually' }) {
  return calculateCombinedFutureValue({ initialAmount, monthlyContribution, annualReturn, years, compounding });
}

export function compareSpendSaveInvest(amount = 5000, timeframes = [1, 3, 5], isRecurring = false) {
  return timeframes.map(years => {
    const comparison = compareBuyNowVsInvest({
      amount,
      years,
      inflationRate: 6,
      fdRate: 7,
      sipReturnRate: 12,
      isRecurring,
    });

    return {
      years,
      spend: comparison.spendCost,
      savings: comparison.savingsAccountValue,
      fd: comparison.fixedDepositValue,
      sip: comparison.sipEquityValue,
      purchasingPowerLost: comparison.inflationLostValue,
    };
  });
}

export function processAIChat(query, expenses, income, budgets, goals, lang = 'en') {
  const q = query.toLowerCase();
  const overview = getMonthlyOverview(expenses, income);
  const patterns = analyzeSpendingPatterns(expenses, income, goals, lang);
  const now = new Date();
  const monthName = getLocalizedMonthName(now.getMonth(), lang);

  const laptopGoal = (goals && goals.find(g => g.name.toLowerCase().includes('laptop'))) || (goals && goals[0]) || {
    id: 1,
    name: 'Laptop',
    targetAmount: 60000,
    currentAmount: 35000,
  };

  // 1. Apply to Goal command
  if (
    q.includes('apply to') ||
    q.includes('add karo') ||
    q.includes('daal do') ||
    q.includes('jod do') ||
    q.includes('ಸೇರಿಸಿ') ||
    (q.includes('goal') && (q.includes('apply') || q.includes('add') || q.includes('update')))
  ) {
    const match = q.match(/(?:₹|\b)(\d[\d,]*)/);
    const amount = match ? parseInt(match[1].replace(/,/g, ''), 10) : 6000;
    const effectiveAmount = amount <= 1000 ? amount * 12 : amount;
    const prevAmount = laptopGoal.currentAmount || 35000;
    const newAmount = Math.min(laptopGoal.targetAmount, prevAmount + effectiveAmount);
    const newPercent = Math.min(100, Math.round((newAmount / laptopGoal.targetAmount) * 100));
    const remaining = Math.max(0, laptopGoal.targetAmount - newAmount);

    let text = `🎉 **Goal Updated Successfully!**\n\nApplied **+₹${effectiveAmount.toLocaleString('en-IN')}** simulated savings to your **${laptopGoal.name} Goal**!\n\n• Target: ₹${laptopGoal.targetAmount.toLocaleString('en-IN')}\n• Previously Saved: ₹${prevAmount.toLocaleString('en-IN')} (${Math.round((prevAmount / laptopGoal.targetAmount) * 100)}%)\n• New Progress: ₹${newAmount.toLocaleString('en-IN')} (${newPercent}% reached)\n• Remaining: ₹${remaining.toLocaleString('en-IN')} 🎯`;
    if (lang === 'hi') {
      text = `🎉 **लक्ष्य सफलतापूर्वक अपडेट हुआ!**\n\nआपके **${laptopGoal.name} लक्ष्य** में +₹${effectiveAmount.toLocaleString('en-IN')} की बचत जोड़ दी गई है!\n\n• कुल लक्ष्य: ₹${laptopGoal.targetAmount.toLocaleString('en-IN')}\n• पहले से बचाई गई: ₹${prevAmount.toLocaleString('en-IN')} (${Math.round((prevAmount / laptopGoal.targetAmount) * 100)}%)\n• नई प्रगति: ₹${newAmount.toLocaleString('en-IN')} (${newPercent}% पूरा हुआ!)\n• शेष राशि: ₹${remaining.toLocaleString('en-IN')} 🎯`;
    } else if (lang === 'kn') {
      text = `🎉 **ಗುರಿ ಯಶಸ್ವಿಯಾಗಿ ನವೀಕರಿಸಲಾಗಿದೆ!**\n\nನಿಮ್ಮ **${laptopGoal.name} ಗುರಿಗೆ** +₹${effectiveAmount.toLocaleString('en-IN')} ಮೊತ್ತವನ್ನು ಸೇರಿಸಲಾಗಿದೆ!\n\n• ಗುರಿಯ ಮೊತ್ತ: ₹${laptopGoal.targetAmount.toLocaleString('en-IN')}\n• ಈ ಮೊದಲು ಉಳಿಸಿದ್ದು: ₹${prevAmount.toLocaleString('en-IN')} (${Math.round((prevAmount / laptopGoal.targetAmount) * 100)}%)\n• ಹೊಸ ಪ್ರಗತಿ: ₹${newAmount.toLocaleString('en-IN')} (${newPercent}% ಪೂರ್ಣಗೊಂಡಿದೆ!)\n• ಬಾಕಿ ಮೊತ್ತ: ₹${remaining.toLocaleString('en-IN')} 🎯`;
    }

    return {
      isGoalApplied: true,
      appliedGoalId: laptopGoal.id,
      appliedAmount: effectiveAmount,
      appliedGoalName: laptopGoal.name,
      text,
      scenario: {
        changeDesc: lang === 'kn' ? `${laptopGoal.name} ಗುರಿಗೆ ₹${effectiveAmount.toLocaleString('en-IN')} ಸೇರಿಸಲಾಗಿದೆ` : lang === 'hi' ? `${laptopGoal.name} लक्ष्य में ₹${effectiveAmount.toLocaleString('en-IN')} जोड़े गए` : `Applied ₹${effectiveAmount.toLocaleString('en-IN')} to ${laptopGoal.name} Goal`,
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
        getTranslation('chat_followup_laptop', lang),
        getTranslation('chat_followup_invest', lang),
        getTranslation('chat_followup_small', lang),
        getTranslation('chat_followup_pattern', lang),
      ],
    };
  }

  // 2. AI Spending Pattern / DNA Query
  if (
    q.includes('pattern') ||
    q.includes('dna') ||
    q.includes('behaviour') ||
    q.includes('पैटर्न') ||
    q.includes('मಾದರಿ') ||
    q.includes('spending habit')
  ) {
    const topCat = patterns.activeCategories[0] || { name: getCategoryName('food', lang), count: 14, total: 4200, smallCount: 11 };
    const shoppingCat = patterns.activeCategories.find(c => c.name.toLowerCase().includes('shop') || c.catId === 'shopping') || { name: getCategoryName('shopping', lang), count: 3, total: 9300, avg: 3100 };

    let text = `🧬 **Your AI Spending Pattern Analysis:**\n\n• **Frequency**: ${topCat.name} has ${topCat.count} transactions totaling ₹${topCat.total.toLocaleString('en-IN')} (${topCat.smallCount || 11} small purchases <₹250).\n• **Amount Pattern**: ${shoppingCat.name} has only ${shoppingCat.count} transactions (₹${shoppingCat.total.toLocaleString('en-IN')}) → mostly large purchases (avg ₹${(shoppingCat.avg || 3100).toLocaleString('en-IN')}).\n• **Small Expenses**: ₹${patterns.totalSmallValue.toLocaleString('en-IN')} collectively spent across ${patterns.allSmallCount} transactions.\n• **Time Pattern**: ${patterns.weekendPct}% of discretionary spending occurs over weekends.\n\n💡 **Actionable Takeaway**: Reducing small micro-expenses by just ₹500/month creates **₹6,000/year**, which can directly boost your **${laptopGoal.name} Goal**!`;
    if (lang === 'hi') {
      text = `🧬 **आपका एआई खर्च पैटर्न विश्लेषण:**\n\n• **आवृत्ति**: ${topCat.name} में कुल ₹${topCat.total.toLocaleString('en-IN')} के ${topCat.count} लेन-देन हुए (${topCat.smallCount || 11} छोटे खर्च <₹250)।\n• **राशि पैटर्न**: ${shoppingCat.name} में केवल ${shoppingCat.count} लेन-देन (₹${shoppingCat.total.toLocaleString('en-IN')}) → मुख्य रूप से बड़े खर्च (औसत ₹${(shoppingCat.avg || 3100).toLocaleString('en-IN')})।\n• **छोटे खर्च**: चाय, स्नैक्स और आवागमन में ${patterns.allSmallCount} लेन-देन में कुल ₹${patterns.totalSmallValue.toLocaleString('en-IN')} खर्च हुए।\n• **सप्ताहांत**: आपका ${patterns.weekendPct}% विवेकाधीन खर्च शुक्रवार से रविवार के बीच होता है।\n\n💡 **कार्रवाई योग्य लाभ**: छोटे खर्चों में प्रति माह सिर्फ ₹500 की कटौती से साल में **₹6,000** की बचत होगी, जो आपके **${laptopGoal.name} लक्ष्य** को गति देगी!`;
    } else if (lang === 'kn') {
      text = `🧬 **ನಿಮ್ಮ ಎಐ ಖರ್ಚಿನ ಮಾದರಿಯ ವಿಶ್ಲೇಷಣೆ:**\n\n• **ಆವರ್ತನ**: ${topCat.name} ವರ್ಗದಲ್ಲಿ ₹${topCat.total.toLocaleString('en-IN')} ಮೊತ್ತದ ${topCat.count} ವಹಿವಾಟುಗಳು (${topCat.smallCount || 11} ಸಣ್ಣ ಖರೀದಿಗಳು <₹250).\n• **ಮೊತ್ತದ ಮಾದರಿ**: ${shoppingCat.name} ನಲ್ಲಿ ಕೇವಲ ${shoppingCat.count} ವಹಿವಾಟುಗಳು (₹${shoppingCat.total.toLocaleString('en-IN')}) → ಹೆಚ್ಚಾಗಿ ದೊಡ್ಡ ಮೊತ್ತದ ಖರೀದಿಗಳು (ಸರಾಸರಿ ₹${(shoppingCat.avg || 3100).toLocaleString('en-IN')}).\n• **ಸಣ್ಣ ಖರ್ಚುಗಳು**: ${patterns.allSmallCount} ವಹಿವಾಟುಗಳಲ್ಲಿ ಒಟ್ಟು ₹${patterns.totalSmallValue.toLocaleString('en-IN')} ಸಣ್ಣ ಖರ್ಚುಗಳಾಗಿವೆ.\n• **ವಾರಾಂತ್ಯ**: ನಿಮ್ಮ ${patterns.weekendPct}% ಖರ್ಚು ವಾರಾಂತ್ಯದಲ್ಲಿ ಸಂಭವಿಸುತ್ತದೆ.\n\n💡 **ಪ್ರಯೋಜನ**: ಸಣ್ಣ ಖರ್ಚುಗಳಿಂದ ತಿಂಗಳಿಗೆ ₹500 ಉಳಿಸಿದರೆ ವರ್ಷಕ್ಕೆ **₹6,000** ಉಳಿತಾಯವಾಗುತ್ತದೆ, ಇದು ನಿಮ್ಮ **${laptopGoal.name} ಗುರಿ**ಯನ್ನು ತಲುಪಲು ವೇಗ ನೀಡುತ್ತದೆ!`;
    }

    return {
      text,
      scenario: {
        changeDesc: lang === 'kn' ? `${topCat.name} ಖರ್ಚನ್ನು ₹500/ತಿಂಗಳು ಕಡಿಮೆ ಮಾಡಿ` : lang === 'hi' ? `${topCat.name} खर्च ₹500/माह कम करें` : `Reduce ${topCat.name} spending by ₹500/month`,
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
        lang === 'kn' ? `ಈ ₹500 ಅನ್ನು ${laptopGoal.name} ಗುರಿಗೆ ಸೇರಿಸಿ 💻` : lang === 'hi' ? `इस ₹500 को ${laptopGoal.name} लक्ष्य में जोड़ें 💻` : `Apply this ₹500 to ${laptopGoal.name} Goal 💻`,
        getTranslation('chat_followup_small', lang),
        getTranslation('chat_followup_invest', lang),
        lang === 'kn' ? 'ಬದಲಿಗೆ ₹1,000 ಪ್ರಯತ್ನಿಸಿ 🔄' : lang === 'hi' ? 'इसके बजाय ₹1,000 आज़माएँ 🔄' : 'Try ₹1,000 instead 🔄',
      ],
    };
  }

  // 3. Small Expenses query
  if (
    q.includes('small') ||
    q.includes('frequent') ||
    q.includes('chote') ||
    q.includes('chota') ||
    q.includes('micro') ||
    q.includes('ಸಣ್ಣ')
  ) {
    const smallThreshold = 250;
    const currentMonth = getMonthExpenses(expenses, 0);
    const smallExpenses = currentMonth.filter(e => e.amount <= smallThreshold);
    const totalSmall = smallExpenses.reduce((s, e) => s + e.amount, 0);

    const sampleList = smallExpenses.slice(0, 5).map(e => `• ${e.name || e.merchant}: ₹${e.amount}`).join('\n');

    let text = `Your recorded small-value transactions (below ₹${smallThreshold}) total approximately **₹${totalSmall.toLocaleString('en-IN')}** this month across **${smallExpenses.length} transactions**.\n\nRecent examples:\n${sampleList}\n\n💡 *Notice:* These micro-expenses feel small individually (₹50–₹120) but collectively equal over ₹${totalSmall.toLocaleString('en-IN')} per month!`;
    if (lang === 'hi') {
      text = `आपके द्वारा दर्ज किए गए ₹${smallThreshold} से कम के छोटे लेन-देन इस महीने **${smallExpenses.length} लेन-देन** में कुल **₹${totalSmall.toLocaleString('en-IN')}** हैं।\n\nहाल के उदाहरण:\n${sampleList}\n\n💡 *ध्यान दें:* ये छोटे खर्च व्यक्तिगत रूप से छोटे लगते हैं (₹50–₹120) लेकिन मिलकर प्रति माह ₹${totalSmall.toLocaleString('en-IN')} से अधिक हो जाते हैं!`;
    } else if (lang === 'kn') {
      text = `ದಾಖಲಾದ ₹${smallThreshold} ಕ್ಕಿಂತ ಕಡಿಮೆ ಮೌಲ್ಯದ ಸಣ್ಣ ವಹಿವಾಟುಗಳು ಈ ತಿಂಗಳು **${smallExpenses.length} ವಹಿವಾಟುಗಳಲ್ಲಿ** ಒಟ್ಟು **₹${totalSmall.toLocaleString('en-IN')}** ಆಗಿವೆ.\n\nಇತ್ತೀಚಿನ ಉದಾಹರಣೆಗಳು:\n${sampleList}\n\n💡 *ಗಮನಿಸಿ:* ಈ ಸಣ್ಣ ಖರ್ಚುಗಳು ವೈಯಕ್ತಿಕವಾಗಿ ಚಿಕ್ಕದಾಗಿ ಕಾಣುತ್ತವೆ (₹50–₹120), ಆದರೆ ಒಟ್ಟಾರೆಯಾಗಿ ತಿಂಗಳಿಗೆ ₹${totalSmall.toLocaleString('en-IN')} ಗಿಂತ ಹೆಚ್ಚಾಗುತ್ತವೆ!`;
    }

    return {
      text,
      followUps: [
        lang === 'kn' ? '₹500 ಕಡಿಮೆ ಖರ್ಚು ಮಾಡಿದರೆ? 💡' : lang === 'hi' ? 'अगर ₹500 कम खर्च करूँ तो? 💡' : 'What if I reduce spending by ₹500? 💡',
        lang === 'kn' ? 'ತಿಂಗಳಿಗೆ ₹1,000 ಹೆಚ್ಚು ಉಳಿಸಿದರೆ? 📈' : lang === 'hi' ? 'अगर हर महीने ₹1,000 ज्यादा बचाऊं? 📈' : 'What if I save ₹1,000 more every month? 📈',
        getTranslation('chat_followup_pattern', lang),
      ],
    };
  }

  // 4. Reduce spending / What-if query
  if (
    q.includes('kam') ||
    q.includes('reduce') ||
    q.includes('cut') ||
    q.includes('less') ||
    q.includes('bachaye') ||
    q.includes('bachega') ||
    q.includes('what if i spend') ||
    q.includes('what if i reduce') ||
    q.includes('agar') ||
    q.includes('ಕಡಿಮೆ') ||
    q.includes('ಉಳಿಸಿದರೆ')
  ) {
    const match = q.match(/(?:₹|\b)(\d[\d,]*)/);
    let amount = match ? parseInt(match[1].replace(/,/g, ''), 10) : 500;
    if (amount <= 0) amount = 500;

    let catMentioned = getCategoryName('food', lang);
    for (const cat of CATEGORIES) {
      if (q.includes(cat.name.toLowerCase()) || (cat.id === 'food' && (q.includes('khana') || q.includes('ಊಟ') || q.includes('swiggy') || q.includes('zomato')))) {
        catMentioned = getCategoryName(cat.id, lang);
        break;
      }
    }

    const sixMonths = amount * 6;
    const twelveMonths = amount * 12;
    const investedValue = Math.round(amount * ((Math.pow(1 + 0.01, 12) - 1) / 0.01) * 1.01);
    const projectedGoal = Math.min(laptopGoal.targetAmount, laptopGoal.currentAmount + twelveMonths);

    let text = `Reducing your ${catMentioned} spending by ₹${amount.toLocaleString('en-IN')} per month would create a **₹${twelveMonths.toLocaleString('en-IN')} difference over 12 months** (₹${sixMonths.toLocaleString('en-IN')} in 6 months).\n\nThis saved amount could directly boost your **${laptopGoal.name} Goal** from ${Math.round((laptopGoal.currentAmount / laptopGoal.targetAmount) * 100)}% to ${Math.round((projectedGoal / laptopGoal.targetAmount) * 100)}%!`;
    if (lang === 'hi') {
      text = `${catMentioned} खर्च में प्रति माह ₹${amount.toLocaleString('en-IN')} की कटौती करने पर **12 महीनों में ₹${twelveMonths.toLocaleString('en-IN')} की बचत** होगी (6 महीनों में ₹${sixMonths.toLocaleString('en-IN')})।\n\nयह बचाई गई राशि सीधे आपके **${laptopGoal.name} लक्ष्य** को ${Math.round((laptopGoal.currentAmount / laptopGoal.targetAmount) * 100)}% से बढ़ाकर ${Math.round((projectedGoal / laptopGoal.targetAmount) * 100)}% कर सकती है!`;
    } else if (lang === 'kn') {
      text = `${catMentioned} ಖರ್ಚನ್ನು ತಿಂಗಳಿಗೆ ₹${amount.toLocaleString('en-IN')} ಕಡಿಮೆ ಮಾಡುವುದರಿಂದ **12 ತಿಂಗಳುಗಳಲ್ಲಿ ₹${twelveMonths.toLocaleString('en-IN')} ಉಳಿತಾಯವಾಗುತ್ತದೆ** (6 ತಿಂಗಳಲ್ಲಿ ₹${sixMonths.toLocaleString('en-IN')}).\n\nಈ ಉಳಿಸಿದ ಮೊತ್ತವು ನಿಮ್ಮ **${laptopGoal.name} ಗುರಿ**ಯನ್ನು ${Math.round((laptopGoal.currentAmount / laptopGoal.targetAmount) * 100)}% ರಿಂದ ${Math.round((projectedGoal / laptopGoal.targetAmount) * 100)}% ಗೆ ಹೆಚ್ಚಿಸಬಹುದು!`;
    }

    return {
      text,
      scenario: {
        changeDesc: lang === 'kn' ? `${catMentioned} ಖರ್ಚನ್ನು ₹${amount.toLocaleString('en-IN')}/ತಿಂಗಳು ಕಡಿಮೆ ಮಾಡಿ` : lang === 'hi' ? `${catMentioned} खर्च ₹${amount.toLocaleString('en-IN')}/माह कम करें` : `Reduce ${catMentioned} spending by ₹${amount.toLocaleString('en-IN')}/month`,
        monthly: amount,
        months: 12,
        annualSavings: twelveMonths,
        investedValue,
        goalImpact: true,
        targetGoalName: laptopGoal.name,
        targetGoalId: laptopGoal.id,
        currentGoalAmount: laptopGoal.currentAmount,
        targetGoalAmount: laptopGoal.targetAmount,
        projectedGoalAmount: projectedGoal,
      },
      followUps: [
        lang === 'kn' ? `ಈ ₹${amount} ಅನ್ನು ${laptopGoal.name} ಗುರಿಗೆ ಸೇರಿಸಿ 💻` : lang === 'hi' ? `इस ₹${amount} को ${laptopGoal.name} लक्ष्य में जोड़ें 💻` : `Apply this ₹${amount} to ${laptopGoal.name} Goal 💻`,
        lang === 'kn' ? 'ಆ ಮೊತ್ತವನ್ನು ಹೂಡಿಕೆ ಮಾಡಿದರೆ? 📈' : lang === 'hi' ? 'अगर उस राशि को निवेश करूँ तो? 📈' : 'What if I invest that amount? 📈',
        lang === 'kn' ? 'ಬದಲಿಗೆ ₹1,000 ಪ್ರಯತ್ನಿಸಿ 🔄' : lang === 'hi' ? 'इसके बजाय ₹1,000 आज़माएँ 🔄' : 'Try ₹1,000 instead 🔄',
      ],
    };
  }

  // 5. Invest / SIP query
  if (q.includes('invest') || q.includes('sip') || q.includes('nivesh') || q.includes('ಹೂಡಿಕೆ') || q.includes('निवेश')) {
    const match = q.match(/(?:₹|\b)(\d[\d,]*)/);
    const amount = match ? parseInt(match[1].replace(/,/g, ''), 10) : 2000;
    const investedValue1Yr = Math.round(amount * ((Math.pow(1 + 0.01, 12) - 1) / 0.01) * 1.01);
    const investedValue5Yr = Math.round(amount * ((Math.pow(1 + 0.01, 60) - 1) / 0.01) * 1.01);

    let text = `If you invest **₹${amount.toLocaleString('en-IN')} per month** in an illustrative diversified investment scenario (assuming 12% p.a. returns):\n\n• **1 Year**: Contributed ₹${(amount * 12).toLocaleString('en-IN')} → Est. Value: ₹${investedValue1Yr.toLocaleString('en-IN')}\n• **5 Years**: Contributed ₹${(amount * 60).toLocaleString('en-IN')} → Est. Value: ₹${investedValue5Yr.toLocaleString('en-IN')}\n\n*Note: Illustrative estimate — actual market returns may vary.*`;
    if (lang === 'hi') {
      text = `यदि आप 12% वार्षिक रिटर्न के उदाहरणात्मक परिदृश्य में **₹${amount.toLocaleString('en-IN')} प्रति माह** निवेश करते हैं:\n\n• **1 वर्ष**: कुल जमा ₹${(amount * 12).toLocaleString('en-IN')} → अनुमानित मूल्य: ₹${investedValue1Yr.toLocaleString('en-IN')}\n• **5 वर्ष**: कुल जमा ₹${(amount * 60).toLocaleString('en-IN')} → अनुमानित मूल्य: ₹${investedValue5Yr.toLocaleString('en-IN')}\n\n*नोट: यह उदाहरणात्मक अनुमान है — वास्तविक बाजार रिटर्न भिन्न हो सकते हैं।*`;
    } else if (lang === 'kn') {
      text = `ನೀವು 12% ವಾರ್ಷಿಕ ಆದಾಯದ ಸನ್ನಿವೇಶದಲ್ಲಿ **ತಿಂಗಳಿಗೆ ₹${amount.toLocaleString('en-IN')}** ಹೂಡಿಕೆ ಮಾಡಿದರೆ:\n\n• **1 ವರ್ಷ**: ಒಟ್ಟು ಜಮೆ ₹${(amount * 12).toLocaleString('en-IN')} → ಅಂದಾಜು ಮೌಲ್ಯ: ₹${investedValue1Yr.toLocaleString('en-IN')}\n• **5 ವರ್ಷಗಳು**: ಒಟ್ಟು ಜಮೆ ₹${(amount * 60).toLocaleString('en-IN')} → ಅಂದಾಜು ಮೌಲ್ಯ: ₹${investedValue5Yr.toLocaleString('en-IN')}\n\n*ಸೂಚನೆ: ಇದು ವಿವರಣಾತ್ಮಕ ಅಂದಾಜು — ಮಾರುಕಟ್ಟೆಯ ನೈಜ ಆದಾಯಗಳು ಬದಲಾಗಬಹುದು.*`;
    }

    return {
      text,
      scenario: {
        changeDesc: lang === 'kn' ? `SIP ಮೂಲಕ ₹${amount.toLocaleString('en-IN')}/ತಿಂಗಳು ಹೂಡಿಕೆ ಮಾಡಿ` : lang === 'hi' ? `SIP के माध्यम से ₹${amount.toLocaleString('en-IN')}/माह निवेश करें` : `Invest ₹${amount.toLocaleString('en-IN')}/month via SIP`,
        monthly: amount,
        months: 12,
        annualSavings: amount * 12,
        investedValue: investedValue1Yr,
        goalImpact: false,
      },
      followUps: [
        lang === 'kn' ? '5 ಮತ್ತು 10 ವರ್ಷಗಳನ್ನು ಹೋಲಿಸಿ 📈' : lang === 'hi' ? '5 बनाम 10 वर्षों की तुलना करें 📈' : 'Compare 5 vs 10 years 📈',
        lang === 'kn' ? `ಬದಲಿಗೆ ${laptopGoal.name} ಗುರಿಗೆ ಸೇರಿಸಿ 🎯` : lang === 'hi' ? `इसके बजाय ${laptopGoal.name} लक्ष्य में जोड़ें 🎯` : `Apply to ${laptopGoal.name} Goal instead 🎯`,
        lang === 'kn' ? 'ಊಟದ ಖರ್ಚನ್ನು ₹500 ಕಡಿಮೆ ಮಾಡಿದರೆ? 🍕' : lang === 'hi' ? 'अगर भोजन खर्च ₹500 कम करूँ? 🍕' : 'What if I reduce food spending by ₹500? 🍕',
      ],
    };
  }

  // 6. Default response
  let defaultText = `Here is your quick financial status for ${monthName}:\n• Total Expenses: ₹${overview.currentTotal.toLocaleString('en-IN')}\n• Top Category: ${getCategoryName(overview.topCategory, lang)} (₹${overview.topAmount.toLocaleString('en-IN')})\n• Small Micro-Expenses: ₹${patterns.totalSmallValue.toLocaleString('en-IN')} across ${patterns.allSmallCount} transactions\n• Estimated Remaining: ₹${Math.max(0, overview.savings).toLocaleString('en-IN')}`;
  if (lang === 'hi') {
    defaultText = `${monthName} के लिए आपकी त्वरित वित्तीय स्थिति:\n• कुल खर्च: ₹${overview.currentTotal.toLocaleString('en-IN')}\n• प्रमुख श्रेणी: ${getCategoryName(overview.topCategory, lang)} (₹${overview.topAmount.toLocaleString('en-IN')})\n• छोटे खर्च: ₹${patterns.totalSmallValue.toLocaleString('en-IN')} (${patterns.allSmallCount} लेन-देन)\n• अनुमानित शेष बचत: ₹${Math.max(0, overview.savings).toLocaleString('en-IN')}`;
  } else if (lang === 'kn') {
    defaultText = `${monthName} ತಿಂಗಳ ನಿಮ್ಮ ಆರ್ಥಿಕ ಸ್ಥಿತಿಯ ಸಾರಾಂಶ:\n• ಒಟ್ಟು ಖರ್ಚು: ₹${overview.currentTotal.toLocaleString('en-IN')}\n• ಪ್ರಮುಖ ವರ್ಗ: ${getCategoryName(overview.topCategory, lang)} (₹${overview.topAmount.toLocaleString('en-IN')})\n• ಸಣ್ಣ ಖರ್ಚುಗಳು: ₹${patterns.totalSmallValue.toLocaleString('en-IN')} (${patterns.allSmallCount} ವಹಿವಾಟುಗಳು)\n• ಅಂದಾಜು ಉಳಿಕೆ: ₹${Math.max(0, overview.savings).toLocaleString('en-IN')}`;
  }

  return {
    text: defaultText,
    followUps: [
      lang === 'kn' ? '₹500 ಕಡಿಮೆ ಖರ್ಚು ಮಾಡಿದರೆ? 💡' : lang === 'hi' ? 'अगर ₹500 कम खर्च करूँ तो? 💡' : 'What if I reduce spending by ₹500? 💡',
      getTranslation('chat_followup_small', lang),
      getTranslation('chat_followup_pattern', lang),
      getTranslation('chat_followup_invest', lang),
    ],
  };
}
