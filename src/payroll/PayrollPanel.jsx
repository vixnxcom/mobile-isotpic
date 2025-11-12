import React, { useState, useEffect } from 'react';
import { Users, Calendar, DollarSign, Download, Printer, Search, Filter, Plus, Mail, Phone, Building, IdCard, Loader2, Eye, EyeOff, Cloud, X, ChevronLeft, ChevronRight, PanelTopClose, FolderClosed, EyeClosed, FolderClosedIcon, XCircle } from 'lucide-react';
import { add, check, cloudd, coins, debitc, edit, salary, text, tick, user } from '../assets';

const PayrollManagementSystem = () => {
  const [activeTab, setActiveTab] = useState('employees');
  const [employees, setEmployees] = useState([]);
  const [payrollRuns, setPayrollRuns] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [paystackLoaded, setPaystackLoaded] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');

  // PAGINATION STATE FOR PAYROLL HISTORY
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  // Combined state for payroll history
  const [selectedPayrollRun, setSelectedPayrollRun] = useState(null);
  const [paymentDetails, setPaymentDetails] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');

  // PAGINATION FOR EMPLOYEE MODAL
  const [modalCurrentPage, setModalCurrentPage] = useState(1);
  const [modalItemsPerPage, setModalItemsPerPage] = useState(10);

  // PAGINATION FOR EMPLOYEE SELECTION (Run Payroll & Payment Tracking)
  const [employeeSelectCurrentPage, setEmployeeSelectCurrentPage] = useState(1);
  const [employeeSelectItemsPerPage] = useState(6); // Show 6 employees per page (3 rows × 2 per row)

  // NEW STATE FOR PAYMENT TRACKING AND SEARCH
  const [paymentTracking, setPaymentTracking] = useState({
    searchTerm: '',
    timeFrame: 'week', // week, month, year
    selectedEmployee: null,
    paymentSummary: null
  });

  // Google Apps Script Web App URL - REPLACE WITH YOURS
  const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwQE9gIi2chxmpcc_3uNHbmH1PlmS-KzyD9gSXzwuyBFA3IFrxCQ5EoQB9uCtqh9wys/exec';

  // Employee form state
  const [employeeForm, setEmployeeForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    department: '',
    position: '',
    bankName: '',
    accountNumber: '',
    accountName: '',
    basicSalary: '',
    allowances: '',
    deductions: ''
  });

  // Payroll run state
  const [payrollRun, setPayrollRun] = useState({
    name: '',
    period: '',
    paymentDate: '',
    selectedEmployees: []
  });

  const PAYSTACK_PUBLIC_KEY = 'pk_test_aa9fab935a0de3dda723d27a2c97257831820cbc';

  // NEW: State for account verification
  const [processingPayments, setProcessingPayments] = useState({});
  const [verificationStatus, setVerificationStatus] = useState({});

  // Sample departments
  const departments = [
    'Engineering', 'Sales', 'Marketing', 'HR', 'Finance', 'Operations', 'Customer Support' , 'Site Worker' , 'Admin', 'Accounting', 'Company Driver', 'Management', 'Contractor'
  ];

  // Sample banks list
 const banks = [
  'Access Bank',
  'GTBank',
  'Zenith Bank',
  'First Bank',
  'UBA',
  'Fidelity Bank',
  'Stanbic IBTC',
  'Union Bank',
  'Ecobank',
  'Wema Bank',
  'OPay (Microfinance Bank)',
  'Moniepoint (Microfinance Bank)',
  'Jaiz Bank (Islamic Bank)',
  'Sterling Bank',
  'Keystone Bank',
  'Standard Chartered Bank',
  'Kuda Bank (Microfinance Bank)',
  'Citibank Nigeria',
  'First City Monument Bank (FCMB)',
  'Globus Bank',
  'Heritage Bank',
  'Polaris Bank',
  'PremiumTrust Bank',
  'Providus Bank',
  'Suntrust Bank',
  'Titan Trust Bank',
  'Unity Bank'
];


  // NEW: Paystack integration functions
  const resolveAccountViaAppsScript = async (bankName, accountNumber) => {
    try {
      const params = new URLSearchParams({
        action: 'resolveAccount',
        bankName: bankName,
        accountNumber: accountNumber
      });
      
      const url = `${APPS_SCRIPT_URL}?${params.toString()}`;
      const res = await fetch(url, { method: 'GET', mode: 'cors' });
      if (!res.ok) throw new Error(`${res.status}: ${res.statusText}`);
      const text = await res.text();
      const result = JSON.parse(text);
      if (!result.success) throw new Error(result.error || 'Failed to resolve account');
      return result.data; // expect { account_name, account_number }
    } catch (error) {
      throw error;
    }
  };

  const createRecipientViaAppsScript = async (name, bankName, accountNumber) => {
    try {
      const params = new URLSearchParams({
        action: 'createRecipient',
        name: name,
        bankName: bankName,
        accountNumber: accountNumber
      });
      const url = `${APPS_SCRIPT_URL}?${params.toString()}`;
      const res = await fetch(url, { method: 'GET', mode: 'cors' });
      if (!res.ok) throw new Error(`${res.status}: ${res.statusText}`);
      const text = await res.text();
      const result = JSON.parse(text);
      if (!result.success) throw new Error(result.error || 'Failed to create recipient');
      return result.data; // expect { recipient_code, details: {...} }
    } catch (error) {
      throw error;
    }
  };

  const initiateTransferViaAppsScript = async (recipientCode, amountKobo, reason = 'Salary Payment') => {
    try {
      const params = new URLSearchParams({
        action: 'initiateTransfer',
        recipientCode: recipientCode,
        amountKobo: String(amountKobo),
        reason: reason
      });
      const url = `${APPS_SCRIPT_URL}?${params.toString()}`;
      const res = await fetch(url, { method: 'GET', mode: 'cors' });
      if (!res.ok) throw new Error(`${res.status}: ${res.statusText}`);
      const text = await res.text();
      const result = JSON.parse(text);
      if (!result.success) throw new Error(result.error || 'Failed to initiate transfer');
      return result.data; // expect { transfer_code, status, ... }
    } catch (error) {
      throw error;
    }
  };

  const verifyTransferViaAppsScript = async (transferCode) => {
    try {
      const params = new URLSearchParams({
        action: 'verifyTransfer',
        transferCode: transferCode
      });
      const url = `${APPS_SCRIPT_URL}?${params.toString()}`;
      const res = await fetch(url, { method: 'GET', mode: 'cors' });
      if (!res.ok) throw new Error(`${res.status}: ${res.statusText}`);
      const text = await res.text();
      const result = JSON.parse(text);
      if (!result.success) throw new Error(result.error || 'Failed to verify transfer');
      return result.data; // expect { status: 'success'|'failed'|'pending', ... }
    } catch (error) {
      throw error;
    }
  };

  // NEW: Account verification function
  const verifyAccountBeforeTransfer = async (employee) => {
    try {
      const resolved = await resolveAccountViaAppsScript(employee.bankName, employee.accountNumber);
      
      return {
        success: true,
        resolvedAccount: {
          name: resolved.account_name,
          number: resolved.account_number || employee.accountNumber,
          bank: employee.bankName
        },
        nameMatches: resolved.account_name.toLowerCase().includes(employee.firstName.toLowerCase()) ||
                    resolved.account_name.toLowerCase().includes(employee.lastName?.toLowerCase() || '') ||
                    employee.firstName.toLowerCase().includes(resolved.account_name.toLowerCase()) ||
                    (employee.lastName && employee.lastName.toLowerCase().includes(resolved.account_name.toLowerCase()))
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  };

  // NEW: Account verification only function
  const verifyAccountOnly = async (employee) => {
    setVerificationStatus(prev => ({ ...prev, [employee.id]: 'verifying' }));
    
    try {
      const verification = await verifyAccountBeforeTransfer(employee);
      
      if (verification.success) {
        const { resolvedAccount, nameMatches } = verification;
        const status = nameMatches ? '✅ MATCH' : '⚠️ MISMATCH';
        
        alert(
          `ACCOUNT VERIFICATION:\n\n` +
          `Stored: ${employee.firstName} ${employee.lastName}\n` +
          `Verified: ${resolvedAccount.name}\n` +
          `Status: ${status}\n\n` +
          `Account: ${resolvedAccount.number}\n` +
          `Bank: ${resolvedAccount.bank}`
        );
        setVerificationStatus(prev => ({ ...prev, [employee.id]: nameMatches ? 'matched' : 'mismatch' }));
      } else {
        alert(`Verification failed: ${verification.error}`);
        setVerificationStatus(prev => ({ ...prev, [employee.id]: 'error' }));
      }
    } catch (error) {
      alert(`Verification error: ${error.message}`);
      setVerificationStatus(prev => ({ ...prev, [employee.id]: 'error' }));
    }
  };

  // NEW: Enhanced transfer function with account verification
  const initiateVerifiedTransfer = async (employee, payrollId) => {
    const amount = calculateNetSalary(employee);
    
    if (!amount || amount < 100) {
      alert('Please ensure employee has a valid salary amount (minimum ₦100)');
      return;
    }

    // STEP 1: Verify account before anything else
    const verification = await verifyAccountBeforeTransfer(employee);
    
    if (!verification.success) {
      alert(`Account verification failed: ${verification.error}`);
      return;
    }

    // STEP 2: Show verification results
    const { resolvedAccount, nameMatches } = verification;
    
    if (!nameMatches) {
      const userConfirmed = window.confirm(
        `🔍 ACCOUNT VERIFICATION RESULTS:\n\n` +
        `Stored Name: ${employee.firstName} ${employee.lastName}\n` +
        `Bank Verified Name: ${resolvedAccount.name}\n` +
        `Account Number: ${resolvedAccount.number}\n` +
        `Bank: ${resolvedAccount.bank}\n\n` +
        `❌ Names don't match exactly!\n\n` +
        `Do you want to proceed with salary payment to:\n"${resolvedAccount.name}"?`
      );
      
      if (!userConfirmed) {
        alert('Salary payment cancelled - account name mismatch');
        return;
      }
    } else {
      const userConfirmed = window.confirm(
        `✅ ACCOUNT VERIFIED:\n\n` +
        `Employee: ${employee.firstName} ${employee.lastName}\n` +
        `Verified Name: ${resolvedAccount.name}\n` +
        `Account: ${resolvedAccount.number}\n` +
        `Amount: ₦${amount.toLocaleString()}\n\n` +
        `Proceed with salary payment?`
      );
      
      if (!userConfirmed) {
        alert('Salary payment cancelled by user');
        return;
      }
    }

    // STEP 3: Proceed with transfer using VERIFIED account details
    setProcessingPayments(prev => ({ ...prev, [employee.id]: true }));
    
    try {
      // Use the verified account name, not the stored one
      const recipientResult = await createRecipientViaAppsScript(
        resolvedAccount.name,
        resolvedAccount.bank,
        resolvedAccount.number
      );
      
      const recipientCode = recipientResult.recipient_code || (recipientResult.recipientCode || recipientResult.code);

      if (!recipientCode) {
        throw new Error('No recipient code returned from server');
      }

      // Step 4: Initiate transfer
      const transferData = await initiateTransferViaAppsScript(recipientCode, Math.round(amount * 100), `Salary Payment to ${resolvedAccount.name}`);
      const transferCode = transferData.transfer_code || transferData.transferCode || transferData.code;

      if (!transferCode) {
        throw new Error('No transfer code returned from server');
      }

      // Step 5: Verify transfer status
      const verification = await verifyTransferViaAppsScript(transferCode);

      // process verification
      if (verification.status === 'success' || verification.data?.status === 'success') {
        // Save payment record
        const paymentRecord = {
          id: `pay_${Date.now()}`,
          employeeId: employee.id,
          employeeName: resolvedAccount.name,
          payrollId: payrollId,
          amount: amount,
          status: 'success',
          reference: transferCode,
          paystackResponse: verification,
          date: new Date().toISOString()
        };
        
        await savePaymentRecordToSheets(paymentRecord);
        alert(`Salary payment successful: ${transferCode}`);
        return { status: 'success', data: verification };
      } else {
        // pending or failed
        alert(`Salary payment status: ${verification.status || 'pending'}`);
        return { status: verification.status || 'pending', data: verification };
      }
    } catch (error) {
      console.error('Transfer flow error:', error);
      alert(`Salary payment failed: ${error.message}`);
      return { status: 'error', error: error.message };
    } finally {
      setProcessingPayments(prev => ({ ...prev, [employee.id]: false }));
    }
  };

  // Filtered employees for search - MOVED BEFORE PAGINATION CALCULATIONS
  const filteredEmployees = React.useMemo(() => {
    if (!paymentTracking.searchTerm) return employees;
    const searchLower = paymentTracking.searchTerm.toLowerCase();
    return employees.filter(employee => 
      employee.firstName.toLowerCase().includes(searchLower) ||
      employee.lastName.toLowerCase().includes(searchLower) ||
      employee.email.toLowerCase().includes(searchLower) ||
      employee.department.toLowerCase().includes(searchLower)
    );
  }, [employees, paymentTracking.searchTerm]);

  // Employee Modal Component - UPDATED WITH PAGINATION
  const EmployeeModal = ({ payrollRun, employees, onClose }) => {
    if (!payrollRun) return null;

    const runEmployees = employees.filter(employee => 
      payrollRun.selectedEmployees.includes(employee.id)
    );

    // Modal pagination calculations
    const modalTotalPages = Math.ceil(runEmployees.length / modalItemsPerPage);
    const modalStartIndex = (modalCurrentPage - 1) * modalItemsPerPage;
    const modalEndIndex = modalStartIndex + modalItemsPerPage;
    const modalPaginatedEmployees = runEmployees.slice(modalStartIndex, modalEndIndex);

    const handleModalClose = () => {
      setModalCurrentPage(1); // Reset to first page when closing
      onClose();
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-[14px] w-full max-w-6xl max-h-[90vh] overflow-hidden">
          <div className="flex justify-between items-center p-6 ">
            <div>
              <h2 className="text-xl aeon-bold text-purple-600">
                Employees in {payrollRun.name}
              </h2>
              <p className="text-sm text-gray-600 aeon-bold mt-1">
                {runEmployees.length} employees • Total: ₦{payrollRun.totalAmount?.toLocaleString() || '0'}
              </p>
            </div>
            <button
              onClick={handleModalClose}
              className="text-gray-400 hover:text-purple-600 border-purple-200 rounded-full transition-colors"
            >
              <X className="w-6 h-6 " />
            </button>
          </div>
          
          {/* Modal Pagination Controls */}
          {runEmployees.length > 0 && (
            <div className="flex justify-between items-center px-6 py-3 bg-purple-50">
              <div className="flex items-center space-x-4">
                <span className="text-sm inter text-gray-700">
                  Showing {modalStartIndex + 1} to {Math.min(modalEndIndex, runEmployees.length)} of {runEmployees.length} employees
                </span>
                <select
                  value={modalItemsPerPage}
                  onChange={(e) => {
                    setModalItemsPerPage(Number(e.target.value));
                    setModalCurrentPage(1);
                  }}
                  className="border border-gray-300 text-gray-700 inter rounded-[8px] px-2 py-1 text-sm outline-none bg-white"
                >
                  <option value={5}>5 per page</option>
                  <option value={10}>10 per page</option>
                  <option value={20}>20 per page</option>
                  <option value={50}>50 per page</option>
                </select>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setModalCurrentPage(1)}
                  disabled={modalCurrentPage === 1}
                  className="p-1 border border-gray-300 rounded-lg inter text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm inter text-gray-700">
                  Page {modalCurrentPage} of {modalTotalPages}
                </span>
                <button
                  onClick={() => setModalCurrentPage(prev => Math.min(prev + 1, modalTotalPages))}
                  disabled={modalCurrentPage === modalTotalPages}
                  className="p-1 border border-gray-300 rounded-lg text-sm inter disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
          
          <div className="p-6 overflow-y-auto max-h-[50vh]">
            {runEmployees.length === 0 ? (
              <div className="text-center py-8">
                <div className='bg-blue-50 border border-blue-100 w-16 h-16 mx-auto rounded-full'>
                  <img src={user} className="opacity-50 p-2 mx-auto mb-4" />
                </div>
                <p className="text-gray-600 inter">No employees found in this payroll run</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead className="bg-purple-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs inter gray200 uppercase tracking-wider">Employee Name</th>
                      <th className="px-4 py-3 text-left text-xs inter gray200 uppercase tracking-wider">Department</th>
                      <th className="px-4 py-3 text-left text-xs inter gray200 uppercase tracking-wider">Position</th>
                      <th className="px-4 py-3 text-left text-xs inter gray200 uppercase tracking-wider">Bank Details</th>
                      <th className="px-4 py-3 text-left text-xs inter gray200 uppercase tracking-wider">Net Salary</th>
                      <th className="px-4 py-3 text-left text-xs inter gray200 uppercase tracking-wider">Contact</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {modalPaginatedEmployees.map(employee => (
                      <tr key={employee.id} className="hover:bg-purple-50">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm intermid text-gray-900">
                            {employee.firstName} {employee.lastName}
                          </div>
                          <div className="text-xs inter text-g  ray-500">{employee.email}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm inter text-gray-900">{employee.department}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm inter text-gray-600">{employee.position}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm inter text-gray-900">{employee.bankName}</div>
                          <div className="text-xs inter text-gray-500">{employee.accountNumber}</div>
                          {employee.accountName && (
                            <div className="text-xs inter text-gray-500">{employee.accountName}</div>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm intermid text-green-600">
                            ₦{calculateNetSalary(employee).toLocaleString()}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {employee.phone && (
                            <div className="text-xs inter text-gray-500">+{employee.phone}</div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          
          {/* Modal Footer with Pagination */}
          {runEmployees.length > 0 && (
            <div className="flex justify-between items-center p-4 border-t border-purple-200 bg-purple-50">
              <div className="text-sm inter text-gray-600">
                Showing {modalStartIndex + 1}-{Math.min(modalEndIndex, runEmployees.length)} of {runEmployees.length} employees
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setModalCurrentPage(1)}
                  disabled={modalCurrentPage === 1}
                  className="px-3 py-1 border border-gray-300 rounded-lg inter text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                >
                  First
                </button>
                <button
                  onClick={() => setModalCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={modalCurrentPage === 1}
                  className="px-3 py-1 border border-gray-300 rounded-lg text-sm inter disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                >
                  Previous
                </button>
                
                <div className="flex space-x-1">
                  {Array.from({ length: Math.min(5, modalTotalPages) }, (_, i) => {
                    let pageNum;
                    if (modalTotalPages <= 5) {
                      pageNum = i + 1;
                    } else if (modalCurrentPage <= 3) {
                      pageNum = i + 1;
                    } else if (modalCurrentPage >= modalTotalPages - 2) {
                      pageNum = modalTotalPages - 4 + i;
                    } else {
                      pageNum = modalCurrentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setModalCurrentPage(pageNum)}
                        className={`w-8 h-8 rounded-lg text-sm inter ${
                          modalCurrentPage === pageNum
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
                  onClick={() => setModalCurrentPage(prev => Math.min(prev + 1, modalTotalPages))}
                  disabled={modalCurrentPage === modalTotalPages}
                  className="px-3 py-1 border border-gray-300 rounded-lg text-sm inter disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                >
                  Next
                </button>
                <button
                  onClick={() => setModalCurrentPage(modalTotalPages)}
                  disabled={modalCurrentPage === modalTotalPages}
                  className="px-3 py-1 border border-gray-300 rounded-lg text-sm inter disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                >
                  Last
                </button>
              </div>
            </div>
          )}
          
          <div className="flex justify-end p-4 border-t border-gray-200">
            <button
              onClick={handleModalClose}
              className="bg-purple-300 text-white px-6 py-2 rounded-[14px] hover:bg-purple-600 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  // PAGINATION CALCULATIONS FOR PAYROLL HISTORY
  const paginatedPayrollRuns = React.useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return payrollRuns.slice(startIndex, endIndex);
  }, [payrollRuns, currentPage, itemsPerPage]);

  // PAGINATION CALCULATIONS FOR EMPLOYEE SELECTION
  const paginatedEmployees = React.useMemo(() => {
    const startIndex = (employeeSelectCurrentPage - 1) * employeeSelectItemsPerPage;
    const endIndex = startIndex + employeeSelectItemsPerPage;
    return employees.slice(startIndex, endIndex);
  }, [employees, employeeSelectCurrentPage, employeeSelectItemsPerPage]);

  // PAGINATION CALCULATIONS FOR FILTERED EMPLOYEES (Payment Tracking)
  const paginatedFilteredEmployees = React.useMemo(() => {
    const startIndex = (employeeSelectCurrentPage - 1) * employeeSelectItemsPerPage;
    const endIndex = startIndex + employeeSelectItemsPerPage;
    return filteredEmployees.slice(startIndex, endIndex);
  }, [filteredEmployees, employeeSelectCurrentPage, employeeSelectItemsPerPage]);

  const totalPages = Math.ceil(payrollRuns.length / itemsPerPage);
  const employeeSelectTotalPages = Math.ceil(employees.length / employeeSelectItemsPerPage);
  const filteredEmployeeSelectTotalPages = Math.ceil(filteredEmployees.length / employeeSelectItemsPerPage);

  // Filtered payroll runs for reports - FIXED FILTER LOGIC
  const filteredPayrollRuns = React.useMemo(() => {
    if (statusFilter === 'all') return payrollRuns;
    return payrollRuns.filter(run => run.status === statusFilter);
  }, [payrollRuns, statusFilter]);

  // NEW: Calculate total amount spent on all payrolls
  const totalPayrollSpending = React.useMemo(() => {
    return payrollRuns.reduce((total, run) => {
      return total + (run.totalAmount || 0);
    }, 0);
  }, [payrollRuns]);

  // NEW: Calculate total amount spent on filtered payroll runs
  const filteredPayrollSpending = React.useMemo(() => {
    return filteredPayrollRuns.reduce((total, run) => {
      return total + (run.totalAmount || 0);
    }, 0);
  }, [filteredPayrollRuns]);

  // Get employee names for a payroll run
  const getEmployeeNamesForRun = (payrollRun) => {
    if (!payrollRun.selectedEmployees || payrollRun.selectedEmployees.length === 0) return [];
    
    return payrollRun.selectedEmployees.map(empId => {
      const employee = employees.find(e => e.id === empId);
      return employee ? `${employee.firstName} ${employee.lastName}` : 'Unknown Employee';
    });
  };

  // NEW: Calculate payment summary for selected employee and time frame
  const calculatePaymentSummary = (employeeId, timeFrame) => {
    if (!employeeId || !payrollRuns.length) return null;

    const now = new Date();
    let startDate;

    switch (timeFrame) {
      case 'week':
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'month':
        startDate = new Date(now.setMonth(now.getMonth() - 1));
        break;
      case 'year':
        startDate = new Date(now.setFullYear(now.getFullYear() - 1));
        break;
      default:
        startDate = new Date(now.setDate(now.getDate() - 7));
    }

    // Filter payroll runs within the time frame
    const relevantRuns = payrollRuns.filter(run => {
      const runDate = new Date(run.createdAt);
      return runDate >= startDate && 
             run.selectedEmployees.includes(employeeId) &&
             run.status === 'completed';
    });

    // Calculate total payments
    const totalAmount = relevantRuns.reduce((total, run) => {
      const employee = employees.find(e => e.id === employeeId);
      return total + (employee ? calculateNetSalary(employee) : 0);
    }, 0);

    return {
      totalAmount,
      numberOfPayments: relevantRuns.length,
      timeFrame,
      runs: relevantRuns
    };
  };

  // NEW: Handle employee selection for payment tracking
  const handleEmployeeSelect = (employee) => {
    setPaymentTracking(prev => ({
      ...prev,
      selectedEmployee: employee,
      paymentSummary: calculatePaymentSummary(employee.id, prev.timeFrame)
    }));
  };

  // NEW: Handle time frame change
  const handleTimeFrameChange = (timeFrame) => {
    setPaymentTracking(prev => ({
      ...prev,
      timeFrame,
      paymentSummary: prev.selectedEmployee ? 
        calculatePaymentSummary(prev.selectedEmployee.id, timeFrame) : null
    }));
  };

  // Google Apps Script API Functions
  const saveEmployeeToSheets = async (employee) => {
    try {
      const params = new URLSearchParams({
        action: 'addEmployee',
        data: JSON.stringify(employee)
      });
      
      const response = await fetch(`${APPS_SCRIPT_URL}?${params.toString()}`, {
        method: 'GET',
        mode: 'cors'
      });
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const result = await response.json();
      if (!result.success) throw new Error(result.error);
      
      setConnectionStatus('connected');
      return result.data;
    } catch (error) {
      setConnectionStatus('error');
      throw error;
    }
  };

  const savePayrollRunToSheets = async (payrollRun) => {
    try {
      const params = new URLSearchParams({
        action: 'addPayrollRun',
        data: JSON.stringify(payrollRun)
      });
      
      const response = await fetch(`${APPS_SCRIPT_URL}?${params.toString()}`, {
        method: 'GET',
        mode: 'cors'
      });
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const result = await response.json();
      if (!result.success) throw new Error(result.error);
      
      return result.data;
    } catch (error) {
      throw error;
    }
  };

  const savePaymentRecordToSheets = async (payment) => {
    try {
      const params = new URLSearchParams({
        action: 'addPaymentRecord',
        data: JSON.stringify(payment)
      });
      
      const response = await fetch(`${APPS_SCRIPT_URL}?${params.toString()}`, {
        method: 'GET',
        mode: 'cors'
      });
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('Failed to save payment record:', error);
      return false;
    }
  };

  const loadEmployeesFromSheets = async () => {
    try {
      const response = await fetch(`${APPS_SCRIPT_URL}?action=getEmployees`, {
        method: 'GET',
        mode: 'cors'
      });
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const result = await response.json();
      if (result.success) {
        setEmployees(result.data || []);
        setConnectionStatus('connected');
      }
    } catch (error) {
      setConnectionStatus('error');
      console.error('Error loading employees:', error);
    }
  };

  const loadPayrollRunsFromSheets = async () => {
    try {
      const response = await fetch(`${APPS_SCRIPT_URL}?action=getPayrollRuns`, {
        method: 'GET',
        mode: 'cors'
      });
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const result = await response.json();
      if (result.success) {
        setPayrollRuns(result.data || []);
      }
    } catch (error) {
      console.error('Error loading payroll runs:', error);
    }
  };

  // New function to load payment details for reports
  const loadPaymentDetailsForRun = async (payrollRunId) => {
    try {
      const response = await fetch(`${APPS_SCRIPT_URL}?action=getPaymentRecords&payrollId=${payrollRunId}`, {
        method: 'GET',
        mode: 'cors'
      });
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const result = await response.json();
      if (result.success) {
        setPaymentDetails(result.data || []);
        setSelectedPayrollRun(payrollRunId);
      }
    } catch (error) {
      console.error('Error loading payment details:', error);
      alert('Failed to load payment details');
    }
  };

  // Test connection
  const testConnection = async () => {
    try {
      setConnectionStatus('connecting');
      const response = await fetch(`${APPS_SCRIPT_URL}?action=test`, {
        method: 'GET',
        mode: 'cors'
      });
      
      const result = await response.json();
      if (result.success) {
        setConnectionStatus('connected');
        alert('✅ Connected to Google Sheets successfully!');
      } else {
        setConnectionStatus('error');
        alert('❌ Connection failed: ' + result.error);
      }
    } catch (error) {
      setConnectionStatus('error');
      alert('❌ Connection failed: ' + error.message);
    }
  };

  // Initialize data
  const initializeData = async () => {
    setIsLoading(true);
    await Promise.all([loadEmployeesFromSheets(), loadPayrollRunsFromSheets()]);
    setIsLoading(false);
  };

  // Load Paystack
  useEffect(() => {
    const loadPaystack = () => {
      const script = document.createElement('script');
      script.src = 'https://js.paystack.co/v1/inline.js';
      script.async = true;
      script.onload = () => setPaystackLoaded(true);
      script.onerror = () => {
        console.error('Failed to load Paystack script');
        setPaystackLoaded(false);
      };
      document.head.appendChild(script);
    };

    if (!window.PaystackPop) {
      loadPaystack();
    } else {
      setPaystackLoaded(true);
    }
  }, []);

  // Load initial data
  useEffect(() => {
    initializeData();
  }, []);

  // Calculate net salary
  const calculateNetSalary = (employee) => {
    const basic = parseFloat(employee.basicSalary) || 0;
    const allowances = parseFloat(employee.allowances) || 0;
    const deductions = parseFloat(employee.deductions) || 0;
    return basic + allowances - deductions;
  };

  // Add new employee
  const addEmployee = async () => {
    if (!employeeForm.firstName || !employeeForm.email || !employeeForm.bankName || !employeeForm.accountNumber) {
      alert('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    try {
      const newEmployee = {
        id: `emp_${Date.now()}`,
        ...employeeForm,
        netSalary: calculateNetSalary(employeeForm),
        status: 'active',
        createdAt: new Date().toISOString()
      };

      // Save to Google Sheets
      await saveEmployeeToSheets(newEmployee);
      
      // Update local state
      setEmployees([...employees, newEmployee]);
      setEmployeeForm({
        firstName: '', lastName: '', email: '', phone: '', department: '',
        position: '', bankName: '', accountNumber: '', accountName: '',
        basicSalary: '', allowances: '', deductions: ''
      });

      alert('Employee added successfully!');
    } catch (error) {
      alert('Error adding employee: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Process payroll run - UPDATED WITH VERIFIED TRANSFERS
  const processPayroll = async () => {
    if (payrollRun.selectedEmployees.length === 0) {
      alert('Please select employees for payroll');
      return;
    }

    setIsLoading(true);
    const payrollId = `payrun_${Date.now()}`;
    
    try {
      // Create payroll run record
      const payrollData = {
        id: payrollId,
        ...payrollRun,
        totalAmount: payrollRun.selectedEmployees.reduce((total, empId) => {
          const employee = employees.find(e => e.id === empId);
          return total + calculateNetSalary(employee);
        }, 0),
        status: 'processing',
        createdAt: new Date().toISOString()
      };

      // Save payroll run to Sheets
      await savePayrollRunToSheets(payrollData);
      setPayrollRuns([payrollData, ...payrollRuns]);

      // Process payments sequentially with verification
      let successfulPayments = 0;
      let failedPayments = 0;
      let cancelledPayments = 0;

      for (const empId of payrollRun.selectedEmployees) {
        const employee = employees.find(e => e.id === empId);
        
        // Use verified transfer instead of old payment method
        const result = await initiateVerifiedTransfer(employee, payrollId);
        
        if (result && result.status === 'success') {
          successfulPayments++;
        } else if (result && result.status === 'cancelled') {
          cancelledPayments++;
        } else {
          failedPayments++;
        }
      }

      // Update payroll run status
      const finalStatus = failedPayments === 0 && cancelledPayments === 0 ? 'completed' : 'partial';
      await savePayrollRunToSheets({
        ...payrollData,
        status: finalStatus,
        successfulPayments,
        failedPayments,
        cancelledPayments
      });

      setPayrollRuns(prev => prev.map(p => 
        p.id === payrollId ? { ...p, status: finalStatus } : p
      ));

      alert(`Payroll processing completed!\nSuccessful: ${successfulPayments}\nCancelled: ${cancelledPayments}\nFailed: ${failedPayments}`);
      
    } catch (error) {
      alert('Error processing payroll: ' + error.message);
    } finally {
      setIsLoading(false);
      setPayrollRun({ name: '', period: '', paymentDate: '', selectedEmployees: [] });
    }
  };

  // Helper functions for payment handling (kept for compatibility)
  const handlePaymentSuccess = async (employee, payrollId, response, resolve) => {
    try {
      const paymentRecord = {
        id: `pay_${Date.now()}`,
        employeeId: employee.id,
        employeeName: `${employee.firstName} ${employee.lastName}`,
        payrollId: payrollId,
        amount: calculateNetSalary(employee),
        status: 'success',
        reference: response.reference,
        paystackResponse: response,
        date: new Date().toISOString()
      };
      
      await savePaymentRecordToSheets(paymentRecord);
      resolve({ status: 'success', data: response });
    } catch (error) {
      console.error('Error saving successful payment:', error);
      resolve({ status: 'success', data: response, saveError: error.message });
    }
  };

  const handlePaymentClosed = async (employee, payrollId, resolve) => {
    try {
      const paymentRecord = {
        id: `pay_${Date.now()}`,
        employeeId: employee.id,
        employeeName: `${employee.firstName} ${employee.lastName}`,
        payrollId: payrollId,
        amount: calculateNetSalary(employee),
        status: 'cancelled',
        reference: 'N/A',
        date: new Date().toISOString()
      };
      
      await savePaymentRecordToSheets(paymentRecord);
      resolve({ status: 'cancelled', data: null });
    } catch (error) {
      console.error('Error saving cancelled payment:', error);
      resolve({ status: 'cancelled', data: null, saveError: error.message });
    }
  };

  const handlePaymentError = async (employee, payrollId, error, resolve) => {
    try {
      const paymentRecord = {
        id: `pay_${Date.now()}`,
        employeeId: employee.id,
        employeeName: `${employee.firstName} ${employee.lastName}`,
        payrollId: payrollId,
        amount: calculateNetSalary(employee),
        status: 'error',
        reference: 'N/A',
        error: error.message,
        date: new Date().toISOString()
      };
      
      await savePaymentRecordToSheets(paymentRecord);
      resolve({ status: 'error', data: null, error: error.message });
    } catch (saveError) {
      console.error('Error saving error payment:', saveError);
      resolve({ status: 'error', data: null, error: error.message });
    }
  };

  // Process individual employee payment - FIXED VERSION
  const processEmployeePayment = async (employee, payrollId) => {
    const amount = calculateNetSalary(employee) * 100;

    return new Promise((resolve) => {
      try {
        // Validate Paystack is available
        if (!window.PaystackPop || typeof window.PaystackPop.setup !== 'function') {
          throw new Error('Paystack is not available. Please refresh the page and try again.');
        }

        // Create the callback functions
        const onSuccess = (response) => {
          handlePaymentSuccess(employee, payrollId, response, resolve);
        };

        const onClose = () => {
          handlePaymentClosed(employee, payrollId, resolve);
        };

        const handler = window.PaystackPop.setup({
          key: PAYSTACK_PUBLIC_KEY,
          email: employee.email,
          amount: amount,
          currency: 'NGN',
          ref: `payroll_${payrollId}_${employee.id}_${Date.now()}`,
          metadata: {
            payrollId: payrollId,
            employeeId: employee.id,
            employeeName: `${employee.firstName} ${employee.lastName}`,
            type: 'salary'
          },
          callback: onSuccess,
          onClose: onClose
        });

        if (handler && typeof handler.openIframe === 'function') {
          handler.openIframe();
        } else {
          throw new Error('Paystack payment handler failed to initialize');
        }

      } catch (error) {
        console.error('Payment initiation error:', error);
        handlePaymentError(employee, payrollId, error, resolve);
      }
    });
  };

  // Toggle employee selection for payroll
  const toggleEmployeeSelection = (employeeId) => {
    setPayrollRun(prev => ({
      ...prev,
      selectedEmployees: prev.selectedEmployees.includes(employeeId)
        ? prev.selectedEmployees.filter(id => id !== employeeId)
        : [...prev.selectedEmployees, employeeId]
    }));
  };

  // Select all employees
  const selectAllEmployees = () => {
    setPayrollRun(prev => ({
      ...prev,
      selectedEmployees: employees.map(emp => emp.id)
    }));
  };

  // Clear all selections
  const clearSelections = () => {
    setPayrollRun(prev => ({
      ...prev,
      selectedEmployees: []
    }));
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
      case 'connected': return 'Connected to Sheets';
      case 'connecting': return 'Connecting...';
      case 'error': return 'Connection Error';
      default: return 'Disconnected';
    }
  };

  return (
   <div className="min-h-screen bg-shapee shadow-sm rounded-[14px] border border-white">
   
        {/* Header */}
    

          <div className=" mx-auto max-w-7xl">

              <div className="bg-gradient-to-br from-black  to-[green] backdrop-blur-lg
       shadow-sm border-b border-gray-500 rounded-[14px]">

           <div className=" px-4 sm:px-6 lg:px-8 flex justify-between items-center py-4">
          <div>
              <h1 className="text-2xl aeon-bold text-white flex flex-row ">
                <span><img src={salary} className="w-16 mr-3 rounded-[4px]" /></span>Salary and Payroll Management</h1>
              <p className="text-sm text-gray-400 tracking-wide inter mt-1">Manage employee salaries and process payroll payments</p>
            </div>
            <div className="flex flex-col items-left space-x-4">

                  <div className={`border border-green-800 mt-2 text-xs  text-green-400 px-2 py-1
               inter rounded-[8px]  flex items-center gap-2 text-[8px]  ${ 
                paystackLoaded 
                
                  ? ' text-green-200' 
                  : 'bg-green-100 text-green-800'
              }`}>
                {paystackLoaded ? 'Paystack Ready' : 'Loading Paystack...'} 
                
                
              </div>

              
              <div className="flex items-center space-x-2 mt-2">

                <div className={` border border-green-800 text-xs  text-green-400 px-2 py-1
               inter rounded-[8px] hover:bg-green-700 hover:!text-white flex items-center gap-2 text-[8px]
               transition-all  ${getConnectionStatusColor()} flex items-center gap-2`}>
                  <div className={`w-3 h-3 rounded-full ${
                    connectionStatus === 'connected' ? 'bg-green-500' :
                    connectionStatus === 'connecting' ? 'bg-green-300 animate-pulse' :
                    connectionStatus === 'error' ? 'bg-red-500' : 'bg-gray-500'
                  }`}></div>
                  {getConnectionStatusText()}
                </div>
                <button
                  onClick={testConnection}
                  className="border border-green-800 text-xs  text-green-400 px-2 py-1
               inter rounded-[8px] hover:bg-green-700 hover:!text-white flex items-center gap-2 text-[8px]
               transition-all"
                >
                  <img src={cloudd} className="w-4 h-4" />
                  Test Connection
                </button>
              </div>
          
            </div>
          </div>

          {/* Navigation Tabs - REDUCED TO 4 TABS */}
          <div className='flex justify-between '>
          <div className="flex space-x-8  px-8">
            {[
               { id: 'tracking', label: 'Payment Tracking', icon: Eye },
              { id: 'employees', label: 'Employees', icon: Users },
              { id: 'payroll', label: 'Run Payroll', icon: DollarSign },
              { id: 'history', label: 'Payroll History', icon: Calendar }, // COMBINED TAB
             
            ].map(tab => (
               

                  <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 aeon-bold text-sm ${
                    activeTab === tab.id
                      ? 'border-green-500 text-green-500'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>

            



            ))}
          </div>
          </div>
        </div>

        {/* Employees //////////////////////////////////////////////////////////////////////////////////////////////////////////////
        // ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////Tab */}
        
        {activeTab === 'employees' && (
        <div className="space-y-6 p-6 max-w-7xl mx-auto">
            {/* Add Employee Form */}
            <div className="bg-white p-6 mt-10 rounded-[14px] border border-green-200 
             ">
                 <h3 className="text-xl aeon-bold text-gray-800 mb-6 flex items-center">
                                <span className='bg-blue-50 rounded-[8px] w-7 h-7 mr-2'>
                                  <img src={add} className="p-1" />
                                </span> 
                Add New Employee
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                <div>
                 <label className="block text-sm intermid gray200 mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    value={employeeForm.firstName}
                    onChange={(e) => setEmployeeForm({...employeeForm, firstName: e.target.value})}
                      className="w-full outline-none inter gray200 px-4 py-3 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-50 focus:border-transparent transition-all disabled:opacity-50"
                    
                    placeholder="John"
                  />
                </div>

                <div>
                  <label className="block text-sm intermid gray200 mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={employeeForm.lastName}
                    onChange={(e) => setEmployeeForm({...employeeForm, lastName: e.target.value})}
                        className="w-full outline-none inter gray200 px-4 py-3 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-50 focus:border-transparent transition-all disabled:opacity-50"
                    
                    placeholder="Doe"
                  />
                </div>

                <div>
                 <label className="block text-sm intermid gray200 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={employeeForm.email}
                    onChange={(e) => setEmployeeForm({...employeeForm, email: e.target.value})}
                       className="w-full outline-none inter gray200 px-4 py-3 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-50 focus:border-transparent transition-all disabled:opacity-50"
                    
                    placeholder="john@company.com"
                  />
                </div>

                <div>
                  <label className="block text-sm intermid gray200 mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={employeeForm.phone}
                    onChange={(e) => setEmployeeForm({...employeeForm, phone: e.target.value})}
                      className="w-full outline-none inter gray200 px-4 py-3 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-50 focus:border-transparent transition-all disabled:opacity-50"
                    
                    placeholder="+2348012345678"
                  />
                </div>

                <div>
                  <label className="block text-sm intermid gray200 mb-2">
                    Department
                  </label>
                  <select
                    value={employeeForm.department}
                    onChange={(e) => setEmployeeForm({...employeeForm, department: e.target.value})}
                       className="w-full outline-none inter gray200 px-4 py-3 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-50 focus:border-transparent transition-all disabled:opacity-50"
                    
                  >
                    <option value="">Select Department</option>
                    {departments.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>

                <div>
                 <label className="block text-sm intermid gray200 mb-2">
                    Position
                  </label>
                  <input
                    type="text"
                    value={employeeForm.position}
                    onChange={(e) => setEmployeeForm({...employeeForm, position: e.target.value})}
                       className="w-full outline-none inter gray200 px-4 py-3 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-50 focus:border-transparent transition-all disabled:opacity-50"
                    
                    placeholder="Software Engineer"
                  />
                </div>

                <div>
                  <label className="block text-sm intermid gray200 mb-2">
                    Bank Name *
                  </label>
                  <select
                    value={employeeForm.bankName}
                    onChange={(e) => setEmployeeForm({...employeeForm, bankName: e.target.value})}
                       className="w-full outline-none inter gray200 px-4 py-3 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-50 focus:border-transparent transition-all disabled:opacity-50"
                    
                  >
                    <option value="">Select Bank</option>
                    {banks.map(bank => (
                      <option key={bank} value={bank}>{bank}</option>
                    ))}
                  </select>
                </div>

                <div>
                 <label className="block text-sm intermid gray200 mb-2">
                    Account Number *
                  </label>
                  <input
                    type="text"
                    value={employeeForm.accountNumber}
                    onChange={(e) => setEmployeeForm({...employeeForm, accountNumber: e.target.value})}
                   
                      className="w-full outline-none inter gray200 px-4 py-3 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-50 focus:border-transparent transition-all disabled:opacity-50"
                  
                    placeholder="1234567890"
                  />
                </div>

                <div>
                <label className="block text-sm intermid gray200 mb-2">
                    Account Name
                  </label>
                  <input
                    type="text"
                    value={employeeForm.accountName}
                    onChange={(e) => setEmployeeForm({...employeeForm, accountName: e.target.value})}
                      className="w-full outline-none inter gray200 px-4 py-3 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-50 focus:border-transparent transition-all disabled:opacity-50"
                    
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label className="block text-sm intermid gray200 mb-2">
                    Basic Salary (₦)
                  </label>
                  <input
                    type="number"
                    value={employeeForm.basicSalary}
                    onChange={(e) => setEmployeeForm({...employeeForm, basicSalary: e.target.value})}
                      className="w-full outline-none inter gray200 px-4 py-3 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-50 focus:border-transparent transition-all disabled:opacity-50"
                  
                    placeholder="500000"
                  />
                </div>

                <div>
                 <label className="block text-sm intermid gray200 mb-2">
                    Allowances (₦)
                  </label>
                  <input
                    type="number"
                    value={employeeForm.allowances}
                    onChange={(e) => setEmployeeForm({...employeeForm, allowances: e.target.value})}
                       className="w-full outline-none inter gray200 px-4 py-3 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-50 focus:border-transparent transition-all disabled:opacity-50"
                  
                    placeholder="50000"
                  />
                </div>

                <div>
                  <label className="block text-sm intermid gray200 mb-2">
                    Deductions (₦)
                  </label>
                  <input
                    type="number"
                    value={employeeForm.deductions}
                    onChange={(e) => setEmployeeForm({...employeeForm, deductions: e.target.value})}
                        className="w-full outline-none inter gray200 px-4 py-3 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-50 focus:border-transparent transition-all disabled:opacity-50"
                  
                    placeholder="10000"
                  />
                </div>
              </div>

              <button
                onClick={addEmployee}
                disabled={isLoading}
                        className="bg-green-600 text-white px-4 py-3 rounded-[14px] hover:bg-gradient-to-r from-green-600 to-blue-600 intermid w-full inter md:col-span-2 lg:col-span-5 transform
                   hover:scale-102 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:opacity-50 disabled:cursor-not-allowed"
                >
                {isLoading ? 'Adding Employee...' : 'Add Employee'}
              </button>
            </div>

            {/* Employees List */}
            <div className="bg-white rounded-[14px]   border border-gray-200">
              <div className="p-6 ">
                    <h2 className="text-xl aeon-bold gray200">Employee List</h2>
                <p className="text-gray-600 text-sm inter mt-1">Manage your employees and their salary information</p>
              </div>

              {employees.length === 0 ? (
                <div className="text-center py-12">
                   <div className='bg-blue-50 border border-blue-100 w-16  h-16 mx-auto rounded-full'>
                                                                    <img src={user} className="opacity-50 p-2 mx-auto mb-4" />
                                                                     </div>
                  <h3 className="inter text-gray-500 mb-2">No employees added</h3>
                  <p className="text-gray-600 text-sm inter">Add your first employee to get started with payroll</p>
                </div>
              ) : (
                       <div className="overflow-x-auto bg-white rounded-b-2xl  border border-gray-50">
                      <table className="w-[67vw] mx-auto border-collapse">
                   <thead className=" bg-blue-50  ">
                      <tr>
                       <th className="px-6 py-3 text-left text-xs inter gray200 uppercase tracking-wider ">
                          Employee
                        </th>
                      <th className="px-6 py-3 text-left text-xs inter gray200 uppercase tracking-wider ">
                          Department
                        </th>
                        <th className="px-6 py-3 text-left text-xs inter gray200 uppercase tracking-wider ">
                          Bank Details
                        </th>
                         <th className="px-6 py-3 text-left text-xs inter gray200 uppercase tracking-wider ">
                          Salary
                        </th>
                        <th className="px-6 py-3 text-left text-xs inter gray200 uppercase tracking-wider ">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-green-100 rounded-[14px]">
                      {employees.map(employee => (
                        <tr key={employee.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-xs intermid text-blue-500 uppercase tracking-wide">
                                {employee.firstName} {employee.lastName}
                              </div>
                              <div className="text-xs flex flex-row intermid text-gray-600 items-center tracking-wide">
                            
                                {employee.email}
                              </div>
                              {employee.phone && (
                                <div className="text-xs text-gray-500 flex inter items-center">
                               +
                                  {employee.phone}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm intermid gray200">{employee.department}</div>
                            <div className="text-sm inter text-gray-500">{employee.position}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm intermid text-blue-500">{employee.bankName}</div>
                            <div className="text-sm inter gray200 tracking-wide">{employee.accountNumber}</div>
                            {employee.accountName && (
                              <div className="text-sm  inter text-gray-500">{employee.accountName}</div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm intermid tracking-wider text-gray-900">
                              ₦{calculateNetSalary(employee).toLocaleString()}
                            </div>
                            <div className="text-sm text-gray-500 inter">
                              Basic: ₦{(employee.basicSalary || 0).toLocaleString()}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap inter">
                            <span className="inline-flex px-2 py-1 text-xs  rounded-full bg-green-100 text-green-900">
                              Active
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Run Payroll Tab */}
       {activeTab === 'payroll' && (
  <div className="space-y-6 p-8">
    <h2 className="text-xl aeon-bold gray200 mt-8">Run Payroll</h2>
    {/* Payroll Run Configuration */}
    <div className="bg-white rounded-[14px] border mt-5 border-blue-200 p-6">
          
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 mt-4">
                <div>
                 <label className=" py-3 text-left text-sm aeon-bold gray200  mb-2 tracking-wider ">
                    Payroll Name *
                  </label>
                  <input
                    type="text"
                    value={payrollRun.name}
                    onChange={(e) => setPayrollRun({...payrollRun, name: e.target.value})}
                      className="w-full outline-none inter gray200 px-4 py-2 border border-green-300 
                   rounded-lg focus:ring-1 focus:ring-blue-50 focus:border-transparent transition-all disabled:opacity-50"
                    placeholder="January 2024 Salary"
                  />
                </div>

                <div>
                   <label className=" py-3 text-left text-sm aeon-bold gray200  mb-2 tracking-wider ">
                    Pay Period *
                  </label>
                  <input
                    type="text"
                    value={payrollRun.period}
                    onChange={(e) => setPayrollRun({...payrollRun, period: e.target.value})}
                   className="w-full outline-none inter gray200 px-4 py-2 border border-green-300 
                   rounded-lg focus:ring-1 focus:ring-blue-50 focus:border-transparent transition-all disabled:opacity-50" 
                    placeholder="January 2024"
                  />
                </div>

                <div>
                   <label className=" py-3 text-left text-sm aeon-bold gray200  mb-2 tracking-wider ">
                    Payment Date *
                  </label>
                  <input
                    type="date"
                    value={payrollRun.paymentDate}
                    onChange={(e) => setPayrollRun({...payrollRun, paymentDate: e.target.value})}
                     className="w-full outline-none inter gray200 px-4 py-2 border border-green-300 
                   rounded-lg focus:ring-1 focus:ring-blue-50 focus:border-transparent transition-all disabled:opacity-50"
                  />
                </div>
              </div>

             {/* Employee Selection */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg aeon-bold gray200">Select Employees</h3>
          <div className="flex space-x-2">
            <button
              onClick={selectAllEmployees}
              className="px-2 py-1 aeon-bold rounded-full border border-indigo-100 text-xs bg-indigo-50 text-indigo-400 hover:text-blue-600">
              Select All
            </button>
            <button
              onClick={clearSelections}
              className="text-xs text-gray-400 hover:text-red-600 aeon-bold"
            >
              Clear All
            </button>
          </div>
        </div>


                {employees.length === 0 ? (
                  <div className="text-center py-8 border-2 border-dashed border-blue-200 rounded-[14px]">
                      <div className='bg-blue-50 border border-blue-100 w-16  h-16 mx-auto rounded-full'>
                                                                    <img src={user} className="opacity-50 p-2 mx-auto mb-4" />
                                                                     </div>
                    <p className="text-gray-600 inter">No employees added yet</p>
                    <button
                      onClick={() => setActiveTab('employees')}
                      className="text-blue-600 inter text-xs border border-blue-200 py-2 px-2 rounded-[14px]
                       text-sm hover:bg-blue-700 hover:!text-white inter mt-2"
                    >
                      Add employees first
                    </button>
                  </div>
                ) : (
                  <>
                  
                    
           {/* Updated grid to show 3 columns for 3 employees per row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
              {paginatedEmployees.map(employee => (
                <div
                  key={employee.id}
                  className={`relative border rounded-[14px] px-4 py-3 cursor-pointer transition-all duration-200 ${
                    payrollRun.selectedEmployees.includes(employee.id)
                      ? 'border-blue-200 shadow-md'
                      : 'border-gray-200 hover:bg-indigo-100'
                  }`}
                  onClick={() => toggleEmployeeSelection(employee.id)}
                >
                  {/* Selection Icon */}
                  {payrollRun.selectedEmployees.includes(employee.id) && (
                    <div className="absolute top-2 right-2 border border-blue-200 bg-blue-500 text-white rounded-full w-5 h-5">
                      <img src={check} alt="" className='p-1'/>
                    </div>
                  )}

                  {/* Verification Status */}
                  <div className="absolute top-2 left-2">
                    {verificationStatus[employee.id] === 'matched' && (
                      <div className="bg-white border border-green-600 text-white rounded-full w-5 h-5 flex items-center justify-center">
                        <img src={tick} alt="Verified" className="p-1" />
                      </div>
                    )}
                    {verificationStatus[employee.id] === 'mismatch' && (
                      <div className="bg-yellow-500 text-white rounded-full w-5 h-5 flex items-center justify-center">
                        <span className="text-xs">!</span>
                      </div>
                    )}
                    {verificationStatus[employee.id] === 'error' && (
                      <div className=" text-gray-400 rounded-full w-4 h-4 mx-1  flex items-center justify-center">
                        <XCircle size='20' />
                      </div>
                    )}
                  </div>

         <div className="flex items-center justify-between py-1">
                    <div>
                      <h4 className="intermid gray200 py-1 mt-1">
                        {employee.firstName} {employee.lastName}
                      </h4>
                      <p className="text-sm inter text-gray-600">{employee.department}</p>
                      <p className="text-sm inter text-gray-600">{employee.email}</p>
                 
                  
                   
                      <div className="text-sm inter py-1 gray200">
                        {employee.bankName}
                      </div>

                   <div className="intermid gray200 text-sm">
                        ₦{calculateNetSalary(employee).toLocaleString()}
                      </div>

                      {/* Verify Account Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          verifyAccountOnly(employee);
                        }}
                        className="mt-2 text-xs text-blue-600 hover:bg-blue-600 hover:!text-white outline-none aeon-bold border border-indigo-200 px-2 py-1 
                        rounded-[12px]"
                      >
                        Verify Account
                      </button>
                      </div>
                  </div>
                </div>
              ))}
            </div>   
            
                 
 {/* Employee Selection Pagination */}
            {employees.length > employeeSelectItemsPerPage && (
              <div className="flex justify-between items-center mt-4 px-4 py-3 bg-gray-50 rounded-[14px]">
                <div className="text-sm inter text-gray-700">
                  Showing {((employeeSelectCurrentPage - 1) * employeeSelectItemsPerPage) + 1} to {Math.min(employeeSelectCurrentPage * employeeSelectItemsPerPage, employees.length)} of {employees.length} employees
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setEmployeeSelectCurrentPage(1)}
                    disabled={employeeSelectCurrentPage === 1}
                    className="px-3 py-1 border border-gray-300 rounded-lg inter text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                  >
                    First
                  </button>
                  <button
                    onClick={() => setEmployeeSelectCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={employeeSelectCurrentPage === 1}
                    className="px-3 py-1 border border-gray-300 rounded-lg text-sm inter disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                  >
                    Previous
                  </button>
                          
                            <div className="flex space-x-1">
                    {Array.from({ length: Math.min(5, employeeSelectTotalPages) }, (_, i) => {
                      let pageNum;
                      if (employeeSelectTotalPages <= 5) {
                        pageNum = i + 1;
                      } else if (employeeSelectCurrentPage <= 3) {
                        pageNum = i + 1;
                      } else if (employeeSelectCurrentPage >= employeeSelectTotalPages - 2) {
                        pageNum = employeeSelectTotalPages - 4 + i;
                      } else {
                        pageNum = employeeSelectCurrentPage - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setEmployeeSelectCurrentPage(pageNum)}
                          className={`w-8 h-8 rounded-lg text-sm inter ${
                            employeeSelectCurrentPage === pageNum
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
                    onClick={() => setEmployeeSelectCurrentPage(prev => Math.min(prev + 1, employeeSelectTotalPages))}
                    disabled={employeeSelectCurrentPage === employeeSelectTotalPages}
                    className="px-3 py-1 border border-gray-300 rounded-lg text-sm inter disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                  >
                    Next
                  </button>
                  <button
                    onClick={() => setEmployeeSelectCurrentPage(employeeSelectTotalPages)}
                    disabled={employeeSelectCurrentPage === employeeSelectTotalPages}
                    className="px-3 py-1 border border-gray-300 rounded-lg text-sm inter disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                  >
                    Last
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
      
              {/* Payroll Summary */}
              {payrollRun.selectedEmployees.length > 0 && (
                <div className="border border-green-200 shadow-xs rounded-[14px] p-4 mb-6">
                  <h3 className="text-xl aeon-bold text-gray-900 mb-3">Payroll Summary</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <div className="text-sm inter text-gray-600">Total Employees</div>
                      <div className="text-xl aeon-bold text-gray-900">
                        {payrollRun.selectedEmployees.length}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600 inter">Total Amount</div>
                      <div className="text-xl aeon-bold text-green-600">
                        ₦{payrollRun.selectedEmployees.reduce((total, empId) => {
                          const employee = employees.find(e => e.id === empId);
                          return total + calculateNetSalary(employee);
                        }, 0).toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600 inter">Payment Date</div>
                      <div className="text-lg aeon-bold text-gray-900">
                        {payrollRun.paymentDate || 'Not set'}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={processPayroll}
                disabled={isLoading || payrollRun.selectedEmployees.length === 0 || !payrollRun.name || !payrollRun.period || !payrollRun.paymentDate}
         

                 className="bg-green-600 text-white px-4 py-3 rounded-[14px] hover:bg-gradient-to-r from-green-600 to-blue-600  
                  text-md w-full intermid md:col-span-2
             lg:col-span-5 transform hover:scale-102 transition-all disabled:opacity-50 disabled:cursor-not-allowed" >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Processing Payroll...
                  </>
                ) : (
                  `Process Payroll (${payrollRun.selectedEmployees.length} employees)`
                )}
              </button>
            </div>
          </div>
        )}

  {/* COMBINED: Payroll History Tab (History + Reports) */}
{activeTab === 'history' && (
  <div className="space-y-6 p-6">
    <div className="flex justify-between items-center">
      <h2 className="text-xl aeon-bold gray200">Payroll History</h2>
      
      {/* PAGINATION CONTROLS - Items per page selector */}
      {payrollRuns.length > 0 && (
        <div className="flex items-center space-x-4">
          <div className="bg-white border border-gray-300 rounded-[14px] px-3 py-2">
            <p className="text-gray-500 text-sm inter">
              Page {currentPage} of {totalPages} • {payrollRuns.length} total entries
            </p>
          </div>
          <select
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="border border-gray-300 text-gray-600 inter rounded-[14px] px-2 py-2 text-sm inter outline-none bg-white"
          >
            <option value={10}>10 per page</option>
            <option value={20}>20 per page</option>
            <option value={50}>50 per page</option>
            <option value={100}>100 per page</option>
          </select>
        </div>
      )}
    </div>

    {/* Total Payroll Spending Summary */}
    <div className="bg-gradient-to-r from-blue-800 to-purple-800  rounded-[14px] p-4 text-white">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg aeon-bold mb-2">Total Payroll Spending</h3>
          <p className="text-green-100 text-sm inter">
            Overview of all payroll expenditures across all time periods
          </p>
        </div>
       
        <div className="text-right">
          <div className="text-3xl aeon-bold">
            ₦{totalPayrollSpending.toLocaleString()}
          </div>
          <div className="text-blue-200 text-sm inter tracking-widest "> 
            <span className='text-md text-indigo-50 tracking-widest mr-2 aeon-bold '>
            {payrollRuns.length} 
          </span>
            payroll runs processed
          </div>
        </div>
      </div>
    </div>
  
    {/* Status Filter Dropdown */}
    <div className="bg-white rounded-[14px] border border-gray-200 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <label className="text-sm intermid gray200">Filter by Status:</label>
          <select 
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="border border-gray-300 rounded-[14px] gray200 px-3 py-2 text-sm inter outline-none"
          >
            <option value="all">All Payments</option>
            <option value="processing">Processing Payments</option>
            <option value="completed">Completed Payments</option>
            <option value="partial">Partial Payments</option>
          </select>
        </div>
        
        {/* Filtered Spending Summary */}
        {statusFilter !== 'all' && (
          <div className="text-right">
            
            <div className="text-sm inter text-gray-600">Filtered Total:</div>
            <div className="text-lg aeon-bold text-green-600">
              ₦{filteredPayrollSpending.toLocaleString()}
            </div>
          </div>
        )}
      </div>
    </div>
{/* <h3 className="text-lg aeon-bold gray200 mb-4">Payroll Runs</h3> */}
        
    <div className="bg-white rounded-[14px] border border-gray-200">
      <div className="p-6">
       
        {payrollRuns.length === 0 ? (
          <div className="text-center py-12">
            <div className='bg-blue-50 border border-blue-100 w-16 h-16 mx-auto rounded-full'>
              <img src={text} className="opacity-50 p-2 mx-auto mb-4" />
            </div>
            <h3 className="inter text-gray-500 mb-2">No payroll runs yet</h3>
            <p className="text-gray-600 text-sm inter">Run your first payroll to see history here</p>
          </div>
        ) : (
          <div className="overflow-x-auto ">
            <table className="w-full border-collapse">
              <thead className="bg-indigo-50 rounded-[14px]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs inter gray200 uppercase tracking-wider">
                    Payroll Run
                  </th>
                  <th className="px-6 py-3 text-left text-xs inter gray200 uppercase tracking-wider">
                    Employees
                  </th>
                  <th className="px-6 py-3 text-left text-xs inter gray200 uppercase tracking-wider">
                    Total Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs inter gray200 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs inter gray200 uppercase tracking-wider">
                    Date
                  </th>
                  {/* <th className="px-6 py-3 text-left text-xs inter gray200 uppercase tracking-wider">
                    Period
                  </th> */}
                  <th className="px-6 py-3 text-left text-xs inter gray200 uppercase tracking-wider">
                    View Employees
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedPayrollRuns.map(run => {
                  const employeeNames = getEmployeeNamesForRun(run);
                  return (
                    <tr key={run.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm inter text-gray-900">{run.name}</div>
                        <td className=" py-2 whitespace-nowrap">
                        <div className="text-xs font-mono text-gray-500">{run.period}</div>
                      </td>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm inter text-gray-900">{run.selectedEmployees.length} employees</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm inter text-green-600">
                          ₦{run.totalAmount?.toLocaleString() || '0'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs inter rounded-full ${
                          run.status === 'completed' 
                            ? 'bg-green-100 text-green-600'
                            : run.status === 'processing'
                            ? 'bg-orange-100 text-orange-900'
                            : 'bg-blue-100 text-blue-900'
                        }`}>
                          {run.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(run.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                   
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => {
                            console.log('View Employees clicked for:', run.id);
                            setSelectedPayrollRun(run);
                          }}
                          className="text-indigo-600 hover:text-blue-800 text-sm aeon-bold bg-indigo-50 hover:bg-indigo-100 px-3 py-1 
                          rounded-[14px] transition-colors border border-blue-200 tracking-widest"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* PAGINATION CONTROLS */}
            {payrollRuns.length > 0 && (
              <div className="flex items-center justify-between mt-4 px-6 py-3 bg-gray-50 border-t border-gray-200">
                <div className="flex items-center space-x-4 inter">
                  <span className="text-sm inter text-gray-700">
                    Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, payrollRuns.length)} of {payrollRuns.length} entries
                  </span>
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
        )}
      </div>
    </div>

    {/* Employee List Modal with Pagination */}
    {selectedPayrollRun && (
      <EmployeeModal 
        payrollRun={selectedPayrollRun}
        employees={employees}
        onClose={() => setSelectedPayrollRun(null)}
      />
    )}
  </div>
)}

        {/* Payment Tracking Tab/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
        // /////////////////////////////////////////////////////////////////////////////////////////////////////// */}
      {activeTab === 'tracking' && (
  <div className="space-y-6 p-5">

            <div className="flex justify-between items-center">
              <h2 className="text-xl aeon-bold gray200">Payment Tracking</h2>
              <p className="text-gray-600 text-sm inter">Track payments made to specific employees over time</p>
            </div>

            {/* Total Payroll Spending Summary */}
            <div className="bg-gradient-to-r from-blue-800 to-purple-800 rounded-[14px] p-4 text-white">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg aeon-bold mb-2">Total Organizational Spending</h3>
                  <p className="text-blue-100 text-sm inter">
                    Combined payroll expenditure across all employees and time periods
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-3xl aeon-bold">
                    ₦{totalPayrollSpending.toLocaleString()}
                  </div>
                  <div className="text-blue-200 text-sm inter">
                     <span className="text-md text-indigo-50 tracking-widest aeon-bold"> {payrollRuns.length} </span>
                   payroll runs •  <span className="text-md text-indigo-50 tracking-widest aeon-bold">{employees.length} </span>employees
                  </div>
                </div>
              </div>
            </div>

            {/* Search and Filter Section */}
            <div className="bg-white rounded-[14px] border border-gray-200 p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Search Bar */}
                <div>
                  <label className="block text-sm aeon-bold gray200 mb-2">
                    Search Employees
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      value={paymentTracking.searchTerm}
                      onChange={(e) => setPaymentTracking(prev => ({
                        ...prev,
                        searchTerm: e.target.value
                      }))}
                      className="w-full outline-none inter gray200 pl-10 text-sm pr-4 py-3 border border-gray-300 rounded-[14px] focus:ring-1 focus:ring-blue-50 focus:border-transparent transition-all"
                      placeholder="Search by name, email, or department..."
                    />
                  </div>
                </div>

                {/* Time Frame Selector */}
                <div>
                  <label className="block text-sm aeon-bold gray200 mb-2">
                    Time Frame
                  </label>
                  <select
                    value={paymentTracking.timeFrame}
                    onChange={(e) => handleTimeFrameChange(e.target.value)}
                    className="w-full outline-none inter gray200 px-4 py-3  border border-gray-300 rounded-[14px] text-sm focus:ring-1 focus:ring-blue-50 focus:border-transparent transition-all"
                  >
                    <option value="week">Last Week</option>
                    <option value="month">Last Month</option>
                    <option value="year">Last Year</option>
                  </select>
                </div>
              </div>

              {/* Employee List */}
            <div className="mb-6">
      <h3 className="text-lg aeon-bold gray200 mb-4">Select Employee</h3>
                
                {filteredEmployees.length === 0 ? (
                  <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-[14px]">
                    <div className='bg-blue-50 border border-blue-100 w-16 h-16 mx-auto rounded-full'>
                      <img src={user} className="opacity-50 p-2 mx-auto mb-4" />
                    </div>
                    <p className="text-gray-600 inter">
                      {paymentTracking.searchTerm ? 'No employees found' : 'No employees available'}
                    </p>
                  </div>
                ) : (
                  <>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
            {paginatedFilteredEmployees.map(employee => (
              <div
                key={employee.id}
                className={`border rounded-[14px] p-4 cursor-pointer transition-all duration-200 ${
                  paymentTracking.selectedEmployee?.id === employee.id
                    ? 'border-blue-300 '
                    : 'border-gray-200 hover:bg-indigo-100'
                }`}
                onClick={() => handleEmployeeSelect(employee)}
              >
                <div className="flex flex-row justify-between items-start mb-2">
                  <h4 className="intermid text-gray-900">
                    {employee.firstName} {employee.lastName}
                  </h4>
                  {paymentTracking.selectedEmployee?.id === employee.id && (
                    <div className="bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center">
                      <img src={check} alt="Selected" className="w-3 h-3" />
                    </div>
                  )}
                </div>
                <div className="text-sm inter text-gray-600 mb-1">{employee.email}</div>
                <div className="text-sm inter text-gray-600 mb-1">{employee.department}</div>
                <div className="text-sm intermid text-green-600">
                  Salary: ₦{calculateNetSalary(employee).toLocaleString()}
                </div>
              </div>
            ))}
          </div>

                    {/* Employee Selection Pagination for Payment Tracking */}
                    {filteredEmployees.length > employeeSelectItemsPerPage && (
                      <div className="flex justify-between items-center mt-4 px-4 py-3 bg-gray-50 rounded-[14px]">
                        <div className="text-sm inter text-gray-700">
                          Showing {((employeeSelectCurrentPage - 1) * employeeSelectItemsPerPage) + 1} to {Math.min(employeeSelectCurrentPage * employeeSelectItemsPerPage, filteredEmployees.length)} of {filteredEmployees.length} employees
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => setEmployeeSelectCurrentPage(1)}
                            disabled={employeeSelectCurrentPage === 1}
                            className="px-3 py-1 border border-gray-300 rounded-lg inter text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                          >
                            First
                          </button>
                          <button
                            onClick={() => setEmployeeSelectCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={employeeSelectCurrentPage === 1}
                            className="px-3 py-1 border border-gray-300 rounded-lg text-sm inter disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                          >
                            Previous
                          </button>
                          
                          <div className="flex space-x-1">
                            {Array.from({ length: Math.min(5, filteredEmployeeSelectTotalPages) }, (_, i) => {
                              let pageNum;
                              if (filteredEmployeeSelectTotalPages <= 5) {
                                pageNum = i + 1;
                              } else if (employeeSelectCurrentPage <= 3) {
                                pageNum = i + 1;
                              } else if (employeeSelectCurrentPage >= filteredEmployeeSelectTotalPages - 2) {
                                pageNum = filteredEmployeeSelectTotalPages - 4 + i;
                              } else {
                                pageNum = employeeSelectCurrentPage - 2 + i;
                              }
                              
                              return (
                                <button
                                  key={pageNum}
                                  onClick={() => setEmployeeSelectCurrentPage(pageNum)}
                                  className={`w-8 h-8 rounded-lg text-sm inter ${
                                    employeeSelectCurrentPage === pageNum
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
                            onClick={() => setEmployeeSelectCurrentPage(prev => Math.min(prev + 1, filteredEmployeeSelectTotalPages))}
                            disabled={employeeSelectCurrentPage === filteredEmployeeSelectTotalPages}
                            className="px-3 py-1 border border-gray-300 rounded-lg text-sm inter disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                          >
                            Next
                          </button>
                          <button
                            onClick={() => setEmployeeSelectCurrentPage(filteredEmployeeSelectTotalPages)}
                            disabled={employeeSelectCurrentPage === filteredEmployeeSelectTotalPages}
                            className="px-3 py-1 border border-gray-300 rounded-lg text-sm inter disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                          >
                            Last
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Payment Summary Section */}
            {paymentTracking.selectedEmployee && paymentTracking.paymentSummary && (
              <div className="bg-white rounded-[14px] border border-gray-200 p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg aeon-bold gray200">
                    Payment Summary for {paymentTracking.selectedEmployee.firstName} {paymentTracking.selectedEmployee.lastName}
                  </h3>
                  <div className="text-sm inter text-gray-600">
                    {paymentTracking.timeFrame === 'week' ? 'Last 7 days' : 
                     paymentTracking.timeFrame === 'month' ? 'Last 30 days' : 'Last 365 days'}
                  </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="bg-cloud border border-blue-200 rounded-[14px] p-4 text-center">
                    <div className="text-sm inter text-blue-100 mb-1">Total Payments</div>
                    <div className="text-2xl aeon-bold text-blue-50">
                      {paymentTracking.paymentSummary.numberOfPayments}
                    </div>
                  </div>
                  <div className="bg-green-500 border border-green-200 rounded-[14px] p-4 text-center">
                    <div className="text-sm inter text-green-100 mb-1">Total Amount Paid</div>
                    <div className="text-2xl aeon-bold text-green-50">
                      ₦{paymentTracking.paymentSummary.totalAmount.toLocaleString()}
                    </div>
                  </div>
                  <div className="bg-purple-600 border border-purple-200 rounded-[14px] p-4 text-center">
                    <div className="text-sm inter text-purple-100 mb-1">Average Payment</div>
                    <div className="text-2xl aeon-bold text-purple-50">
                      ₦{paymentTracking.paymentSummary.numberOfPayments > 0 
                        ? (paymentTracking.paymentSummary.totalAmount / paymentTracking.paymentSummary.numberOfPayments).toLocaleString(undefined, { maximumFractionDigits: 2 })
                        : '0'}
                    </div>
                  </div>
                </div>

                {/* Payment History Table */}
                {paymentTracking.paymentSummary.runs.length > 0 && (
                  <div>
                    <h4 className="text-md aeon-bold gray200 mb-4">Payment History</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs inter gray200 uppercase tracking-wider">
                              Payroll Run
                            </th>
                            <th className="px-4 py-3 text-left text-xs inter gray200 uppercase tracking-wider">
                              Period
                            </th>
                            <th className="px-4 py-3 text-left text-xs inter gray200 uppercase tracking-wider">
                              Amount
                            </th>
                            <th className="px-4 py-3 text-left text-xs inter gray200 uppercase tracking-wider">
                              Payment Date
                            </th>
                            <th className="px-4 py-3 text-left text-xs inter gray200 uppercase tracking-wider">
                              Status
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {paymentTracking.paymentSummary.runs.map(run => (
                            <tr key={run.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 whitespace-nowrap">
                                <div className="text-sm inter text-gray-900">{run.name}</div>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <div className="text-sm inter text-gray-600">{run.period}</div>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <div className="text-sm intermid text-green-600">
                                  ₦{calculateNetSalary(paymentTracking.selectedEmployee).toLocaleString()}
                                </div>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <div className="text-sm inter text-gray-500">
                                  {new Date(run.createdAt).toLocaleDateString()}
                                </div>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <span className="inline-flex px-2 py-1 text-xs inter rounded-full bg-green-100 text-green-600">
                                  Completed
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {paymentTracking.paymentSummary.runs.length === 0 && (
                  <div className="text-center py-8">
                    <div className='bg-gray-50 border border-gray-100 w-16 h-16 mx-auto rounded-full'>
                      <img src={text} className="opacity-50 p-2 mx-auto mb-4" />
                    </div>
                    <p className="text-gray-600 inter">No payments found for the selected time frame</p>
                  </div>
                )}
              </div>
            )}

            {paymentTracking.selectedEmployee && !paymentTracking.paymentSummary && (
              <div className="bg-white rounded-[14px] border border-gray-200 p-6 text-center">
                <div className='bg-gray-50 border border-gray-100 w-16 h-16 mx-auto rounded-full'>
                  <img src={text} className="opacity-50 p-2 mx-auto mb-4" />
                </div>
                <p className="text-gray-600 inter">Loading payment summary...</p>
              </div>
            )}

            {!paymentTracking.selectedEmployee && (
              <div className="bg-white rounded-[14px] border border-gray-200 p-6 text-center">
                <div className='bg-blue-50 border border-blue-100 w-16 h-16 mx-auto rounded-full'>
                  <img src={user} className="opacity-50 p-2 mx-auto mb-4" />
                </div>
                <p className="text-gray-600 inter">Select an employee to view their payment history</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PayrollManagementSystem;