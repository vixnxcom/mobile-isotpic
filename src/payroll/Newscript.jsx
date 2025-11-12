// Payroll Management System - Google Apps Script
// Complete version with Paystack integration

// Paystack Configuration - REPLACE WITH YOUR ACTUAL KEY
const PAYSTACK_SECRET_KEY = 'sk_test_a6a235770b160edbbe133b9613b32bc2739b0326';

function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  const action = e.parameter.action;
  
  try {
    let result;
    
    switch(action) {
      case 'test':
        result = { success: true, message: 'Google Sheets connection successful' };
        break;
        
      case 'addEmployee':
        result = addEmployee(e.parameter.data);
        break;
        
      case 'getEmployees':
        result = getEmployees();
        break;
        
      case 'addPayrollRun':
        result = addPayrollRun(e.parameter.data);
        break;
        
      case 'getPayrollRuns':
        result = getPayrollRuns();
        break;
        
      case 'addPaymentRecord':
        result = addPaymentRecord(e.parameter.data);
        break;
        
      // Paystack Integration Actions
      case 'resolveAccount':
        result = resolveAccount(e.parameter.bankName, e.parameter.accountNumber);
        break;
        
      case 'createRecipient':
        result = createRecipient(e.parameter.name, e.parameter.bankName, e.parameter.accountNumber);
        break;
        
      case 'initiateTransfer':
        result = initiateTransfer(e.parameter.recipientCode, e.parameter.amount, e.parameter.reason);
        break;
        
      case 'verifyTransfer':
        result = verifyTransfer(e.parameter.transferCode);
        break;
        
      case 'getBanks':
        result = getBanks();
        break;
        
      case 'checkBalance':
        result = checkBalance();
        break;
        
      case 'clearAllData':
        result = clearAllData();
        break;
        
      case 'getSpreadsheetInfo':
        result = getSpreadsheetInfo();
        break;
        
      default:
        result = { success: false, error: 'Unknown action: ' + action };
    }
    
    return createJSONResponse(result);
    
  } catch (error) {
    const errorResult = {
      success: false,
      error: error.message,
      stack: error.stack
    };
    return createJSONResponse(errorResult);
  }
}

// Proper CORS-enabled response function for Google Apps Script
function createJSONResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// =============================================
// PAYSTACK INTEGRATION FUNCTIONS
// =============================================

function resolveAccount(bankName, accountNumber) {
  try {
    if (!bankName || !accountNumber) {
      throw new Error('Bank name and account number are required');
    }
    
    const bankCode = getBankCode(bankName);
    if (!bankCode) {
      throw new Error(`Bank not supported: ${bankName}`);
    }
    
    const options = {
      'method': 'GET',
      'headers': {
        'Authorization': 'Bearer ' + PAYSTACK_SECRET_KEY
      },
      'muteHttpExceptions': true
    };
    
    const url = `https://api.paystack.co/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`;
    const response = UrlFetchApp.fetch(url, options);
    const result = JSON.parse(response.getContentText());
    
    if (result.status) {
      return {
        success: true,
        data: {
          account_name: result.data.account_name,
          account_number: result.data.account_number,
          bank_code: bankCode,
          bank_name: bankName
        }
      };
    } else {
      throw new Error(result.message || 'Failed to resolve account');
    }
  } catch (error) {
    return {
      success: false,
      error: 'Account resolution failed: ' + error.message
    };
  }
}

function createRecipient(name, bankName, accountNumber) {
  try {
    if (!name || !bankName || !accountNumber) {
      throw new Error('Name, bank name, and account number are required');
    }
    
    const bankCode = getBankCode(bankName);
    if (!bankCode) {
      throw new Error(`Bank not supported: ${bankName}`);
    }
    
    const payload = {
      'type': 'nuban',
      'name': name,
      'account_number': accountNumber,
      'bank_code': bankCode,
      'currency': 'NGN'
    };
    
    const options = {
      'method': 'POST',
      'headers': {
        'Authorization': 'Bearer ' + PAYSTACK_SECRET_KEY,
        'Content-Type': 'application/json'
      },
      'payload': JSON.stringify(payload),
      'muteHttpExceptions': true
    };
    
    const response = UrlFetchApp.fetch('https://api.paystack.co/transferrecipient', options);
    const result = JSON.parse(response.getContentText());
    
    if (result.status) {
      return {
        success: true,
        data: {
          recipient_code: result.data.recipient_code,
          recipient_id: result.data.id,
          name: result.data.name,
          account_number: result.data.details.account_number,
          bank_name: result.data.details.bank_name,
          details: result.data
        }
      };
    } else {
      throw new Error(result.message || 'Failed to create recipient');
    }
  } catch (error) {
    return {
      success: false,
      error: 'Recipient creation failed: ' + error.message
    };
  }
}

