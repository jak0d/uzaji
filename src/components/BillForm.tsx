import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  Calendar,
  Building,
  FileText,
  DollarSign,
  Save,
  Send
} from 'lucide-react';
import { useSettings } from '../hooks/useSettings';
import { addBill, updateBill } from '../utils/database';

interface BillItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  category: string;
}

interface Bill {
  id?: string;
  billNumber: string;
  vendorId?: string;
  vendorName: string;
  vendorEmail?: string;
  billDate: string;
  dueDate: string;
  status: 'draft' | 'pending' | 'paid' | 'overdue' | 'cancelled';
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  items: BillItem[];
  notes?: string;
  attachments?: string[];
  createdAt?: string;
  updatedAt?: string;
}

interface BillFormProps {
  isOpen: boolean;
  onClose: () => void;
  bill?: Bill | null;
  onSave: (bill: Bill) => void;
}

export function BillForm({ isOpen, onClose, bill, onSave }: BillFormProps) {
  const { formatCurrency, getThemeClasses } = useSettings();
  const themeClasses = getThemeClasses();

  const [formData, setFormData] = useState<Partial<Bill>>({
    billNumber: '',
    vendorName: '',
    vendorEmail: '',
    billDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'draft',
    subtotal: 0,
    taxAmount: 0,
    totalAmount: 0,
    items: [],
    notes: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (bill) {
      setFormData(bill);
    } else {
      // Generate bill number
      const billNumber = `BILL-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
      setFormData({
        billNumber,
        vendorName: '',
        vendorEmail: '',
        billDate: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'draft' as const,
        subtotal: 0,
        taxAmount: 0,
        totalAmount: 0,
        items: [],
        notes: ''
      });
    }
  }, [bill]);

  const addItem = () => {
    const newItem: BillItem = {
      id: Date.now().toString(),
      description: '',
      quantity: 1,
      unitPrice: 0,
      totalPrice: 0,
      category: 'General'
    };
    setFormData(prev => ({
      ...prev,
      items: [...(prev.items || []), newItem]
    }));
  };

  const updateItem = (itemId: string, field: keyof BillItem, value: any) => {
    setFormData(prev => ({
      ...prev,
      items: (prev.items || []).map(item => {
        if (item.id === itemId) {
          const updatedItem = { ...item, [field]: value };
          if (field === 'quantity' || field === 'unitPrice') {
            updatedItem.totalPrice = (updatedItem.quantity || 0) * (updatedItem.unitPrice || 0);
          }
          return updatedItem;
        }
        return item;
      }) as BillItem[]
    }));
  };

  const removeItem = (itemId: string) => {
    setFormData(prev => ({
      ...prev,
      items: (prev.items || []).filter(item => item.id !== itemId)
    }));
  };

  useEffect(() => {
    const subtotal = (formData.items || []).reduce((sum, item) => sum + (item.totalPrice || 0), 0);
    const taxAmount = subtotal * 0.1; // 10% tax rate
    const totalAmount = subtotal + taxAmount;

    setFormData(prev => ({
      ...prev,
      subtotal,
      taxAmount,
      totalAmount
    }));
  }, [formData.items]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.vendorName?.trim()) {
      newErrors.vendorName = 'Vendor name is required';
    }

    if (!formData.billDate) {
      newErrors.billDate = 'Bill date is required';
    }

    if (!formData.dueDate) {
      newErrors.dueDate = 'Due date is required';
    }

    if ((formData.items || []).length === 0) {
      newErrors.items = 'At least one item is required';
    }

    (formData.items || []).forEach((item, index) => {
      if (!item.description?.trim()) {
        newErrors[`item_${index}_description`] = 'Description is required';
      }
      if ((item.quantity || 0) <= 0) {
        newErrors[`item_${index}_quantity`] = 'Quantity must be greater than 0';
      }
      if ((item.unitPrice || 0) < 0) {
        newErrors[`item_${index}_unitPrice`] = 'Unit price cannot be negative';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async (status: 'draft' | 'pending' = 'draft') => {
    if (!validateForm()) return;

    const now = new Date().toISOString();
    const billData: Omit<Bill, 'id' | 'createdAt' | 'updatedAt'> = {
      ...formData,
      status,
      items: formData.items || [],
      subtotal: formData.subtotal || 0,
      taxAmount: formData.taxAmount || 0,
      totalAmount: formData.totalAmount || 0,
      notes: formData.notes || '',
    } as Omit<Bill, 'id' | 'createdAt' | 'updatedAt'>;

    try {
      if (bill && bill.id) {
        // Update existing bill
        const updatedBill: Bill = {
          ...billData,
          id: bill.id,
          createdAt: bill.createdAt || now,
          updatedAt: now,
        };
        await updateBill(bill.id, updatedBill);
        onSave(updatedBill);
      } else {
        // Create new bill
        const newBillData: Omit<Bill, 'id'> = {
          ...billData,
          createdAt: now,
          updatedAt: now,
        };
        const newId = await addBill(newBillData);
        const savedBill: Bill = {
          ...newBillData,
          id: newId,
        };
        onSave(savedBill);
      }
    } catch (error) {
      console.error('Failed to save bill:', error);
      // Fallback for UI consistency
      const fallbackBill: Bill = {
        ...billData,
        id: bill?.id || Date.now().toString(),
        createdAt: now,
        updatedAt: now,
      };
      onSave(fallbackBill);
    }

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`${themeClasses.cardBackground} rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden`}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className={`text-xl font-bold ${themeClasses.text}`}>
              {bill ? 'Edit Bill' : 'Create New Bill'}
            </h2>
            <p className={`text-sm ${themeClasses.textSecondary} mt-1`}>
              {formData.billNumber || ''}
            </p>
          </div>
          <button
            onClick={onClose}
            className={`p-2 ${themeClasses.textSecondary} hover:${themeClasses.text} rounded-lg transition-colors`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="p-6 space-y-6">
            {/* Vendor Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium ${themeClasses.text} mb-2`}>
                  Vendor Name *
                </label>
                <input
                  type="text"
                  value={formData.vendorName}
                  onChange={(e) => setFormData(prev => ({ ...prev, vendorName: e.target.value }))}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${themeClasses.cardBackground} ${errors.vendorName ? 'border-red-500' : ''}`}
                  placeholder="Enter vendor name"
                />
                {errors.vendorName && (
                  <p className="text-red-500 text-xs mt-1">{errors.vendorName}</p>
                )}
              </div>

              <div>
                <label className={`block text-sm font-medium ${themeClasses.text} mb-2`}>
                  Vendor Email
                </label>
                <input
                  type="email"
                  value={formData.vendorEmail || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, vendorEmail: e.target.value }))}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${themeClasses.cardBackground}`}
                  placeholder="vendor@example.com"
                />
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium ${themeClasses.text} mb-2`}>
                  Bill Date *
                </label>
                <input
                  type="date"
                  value={formData.billDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, billDate: e.target.value }))}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${themeClasses.cardBackground} ${errors.billDate ? 'border-red-500' : ''}`}
                />
                {errors.billDate && (
                  <p className="text-red-500 text-xs mt-1">{errors.billDate}</p>
                )}
              </div>

              <div>
                <label className={`block text-sm font-medium ${themeClasses.text} mb-2`}>
                  Due Date *
                </label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${themeClasses.cardBackground} ${errors.dueDate ? 'border-red-500' : ''}`}
                />
                {errors.dueDate && (
                  <p className="text-red-500 text-xs mt-1">{errors.dueDate}</p>
                )}
              </div>
            </div>

            {/* Items */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <label className={`block text-sm font-medium ${themeClasses.text}`}>
                  Bill Items *
                </label>
                <button
                  onClick={addItem}
                  className="flex items-center space-x-2 px-3 py-1 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Item</span>
                </button>
              </div>

              {errors.items && (
                <p className="text-red-500 text-xs mb-2">{errors.items}</p>
              )}

              <div className="space-y-3">
                {(formData.items || []).map((item, index) => (
                  <div key={item.id} className={`border border-gray-200 dark:border-gray-700 rounded-lg p-4 ${themeClasses.cardBackground}`}>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                      <div className="md:col-span-2">
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                          className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${themeClasses.cardBackground} ${errors[`item_${index}_description`] ? 'border-red-500' : ''}`}
                          placeholder="Item description"
                        />
                        {errors[`item_${index}_description`] && (
                          <p className="text-red-500 text-xs mt-1">{errors[`item_${index}_description`]}</p>
                        )}
                      </div>

                      <div>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                          className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${themeClasses.cardBackground} ${errors[`item_${index}_quantity`] ? 'border-red-500' : ''}`}
                          placeholder="Qty"
                          min="0"
                          step="0.01"
                        />
                        {errors[`item_${index}_quantity`] && (
                          <p className="text-red-500 text-xs mt-1">{errors[`item_${index}_quantity`]}</p>
                        )}
                      </div>

                      <div>
                        <input
                          type="number"
                          value={item.unitPrice}
                          onChange={(e) => updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                          className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${themeClasses.cardBackground} ${errors[`item_${index}_unitPrice`] ? 'border-red-500' : ''}`}
                          placeholder="Price"
                          min="0"
                          step="0.01"
                        />
                        {errors[`item_${index}_unitPrice`] && (
                          <p className="text-red-500 text-xs mt-1">{errors[`item_${index}_unitPrice`]}</p>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <span className={`font-medium ${themeClasses.text}`}>
                          {formatCurrency(item.totalPrice)}
                        </span>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="p-1 text-red-500 hover:text-red-700 rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className={`block text-sm font-medium ${themeClasses.text} mb-2`}>
                Notes
              </label>
              <textarea
                value={formData.notes || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${themeClasses.cardBackground}`}
                rows={3}
                placeholder="Additional notes..."
              />
            </div>

            {/* Totals */}
            <div className={`border-t border-gray-200 dark:border-gray-700 pt-4`}>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className={themeClasses.textSecondary}>Subtotal:</span>
                  <span className={themeClasses.text}>{formatCurrency(formData.subtotal || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className={themeClasses.textSecondary}>Tax (10%):</span>
                  <span className={themeClasses.text}>{formatCurrency(formData.taxAmount || 0)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t border-gray-200 dark:border-gray-700 pt-2">
                  <span className={themeClasses.text}>Total:</span>
                  <span className={themeClasses.text}>{formatCurrency(formData.totalAmount || 0)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className={`px-4 py-2 border border-gray-300 rounded-lg ${themeClasses.textSecondary} hover:${themeClasses.text} transition-colors`}
          >
            Cancel
          </button>
          <button
            onClick={() => handleSave('draft')}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>Save Draft</span>
          </button>
          <button
            onClick={() => handleSave('pending')}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all"
          >
            <Send className="w-4 h-4" />
            <span>Save & Submit</span>
          </button>
        </div>
      </div>
    </div>
  );
}