import React, { useState, useEffect, useCallback } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Search,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle
} from 'lucide-react';
import { useSettings } from '../hooks/useSettings';
import { BillForm } from './BillForm';
import {
  getBills,
  addBill,
  updateBill,
  deleteBill,
  Bill,
  addTransaction
} from '../utils/database';

interface BillManagerProps {
  className?: string;
}

export function BillManager({ className = '' }: BillManagerProps) {
  const { formatCurrency, formatDate, getThemeClasses } = useSettings();
  const themeClasses = getThemeClasses();
  
  const [bills, setBills] = useState<Bill[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showBillForm, setShowBillForm] = useState(false);
  const [editingBill, setEditingBill] = useState<Bill | null>(null);

  const loadBills = useCallback(async () => {
    setIsLoading(true);
    try {
      const fetchedBills = await getBills();
      setBills(fetchedBills);
    } catch (error) {
      console.error("Failed to load bills:", error);
      // You might want to show an error message to the user
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBills();
  }, [loadBills]);

  const handleSaveBill = async (billData: Omit<Bill, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingBill) {
      await updateBill(editingBill.id, billData);
    } else {
      await addBill(billData);
    }
    setEditingBill(null);
    loadBills();
  };

  const handleEditBill = (bill: Bill) => {
    setEditingBill(bill);
    setShowBillForm(true);
  };

  const handleDeleteBill = async (billId: string) => {
    if (window.confirm('Are you sure you want to delete this bill?')) {
      await deleteBill(billId);
      loadBills();
    }
  };

  const handleMarkAsPaid = async (billId: string) => {
    await updateBill(billId, { status: 'paid' });
    const paidBill = bills.find(b => b.id === billId);
    if (paidBill) {
      await addTransaction({
        date: new Date().toISOString().split('T')[0],
        description: `Payment for Bill ${paidBill.billNumber} from ${paidBill.vendorName}`,
        amount: paidBill.totalAmount,
        type: 'expense',
        category: 'Bill Payment',
        vendor: paidBill.vendorName,
        account: 'Default Account', // Or choose a relevant account
        encrypted: false,
      });
    }
    loadBills();
  };

  const getStatusIcon = (status: Bill['status']) => {
    switch (status) {
      case 'draft':
        return <FileText className="w-4 h-4 text-gray-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'paid':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'overdue':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: Bill['status']) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredBills = bills.filter(bill => {
    const matchesSearch = bill.billNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         bill.vendorName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || bill.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className={`${themeClasses.cardBackground} rounded-lg shadow-sm p-8`}>
        <div className="flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin mr-3" />
          <span className={themeClasses.textSecondary}>Loading bills...</span>
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
            Bills
          </h1>
          <p className={`${themeClasses.textSecondary} mt-1`}>
            Track and manage your vendor bills
          </p>
        </div>
        <button 
          onClick={() => {
            setEditingBill(null);
            setShowBillForm(true);
          }}
          className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all shadow-sm hover:shadow-md"
        >
          <Plus className="w-4 h-4" />
          <span>Add Bill</span>
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
            className={`w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${themeClasses.cardBackground}`}
            placeholder="Search bills..."
          />
        </div>
        
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className={`px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${themeClasses.cardBackground}`}
        >
          <option value="all">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="pending">Pending</option>
          <option value="paid">Paid</option>
          <option value="overdue">Overdue</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Bill List */}
      <div className={`${themeClasses.cardBackground} rounded-lg shadow-sm border ${themeClasses.border}`}>
        {filteredBills.length === 0 ? (
          <div className="p-8 text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className={`text-lg font-medium ${themeClasses.text} mb-2`}>
              No bills found
            </h3>
            <p className={`${themeClasses.textSecondary} mb-4`}>
              {bills.length === 0 
                ? 'Add your first bill to start tracking vendor payments.'
                : 'No bills match your current filters.'
              }
            </p>
            {bills.length === 0 && (
              <button
                onClick={() => {
                  setEditingBill(null);
                  setShowBillForm(true);
                }}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Add First Bill
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className={`px-6 py-3 text-left text-xs font-medium ${themeClasses.textSecondary} uppercase tracking-wider`}>
                    Bill Number
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium ${themeClasses.textSecondary} uppercase tracking-wider`}>
                    Vendor
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium ${themeClasses.textSecondary} uppercase tracking-wider`}>
                    Bill Date
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
                {filteredBills.map((bill) => (
                  <tr key={bill.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${themeClasses.text}`}>
                      {bill.billNumber}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${themeClasses.text}`}>
                      <div>
                        <p className="font-medium">{bill.vendorName}</p>
                        {bill.vendorEmail && (
                          <p className={`text-xs ${themeClasses.textSecondary}`}>{bill.vendorEmail}</p>
                        )}
                      </div>
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${themeClasses.textSecondary}`}>
                      {formatDate(bill.billDate)}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${themeClasses.textSecondary}`}>
                      {formatDate(bill.dueDate)}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${themeClasses.text}`}>
                      {formatCurrency(bill.totalAmount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(bill.status)}`}>
                        {getStatusIcon(bill.status)}
                        <span className="capitalize">{bill.status}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <button 
                          className={`p-1 ${themeClasses.textSecondary} hover:${themeClasses.text} rounded transition-colors`}
                          title="View Bill"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleEditBill(bill)}
                          className={`p-1 ${themeClasses.textSecondary} hover:${themeClasses.text} rounded transition-colors`}
                          title="Edit Bill"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteBill(bill.id)}
                          className={`p-1 text-red-600 hover:text-red-700 rounded transition-colors`}
                          title="Delete Bill"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        {bill.status === 'pending' && (
                          <button 
                            onClick={() => handleMarkAsPaid(bill.id)}
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
      {bills.length > 0 && (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className={`${themeClasses.cardBackground} rounded-lg shadow-sm p-4 border ${themeClasses.border}`}>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className={`text-sm ${themeClasses.textSecondary}`}>Total Bills</p>
                <p className={`text-lg font-bold ${themeClasses.text}`}>{bills.length}</p>
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
                  {formatCurrency(bills.filter(b => b.status === 'paid').reduce((sum, b) => sum + b.totalAmount, 0))}
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
                  {formatCurrency(bills.filter(b => b.status === 'pending').reduce((sum, b) => sum + b.totalAmount, 0))}
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
                  {formatCurrency(bills.filter(b => b.status === 'overdue').reduce((sum, b) => sum + b.totalAmount, 0))}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bill Form Modal */}
      <BillForm
        isOpen={showBillForm}
        onClose={() => {
          setShowBillForm(false);
          setEditingBill(null);
        }}
        bill={editingBill}
        onSave={handleSaveBill}
      />
    </div>
  );
}