function initiateTransfer(recipientCode, amount, reason) {
  try {
    if (!recipientCode || !amount) {
      throw new Error('Recipient code and amount are required');
    }
    
    // Convert amount to kobo (Paystack requires amount in kobo)
    const amountKobo = Math.round(parseFloat(amount) * 100);
    
    const payload = {
      'source': 'balance',
      'amount': amountKobo,
      'recipient': recipientCode,
      'reason': reason || 'Salary Payment'
    };
    
    const options = {
      'method': 'POST',
      'headers': {
        'Authorization': 'Bearer ' + PAYSTACK_SECRET_KEY,
        'Content-Type': 'application/json'
      },
      'payload': JSON.stringify(payload),
      'muteHttpExceptions': true
    };
    
    const response = UrlFetchApp.fetch('https://api.paystack.co/transfer', options);
    const result = JSON.parse(response.getContentText());
    
    if (result.status) {
      return {
        success: true,
        data: {
          transfer_code: result.data.transfer_code,
          reference: result.data.reference,
          status: result.data.status,
          amount: amountKobo / 100, // Convert back to Naira
          recipient: result.data.recipient,
          details: result.data
        }
      };
    } else {
      throw new Error(result.message || 'Failed to initiate transfer');
    }
  } catch (error) {
    return {
      success: false,
      error: 'Transfer initiation failed: ' + error.message
    };
  }
}

function verifyTransfer(transferCode) {
  try {
    if (!transferCode) {
      throw new Error('Transfer code is required');
    }
    
    const options = {
      'method': 'GET',
      'headers': {
        'Authorization': 'Bearer ' + PAYSTACK_SECRET_KEY
      },
      'muteHttpExceptions': true
    };
    
    const response = UrlFetchApp.fetch('https://api.paystack.co/transfer/' + encodeURIComponent(transferCode), options);
    const result = JSON.parse(response.getContentText());
    
    if (result.status) {
      return {
        success: true,
        data: result.data
      };
    } else {
      throw new Error(result.message || 'Failed to verify transfer');
    }
  } catch (error) {
    return {
      success: false,
      error: 'Transfer verification failed: ' + error.message
    };
  }
}

function getBanks() {
  try {
    const options = {
      'method': 'GET',
      'headers': {
        'Authorization': 'Bearer ' + PAYSTACK_SECRET_KEY
      },
      'muteHttpExceptions': true
    };
    
    const response = UrlFetchApp.fetch('https://api.paystack.co/bank', options);
    const result = JSON.parse(response.getContentText());
    
    if (result.status) {
      return {
        success: true,
        data: result.data
      };
    } else {
      throw new Error(result.message || 'Failed to fetch banks');
    }
  } catch (error) {
    return {
      success: false,
      error: 'Failed to fetch banks: ' + error.message
    };
  }
}

function checkBalance() {
  try {
    const options = {
      'method': 'GET',
      'headers': {
        'Authorization': 'Bearer ' + PAYSTACK_SECRET_KEY
      },
      'muteHttpExceptions': true
    };
    
    const response = UrlFetchApp.fetch('https://api.paystack.co/balance', options);
    const result = JSON.parse(response.getContentText());
    
    if (result.status) {
      return {
        success: true,
        data: result.data
      };
    } else {
      throw new Error(result.message || 'Failed to check balance');
    }
  } catch (error) {
    return {
      success: false,
      error: 'Balance check failed: ' + error.message
    };
  }
}

// =============================================
// CORE PAYROLL FUNCTIONS
// =============================================

