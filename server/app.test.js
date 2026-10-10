import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import app from './app.js';
import serverlessHandler from '../api/index.js';

import mongoose from 'mongoose';

let server;
let baseUrl;

beforeAll(async () => {
  await new Promise((resolve) => {
    server = app.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://localhost:${port}`;
      resolve();
    });
  });
});

afterAll(async () => {
  await new Promise((resolve) => {
    if (server) server.close(resolve);
    else resolve();
  });
  try {
    await mongoose.disconnect();
  } catch (e) {}
});

describe('Backend Architecture & Serverless Verification', () => {
  it('verifies api/index.js exports the same Express app for Vercel serverless', () => {
    expect(serverlessHandler).toBe(app);
    expect(typeof serverlessHandler).toBe('function');
  });

  it('GET /api/status returns sanitized connection payload without exposing credentials', async () => {
    const res = await fetch(`${baseUrl}/api/status`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty('connected');
    expect(data).toHaveProperty('status');
    expect(data).toHaveProperty('cluster');
    // Ensure no sensitive credentials leaked
    expect(data.user).toBeUndefined();
    expect(data.host).toBeUndefined();
    expect(data.password).toBeUndefined();
  });

  it('GET /status (serverless rewrite path) resolves to identical handler', async () => {
    const res = await fetch(`${baseUrl}/status`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty('connected');
    expect(data).toHaveProperty('status');
  });

  it('POST /api/expenses validates required fields and returns 400 when missing', async () => {
    const res = await fetch(`${baseUrl}/api/expenses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: 100 }), // missing merchant/name
    });
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBeDefined();
  });

  let createdExpenseId;

  it('POST /api/expenses creates an expense (with in-memory/MongoDB persistence)', async () => {
    const testPayload = {
      merchant: 'Test Automated Coffee',
      amount: 150,
      category: 'food',
      paymentMethod: 'UPI',
      note: 'Verification test',
    };
    const res = await fetch(`${baseUrl}/api/expenses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testPayload),
    });
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.name).toBe('Test Automated Coffee');
    expect(data.amount).toBe(150);
    expect(data.id || data._id).toBeDefined();
    createdExpenseId = data.id || data._id;
  });

  it('GET /api/expenses retrieves the created expense', async () => {
    const res = await fetch(`${baseUrl}/api/expenses`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
    const found = data.find((e) => (e.id || e._id) === createdExpenseId);
    expect(found).toBeDefined();
    expect(found.amount).toBe(150);
  });

  it('PUT /api/expenses/:id updates the expense', async () => {
    const res = await fetch(`${baseUrl}/api/expenses/${createdExpenseId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: 200, note: 'Updated amount' }),
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.amount).toBe(200);
  });

  it('DELETE /api/expenses/:id deletes the expense successfully', async () => {
    const res = await fetch(`${baseUrl}/api/expenses/${createdExpenseId}`, {
      method: 'DELETE',
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.message).toContain('Deleted');

    // Confirm deletion
    const getRes = await fetch(`${baseUrl}/api/expenses`);
    const list = await getRes.json();
    const found = list.find((e) => (e.id || e._id) === createdExpenseId);
    expect(found).toBeUndefined();
  });

  it('POST /api/ai/chat processes query and returns scenario', async () => {
    const res = await fetch(`${baseUrl}/api/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'What if I save ₹1000 per month for Laptop?',
        income: 30000,
        goals: [{ id: 1, name: 'Laptop', targetAmount: 60000, currentAmount: 35000 }],
      }),
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.scenario).toBeDefined();
    expect(data.text).toBeDefined();
    expect(data.followUps).toHaveLength(4);
  }, 15000);

  it('GET /api/email/status masks recipient and email user safely', async () => {
    const res = await fetch(`${baseUrl}/api/email/status`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty('configured');
    if (data.emailUser) {
      expect(data.emailUser).toContain('*'); // Masked
    }
  });

  it('POST /api/email/check-overbudget-alert reports alertNeeded when expenses exceed income', async () => {
    const res = await fetch(`${baseUrl}/api/email/check-overbudget-alert`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        currentTotal: 35000,
        monthlyIncome: 25000,
        force: false,
      }),
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.alertNeeded).toBe(true);
    expect(data.deficit).toBe(10000);
  }, 15000);
});
