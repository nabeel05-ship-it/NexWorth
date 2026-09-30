// Demo data for NexWorth - AI Powered Personal Expense Analysis & Financial Decision Simulator

export const CATEGORIES = [
  { id: 'food', name: 'Food', icon: '🍕', color: '#FF6B6B' },
  { id: 'shopping', name: 'Shopping', icon: '🛍️', color: '#FC6C26' },
  { id: 'travel', name: 'Travel', icon: '✈️', color: '#4ECDC4' },
  { id: 'bills', name: 'Bills', icon: '📄', color: '#FFF4D6' },
  { id: 'education', name: 'Education', icon: '📚', color: '#45B7D1' },
  { id: 'entertainment', name: 'Entertainment', icon: '🎬', color: '#FF9FF3' },
  { id: 'health', name: 'Health', icon: '💊', color: '#54A0FF' },
  { id: 'other', name: 'Other', icon: '📌', color: '#A0A0B0' },
];

export const DEFAULT_USER = {
  name: 'User',
  monthlyIncome: 25000,
  currency: '₹',
  budgets: {
    food: 5000,
    shopping: 7000,
    travel: 3000,
    bills: 3000,
    education: 2000,
    entertainment: 2000,
    health: 1500,
    other: 1500,
  },
};

// Generate demo expenses for current and previous months
function generateDemoExpenses() {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;

  const twoMonthsAgo = prevMonth === 0 ? 11 : prevMonth - 1;
  const twoMonthsAgoYear = prevMonth === 0 ? prevYear - 1 : prevYear;

  const expenses = [];
  let id = 1;

  // Current month expenses
  const currentMonthExpenses = [
    { name: 'Swiggy Order', amount: 450, category: 'food', day: 2, note: 'Dinner' },
    { name: 'Zomato Order', amount: 380, category: 'food', day: 5, note: 'Lunch with friends' },
    { name: 'Grocery Store', amount: 1200, category: 'food', day: 8, note: 'Weekly groceries' },
    { name: 'Restaurant', amount: 850, category: 'food', day: 14, note: 'Birthday dinner' },
    { name: 'Cafe Coffee Day', amount: 320, category: 'food', day: 18, note: 'Coffee meeting' },
    { name: 'Grocery Store', amount: 1000, category: 'food', day: 22, note: 'Monthly supplies' },
    { name: 'Amazon', amount: 2500, category: 'shopping', day: 3, note: 'Phone case + charger' },
    { name: 'Nike Store', amount: 5000, category: 'shopping', day: 10, note: 'Running shoes' },
    { name: 'Myntra', amount: 1800, category: 'shopping', day: 16, note: 'T-shirts' },
    { name: 'Uber', amount: 350, category: 'travel', day: 4, note: 'Office commute' },
    { name: 'Ola', amount: 280, category: 'travel', day: 9, note: 'Market trip' },
    { name: 'Metro Card', amount: 500, category: 'travel', day: 12, note: 'Monthly recharge' },
    { name: 'Petrol', amount: 800, category: 'travel', day: 20, note: 'Bike fuel' },
    { name: 'Electricity Bill', amount: 1200, category: 'bills', day: 5, note: 'Monthly bill' },
    { name: 'Mobile Recharge', amount: 599, category: 'bills', day: 7, note: 'Monthly plan' },
    { name: 'WiFi Bill', amount: 700, category: 'bills', day: 7, note: 'Internet' },
    { name: 'Udemy Course', amount: 499, category: 'education', day: 6, note: 'React course' },
    { name: 'Books', amount: 800, category: 'education', day: 15, note: 'Programming books' },
    { name: 'Netflix', amount: 649, category: 'entertainment', day: 1, note: 'Monthly subscription' },
    { name: 'Movie Tickets', amount: 600, category: 'entertainment', day: 11, note: 'Weekend movie' },
    { name: 'Pharmacy', amount: 350, category: 'health', day: 13, note: 'Medicines' },
    { name: 'Gym Membership', amount: 1500, category: 'health', day: 1, note: 'Monthly fee' },
  ];

  currentMonthExpenses.forEach(exp => {
    expenses.push({
      id: id++,
      name: exp.name,
      amount: exp.amount,
      category: exp.category,
      date: new Date(currentYear, currentMonth, exp.day).toISOString(),
      note: exp.note || '',
    });
  });

  // Previous month expenses (slightly different to show trends)
  const prevMonthExpenses = [
    { name: 'Swiggy Order', amount: 520, category: 'food', day: 3 },
    { name: 'Zomato Order', amount: 410, category: 'food', day: 6 },
    { name: 'Grocery Store', amount: 1100, category: 'food', day: 9 },
    { name: 'Restaurant', amount: 700, category: 'food', day: 15 },
    { name: 'Street Food', amount: 250, category: 'food', day: 19 },
    { name: 'Grocery Store', amount: 950, category: 'food', day: 23 },
    { name: 'Amazon', amount: 1500, category: 'shopping', day: 4 },
    { name: 'Flipkart', amount: 3500, category: 'shopping', day: 12 },
    { name: 'Uber', amount: 420, category: 'travel', day: 5 },
    { name: 'Ola', amount: 350, category: 'travel', day: 10 },
    { name: 'Metro Card', amount: 500, category: 'travel', day: 13 },
    { name: 'Electricity Bill', amount: 1100, category: 'bills', day: 5 },
    { name: 'Mobile Recharge', amount: 599, category: 'bills', day: 7 },
    { name: 'WiFi Bill', amount: 700, category: 'bills', day: 8 },
    { name: 'Online Course', amount: 399, category: 'education', day: 8 },
    { name: 'Netflix', amount: 649, category: 'entertainment', day: 1 },
    { name: 'Spotify', amount: 119, category: 'entertainment', day: 1 },
    { name: 'Pharmacy', amount: 280, category: 'health', day: 14 },
    { name: 'Doctor Visit', amount: 500, category: 'health', day: 20 },
  ];

  prevMonthExpenses.forEach(exp => {
    expenses.push({
      id: id++,
      name: exp.name,
      amount: exp.amount,
      category: exp.category,
      date: new Date(prevYear, prevMonth, exp.day).toISOString(),
      note: exp.note || '',
    });
  });

  // Two months ago
  const twoMonthsAgoExpenses = [
    { name: 'Swiggy', amount: 400, category: 'food', day: 2 },
    { name: 'Grocery', amount: 1050, category: 'food', day: 8 },
    { name: 'Restaurant', amount: 600, category: 'food', day: 16 },
    { name: 'Cafe', amount: 280, category: 'food', day: 21 },
    { name: 'Amazon', amount: 2000, category: 'shopping', day: 5 },
    { name: 'Local Market', amount: 1200, category: 'shopping', day: 18 },
    { name: 'Uber', amount: 300, category: 'travel', day: 3 },
    { name: 'Metro', amount: 500, category: 'travel', day: 12 },
    { name: 'Electricity', amount: 1050, category: 'bills', day: 5 },
    { name: 'Mobile', amount: 599, category: 'bills', day: 7 },
    { name: 'WiFi', amount: 700, category: 'bills', day: 7 },
    { name: 'Netflix', amount: 649, category: 'entertainment', day: 1 },
    { name: 'Gym', amount: 1500, category: 'health', day: 1 },
  ];

  twoMonthsAgoExpenses.forEach(exp => {
    expenses.push({
      id: id++,
      name: exp.name,
      amount: exp.amount,
      category: exp.category,
      date: new Date(twoMonthsAgoYear, twoMonthsAgo, exp.day).toISOString(),
      note: exp.note || '',
    });
  });

  return expenses;
}

export const DEMO_EXPENSES = generateDemoExpenses();

export const DEMO_GOALS = [
  {
    id: 1,
    name: 'Laptop',
    targetAmount: 60000,
    currentAmount: 35000,
    targetDate: new Date(new Date().getFullYear() + 1, 2, 1).toISOString(),
    icon: '💻',
  },
  {
    id: 2,
    name: 'Travel Fund',
    targetAmount: 30000,
    currentAmount: 8000,
    targetDate: new Date(new Date().getFullYear() + 1, 5, 1).toISOString(),
    icon: '✈️',
  },
  {
    id: 3,
    name: 'Emergency Fund',
    targetAmount: 50000,
    currentAmount: 22000,
    targetDate: new Date(new Date().getFullYear() + 1, 11, 1).toISOString(),
    icon: '🛡️',
  },
  {
    id: 4,
    name: 'Online Course',
    targetAmount: 20000,
    currentAmount: 14000,
    targetDate: new Date(new Date().getFullYear(), new Date().getMonth() + 4, 1).toISOString(),
    icon: '📚',
  },
];

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];
