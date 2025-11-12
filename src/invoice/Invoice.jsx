import React, { useState, useRef, useEffect } from 'react';
import { Plus, Trash2, Download, Eye, Edit, Save, X, History, SaveAll, SaveIcon } from 'lucide-react';
import { gen } from '../assets';

const InvoiceGenerator = () => {
  const [invoice, setInvoice] = useState({
    invoiceNumber: 'INV-001',
    date: new Date().toISOString().split('T')[0],
    dueDate: '',
    company: {
      name: 'Your Company Name',
      address: '123 Business Street',
      city: 'Business City',
      zipCode: '960001',
      phone: '+234 (555) 123-456',
      email: 'contact@company.com'
    },
    customer: {
      name: '',
      email: '',
      address: '',
      city: '',
      zipCode: '',
      phone: ''
    },
    items: [
      { id: 1, description: '', quantity: 1, rate: 0, amount: 0 }
    ],
    notes: '',
    terms: 'Payment is due within 30 days',
    taxAmount: 0,
    discountAmount: 0,
    accountNumber: ''
  });

  const [showPreview, setShowPreview] = useState(false);
  const [invoiceHistory, setInvoiceHistory] = useState([]);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [activeTab, setActiveTab] = useState('create');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  const printRef = useRef();

  useEffect(() => {
    const loadInvoicesFromStorage = async () => {
      try {
        const result = await window.storage.get('invoiceHistory');
        if (result && result.value) {
          const parsedInvoices = JSON.parse(result.value);
          console.log('Loaded invoices from storage:', parsedInvoices.length, 'invoices');
          setInvoiceHistory(parsedInvoices);
        }
      } catch (error) {
        console.log('No existing invoices found or failed to load:', error);
      }
    };

    loadInvoicesFromStorage();
  }, []);

  useEffect(() => {
    const saveInvoicesToStorage = async () => {
      try {
        if (invoiceHistory.length > 0) {
          await window.storage.set('invoiceHistory', JSON.stringify(invoiceHistory));
          console.log('Saved invoices to storage:', invoiceHistory.length, 'invoices');
        }
      } catch (error) {
        console.warn('Failed to save invoices to storage:', error);
      }
    };

    saveInvoicesToStorage();
  }, [invoiceHistory]);

  const paginatedInvoiceHistory = React.useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return invoiceHistory.slice(startIndex, endIndex);
  }, [invoiceHistory, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(invoiceHistory.length / itemsPerPage);

  const addItem = () => {
    const newItem = {
      id: invoice.items.length + 1,
      description: '',
      quantity: 1,
      rate: 0,
      amount: 0
    };
    setInvoice(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));
  };

  const removeItem = (id) => {
    setInvoice(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== id)
    }));
  };

  const updateItem = (id, field, value) => {
    setInvoice(prev => ({
      ...prev,
      items: prev.items.map(item => {
        if (item.id === id) {
          const updatedItem = { ...item, [field]: value };
          if (field === 'quantity' || field === 'rate') {
            updatedItem.amount = updatedItem.quantity * updatedItem.rate;
          }
          return updatedItem;
        }
        return item;
      })
    }));
  };

  const updateCompany = (field, value) => {
    setInvoice(prev => ({
      ...prev,
      company: { ...prev.company, [field]: value }
    }));
  };

  const updateCustomer = (field, value) => {
    setInvoice(prev => ({
      ...prev,
      customer: { ...prev.customer, [field]: value }
    }));
  };

  const calculateSubtotal = () => {
    return invoice.items.reduce((sum, item) => sum + (item.amount || 0), 0);
  };

  const calculateDiscount = () => {
    return invoice.discountAmount || 0;
  };

  const calculateTax = () => {
    return invoice.taxAmount || 0;
  };

  const calculateTotal = () => {
    return calculateSubtotal() - calculateDiscount() + calculateTax();
  };

  const generatePDF = () => {
    window.print();
  };

  const saveToHistory = async () => {
    const invoiceWithId = {
      ...invoice,
      id: Date.now(),
      savedAt: new Date().toLocaleString(),
      totalAmount: calculateTotal()
    };
    
    const updatedHistory = [invoiceWithId, ...invoiceHistory];
    setInvoiceHistory(updatedHistory);
    
    try {
      await window.storage.set('currentInvoice', JSON.stringify(invoice));
    } catch (error) {
      console.warn('Failed to save current invoice to storage:', error);
    }
    
    alert('Invoice saved to history!');
  };

  const loadInvoice = (historyInvoice) => {
    setInvoice(historyInvoice);
    setEditingInvoice(null);
    setShowPreview(false);
    setActiveTab('create');
  };

  const startEditing = (historyInvoice) => {
    setEditingInvoice(historyInvoice);
  };

  const saveEditedInvoice = () => {
    const updatedInvoiceHistory = invoiceHistory.map(inv => 
      inv.id === editingInvoice.id ? editingInvoice : inv
    );
    setInvoiceHistory(updatedInvoiceHistory);
    setEditingInvoice(null);
    alert('Invoice updated!');
  };

  const deleteInvoice = (id) => {
    if (window.confirm('Are you sure you want to delete this invoice?')) {
      const updatedHistory = invoiceHistory.filter(inv => inv.id !== id);
      setInvoiceHistory(updatedHistory);
    }
  };

  const clearAllInvoices = async () => {
    if (window.confirm('Are you sure you want to delete ALL invoices? This action cannot be undone.')) {
      setInvoiceHistory([]);
      try {
        await window.storage.delete('invoiceHistory');
        alert('All invoices have been deleted.');
      } catch (error) {
        console.warn('Failed to clear storage:', error);
        alert('All invoices have been deleted from view.');
      }
    }
  };

  const exportInvoices = () => {
    try {
      const dataStr = JSON.stringify(invoiceHistory, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      alert('Invoices exported successfully!');
    } catch (error) {
      alert('Failed to export invoices: ' + error.message);
    }
  };

  const importInvoices = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedInvoices = JSON.parse(e.target.result);
        if (Array.isArray(importedInvoices)) {
          if (window.confirm(`Import ${importedInvoices.length} invoices? This will replace your current invoice history.`)) {
            setInvoiceHistory(importedInvoices);
            alert('Invoices imported successfully!');
          }
        } else {
          alert('Invalid file format. Please select a valid invoice backup file.');
        }
      } catch (error) {
        alert('Failed to import invoices: ' + error.message);
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const InvoicePreview = () => (
    <div ref={printRef} className="print-area max-w-4xl mx-auto shadow-xs bg-shape rounded-[14px] p-8 border border-gray-200">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-xl aeon-bold text-pink-600 mb-2">Customer Invoice</h1>
          <p className=" text-sm text-gray-700 tracking-widest">Invoice: {invoice.invoiceNumber}</p>
          <p className=" text-sm text-gray-700 tracking-widest">Date: {invoice.date}</p>
          {invoice.dueDate && <p className="text-gray-600 font-bold text-xs">Due Date: {invoice.dueDate}</p>}
        </div>
        <div className="text-right">
          <h2 className="text-xl aeon-bold text-gray-800">{invoice.company.name}</h2>
          <p className="text-gray-600 inter text-sm">{invoice.company.address}</p>
          <p className="text-gray-600 inter text-sm">{invoice.company.city}, {invoice.company.zipCode}</p>
          <p className="text-gray-600 inter text-sm">{invoice.company.phone}</p>
          <p className="text-gray-600 inter text-xs">{invoice.company.email}</p>
          {invoice.accountNumber && (
            <p className="text-gray-600 aeon-bold text-xs mt-2">
              <strong>Account:</strong> {invoice.accountNumber}
            </p>
          )}
        </div>
      </div>

      <div className="mb-8">
        <h3 className="text-lg aeon-bold tracking-wider mb-2 gray200">Bill To:</h3>
        <div className="p-4 text-sm border bg-white border-pink-100 rounded-[14px]">
          <p className="aeon-bold gray200 tracking-wide">{invoice.customer.name}</p>
          <p className="text-gray-600 inter">{invoice.customer.address}</p>
          <p className="text-gray-600 inter">{invoice.customer.city}, {invoice.customer.zipCode}</p>
          <p className="text-gray-600 inter">{invoice.customer.phone}</p>
          <p className="text-gray-600 inter">{invoice.customer.email}</p>
        </div>
      </div>

      <div className="mb-8 rounded-[14px] border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="">
            <tr>
              <th className="p-3 text-sm font-medium aeon-bold tracking-wide gray200  text-left">
                Description
              </th>
              <th className="p-4 px-8 text-sm aeon-bold font-medium tracking-wide gray200 text-center">
                Qty
              </th>
              <th className="p-4 px-8 text-sm aeon-bold font-medium tracking-wide gray200 text-right">
                Rate
              </th>
              <th className="p-4 px-8 text-sm aeon-bold font-medium tracking-wide gray200  text-right">
                Amount
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {invoice.items.map((item) => (
              <tr key={item.id} className="hover:bg-pink-50 transition-colors duration-150">
                <td className="w-full p-2 px-3 border-0 tracking-widest text-xs gray200 focus:outline-none">
                  {item.description}
                </td>
                <td className="p-4 inter text-sm gray200 tracking-wide text-center">
                  {item.quantity}
                </td>
                <td className="p-4 inter text-sm gray200 tracking-wide text-right">
                  ₦{item.rate.toFixed(2)}
                </td>
                <td className="p-4 inter text-sm gray200 tracking-wide text-right">
                  ₦{item.amount.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end mb-8">
        <div className="w-64">
          <div className="flex justify-between py-2 mr-3">
            <span className=" text-sm text-gray-700 tracking-widest">Subtotal:</span>
            <span className="gray200 aeon-bold tracking-widest">₦{calculateSubtotal().toFixed(2)}</span>
          </div>
          {invoice.discountAmount > 0 && (
            <div className="flex justify-between py-2 text-gray-500 mr-3">
              <span className="tracking-wide text-sm text-sm inter">Discount:</span>
              <span className="tracking-wide inter text-gray-500">-₦{calculateDiscount().toFixed(2)}</span>
            </div>
          )}
          {invoice.taxAmount > 0 && (
            <div className="flex justify-between py-2 text-gray-500 mr-3">
              <span className="tracking-wide text-sm inter">Tax:</span>
              <span className="tracking-wide text-sm inter text-gray-500">₦{calculateTax().toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between py-2  border-t border-gray-300 mr-3">
            <span className=" text-sm text-gray-700 tracking-widest ">Total:</span>
            <span className="aeon-bold gray200 tracking-widest">₦{calculateTotal().toFixed(2)}</span>
          </div>
        </div>
      </div>

      {invoice.notes && (
        <div className="mb-6">
          <h3 className="aeon-bold text-gray-800 tracking-wide mb-2">Notes:</h3>
          <p className="gray200 inter text-sm">{invoice.notes}</p>
        </div>
      )}

      {invoice.terms && (
        <div>
          <h3 className="aeon-bold gray200 tracking-wide mb-2">Terms & Conditions:</h3>
          <p className="text-gray-600 inter text-sm">{invoice.terms}</p>
        </div>
      )}
    </div>
  );

  const InvoiceHistoryTab = () => (
    <div className="min-h-screen bg-white rounded-lg py-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white p-6 border border-purple-100 rounded-lg">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-pink-600">Invoice History</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('create')}
                className="border border-pink-600 text-pink-600 px-4 py-2 rounded-lg hover:bg-pink-600 hover:text-white flex items-center gap-2"
              >
                ← Back to Create
              </button>
            </div>
          </div>

          {invoiceHistory.length > 0 && (
            <div className="flex gap-2 mb-6">
              <button
                onClick={exportInvoices}
                className="border border-blue-600 text-blue-600 px-3 py-2 rounded-lg hover:bg-blue-600 hover:text-white flex items-center gap-2 text-sm"
              >
                <Download size={16} />
                Export Invoices
              </button>
              <div className="relative">
                <input
                  type="file"
                  accept=".json"
                  onChange={importInvoices}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <button className="relative z-10 border border-green-600 text-green-600 px-3 py-2 rounded-lg hover:bg-green-600 hover:text-white flex items-center gap-2 text-sm">
                  <Save size={16} />
                  Import Invoices
                </button>
              </div>
              <button
                onClick={clearAllInvoices}
                className="border border-red-600 text-red-600 px-3 py-2 rounded-lg hover:bg-red-600 hover:text-white flex items-center gap-2 text-sm"
              >
                <Trash2 size={16} />
                Clear All
              </button>
            </div>
          )}

          {invoiceHistory.length > 0 && (
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center space-x-4">
                <div className="bg-white border border-gray-300 rounded-lg px-3 py-2">
                  <p className="text-gray-500 text-sm">
                    Page {currentPage} of {totalPages} • {invoiceHistory.length} total invoices
                  </p>
                </div>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="border border-gray-300 text-gray-700 rounded-lg px-2 py-2 text-sm outline-none bg-white"
                >
                  <option value={5}>5 per page</option>
                  <option value={10}>10 per page</option>
                  <option value={20}>20 per page</option>
                  <option value={50}>50 per page</option>
                </select>
              </div>
            </div>
          )}

          {invoiceHistory.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
              <History size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500 text-lg mb-2">No invoices saved yet</p>
              <p className="text-gray-400 text-sm">Preview and save your first invoice to see it here</p>
              <button
                onClick={() => setActiveTab('create')}
                className="mt-4 border border-pink-600 text-pink-600 px-6 py-2 rounded-lg hover:bg-pink-600 hover:text-white"
              >
                Create Invoice
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {paginatedInvoiceHistory.map((historyInvoice) => (
                <div key={historyInvoice.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow bg-white">
                  {editingInvoice?.id === historyInvoice.id ? (
                    <div className="space-y-4">
                      <div className="flex justify-between items-start">
                        <input
                          type="text"
                          value={editingInvoice.invoiceNumber}
                          onChange={(e) => setEditingInvoice(prev => ({ ...prev, invoiceNumber: e.target.value }))}
                          className="text-xl font-bold text-pink-600 border border-gray-300 rounded-lg p-2"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={saveEditedInvoice}
                            className="text-green-600 hover:text-green-800 p-2 rounded-full hover:bg-green-50"
                          >
                            <Save size={20} />
                          </button>
                          <button
                            onClick={() => setEditingInvoice(null)}
                            className="text-gray-600 hover:text-gray-800 p-2 rounded-full hover:bg-gray-50"
                          >
                            <X size={20} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-xl font-bold text-pink-600 mb-2">{historyInvoice.invoiceNumber}</h3>
                          <p className="text-gray-700 text-lg font-medium">{historyInvoice.customer.name}</p>
                          {historyInvoice.customer.email && (
                            <p className="text-gray-600">{historyInvoice.customer.email}</p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => startEditing(historyInvoice)}
                            className="text-blue-600 hover:text-blue-800 p-2 rounded-full hover:bg-blue-50"
                            title="Edit Invoice"
                          >
                            <Edit size={20} />
                          </button>
                          <button
                            onClick={() => loadInvoice(historyInvoice)}
                            className="text-green-600 hover:text-green-800 p-2 rounded-full hover:bg-green-50"
                            title="Load Invoice"
                          >
                            <Eye size={20} />
                          </button>
                          <button
                            onClick={() => deleteInvoice(historyInvoice.id)}
                            className="text-red-600 hover:text-red-800 p-2 rounded-full hover:bg-red-50"
                            title="Delete Invoice"
                          >
                            <Trash2 size={20} />
                          </button>
                        </div>
                      </div>
                      <div className="flex justify-between items-center text-sm text-gray-600">
                        <div className="space-y-1">
                          <p><span className="font-medium">Date:</span> {historyInvoice.date}</p>
                          <p><span className="font-medium">Saved:</span> {historyInvoice.savedAt}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-green-600">
                            ₦{historyInvoice.totalAmount?.toFixed(2) || historyInvoice.items.reduce((sum, item) => sum + item.amount, 0).toFixed(2)}
                          </p>
                          <p className="text-xs text-gray-500">{historyInvoice.items.length} items</p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}

              {invoiceHistory.length > 0 && totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 px-6 py-3 bg-gray-50 border-t border-gray-200 rounded-b-lg">
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-700">
                      Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, invoiceHistory.length)} of {invoiceHistory.length} invoices
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                      className="px-3 py-1 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                    >
                      First
                    </button>
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
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
                            className={`w-8 h-8 rounded-lg text-sm ${
                              currentPage === pageNum
                                ? 'bg-pink-600 text-white'
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
                      className="px-3 py-1 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                    >
                      Next
                    </button>
                    <button
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
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
    </div>
  );

  if (showPreview) {
    return (
      <>
        <style>{`
          @media print {
            body * {
              visibility: hidden;
            }
            
            .print-area,
            .print-area * {
              visibility: visible;
            }
            
            .print-area {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
            }
            
            .no-print {
              display: none !important;
            }
          }
        `}</style>
        <div className="min-h-screen bg-white rounded-[14px] py-8 mb border border-gray-100">
          <div className="max-w-4xl mx-auto">
            <div className="no-print flex justify-between items-center mb-6">
              <button
                onClick={() => setShowPreview(false)}
                className="border text-indigo-500 border-blue-400  text-xs px-4 py-2 text-sm tracking-wide rounded-[14px] inter hover:bg-indigo-600
                 hover:text-white flex items-center gap-2"
              >
                ← Back to Edit
              </button>
              <div className="flex gap-2">
                <button
                  onClick={saveToHistory}
                  className="border text-green-600 text-xs border-green-400 px-4 py-2 text-sm tracking-wide rounded-[14px] inter hover:bg-green-600 hover:text-white flex items-center gap-2"
                >
                  <Save size={16} />
                  Save to History
                </button>
                <button
                  onClick={generatePDF}
                  className="border text-indigo-500 text-xs border-blue-400 px-4 py-2 text-sm tracking-wide rounded-[14px] inter hover:bg-indigo-600 hover:text-white flex items-center gap-2"
                >
                  <Download size={16} />
                  Print/Save PDF
                </button>
              </div>
            </div>
            <InvoicePreview />
          </div>
        </div>
      </>
    );
  }

  if (activeTab === 'history') {
    return <InvoiceHistoryTab />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="invoice-gradient backdrop-blur-lg shadow-sm border-b border-gray-500 rounded-[14px]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl aeon-bold text-white flex flex-row ">
                <span><img src={gen} className="w-12 mr-3 rounded-[4px]" /></span>
                Invoice Generator
              </h1>
              <p className="text-sm text-gray-400 tracking-wide inter mt-1 mb-10">Generate customers invoices - fast, simple, and accurate</p>
            </div>
            <div className="flex gap-2">
              {/* <button
                onClick={() => setActiveTab('history')}
                className="border border-purple-600 text-purple-200 text-xs px-6 py-2 inter rounded-[14px] hover:bg-purple-600 hover:border-purple-700 hover:text-white flex items-center gap-2 transform hover:scale-105 transition-all"
              >
                <History size={16} />
                View History ({invoiceHistory.length})
              </button> */}
              <button
                onClick={() => setShowPreview(true)}
                className="border border-pink-800 text-pink-200 text-xs px-6 py-2  
                inter rounded-[14px] hover:bg-green-600 hover:border-green-700 
                hover:text-white flex items-center gap-2 transform hover:scale-105 transition-all"
              >
                <Eye size={16} />
                Preview Invoice
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl bg-white mx-auto rounded-[14px] mt-8  shadow-sm">
        <div className="bg-white p-6 border border-purple-100 rounded-[14px]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <div>
              <h2 className="text-xl aeon-bold text-pink-600 mb-4">Company Information</h2>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Company Name"
                  value={invoice.company.name}
                  onChange={(e) => updateCompany('name', e.target.value)}
                  className="w-full p-3 inter border text-gray-700 bg-pink-50 border-purple-300 rounded-lg focus:outline-none focus:shadow-sm"
                />
                <input
                  type="text"
                  placeholder="Address"
                  value={invoice.company.address}
                  onChange={(e) => updateCompany('address', e.target.value)}
                  className="w-full p-3 border inter text-gray-700 bg-pink-50 border-purple-300 rounded-lg focus:outline-none focus:shadow-sm"
                />
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="City"
                    value={invoice.company.city}
                    onChange={(e) => updateCompany('city', e.target.value)}
                    className="w-full p-3 border inter text-gray-700 bg-pink-50 border-purple-300 rounded-lg focus:outline-none focus:shadow-sm"
                  />
                  <input
                    type="text"
                    placeholder="Zip Code"
                    value={invoice.company.zipCode}
                    onChange={(e) => updateCompany('zipCode', e.target.value)}
                    className="w-full p-3 border inter text-gray-700 bg-pink-50 border-purple-300 rounded-lg focus:outline-none focus:shadow-sm"
                  />
                </div>
                <input
                  type="text"
                  placeholder="Phone"
                  value={invoice.company.phone}
                  onChange={(e) => updateCompany('phone', e.target.value)}
                  className="w-full p-3 border inter text-gray-700 bg-pink-50 border-purple-300 rounded-lg focus:outline-none focus:shadow-sm"
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={invoice.company.email}
                  onChange={(e) => updateCompany('email', e.target.value)}
                  className="w-full p-3 border inter text-gray-700 bg-pink-50 border-purple-300 rounded-lg focus:outline-none focus:shadow-sm"
                />
                <input
                  type="text"
                  placeholder="Account Number for Payments"
                  value={invoice.accountName}
                  onChange={(e) => setInvoice(prev => ({ ...prev, accountNumber: e.target.value }))}
                  className="w-full p-3 inter border text-gray-700 bg-pink-50 border-purple-300 rounded-lg focus:outline-none focus:shadow-sm"
                />
             
              </div>
            </div>

            <div>
              <h2 className="text-xl aeon-bold mb-4 text-pink-600">Customer Information</h2>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Customer Name"
                  value={invoice.customer.name}
                  onChange={(e) => updateCustomer('name', e.target.value)}
                  className="w-full inter p-3 border text-gray-700 border-purple-300 rounded-lg focus:outline-none focus:shadow-sm"
                />
                <input
                  type="email"
                  placeholder="Customer Email"
                  value={invoice.customer.email}
                  onChange={(e) => updateCustomer('email', e.target.value)}
                  className="w-full inter p-3 border text-gray-700 border-purple-300 rounded-lg focus:outline-none focus:shadow-sm"
                />
                <input
                  type="text"
                  placeholder="Address"
                  value={invoice.customer.address}
                  onChange={(e) => updateCustomer('address', e.target.value)}
                  className="w-full inter p-3 border text-gray-700 border-purple-300 rounded-lg focus:outline-none focus:shadow-sm"
                />
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="City"
                    value={invoice.customer.city}
                    onChange={(e) => updateCustomer('city', e.target.value)}
                    className="w-full inter p-3 border text-gray-700 border-purple-300 rounded-lg focus:outline-none focus:shadow-sm"
                  />
                  <input
                    type="text"
                    placeholder="Zip Code"
                    value={invoice.customer.zipCode}
                    onChange={(e) => updateCustomer('zipCode', e.target.value)}
                    className="w-full inter p-3 border text-gray-700 border-purple-300 rounded-lg focus:outline-none focus:shadow-sm"
                  />
                </div>
                <input
                  type="text"
                  placeholder="Phone"
                  value={invoice.customer.phone}
                  onChange={(e) => updateCustomer('phone', e.target.value)}
                  className="w-full inter p-3 border text-gray-700 border-purple-300 rounded-lg focus:outline-none focus:shadow-sm"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div>
              <label className="block text-sm aeon-bold text-gray-700 mb-2">Invoice Number</label>
              <input
                type="text"
                value={invoice.invoiceNumber}
                onChange={(e) => setInvoice(prev => ({ ...prev, invoiceNumber: e.target.value }))}
                className="w-full p-3 inter border text-gray-600 text-sm border-purple-100 rounded-lg focus:outline-none focus:shadow-sm"
              />
            </div>
            <div>
              <label className="block text-sm aeon-bold text-gray-700 mb-2">Date</label>
              <input
                type="date"
                value={invoice.date}
                onChange={(e) => setInvoice(prev => ({ ...prev, date: e.target.value }))}
                className="w-full p-3 border inter text-gray-600 border-purple-100 rounded-lg focus:outline-none focus:shadow-sm"
              />
            </div>
            <div>
              <label className="block text-sm aeon-bold text-gray-700 mb-2">Due Date</label>
              <input
                type="date"
                value={invoice.dueDate}
                onChange={(e) => setInvoice(prev => ({ ...prev, dueDate: e.target.value }))}
                className="w-full p-3 border inter text-gray-600 border-purple-100 rounded-lg focus:outline-none focus:shadow-sm"
              />
            </div>
          </div>

          <div className="mb-8 py-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg  aeon-bold">Items</h2>
              <button
                onClick={addItem}
                className="border border-gray-500 text-gray-600 px-4 py-1 inter rounded-[14px] hover:bg-green-600
                 hover:border-green-600 hover:text-white flex text-xs items-center gap-2 transform hover:scale-105 transition-all"
              >
                <Plus size={16} />
                Add Item
              </button>
            </div>

            <div className="overflow-x-auto mb-6">
              <div className="rounded-lg border border-pink-100 overflow-hidden">
                <table className="w-full">
                  <thead className="">
                    <tr>
                      <th className="p-3 text-sm inter tracking-widest gray200 text-left">
                        Description
                      </th>
                      <th className="p-3 text-sm inter tracking-widest gray200 text-center w-24">
                        Quantity
                      </th>
                      <th className="p-3 text-sm inter tracking-widest gray200 text-center w-32">
                        Rate (₦)
                      </th>
                      <th className="p-3 text-sm inter tracking-widest gray200 text-center w-32">
                        Amount (₦)
                      </th>
                      <th className="p-3 text-sm inter tracking-widest gray200 text-center w-16">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {invoice.items.map((item) => (
                      <tr key={item.id} className="transition">
                        <td className="p-2">
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                            className="w-full p-2 border-0 tracking-widest text-xs gray200 focus:outline-none"
                            placeholder="Item description"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                            className="w-full p-2 border-0 inter text-sm text-gray-600 focus:outline-none text-center"
                            min="0"
                            step="0.01"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            value={item.rate}
                            onChange={(e) => updateItem(item.id, 'rate', parseFloat(e.target.value) || 0)}
                            className="w-full inter text-gray-600 text-sm p-2 border-0 focus:outline-none text-center"
                            min="0"
                            step="0.01"
                          />
                        </td>
                        <td className="p-3 inter text-gray-600 text-sm tracking-widest text-right">
                          ₦{item.amount.toFixed(2)}
                        </td>
                        <td className="p-2 text-center">
                          <button
                            onClick={() => removeItem(item.id)}
                            className="text-gray-600 hover:text-red-800"
                            disabled={invoice.items.length === 1}
                          ><div className='px-1 py-1 border border-pink-200 rounded-[4px] hover:bg-red-100 hover:text-red-500'>
                               <Trash2 size={15} />
                          </div>
                          
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="text-lg aeon-bold mb-4 text-gray-800 flex items-center gap-2">
                Additional Settings
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="inline-flex items-center justify-center mt-2 text-xs aeon-bold rounded-[14px] border border-blue-200 bg-blue-50 text-indigo-600 px-4 py-1 mb-2">
                    Tax Amount (₦)
                  </label>
                  <input
                    type="number"
                    value={invoice.taxAmount}
                    onChange={(e) => setInvoice(prev => ({ ...prev, taxAmount: parseFloat(e.target.value) || 0 }))}
                    className="w-full p-3 text-sm border inter border-gray-300 rounded-lg focus:outline-none focus:shadow-sm"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="inline-flex items-center justify-center mt-2 text-xs aeon-bold rounded-[14px] border border-blue-200 bg-blue-50 text-indigo-600 px-4 py-1 mb-2">
                    Discount Amount (₦)
                  </label>
                  <input
                    type="number"
                    value={invoice.discountAmount}
                    onChange={(e) => setInvoice(prev => ({ ...prev, discountAmount: parseFloat(e.target.value) || 0 }))}
                    className="w-full p-3 border text-sm inter border-gray-300 rounded-lg focus:outline-none focus:shadow-sm"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg aeon-bold mb-4 text-gray-800 flex items-center gap-2">
                Invoice Summary
              </h3>
              <div className="border border-gray-300 p-4 rounded-lg space-y-2">
                <div className="flex justify-between text-sm text-gray-700 tracking-widest">
                  <span>Subtotal:</span>
                  <span className="text-gray-800 inter text-sm">₦{calculateSubtotal().toFixed(2)}</span>
                </div>
                {invoice.discountAmount > 0 && (
                  <div className="flex justify-between inter text-sm text-gray-500">
                    <span>Discount:</span>
                    <span>-₦{calculateDiscount().toFixed(2)}</span>
                  </div>
                )}
                {invoice.taxAmount > 0 && (
                  <div className="flex justify-between inter text-sm text-gray-500">
                    <span>Tax:</span>
                    <span>₦{calculateTax().toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between  border-t border-gray-300 pt-2">
                  <span className="text-sm text-gray-700 tracking-widest">Total:</span>
                  <span className="aeon-bold tracking-widest gray200">₦{calculateTotal().toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <label className="inline-flex items-center justify-center mt-2 text-xs aeon-bold rounded-[14px] border
               border-blue-200 bg-blue-50 text-indigo-600 px-4 py-1 mb-2">
                Notes
              </label>
              <textarea
                value={invoice.notes}
                onChange={(e) => setInvoice(prev => ({ ...prev, notes: e.target.value }))}
                rows="4"
                className="w-full p-3 border inter text-sm text-gray-700 border-gray-300 rounded-[14px] focus:outline-none
                 focus:shadow-lg"
                placeholder="Additional notes or comments..."
              />
            </div>
            <div>
              <label className="inline-flex items-center justify-center mt-2 text-xs aeon-bold rounded-[14px] border border-blue-200 bg-blue-50 text-indigo-600 px-4 py-1 mb-2">
                Terms & Conditions
              </label>
              <textarea
                value={invoice.terms}
                onChange={(e) => setInvoice(prev => ({ ...prev, terms: e.target.value }))}
                rows="4"
                 className="w-full p-3 border inter text-sm text-gray-700 border-gray-300 rounded-[14px] focus:outline-none
                 focus:shadow-lg" 
                placeholder="Payment terms and conditions..."
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceGenerator;