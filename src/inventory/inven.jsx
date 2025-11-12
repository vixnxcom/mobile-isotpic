import React, { useState, useReducer, useMemo, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, Package, TrendingUp, Calendar, PieChart, Download, Upload, Save, Trash, Printer, Cloud } from 'lucide-react';
import { add, agenda, box, cloud, cloudd, coins, del, edit, pack, paycard, text, today, trend } from '../assets';
import useRealtimeSync from '../hooks/useRealtimeSync';

// GOOGLE APPS SCRIPT CONFIG - Replace with your web app URL
const GOOGLE_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzcAwNbMJiI6qFig0kev7K5ZCK65UEIDnZNVoOWZdWa1iNJvAmQxBYTb6XlDUicKGSRkQ/exec';

// Your existing Google Sheets config (keeping it for reference)
const GOOGLE_SHEETS_CONFIG = {
  CLIENT_ID: '495979327201-5s8egsb496hfnsd12mbf6s0tob5g6b3v.apps.googleusercontent.com',
  API_KEY: 'AIzaSyDycf787o-92tmfWTkXymi13MkOAfXgiiE',
  SPREADSHEET_ID: '1Q-GgLQqd7yoaGWSTLz6SAIqgtlLwbyuNjcmBX9SIvQc',
  SHEET_NAME: 'ExpenseData',
  SCOPES: 'https://www.googleapis.com/auth/spreadsheets'
};

const loadSavedData = () => {
  try {
    const saved = localStorage.getItem('expenseTrackerData');
    if (saved) {
      const parsed = JSON.parse(saved);
      console.log('Data loaded from storage:', parsed.expenses.length, 'expenses');
      return parsed;
    }
  } catch (error) {
    console.warn('Failed to load saved data:', error);
  }
  return { expenses: [] };
};

const initialState = loadSavedData();

