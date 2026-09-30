const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

export async function fetchDbStatus() {
  try {
    const res = await fetch(`${API_BASE}/status`, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) throw new Error('Status check failed');
    return await res.json();
  } catch (err) {
    return { connected: false, error: err.message };
  }
}

export async function fetchExpensesFromDb() {
  try {
    const res = await fetch(`${API_BASE}/expenses`, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) throw new Error('Failed to fetch expenses');
    return await res.json();
  } catch (err) {
    console.warn('MongoDB fetch error, falling back to local:', err.message);
    return null;
  }
}

export async function saveExpenseToDb(expense) {
  try {
    const res = await fetch(`${API_BASE}/expenses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(expense),
    });
    if (!res.ok) throw new Error('Failed to save expense');
    return await res.json();
  } catch (err) {
    console.warn('MongoDB save error:', err.message);
    return null;
  }
}

export async function deleteExpenseFromDb(id) {
  try {
    const res = await fetch(`${API_BASE}/expenses/${id}`, {
      method: 'DELETE',
    });
    return res.ok;
  } catch (err) {
    console.warn('MongoDB delete error:', err.message);
    return false;
  }
}

export async function syncExpensesToDb(expenses) {
  try {
    const res = await fetch(`${API_BASE}/expenses/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ expenses }),
    });
    if (!res.ok) throw new Error('Failed to sync expenses');
    return await res.json();
  } catch (err) {
    console.warn('MongoDB sync error:', err.message);
    return null;
  }
}
