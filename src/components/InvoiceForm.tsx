import { useState, useEffect } from 'react';
import { 
  X, 
  Plus, 
  Trash2, 
  Save,
  Send,
  Package,
  Briefcase
} from 'lucide-react';
import { useSettings } from '../hooks/useSettings';
import { Invoice, InvoiceItem, Product, getProducts } from '../utils/database';
import { Combobox } from './Combobox';

interface InvoiceFormProps {
  isOpen: boolean;
  onClose: () => void;
  invoice?: Invoice | null;
  onSave: (invoice: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>) => void;
}

export function InvoiceForm({ isOpen, onClose, invoice, onSave }: InvoiceFormProps) {
  const { formatCurrency, getThemeClasses } = useSettings();
  const themeClasses = getThemeClasses();

  const [formData, setFormData] = useState<Invoice>({
    id: '', // Will be set by the database
    invoiceNumber: '',
    customerName: '',
    customerEmail: '',
    customerAddress: '',
    invoiceDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'draft',
    subtotal: 0,
    taxAmount: 0,
    totalAmount: 0,
    items: [],
    notes: '',
    createdAt: '', // Will be set by the database
    updatedAt: '', // Will be set by the database
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [products, setProducts] = useState<Product[]>([]);

  const productOptions = [
    {
      label: 'Products',
      options: products.filter(p => p.type === 'product').map(p => ({ value: p.id, label: p.name })),
      icon: <Package className="w-4 h-4" />
    },
    {
      label: 'Services',
      options: products.filter(p => p.type === 'service').map(p => ({ value: p.id, label: p.name })),
      icon: <Briefcase className="w-4 h-4" />
    }
  ].filter(group => group.options.length > 0);

  useEffect(() => {
    if (invoice) {
      setFormData(invoice);
    } else {
      // Generate invoice number
      const invoiceNumber = `INV-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
      setFormData(prev => ({ ...prev, invoiceNumber }));
    }

    const fetchProducts = async () => {
      try {
        const fetchedProducts = await getProducts();
        setProducts(fetchedProducts);
      } catch (error) {
        console.error('Failed to fetch products:', error);
      }
    };

    if (isOpen) {
      fetchProducts();
    }
  }, [invoice, isOpen]);

  const addItem = () => {
    const newItem: InvoiceItem = {
      id: Date.now().toString(),
      description: '',
      quantity: 1,
      unitPrice: 0,
      totalPrice: 0,
      category: 'Service'
    };
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));
  };

  const updateItem = (itemId: string, updates: Partial<InvoiceItem>) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map(item => {
        if (item.id === itemId) {
          const updatedItem = { ...item, ...updates };
          if (updates.quantity !== undefined || updates.unitPrice !== undefined) {
            updatedItem.totalPrice = updatedItem.quantity * updatedItem.unitPrice;
          }
          return updatedItem;
        }
        return item;
      })
    }));
  };

  const handleItemSelection = (itemId: string, description: string) => {
    const selectedProduct = products.find(p => p.name === description);
    if (selectedProduct) {
      updateItem(itemId, { 
        description: selectedProduct.name,
        unitPrice: selectedProduct.price,
        category: selectedProduct.category || 'Service'
      });
    } else {
      updateItem(itemId, { description });
    }
  };

  const removeItem = (itemId: string) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== itemId)
    }));
  };

  useEffect(() => {
    const subtotal = formData.items.reduce((sum, item) => sum + item.totalPrice, 0);
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

    if (!formData.customerName.trim()) {
      newErrors.customerName = 'Customer name is required';
    }

    if (!formData.invoiceDate) {
      newErrors.invoiceDate = 'Invoice date is required';
    }

    if (!formData.dueDate) {
      newErrors.dueDate = 'Due date is required';
    }

    if (formData.items.length === 0) {
      newErrors.items = 'At least one item is required';
    }

    formData.items.forEach((item, index) => {
      if (!item.description.trim()) {
        newErrors[`item_${index}_description`] = 'Description is required';
      }
      if (item.quantity <= 0) {
        newErrors[`item_${index}_quantity`] = 'Quantity must be greater than 0';
      }
      if (item.unitPrice < 0) {
        newErrors[`item_${index}_unitPrice`] = 'Unit price cannot be negative';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = (status: 'draft' | 'sent' = 'draft') => {
    if (!validateForm()) return;

    const { id, createdAt, updatedAt, ...invoiceToSave } = {
      ...formData,
      status,
    };

    onSave(invoiceToSave);
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
              {invoice ? 'Edit Invoice' : 'Create New Invoice'}
            </h2>
            <p className={`text-sm ${themeClasses.textSecondary} mt-1`}>
              {formData.invoiceNumber}
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
            {/* Customer Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium ${themeClasses.text} mb-2`}>
                  Customer Name *
                </label>
                <input
                  type="text"
                  value={formData.customerName}
                  onChange={(e) => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${themeClasses.cardBackground} ${errors.customerName ? 'border-red-500' : ''}`}
                  placeholder="Enter customer name"
                />
                {errors.customerName && (
                  <p className="text-red-500 text-xs mt-1">{errors.customerName}</p>
                )}
              </div>

              <div>
                <label className={`block text-sm font-medium ${themeClasses.text} mb-2`}>
                  Customer Email
                </label>
                <input
                  type="email"
                  value={formData.customerEmail || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, customerEmail: e.target.value }))}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${themeClasses.cardBackground}`}
                  placeholder="customer@example.com"
                />
              </div>
            </div>

            {/* Customer Address */}
            <div>
              <label className={`block text-sm font-medium ${themeClasses.text} mb-2`}>
                Customer Address
              </label>
              <textarea
                value={formData.customerAddress || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, customerAddress: e.target.value }))}
                className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${themeClasses.cardBackground}`}
                rows={2}
                placeholder="Customer billing address"
              />
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium ${themeClasses.text} mb-2`}>
                  Invoice Date *
                </label>
                <input
                  type="date"
                  value={formData.invoiceDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, invoiceDate: e.target.value }))}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${themeClasses.cardBackground} ${errors.invoiceDate ? 'border-red-500' : ''}`}
                />
                {errors.invoiceDate && (
                  <p className="text-red-500 text-xs mt-1">{errors.invoiceDate}</p>
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
                  Invoice Items *
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
                {formData.items.map((item, index) => (
                  <div key={item.id} className={`border border-gray-200 dark:border-gray-700 rounded-lg p-4 ${themeClasses.cardBackground}`}>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                      <div className="md:col-span-2">
                        <Combobox
                          options={productOptions}
                          value={item.description}
                          onChange={(value) => handleItemSelection(item.id, value)}
                          placeholder="Select or type an item"
                          className={`w-full ${errors[`item_${index}_description`] ? 'border-red-500' : ''}`}
                        />
                        {errors[`item_${index}_description`] && (
                          <p className="text-red-500 text-xs mt-1">{errors[`item_${index}_description`]}</p>
                        )}
                      </div>

                      <div>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateItem(item.id, { quantity: parseFloat(e.target.value) || 0 })}
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
                          onChange={(e) => updateItem(item.id, { unitPrice: parseFloat(e.target.value) || 0 })}
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
                  <span className={themeClasses.text}>{formatCurrency(formData.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className={themeClasses.textSecondary}>Tax (10%):</span>
                  <span className={themeClasses.text}>{formatCurrency(formData.taxAmount)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t border-gray-200 dark:border-gray-700 pt-2">
                  <span className={themeClasses.text}>Total:</span>
                  <span className={themeClasses.text}>{formatCurrency(formData.totalAmount)}</span>
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
            onClick={() => handleSave('sent')}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all"
          >
            <Send className="w-4 h-4" />
            <span>Save & Send</span>
          </button>
        </div>
      </div>
    </div>
  );
}