function addEmployee(data) {
  try {
    const sheet = getOrCreateSheet('Employees');
    
    // Set headers if first row
    if (sheet.getLastRow() === 0) {
      sheet.getRange(1, 1, 1, 16).setValues([[
        'ID', 'First Name', 'Last Name', 'Email', 'Phone', 'Department', 'Position',
        'Bank Name', 'Account Number', 'Account Name', 'Basic Salary', 'Allowances',
        'Deductions', 'Net Salary', 'Status', 'Created At'
      ]]);
      
      // Format headers
      sheet.getRange(1, 1, 1, 16).setFontWeight('bold').setBackground('#f3f4f6');
    }
    
    const employee = JSON.parse(data);
    
    // Validate required fields
    if (!employee.id || !employee.firstName || !employee.lastName || !employee.email) {
      throw new Error('Missing required employee fields');
    }
    
    const row = [
      employee.id,
      employee.firstName,
      employee.lastName,
      employee.email,
      employee.phone || '',
      employee.department || '',
      employee.position || '',
      employee.bankName || '',
      employee.accountNumber || '',
      employee.accountName || '',
      parseFloat(employee.basicSalary) || 0,
      parseFloat(employee.allowances) || 0,
      parseFloat(employee.deductions) || 0,
      parseFloat(employee.netSalary) || 0,
      employee.status || 'active',
      employee.createdAt || new Date().toISOString()
    ];
    
    sheet.appendRow(row);
    
    // Auto-resize columns for better readability
    sheet.autoResizeColumns(1, 16);
    
    return {
      success: true,
      data: employee,
      message: 'Employee added successfully'
    };
  } catch (error) {
    return {
      success: false,
      error: 'Failed to add employee: ' + error.message
    };
  }
}

function getEmployees() {
  try {
    const sheet = getOrCreateSheet('Employees');
    const data = sheet.getDataRange().getValues();
    
    if (data.length <= 1) {
      return {
        success: true,
        data: [],
        message: 'No employees found'
      };
    }
    
    const headers = data[0];
    const employees = [];
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row[0] && row[0].toString().trim() !== '') {
        employees.push({
          id: row[0],
          firstName: row[1] || '',
          lastName: row[2] || '',
          email: row[3] || '',
          phone: row[4] || '',
          department: row[5] || '',
          position: row[6] || '',
          bankName: row[7] || '',
          accountNumber: row[8] || '',
          accountName: row[9] || '',
          basicSalary: parseFloat(row[10]) || 0,
          allowances: parseFloat(row[11]) || 0,
          deductions: parseFloat(row[12]) || 0,
          netSalary: parseFloat(row[13]) || 0,
          status: row[14] || 'active',
          createdAt: row[15] || new Date().toISOString()
        });
      }
    }
    
    return {
      success: true,
      data: employees,
      count: employees.length
    };
  } catch (error) {
    return {
      success: false,
      error: 'Failed to get employees: ' + error.message
    };
  }
}

function addPayrollRun(data) {
  try {
    const sheet = getOrCreateSheet('PayrollRuns');
    
    // Set headers if first row
    if (sheet.getLastRow() === 0) {
      sheet.getRange(1, 1, 1, 10).setValues([[
        'ID', 'Name', 'Period', 'Payment Date', 'Selected Employees', 
        'Total Amount', 'Status', 'Successful Payments', 'Failed Payments', 'Created At'
      ]]);
      
      // Format headers
      sheet.getRange(1, 1, 1, 10).setFontWeight('bold').setBackground('#f3f4f6');
    }
    
    const payrollRun = JSON.parse(data);
    
    const row = [
      payrollRun.id,
      payrollRun.name,
      payrollRun.period,
      payrollRun.paymentDate,
      Array.isArray(payrollRun.selectedEmployees) ? payrollRun.selectedEmployees.join(',') : '',
      parseFloat(payrollRun.totalAmount) || 0,
      payrollRun.status || 'processing',
      parseInt(payrollRun.successfulPayments) || 0,
      parseInt(payrollRun.failedPayments) || 0,
      payrollRun.createdAt || new Date().toISOString()
    ];
    
    sheet.appendRow(row);
    
    // Auto-resize columns
    sheet.autoResizeColumns(1, 10);
    
    return {
      success: true,
      data: payrollRun,
      message: 'Payroll run recorded successfully'
    };
  } catch (error) {
    return {
      success: false,
      error: 'Failed to add payroll run: ' + error.message
    };
  }
}

function getPayrollRuns() {
  try {
    const sheet = getOrCreateSheet('PayrollRuns');
    const data = sheet.getDataRange().getValues();
    
    if (data.length <= 1) {
      return {
        success: true,
        data: [],
        message: 'No payroll runs found'
      };
    }
    
    const headers = data[0];
    const payrollRuns = [];
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row[0] && row[0].toString().trim() !== '') {
        payrollRuns.push({
          id: row[0],
          name: row[1] || '',
          period: row[2] || '',
          paymentDate: row[3] || '',
          selectedEmployees: row[4] ? row[4].toString().split(',') : [],
          totalAmount: parseFloat(row[5]) || 0,
          status: row[6] || 'processing',
          successfulPayments: parseInt(row[7]) || 0,
          failedPayments: parseInt(row[8]) || 0,
          createdAt: row[9] || new Date().toISOString()
        });
      }
    }
    
    // Sort by creation date, newest first
    payrollRuns.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    return {
      success: true,
      data: payrollRuns,
      count: payrollRuns.length
    };
  } catch (error) {
    return {
      success: false,
      error: 'Failed to get payroll runs: ' + error.message
    };
  }
}

