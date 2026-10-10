// In production or on deployed origins, never allow localhost URLs
const envApiUrl = import.meta.env.VITE_API_URL;
const isProd = import.meta.env.PROD || (typeof window !== 'undefined' && window.location.hostname !== 'localhost');
const API_BASE = (isProd && envApiUrl && envApiUrl.includes('localhost'))
  ? '/api'
  : (envApiUrl || '/api');

async function parseJsonResponse(res, errorMessage = 'Request failed') {
  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    const text = await res.text();
    throw new Error(`${errorMessage}: Received non-JSON response (${contentType || 'empty'})`);
  }
  return await res.json();
}

export async function fetchDbStatus() {
  try {
    const res = await fetch(`${API_BASE}/status`, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) throw new Error(`Status check returned HTTP ${res.status}`);
    const data = await parseJsonResponse(res, 'Status check failed');
    return { ...data, backendReachable: true };
  } catch (err) {
    return { connected: false, backendReachable: false, error: err.message };
  }
}

export async function fetchExpensesFromDb() {
  try {
    const res = await fetch(`${API_BASE}/expenses`, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) throw new Error(`Failed to fetch expenses: HTTP ${res.status}`);
    return await parseJsonResponse(res, 'Expenses fetch failed');
  } catch (err) {
    console.warn('Backend fetch error, falling back to local state:', err.message);
    return null;
  }
}

export async function saveExpenseToDb(expense) {
  try {
    const res = await fetch(`${API_BASE}/expenses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(expense),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`Failed to save expense: HTTP ${res.status}`);
    return await parseJsonResponse(res, 'Expense save failed');
  } catch (err) {
    console.warn('Backend save error:', err.message);
    return null;
  }
}

export async function deleteExpenseFromDb(id) {
  try {
    const res = await fetch(`${API_BASE}/expenses/${id}`, {
      method: 'DELETE',
      signal: AbortSignal.timeout(8000),
    });
    return res.ok;
  } catch (err) {
    console.warn('Backend delete error:', err.message);
    return false;
  }
}

export async function syncExpensesToDb(expenses) {
  try {
    const res = await fetch(`${API_BASE}/expenses/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ expenses }),
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) throw new Error(`Failed to sync expenses: HTTP ${res.status}`);
    return await parseJsonResponse(res, 'Expenses sync failed');
  } catch (err) {
    console.warn('Backend sync error:', err.message);
    return null;
  }
}

export async function sendAIChatQuery(data) {
  try {
    const res = await fetch(`${API_BASE}/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) throw new Error(`AI request returned HTTP ${res.status}`);
    return await parseJsonResponse(res, 'AI chat request failed');
  } catch (err) {
    console.warn('AI API error, fallback to local engine:', err.message);
    return null;
  }
}

export async function fetchEmailStatus() {
  try {
    const res = await fetch(`${API_BASE}/email/status`, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) throw new Error(`Failed to fetch email status: HTTP ${res.status}`);
    return await parseJsonResponse(res, 'Email status request failed');
  } catch (err) {
    return { configured: false, error: err.message };
  }
}

export async function sendTestEmail(recipient) {
  try {
    const res = await fetch(`${API_BASE}/email/send-test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipient }),
      signal: AbortSignal.timeout(15000),
    });
    return await parseJsonResponse(res, 'Email test request failed');
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function checkOverbudgetAlert({ currentTotal, monthlyIncome, recipient, force = false, monthName }) {
  try {
    const res = await fetch(`${API_BASE}/email/check-overbudget-alert`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentTotal, monthlyIncome, recipient, force, monthName }),
      signal: AbortSignal.timeout(15000),
    });
    return await parseJsonResponse(res, 'Budget alert request failed');
  } catch (err) {
    return { alertNeeded: false, error: err.message };
  }
}


