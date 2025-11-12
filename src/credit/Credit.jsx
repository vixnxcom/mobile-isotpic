import React, { useState, useEffect } from 'react';
import { Trash2, Plus, CreditCard, TrendingUp, Calendar, Users, DollarSign, AlertCircle, CheckCircle, XCircle, Search, Download, Printer, PrinterIcon, Cloud } from 'lucide-react';
import { acct, add, agenda, bank, cloudd, del, graph, month, msg, name, notes, pay, paycard, phone, sync, todayy, totall, user } from '../assets';

const PaystackPaymentSystem = () => {
  const [activeTab, setActiveTab] = useState('analytics');
  const [recipients, setRecipients] = useState([]);
  const [payments, setPayments] = useState([]);
  const [periodFilter, setPeriodFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [debugInfo, setDebugInfo] = useState(null);
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const [paystackLoaded, setPaystackLoaded] = useState(false);
  
  // New state for search functionality
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    bank: '',
    accountNumber: '',
    description: ''
  });
  
  const AmountPreview = ({ amount }) => {
    const formatAmount = (value) => {
      if (!value) return '---';
      
      // Remove non-digit characters
      const digitsOnly = value.replace(/\D/g, '');
      
      // Format with commas for thousands
      if (digitsOnly) {
        return `₦${parseInt(digitsOnly, 10).toLocaleString('en-US')}`;
      }
      
      return '---';
    };

    return (
      <div className=" aeon-bold tracking-wider">
        <span className=" text-green-600 inter font-medium tracking-wide mr-2">Amount Preview: </span>
        {formatAmount(amount)}
      </div>
    );
  };

  const [paymentAmounts, setPaymentAmounts] = useState({});

  // Google Apps Script Configuration - REPLACE WITH YOUR WEB APP URL
  const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyX7BdLY8Pl2yhCKqHOKMzDqQM_-JBeT1tz1rPK7Y7wffcRxfpxRllr7LMWbgxquvmP/exec';

  // Paystack configuration
  const PAYSTACK_PUBLIC_KEY = 'pk_test_aa9fab935a0de3dda723d27a2c97257831820cbc';

  const banks = [
    { value: 'access', label: 'Access Bank' },
    { value: 'gtb', label: 'Guaranty Trust Bank (GTB)' },
    { value: 'zenith', label: 'Zenith Bank' },
    { value: 'first', label: 'First Bank of Nigeria' },
    { value: 'uba', label: 'United Bank for Africa (UBA)' },
    { value: 'fidelity', label: 'Fidelity Bank' },
    { value: 'union', label: 'Union Bank' },
    { value: 'sterling', label: 'Sterling Bank' },
    { value: 'fcmb', label: 'First City Monument Bank (FCMB)' },
    { value: 'ecobank', label: 'Ecobank Nigeria' },
    { value: 'stanbic', label: 'Stanbic IBTC Bank' },
    { value: 'wema', label: 'Wema Bank' },
    { value: 'polaris', label: 'Polaris Bank' },
    { value: 'keystone', label: 'Keystone Bank' },
    { value: 'heritage', label: 'Heritage Bank' },
    { value: 'providus', label: 'Providus Bank' },
    { value: 'suntrust', label: 'SunTrust Bank' },
    { value: 'citi', label: 'Citibank Nigeria' },
    { value: 'standard-chartered', label: 'Standard Chartered Bank' },
    { value: 'jaiz', label: 'Jaiz Bank (Islamic)' },
    { value: 'taj', label: 'TAJ Bank (Islamic)' },
    { value: 'lotus', label: 'Lotus Bank' },
    { value: 'globus', label: 'Globus Bank' },
    { value: 'premium-trust', label: 'Premium Trust Bank' },
    { value: 'titan-trust', label: 'Titan Trust Bank' },
    { value: 'opay', label: 'OPay (Microfinance Bank)' },
    { value: 'kuda', label: 'Kuda Bank (Microfinance)' },
    { value: 'rubies', label: 'Rubies Bank (Microfinance)' },
    { value: 'mint', label: 'Mint Bank (Fintech)' },
    { value: 'sparkle', label: 'Sparkle Bank (Microfinance)' },
    { value: 'moniepoint', label: 'Moniepoint (Microfinance)' },
    { value: 'parallex', label: 'Parallex Bank (Microfinance)' },
    { value: 'safe-haven', label: 'Safe Haven Bank (Microfinance)' },
    { value: 'bowen', label: 'Bowen Bank (Microfinance)' },
    { value: 'coronation', label: 'Coronation Bank (Merchant Bank)' },
    { value: 'nova', label: 'Nova Merchant Bank' },
    { value: 'rand-merchant', label: 'Rand Merchant Bank' }
  ];

  // Enhanced debug logging
  const logDebugInfo = (action, data, error = null) => {
    const debugEntry = {
      timestamp: new Date().toISOString(),
      action,
      data,
      error: error ? error.message : null,
      url: APPS_SCRIPT_URL
    };
    
    setDebugInfo(prev => {
      const newDebugInfo = prev ? [...prev, debugEntry] : [debugEntry];
      return newDebugInfo.slice(-10); // Keep last 10 entries
    });
    
    console.log('Debug Info:', debugEntry);
  };

  // Google Apps Script API functions using GET requests to avoid CORS preflight
  const saveRecipientToSheets = async (recipient) => {
    try {
      logDebugInfo('saveRecipient_start', { recipient });
      
      // Use GET request with URL parameters to avoid CORS preflight
      const params = new URLSearchParams({
        action: 'addRecipient',
        data: JSON.stringify(recipient)
      });
      
      const url = `${APPS_SCRIPT_URL}?${params.toString()}`;
      logDebugInfo('saveRecipient_request', { url });
      
      const response = await fetch(url, {
        method: 'GET',
        mode: 'cors'
      });
      
      logDebugInfo('saveRecipient_response_status', { 
        status: response.status, 
        statusText: response.statusText,
        headers: Object.fromEntries([...response.headers.entries()])
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const responseText = await response.text();
      logDebugInfo('saveRecipient_response_text', { responseText });
      
      let result;
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        throw new Error(`Invalid JSON response: ${responseText}`);
      }
      
      logDebugInfo('saveRecipient_parsed_result', result);
      
      if (!result.success) {
        throw new Error(result.error || 'Unknown server error occurred');
      }
      
      setConnectionStatus('connected');
      return result.data;
    } catch (error) {
      logDebugInfo('saveRecipient_error', null, error);
      setConnectionStatus('error');
      
      // Enhanced error messages
      if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        throw new Error('Network connection failed. Please check:\n1. Your internet connection\n2. The Google Apps Script URL is correct\n3. The script is deployed and accessible');
      } else if (error.message.includes('CORS')) {
        throw new Error('CORS error. Please ensure your Google Apps Script is:\n1. Deployed as a web app\n2. Set to execute as "Me"\n3. Set to allow access to "Anyone"');
      } else if (error.message.includes('HTTP 404')) {
        throw new Error('Script not found. Please check if the Google Apps Script URL is correct.');
      } else if (error.message.includes('HTTP 403')) {
        throw new Error('Access denied. Please check the script permissions.');
      } else {
        throw error;
      }
    }
  };

  const savePaymentToSheets = async (payment) => {
    try {
      logDebugInfo('savePayment_start', { payment });
      
      // Use GET request with URL parameters to avoid CORS preflight
      const params = new URLSearchParams({
        action: 'addPayment',
        data: JSON.stringify(payment)
      });
      
      const url = `${APPS_SCRIPT_URL}?${params.toString()}`;
      
      const response = await fetch(url, {
        method: 'GET',
        mode: 'cors'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const responseText = await response.text();
      const result = JSON.parse(responseText);
      
      if (!result.success) {
        throw new Error(result.error || 'Unknown error occurred');
      }
      
      setConnectionStatus('connected');
      return result.data;
    } catch (error) {
      logDebugInfo('savePayment_error', null, error);
      setConnectionStatus('error');
      throw error;
    }
  };

  const loadRecipientsFromSheets = async () => {
    try {
      logDebugInfo('loadRecipients_start', {});
      
      const url = `${APPS_SCRIPT_URL}?action=getRecipients`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        mode: 'cors',
        credentials: 'omit'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const responseText = await response.text();
      const result = JSON.parse(responseText);
      
      if (result.success) {
        const validRecipients = result.data.filter(r => r.id);
        setRecipients(validRecipients);
        setConnectionStatus('connected');
        logDebugInfo('loadRecipients_success', { count: validRecipients.length });
      } else {
        throw new Error(result.error || 'Failed to load recipients');
      }
    } catch (error) {
      logDebugInfo('loadRecipients_error', null, error);
      setConnectionStatus('error');
      console.error('Error loading recipients:', error);
    }
  };

  const loadPaymentsFromSheets = async () => {
    try {
      const url = `${APPS_SCRIPT_URL}?action=getPayments`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        mode: 'cors',
        credentials: 'omit'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const responseText = await response.text();
      const result = JSON.parse(responseText);
      
      if (result.success) {
        const validPayments = result.data.filter(p => p.id);
        setPayments(validPayments);
        setConnectionStatus('connected');
      } else {
        throw new Error(result.error || 'Failed to load payments');
      }
    } catch (error) {
      logDebugInfo('loadPayments_error', null, error);
      setConnectionStatus('error');
      console.error('Error loading payments:', error);
    }
  };

  // Test connection function
  const testConnection = async () => {
    try {
      logDebugInfo('testConnection_start', { url: APPS_SCRIPT_URL });
      
      const response = await fetch(`${APPS_SCRIPT_URL}?action=test`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        mode: 'cors',
        credentials: 'omit'
      });
      
      logDebugInfo('testConnection_response', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries([...response.headers.entries()])
      });
      
      const responseText = await response.text();
      const result = JSON.parse(responseText);
      
      logDebugInfo('testConnection_result', result);
      
      if (result.success) {
        setConnectionStatus('connected');
        alert('Connection test successful!');
      } else {
        setConnectionStatus('error');
        alert(`Connection test failed: ${result.error}`);
      }
      
      return result;
    } catch (error) {
      logDebugInfo('testConnection_error', null, error);
      setConnectionStatus('error');
      alert(`Connection test failed: ${error.message}`);
      return { success: false, error: error.message };
    }
  };

  const initializeAppsScript = async () => {
    try {
      setIsLoading(true);
      setConnectionStatus('connecting');
      
      await loadRecipientsFromSheets();
      await loadPaymentsFromSheets();
      
      setConnectionStatus('connected');
    } catch (error) {
      console.error('Error initializing Apps Script:', error);
      setConnectionStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const addRecipient = async () => {
    if (!formData.name || !formData.email || !formData.phone || !formData.bank || !formData.accountNumber) {
      alert('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    try {
      const newRecipient = {
        id: Date.now(),
        ...formData,
        createdAt: new Date().toISOString()
      };

      await saveRecipientToSheets(newRecipient);
      
      setRecipients([...recipients, newRecipient]);
      setFormData({
        name: '',
        email: '',
        phone: '',
        bank: '',
        accountNumber: '',
        description: ''
      });
      
      alert('Recipient added successfully!');
    } catch (error) {
      alert(`Error adding recipient: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteRecipient = async (id) => {
    if (window.confirm('Are you sure you want to delete this recipient?')) {
      setRecipients(recipients.filter(r => r.id !== id));
    }
  };

  const handleAmountChange = (recipientId, amount) => {
    setPaymentAmounts({
      ...paymentAmounts,
      [recipientId]: amount
    });
  };

  // Payment callback functions defined at component level
  const handlePaymentSuccess = async (response, recipient, amount) => {
    logDebugInfo('paystack_payment_success', { response });
    
    setIsLoading(true);
    try {
      const payment = {
        id: Date.now(),
        recipientId: recipient.id,
        recipientName: recipient.name,
        amount: amount,
        status: 'success',
        reference: response.reference,
        date: new Date().toISOString(),
        paystackResponse: {
          reference: response.reference,
          status: response.status,
          trans: response.trans,
          transaction: response.transaction,
          trxref: response.trxref
        }
      };

      // Save to Google Sheets
      await savePaymentToSheets(payment);
      
      // Update local state
      setPayments(prevPayments => [...prevPayments, payment]);
      setPaymentAmounts(prev => ({
        ...prev,
        [recipient.id]: ''
      }));
      
      alert(`Payment successful! Transaction Reference: ${response.reference}`);
      setActiveTab('payments');
    } catch (error) {
      logDebugInfo('paystack_save_error', null, error);
      alert(`Payment was successful but failed to save: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentClose = () => {
    logDebugInfo('paystack_payment_cancelled', {});
    alert('Payment was cancelled');
  };

  // Load Paystack script with better error handling
  useEffect(() => {
    const loadPaystackScript = () => {
      // Check if script already exists
      const existingScript = document.querySelector('script[src*="paystack"]');
      if (existingScript) {
        console.log('Paystack script already loaded');
        setPaystackLoaded(true);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://js.paystack.co/v1/inline.js';
      script.async = true;
      script.onload = () => {
        console.log('Paystack script loaded successfully');
        setPaystackLoaded(true);
        logDebugInfo('paystack_script_loaded', { available: !!window.PaystackPop });
      };
      script.onerror = () => {
        console.error('Failed to load Paystack script');
        setPaystackLoaded(false);
        logDebugInfo('paystack_script_error', { error: 'Failed to load script' });
      };
      
      document.head.appendChild(script);
      
      return () => {
        if (document.head.contains(script)) {
          document.head.removeChild(script);
        }
      };
    };

    loadPaystackScript();
  }, []);

  const initiatePayment = async (recipient) => {
    const amount = parseFloat(paymentAmounts[recipient.id] || 0);
    
    if (!amount || amount < 100) {
      alert('Please enter a valid amount (minimum ₦100)');
      return;
    }

    logDebugInfo('payment_initiation_start', {
      recipient: recipient.name,
      amount,
      paystackAvailable: !!window.PaystackPop,
      paystackLoaded
    });

    // Check if Paystack is loaded with more detailed debugging
    if (!paystackLoaded || typeof window.PaystackPop === 'undefined') {
      logDebugInfo('paystack_not_available', {
        paystackLoaded,
        windowPaystackPop: typeof window.PaystackPop,
        windowKeys: Object.keys(window).filter(k => k.toLowerCase().includes('paystack'))
      });
      
      alert('Paystack is not loaded. Please wait a moment and try again.');
      return;
    }

    const reference = 'pay_' + Date.now();
    
    try {
      logDebugInfo('paystack_setup_start', { reference, email: recipient.email, amount });
      
      // Create payment configuration object
      const paymentConfig = {
        key: PAYSTACK_PUBLIC_KEY,
        email: recipient.email,
        amount: amount * 100, // Paystack expects amount in kobo
        currency: 'NGN',
        ref: reference,
        metadata: {
          recipientId: recipient.id,
          recipientName: recipient.name,
          custom_fields: [
            {
              display_name: "Recipient Name",
              variable_name: "recipient_name",
              value: recipient.name
            },
            {
              display_name: "Payment Purpose", 
              variable_name: "payment_purpose",
              value: recipient.description || 'Payment'
            }
          ]
        },
        callback: (response) => handlePaymentSuccess(response, recipient, amount),
        onClose: handlePaymentClose
      };

      logDebugInfo('paystack_config', { 
        configKeys: Object.keys(paymentConfig),
        callbackType: typeof paymentConfig.callback,
        onCloseType: typeof paymentConfig.onClose
      });

      // Initialize Paystack payment
      const handler = window.PaystackPop.setup(paymentConfig);

      logDebugInfo('paystack_handler_created', { 
        handlerType: typeof handler,
        handlerMethods: handler ? Object.keys(handler) : []
      });

      // Open the Paystack payment modal
      if (handler && typeof handler.openIframe === 'function') {
        handler.openIframe();
        logDebugInfo('paystack_modal_opened', {});
      } else {
        logDebugInfo('paystack_handler_error', { 
          handler, 
          methods: handler ? Object.keys(handler) : [],
          hasOpenIframe: handler && typeof handler.openIframe === 'function'
        });
        throw new Error('Paystack handler openIframe method is not available');
      }
      
    } catch (error) {
      logDebugInfo('payment_initiation_error', { 
        errorName: error.name,
        errorMessage: error.message,
        errorStack: error.stack
      }, error);
      console.error('Payment initiation error:', error);
      alert(`Error initiating payment: ${error.message}`);
    }
  };

  const getFilteredPayments = () => {
    let filtered = payments;
    
    if (periodFilter !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      filtered = filtered.filter(payment => {
        const paymentDate = new Date(payment.date);
        
        switch (periodFilter) {
          case 'today':
            return paymentDate >= today;
          case 'week':
            const weekAgo = new Date(today);
            weekAgo.setDate(weekAgo.getDate() - 7);
            return paymentDate >= weekAgo;
          case 'month':
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
            return paymentDate >= monthStart;
          default:
            return true;
        }
      });
    }
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(payment => payment.status === statusFilter);
    }
    
    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(payment => 
        payment.recipientName.toLowerCase().includes(term) ||
        payment.reference.toLowerCase().includes(term) ||
        payment.amount.toString().includes(term) ||
        payment.status.toLowerCase().includes(term)
      );
    }
    
    return filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  // New function to calculate total amount
  const getTotalAmount = () => {
    return filteredPayments.reduce((total, payment) => total + payment.amount, 0);
  };

  // New function to export CSV
  const exportToCSV = () => {
    const filteredPayments = getFilteredPayments();
    
    if (filteredPayments.length === 0) {
      alert('No payments to export');
      return;
    }
    
    // Create CSV header
    const headers = ['Date', 'Recipient', 'Amount (₦)', 'Status', 'Reference'];
    
    // Create CSV rows
    const rows = filteredPayments.map(payment => [
      new Date(payment.date).toLocaleDateString(),
      payment.recipientName,
      payment.amount,
      payment.status,
      payment.reference
    ]);
    
    // Add total row
    rows.push(['', 'TOTAL', getTotalAmount(), '', '']);
    
    // Combine header and rows
    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `payment-history-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // New function to print table
  const printTable = () => {
    const printContent = document.getElementById('payments-table').outerHTML;
    const originalContent = document.body.innerHTML;
    
    document.body.innerHTML = `
      <div style="padding: 20px;">
        <h1 style="text-align: center; margin-bottom: 20px;">Payment History</h1>
        ${printContent}
      </div>
    `;
    
    window.print();
    document.body.innerHTML = originalContent;
    window.location.reload(); // Reload to restore functionality
  };

  const getAnalytics = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const totalSpent = payments.reduce((sum, p) => sum + p.amount, 0);
    const todayPayments = payments.filter(p => new Date(p.date) >= today);
    const monthlyPayments = payments.filter(p => new Date(p.date) >= monthStart);
    
    const todaySpent = todayPayments.reduce((sum, p) => sum + p.amount, 0);
    const monthlySpent = monthlyPayments.reduce((sum, p) => sum + p.amount, 0);
    
    return {
      totalSpent,
      totalPayments: payments.length,
      todaySpent,
      monthlySpent
    };
  };

  useEffect(() => {
    initializeAppsScript();
  }, []);

  const analytics = getAnalytics();
  const filteredPayments = getFilteredPayments();
  const totalAmount = getTotalAmount();

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
      case 'connected': return 'Connection Successful';
      case 'connecting': return 'Connecting...';
      case 'error': return 'Connection Error';
      default: return 'Disconnected';
    }
  };

  const DebugPanel = () => {
    if (!showDebugPanel) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
          <div className="p-4 border-b flex justify-between items-center">
            <h3 className="text-lg font-bold inter">Debug Information</h3>
            <button
              onClick={() => setShowDebugPanel(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <XCircle className="w-6 h-6" />
            </button>
          </div>
          <div className="p-4 overflow-y-auto max-h-[70vh] inter">
            <div className="mb-4">
              <h4 className="font-semibold mb-2">Current Configuration:</h4>
              <div className="bg-gray-100 p-3 rounded text-sm">
                <p><strong>Apps Script URL:</strong> {APPS_SCRIPT_URL}</p>
                <p><strong>Connection Status:</strong> {connectionStatus}</p>
                <p><strong>Paystack Loaded:</strong> {paystackLoaded ? 'Yes' : 'No'}</p>
                <p><strong>Recipients Count:</strong> {recipients.length}</p>
                <p><strong>Payments Count:</strong> {payments.length}</p>
              </div>
            </div>
            
            {debugInfo && (
              <div>
                <h4 className="font-semibold mb-2">Debug Log:</h4>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {debugInfo.slice().reverse().map((entry, index) => (
                    <div key={index} className="bg-gray-50 p-3 inter rounded text-xs">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-semibold text-blue-600">{entry.action}</span>
                        <span className="text-gray-500">{new Date(entry.timestamp).toLocaleTimeString()}</span>
                      </div>
                      {entry.data && (
                        <div className="mb-1">
                          <strong>Data:</strong>
                          <pre className="text-xs bg-gray-200 p-2 rounded mt-1 overflow-x-auto">
                            {JSON.stringify(entry.data, null, 2)}
                          </pre>
                        </div>
                      )}
                      {entry.error && (
                        <div className="text-red-600">
                          <strong>Error:</strong> {entry.error}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-shapee shadow-sm rounded-[14px] border border-white">
      <div className="max-w-7xl mx-auto ">
        {/* Header */}
        <div className="backdrop-blur-lg rounded-[14px] pt-4 pr-8 pb-0 pl-8 mb-8 text-white text-left bg-gradient-to-br 
                from-black to-purple-900">
                  <div className="flex mb-1 justify-between items-start">
                    <div className="flex ">
                      
                      <div>
                        <h1 className="text-2xl aeon-bold text-white flex flex-row"><span><img src={paycard} className="w-13 mt-0 h-12 mr-3" /> </span>
                          Credit Payments Integration System
                        </h1>
                        <p className="text-sm text-start text-gray-400 tracking-wide inter mt-2">
                          Manage recipients and track your payment transactions efficiently </p>
                      </div>
                    </div>
            
            <div className="text-right">
              <div className={`text-sm inter ${getConnectionStatusColor()} flex items-center gap-2 mb-2`}>
                <div className={`w-3 h-3 rounded-full ${
                  connectionStatus === 'connected' ? 'bg-green-500' :
                  connectionStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' :
                  connectionStatus === 'error' ? 'bg-red-500' : 'bg-gray-500'
                }`}></div>
                {getConnectionStatusText()}
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={testConnection}
                className="border border-purple-800 text-xs  text-purple-400 px-2 py-1
               inter rounded-[8px] hover:bg-purple-700 hover:!text-white flex items-center gap-2 text-[8px]
               transition-all"
                  disabled={isLoading}
                >
                 <img src={cloudd} className="h-3 w-3 " /> Connection Test
                </button>
                <button
                  onClick={() => setShowDebugPanel(true)}
                     className="border border-purple-800 text-xs  text-purple-400 px-2 py-1 bg-opacity-20 hover:bg-opacity-50  
               inter rounded-[8px]  flex items-center gap-2 text-[8px]
               transition-all"
    
                >
                  Debug Info
                </button>
              </div>
              
              {isLoading && (
                <div className="text-xs inter text-purple-700 mt-1">Syncing data...</div>
              )}
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex space-x-8 mt-6 gray200">
            {[
              { id: 'analytics', label: 'Analytics', icon: TrendingUp },
              { id: 'recipients', label: 'Recipients', icon: Users },
              { id: 'payments', label: 'Payment History', icon: Calendar },
            ].map(tab => {
              const Icon = tab.icon;
              return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    disabled={isLoading}
                    className={`flex items-center space-x-2 py-4 px-1 border-b-2 aeon-bold text-sm outline-none ${
                      activeTab === tab.id
                        ? 'border-green-500 text-green-500'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <Icon className="w-5 h-5 mr-2 " />
                    {tab.label}
                  </button>
              );
            })}
          </div>
        </div>

        {/* Content Area */}
        <div className=" p-8 ">
          {/* Recipients Tab */}
          {activeTab === 'recipients' && (
            <div className="space-y-8">
              {/* Add Recipient Form */}
        <div className="bg-white p-6 rounded-[14px] border border-green-200  hover:shadow-lg
                transition-all duration-300 hover:scale-[1.02]">
                <h3 className="text-xl aeon-bold  text-gray-800 mb-6 flex items-center">
                 <span className='bg-green-100 border border-green-200 rounded-[8px] w-7 h-7 mr-2' ><img src={add} className="p-1" /></span> 
                 Add New Recipient
               </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                  <div>
                         <label className="block text-sm intermid gray200 mb-2">
                          <div className='w-6 h-6 rounded-[8px] bg-green-100 border  border-pink-100'>
                          <img src={name} className='p-1' alt="" />
                        </div>Recipient Name</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="John Doe"
                      disabled={isLoading}
                      className="w-full outline-none inter gray200 px-4 py-3 border border-gray-300 
                      rounded-lg focus:ring-1 focus:ring-blue-50 focus:border-transparent transition-all disabled:opacity-50"
                    />
                  </div>
                  
                  <div>
                  <label className="block text-sm intermid gray200 mb-2">
                  <div className='w-6 h-6 rounded-[8px] bg-green-100 border  border-pink-100'>
                  <img src={msg} className='p-1' alt="" />
                  </div>Email Address</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="john@example.com"
                      disabled={isLoading}
                        className="w-full outline-none inter gray200 px-4 py-3 border border-gray-300 
                      rounded-lg focus:ring-1 focus:ring-blue-50 focus:border-transparent transition-all disabled:opacity-50"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm intermid gray200 mb-2">
                    <div className='w-6 h-6 rounded-[8px] bg-green-100 border  border-pink-100'>
                     <img src={phone} className='p-1 ' alt="" />
                    </div>Phone Number</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="+234801234567"
                      disabled={isLoading}
                        className="w-full outline-none inter gray200 px-4 py-3 border border-gray-300 
                      rounded-lg focus:ring-1 focus:ring-blue-50 focus:border-transparent transition-all disabled:opacity-50"
                    />
                  </div>
                  
                  <div>
                   <label className="block text-sm intermid gray200 mb-2">
                    <div className='w-6 h-6 rounded-[8px] bg-green-100 border  border-pink-100'>
                    <img src={bank} className='p-1' alt="" />
                    </div>Bank Name *</label>
                    <select
                      name="bank"
                      value={formData.bank}
                      onChange={handleInputChange}
                      disabled={isLoading}
                       className="w-full outline-none inter gray200 px-4 py-3 border border-gray-300 
                      rounded-lg focus:ring-1 focus:ring-blue-50 focus:border-transparent transition-all disabled:opacity-50"
                    >
                      <option value="">Select Bank</option>
                      {banks.map(bank => (
                        <option key={bank.value} value={bank.value}>{bank.label}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                      <label className="block text-sm intermid gray200 mb-2">
                    <div className='w-6 h-6 rounded-[8px] bg-green-100 border  border-pink-100'>
                    <img src={acct} className='p-1 ' alt="" />
                    </div>Account Number *</label>
                    <input
                      type="text"
                      name="accountNumber"
                      value={formData.accountNumber}
                      onChange={handleInputChange}
                      placeholder="1234567890"
                      disabled={isLoading}
                   className="w-full outline-none inter gray200 px-4 py-3 border border-gray-300 
                   rounded-lg focus:ring-1 focus:ring-blue-50 focus:border-transparent transition-all disabled:opacity-50"   
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm intermid gray200 mb-2">
                    <div className='w-6 h-6 rounded-[8px] bg-green-100 border  border-pink-100'>
                    <img src={notes} className='p-1' alt="" />
                    </div>Description</label>
                    <input
                      type="text"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="Supplier payment"
                      disabled={isLoading}
                className="w-full outline-none inter gray200 px-4 py-3 border border-gray-300 
                rounded-lg focus:ring-1 focus:ring-blue-50 focus:border-transparent transition-all disabled:opacity-50"
                    />
                  </div>
                </div>
                
                <button
                  onClick={addRecipient}
                  disabled={isLoading}
                  className="bg-green-600 text-white px-4 py-3 rounded-[14px] hover:bg-gradient-to-r from-green-600 to-blue-600  intermid w-full inter md:col-span-2
                  lg:col-span-5 transform hover:scale-102 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Adding...' : 'Add Recipient'}
                </button>
              </div>

              {/* Recipients List */}
              <div className="space-y-4">
                {recipients.length === 0 ? (
                 <div className="text-center py-16 text-gray-500 bg-white rounded-[14px] border border-gray-200">
                  <img src={user} className="w-16 h-16 mx-auto mb-4" />
                  <h3 className=" mb-2">No recipients added</h3>
                  <p className="text-sm inter">Add your first recipient to start making payments</p>
                  </div>
                ) : (
                  recipients.map(recipient => (
                    <div key={recipient.id} className="bg-white border border-gray-200 rounded-[14px] p-6 shadow-md hover:shadow-md 
                    transition-all">
                      <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                        <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-4">
                          <div>
                            <span className="text-xs intermid text-blue-500 uppercase tracking-wide">Name</span>
                            <p className="inter  mt-1 text-gray-900">{recipient.name}</p>
                          </div>
                          <div>
                            <span className="text-xs intermid text-blue-500 uppercase tracking-wide">Email</span>
                            <p className="text-xs text-gray-900">{recipient.email}</p>
                          </div>
                          <div>
                            <span className="text-xs intermid text-blue-500 uppercase tracking-wide">Bank</span>
                           <p className="inter text-xs mt-1 text-gray-900">{banks.find(b => b.value === recipient.bank)?.label}</p>
                          </div>
                          <div>
                            <span className="text-xs intermid text-blue-500 uppercase tracking-wide">Account</span>
                           <p className="inter mt-2 text-gray-900">{recipient.accountNumber}</p>
                          </div>
                          <div>
                            <span className="text-xs intermid text-blue-500 uppercase tracking-wide">Phone</span>
                          <p className="inter text-xs mt-2 text-gray-900">{recipient.phone}</p>
                          </div>
                          <div>
                            <span className="text-xs intermid text-blue-500 uppercase tracking-wide">Description</span>
                           <p className="inter text-xs mt-2 text-gray-900">{recipient.description || 'N/A'}</p>
                          </div>
                        </div>


                        {/* preview live */}
                        <div className="flex flex-col sm:flex-row gap-3 lg:w-auto w-full">
                        <input
                     type="number"
                    placeholder="Amount (₦)"
                      value={paymentAmounts[recipient.id] || ''}
                     onChange={(e) => handleAmountChange(recipient.id, e.target.value)}
                     min="100"
                      disabled={isLoading}
                          className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-1 focus:ring-blue-500 outline-none text-gray-500
                         focus:border-transparent w-32 disabled:opacity-50"
                         />
                  {/* preview live */}


                          <button
                            onClick={() => initiatePayment(recipient)}
                            disabled={isLoading || !paystackLoaded}
                         className="bg-cloud text-white px-6 py-2 rounded-xl intermid hover:!bg-green-600  transition-all duration-200
                             shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isLoading ? 'Processing...' : 'Pay Now'}
                          </button>
                          <button
                           onClick={() => deleteRecipient(recipient.id)}
                          disabled={isLoading}
                         className="bg-red-100 text-white px-3 py-2 rounded-[14px] hover:bg-red-300 hover:shadow-md 
                        transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                       <div className='h-5 w-5'>
                        <img src={del} className="" />
                        </div>
                          </button>
                      
                        </div>
                   
                      </div>
                                  {/* Add the AmountPreview component below the input */}
                        <div className="mt-4 p-3 bg-green-50 rounded-[12px]  text-md tracking-wide text-green-600">
                          <AmountPreview amount={paymentAmounts[recipient.id]} />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Payment History Tab */}
          {activeTab === 'payments' && (
            <div className="space-y-6">
              {/* Filters and Search */}
              <div className="flex flex-wrap gap-4 items-center justify-between">
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2">
                    <label className="intermid gray200">Period:</label>
                    <select
                      value={periodFilter}
                      onChange={(e) => setPeriodFilter(e.target.value)}
                          className="p-2 px-5 border rounded-[14px] border-gray-300 bg-white gray200 text-sm inter outline-none"
                    >
                      <option value="all">All Time</option>
                      <option value='today'>Today</option>
                      <option value='week'>This Week</option>
                      <option value='month'>This Month</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center gap-2">
                     <label className="intermid gray200">Status:</label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                     className="p-2 px-5 border rounded-[14px] border-gray-300 bg-white gray200 text-sm inter outline-none"
                    >
                      <option value="all">All Status</option>
                      <option value="success">Success</option>
                      <option value="pending">Pending</option>
                    </select>
                  </div>
                </div>
                
                {/* Search Field */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search payments..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-[14px] bg-white text-sm inter outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                
                {/* Export and Print Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={exportToCSV}
                    disabled={filteredPayments.length === 0}
                  className="border border-indigo-600 text-indigo-600 px-3 py-2 bg-white rounded-[14px] hover:bg-indigo-700  flex items-center gap-2 
            text-xs inter hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Download className="w-4 h-4" />
                    Export CSV
                  </button>
                  <button
                    onClick={printTable}
                    disabled={filteredPayments.length === 0}
                 className="border border-blue-600 bg-white text-indigo-500 px-3 py-2 rounded-[14px] hover:bg-blue-600  flex items-center gap-2 
            text-xs inter hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Printer className="w-4 h-4" />
                    Print History
                  </button>
                </div>
              </div>

              {/* Payments Table */}
                <div className="overflow-x-auto bg-white rounded-[14px] border border-blue-100  ">
                <table id="payments-table" className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 ">
                      <th className="px-6 py-4 text-left text-xs inter gray200 uppercase tracking-wide">Date</th>
                      <th className="px-6 py-4 text-left text-xs inter gray200 uppercase tracking-wide">Recipient</th>
                      <th className="px-6 py-4 text-left text-xs inter gray200 uppercase tracking-wide">Amount</th>
                      <th className="px-6 py-4 text-left text-xs inter gray200 uppercase tracking-wide">Status</th>
                      <th className="px-6 py-4 text-left text-xs inter gray200 uppercase tracking-wide">Reference</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y inter divide-gray-200 ">
                    {filteredPayments.length === 0 ? (
                      <tr>
                      <td colSpan={5} className="px-6 py-16 text-center inter text-gray-500 bg-white  ">
                                              <img src={agenda} className="w-12 h-12 mx-auto mb-3" />
                                              <h3 className=" mb-2">No payments found</h3>
                                              <p className="text-sm inter">Your payment history will appear here</p>
                       </td>
                       </tr>
                    ) : (
                      <>
                        {filteredPayments.map(payment => (
                          <tr key={payment.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap text-sm inter text-gray-600">
                              {new Date(payment.date).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 text-sm whitespace-nowrap intermid gray200">
                              {payment.recipientName}
                            </td>
                           <td className="px-6 py-4 text-sm whitespace-nowrap intermid text-green-600">
                              ₦{payment.amount.toLocaleString()}
                            </td>
                            <td className="px-6 py-4">
                                 <span className={`inline-flex px-3 py-1 inter rounded-full text-xs bg-green-100 text-blue-600${
                                payment.status === 'success' 
                                  ? 'bg-green-100 text-green-600' 
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {payment.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500 font-mono">
                              {payment.reference}
                            </td>
                          </tr>
                        ))}
                        {/* Total Row */}
                        <tr className="bg-gray-50 font-semibold">
                          <td className="px-6 py-4 text-sm intermid font-medium text-green-600" colSpan={2}>
                            Total ({filteredPayments.length} payments):
                          </td>
                          <td className="px-6 py-4 text-sm intermid font-medium text-green-600">
                            ₦{totalAmount.toLocaleString()}
                          </td>
                          <td className="px-6 py-4" colSpan={2}></td>
                        </tr>
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <div className="space-y-8">

          <h2 className="text-xl -bold aeon-bold gray200">Payment Analytics</h2>
                <div className="bg-white p-4 rounded-lg border border-purple-200">
        <div className="text-purple-800 text-sm inter flex flex-row gap-2">
          <img src={sync} alt="" className='w-5 h-5 border border-purple-100 bg-purple-50 rounded-full' />
          <p className="gray200 intermid">
          Synced Payments: </p> All payments details will appear here   
        </div>
      </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">

                   <div className="bg-blue-500 border border-blue-50 text-white p-6 rounded-[16px] shadow-sm">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="text-blue-50 text-sm inter font-medium">Today</p>
                                    <p className="text-2xl text-blue-50  aeon-bold">₦{analytics.todaySpent.toLocaleString()}</p>
                                  </div>
                                    <div className='w-14 h-14 rounded-full bg-blue-50 border shadow-md border-white'>
                                  <img src={totall} className="p-3  text-blue-200 " />
                                </div>
                                </div>
             </div>

                <div className="bg-purple-500 border border-purple-50 text-white  p-6 rounded-[16px] shadow-sm">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="text-purple-100 inter text-sm font-medium">This Month</p>
                                    <p className="text-2xl text-purple-50 aeon-bold">₦{analytics.monthlySpent.toLocaleString()}</p>
                                  </div>
                              <div className='w-14 h-14 rounded-full bg-purple-50 border border-white shadow-md'>
                                    <img src={month} className="p-3 text-purple-200" />
                                </div>
                                </div>
                              </div>

                   <div className="bg-green-500 border  border-green-50  text-white p-6 rounded-[16px] shadow-sm">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <p className="text-green-50 text-sm  inter font-medium">Total Spent</p>
                                     
                                      <p className="text-2xl aeon-bold text-white">₦{analytics.totalSpent.toLocaleString()}</p>
                                    </div>
                                    <div className='w-14 h-14 rounded-full bg-white border shadow-md  border-green-500'>
                                    <img src={pay} className="p-3  text-green-200" />
                                  </div>
                                  </div>
                                </div>

            

               

                 <div className="bg-indigo-500 border border-pink-50 text-white p-6 rounded-[16px] shadow-sm">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="text-indigo-100 text-sm inter font-medium">Total Payments</p>
                                     <p className="text-2xl text-indigo-50  aeon-bold ">{analytics.totalPayments}</p>
                                  </div>
                                  <div className='w-14 h-14 rounded-full bg-indigo-50 border border-white shadow-md'>
                                  <img src={todayy} className="p-3 text-indigo-200" /> 
                                </div>                
               </div>
              </div>
                              
              </div>
              
              {payments.length === 0 && (
               <div className="text-center py-16 py-8 text-gray-500 inter bg-white rounded-[14px] border border-indigo-100">
                                 <img src={graph} className="w-16 h-16 mx-auto mb-4" />
                                 <h3 className=" mb-2">No data available</h3>
                                 <p className="text-sm inter">Make some payments to see analytics</p>
                               </div>
              )}
            </div>
          )}
        </div>
        
        <DebugPanel />
      </div>
    </div>
  );
};

export default PaystackPaymentSystem;