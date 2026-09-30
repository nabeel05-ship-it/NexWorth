import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
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

// 2. Expenses APIs
app.get('/api/expenses', async (req, res) => {
  try {
    const expenses = await Expense.find().sort({ date: -1, createdAt: -1 });
    res.json(expenses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/expenses', async (req, res) => {
  try {
    const { amount, merchant, category, date, paymentMethod, source, note, reference, rawMessage } = req.body;
    if (!amount || !merchant) {
      return res.status(400).json({ error: 'Amount and merchant are required' });
    }
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
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/expenses/:id', async (req, res) => {
  try {
    const updated = await Expense.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ error: 'Expense not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/expenses/:id', async (req, res) => {
  try {
    const deleted = await Expense.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Expense not found' });
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

app.listen(PORT, () => {
  console.log(`🚀 NexWorth Backend API running at http://localhost:${PORT}`);
});
