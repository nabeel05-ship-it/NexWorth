import React, { createContext, useContext, useReducer, useEffect, useState, useCallback } from 'react';
import { DEMO_EXPENSES, DEMO_GOALS, DEFAULT_USER } from '../utils/demoData';
import { fetchDbStatus, fetchExpensesFromDb, saveExpenseToDb, deleteExpenseFromDb, syncExpensesToDb } from '../utils/api';
import { getTranslation, LANGUAGES } from '../utils/translations';

const AppContext = createContext();

const initialState = {
  user: DEFAULT_USER,
  expenses: DEMO_EXPENSES,
  goals: DEMO_GOALS,
  currentPage: 'dashboard',
  language: 'en',
  isOnboarded: true,
  darkMode: true,
  pendingChatQuery: null,
};

function appReducer(state, action) {
  switch (action.type) {
    case 'SET_PAGE':
      return { ...state, currentPage: action.payload };

    case 'SET_LANGUAGE':
      return { ...state, language: action.payload };

    case 'SET_CHAT_QUERY':
      return { ...state, pendingChatQuery: action.payload, currentPage: 'ai-chat' };

    case 'CLEAR_CHAT_QUERY':
      return { ...state, pendingChatQuery: null };

    case 'APPLY_GOAL_CONTRIBUTION': {
      const { goalId, amount, goalName } = action.payload;
      return {
        ...state,
        goals: state.goals.map(g => {
          const matchById = goalId && g.id === goalId;
          const matchByName = goalName && g.name.toLowerCase().includes(goalName.toLowerCase());
          const matchDefault = !goalId && !goalName && g.name.toLowerCase().includes('laptop');
          if (matchById || matchByName || matchDefault) {
            return {
              ...g,
              currentAmount: Math.min(g.targetAmount, (g.currentAmount || 0) + amount),
            };
          }
          return g;
        }),
      };
    }

    case 'SET_EXPENSES':
      return {
        ...state,
        expenses: (action.payload || []).map((e, idx) => {
          const id = e._id ? e._id.toString() : (e.id ? e.id.toString() : `exp_${Date.now()}_${idx}`);
          return {
            ...e,
            id,
            _id: id,
            name: e.name || e.merchant || 'Expense',
            merchant: e.merchant || e.name || 'Expense',
            amount: Number(e.amount) || 0,
            category: (e.category || 'other').toLowerCase(),
          };
        }),
      };

    case 'ADD_EXPENSE': {
      const id = action.payload._id ? action.payload._id.toString() : (action.payload.id ? action.payload.id.toString() : `exp_${Date.now()}`);
      const newExpense = {
        ...action.payload,
        id,
        _id: id,
        name: action.payload.name || action.payload.merchant || 'Expense',
        merchant: action.payload.merchant || action.payload.name || 'Expense',
        amount: Number(action.payload.amount) || 0,
        category: (action.payload.category || 'other').toLowerCase(),
        date: action.payload.date || new Date().toISOString(),
        paymentMethod: action.payload.paymentMethod || 'UPI',
        source: action.payload.source || 'Manual',
        note: action.payload.note || '',
      };
      return {
        ...state,
        expenses: [newExpense, ...state.expenses],
      };
    }

    case 'UPDATE_EXPENSE': {
      const targetId = action.payload._id || action.payload.id;
      return {
        ...state,
        expenses: state.expenses.map(e => (e.id === targetId || e._id === targetId ? {
          ...e,
          ...action.payload,
          id: targetId,
          _id: targetId,
          name: action.payload.name || action.payload.merchant || e.name,
          merchant: action.payload.merchant || action.payload.name || e.merchant,
          amount: Number(action.payload.amount) || e.amount,
          category: (action.payload.category || e.category || 'other').toLowerCase(),
        } : e)),
      };
    }

    case 'DELETE_EXPENSE':
      return {
        ...state,
        expenses: state.expenses.filter(e => e._id !== action.payload && e.id !== action.payload),
      };

    case 'IMPORT_EXPENSES':
      return {
        ...state,
        expenses: [...action.payload, ...state.expenses],
      };

    case 'ADD_GOAL':
      return {
        ...state,
        goals: [...state.goals, { id: Date.now(), ...action.payload }],
      };

    case 'UPDATE_GOAL':
      return {
        ...state,
        goals: state.goals.map(g => (g.id === action.payload.id ? action.payload : g)),
      };

    case 'DELETE_GOAL':
      return {
        ...state,
        goals: state.goals.filter(g => g.id !== action.payload),
      };

    case 'UPDATE_USER':
      return {
        ...state,
        user: { ...state.user, ...action.payload },
      };

    case 'UPDATE_BUDGETS':
      return {
        ...state,
        user: { ...state.user, budgets: { ...state.user.budgets, ...action.payload } },
      };

    case 'TOGGLE_DARK_MODE':
      return { ...state, darkMode: !state.darkMode };

    case 'SET_ONBOARDED':
      return { ...state, isOnboarded: true };

    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const [mongoStatus, setMongoStatus] = useState({
    connected: false,
    checking: true,
    backendReachable: false,
    cluster: 'Cluster0',
    database: 'nexworth',
    storage: 'checking',
  });

  const [state, dispatch] = useReducer(appReducer, initialState, (initial) => {
    let base = initial;
    try {
      const saved = localStorage.getItem('nexworth_state');
      if (saved) {
        base = { ...initial, ...JSON.parse(saved) };
      }
    } catch (e) {
      // Local storage fallback
    }

    // Support deep linking from email alerts (e.g. ?page=ai-chat or #ai-chat)
    if (typeof window !== 'undefined') {
      try {
        const params = new URLSearchParams(window.location.search);
        const urlPage = params.get('page') || window.location.hash.replace('#', '').trim();
        const validPages = ['dashboard', 'capture', 'add-expense', 'insights', 'what-if', 'goals', 'compare', 'calculator', 'forecast', 'ai-chat', 'privacy'];
        if (urlPage && validPages.includes(urlPage)) {
          base.currentPage = urlPage;
        }
      } catch (err) {
        // Fallback
      }
    }

    return base;
  });

  // Listen to URL navigation (e.g. when clicking email link or changing URL hash)
  useEffect(() => {
    const handleUrlNavigation = () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const urlPage = params.get('page') || window.location.hash.replace('#', '').trim();
        const validPages = ['dashboard', 'capture', 'add-expense', 'insights', 'what-if', 'goals', 'compare', 'calculator', 'forecast', 'ai-chat', 'privacy'];
        if (urlPage && validPages.includes(urlPage)) {
          dispatch({ type: 'SET_PAGE', payload: urlPage });
        }
      } catch (err) {
        // Fallback
      }
    };

    handleUrlNavigation();
    window.addEventListener('popstate', handleUrlNavigation);
    window.addEventListener('hashchange', handleUrlNavigation);
    return () => {
      window.removeEventListener('popstate', handleUrlNavigation);
      window.removeEventListener('hashchange', handleUrlNavigation);
    };
  }, []);

  // Sync to localStorage
  useEffect(() => {
    const toSave = { ...state };
    localStorage.setItem('nexworth_state', JSON.stringify(toSave));
  }, [state]);

  // Connect & Sync with MongoDB on mount
  useEffect(() => {
    let isMounted = true;

    async function initMongo(attempt = 0) {
      const status = await fetchDbStatus();
      if (!isMounted) return;

      // The first invocation of a serverless function can finish before Atlas
      // completes its TLS handshake. Retry instead of treating that transient
      // condition as a non-persistent memory store.
      if (!status?.connected && status?.backendReachable && status?.env?.hasMongo && attempt < 2) {
        window.setTimeout(() => initMongo(attempt + 1), 1200 * (attempt + 1));
        return;
      }

      if (status && status.connected) {
        setMongoStatus({
          connected: true,
          checking: false,
          backendReachable: true,
          cluster: status.cluster || 'Cluster0',
          database: status.database || 'nexworth',
          storage: 'cloud',
          env: status.env,
        });

        // Fetch records from MongoDB
        const dbExpenses = await fetchExpensesFromDb();
        if (dbExpenses && Array.isArray(dbExpenses)) {
          if (dbExpenses.length === 0) {
            // DB is empty — seed all demo expenses
            const syncResult = await syncExpensesToDb(state.expenses);
            if (syncResult && syncResult.items && syncResult.items.length > 0) {
              dispatch({ type: 'SET_EXPENSES', payload: syncResult.items });
            } else {
              // Sync failed (e.g. network) — show demo data locally
              dispatch({ type: 'SET_EXPENSES', payload: state.expenses });
            }
          } else if (dbExpenses.length < 10) {
            // DB has only a few manual/test entries — it was never properly seeded.
            // Merge the full demo dataset so every month has rich data.
            // Real DB entries take priority (they appear first and carry _id).
            const realIds = new Set(dbExpenses.map(e => e._id));
            const demoFill = state.expenses.filter(e => !realIds.has(e._id));
            dispatch({ type: 'SET_EXPENSES', payload: [...dbExpenses, ...demoFill] });
          } else {
            // DB is sufficiently populated. Merge any demo months entirely absent from DB.
            const dbMonthCounts = {};
            dbExpenses.forEach(e => {
              const d = new Date(e.date || e.createdAt);
              const k = `${d.getFullYear()}-${d.getMonth()}`;
              dbMonthCounts[k] = (dbMonthCounts[k] || 0) + 1;
            });
            // A month is "sparse" if it has fewer than 3 DB entries
            const missingDemoEntries = state.expenses.filter(e => {
              const d = new Date(e.date);
              const k = `${d.getFullYear()}-${d.getMonth()}`;
              return (dbMonthCounts[k] || 0) < 3;
            });
            const merged = missingDemoEntries.length > 0
              ? [...dbExpenses, ...missingDemoEntries]
              : dbExpenses;
            dispatch({ type: 'SET_EXPENSES', payload: merged });
          }
        }
      } else {
        setMongoStatus({
          connected: false,
          checking: false,
          backendReachable: Boolean(status?.backendReachable),
          storage: status?.backendReachable ? 'memory' : 'local',
          cluster: 'Cluster0',
          database: 'nexworth',
          env: status?.env,
        });
      }
    }

    initMongo();
    return () => { isMounted = false; };
  }, []);

  // Enhanced dispatch that syncs to MongoDB asynchronously
  const enhancedDispatch = (action) => {
    // Do not miss an expense submitted while the first production status check
    // is still in flight; the API itself is the source of truth for persistence.
    const shouldUseRemoteExpenseStore = mongoStatus.connected || mongoStatus.backendReachable || import.meta.env.PROD;
    if (shouldUseRemoteExpenseStore) {
      if (action.type === 'ADD_EXPENSE') {
        // Keep a stable temporary id so a failed cloud save can be rolled back
        // rather than surviving only until the next page refresh.
        const pendingId = `pending_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        const pendingExpense = { ...action.payload, id: pendingId, _id: pendingId, storage: 'pending' };
        dispatch({ ...action, payload: pendingExpense });
        return saveExpenseToDb({
          ...pendingExpense,
          merchant: pendingExpense.merchant || pendingExpense.name,
          name: pendingExpense.name || pendingExpense.merchant,
        }).then((saved) => {
          if (saved && (saved._id || saved.id)) {
            // Replace the optimistic item with the record returned by MongoDB;
            // its ObjectId is the id future edits/deletes must use.
            dispatch({ type: 'DELETE_EXPENSE', payload: pendingId });
            dispatch({
              type: 'ADD_EXPENSE',
              payload: {
                ...pendingExpense,
                ...saved,
                _id: saved._id || saved.id,
                id: saved.id || saved._id,
                storage: saved.storage || (mongoStatus.connected ? 'cloud' : 'memory'),
              },
            });
            return true;
          } else {
            // A configured Atlas database must never silently degrade to an
            // ephemeral entry. Remove the optimistic entry on failed save.
            dispatch({ type: 'DELETE_EXPENSE', payload: pendingId });
            return false;
          }
        }).catch((err) => {
          console.error(err);
          dispatch({ type: 'DELETE_EXPENSE', payload: pendingId });
          return false;
        });
      } else if (action.type === 'DELETE_EXPENSE') {
        dispatch(action);
        deleteExpenseFromDb(action.payload).catch(console.error);
        return;
      }
    }

    dispatch(action);
  };

  const currentLanguage = state.language || 'en';
  const t = useCallback((key) => getTranslation(key, currentLanguage), [currentLanguage]);
  const setLanguage = useCallback((lang) => enhancedDispatch({ type: 'SET_LANGUAGE', payload: lang }), []);

  return (
    <AppContext.Provider value={{
      state,
      dispatch: enhancedDispatch,
      mongoStatus,
      language: currentLanguage,
      setLanguage,
      languages: LANGUAGES,
      t,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

export function useTranslation() {
  const { t, language, setLanguage, languages } = useApp();
  return { t, language, setLanguage, languages };
}
