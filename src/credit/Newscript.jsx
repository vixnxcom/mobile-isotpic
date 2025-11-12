// ADD THIS AT THE TOP OF YOUR SCRIPT (replace with your actual secret key)
const PAYSTACK_SECRET_KEY = 'sk_test_a6a235770b160edbbe133b9613b32bc2739b0326'; // Replace with your actual Paystack secret key

function doPost(e) {
  try {
    const requestData = JSON.parse(e.postData.contents);
    const { action, payload } = requestData;

    let result;
    switch (action) {
      case 'addRecipient':
        result = addRecipient(payload);
        break;
      case 'addPayment':
        result = addPayment(payload);
        break;
      default:
        throw new Error('Invalid action');
    }

    return ContentService
      .createTextOutput(JSON.stringify({ success: true, data: result }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  try {
    const action = e.parameter.action;
    
    // Handle test connection
    if (action === 'test') {
      return ContentService
        .createTextOutput(JSON.stringify({ 
          success: true, 
          message: 'Connection successful',
          timestamp: new Date().toISOString()
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    let result;
    switch (action) {
      case 'getRecipients':
        result = getRecipients();
        break;
      case 'getPayments':
        result = getPayments();
        break;
      case 'addRecipient':
        // Handle add recipient via GET request to avoid CORS issues
        if (e.parameter.data) {
          const recipientData = JSON.parse(e.parameter.data);
          result = addRecipient(recipientData);
        } else {
          throw new Error('No recipient data provided');
        }
        break;
      case 'addPayment':
        // Handle add payment via GET request to avoid CORS issues
        if (e.parameter.data) {
          const paymentData = JSON.parse(e.parameter.data);
          result = addPayment(paymentData);
        } else {
          throw new Error('No payment data provided');
        }
        break;
      // NEW PAYSTACK ACTIONS
      case 'resolveAccount':
        const bankValue = e.parameter.bankValue;
        const accountNumber = e.parameter.accountNumber;
        result = resolveAccount(bankValue, accountNumber);
        break;
      case 'createRecipient':
        const name = e.parameter.name;
        const recipientBank = e.parameter.bankValue;
        const recipientAccount = e.parameter.accountNumber;
        result = createRecipient(name, recipientBank, recipientAccount);
        break;
      case 'initiateTransfer':
        const recipientCode = e.parameter.recipientCode;
        const amountKobo = e.parameter.amountKobo;
        const reason = e.parameter.reason;
        result = initiateTransfer(recipientCode, amountKobo, reason);
        break;
      case 'verifyTransfer':
        const transferCode = e.parameter.transferCode;
        result = verifyTransfer(transferCode);
        break;
      default:
        throw new Error('Invalid action: ' + action);
    }

    return ContentService
      .createTextOutput(JSON.stringify({ success: true, data: result }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// --- NEW PAYSTACK INTEGRATION FUNCTIONS ---
function resolveAccount(bankValue, accountNumber) {
  try {
    // Map bank values to bank codes
    const bankCodes = {
      'access': '044',
      'gtb': '058',
      'zenith': '057',
      'first': '011',
      'uba': '033',
      'fidelity': '070',
      'union': '032',
      'sterling': '232',
      'fcmb': '214',
      'ecobank': '050',
      'stanbic': '039',
      'wema': '035',
      'polaris': '076',
      'keystone': '082',
      'heritage': '030',
      'providus': '101',
      'suntrust': '100',
      'citi': '023',
      'standard-chartered': '068',
      'jaiz': '301',
      'taj': '302',
      'lotus': '303',
      'globus': '103',
      'premium-trust': '105',
      'titan-trust': '102',
      'opay': '100004',
      'kuda': '100011',
      'rubies': '100025',
      'mint': '100032',
      'sparkle': '100025',
      'moniepoint': '100015',
      'parallex': '100002',
      'safe-haven': '100013',
      'bowen': '100027',
      'coronation': '100028',
      'nova': '100033',
      'rand-merchant': '100029'
    };
    
    const bankCode = bankCodes[bankValue];
    if (!bankCode) {
      throw new Error(`Bank code not found for: ${bankValue}`);
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
        account_name: result.data.account_name,
        account_number: result.data.account_number
      };
    } else {
      throw new Error(result.message || 'Failed to resolve account');
    }
  } catch (error) {
    throw new Error('Resolve account failed: ' + error.toString());
  }
}

function createRecipient(name, bankValue, accountNumber) {
  try {
    // Map bank values to bank codes
    const bankCodes = {
      'access': '044',
      'gtb': '058',
      'zenith': '057',
      'first': '011',
      'uba': '033',
      'fidelity': '070',
      'union': '032',
      'sterling': '232',
      'fcmb': '214',
      'ecobank': '050',
      'stanbic': '039',
      'wema': '035',
      'polaris': '076',
      'keystone': '082',
      'heritage': '030',
      'providus': '101',
      'suntrust': '100',
      'citi': '023',
      'standard-chartered': '068',
      'jaiz': '301',
      'taj': '302',
      'lotus': '303',
      'globus': '103',
      'premium-trust': '105',
      'titan-trust': '102',
      'opay': '100004',
      'kuda': '100011',
      'rubies': '100025',
      'mint': '100032',
      'sparkle': '100025',
      'moniepoint': '100015',
      'parallex': '100002',
      'safe-haven': '100013',
      'bowen': '100027',
      'coronation': '100028',
      'nova': '100033',
      'rand-merchant': '100029'
    };
    
    const bankCode = bankCodes[bankValue];
    if (!bankCode) {
      throw new Error(`Bank code not found for: ${bankValue}`);
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
        recipient_code: result.data.recipient_code,
        details: result.data
      };
    } else {
      throw new Error(result.message || 'Failed to create recipient');
    }
  } catch (error) {
    throw new Error('Create recipient failed: ' + error.toString());
  }
}

function initiateTransfer(recipientCode, amountKobo, reason) {
  try {
    const payload = {
      'source': 'balance',
      'amount': amountKobo,
      'recipient': recipientCode,
      'reason': reason
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
        transfer_code: result.data.transfer_code,
        status: result.data.status,
        details: result.data
      };
    } else {
      throw new Error(result.message || 'Failed to initiate transfer');
    }
  } catch (error) {
    throw new Error('Initiate transfer failed: ' + error.toString());
  }
}

function verifyTransfer(transferCode) {
  try {
    const options = {
      'method': 'GET',
      'headers': {
        'Authorization': 'Bearer ' + PAYSTACK_SECRET_KEY
      },
      'muteHttpExceptions': true
    };
    
    const response = UrlFetchApp.fetch('https://api.paystack.co/transfer/' + transferCode, options);
    const result = JSON.parse(response.getContentText());
    
    if (result.status) {
      return result.data;
    } else {
      throw new Error(result.message || 'Failed to verify transfer');
    }
  } catch (error) {
    throw new Error('Verify transfer failed: ' + error.toString());
  }
}

// --- EXISTING UTILITY FUNCTIONS (keep these as they are) ---
function addRecipient(data) {
  try {
    const sheet = SpreadsheetApp.openById('1-nmQq2ORmTsof8x1ZvmjMY6VBfBJhh-FvcaPEWNXixg').getSheetByName('Recipients');
    
    // Check if sheet exists, if not create it
    if (!sheet) {
      throw new Error('Recipients sheet not found');
    }
    
    // Add headers if sheet is empty
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(['ID', 'Name', 'Email', 'Phone', 'Bank', 'Account Number', 'Description', 'Created At']);
    }
    
    sheet.appendRow([
      data.id,
      data.name,
      data.email,
      data.phone,
      data.bank,
      data.accountNumber,
      data.description || '',
      data.createdAt || new Date().toISOString()
    ]);
    
    return data;
  } catch (error) {
    throw new Error('Failed to add recipient: ' + error.toString());
  }
}

function addPayment(data) {
  try {
    const sheet = SpreadsheetApp.openById('1-nmQq2ORmTsof8x1ZvmjMY6VBfBJhh-FvcaPEWNXixg').getSheetByName('Payments');
    
    // Check if sheet exists, if not create it
    if (!sheet) {
      throw new Error('Payments sheet not found');
    }
    
    // Add headers if sheet is empty
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(['ID', 'Recipient ID', 'Recipient Name', 'Amount', 'Status', 'Reference', 'Date']);
    }
    
    sheet.appendRow([
      data.id,
      data.recipientId,
      data.recipientName,
      data.amount,
      data.status,
      data.reference,
      data.date
    ]);
    
    return data;
  } catch (error) {
    throw new Error('Failed to add payment: ' + error.toString());
  }
}

function getRecipients() {
  try {
    const sheet = SpreadsheetApp.openById('1-nmQq2ORmTsof8x1ZvmjMY6VBfBJhh-FvcaPEWNXixg').getSheetByName('Recipients');
    
    if (!sheet) {
      throw new Error('Recipients sheet not found');
    }
    
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return [];
    
    const headers = data[0];
    return data.slice(1).map(row => {
      const obj = {};
      headers.forEach((header, i) => {
        // Convert header names to camelCase to match frontend expectations
        let key = header.toString().toLowerCase().replace(/\s+/g, '');
        if (key === 'accountnumber') key = 'accountNumber';
        if (key === 'createdat') key = 'createdAt';
        if (key === 'recipientid') key = 'recipientId';
        if (key === 'recipientname') key = 'recipientName';
        
        obj[key] = row[i];
      });
      return obj;
    }).filter(obj => obj.id); // Filter out empty rows
  } catch (error) {
    throw new Error('Failed to get recipients: ' + error.toString());
  }
}

function getPayments() {
  try {
    const sheet = SpreadsheetApp.openById('1-nmQq2ORmTsof8x1ZvmjMY6VBfBJhh-FvcaPEWNXixg').getSheetByName('Payments');
    
    if (!sheet) {
      throw new Error('Payments sheet not found');
    }
    
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return [];
    
    const headers = data[0];
    return data.slice(1).map(row => {
      const obj = {};
      headers.forEach((header, i) => {
        // Convert header names to camelCase to match frontend expectations
        let key = header.toString().toLowerCase().replace(/\s+/g, '');
        if (key === 'recipientid') key = 'recipientId';
        if (key === 'recipientname') key = 'recipientName';
        
        obj[key] = row[i];
      });
      return obj;
    }).filter(obj => obj.id); // Filter out empty rows
  } catch (error) {
    throw new Error('Failed to get payments: ' + error.toString());
  }
}