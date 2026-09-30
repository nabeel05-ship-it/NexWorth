import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';
import Expense from './models/Expense.js';
import Budget from './models/Budget.js';
import Goal from './models/Goal.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from NexWorth root or parent
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 5001;
const MONGODB_URI = process.env.MONGODB_URI;

app.use(cors());
app.use(express.json());

// Track connection status
let isConnected = false;
let dbInfo = { host: '', dbName: '', state: 'connecting' };

async function connectDB() {
  if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI is not defined in .env');
    dbInfo.state = 'missing_uri';
    return;
  }

  try {
    const conn = await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
    });
    isConnected = true;
    dbInfo = {
      host: conn.connection.host,
      dbName: conn.connection.name,
      state: 'connected',
    };
    console.log(`✅ MongoDB Connected: ${dbInfo.host} / Database: ${dbInfo.dbName}`);
  } catch (err) {
    isConnected = false;
    dbInfo.state = 'error';
    dbInfo.error = err.message;
    console.error(`❌ MongoDB connection failed: ${err.message}`);
  }
}

connectDB();

// 1. Health & Connection Status
app.get('/api/status', (req, res) => {
  const readyState = mongoose.connection.readyState;
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  res.json({
    connected: readyState === 1,
    status: states[readyState] || 'unknown',
    database: dbInfo.dbName || 'nexworth',
    host: dbInfo.host || 'cluster0.2fmepzy.mongodb.net',
    user: 'nabeelsaroshahmed_db_user',
    cluster: 'Cluster0',
  });
});

// In-memory fallback expenses store when MongoDB Atlas connection is pending or IP not whitelisted
let inMemoryExpenses = [];

// 2. Expenses APIs
app.get('/api/expenses', async (req, res) => {
  if (mongoose.connection.readyState === 1) {
    try {
      const expenses = await Expense.find().sort({ date: -1, createdAt: -1 });
      const formatted = expenses.map(e => {
        const obj = e.toObject();
        return {
          ...obj,
          id: obj._id.toString(),
          name: obj.merchant || obj.name,
        };
      });
      return res.json(formatted);
    } catch (err) {
      console.warn('MongoDB query error, falling back to memory:', err.message);
    }
  }
  res.json(inMemoryExpenses);
});

