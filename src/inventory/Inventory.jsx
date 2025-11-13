import React, { useState, useReducer, useMemo, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, Package, TrendingUp, Calendar, PieChart, Download, Upload, Printer, Cloud, Edit2Icon } from 'lucide-react';
import { add, agenda, box, cloudd, coins, pack, paycard, report, text, today, trend } from '../assets';
import useRealtimeSync from '../hooks/useRealtimeSync';

// GOOGLE APPS SCRIPT CONFIG
const GOOGLE_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwOGJVycL5ko2cZBj_jfWoXqWP_W4JHo9YhwHSaOXT2FGGAESYw5rqFaIuOclskSyTIwQ/exec';

// DATE/TIMEZONE UTILITIES
const getLocalDateString = (date = new Date()) => {
  // Use the local timezone of the browser
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getTodayDateString = () => {
  return getLocalDateString();
};

const normalizeDateForComparison = (dateString) => {
  // Convert any date string to YYYY-MM-DD format for consistent comparison
  if (!dateString) return '';
  
  try {
    // Handle both "YYYY-MM-DD" and date objects from different timezones
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      // If it's already in YYYY-MM-DD format but parsing failed, return as-is
      return dateString;
    }
    return getLocalDateString(date);
  } catch (error) {
    console.warn('Date normalization error:', error, dateString);
    return dateString;
  }
};

// Enhanced loadInitialData with date normalization
const loadInitialData = async () => {
  try {
    console.log('Loading data from Google Sheets...');
    const url = `${GOOGLE_APPS_SCRIPT_URL}?action=getExpenses`;
    const response = await fetch(url);
    
    if (response.ok) {
      const result = await response.json();
      if (result.success && result.data && Array.isArray(result.data.expenses)) {
        console.log('Data loaded from Google Sheets:', result.data.expenses.length, 'expenses');
        
        // NORMALIZE ALL DATES FROM GOOGLE SHEETS
        const normalizedData = {
          ...result.data,
          expenses: result.data.expenses.map(expense => ({
            ...expense,
            // Normalize the date to local timezone for consistent display
            date: normalizeDateForComparison(expense.date),
            // Keep original date for reference
            originalDate: expense.date
          }))
        };
        
        // Check if we have local data that's newer
        const localData = localStorage.getItem('expenseTrackerData');
        if (localData) {
          const localParsed = JSON.parse(localData);
          const localLastModified = localStorage.getItem('expenseTrackerLastModified');
          const sheetsLastModified = result.data.lastModified || result.data.timestamp;
          
          // If local data is newer, use local data and sync it
          if (localLastModified && sheetsLastModified && new Date(localLastModified) > new Date(sheetsLastModified)) {
            console.log('Local data is newer, using local data');
            return localParsed;
          }
        }
        
        // Save normalized data to local storage
        localStorage.setItem('expenseTrackerData', JSON.stringify(normalizedData));
        localStorage.setItem('expenseTrackerLastModified', new Date().toISOString());
        return normalizedData;
      }
    }
    throw new Error('No data received from Sheets');
  } catch (error) {
    console.warn('Failed to load from Google Sheets:', error);
    // Fallback to local storage
    try {
      const saved = localStorage.getItem('expenseTrackerData');
      if (saved) {
        const parsed = JSON.parse(saved);
        console.log('Data loaded from local storage (fallback):', parsed.expenses.length, 'expenses');
        return parsed;
      }
    } catch (localError) {
      console.warn('Failed to load from local storage:', localError);
    }
    return { expenses: [] };
  }
};

const initialState = { expenses: [] };

function expenseReducer(state, action) {
  let newState;
  
  switch (action.type) {
    case 'ADD_EXPENSE':
      const newExpense = {
        ...action.payload,
        id: Date.now(),
        totalAmount: parseFloat(action.payload.totalAmount),
        // Ensure date is normalized when adding new expense
        date: normalizeDateForComparison(action.payload.date),
        createdAt: new Date().toISOString()
      };
      newState = { ...state, expenses: [...state.expenses, newExpense] };
      break;
    
    case 'UPDATE_EXPENSE':
      const updatedExpense = {
        ...action.payload,
        totalAmount: parseFloat(action.payload.totalAmount),
        // Ensure date is normalized when updating expense
        date: normalizeDateForComparison(action.payload.date),
        updatedAt: new Date().toISOString()
      };
      newState = {
        ...state,
        expenses: state.expenses.map(exp => 
          exp.id === action.payload.id ? updatedExpense : exp
        )
      };
      break;
    
    case 'DELETE_EXPENSE':
      newState = {
        ...state,
        expenses: state.expenses.filter(exp => exp.id !== action.payload)
      };
      break;
    
    case 'LOAD_DATA':
      newState = action.payload;
      break;
      
    default:
      return state;
  }
  
  // Always save to local storage as backup
  try {
    localStorage.setItem('expenseTrackerData', JSON.stringify(newState));
    localStorage.setItem('expenseTrackerLastModified', new Date().toISOString());
  } catch (error) {
    console.warn('Failed to save to local storage:', error);
  }
  
  return newState;
}