function expenseReducer(state, action) {
  let newState;
  
  switch (action.type) {
    case 'ADD_EXPENSE':
      const newExpense = {
        ...action.payload,
        id: Date.now(),
        totalAmount: parseFloat(action.payload.totalAmount)
      };
      newState = { ...state, expenses: [...state.expenses, newExpense] };
      break;
    
    case 'UPDATE_EXPENSE':
      const updatedExpense = {
        ...action.payload,
        totalAmount: parseFloat(action.payload.totalAmount)
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
  
  try {
    localStorage.setItem('expenseTrackerData', JSON.stringify(newState));
    console.log('Data auto-saved to storage');
  } catch (error) {
    console.warn('Failed to save data to storage:', error);
  }
  
  return newState;
}

const localDateStr = (d = new Date()) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export default function InventoryExpenseTracker() {
  const [state, dispatch] = useReducer(expenseReducer, initialState);
  const { lastUpdate, triggerUpdate } = useRealtimeSync();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedPeriod, setSelectedPeriod] = useState('weekly');
  const [historySearchTerm, setHistorySearchTerm] = useState('');
  
  // PAGINATION STATE
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  
  // REPORTS PAGINATION STATE
  const [reportsCurrentPage, setReportsCurrentPage] = useState(1);
  const [reportsItemsPerPage, setReportsItemsPerPage] = useState(10);
  
  // DATE FILTER STATE (for History page)
  const [dateFilter, setDateFilter] = useState('all');
  const [customStartDate, setCustomStartDate] = useState(localDateStr());
  const [customEndDate, setCustomEndDate] = useState(localDateStr());
  
  // GOOGLE SHEETS STATE - UPDATED FOR APPS SCRIPT
  const [isGoogleAuthed, setIsGoogleAuthed] = useState(false);
  const [isSyncingToSheets, setIsSyncingToSheets] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');

  const syncDispatch = (action) => {
    dispatch(action);
    setTimeout(() => triggerUpdate(), 10);
  };

  // NEW: Google Apps Script Backup Function
  const backupToGoogleSheets = async () => {
    if (state.expenses.length === 0) {
      alert('No expenses to backup!');
      return;
    }

    setIsSyncingToSheets(true);
    setConnectionStatus('connecting');
    
    try {
      console.log('Starting backup to Google Sheets...', { expensesCount: state.expenses.length });
      
      const params = new URLSearchParams({
        action: 'saveExpenses',
        data: JSON.stringify({
          expenses: state.expenses,
          timestamp: new Date().toISOString(),
          totalExpenses: state.expenses.length,
          backupType: 'manual'
        })
      });
      
      const url = `${GOOGLE_APPS_SCRIPT_URL}?${params.toString()}`;
      console.log('Making request to:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        mode: 'cors'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const responseText = await response.text();
      console.log('Raw response:', responseText);
      
      let result;
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        throw new Error(`Invalid JSON response: ${responseText}`);
      }
      
      if (!result.success) {
        throw new Error(result.error || 'Unknown server error occurred');
      }
      
      setLastSyncTime(new Date());
      setConnectionStatus('connected');
      alert(`✅ Successfully backed up ${state.expenses.length} expenses to Google Sheets!`);
      
    } catch (error) {
      console.error('Sheets backup error:', error);
      setConnectionStatus('error');
      alert(`❌ Failed to backup to Google Sheets: ${error.message}\n\nPlease check your Google Apps Script URL and ensure the web app is deployed correctly.`);
    } finally {
      setIsSyncingToSheets(false);
    }
  };

  // NEW: Test connection function
  const testGoogleConnection = async () => {
    setIsSyncingToSheets(true);
    setConnectionStatus('connecting');
    
    try {
      const url = `${GOOGLE_APPS_SCRIPT_URL}?action=test`;
      const response = await fetch(url, {
        method: 'GET',
        mode: 'cors'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const responseText = await response.text();
      const result = JSON.parse(responseText);
      
      if (result.success) {
        setConnectionStatus('connected');
        alert('✅ Connection test successful! Google Apps Script is working.');
      } else {
        throw new Error(result.error || 'Connection test failed');
      }
      
    } catch (error) {
      setConnectionStatus('error');
      alert(`❌ Connection test failed: ${error.message}`);
    } finally {
      setIsSyncingToSheets(false);
    }
  };

  // NEW: Connection status display
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
      case 'connected': return 'Connected';
      case 'connecting': return 'Connecting...';
      case 'error': return 'Connection Error';
      default: return 'Disconnected';
    }
  };

  // Your existing useEffect hooks remain exactly the same
  useEffect(() => {
    try {
      const saved = localStorage.getItem('expenseTrackerData');
      if (saved) {
        const parsed = JSON.parse(saved);
        const currentLen = state?.expenses?.length || 0;
        const savedLen = parsed?.expenses?.length || 0;
        if (savedLen !== currentLen) {
          dispatch({ type: 'LOAD_DATA', payload: parsed });
        }
      }
    } catch (err) {
      console.warn('Rehydrate-on-mount failed:', err);
    }
  }, []);

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === 'expenseTrackerData' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          dispatch({ type: 'LOAD_DATA', payload: parsed });
        } catch (err) {
          console.warn('Failed to parse storage event data:', err);
        }
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const [expenseForm, setExpenseForm] = useState({
    productName: '',
    sku: '',
    category: '',
    quantity: '',
    totalAmount: '',
    date: localDateStr()
  });

  // Your existing functions remain exactly the same
  const exportData = () => {
    try {
      const dataStr = JSON.stringify(state, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `expense-backup-${localDateStr()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      alert('Data exported successfully! Save this file as backup.');
    } catch (error) {
      alert('Failed to export data: ' + error.message);
    }
  };

  const exportCSV = (rows, filename = `expenses-${localDateStr()}.csv`) => {
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

  const exportAllCSV = () => exportCSV(state.expenses, `expenses-all-${localDateStr()}.csv`);

  const getLastMonthRange = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end = new Date(now.getFullYear(), now.getMonth(), 0);
    return {
      startDate: start,
      endDate: end,
      startStr: localDateStr(start),
      endStr: localDateStr(end),
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
        const importedData = JSON.parse(e.target.result);
        if (importedData.expenses && Array.isArray(importedData.expenses)) {
          if (window.confirm(`Import ${importedData.expenses.length} expenses? This will replace your current data.`)) {
            syncDispatch({ type: 'LOAD_DATA', payload: importedData });
            alert('Data imported successfully!');
          }
        } else {
          alert('Invalid file format. Please select a valid expense backup file.');
        }
      } catch (error) {
        alert('Failed to import data: ' + error.message);
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const manualSave = () => {
    try {
      localStorage.setItem('expenseTrackerData', JSON.stringify(state));
      alert('Data saved locally!');
    } catch (error) {
      alert('Failed to save data: ' + error.message);
    }
  };

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
    { id: 'expenses', label: 'Add Expenses', icon: Plus },
    { id: 'reports', label: 'Reports', icon: PieChart },
    { id: 'history', label: 'History', icon: Calendar }
  ];

  const categories = useMemo(() => {
    const cats = [...new Set(state.expenses.map(exp => exp.category))];
    return ['All', ...cats.sort()];
  }, [state.expenses]);

  const getDateRanges = () => {
    const today = new Date();
    const todayStr = localDateStr(today);
    
    const day = today.getDay();
    const mondayOffset = (day + 6) % 7;
    const monday = new Date(today);
    monday.setDate(today.getDate() - mondayOffset);
    const weekStart = localDateStr(monday);
    
    const monthStart = localDateStr(new Date(today.getFullYear(), today.getMonth(), 1));
    
    return { todayStr, weekStart, monthStart };
  };

  const getLastMonthStats = useMemo(() => {
    const { startStr, endStr, label } = getLastMonthRange();
    const rows = state.expenses.filter(e => e.date >= startStr && e.date <= endStr);
    const total = rows.reduce((sum, e) => sum + (parseFloat(e.totalAmount) || 0), 0);
    return { label, startStr, endStr, rows, total, count: rows.length };
  }, [state.expenses]);

  const calculateExpenses = useMemo(() => {
    const { todayStr, weekStart, monthStart } = getDateRanges();
    
    const filterByPeriod = (expenses, period) => {
      switch (period) {
        case 'daily':
          return expenses.filter(exp => exp.date === todayStr);
        case 'weekly':
          return expenses.filter(exp => exp.date >= weekStart);
        case 'monthly':
          return expenses.filter(exp => exp.date >= monthStart);
        default:
          return expenses;
      }
    };

    const filterByCategory = (expenses) => {
      if (selectedCategory === 'All') return expenses;
      return expenses.filter(exp => exp.category === selectedCategory);
    };

    const filteredExpenses = filterByCategory(filterByPeriod(state.expenses, selectedPeriod));
    const totalExpense = filteredExpenses.reduce((sum, exp) => sum + exp.totalAmount, 0);

    const categoryTotals = {};
    state.expenses.forEach(exp => {
      if (!categoryTotals[exp.category]) {
        categoryTotals[exp.category] = { daily: 0, weekly: 0, monthly: 0 };
      }
      if (exp.date === todayStr) categoryTotals[exp.category].daily += exp.totalAmount;
      if (exp.date >= weekStart) categoryTotals[exp.category].weekly += exp.totalAmount;
      if (exp.date >= monthStart) categoryTotals[exp.category].monthly += exp.totalAmount;
    });

    return {
      daily: state.expenses.filter(exp => exp.date === todayStr).reduce((sum, exp) => sum + exp.totalAmount, 0),
      weekly: state.expenses.filter(exp => exp.date >= weekStart).reduce((sum, exp) => sum + exp.totalAmount, 0),
      monthly: state.expenses.filter(exp => exp.date >= monthStart).reduce((sum, exp) => sum + exp.totalAmount, 0),
      filtered: totalExpense,
      categoryTotals,
      filteredExpenses
    };
  }, [state.expenses, selectedPeriod, selectedCategory]);

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
      totalAmount: '',
      date: localDateStr()
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

  const handleSubmit = (e) => {
    e.preventDefault();
    const expenseData = {
      ...expenseForm,
      quantity: parseInt(expenseForm.quantity),
      totalAmount: parseFloat(expenseForm.totalAmount)
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

  const filteredExpenses = state.expenses.filter(exp =>
    exp.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    exp.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    exp.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // MODIFIED: Sort expenses by date and ID (newest first) for history
  const filteredHistoryExpenses = useMemo(() => {
    const filtered = state.expenses.filter(exp =>
      exp.productName.toLowerCase().includes(historySearchTerm.toLowerCase()) ||
      exp.category.toLowerCase().includes(historySearchTerm.toLowerCase()) ||
      exp.sku.toLowerCase().includes(historySearchTerm.toLowerCase()) ||
      exp.date.includes(historySearchTerm)
    );
    
    // Sort by date (descending) and then by ID (descending) for newest first
    return filtered.sort((a, b) => {
      const dateCompare = b.date.localeCompare(a.date);
      if (dateCompare !== 0) return dateCompare;
      return b.id - a.id;
    });
  }, [state.expenses, historySearchTerm]);

  // Date filter for history
  const dateFilteredExpenses = useMemo(() => {
    if (dateFilter === 'all') return filteredHistoryExpenses;
    
    const today = new Date();
    let startDate, endDate;

    switch (dateFilter) {
      case 'daily':
        startDate = localDateStr(today);
        endDate = localDateStr(today);
        break;
      case 'weekly':
        const day = today.getDay();
        const mondayOffset = (day + 6) % 7;
        const monday = new Date(today);
        monday.setDate(today.getDate() - mondayOffset);
        startDate = localDateStr(monday);
        endDate = localDateStr(today);
        break;
      case 'monthly':
        startDate = localDateStr(new Date(today.getFullYear(), today.getMonth(), 1));
        endDate = localDateStr(today);
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

  // PAGINATION CALCULATIONS FOR HISTORY
  const paginatedHistoryExpenses = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return dateFilteredExpenses.slice(startIndex, endIndex);
  }, [dateFilteredExpenses, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(dateFilteredExpenses.length / itemsPerPage);

  // PAGINATION CALCULATIONS FOR REPORTS
  const paginatedReportsExpenses = useMemo(() => {
    const startIndex = (reportsCurrentPage - 1) * reportsItemsPerPage;
    const endIndex = startIndex + reportsItemsPerPage;
    return calculateExpenses.filteredExpenses.slice(startIndex, endIndex);
  }, [calculateExpenses.filteredExpenses, reportsCurrentPage, reportsItemsPerPage]);

  const reportsTotalPages = Math.ceil(calculateExpenses.filteredExpenses.length / reportsItemsPerPage);

  const printHistoryTable = () => {
    const totalAmount = dateFilteredExpenses.reduce((sum, exp) => sum + exp.totalAmount, 0);
    
    // Get date range label for the title
    let dateRangeLabel = 'All Time';
    const today = new Date();
    
    switch (dateFilter) {
      case 'daily':
        dateRangeLabel = `Daily - ${localDateStr(today)}`;
        break;
      case 'weekly':
        const day = today.getDay();
        const mondayOffset = (day + 6) % 7;
        const monday = new Date(today);
        monday.setDate(today.getDate() - mondayOffset);
        dateRangeLabel = `Weekly - ${localDateStr(monday)} to ${localDateStr(today)}`;
        break;
      case 'monthly':
        const monthStart = localDateStr(new Date(today.getFullYear(), today.getMonth(), 1));
        dateRangeLabel = `Monthly - ${monthStart} to ${localDateStr(today)}`;
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

  const renderDashboard = () => (
    <div className="space-y-6 max-w-8xl mx-auto">
      <div className="flex justify-between items-center">
        <h2 className="text-xl aeon-bold gray200">Expense Dashboard</h2>
        <div className="flex items-center space-x-3 ">

          
          {/* NEW: Google Apps Script Backup Button */}
          <div className="flex items-center gap-2">
       
            <button
              onClick={backupToGoogleSheets}
              disabled={isSyncingToSheets || state.expenses.length === 0}
              className="border border-blue-600 bg-white text-blue-600 px-3 py-2 inter rounded-[14px] hover:bg-blue-600 
              hover:!text-white flex items-center gap-2 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
              title="Backup to Sheets"
            >
              <Cloud className="h-4 w-4" /> {isSyncingToSheets ? 'Backing up...' : 'Backup to Sheets'}
            </button>
          </div>

          <button
            onClick={manualSave}
            className="border border-green-600 bg-white text-green-600 px-3 py-2 inter  rounded-[14px] hover:bg-green-600 hover:text-white flex items-center gap-2 text-xs"
            title="Save data locally"
          >
            <Save className="h-4 w-4" /> Save Locally
          </button>
          <button
            onClick={exportData}
            className="border border-indigo-600 text-indigo-600 bg-white  px-3 py-2 rounded-[14px] hover:bg-indigo-600 hover:!text-white 
            flex items-center gap-2 text-xs inter"
            title="Download JSON backup file"
          >
            <Download className="h-4 w-4" /> Export JSON
          </button>

          <button
            onClick={exportAllCSV}
            className="border border-purple-600 text-purple-600 bg-white px-3 py-2 rounded-[14px] hover:bg-purple-600  flex items-center gap-2 
            text-xs inter hover:text-white"
            title="Download CSV (open in Excel/Sheets)"
          >
            <Download className="h-4 w-4" /> Export CSV
          </button>

          <div className="relative">
            <input
              type="file"
              accept=".json"
              onChange={importData}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              title="Import backup file"
            />
            <button 
              className="relative z-10 border border-pink-500 text-pink-500 px-3 py-2 rounded-[14px] bg-white
                        hover:!bg-pink-500 hover:!text-white flex items-center gap-2 text-xs">
              <Upload className="h-4 w-4" /> Import
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg border border-green-200">
        <p className="text-green-800 text-sm inter">
          <span className="gray200 intermid">Data Status: </span>
          {state.expenses.length} expenses stored locally. 
          <span className="text-green-600 "> Data automatically saves after every change.</span>
          <br />
          {lastSyncTime && (
            <span className="text-blue-600 text-xs ">
            Last backed up to Sheets: {lastSyncTime.toLocaleString()}
            </span>
          )}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-blue-500 p-6 rounded-[14px] border shadow-xs border-blue-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-50 text-sm inter font-medium"> Today's Expenses</p>
              <p className="text-2xl aeon-bold text-white">{formatNaira(calculateExpenses.daily)}</p>
            </div>
            <div className='w-14 h-14 rounded-full bg-blue-50 border shadow-md border-white'>
            <img src={today} className="p-3 text-blue-500" />
          </div>
          </div>
        </div>
        
        <div className="bg-green-500 p-6 rounded-[14px] border border-green-300 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-50 text-sm inter font-medium">This Week's Expenses</p>
              <p className="text-2xl aeon-bold text-white">{formatNaira(calculateExpenses.weekly)}</p>
            </div>

            <div className='w-14 h-14 rounded-full bg-green-50 border shadow-md border-white'>
            <img src={trend} className="p-3 text-green-500" />
          </div>
          </div>

        </div>
        
        <div className="bg-purple-500 p-6 rounded-[14px] border border-purple-300 shadow-xs">
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
        <div className="bg-white  p-6 rounded-[14px] border border-gray-200 ">
          <h3 className="text-lg aeon-bold gray200 mb-4">Expenses by Category</h3>
          <div className="space-y-4">
            {Object.entries(calculateExpenses.categoryTotals).map(([category, totals]) => (
              <div key={category} className="border-l-4 border-pink-500 pl-4">
                <div className="flex justify-between items-start">
                  <h4 className="aeon-bold gray200">{category}</h4>
                  <div className="text-right">
                    <p className="text-sm inter text-gray-600">Today: {formatNaira(totals.daily)}</p>
                    <p className="text-sm inter text-gray-600">This Week: {formatNaira(totals.weekly)}</p>
                    <p className="aeon-bold gray200">This Month: {formatNaira(totals.monthly)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white p-6 rounded-[14px] border border-indigo-100">
          <div className="text-center py-8 text-gray-500">
          <div className='bg-blue-50 border border-blue-100 w-16   h-16 mx-auto rounded-full'>
                <img src={box} className=" opacity-50 p-2 mx-auto mb-4" />
                </div>
            <p className="mb-2 inter">No expenses recorded yet</p>
            <p className="text-sm inter">Start by adding your first expense to see category breakdowns here.</p>
          </div>
        </div>
      )}
    </div>
  );

  const renderExpenses = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
          <h3 className="text-xl aeon-bold  text-gray-800  flex items-center">
                      
                            <span className='bg-green-100 rounded-[8px] w-7 h-7 mr-2' ><img src={add} className="p-1" /></span> 
                          Add New Recipient
                        </h3>
        <button
          onClick={() => openModal()}
          className="bg-green-600 text-white inter text-xs px-4 py-2 rounded-[14px] hover:bg-green-700 
          flex items-center
           gap-2"
        >
          <Plus className="h-4 w-4 " /> Add New Expense
        </button>
      </div>

      <div className="bg-white p-6 rounded-[14px] border border-green-200  hover:shadow-lg
       transition-all duration-300 
      hover:scale-[1.02]">
        <h3 className="text-lg aeon-bold text-green-600 mb-4">Quick Add Expense</h3>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4  inter gray200">
          <input
            type="text"
            placeholder="Product Name"
            value={expenseForm.productName}
            onChange={(e) => setExpenseForm({...expenseForm, productName: e.target.value})}
            className="p-3 text-sm inter border border-gray-200 rounded-lg outline-none"
            required
          />
          <input
            type="text"
            placeholder="S.Num (e.g., CEMENT-001)"
            value={expenseForm.sku}
            onChange={(e) => setExpenseForm({...expenseForm, sku: e.target.value})}
           className="p-3 inter text-sm border border-gray-200 rounded-lg outline-none"
            required
          />
          <input
            type="text"
            placeholder="Category"
            value={expenseForm.category}
            onChange={(e) => setExpenseForm({...expenseForm, category: e.target.value})}
            className="p-3 inter text-sm border border-gray-200 rounded-lg outline-none "
            required
          />
          <input
            type="number"
            min="1"
            placeholder="Quantity"
            value={expenseForm.quantity}
            onChange={(e) => setExpenseForm({...expenseForm, quantity: e.target.value})}
            className="p-3 inter text-sm border border-gray-200 rounded-lg outline-none"
            required
          />
          <input
            type="number"
            min="0"
            step="0.01"
            placeholder="Total Amount (₦)"
            value={expenseForm.totalAmount}
            onChange={(e) => setExpenseForm({...expenseForm, totalAmount: e.target.value})}
           className="p-3 border text-sm inter border-gray-200 rounded-lg outline-none"
            required
          />
          <button
            type="submit"
                  className="bg-green-600 text-white px-4 py-3 rounded-[14px] hover:bg-gradient-to-r from-green-600 to-blue-600  
                  text-md w-full intermid md:col-span-2
             lg:col-span-5 transform hover:scale-102 transition-all"
          
          >
            Add Expense
          </button>
        </form>
        {expenseForm.totalAmount && (
          <div className="mt-4 p-3 bg-green-50 rounded-lg">
            <p className="text-green-600">
              Total Amount: <span className="font-medium mx-2 aeon-bold">
                {formatNaira(parseFloat(expenseForm.totalAmount || 0))}</span>
            </p>
          </div>
        )}
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
                        <span className="px-2 py-1 inter rounded-full text-xs bg-blue-100 text-blue-500 "> {expense.sku}</span> </td>
                    <td className="px-4 py-3 text-sm border-r border-gray-200">
                      <span className="px-2 py-1 bg-pink-100 text-pink-600 rounded-full text-xs">
                        {expense.category}
                      </span>
                    </td>
                    <td className="px-4  py-3 text-sm gray200 inter border-r border-gray-200 text-center ">{expense.quantity}</td>
                    <td className="px-4 py-3 text-sm gray200 border-r inter border-gray-200">{expense.date}</td>
                    <td className="px-4 text-left py-3 text-sm inter  text-green-600">{formatNaira(expense.totalAmount)}</td>
                  </tr>
                ))}
                <tr className="bg-gray-50 border-t-1.5 border-green-600">
                  <td colSpan="5" className="px-4 py-3 text-sm intermid font-medium text-green-600 text-right border-r border-gray-200">
                    Total Expense:
                  </td>
                  <td className="px-4 py-3 text-sm intermid font-medium text-green-600">
                    {formatNaira(state.expenses.slice(-15).reduce((sum, exp) => sum + exp.totalAmount, 0))}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white p-6 rounded-[14px] border border-gray-200">
          <div className="text-center py-8 text-gray-500">
        
             <div className='bg-blue-50 border border-blue-100 w-16   h-16 mx-auto rounded-full'>
                <img src={text} className=" opacity-50 p-2 mx-auto mb-4" />
                </div>
            <p className="mb-2 inter">No expenses added yet</p>
            <p className="text-sm inter">Your recently added expenses will appear here to help prevent duplicates.</p>
          </div>
        </div>
      )}
    </div>
  );

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
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="p-2 px-5 border rounded-[14px] border-gray-300 bg-white gray200 text-sm inter outline-none "
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="p-2 border rounded-[14px] border-gray-300 bg-white gray200 inter text-sm  outline-none"
            >
              <option value="daily">Today</option>
              <option value="weekly">This Week</option>
              <option value="monthly">This Month</option>
            </select>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[14px] border border-gray-200 ">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg aeon-bold gray200">
              {selectedCategory === 'All' ? 'All Categories' : selectedCategory} - {selectedPeriod.charAt(0).toUpperCase() + selectedPeriod.slice(1)} Report
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
               <div className='bg-blue-50 border border-blue-100 w-16   h-16 mx-auto rounded-full'>
                  <img src={box} className=" opacity-50 p-2 mx-auto mb-4" />
                  </div>
              <p>No expenses found for the selected period and category.</p>
            </div>
          )}

          {/* REPORTS PAGINATION CONTROLS */}
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
            <span className="intermid">Total for selected period: </span>
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
                  Page {currentPage} of {totalPages} • {dateFilteredExpenses.length} total entries
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
              onClick={() => exportCSV(dateFilteredExpenses, `expenses-${dateFilter}-${localDateStr()}.csv`)}
              className="border border-purple-600 text-purple-600 bg-white inter px-4 py-2 rounded-[14px] hover:!text-white hover:bg-purple-600 flex text-xs items-center gap-2 print:hidden"
              title="Export filtered data to CSV"
            >
              <Download className="h-4 w-4" /> Export CSV
            </button>
            
            <div className="relative bg-white rounded-[14px]">
              <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400 mb-2" />
              <input
                type="text"
                placeholder="Search expenses..."
                value={historySearchTerm}
                onChange={(e) => setHistorySearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border text-sm border-gray-300 outline-none inter rounded-[14px] w-64"
              />
            </div>
          </div>
        </div>

        <div className="bg-white py-4 px-6 rounded-[14px] border border-purple-200">
          
          <div className="flex flex-row gap-4 items-end">
            <h3 className="text-sm intermid font-medium text-blue-700 mb-2 mr-12">Filter by Range</h3>
            <div className="md:col-span-4">
              <div className="grid grid-cols-4 md:grid-cols-5 gap-5">
                <button
                  onClick={() => setDateFilter('all')}
                  className={`px-8 py-2 rounded-[14px] text-sm inter ${
                    dateFilter === 'all' 


                     ? 'bg-gray-100 text-gray-700 hover:bg-gray-100' 
                      : 'bg-white text-gray-500 border border-gray-200'
                  }`}
                >
                  All Time
                </button>
                <button
                  onClick={() => setDateFilter('daily')}
                className={`px-8 py-2 rounded-[14px] text-sm inter ${
                    dateFilter === 'daily' 

                     ? 'bg-gray-100 text-gray-700 hover:bg-gray-100' 
                      : 'bg-white text-gray-500 border border-gray-200'
                     
                  }`}
                >
                  Today
                </button>
                <button
                  onClick={() => setDateFilter('weekly')}
                  className={`px-4 py-2 rounded-[14px] text-sm inter ${
                    dateFilter === 'weekly' 
                      ? 'bg-gray-100 text-gray-700 hover:bg-gray-100' 
                      : 'bg-white text-gray-500 border border-gray-200'
                  }`}
                >
                  This Week
                </button>
                <button
                  onClick={() => setDateFilter('monthly')}
                  className={`px-4 py-2 rounded-[14px] text-sm inter ${
                    dateFilter === 'monthly' 
                      ? 'bg-gray-100 text-gray-700 hover:bg-gray-100' 
                      : 'bg-white text-gray-500 border border-gray-200'
                  }`}
                >
                  This Month
                </button>

            
              {/* new pagination */}
          {dateFilteredExpenses.length > 0 && (
                   
              <div className="flex items-center space-x-5">
             
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="border border-gray-300
                   rounded-[14px] gray200 px-6 py-2 text-xs inter outline-none bg-white"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
        
       
        )}
{/* new pagination */}
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

          {dateFilter !== 'all' && (
          <div></div>
          )}
        </div>

        {dateFilteredExpenses.length > 0 && (
          <div></div>
        )}

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
                        <span className="px-2 py-1 inter rounded-full text-xs bg-blue-100 text-blue-500">
                          {expense.sku}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 inter rounded-full text-xs bg-pink-100 text-pink-600">
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
                            <div className='h-5 w-5 rounded-[6px] bg-blue-50 border border-blue-100'>
                              <img src={edit} className="p-1" />
                            </div>
                          </button>
                          <button
                            onClick={() => deleteExpense(expense.id)}
                            className="hover:text-red-800"
                          >
                            <div className='h-5 w-5 rounded-[6px] bg-red-50 border border-red-100'>
                              <img src={del} className="p-1" />
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
                
                {/* PAGINATION CONTROLS */}
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
              onChange={(e) => setExpenseForm({...expenseForm, productName: e.target.value})}
              className="w-full p-3 border border-gray-300 rounded-lg outline-none"
              required
            />
            <input
              type="text"
              placeholder="SKU (e.g., CEMENT-ABJ-001, STEEL-LOS-002)"
              value={expenseForm.sku}
              onChange={(e) => setExpenseForm({...expenseForm, sku: e.target.value})}
                 className="w-full p-3 border border-gray-300 rounded-lg outline-none"
              required
            />
            <input
              type="text"
              placeholder="Category (e.g., Food, Stationery, etc.)"
              value={expenseForm.category}
              onChange={(e) => setExpenseForm({...expenseForm, category: e.target.value})}
                 className="w-full p-3 border border-gray-300 rounded-lg outline-none"
              required
            />
            <input
              type="number"
              min="1"
              placeholder="Quantity"
              value={expenseForm.quantity}
              onChange={(e) => setExpenseForm({...expenseForm, quantity: e.target.value})}
                 className="w-full p-3 border border-gray-300 rounded-lg outline-none"
              required
            />
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="Total Amount in Naira (₦)"
              value={expenseForm.totalAmount}
              onChange={(e) => setExpenseForm({...expenseForm, totalAmount: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg outline-none"
              required
            />
            <input
              type="date"
              value={expenseForm.date}
              onChange={(e) => setExpenseForm({...expenseForm, date: e.target.value})}
                 className="w-full p-3 border border-gray-300 rounded-lg outline-none"
              required
            />
            
            {expenseForm.totalAmount && (
              <div className="p-3 bg-green-50 rounded-lg">
                <p className="text-green-800">
                  <span className="font-medium">Total Amount: </span>
                  <span className="text-lg font-bold">
                    {formatNaira(parseFloat(expenseForm.totalAmount || 0))}
                  </span>
                </p>
              </div>
            )}

            <div className="flex space-x-3">
              <button 
                type="submit" 
                className="flex-1 bg-green-500 text-white py-3 rounded-[14px]
                 hover:bg-green-600 inter"
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

  return (
    <div className="min-h-screen bg-shapee shadow-sm rounded-[14px] border border-white">
      <div className="bg-gradient-to-br from-black  to-[#051077] backdrop-blur-lg
       shadow-sm border-b border-gray-500 rounded-[14px]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-5">
          <div className="flex justify-between items-center py-4">

            <div>
              <h1 className="text-2xl aeon-bold text-white flex flex-row ">
                <span><img src={coins} className="w-12 mr-3 rounded-[4px]" /></span>Business Expense Tracker</h1>
              <p className="text-sm text-gray-400 tracking-wide inter mt-1">Track daily expenses and monitor spending by category</p>
            </div>

            <div className="text-right">
              <p className="text-sm text-gray-400 tracking-wide aeon-bold">Today's Total</p>
              <p className="text-lg aeon-bold text-green-500">{formatNaira(calculateExpenses.daily)}</p>
           
           
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
          {/* google */}
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
              title="Test Backup connection"
            >
              <img src={cloudd} className="h-3 w-3 " /> Connection Test
            </button>
            </div>
           {/* google */}
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