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
    cluster: 'Cluster0',
    database: 'nexworth',
    host: 'cluster0.2fmepzy.mongodb.net',
  });

  const [state, dispatch] = useReducer(appReducer, initialState, (initial) => {
    try {
      const saved = localStorage.getItem('nexworth_state');
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...initial, ...parsed };
      }
    } catch (e) {
      // Local storage fallback
    }
    return initial;
  });

  // Sync to localStorage
  useEffect(() => {
    const toSave = { ...state };
    localStorage.setItem('nexworth_state', JSON.stringify(toSave));
  }, [state]);

  // Connect & Sync with MongoDB on mount
  useEffect(() => {
    let isMounted = true;

    async function initMongo() {
      const status = await fetchDbStatus();
      if (!isMounted) return;

      if (status && status.connected) {
        setMongoStatus({
          connected: true,
          checking: false,
          cluster: status.cluster || 'Cluster0',
          database: status.database || 'nexworth',
          host: status.host,
          user: status.user,
        });

        // Fetch records from MongoDB
        const dbExpenses = await fetchExpensesFromDb();
        if (dbExpenses && Array.isArray(dbExpenses)) {
          if (dbExpenses.length === 0) {
            // Seed initial demo expenses to MongoDB
            const syncResult = await syncExpensesToDb(state.expenses);
            if (syncResult && syncResult.items && syncResult.items.length > 0) {
              dispatch({ type: 'SET_EXPENSES', payload: syncResult.items });
            }
          } else {
            // Use live MongoDB expenses
            dispatch({ type: 'SET_EXPENSES', payload: dbExpenses });
          }
        }
      } else {
        setMongoStatus(prev => ({ ...prev, connected: false, checking: false }));
      }
    }

    initMongo();
    return () => { isMounted = false; };
  }, []);

  // Enhanced dispatch that syncs to MongoDB asynchronously
  const enhancedDispatch = (action) => {
    dispatch(action);

    if (mongoStatus.connected) {
      if (action.type === 'ADD_EXPENSE') {
        saveExpenseToDb({
          ...action.payload,
          merchant: action.payload.merchant || action.payload.name,
          name: action.payload.name || action.payload.merchant,
        }).catch(console.error);
      } else if (action.type === 'DELETE_EXPENSE') {
        deleteExpenseFromDb(action.payload).catch(console.error);
      }
    }
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