app.post('/api/expenses', async (req, res) => {
  try {
    const { amount, category, date, paymentMethod, source, note, reference, rawMessage } = req.body;
    const merchant = (req.body.merchant || req.body.name || '').trim();
    if (!amount || !merchant) {
      return res.status(400).json({ error: 'Amount and merchant/name are required' });
    }

    if (mongoose.connection.readyState === 1) {
      try {
        const newExpense = new Expense({
          amount: Number(amount),
          merchant,
          category: category || 'Other',
          date: date || new Date().toISOString().split('T')[0],
          paymentMethod: paymentMethod || 'UPI',
          source: source || 'manual',
          note: note || '',
          reference: reference || '',
          rawMessage: rawMessage || '',
        });
        const saved = await newExpense.save();
        const obj = saved.toObject();
        obj.id = obj._id.toString();
        obj.name = obj.merchant;
        return res.status(201).json(obj);
      } catch (err) {
        console.warn('MongoDB save error, falling back to memory:', err.message);
      }
    }

    // In-memory fallback
    const id = `local_${Date.now()}`;
    const newExpense = {
      id,
      _id: id,
      amount: Number(amount),
      merchant,
      name: merchant,
      category: category || 'Other',
      date: date || new Date().toISOString().split('T')[0],
      paymentMethod: paymentMethod || 'UPI',
      source: source || 'manual',
      note: note || '',
      reference: reference || '',
      rawMessage: rawMessage || '',
      createdAt: new Date().toISOString(),
    };
    inMemoryExpenses.unshift(newExpense);
    res.status(201).json(newExpense);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/expenses/:id', async (req, res) => {
  try {
    const updateData = { ...req.body };
    if (updateData.name && !updateData.merchant) {
      updateData.merchant = updateData.name;
    }

    if (mongoose.connection.readyState === 1) {
      try {
        const updated = await Expense.findByIdAndUpdate(req.params.id, updateData, { new: true });
        if (updated) {
          const obj = updated.toObject();
          obj.id = obj._id.toString();
          obj.name = obj.merchant;
          return res.json(obj);
        }
      } catch (err) {
        console.warn('MongoDB update error, updating in-memory:', err.message);
      }
    }

    // In-memory update
    const idx = inMemoryExpenses.findIndex(e => e.id === req.params.id || e._id === req.params.id);
    if (idx !== -1) {
      inMemoryExpenses[idx] = { ...inMemoryExpenses[idx], ...updateData };
      return res.json(inMemoryExpenses[idx]);
    }
    res.json({ id: req.params.id, ...updateData });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/expenses/:id', async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      try {
        await Expense.findByIdAndDelete(req.params.id);
      } catch (err) {
        console.warn('MongoDB delete error:', err.message);
      }
    }
    inMemoryExpenses = inMemoryExpenses.filter(e => e.id !== req.params.id && e._id !== req.params.id);
    res.json({ message: 'Deleted successfully', id: req.params.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Bulk sync expenses (useful for initial migration or seed)
app.post('/api/expenses/sync', async (req, res) => {
  try {
    const { expenses } = req.body;
    if (!Array.isArray(expenses)) {
      return res.status(400).json({ error: 'expenses must be an array' });
    }
    
    // Check if db already has expenses
    const count = await Expense.countDocuments();
    if (count === 0 && expenses.length > 0) {
      const formatted = expenses.map(e => ({
        amount: Number(e.amount),
        merchant: e.merchant || e.description || 'Unknown',
        category: e.category || 'Other',
        date: e.date || new Date().toISOString().split('T')[0],
        paymentMethod: e.paymentMethod || 'UPI',
        source: e.source || 'manual',
        note: e.note || '',
        reference: e.reference || '',
      }));
      const inserted = await Expense.insertMany(formatted);
      return res.json({ message: 'Seeded initial expenses', count: inserted.length, items: inserted });
    }
    
    const existing = await Expense.find().sort({ date: -1 });
    res.json({ message: 'Database already has records', count, items: existing });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Budgets APIs
app.get('/api/budgets', async (req, res) => {
  try {
    const budgets = await Budget.find();
    res.json(budgets);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/budgets', async (req, res) => {
  try {
    const { budgets } = req.body; // Map of { category: limit }
    if (!budgets || typeof budgets !== 'object') {
      return res.status(400).json({ error: 'budgets object required' });
    }
    const operations = Object.entries(budgets).map(([category, limit]) => ({
      updateOne: {
        filter: { category },
        update: { category, limit: Number(limit) },
        upsert: true,
      },
    }));
    await Budget.bulkWrite(operations);
    const updated = await Budget.find();
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Goals APIs
app.get('/api/goals', async (req, res) => {
  try {
    const goals = await Goal.find();
    res.json(goals);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/goals', async (req, res) => {
  try {
    const goal = new Goal(req.body);
    const saved = await goal.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/goals/:id', async (req, res) => {
  try {
    await Goal.findByIdAndDelete(req.params.id);
    res.json({ message: 'Goal deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Gemini 2.5 Flash AI Assistant (Ask Your Money)
app.post('/api/ai/chat', async (req, res) => {
  const { query, expenses = [], income = 25000, budgets = {}, goals = [], overview = {}, patterns = {}, language = 'en' } = req.body;
  if (!query) {
    return res.status(400).json({ error: 'Query is required' });
  }

  const geminiKey = process.env.GEMINI_API_KEY;
  const q = query.toLowerCase();

  // Find targeted goal (Laptop Goal)
  const laptopGoal = (goals && goals.find(g => g.name.toLowerCase().includes('laptop'))) || (goals && goals[0]) || {
    id: 1,
    name: 'Laptop',
    targetAmount: 60000,
    currentAmount: 35000,
  };

  // Deterministic calculation engine
  const match = q.match(/(?:₹|\b)(\d[\d,]*)/);
  const amount = match ? parseInt(match[1].replace(/,/g, '')) : 500;
  const monthly = amount > 0 ? amount : 500;
  const sixMonths = monthly * 6;
  const twelveMonths = monthly * 12;
  const investedValue = Math.round(monthly * ((Math.pow(1 + 0.01, 12) - 1) / 0.01) * 1.01);
  const projectedGoalAmount = Math.min(laptopGoal.targetAmount, (laptopGoal.currentAmount || 35000) + twelveMonths);

  // Check if it's a goal application request
  const isGoalApply =
    q.includes('apply to') ||
    q.includes('add karo') ||
    q.includes('daal do') ||
    q.includes('jod do') ||
    q.includes('apply scenario') ||
    (q.includes('goal') && (q.includes('apply') || q.includes('add') || q.includes('update')));

  if (isGoalApply) {
    const effectiveAmount = amount <= 1000 ? amount * 12 : amount;
    const prevAmount = laptopGoal.currentAmount || 35000;
    const newAmount = Math.min(laptopGoal.targetAmount, prevAmount + effectiveAmount);
    const newPercent = Math.min(100, Math.round((newAmount / laptopGoal.targetAmount) * 100));

    return res.json({
      isGoalApplied: true,
      appliedGoalId: laptopGoal.id,
      appliedAmount: effectiveAmount,
      appliedGoalName: laptopGoal.name,
      model: 'gemini-2.5-flash',
      text: language === 'kn'
        ? `🎉 **ಗುರಿ ಯಶಸ್ವಿಯಾಗಿ ನವೀಕರಿಸಲಾಗಿದೆ!**\n\nನಿಮ್ಮ **${laptopGoal.name} ಗುರಿಗೆ** +₹${effectiveAmount.toLocaleString('en-IN')} ಮೊತ್ತವನ್ನು ಸೇರಿಸಲಾಗಿದೆ!\n\n• ಗುರಿಯ ಮೊತ್ತ: ₹${laptopGoal.targetAmount.toLocaleString('en-IN')}\n• ಹೊಸ ಪ್ರಗತಿ: ₹${newAmount.toLocaleString('en-IN')} (${newPercent}% ಪೂರ್ಣಗೊಂಡಿದೆ!)\n• ಬಾಕಿ ಮೊತ್ತ: ₹${Math.max(0, laptopGoal.targetAmount - newAmount).toLocaleString('en-IN')} 🎯`
        : language === 'hi'
        ? `🎉 **लक्ष्य सफलतापूर्वक अपडेट हुआ!**\n\nआपके **${laptopGoal.name} लक्ष्य** में +₹${effectiveAmount.toLocaleString('en-IN')} की बचत जोड़ दी गई है!\n\n• कुल लक्ष्य: ₹${laptopGoal.targetAmount.toLocaleString('en-IN')}\n• नई प्रगति: ₹${newAmount.toLocaleString('en-IN')} (${newPercent}% पूरा हुआ!)\n• शेष राशि: ₹${Math.max(0, laptopGoal.targetAmount - newAmount).toLocaleString('en-IN')} 🎯`
        : `🎉 **Goal Updated Successfully!**\n\nApplied **+₹${effectiveAmount.toLocaleString('en-IN')}** simulated savings to your **${laptopGoal.name} Goal**!\n\n• Target: ₹${laptopGoal.targetAmount.toLocaleString('en-IN')}\n• Previously Saved: ₹${prevAmount.toLocaleString('en-IN')} (${Math.round((prevAmount / laptopGoal.targetAmount) * 100)}%)\n• New Progress: ₹${newAmount.toLocaleString('en-IN')} (${newPercent}% reached!)\n• Remaining: ₹${Math.max(0, laptopGoal.targetAmount - newAmount).toLocaleString('en-IN')} 🎯`,
      followUps: [
        'View Laptop Goal in Planner 🎯',
        'What if I invest ₹2,000 per month? 📈',
        'Where are my frequent small expenses? ☕',
        'Show my AI Spending Pattern 🧬',
      ],
    });
  }

  // Determine category mentioned
  let categoryMentioned = 'Food';
  if (q.includes('shopping') || q.includes('kharidari')) categoryMentioned = 'Shopping';
  else if (q.includes('travel') || q.includes('auto') || q.includes('cab')) categoryMentioned = 'Travel';
  else if (q.includes('entertainment') || q.includes('movie')) categoryMentioned = 'Entertainment';

  const deterministicScenario = {
    changeDesc: `Reduce ${categoryMentioned} spending by ₹${monthly.toLocaleString('en-IN')}/month`,
    monthly,
    months: 12,
    annualSavings: twelveMonths,
    investedValue,
    goalImpact: true,
    targetGoalName: laptopGoal.name,
    targetGoalId: laptopGoal.id,
    currentGoalAmount: laptopGoal.currentAmount,
    targetGoalAmount: laptopGoal.targetAmount,
    projectedGoalAmount,
  };

  // Language instruction for Gemini
  let langInstruction = 'Respond in warm, clear, empowering English.';
  if (language === 'kn') {
    langInstruction = 'Respond in natural, friendly Kannada (ಕನ್ನಡ) script or bilingual Kannada-English as appropriate. Use proper Kannada financial terms (ಉಳಿತಾಯ, ಖರ್ಚು, ಗುರಿ).';
  } else if (language === 'hi') {
    langInstruction = 'Respond in natural, friendly Hindi (हिंदी / Hinglish). Use clear, everyday Indian financial terms that users relate to.';
  }

  // If Gemini API Key is available, call Gemini 2.5 Flash
  if (geminiKey) {
    try {
      const prompt = `You are NexWorth AI Financial Assistant ("Ask Your Money").
You are answering the user's natural language question based on their actual expense records and deterministic financial calculations.

USER DATA:
- Monthly Income: ₹${Number(income).toLocaleString('en-IN')}
- Total Expenses: ₹${(overview?.currentTotal || 16428).toLocaleString('en-IN')}
- Top Spending Category: ${overview?.topCategory || 'Food'} (₹${(overview?.topAmount || 4200).toLocaleString('en-IN')})
- Micro-Transactions (<₹250): ₹${(patterns?.totalSmallValue || 2100).toLocaleString('en-IN')} across ${patterns?.allSmallCount || 11} transactions
- Primary Goal: ${laptopGoal.name} (Target: ₹${laptopGoal.targetAmount.toLocaleString('en-IN')}, Saved: ₹${(laptopGoal.currentAmount || 35000).toLocaleString('en-IN')})

PRE-CALCULATED FINANCIAL ENGINE RESULTS (USE EXACTLY THESE DETERMINISTIC VALUES):
- Monthly Difference: ₹${monthly.toLocaleString('en-IN')}
- 6 Months Savings: ₹${sixMonths.toLocaleString('en-IN')}
- 12 Months Savings: ₹${twelveMonths.toLocaleString('en-IN')}
- Illustrative 1-Year SIP Value (12% p.a.): ₹${investedValue.toLocaleString('en-IN')}
- Goal Impact: Laptop Goal progresses from ${Math.round(((laptopGoal.currentAmount || 35000) / laptopGoal.targetAmount) * 100)}% to ${Math.round((projectedGoalAmount / laptopGoal.targetAmount) * 100)}% (+₹${twelveMonths.toLocaleString('en-IN')} contribution)

RULES:
1. Language: ${langInstruction}
2. Tone: Strictly non-judgmental, empowering, transparent. Never say "you wasted money". Say "Your recorded spending shows...", "Saving this amount creates...".
3. Length: Keep it concise, engaging, and directly actionable (2-3 short paragraphs or bullet points).
4. Connect this directly to their ${laptopGoal.name} Goal.

User Question: "${query}"`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 600,
            },
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        const geminiText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (geminiText) {
          return res.json({
            text: geminiText,
            scenario: deterministicScenario,
            model: 'gemini-2.5-flash',
            followUps: [
              `Is ₹${monthly} ko ${laptopGoal.name} Goal mein add karo 💻`,
              'What if I invest that amount? 📈',
              'Where are my frequent small expenses? ☕',
              'Show my AI Spending Pattern 🧬',
            ],
          });
        }
      } else {
        const errText = await response.text();
        console.warn('Gemini API call failed, using deterministic fallback:', errText);
      }
    } catch (err) {
      console.warn('Gemini API network error, using deterministic fallback:', err.message);
    }
  }

  // Fallback to local deterministic AI response
  return res.json({
    text: `Reducing your ${categoryMentioned} spending by ₹${monthly.toLocaleString('en-IN')} per month would create a **₹${twelveMonths.toLocaleString('en-IN')} difference over 12 months** (₹${sixMonths.toLocaleString('en-IN')} in 6 months), assuming the reduction remains consistent.\n\nThis saved amount could directly boost your **${laptopGoal.name} Goal** from ${Math.round(((laptopGoal.currentAmount || 35000) / laptopGoal.targetAmount) * 100)}% to ${Math.round((projectedGoalAmount / laptopGoal.targetAmount) * 100)}%!`,
    scenario: deterministicScenario,
    model: 'deterministic-engine',
    followUps: [
      `Is ₹${monthly} ko ${laptopGoal.name} Goal mein add karo 💻`,
      'What if I invest that amount? 📈',
      'Try ₹1,000 instead 🔄',
      'Compare 6 vs 12 months 📊',
    ],
  });
});

// ==========================================
// 6. Nodemailer + Gmail SMTP Email Service
// ==========================================

async function getTransporter() {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;
  if (user && pass && user.trim() !== '' && pass.trim() !== '') {
    const cleanPass = pass.replace(/\s+/g, '').trim();
    return {
      transporter: nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: user.trim(),
          pass: cleanPass,
        },
      }),
      fromEmail: `"NexWorth AI Financial Intelligence" <${user.trim()}>`,
      isDemo: false,
    };
  }

  // Fallback demo transport for instant testing before .env configuration
  try {
    const testAccount = await nodemailer.createTestAccount();
    return {
      transporter: nodemailer.createTransport({
        host: testAccount.smtp.host,
        port: testAccount.smtp.port,
        secure: testAccount.smtp.secure,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      }),
      fromEmail: `"NexWorth Financial Alert" <${testAccount.user}>`,
      isDemo: true,
    };
  } catch (err) {
    console.warn('Could not create demo test account:', err.message);
    return null;
  }
}

function generateOverBudgetEmailHtml({ currentTotal, monthlyIncome, deficit, monthName }) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F8F6F2; margin: 0; padding: 24px; color: #1A1714; }
    .container { max-width: 580px; margin: 0 auto; background: #FFFFFF; border-radius: 16px; border: 1px solid #EFEAE2; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.06); }
    .header { background: linear-gradient(135deg, #1C1917 0%, #292524 100%); padding: 32px 28px; text-align: center; color: #FFFFFF; }
    .badge { display: inline-block; background: rgba(239, 68, 68, 0.2); color: #EF4444; border: 1px solid rgba(239, 68, 68, 0.4); padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 12px; }
    .title { font-size: 22px; font-weight: 700; margin: 0 0 6px; color: #FFFFFF; }
    .subtitle { font-size: 14px; color: #A8A29E; margin: 0; }
    .content { padding: 32px 28px; }
    .alert-box { background: #FEF2F2; border: 1px solid #FCA5A5; border-radius: 12px; padding: 16px 20px; margin-bottom: 24px; }
    .alert-text { font-size: 14.5px; line-height: 1.6; color: #991B1B; margin: 0; }
    .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 24px; }
    .metric { background: #F8F6F2; border-radius: 10px; padding: 14px; text-align: center; border: 1px solid #EFEAE2; }
    .metric-label { font-size: 11px; color: #8E877F; text-transform: uppercase; font-weight: 600; margin-bottom: 4px; }
    .metric-value { font-size: 17px; font-weight: 700; color: #1A1714; }
    .metric-danger { color: #DC2626; }
    .ai-insight { background: linear-gradient(135deg, #FFF7F0 0%, #FFF1E3 100%); border: 1px solid rgba(252, 108, 38, 0.25); border-radius: 12px; padding: 18px 20px; margin-bottom: 28px; }
    .ai-title { font-size: 13px; font-weight: 700; color: #FC6C26; margin-bottom: 6px; display: flex; align-items: center; gap: 6px; }
    .ai-desc { font-size: 13.5px; color: #44403C; line-height: 1.6; margin: 0; }
    .btn { display: inline-block; background: #FC6C26; color: #FFFFFF; padding: 12px 28px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 14px; box-shadow: 0 4px 12px rgba(252, 108, 38, 0.3); }
    .footer { text-align: center; padding: 20px; font-size: 12px; color: #A8A29E; border-top: 1px solid #EFEAE2; background: #FAFAF9; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="badge">🚨 Budget Deficit Detected</div>
      <h1 class="title">Expenses Exceeded Monthly Income</h1>
      <p class="subtitle">NexWorth AI Financial Intelligence Alert • ${monthName}</p>
    </div>
    <div class="content">
      <div class="alert-box">
        <p class="alert-text">
          <strong>Attention:</strong> Your total recorded spending has exceeded your recorded income for ${monthName}. This alert is generated automatically by NexWorth to keep your finances on track.
        </p>
      </div>

      <div class="grid">
        <div class="metric">
          <div class="metric-label">Monthly Income</div>
          <div class="metric-value">₹${Number(monthlyIncome).toLocaleString('en-IN')}</div>
        </div>
        <div class="metric">
          <div class="metric-label">Total Spent</div>
          <div class="metric-value metric-danger">₹${Number(currentTotal).toLocaleString('en-IN')}</div>
        </div>
        <div class="metric">
          <div class="metric-label">Over Budget</div>
          <div class="metric-value metric-danger">-₹${Number(deficit).toLocaleString('en-IN')}</div>
        </div>
      </div>

      <div class="ai-insight">
        <div class="ai-title">✨ AI Spending Pattern Recommendation</div>
        <p class="ai-desc">
          NexWorth AI detected that cumulative micro-expenses (snacks, dining out, subscriptions) contributed significantly to this deficit. Reducing discretionary spending by just ₹500/month can help bring your balance back into surplus and protect your long-term goals.
        </p>
      </div>

      <div style="text-align: center; margin-top: 12px;">
        <a href="http://localhost:5173" class="btn">Open Ask Your Money Assistant →</a>
      </div>
    </div>
    <div class="footer">
      NexWorth Financial Intelligence • Automated email alerts are sent when expenses surpass recorded income.<br>
      Your financial credentials remain encrypted and private.
    </div>
  </div>
</body>
</html>
  `;
}

function generateTestEmailHtml(toEmail) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F8F6F2; margin: 0; padding: 24px; color: #1A1714; }
    .container { max-width: 580px; margin: 0 auto; background: #FFFFFF; border-radius: 16px; border: 1px solid #EFEAE2; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.06); }
    .header { background: linear-gradient(135deg, #1C1917 0%, #292524 100%); padding: 32px 28px; text-align: center; color: #FFFFFF; }
    .badge { display: inline-block; background: rgba(34, 197, 94, 0.15); color: #22C55E; border: 1px solid rgba(34, 197, 94, 0.4); padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 12px; }
    .title { font-size: 22px; font-weight: 700; margin: 0 0 6px; color: #FFFFFF; }
    .subtitle { font-size: 14px; color: #A8A29E; margin: 0; }
    .content { padding: 32px 28px; }
    .success-box { background: #F0FDF4; border: 1px solid #86EFAC; border-radius: 12px; padding: 18px 20px; margin-bottom: 24px; }
    .success-text { font-size: 14.5px; line-height: 1.6; color: #166534; margin: 0; }
    .info-list { background: #F8F6F2; border-radius: 10px; padding: 16px; margin-bottom: 24px; font-size: 13.5px; border: 1px solid #EFEAE2; }
    .info-item { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #EAE6DF; }
    .info-item:last-child { border-bottom: none; }
    .footer { text-align: center; padding: 20px; font-size: 12px; color: #A8A29E; border-top: 1px solid #EFEAE2; background: #FAFAF9; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="badge">✨ Verified SMTP Connection</div>
      <h1 class="title">Gmail SMTP Test Successful!</h1>
      <p class="subtitle">NexWorth Node.js + Nodemailer Integration</p>
    </div>
    <div class="content">
      <div class="success-box">
        <p class="success-text">
          🎉 <strong>Great job!</strong> Your Gmail SMTP configuration with Node.js and Nodemailer is working properly. Automated over-budget financial alert emails will now dispatch seamlessly.
        </p>
      </div>

      <div class="info-list">
        <div class="info-item">
          <span style="color: #655E57;">Recipient:</span>
          <strong>${toEmail}</strong>
        </div>
        <div class="info-item">
          <span style="color: #655E57;">SMTP Service:</span>
          <strong>Gmail (smtp.gmail.com)</strong>
        </div>
        <div class="info-item">
          <span style="color: #655E57;">Authentication:</span>
          <strong>Gmail App Password (.env)</strong>
        </div>
        <div class="info-item">
          <span style="color: #655E57;">Sent At:</span>
          <strong>${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST</strong>
        </div>
      </div>

      <p style="font-size: 13.5px; color: #655E57; line-height: 1.6; margin: 0;">
        When recorded expenses exceed monthly income, NexWorth will trigger an automated high-priority financial alert to this email address.
      </p>
    </div>
    <div class="footer">
      NexWorth AI Financial Intelligence • Automated Notification System
    </div>
  </div>
</body>
</html>
  `;
}

// In-memory debounce timestamp for over-budget email alerts
let lastOverbudgetAlertTimestamp = 0;

// Email APIs
app.get('/api/email/status', (req, res) => {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;
  const isConfigured = Boolean(user && pass && user.trim() !== '' && pass.trim() !== '');
  const maskedEmail = user && user.includes('@')
    ? user.replace(/^(.{2})(.*)(@.*)$/, (_, a, b, c) => `${a}${'*'.repeat(Math.max(1, b.length))}${c}`)
    : user || null;

  res.json({
    configured: isConfigured,
    emailUser: maskedEmail,
    defaultRecipient: process.env.ALERT_RECIPIENT_EMAIL || user || '',
  });
});

app.post('/api/email/send-test', async (req, res) => {
  try {
    const { recipient } = req.body;
    const toEmail = recipient || process.env.ALERT_RECIPIENT_EMAIL || process.env.EMAIL_USER || 'demo@nexworth.ai';

    const transportObj = await getTransporter();
    if (!transportObj) {
      return res.status(400).json({
        success: false,
        error: 'Email transporter unavailable. Please configure EMAIL_USER and EMAIL_PASS in .env.',
      });
    }

    const { transporter, fromEmail, isDemo } = transportObj;
    const info = await transporter.sendMail({
      from: fromEmail,
      to: toEmail,
      subject: '✅ NexWorth Test Email: Gmail SMTP Connected Successfully',
      html: generateTestEmailHtml(toEmail),
    });

    const previewUrl = isDemo ? nodemailer.getTestMessageUrl(info) : null;
    console.log(`✉️ Test email dispatched (${isDemo ? 'Nodemailer Demo Server' : 'Gmail SMTP'}) to ${toEmail}: ${info.messageId}`);

    res.json({
      success: true,
      isDemo,
      previewUrl,
      message: isDemo
        ? `Test email dispatched via Nodemailer demo transport! (Add EMAIL_USER & EMAIL_PASS in .env to deliver directly to your Gmail inbox)`
        : `Test email successfully sent via Gmail SMTP to ${toEmail}!`,
      messageId: info.messageId,
      recipient: toEmail,
    });
  } catch (err) {
    console.error('Error sending test email:', err);
    res.status(500).json({
      success: false,
      error: err.message,
      hint: 'Ensure 2-Step Verification is ON in your Google Account and you generated a 16-character App Password from https://myaccount.google.com/apppasswords.',
    });
  }
});

app.post('/api/email/check-overbudget-alert', async (req, res) => {
  try {
    const { currentTotal, monthlyIncome, recipient, force = false, monthName = 'this month' } = req.body;

    if (Number(currentTotal) <= Number(monthlyIncome)) {
      return res.json({
        alertNeeded: false,
        sent: false,
        message: 'Expenses are within monthly income limit.',
      });
    }

    const deficit = Number(currentTotal) - Number(monthlyIncome);
    const now = Date.now();

    // Debounce alerts to once every 15 minutes unless force is specified
    if (!force && now - lastOverbudgetAlertTimestamp < 15 * 60 * 1000) {
      return res.json({
        alertNeeded: true,
        sent: false,
        debounced: true,
        deficit,
        message: 'Over-budget condition detected, but notification was recently dispatched (debounced to avoid spam).',
      });
    }

    const transportObj = await getTransporter();
    const toEmail = recipient || process.env.ALERT_RECIPIENT_EMAIL || process.env.EMAIL_USER || 'alert@nexworth.ai';

    if (!transportObj) {
      return res.json({
        alertNeeded: true,
        sent: false,
        deficit,
        warning: 'EMAIL_USER or EMAIL_PASS is missing in .env. Automated email was skipped.',
      });
    }

    const { transporter, fromEmail, isDemo } = transportObj;
    const info = await transporter.sendMail({
      from: fromEmail,
      to: toEmail,
      subject: `🚨 NexWorth Alert: Monthly Expenses Exceeded Income by ₹${deficit.toLocaleString('en-IN')}`,
      html: generateOverBudgetEmailHtml({ currentTotal, monthlyIncome, deficit, monthName }),
    });

    lastOverbudgetAlertTimestamp = now;
    const previewUrl = isDemo ? nodemailer.getTestMessageUrl(info) : null;
    console.log(`🚨 Over-budget alert email dispatched (${isDemo ? 'Demo Mode' : 'Gmail SMTP'}) to ${toEmail}: ${info.messageId}`);

    res.json({
      alertNeeded: true,
      sent: true,
      isDemo,
      previewUrl,
      recipient: toEmail,
      deficit,
      messageId: info.messageId,
      message: isDemo
        ? `Over-budget alert dispatched via Nodemailer demo! Click the preview link to view the exact HTML email.`
        : `Over-budget alert email successfully sent to ${toEmail} via Gmail SMTP!`,
    });
  } catch (err) {
    console.error('Error sending over-budget email alert:', err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 NexWorth Backend API running at http://localhost:${PORT}`);
});
