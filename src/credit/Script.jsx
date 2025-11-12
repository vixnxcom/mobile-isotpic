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

// --- Utility functions ---
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