function addPaymentRecord(data) {
  try {
    const sheet = getOrCreateSheet('PaymentRecords');
    
    // Set headers if first row
    if (sheet.getLastRow() === 0) {
      sheet.getRange(1, 1, 1, 9).setValues([[
        'ID', 'Employee ID', 'Employee Name', 'Payroll ID', 'Amount', 
        'Status', 'Reference', 'Paystack Response', 'Date'
      ]]);
      
      // Format headers
      sheet.getRange(1, 1, 1, 9).setFontWeight('bold').setBackground('#f3f4f6');
    }
    
    const payment = JSON.parse(data);
    
    const row = [
      payment.id,
      payment.employeeId,
      payment.employeeName,
      payment.payrollId,
      parseFloat(payment.amount) || 0,
      payment.status,
      payment.reference || '',
      JSON.stringify(payment.paystackResponse || {}),
      payment.date || new Date().toISOString()
    ];
    
    sheet.appendRow(row);
    
    // Auto-resize columns
    sheet.autoResizeColumns(1, 9);
    
    return {
      success: true,
      message: 'Payment record saved successfully'
    };
  } catch (error) {
    return {
      success: false,
      error: 'Failed to add payment record: ' + error.message
    };
  }
}

// =============================================
// UTILITY FUNCTIONS
// =============================================

function getOrCreateSheet(sheetName) {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(sheetName);
  
  if (!sheet) {
    sheet = spreadsheet.insertSheet(sheetName);
    
    // Add some basic formatting to new sheets
    sheet.setFrozenRows(1); // Freeze header row
    sheet.getRange(1, 1, 1, sheet.getLastColumn()).setFontWeight('bold');
  }
  
  return sheet;
}

function getBankCode(bankName) {
  const bankCodes = {
    'Access Bank': '044',
    'GTBank': '058',
    'Zenith Bank': '057',
    'First Bank': '011',
    'UBA': '033',
    'Fidelity Bank': '070',
    'Stanbic IBTC': '039',
    'Union Bank': '032',
    'Ecobank': '050',
    'Wema Bank': '035',
    'OPay (Microfinance Bank)': '100004',
    'Moniepoint (Microfinance)': '100015',
    'Jaiz Bank (Islamic)': '301',
    'Sterling Bank': '232',
    'Keystone Bank': '082',
    'Standard Chartered Bank': '068',
    'Kuda Bank (Microfinance)': '100011'
  };
  
  return bankCodes[bankName];
}

function clearAllData() {
  try {
    const sheets = ['Employees', 'PayrollRuns', 'PaymentRecords'];
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    
    sheets.forEach(sheetName => {
      const sheet = spreadsheet.getSheetByName(sheetName);
      if (sheet) {
        sheet.clearContents();
      }
    });
    
    return {
      success: true,
      message: 'All data cleared successfully'
    };
  } catch (error) {
    return {
      success: false,
      error: 'Failed to clear data: ' + error.message
    };
  }
}

function getSpreadsheetInfo() {
  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheets = spreadsheet.getSheets();
    const sheetInfo = sheets.map(sheet => ({
      name: sheet.getName(),
      rowCount: sheet.getLastRow(),
      columnCount: sheet.getLastColumn()
    }));
    
    return {
      success: true,
      data: {
        spreadsheetName: spreadsheet.getName(),
        spreadsheetId: spreadsheet.getId(),
        sheets: sheetInfo
      }
    };
  } catch (error) {
    return {
      success: false,
      error: 'Failed to get spreadsheet info: ' + error.message
    };
  }
}

// Test function to verify everything works
function testAllFunctions() {
  console.log('Testing Payroll System...');
  
  // Test spreadsheet connection
  const sheetInfo = getSpreadsheetInfo();
  console.log('Sheet Info:', sheetInfo);
  
  // Test Paystack connection
  const balance = checkBalance();
  console.log('Balance Check:', balance);
  
  // Test banks list
  const banks = getBanks();
  console.log('Banks Available:', banks.success ? banks.data.length : 'Failed');
  
  console.log('Testing completed!');
}