export default function InventoryExpenseTracker() {
  const [state, dispatch] = useReducer(expenseReducer, initialState);
  const { lastUpdate, triggerUpdate } = useRealtimeSync();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showModal, setShowModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedProduct, setSelectedProduct] = useState('All');
  const [selectedPeriod, setSelectedPeriod] = useState('weekly');
  const [historySearchTerm, setHistorySearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  // PAGINATION STATE
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [reportsCurrentPage, setReportsCurrentPage] = useState(1);
  const [reportsItemsPerPage, setReportsItemsPerPage] = useState(10);
  const [dateFilter, setDateFilter] = useState('all');
  const [customStartDate, setCustomStartDate] = useState(getTodayDateString());
  const [customEndDate, setCustomEndDate] = useState(getTodayDateString());
  
  // GOOGLE SHEETS STATE
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');

  const syncDispatch = (action) => {
    dispatch(action);
    setTimeout(() => triggerUpdate(), 10);
  };

  // Enhanced save to Google Sheets with date handling
  const saveToGoogleSheets = async (expensesData = null) => {
    const dataToSave = expensesData || state.expenses;
    
    if (dataToSave.length === 0) {
      return true; // Nothing to save
    }

    setIsSyncing(true);
    setConnectionStatus('connecting');
    
    try {
      console.log('Saving to Google Sheets...', { expensesCount: dataToSave.length });
      
      // Prepare data with proper date formatting for Google Sheets
      const dataForSheets = {
        expenses: dataToSave.map(expense => ({
          ...expense,
          // Send dates in ISO format so Google Sheets interprets them correctly
          date: expense.date, // Already normalized to YYYY-MM-DD
          timestamp: new Date().toISOString()
        })),
        timestamp: new Date().toISOString(),
        totalExpenses: dataToSave.length,
        lastModified: new Date().toISOString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone // Include timezone info
      };
      
      const params = new URLSearchParams({
        action: 'saveExpenses',
        data: JSON.stringify(dataForSheets)
      });
      
      const url = `${GOOGLE_APPS_SCRIPT_URL}?${params.toString()}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString()
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to save to Sheets');
      }
      
      setLastSyncTime(new Date());
      setConnectionStatus('connected');
      localStorage.setItem('expenseTrackerLastModified', new Date().toISOString());
      console.log('✅ Successfully saved to Google Sheets');
      
      return true;
      
    } catch (error) {
      console.error('Sheets save error:', error);
      setConnectionStatus('error');
      return false;
    } finally {
      setIsSyncing(false);
    }
  };

  // Enhanced load from Google Sheets with date debugging
  const loadFromGoogleSheets = async () => {
    setIsSyncing(true);
    setConnectionStatus('connecting');
    
    try {
      const url = `${GOOGLE_APPS_SCRIPT_URL}?action=getExpenses`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to load data');
      }
      
      if (result.data && result.data.expenses) {
        // NORMALIZE DATES FROM GOOGLE SHEETS
        const normalizedData = {
          ...result.data,
          expenses: result.data.expenses.map(expense => ({
            ...expense,
            date: normalizeDateForComparison(expense.date),
            originalDate: expense.date // Keep original for debugging
          }))
        };
        
        // Debug: Check date conversion
        console.log('Date conversion debug:');
        result.data.expenses.slice(0, 3).forEach((expense, i) => {
          console.log(`Expense ${i}:`, {
            original: expense.date,
            normalized: normalizeDateForComparison(expense.date),
            today: getTodayDateString()
          });
        });
        
        dispatch({ type: 'LOAD_DATA', payload: normalizedData });
        setLastSyncTime(new Date());
        setConnectionStatus('connected');
        localStorage.setItem('expenseTrackerLastModified', new Date().toISOString());
        alert(`✅ Loaded ${normalizedData.expenses.length} expenses from Google Sheets! Dates normalized to your local timezone.`);
      } else {
        alert('No data found in Google Sheets.');
      }
      
    } catch (error) {
      setConnectionStatus('error');
      alert(`❌ Failed to load from Google Sheets: ${error.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  // Load data on component mount with enhanced date handling
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const data = await loadInitialData();
        dispatch({ type: 'LOAD_DATA', payload: data });
        if (data.expenses.length > 0) {
          setLastSyncTime(new Date());
        }
        
        // Debug: Check current dates
        console.log('Current date debug:', {
          today: getTodayDateString(),
          localTime: new Date().toString(),
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          expensesToday: data.expenses.filter(exp => exp.date === getTodayDateString()).length
        });
        
      } catch (error) {
        console.error('Failed to load initial data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Auto-save to Google Sheets when data changes
  useEffect(() => {
    const autoSave = async () => {
      if (state.expenses.length === 0 || !navigator.onLine || isLoading) {
        return;
      }

      // Don't save too frequently
      const lastSaveTime = localStorage.getItem('lastAutoSaveTime');
      const now = Date.now();
      if (lastSaveTime && (now - parseInt(lastSaveTime)) < 5000) {
        return;
      }

      const lastSaveHash = localStorage.getItem('lastSaveDataHash');
      const currentHash = JSON.stringify(state.expenses);
      
      // Only save if data has actually changed
      if (lastSaveHash === currentHash) {
        return;
      }

      console.log('Auto-saving to Google Sheets...');
      const success = await saveToGoogleSheets();
      if (success) {
        localStorage.setItem('lastAutoSaveTime', now.toString());
        localStorage.setItem('lastSaveDataHash', currentHash);
        localStorage.setItem('expenseTrackerLastModified', new Date().toISOString());
      }
    };

    autoSave();
  }, [state.expenses, isLoading]);

  // Online/Offline Detection
  useEffect(() => {
    const handleOnline = async () => {
      console.log('Connection restored - syncing data...');
      setConnectionStatus('connected');
      
      // Wait a moment for stable connection, then sync
      setTimeout(async () => {
        if (state.expenses.length > 0) {
          // First, try to push local changes to Sheets
          const success = await saveToGoogleSheets();
          if (success) {
            console.log('Local changes synced to Google Sheets');
          } else {
            // If push fails, pull from Sheets but preserve local changes
            await loadFromGoogleSheets();
          }
        }
      }, 3000);
    };

    const handleOffline = () => {
      console.log('Connection lost - using local data');
      setConnectionStatus('disconnected');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Set initial status
    setConnectionStatus(navigator.onLine ? 'connected' : 'disconnected');

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [state.expenses]);

  // Test connection
  const testGoogleConnection = async () => {
    setIsSyncing(true);
    setConnectionStatus('connecting');
    
    try {
      const url = `${GOOGLE_APPS_SCRIPT_URL}?action=test`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        setConnectionStatus('connected');
        alert('✅ Connection test successful! Google Sheets is connected.');
      } else {
        throw new Error(result.error || 'Connection test failed');
      }
      
    } catch (error) {
      setConnectionStatus('error');
      alert(`❌ Connection test failed: ${error.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'text-green-600';
      case 'connecting': return 'text-yellow-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case 'connected': return isSyncing ? 'Syncing...' : 'Connected';
      case 'connecting': return 'Connecting...';
      case 'error': return 'Connection Error';
      default: return navigator.onLine ? 'Disconnected' : 'Offline';
    }
  };

  // Enhanced expense form with today's date as default
  const [expenseForm, setExpenseForm] = useState({
    productName: '',
    sku: '',
    category: '',
    quantity: '',
    rate: '',
    totalAmount: '',
    date: getTodayDateString() // Always use today's date in local timezone
  });

  const calculateTotalAmount = (quantity, rate) => {
    const qty = parseFloat(quantity) || 0;
    const rt = parseFloat(rate) || 0;
    return (qty * rt).toFixed(2);
  };

  const handleFormChange = (field, value) => {
    const updatedForm = {
      ...expenseForm,
      [field]: value
    };

    if (field === 'quantity' || field === 'rate') {
      const calculatedAmount = calculateTotalAmount(
        field === 'quantity' ? value : updatedForm.quantity,
        field === 'rate' ? value : updatedForm.rate
      );
      updatedForm.totalAmount = calculatedAmount;
    }

    setExpenseForm(updatedForm);
  };

  const exportData = () => {
    try {
      const dataStr = JSON.stringify(state, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `expense-backup-${getTodayDateString()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      alert('Data exported successfully!');
    } catch (error) {
      alert('Failed to export data: ' + error.message);
    }
  };

  const exportCSV = (rows, filename = `expenses-${getTodayDateString()}.csv`) => {
    try {
      if (!rows || rows.length === 0) {
        alert('No rows to export.');
        return;
      }
      const headers = ['Date','Product Name','SKU','Category','Quantity','Total Amount (NGN)'];
      const escape = (v) => {
        if (v === null || v === undefined) return '';
        const s = String(v);
        return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
      };
      const lines = [
        headers.join(','),
        ...rows.map(r => [
          escape(r.date),
          escape(r.productName),
          escape(r.sku),
          escape(r.category),
          escape(r.quantity),
          escape(r.totalAmount)
        ].join(','))
      ];
      const csv = lines.join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to export CSV: ' + err.message);
    }
  };

  const exportAllCSV = () => exportCSV(state.expenses, `expenses-all-${getTodayDateString()}.csv`);

  const getLastMonthRange = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end = new Date(now.getFullYear(), now.getMonth(), 0);
    return {
      startDate: start,
      endDate: end,
      startStr: getLocalDateString(start),
      endStr: getLocalDateString(end),
      label: start.toLocaleString(undefined, { month: 'long', year: 'numeric' })
    };
  };

  const exportLastMonthCSV = () => {
    const { startStr, endStr, label } = getLastMonthRange();
    const rows = state.expenses.filter(e => e.date >= startStr && e.date <= endStr);
    exportCSV(rows, `expenses-${label.replace(' ', '-')}.csv`);
  };

  const importData = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        if (file.name.endsWith('.json')) {
          const importedData = JSON.parse(e.target.result);
          if (importedData.expenses && Array.isArray(importedData.expenses)) {
            if (window.confirm(`Import ${importedData.expenses.length} expenses from JSON? This will replace your current data.`)) {
              dispatch({ type: 'LOAD_DATA', payload: importedData });
              setTimeout(() => saveToGoogleSheets(importedData.expenses), 1000);
              alert('Data imported successfully from JSON!');
            }
          } else {
            alert('Invalid JSON file format.');
          }
        } else {
          alert('Please select a .json file.');
        }
      } catch (error) {
        alert('Failed to import data: ' + error.message);
      }
    };
    
    reader.onerror = () => {
      alert('Error reading file');
    };
    
    reader.readAsText(file);
    event.target.value = '';
  };

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
    { id: 'expenses', label: 'Add Expenses', icon: Plus },
    { id: 'reports', label: 'Reports', icon: PieChart },
    { id: 'history', label: 'History', icon: Calendar }
  ];

  // FIX 1: Update categories to include numbers and handle mixed alphanumeric categories
  const categories = useMemo(() => {
    const cats = [...new Set(state.expenses.map(exp => exp.category))].filter(Boolean);
    return ['All', ...cats.sort((a, b) => {
      // Sort categories naturally (numbers and text mixed)
      return a.toString().localeCompare(b.toString(), undefined, { numeric: true, sensitivity: 'base' });
    })];
  }, [state.expenses]);

  // NEW: Products filter for expense reports
  const products = useMemo(() => {
    const prods = [...new Set(state.expenses.map(exp => exp.productName))].filter(Boolean);
    return ['All', ...prods.sort((a, b) => {
      // Sort products naturally (numbers and text mixed)
      return a.toString().localeCompare(b.toString(), undefined, { numeric: true, sensitivity: 'base' });
    })];
  }, [state.expenses]);

  // FIXED: Enhanced date calculations with proper week calculation
  const getDateRanges = () => {
    const today = new Date();
    const todayStr = getTodayDateString();
    
    // FIX: Proper week calculation - get Monday of current week
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const monday = new Date(today);
    
    // Calculate Monday: if today is Sunday (0), go back 6 days, otherwise go back (dayOfWeek - 1) days
    const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    monday.setDate(today.getDate() - daysToSubtract);
    
    const weekStart = getLocalDateString(monday);
    
    const monthStart = getLocalDateString(new Date(today.getFullYear(), today.getMonth(), 1));
    
    console.log('Date ranges:', { todayStr, weekStart, monthStart, dayOfWeek, daysToSubtract });
    
    return { todayStr, weekStart, monthStart };
  };

  const getLastMonthStats = useMemo(() => {
    const { startStr, endStr, label } = getLastMonthRange();
    const rows = state.expenses.filter(e => e.date >= startStr && e.date <= endStr);
    const total = rows.reduce((sum, e) => sum + (parseFloat(e.totalAmount) || 0), 0);
    return { label, startStr, endStr, rows, total, count: rows.length };
  }, [state.expenses]);

  // Enhanced expense calculations with proper date comparison
  const calculateExpenses = useMemo(() => {
    const { todayStr, weekStart, monthStart } = getDateRanges();
    
    console.log('Date ranges for calculations:', { todayStr, weekStart, monthStart });

    const filterByPeriod = (expenses, period) => {
      switch (period) {
        case 'daily':
          const dailyExpenses = expenses.filter(exp => normalizeDateForComparison(exp.date) === todayStr);
          console.log('Daily expenses:', { 
            totalExpenses: expenses.length, 
            dailyCount: dailyExpenses.length,
            today: todayStr,
            sampleDates: expenses.slice(0, 3).map(e => ({ date: e.date, normalized: normalizeDateForComparison(e.date) }))
          });
          return dailyExpenses;
        case 'weekly':
          const weeklyExpenses = expenses.filter(exp => normalizeDateForComparison(exp.date) >= weekStart);
          console.log('Weekly expenses:', {
            totalExpenses: expenses.length,
            weeklyCount: weeklyExpenses.length,
            weekStart: weekStart,
            weekEnd: todayStr,
            sampleDates: weeklyExpenses.slice(0, 3).map(e => ({ date: e.date, normalized: normalizeDateForComparison(e.date) }))
          });
          return weeklyExpenses;
        case 'monthly':
          return expenses.filter(exp => normalizeDateForComparison(exp.date) >= monthStart);
        case 'alltime':
          return expenses;
        default:
          return expenses;
      }
    };

    const filterByCategory = (expenses) => {
      if (selectedCategory === 'All') return expenses;
      return expenses.filter(exp => exp.category === selectedCategory);
    };

    const filterByProduct = (expenses) => {
      if (selectedProduct === 'All') return expenses;
      return expenses.filter(exp => exp.productName === selectedProduct);
    };

    // Apply both category and product filters
    const filteredByCategory = filterByCategory(state.expenses);
    const filteredByBoth = filterByProduct(filteredByCategory);
    const filteredExpenses = filterByPeriod(filteredByBoth, selectedPeriod);
    
    const totalExpense = filteredExpenses.reduce((sum, exp) => sum + exp.totalAmount, 0);

    const categoryTotals = {};
    state.expenses.forEach(exp => {
      const normalizedDate = normalizeDateForComparison(exp.date);
      if (!categoryTotals[exp.category]) {
        categoryTotals[exp.category] = { 
          daily: 0, 
          weekly: 0, 
          monthly: 0,
          alltime: 0
        };
      }
      if (normalizedDate === todayStr) categoryTotals[exp.category].daily += exp.totalAmount;
      if (normalizedDate >= weekStart) categoryTotals[exp.category].weekly += exp.totalAmount;
      if (normalizedDate >= monthStart) categoryTotals[exp.category].monthly += exp.totalAmount;
      categoryTotals[exp.category].alltime += exp.totalAmount;
    });

    const dailyTotal = state.expenses
      .filter(exp => normalizeDateForComparison(exp.date) === todayStr)
      .reduce((sum, exp) => sum + exp.totalAmount, 0);

    const weeklyTotal = state.expenses
      .filter(exp => normalizeDateForComparison(exp.date) >= weekStart)
      .reduce((sum, exp) => sum + exp.totalAmount, 0);

    const monthlyTotal = state.expenses
      .filter(exp => normalizeDateForComparison(exp.date) >= monthStart)
      .reduce((sum, exp) => sum + exp.totalAmount, 0);

    return {
      daily: dailyTotal,
      weekly: weeklyTotal,
      monthly: monthlyTotal,
      alltime: state.expenses.reduce((sum, exp) => sum + exp.totalAmount, 0),
      filtered: totalExpense,
      categoryTotals,
      filteredExpenses,
      debug: {
        today: todayStr,
        dailyCount: state.expenses.filter(exp => normalizeDateForComparison(exp.date) === todayStr).length,
        weeklyCount: state.expenses.filter(exp => normalizeDateForComparison(exp.date) >= weekStart).length
      }
    };
  }, [state.expenses, selectedPeriod, selectedCategory, selectedProduct]);

  const formatNaira = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const resetForm = () => {
    setExpenseForm({
      productName: '',
      sku: '',
      category: '',
      quantity: '',
      rate: '',
      totalAmount: '',
      date: getTodayDateString() // Reset to today's date
    });
    setEditingExpense(null);
  };

  const openModal = (expense = null) => {
    setEditingExpense(expense);
    if (expense) {
      setExpenseForm({
        productName: expense.productName,
        sku: expense.sku,
        category: expense.category,
        quantity: expense.quantity.toString(),
        rate: '',
        totalAmount: expense.totalAmount.toString(),
        date: expense.date
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    resetForm();
  };

  // Enhanced form submission with date validation
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate date is not in the future
    const selectedDate = new Date(expenseForm.date);
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today
    
    if (selectedDate > today) {
      alert('Cannot add expenses for future dates. Please select today or a past date.');
      return;
    }

    const expenseData = {
      ...expenseForm,
      quantity: parseInt(expenseForm.quantity),
      totalAmount: parseFloat(expenseForm.totalAmount),
      // Ensure date is normalized
      date: normalizeDateForComparison(expenseForm.date)
    };

    if (editingExpense) {
      syncDispatch({ type: 'UPDATE_EXPENSE', payload: { ...expenseData, id: editingExpense.id } });
    } else {
      syncDispatch({ type: 'ADD_EXPENSE', payload: expenseData });
    }
    closeModal();
  };

  const deleteExpense = (id) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      syncDispatch({ type: 'DELETE_EXPENSE', payload: id });
    }
  };

  // FIX 2: Enhanced search to handle numbers and alphabets properly
  const filteredHistoryExpenses = useMemo(() => {
    const searchTerm = historySearchTerm.toLowerCase().trim();
    
    if (!searchTerm) {
      return state.expenses.sort((a, b) => {
        const dateCompare = b.date.localeCompare(a.date);
        if (dateCompare !== 0) return dateCompare;
        return b.id - a.id;
      });
    }

    const filtered = state.expenses.filter(exp => {
      // Convert all values to strings for safe searching
      const productName = String(exp.productName || '').toLowerCase();
      const category = String(exp.category || '').toLowerCase();
      const sku = String(exp.sku || '').toLowerCase();
      const date = String(exp.date || '');
      const quantity = String(exp.quantity || '');
      const totalAmount = String(exp.totalAmount || '');

      return (
        productName.includes(searchTerm) ||
        category.includes(searchTerm) ||
        sku.includes(searchTerm) ||
        date.includes(searchTerm) ||
        quantity.includes(searchTerm) ||
        totalAmount.includes(searchTerm)
      );
    });
    
    return filtered.sort((a, b) => {
      const dateCompare = b.date.localeCompare(a.date);
      if (dateCompare !== 0) return dateCompare;
      return b.id - a.id;
    });
  }, [state.expenses, historySearchTerm]);

  // FIXED: Enhanced date filtering with proper week calculation
  const dateFilteredExpenses = useMemo(() => {
    if (dateFilter === 'all') return filteredHistoryExpenses;
    
    const today = new Date();
    let startDate, endDate;

    switch (dateFilter) {
      case 'daily':
        startDate = getTodayDateString();
        endDate = getTodayDateString();
        break;
      case 'weekly':
        // FIX: Use the same week calculation as getDateRanges()
        const dayOfWeek = today.getDay();
        const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        const monday = new Date(today);
        monday.setDate(today.getDate() - daysToSubtract);
        startDate = getLocalDateString(monday);
        endDate = getTodayDateString();
        break;
      case 'monthly':
        startDate = getLocalDateString(new Date(today.getFullYear(), today.getMonth(), 1));
        endDate = getTodayDateString();
        break;
      case 'custom':
        startDate = customStartDate;
        endDate = customEndDate;
        break;
      default:
        return filteredHistoryExpenses;
    }

    return filteredHistoryExpenses.filter(expense => 
      expense.date >= startDate && expense.date <= endDate
    );
  }, [filteredHistoryExpenses, dateFilter, customStartDate, customEndDate]);

  const paginatedHistoryExpenses = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return dateFilteredExpenses.slice(startIndex, endIndex);
  }, [dateFilteredExpenses, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(dateFilteredExpenses.length / itemsPerPage);

  const paginatedReportsExpenses = useMemo(() => {
    const startIndex = (reportsCurrentPage - 1) * reportsItemsPerPage;
    const endIndex = startIndex + reportsItemsPerPage;
    return calculateExpenses.filteredExpenses.slice(startIndex, endIndex);
  }, [calculateExpenses.filteredExpenses, reportsCurrentPage, reportsItemsPerPage]);

  const reportsTotalPages = Math.ceil(calculateExpenses.filteredExpenses.length / reportsItemsPerPage);

  const printHistoryTable = () => {
    const totalAmount = dateFilteredExpenses.reduce((sum, exp) => sum + exp.totalAmount, 0);
    
    let dateRangeLabel = 'All Time';
    const today = new Date();
    
    switch (dateFilter) {
      case 'daily':
        dateRangeLabel = `Daily - ${getTodayDateString()}`;
        break;
      case 'weekly':
        // FIX: Use same week calculation for consistency
        const dayOfWeek = today.getDay();
        const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        const monday = new Date(today);
        monday.setDate(today.getDate() - daysToSubtract);
        const weekStart = getLocalDateString(monday);
        dateRangeLabel = `Weekly - ${weekStart} to ${getTodayDateString()}`;
        break;
      case 'monthly':
        const monthStart = getLocalDateString(new Date(today.getFullYear(), today.getMonth(), 1));
        dateRangeLabel = `Monthly - ${monthStart} to ${getTodayDateString()}`;
        break;
      case 'custom':
        dateRangeLabel = `Custom - ${customStartDate} to ${customEndDate}`;
        break;
      default:
        dateRangeLabel = 'All Time';
    }
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Expense History - ${dateRangeLabel}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; color: #3a3a3a; }
            .header { border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
            .date-range { color: #666; font-size: 14px; margin-top: 5px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; font-weight: bold; }
            .total-row { font-weight: bold; background-color: #f9f9f9; }
            .summary { margin-bottom: 20px; padding: 10px; background-color: #f5f5f5; border-radius: 5px; }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>Expense History - ${dateRangeLabel}</h2>
            <p class="date-range">Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
          </div>
          
          <div class="summary">
            <p><strong>Period Summary:</strong> ${dateFilteredExpenses.length} expenses • Total: ${formatNaira(totalAmount)}</p>
          </div>

          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Product</th>
                <th>SKU</th>
                <th>Category</th>
                <th>Quantity</th>
                <th>Total Amount</th>
              </tr>
            </thead>
            <tbody>
              ${dateFilteredExpenses.map(expense => `
                <tr>
                  <td>${expense.date}</td>
                  <td>${expense.productName}</td>
                  <td>${expense.sku}</td>
                  <td>${expense.category}</td>
                  <td>${expense.quantity}</td>
                  <td>${formatNaira(expense.totalAmount)}</td>
                </tr>
              `).join('')}
              <tr class="total-row">
                <td colspan="5" style="text-align: right; color:green">Total Amount for ${dateRangeLabel}:</td>
                <td style="color:green">${formatNaira(totalAmount)}</td>
              </tr>
            </tbody>
          </table>
          
          <div class="no-print" style="margin-top: 20px; padding: 10px; background-color: #f0f0f0; border-radius: 5px;">
            <p style="font-size: 12px; color: #666; text-align: center;">
              Printed from Business Expense Tracker • ${window.location.hostname}
            </p>
          </div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  // Add date debug panel to dashboard
  const renderDateDebugPanel = () => (
    <div className="">
      {/* <h4 className="text-sm font-bold text-yellow-800 mb-2">Date Debug Info</h4> */}
    
        {/* <div>
          <span className="font-medium">Today:</span> {getTodayDateString()}
        </div> */}
        {/* <div>
          <span className="font-medium">Timezone:</span> {Intl.DateTimeFormat().resolvedOptions().timeZone}
        </div> */}
        {/* <div>
          <span className="font-medium">Today's Expenses:</span> {calculateExpenses.debug.dailyCount}
        </div> */}
        {/* <div>
          <span className="font-medium">Local Time:</span> {new Date().toLocaleString()}
        </div> */}
   
    </div>
  );

  const renderDashboard = () => (
    <div className="space-y-6 max-w-8xl mx-auto">
      <div className="flex justify-between items-center">
        <h2 className="text-xl aeon-bold gray200">Expense Dashboard</h2>
        <div className="flex items-center space-x-3">
          <button
            onClick={loadFromGoogleSheets}
            disabled={isSyncing}
            className="border border-green-600 bg-white text-green-600 px-3 py-2 inter rounded-[14px] hover:bg-green-600
             hover:text-white flex items-center gap-2 text-xs disabled:opacity-50"
            title="Refresh data from Sheets"
          >
            <Download className="h-4 w-4" /> 
            {isSyncing ? 'Loading...' : 'Refresh Data'}
          </button>

          <button
            onClick={exportData}
            className="border border-indigo-600 text-indigo-600 bg-white px-3 py-2 rounded-[14px] hover:bg-indigo-600 hover:!text-white flex items-center gap-2 text-xs inter"
            title="Download JSON backup"
          >
            <Download className="h-4 w-4" /> Export JSON
          </button>

          <button
            onClick={exportAllCSV}
            className="border border-purple-600 text-purple-600 bg-white px-3 py-2 rounded-[14px] hover:bg-purple-600 flex items-center gap-2 text-xs inter hover:text-white"
            title="Download CSV"
          >
            <Download className="h-4 w-4" /> Export CSV
          </button>

          <div className="relative">
            <input
              type="file"
              accept=".json"
              onChange={importData}
              id="import-file"
              className="hidden"
            />
            <label 
              htmlFor="import-file"
              className="border border-pink-500 text-pink-500 px-3 py-2 rounded-[14px] bg-white hover:!bg-pink-500 hover:!text-white flex items-center gap-2 text-xs cursor-pointer transition-colors duration-200"
              title="Import JSON backup"
            >
              <Upload className="h-4 w-4" /> Import
            </label>
          </div>
        </div>
      </div>

      {/* Add debug panel - remove this in production */}
      {process.env.NODE_ENV === 'development' && renderDateDebugPanel()}

      {/* Connection Status Banner */}
      {connectionStatus === 'disconnected' && (
        <div className="bg-white border border-orange-200 p-3 rounded-lg">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-orange-400 tracking-widest" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-xs text-yellow-700 tr">
                You are currently offline. Expenses are being saved locally and will sync when connection is restored.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white p-4 rounded-[14px] border border-green-200">
        <p className="text-green-800 text-sm inter">
          <span className="gray200 intermid">Data Status: </span>
          {state.expenses.length} expenses stored {connectionStatus === 'disconnected' ? 'locally' : 'in Sheets'}. 
          <span className="text-green-600"> Data automatically saves after every change.</span>
          <br />
          {lastSyncTime && (
            <span className="text-blue-600 text-xs">
              Last synced: {lastSyncTime.toLocaleString()}
            </span>
          )}
          <br />
          <span className={`text-xs ${navigator.onLine ? 'text-green-600' : 'text-orange-400'}`}>
            {navigator.onLine ? 
              '✓ Internet connected - real-time sync enabled' : 
              '⚠ Offline - will sync when connection returns'}
          </span>
        </p>
      </div>

      {isLoading ? (
        <div className="bg-white p-6 rounded-[14px] border border-gray-200 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading expenses...</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-cloud p-6 rounded-[14px] border shadow-xs border-blue-50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-50 text-sm inter font-medium"> Today's Expenses</p>
                  <p className="text-2xl aeon-bold text-white">{formatNaira(calculateExpenses.daily)}</p>
                  <p className="text-blue-100 text-xs mt-1">
                    {state.expenses.filter(exp => normalizeDateForComparison(exp.date) === getTodayDateString()).length} records
                  </p>
                </div>
                <div className='w-14 h-14 rounded-full bg-blue-50 border shadow-md border-white'>
                  <img src={today} className="p-3 text-blue-500" />
                </div>
              </div>
            </div>
            
            <div className="bg-green-500 p-6 rounded-[14px] border border-green-50 shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-50 text-sm inter font-medium">This Week's Expenses</p>
                  <p className="text-2xl aeon-bold text-white">{formatNaira(calculateExpenses.weekly)}</p>
                  <p className="text-green-100 text-xs mt-1">
                    {calculateExpenses.debug.weeklyCount} records this week
                  </p>
                </div>
                <div className='w-14 h-14 rounded-full bg-green-50 border shadow-md border-white'>
                  <img src={trend} className="p-3 text-green-500" />
                </div>
              </div>
            </div>
            
            <div className="bg-purple-600 p-6 rounded-[14px] border border-purple-50 shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-50 text-sm inter font-medium">This Month's Expenses</p>
                  <p className="text-2xl aeon-bold text-white">{formatNaira(calculateExpenses.monthly)}</p>
                </div>
                <div className='w-14 h-14 rounded-full bg-purple-50 border shadow-md border-white'>
                  <img src={pack} className="p-3 text-purple-500" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-[14px] border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm inter text-gray-600">Last Month ({getLastMonthStats.label})</p>
                <p className="text-xl aeon-bold text-gray-800">{formatNaira(getLastMonthStats.total)}</p>
              </div>
              <button
                onClick={exportLastMonthCSV}
                className="bg-purple-600 text-white px-3 py-2 inter rounded-[14px] hover:bg-purple-700 text-xs"
                title="Export last month's data to CSV"
              >
                Export Last Month CSV
              </button>
            </div>
            <p className="text-xs inter text-gray-500 mt-1">
              {getLastMonthStats.count} entries from {getLastMonthStats.startStr} to {getLastMonthStats.endStr}
            </p>
          </div>

          {Object.keys(calculateExpenses.categoryTotals).length > 0 ? (
            <div className="bg-white p-6 rounded-[14px] border border-gray-200">
              <h3 className="text-lg aeon-bold gray200 mb-6">Top Expenses by Category</h3>
              {(() => {
                const categoryData = Object.entries(calculateExpenses.categoryTotals)
                  .map(([category, totals]) => ({
                    category,
                    amount: totals.alltime,
                    percentage: (totals.alltime / calculateExpenses.alltime) * 100
                  }))
                  .sort((a, b) => b.amount - a.amount);

                const topCategories = categoryData.slice(0, 5);
                const othersAmount = categoryData.slice(5).reduce((sum, item) => sum + item.amount, 0);
                const othersPercentage = (othersAmount / calculateExpenses.alltime) * 100;

                const displayCategories = othersAmount > 0 
                  ? [...topCategories, { category: 'Others', amount: othersAmount, percentage: othersPercentage }]
                  : topCategories;

                const maxAmount = Math.max(...displayCategories.map(item => item.amount));

                return (
                  <div className="space-y-4">
                    {displayCategories.map((item, index) => {
                      const barWidth = (item.amount / maxAmount) * 100;
                      const colors = [
                        'bg-blue-500', 'bg-green-500', 'bg-purple-500', 
                        'bg-orange-500', 'bg-pink-500', 'bg-gray-400'
                      ];
                      
                      return (
                        <div key={item.category} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center space-x-3">
                              <div className={`w-3 h-3 rounded-full ${colors[index] || 'bg-gray-400'}`}></div>
                              <span className="text-sm intermid gray200 min-w-[100px]">
                                {item.category}
                              </span>
                            </div>
                            <div className="text-right">
                              <p className="text-sm intermid gray200">{formatNaira(item.amount)}</p>
                              <p className="text-xs inter text-gray-500">{item.percentage.toFixed(1)}%</p>
                            </div>
                          </div>
                          
                          <div className="w-full bg-gray-200 rounded-full h-3">
                            <div 
                              className={`h-3 rounded-full ${colors[index] || 'bg-gray-400'} transition-all duration-500`}
                              style={{ width: `${barWidth}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                    
                    <div className="pt-4 border-t border-gray-200">
                      <div className="flex justify-between items-center">
                        <span className="text-sm inter text-gray-600">Total All Time</span>
                        <span className="text-lg aeon-bold text-green-600">
                          {formatNaira(calculateExpenses.alltime)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          ) : (
            <div className="bg-white p-6 rounded-[14px] border border-indigo-100">
              <div className="text-center py-8 text-gray-500">
                <div className='bg-blue-50 border border-blue-100 w-16 h-16 mx-auto rounded-full'>
                  <img src={box} className="opacity-50 p-2 mx-auto mb-4" />
                </div>
                <p className="mb-2 inter">No expenses recorded yet</p>
                <p className="text-sm inter">Start by adding your first expense to see category breakdowns here.</p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );

  const renderExpenses = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl aeon-bold text-gray-800 flex items-center">
          <span className='bg-blue-50 rounded-[8px] w-7 h-7 mr-2'><img src={add} className="p-1" /></span> 
          Add New Expense
        </h3>
        <button
          onClick={() => openModal()}
          className="bg-green-600 text-white inter text-xs px-4 py-2 rounded-[14px] hover:bg-green-700 flex items-center gap-2"
        >
          <Plus className="h-4 w-4" /> Add New Expense
        </button>
      </div>

      <div className="bg-white p-6 rounded-[14px] border border-green-200 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
        <h3 className="text-lg aeon-bold text-green-600 mb-4">Quick Add Expense</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 inter gray200">
            <input
              type="text"
              placeholder="Product Name"
              value={expenseForm.productName}
              onChange={(e) => handleFormChange('productName', e.target.value)}
              className="p-3 text-sm inter border border-gray-200 rounded-lg outline-none"
              required
            />
            <input
              type="text"
              placeholder="S.Num (e.g., CEMENT-001)"
              value={expenseForm.sku}
              onChange={(e) => handleFormChange('sku', e.target.value)}
              className="p-3 inter text-sm border border-gray-200 rounded-lg outline-none"
              required
            />
            <input
              type="text"
              placeholder="Category (can include numbers)"
              value={expenseForm.category}
              onChange={(e) => handleFormChange('category', e.target.value)}
              className="p-3 inter text-sm border border-gray-200 rounded-lg outline-none"
              required
            />
            <input
              type="number"
              min="1"
              placeholder="Quantity"
              value={expenseForm.quantity}
              onChange={(e) => handleFormChange('quantity', e.target.value)}
              className="p-3 inter text-sm border border-gray-200 rounded-lg outline-none"
              required
            />
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="Rate (₦)"
              value={expenseForm.rate}
              onChange={(e) => handleFormChange('rate', e.target.value)}
              className="p-3 border text-sm inter border-gray-200 rounded-lg outline-none"
            />
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="Total Amount (₦)"
              value={expenseForm.totalAmount}
              onChange={(e) => handleFormChange('totalAmount', e.target.value)}
              className="p-3 border text-sm inter border-gray-200 rounded-lg outline-none"
              required
              readOnly
            />
          </div>
          
          {(expenseForm.rate || expenseForm.totalAmount) && (
            <div className="p-3 bg-green-50 rounded-lg">
              <div className="grid grid-cols-2 gap-4">
                {expenseForm.rate && (
                  <div>
                    <p className="text-green-600 text-sm">
                      Rate: <span className="font-medium aeon-bold">
                        {formatNaira(parseFloat(expenseForm.rate || 0))}
                      </span>
                    </p>
                  </div>
                )}
                {expenseForm.totalAmount && (
                  <div>
                    <p className="text-green-600 text-sm">
                      Total Amount: <span className="font-medium aeon-bold">
                        {formatNaira(parseFloat(expenseForm.totalAmount || 0))}
                      </span>
                    </p>
                  </div>
                )}
              </div>
              {expenseForm.quantity && expenseForm.rate && (
                <p className="text-xs text-green-500 mt-2">
                  Calculation: {expenseForm.quantity} × {formatNaira(parseFloat(expenseForm.rate))} = {formatNaira(parseFloat(expenseForm.totalAmount))}
                </p>
              )}
            </div>
          )}
          
          <button
            type="submit"
            className="bg-green-600 text-white px-4 py-3 rounded-[14px] hover:bg-gradient-to-r from-green-600 to-blue-600 text-md w-full intermid transform hover:scale-102 transition-all"
          >
            Add Expense
          </button>
        </form>
      </div>
      
      <div className="bg-white p-4 rounded-lg border border-blue-200">
        <p className="text-blue-600">
          <span className="aeon-bold">Today's Total Expenses: </span>
          <span className="text-xl aeon-bold">{formatNaira(calculateExpenses.daily)}</span>
        </p>
      </div>

      {state.expenses.length > 0 ? (
        <div className="bg-white p-6 rounded-[14px] border border-gray-200 ">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-lg gray200 aeon-bold">Recently Added Expenses</h3>
              <p className="text-sm  inter text-gray-500">Check here to avoid adding duplicate entries</p>
            </div>
          </div>
          
          <div className="overflow-x-auto ">
            <table className="w-full border-collapse border-gray-300">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-xs inter gray200 uppercase tracking-wider border-r border-gray-200">Product</th>
                  <th className="px-4 py-3 text-left text-xs inter gray200 uppercase tracking-wider border-r border-gray-200">SKU</th>
                  <th className="px-4 py-3 text-left text-xs inter gray200 uppercase tracking-wider border-r border-gray-200">Category</th>
                  <th className="px-4 py-3 text-left text-xs inter gray200 uppercase tracking-wider border-r border-gray-200 ">Quantity</th>
                  <th className="px-4 py-3 text-left text-xs inter gray200 uppercase tracking-wider border-r border-gray-200">Date</th>
                  <th className="px-4 py-3 text-left text-xs inter gray200 uppercase tracking-wider">Total Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {state.expenses.slice(-10).reverse().map((expense, index) => (
                  <tr key={expense.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-4 py-3 text-sm inter gray200 border-gray-200 border-r">{expense.productName}</td>
                    <td className="px-4 py-3 text-sm intermid  border-r border-gray-200">
                        <span className="px-2 py-1 inter rounded-full text-xs bg-blue-50 border border-blue-100 text-blue-500 "> {expense.sku}</span> </td>
                    <td className="px-4 py-3 text-sm border-r border-gray-200">
                      <span className="px-2 py-1 bg-pink-50 border border-pink-100 text-pink-600 rounded-full text-xs">
                        {expense.category}
                      </span>
                    </td>
                    <td className="px-4  py-3 text-sm gray200 inter border-r border-gray-200 text-center ">{expense.quantity}</td>
                    <td className="px-4 py-3 text-sm gray200 border-r inter border-gray-200">{expense.date}</td>
                    <td className="px-4 text-left py-3 text-sm inter  text-green-600">{formatNaira(expense.totalAmount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white p-6 rounded-[14px] border border-gray-200">
          <div className="text-center py-8 text-gray-500">
             <div className='bg-blue-50 border border-blue-100 w-16 h-16 mx-auto rounded-full'>
                <img src={text} className=" opacity-50 p-2 mx-auto mb-4" />
                </div>
            <p className="mb-2 inter">No expenses added yet</p>
            <p className="text-sm inter">Your recently added expenses will appear here to help prevent duplicates.</p>
          </div>
        </div>
      )}
    </div>
  );

  const renderModal = () => {
    if (!showModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg w-full max-w-md">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg intermid">
              {editingExpense ? 'Edit Expense' : 'Add New Expense'}
            </h3>
            <button onClick={closeModal} className="text-gray-500 hover:text-gray-700 text-2xl">
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 inter gray200">
            <input
              type="text"
              placeholder="Product Name"
              value={expenseForm.productName}
              onChange={(e) => handleFormChange('productName', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg outline-none"
              required
            />
            <input
              type="text"
              placeholder="SKU (e.g., CEMENT-ABJ-001, STEEL-LOS-002)"
              value={expenseForm.sku}
              onChange={(e) => handleFormChange('sku', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg outline-none"
              required
            />
            <input
              type="text"
              placeholder="Category (can include numbers like 123, 456, etc.)"
              value={expenseForm.category}
              onChange={(e) => handleFormChange('category', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg outline-none"
              required
            />
            <input
              type="number"
              min="1"
              placeholder="Quantity"
              value={expenseForm.quantity}
              onChange={(e) => handleFormChange('quantity', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg outline-none"
              required
            />
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="Rate per unit (₦)"
              value={expenseForm.rate}
              onChange={(e) => handleFormChange('rate', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg outline-none"
            />
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="Total Amount in Naira (₦)"
              value={expenseForm.totalAmount}
              onChange={(e) => handleFormChange('totalAmount', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg outline-none"
              required
              readOnly
            />
            <input
              type="date"
              value={expenseForm.date}
              onChange={(e) => handleFormChange('date', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg outline-none"
              required
            />
            
            {(expenseForm.rate || expenseForm.totalAmount) && (
              <div className="p-3 bg-green-50 rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                  {expenseForm.rate && (
                    <div>
                      <p className="text-green-800 text-sm">
                        <span className="font-medium">Rate: </span>
                        {formatNaira(parseFloat(expenseForm.rate || 0))}
                      </p>
                    </div>
                  )}
                  {expenseForm.totalAmount && (
                    <div>
                      <p className="text-green-800 text-sm">
                        <span className="font-medium">Total: </span>
                        {formatNaira(parseFloat(expenseForm.totalAmount || 0))}
                      </p>
                    </div>
                  )}
                </div>
                {expenseForm.quantity && expenseForm.rate && (
                  <p className="text-xs text-green-600 mt-2">
                    Auto-calculation: {expenseForm.quantity} × {formatNaira(parseFloat(expenseForm.rate))} = {formatNaira(parseFloat(expenseForm.totalAmount))}
                  </p>
                )}
              </div>
            )}

            <div className="flex space-x-3">
              <button 
                type="submit" 
                className="flex-1 bg-green-500 text-white py-3 rounded-[14px] hover:bg-green-600 inter"
              >
                {editingExpense ? 'Update' : 'Add'} Expense
              </button>
              <button 
                type="button" 
                onClick={closeModal} 
                className="flex-1 bg-gray-100 inter text-gray-700 py-3 rounded-[14px] hover:bg-gray-200"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const renderReports = () => {
    const totalAmount = calculateExpenses.filteredExpenses.reduce((sum, exp) => sum + exp.totalAmount, 0);

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl aeon-bold gray200">Expense Reports</h2>
          <div className="flex items-center space-x-4">
            {calculateExpenses.filteredExpenses.length > 0 && (
              <div className="bg-white border border-gray-300 rounded-[14px] px-3 py-2">
                <p className="text-gray-500 text-sm inter">
                  Page {reportsCurrentPage} of {reportsTotalPages} • {calculateExpenses.filteredExpenses.length} total entries
                </p>
            </div>
            )}
            
            {/* NEW: Product Filter */}
            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="p-2 border rounded-[14px] border-gray-300 bg-white gray200 inter text-md  outline-none"
            >
              {products.map(product => (
                <option key={product} value={product}>{product}</option>
              ))}
            </select>
<select
  value={selectedCategory}
  onChange={(e) => setSelectedCategory(e.target.value)}
      className="p-2 border rounded-[14px] border-gray-300 bg-white gray200 inter text-md  outline-none"
            >
  {categories.map((cat) => (
    <option key={cat} value={cat} className="bg-white text-gray-700 hover:bg-blue-100">
      {cat}
    </option>
  ))}
</select>


            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
             className="p-2 border rounded-[14px] border-gray-300 bg-white gray200 inter text-md  outline-none"
            
            >
              <option value="daily">Today</option>
              <option value="weekly">This Week</option>
              <option value="monthly">This Month</option>
              <option value="alltime">All Time</option>
            </select>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[14px] border border-gray-200 ">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg aeon-bold gray200">
              {selectedProduct === 'All' ? 'All Products' : selectedProduct} - 
              {selectedCategory === 'All' ? ' All Categories' : ` ${selectedCategory}`} - 
              {selectedPeriod.charAt(0).toUpperCase() + selectedPeriod.slice(1)} Report
            </h3>
            <div className="text-right">
              <p className="text-2xl aeon-bold text-green-600">
                {formatNaira(calculateExpenses.filtered)}
              </p>
              <p className="text-sm gray200 inter">Total Expense</p>
            </div>
          </div>

          {paginatedReportsExpenses.length > 0 ? (
            <div className="space-y-3">
              {paginatedReportsExpenses.map(expense => (
                <div key={expense.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium gray200 intermid">{expense.productName}</p>
                    <p className="text-sm inter text-gray-600">
                      {expense.category} • {expense.date} • Qty: {expense.quantity}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="intermid font-medium tracking-wider gray200">{formatNaira(expense.totalAmount)}</p>
                    <p className="text-sm text-gray-600 inter">Qty: {expense.quantity}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
               <div className='bg-blue-50 border border-blue-100 w-16 h-16 mx-auto rounded-full'>
                  <img src={report} className=" opacity-60 p-2 mx-auto mb-4" />
                  </div>
              <p>No expenses found for the selected filters.</p>
            </div>
          )}

          {calculateExpenses.filteredExpenses.length > 0 && (
            <div className="flex items-center justify-between mt-4 px-6 py-3 bg-gray-50 border-t border-gray-200">
              <div className="flex items-center space-x-4 inter">
                <span className="text-sm inter text-gray-700 inter">
                  Showing {((reportsCurrentPage - 1) * reportsItemsPerPage) + 1} to {Math.min(reportsCurrentPage * reportsItemsPerPage, calculateExpenses.filteredExpenses.length)} of {calculateExpenses.filteredExpenses.length} entries
                </span>
                <select
                  value={reportsItemsPerPage}
                  onChange={(e) => {
                    setReportsItemsPerPage(Number(e.target.value));
                    setReportsCurrentPage(1);
                  }}
                  className="border border-gray-300 text-gray-700 inter rounded-[14px] px-2 py-2 text-sm inter outline-none"
                >
                  <option value={10}>10 per page</option>
                  <option value={20}>20 per page</option>
                  <option value={50}>50 per page</option>
                </select>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setReportsCurrentPage(1)}
                  disabled={reportsCurrentPage === 1}
                  className="px-3 py-1 border border-gray-300 rounded-lg inter text-sm inter disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                >
                  First
                </button>
                <button
                  onClick={() => setReportsCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={reportsCurrentPage === 1}
                  className="px-3 py-1 border border-gray-300 rounded-lg text-sm inter disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                >
                  Previous
                </button>
                
                <div className="flex space-x-1">
                  {Array.from({ length: Math.min(5, reportsTotalPages) }, (_, i) => {
                    let pageNum;
                    if (reportsTotalPages <= 5) {
                      pageNum = i + 1;
                    } else if (reportsCurrentPage <= 3) {
                      pageNum = i + 1;
                    } else if (reportsCurrentPage >= reportsTotalPages - 2) {
                      pageNum = reportsTotalPages - 4 + i;
                    } else {
                      pageNum = reportsCurrentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setReportsCurrentPage(pageNum)}
                        className={`w-8 h-8 rounded-lg text-sm inter ${
                          reportsCurrentPage === pageNum
                            ? 'bg-green-600 text-white'
                            : 'border border-gray-300 hover:bg-gray-100'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                
                <button
                  onClick={() => setReportsCurrentPage(prev => Math.min(prev + 1, reportsTotalPages))}
                  disabled={reportsCurrentPage === reportsTotalPages}
                  className="px-3 py-1 border border-gray-300 rounded-lg text-sm inter disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                >
                  Next
                </button>
                <button
                  onClick={() => setReportsCurrentPage(reportsTotalPages)}
                  disabled={reportsCurrentPage === reportsTotalPages}
                  className="px-3 py-1 border border-gray-300 rounded-lg text-sm inter disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                >
                  Last
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white p-4 rounded-lg border border-green-200">
          <p className="text-green-600">
            <span className="intermid">Total for selected filters: </span>
            <span className="text-xl aeon-bold">{formatNaira(totalAmount)}</span>
          </p>
        </div>
      </div>
    );
  };

  const renderHistory = () => {
    const totalAmount = dateFilteredExpenses.reduce((sum, exp) => sum + exp.totalAmount, 0);

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl aeon-bold gray200">Expense History</h2>
          <div className="flex items-center space-x-4">
            {dateFilteredExpenses.length > 0 && (
              <div className="bg-white border border-gray-300 rounded-[14px] px-3 py-2">
                <p className="text-gray-500 text-sm inter">
                  Page {currentPage} of {totalPages} • {dateFilteredExpenses.length} Entries
                </p>
              </div>
            )}
            
            <button
              onClick={printHistoryTable}
              className="border border-blue-600 text-blue-500 bg-white text-xs inter px-3 py-2 rounded-[14px] hover:bg-blue-600 hover:text-white flex items-center gap-2 print:hidden"
            >
              <Printer className="w-4 h-4" />Print History
            </button>

            <button
              onClick={() => exportCSV(dateFilteredExpenses, `expenses-${dateFilter}-${getTodayDateString()}.csv`)}
              className="border border-purple-600 text-purple-600 bg-white inter px-4 py-2 rounded-[14px] hover:!text-white hover:bg-purple-600 flex text-xs items-center gap-2 print:hidden"
              title="Export filtered data to CSV"
            >
              <Download className="h-4 w-4" /> Export CSV
            </button>
            
            <div className="relative bg-white rounded-[14px]">
              <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400 mb-2" />
              <input
                type="text"
                placeholder="Search expenses (numbers & text)..."
                value={historySearchTerm}
                onChange={(e) => setHistorySearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border text-sm border-gray-300 outline-none inter rounded-[14px] w-64"
              />
            </div>
          </div>
        </div>

        <div className="bg-white py-4 px-6 rounded-[14px] border border-purple-200">
          <div className="flex flex-row gap-4 items-end">
            <h3 className="text-sm intermid font-medium gray200 mb-2 mr-12 flex flex-row"> 
              Filter by Range</h3> 
            <div className="md:col-span-4">
              <div className="grid grid-cols-4 md:grid-cols-5 gap-5">
                <button
                  onClick={() => setDateFilter('all')}
                  className={`px-8 py-2 rounded-[14px] text-sm inter ${
                    dateFilter === 'all' 
                     ? 'bg-blue-50 border border-blue-300 text-blue-600 hover:bg-blue-100 shadow-xs ' 
                      : 'bg-white text-gray-500 border border-gray-200'
                  }`}
                >
                  All Time
                </button>
                <button
                  onClick={() => setDateFilter('daily')}
                className={`px-8 py-2 rounded-[14px] text-sm inter ${
                    dateFilter === 'daily' 
                      ? 'bg-blue-50 border border-blue-300 text-blue-600 hover:bg-blue-100 shadow-sm ' 
                      : 'bg-white text-gray-500 border border-gray-200'
                  }`}
                >
                  Today
                </button>
                <button
                  onClick={() => setDateFilter('weekly')}
                  className={`px-4 py-2 rounded-[14px] text-sm inter ${
                    dateFilter === 'weekly' 
                       ? 'bg-blue-50 border border-blue-300 text-blue-600 hover:bg-blue-100 shadow-xs ' 
                      : 'bg-white text-gray-500 border border-gray-200'
                  }`}
                >
                  This Week
                </button>
                <button
                  onClick={() => setDateFilter('monthly')}
                  className={`px-4 py-2 rounded-[14px] text-sm inter ${
                    dateFilter === 'monthly' 
                       ? 'bg-blue-50 border border-blue-300 text-blue-600 hover:bg-blue-100 shadow-xs ' 
                      : 'bg-white text-gray-500 border border-gray-200'
                  }`}
                >
                  This Month
                </button>

                {dateFilteredExpenses.length > 0 && (                   
                  <div className="flex items-center space-x-5">
                    <select
                      value={itemsPerPage}
                      onChange={(e) => {
                        setItemsPerPage(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="border border-gray-300 rounded-[14px] gray200 px-6 py-2 text-xs inter outline-none bg-white"
                    >
                      <option value={10}>10 page</option>
                      <option value={20}>20 page</option>
                      <option value={50}>50 page</option>
                      <option value={100}>100 page</option>
                    </select>
                  </div>
                )}
              </div>
            </div>
            
            {dateFilter === 'custom' && (
              <div className="md:col-span-1">
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="p-2 border border-gray-300 rounded-lg text-sm inter outline-none"
                  />
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="p-2 border border-gray-300 rounded-lg text-sm inter outline-none"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <div id="history-table" className="bg-white rounded-[14px] border border-blue-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="">
                <tr>
                  <th className="px-6 py-3 text-left text-xs inter gray200 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs inter gray200 uppercase tracking-wider">Product</th>
                  <th className="px-6 py-3 text-left text-xs inter gray200 uppercase tracking-wider">SKU</th>
                  <th className="px-6 py-3 text-left text-xs inter gray200 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs inter gray200 uppercase tracking-wider">Quantity</th>
                  <th className="px-6 py-3 text-left text-xs inter gray200 uppercase tracking-wider">Total Amount</th>
                  <th className="px-6 py-3 text-left text-xs inter gray200 uppercase tracking-wider print:hidden">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedHistoryExpenses.length > 0 ? (
                  paginatedHistoryExpenses.map(expense => (
                    <tr key={expense.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm inter text-gray-900">{expense.date}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm inter text-gray-900">{expense.productName}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 inter rounded-full text-xs bg-blue-50 border border-blue-100 text-blue-500">
                          {expense.sku}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 inter rounded-full text-xs bg-pink-50 border border-pink-100 text-pink-600">
                          {expense.category}
                        </span>
                      </td>
                      <td className="px-7 py-4 whitespace-nowrap inter text-sm text-gray-700">{expense.quantity}</td>
                      <td className="px-6 py-4 whitespace-nowrap inter text-sm text-green-600">
                        {formatNaira(expense.totalAmount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap print:hidden">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => openModal(expense)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <div className='py-1 px-1 rounded-[6px] bg-blue-50 border border-blue-100 text-gray-700 hover:bg-blue-100  hover:text-blue-600'>
                              <Edit2Icon size={12} />
                            </div>
                          </button>
                          <button
                            onClick={() => deleteExpense(expense.id)}
                            className="hover:text-red-800"
                          >
                            <div className='px-1 py-1 rounded-[6px] bg-red-50 text-gray-700 hover:text-red-600 hover:bg-red-100  border border-red-100
                            flex items-center '>
                              <Trash2 size={12} />
                            </div>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="px-6 py-8 text-center text-gray-500 inter">
                      {dateFilteredExpenses.length === 0 && filteredHistoryExpenses.length > 0 
                        ? `No expenses found for the selected date range.`
                        : `No expenses found matching your search criteria.`
                      }
                    </td>
                  </tr>
                )}
                {paginatedHistoryExpenses.length > 0 && (
                  <tr className="bg-gray-50 border-t-1 border-green-200">
                    <td colSpan="5" className="px-6 py-4 text-sm intermid font-medium text-green-600">
                        Total Amount Spent ({dateFilteredExpenses.length} entries):
                    </td>
                    <td className="px-6 py-4 text-sm intermid font-medium text-green-600">
                        {formatNaira(totalAmount)}
                    </td>
                    <td className="print:hidden"></td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {dateFilteredExpenses.length > 0 && (
            <div className="flex items-center justify-between mt-4 px-6 py-3 bg-gray-50 border-t border-gray-200">
              <div className="flex items-center space-x-4 inter">
                <span className="text-sm inter text-gray-700 inter">
                  Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, dateFilteredExpenses.length)} of {dateFilteredExpenses.length} entries
                </span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="border border-gray-300 text-gray-700 inter rounded-[14px] px-2 py-2 text-sm inter outline-none"
                >
                  <option value={10}>10 per page</option>
                  <option value={20}>20 per page</option>
                  <option value={50}>50 per page</option>
                  <option value={100}>100 per page</option>
                </select>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border border-gray-300 rounded-lg inter text-sm inter disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                >
                  First
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border border-gray-300 rounded-lg text-sm inter disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                >
                  Previous
                </button>
                
                <div className="flex space-x-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-8 h-8 rounded-lg text-sm inter ${
                          currentPage === pageNum
                            ? 'bg-green-600 text-white'
                            : 'border border-gray-300 hover:bg-gray-100'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border border-gray-300 rounded-lg text-sm inter disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                >
                  Next
                </button>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border border-gray-300 rounded-lg text-sm inter disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                >
                  Last
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white p-4 rounded-lg border border-green-200 print:hidden">
          <p className="text-green-600">
            <span className="intermid">Total of all expenses: </span>
            <span className="text-xl aeon-bold">{formatNaira(state.expenses.reduce((sum, exp) => sum + exp.totalAmount, 0))}</span>
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-shapee shadow-sm rounded-[14px] border border-white">
      <div className="inventory-gradient backdrop-blur-lg
       shadow-sm border-b border-gray-500 rounded-[14px]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-5">
          <div className="flex justify-between items-center py-4">

            <div>
              <h1 className="text-2xl aeon-bold text-white flex flex-row ">
                <span><img src={coins} className="w-12 mr-3 rounded-[4px]" /></span>Business Expense Tracker</h1>
              <p className="text-sm text-gray-400 tracking-wide inter mt-1">Track daily expenses and monitor spending by category</p>
            </div>

            <div className="text-right">
              <p className="text-sm text-gray-400 tracking-wide aeon-bold"> Total Expense</p>
             <p className="text-2xl aeon-bold text-green-400">{formatNaira(calculateExpenses.alltime)}</p>
            </div>
          </div>

          <div className='flex justify-between '>
            <nav className="flex space-x-8">
              {tabs.map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 py-4 px-1 border-b-2 aeon-bold text-sm ${
                      activeTab === tab.id
                        ? 'border-green-500 text-green-500'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
            
            <div className='flex flex-row gap-2 mb-4 mt-4'>
              <div className={` border border-indigo-800 text-xs  text-indigo-400 px-2 py-1
                 inter rounded-[8px]  flex items-center gap-2 text-[8px]
                     inter ${getConnectionStatusColor()} flex items-center gap-2`}>
                <div className={`w-3 h-3 rounded-full ${
                  connectionStatus === 'connected' ? 'bg-green-500' :
                  connectionStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' :
                  connectionStatus === 'error' ? 'bg-red-500' : 'bg-gray-500'
                }`}></div>
                {getConnectionStatusText()}
              </div>
              <button
                onClick={testGoogleConnection}
              className="border border-indigo-800 text-xs  text-indigo-400 px-2 py-1
                 inter rounded-[8px] hover:bg-indigo-700 hover:!text-white flex items-center gap-2 text-[8px]
                 transition-all"
                title="Test Google Sheets connection"
              >
                <img src={cloudd} className="h-3 w-3 " /> Connection Test
              </button>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-5">
        <div className="px-4 py-6 sm:px-0 outline-none">
          {activeTab === 'dashboard' && renderDashboard()}
          {activeTab === 'expenses' && renderExpenses()}
          {activeTab === 'reports' && renderReports()}
          {activeTab === 'history' && renderHistory()}
        </div>
      </main>

      {renderModal()}
    </div>
  );
}