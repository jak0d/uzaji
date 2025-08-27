import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Send, 
  Download, 
  Search,
  Filter,
  Calendar,
  DollarSign,
  User,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../hooks/useSettings';
import { InvoiceForm } from './InvoiceForm';

interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId?: string;
  customerName: string;
  customerEmail?: string;
  customerAddress?: string;
  invoiceDate: string;
  dueDate: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  items: InvoiceItem[];
  notes?: string;
  attachments?: string[];
  createdAt: string;
  updatedAt: string;
}

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  category: string;
}

interface InvoiceManagerProps {
  className?: string;
}

export function InvoiceManager({ className = '' }: InvoiceManagerProps) {
  const { formatCurrency, formatDate, getThemeClasses } = useSettings();
  const themeClasses = getThemeClasses();
  const navigate = useNavigate();
  
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    // Mock data for demonstration
    const mockInvoices: Invoice[] = [
      {
        id: '1',
        invoiceNumber: 'INV-2024-001',
        customerName: 'ABC Company',
        customerEmail: 'billing@abccompany.com',
        invoiceDate: '2024-01-15',
        dueDate: '2024-02-14',
        status: 'sent',
        subtotal: 1000,
        taxAmount: 100,
        totalAmount: 1100,
        items: [
          {
            id: '1',
            description: 'Consulting Services',
            quantity: 10,
            unitPrice: 100,
            totalPrice: 1000,
            category: 'Service'
          }
        ],
        notes: 'Thank you for your business!',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
    
    setInvoices(mockInvoices);
    setIsLoading(false);
  };

  const handleSaveInvoice = (invoiceData: Invoice) => {
    if (editingInvoice) {
      setInvoices(prev => prev.map(invoice => 
        invoice.id === editingInvoice.id ? { ...invoiceData, id: editingInvoice.id } : invoice
      ));
    } else {
      const newInvoice = { ...invoiceData, id: Date.now().toString() };
      setInvoices(prev => [...prev, newInvoice]);
    }
    setEditingInvoice(null);
  };

  const handleEditInvoice = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    setShowInvoiceForm(true);
  };

  const handleSendInvoice = (invoiceId: string) => {
    setInvoices(prev => prev.map(invoice => 
      invoice.id === invoiceId ? { ...invoice, status: 'sent' as const, updatedAt: new Date().toISOString() } : invoice
    ));
  };

  const handleMarkAsPaid = (invoiceId: string) => {
    setInvoices(prev => prev.map(invoice => 
      invoice.id === invoiceId ? { ...invoice, status: 'paid' as const, updatedAt: new Date().toISOString() } : invoice
    ));
  };

  const getStatusIcon = (status: Invoice['status']) => {
    switch (status) {
      case 'draft':
        return <FileText className="w-4 h-4 text-gray-500" />;
      case 'sent':
        return <Send className="w-4 h-4 text-blue-500" />;
      case 'paid':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'overdue':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: Invoice['status']) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'sent':
        return 'bg-blue-100 text-blue-800';
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.customerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className={`${themeClasses.cardBackground} rounded-lg shadow-sm p-8`}>
        <div className="flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin mr-3" />
          <span className={themeClasses.textSecondary}>Loading invoices...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className={`text-2xl font-bold ${themeClasses.text}`}>
            Invoices
          </h1>
          <p className={`${themeClasses.textSecondary} mt-1`}>
            Create, send, and track your invoices
          </p>
        </div>
        <button 
          onClick={() => {
            setEditingInvoice(null);
            setShowInvoiceForm(true);
          }}
          className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-sm hover:shadow-md"
        >
          <Plus className="w-4 h-4" />
          <span>Create Invoice</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${themeClasses.cardBackground}`}
            placeholder="Search invoices..."
          />
        </div>
        
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className={`px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${themeClasses.cardBackground}`}
        >
          <option value="all">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="sent">Sent</option>
          <option value="paid">Paid</option>
          <option value="overdue">Overdue</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Invoice List */}
      <div className={`${themeClasses.cardBackground} rounded-lg shadow-sm border ${themeClasses.border}`}>
        {filteredInvoices.length === 0 ? (
          <div className="p-8 text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className={`text-lg font-medium ${themeClasses.text} mb-2`}>
              No invoices found
            </h3>
            <p className={`${themeClasses.textSecondary} mb-4`}>
              {invoices.length === 0 
                ? 'Create your first invoice to start billing customers.'
                : 'No invoices match your current filters.'
              }
            </p>
            {invoices.length === 0 && (
              <button
                onClick={() => {
                  setEditingInvoice(null);
                  setShowInvoiceForm(true);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create First Invoice
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className={`px-6 py-3 text-left text-xs font-medium ${themeClasses.textSecondary} uppercase tracking-wider`}>
                    Invoice
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium ${themeClasses.textSecondary} uppercase tracking-wider`}>
                    Customer
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium ${themeClasses.textSecondary} uppercase tracking-wider`}>
                    Issue Date
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium ${themeClasses.textSecondary} uppercase tracking-wider`}>
                    Due Date
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium ${themeClasses.textSecondary} uppercase tracking-wider`}>
                    Amount
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium ${themeClasses.textSecondary} uppercase tracking-wider`}>
                    Status
                  </th>
                  <th className={`px-6 py-3 text-center text-xs font-medium ${themeClasses.textSecondary} uppercase tracking-wider`}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredInvoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${themeClasses.text}`}>
                      {invoice.invoiceNumber}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${themeClasses.text}`}>
                      <div>
                        <p className="font-medium">{invoice.customerName}</p>
                        {invoice.customerEmail && (
                          <p className={`text-xs ${themeClasses.textSecondary}`}>{invoice.customerEmail}</p>
                        )}
                      </div>
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${themeClasses.textSecondary}`}>
                      {formatDate(invoice.invoiceDate)}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${themeClasses.textSecondary}`}>
                      {formatDate(invoice.dueDate)}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${themeClasses.text}`}>
                      {formatCurrency(invoice.totalAmount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                        {getStatusIcon(invoice.status)}
                        <span className="capitalize">{invoice.status}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <button 
                          className={`p-1 ${themeClasses.textSecondary} hover:${themeClasses.text} rounded transition-colors`}
                          title="View Invoice"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleEditInvoice(invoice)}
                          className={`p-1 ${themeClasses.textSecondary} hover:${themeClasses.text} rounded transition-colors`}
                          title="Edit Invoice"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          className={`p-1 ${themeClasses.textSecondary} hover:${themeClasses.text} rounded transition-colors`}
                          title="Download PDF"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        {invoice.status === 'draft' && (
                          <button 
                            onClick={() => handleSendInvoice(invoice.id)}
                            className={`p-1 text-blue-600 hover:text-blue-700 rounded transition-colors`}
                            title="Send Invoice"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                        )}
                        {invoice.status === 'sent' && (
                          <button 
                            onClick={() => handleMarkAsPaid(invoice.id)}
                            className={`p-1 text-green-600 hover:text-green-700 rounded transition-colors`}
                            title="Mark as Paid"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      {invoices.length > 0 && (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className={`${themeClasses.cardBackground} rounded-lg shadow-sm p-4 border ${themeClasses.border}`}>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className={`text-sm ${themeClasses.textSecondary}`}>Total Invoices</p>
                <p className={`text-lg font-bold ${themeClasses.text}`}>{invoices.length}</p>
              </div>
            </div>
          </div>
          
          <div className={`${themeClasses.cardBackground} rounded-lg shadow-sm p-4 border ${themeClasses.border}`}>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className={`text-sm ${themeClasses.textSecondary}`}>Paid</p>
                <p className="text-lg font-bold text-green-600">
                  {formatCurrency(invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.totalAmount, 0))}
                </p>
              </div>
            </div>
          </div>
          
          <div className={`${themeClasses.cardBackground} rounded-lg shadow-sm p-4 border ${themeClasses.border}`}>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className={`text-sm ${themeClasses.textSecondary}`}>Pending</p>
                <p className="text-lg font-bold text-yellow-600">
                  {formatCurrency(invoices.filter(i => i.status === 'sent').reduce((sum, i) => sum + i.totalAmount, 0))}
                </p>
              </div>
            </div>
          </div>
          
          <div className={`${themeClasses.cardBackground} rounded-lg shadow-sm p-4 border ${themeClasses.border}`}>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className={`text-sm ${themeClasses.textSecondary}`}>Overdue</p>
                <p className="text-lg font-bold text-red-600">
                  {formatCurrency(invoices.filter(i => i.status === 'overdue').reduce((sum, i) => sum + i.totalAmount, 0))}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Form Modal */}
      <InvoiceForm
        isOpen={showInvoiceForm}
        onClose={() => {
          setShowInvoiceForm(false);
          setEditingInvoice(null);
        }}
        invoice={editingInvoice}
        onSave={handleSaveInvoice}
      />
    </div>
  );
}