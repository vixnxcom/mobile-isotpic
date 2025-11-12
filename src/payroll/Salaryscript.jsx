

function doGet(e) {
  const action = e.parameter.action;
  
  // Enable CORS
  const response = ContentService.createTextOutput();
  response.setMimeType(ContentService.MimeType.JSON);
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
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
        
      default:
        result = { success: false, error: 'Unknown action: ' + action };
    }
    
    response.setContent(JSON.stringify(result));
    return response;
    
  } catch (error) {
    const errorResult = {
      success: false,
      error: error.message,
      stack: error.stack
    };
    response.setContent(JSON.stringify(errorResult));
    return response;
  }
}

function doPost(e) {
  return doGet(e);
}

function addEmployee(data) {
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
  const row = [
    employee.id,
    employee.firstName,
    employee.lastName,
    employee.email,
    employee.phone || '',
    employee.department || '',
    employee.position || '',
    employee.bankName,
    employee.accountNumber,
    employee.accountName || '',
    parseFloat(employee.basicSalary) || 0,
    parseFloat(employee.allowances) || 0,
    parseFloat(employee.deductions) || 0,
    parseFloat(employee.netSalary) || 0,
    employee.status || 'active',
    employee.createdAt
  ];
  
  sheet.appendRow(row);
  
  // Auto-resize columns for better readability
  sheet.autoResizeColumns(1, 16);
  
  return {
    success: true,
    data: employee,
    message: 'Employee added successfully'
  };
}

function getEmployees() {
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
}

function addPayrollRun(data) {
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
    payrollRun.createdAt
  ];
  
  sheet.appendRow(row);
  
  // Auto-resize columns
  sheet.autoResizeColumns(1, 10);
  
  return {
    success: true,
    data: payrollRun,
    message: 'Payroll run recorded successfully'
  };
}

function getPayrollRuns() {
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
}

function addPaymentRecord(data) {
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
    payment.reference,
    JSON.stringify(payment.paystackResponse || {}),
    payment.date
  ];
  
  sheet.appendRow(row);
  
  // Auto-resize columns
  sheet.autoResizeColumns(1, 9);
  
  return {
    success: true,
    message: 'Payment record saved successfully'
  };
}

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

// Utility function to clear all data (for testing)
function clearAllData() {
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
}

// Function to get spreadsheet info
function getSpreadsheetInfo() {
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
}