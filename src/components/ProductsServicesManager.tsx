import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Package, 
  DollarSign, 
  Tag, 
  Search,
  Filter,
  ArrowLeft,
  Check,
  X,
  AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../hooks/useSettings';
import { 
  getProducts, 
  getServices, 
  addProduct, 
  addService, 
  updateProduct, 
  updateService, 
  deleteProduct, 
  deleteService 
} from '../utils/database';
import { getBusinessType } from '../utils/businessConfig';
import type { Product, Service } from '../utils/database';

interface ProductsServicesManagerProps {
  className?: string;
}

interface ProductFormData {
  name: string;
  description: string;
  price: number;
  category: string;
}

interface ServiceFormData {
  name: string;
  description: string;
  hourlyRate: number;
  category: string;
}

interface FormErrors {
  name?: string;
  description?: string;
  price?: string;
  hourlyRate?: string;
  category?: string;
}

export function ProductsServicesManager({ className = '' }: ProductsServicesManagerProps) {
  const { formatCurrency, getThemeClasses } = useSettings();
  const themeClasses = getThemeClasses();
  const navigate = useNavigate();
  
  const [businessType, setBusinessType] = useState<'general' | 'legal'>('general');
  const [activeTab, setActiveTab] = useState<'products' | 'services'>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Form states
  const [showProductForm, setShowProductForm] = useState(false);
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [productForm, setProductForm] = useState<ProductFormData>({
    name: '',
    description: '',
    price: 0,
    category: ''
  });
  
  const [serviceForm, setServiceForm] = useState<ServiceFormData>({
    name: '',
    description: '',
    hourlyRate: 0,
    category: ''
  });
  
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const [productsData, servicesData, businessTypeData] = await Promise.all([
        getProducts(),
        getServices(),
        getBusinessType()
      ]);
      
      setProducts(productsData);
      setServices(servicesData);
      if (businessTypeData) {
        setBusinessType(businessTypeData);
        // Set default tab based on business type
        if (businessTypeData === 'legal') {
          setActiveTab('services');
        }
      }
    } catch (err) {
      console.error('Failed to load data:', err);
      setError('Failed to load products and services');
    } finally {
      setIsLoading(false);
    }
  };

  const validateProductForm = (): boolean => {
    const errors: FormErrors = {};
    
    if (!productForm.name.trim()) {
      errors.name = 'Product name is required';
    } else if (productForm.name.trim().length < 2) {
      errors.name = 'Product name must be at least 2 characters';
    }
    
    if (!productForm.description.trim()) {
      errors.description = 'Description is required';
    }
    
    if (!productForm.price || productForm.price <= 0) {
      errors.price = 'Price must be greater than 0';
    }
    
    if (!productForm.category.trim()) {
      errors.category = 'Category is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateServiceForm = (): boolean => {
    const errors: FormErrors = {};
    
    if (!serviceForm.name.trim()) {
      errors.name = 'Service name is required';
    } else if (serviceForm.name.trim().length < 2) {
      errors.name = 'Service name must be at least 2 characters';
    }
    
    if (!serviceForm.description.trim()) {
      errors.description = 'Description is required';
    }
    
    if (!serviceForm.hourlyRate || serviceForm.hourlyRate <= 0) {
      errors.hourlyRate = 'Hourly rate must be greater than 0';
    }
    
    if (!serviceForm.category.trim()) {
      errors.category = 'Category is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateProductForm()) return;

    setIsSubmitting(true);
    try {
      const productData = {
        name: productForm.name.trim(),
        description: productForm.description.trim(),
        price: productForm.price,
        category: productForm.category.trim(),
        encrypted: false
      };

      if (editingProduct) {
        await updateProduct(editingProduct.id, productData);
        setProducts(prev => prev.map(p => 
          p.id === editingProduct.id ? { ...p, ...productData, updatedAt: new Date().toISOString() } : p
        ));
      } else {
        const id = await addProduct(productData);
        const newProduct: Product = {
          ...productData,
          id,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        setProducts(prev => [...prev, newProduct]);
      }

      resetProductForm();
    } catch (error) {
      console.error('Failed to save product:', error);
      setFormErrors({ name: 'Failed to save product. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleServiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateServiceForm()) return;

    setIsSubmitting(true);
    try {
      const serviceData = {
        name: serviceForm.name.trim(),
        description: serviceForm.description.trim(),
        hourlyRate: serviceForm.hourlyRate,
        category: serviceForm.category.trim(),
        encrypted: false
      };

      if (editingService) {
        await updateService(editingService.id, serviceData);
        setServices(prev => prev.map(s => 
          s.id === editingService.id ? { ...s, ...serviceData, updatedAt: new Date().toISOString() } : s
        ));
      } else {
        const id = await addService(serviceData);
        const newService: Service = {
          ...serviceData,
          id,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        setServices(prev => [...prev, newService]);
      }

      resetServiceForm();
    } catch (error) {
      console.error('Failed to save service:', error);
      setFormErrors({ name: 'Failed to save service. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      await deleteProduct(productId);
      setProducts(prev => prev.filter(p => p.id !== productId));
    } catch (error) {
      console.error('Failed to delete product:', error);
      setError('Failed to delete product');
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    if (!confirm('Are you sure you want to delete this service?')) return;

    try {
      await deleteService(serviceId);
      setServices(prev => prev.filter(s => s.id !== serviceId));
    } catch (error) {
      console.error('Failed to delete service:', error);
      setError('Failed to delete service');
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      description: product.description,
      price: product.price,
      category: product.category
    });
    setShowProductForm(true);
  };

  const handleEditService = (service: Service) => {
    setEditingService(service);
    setServiceForm({
      name: service.name,
      description: service.description,
      hourlyRate: service.hourlyRate,
      category: service.category
    });
    setShowServiceForm(true);
  };

  const resetProductForm = () => {
    setProductForm({ name: '', description: '', price: 0, category: '' });
    setEditingProduct(null);
    setShowProductForm(false);
    setFormErrors({});
  };

  const resetServiceForm = () => {
    setServiceForm({ name: '', description: '', hourlyRate: 0, category: '' });
    setEditingService(null);
    setShowServiceForm(false);
    setFormErrors({});
  };

  const getFilteredProducts = () => {
    return products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = !filterCategory || product.category === filterCategory;
      return matchesSearch && matchesCategory;
    });
  };

  const getFilteredServices = () => {
    return services.filter(service => {
      const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           service.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = !filterCategory || service.category === filterCategory;
      return matchesSearch && matchesCategory;
    });
  };

  const getUniqueCategories = () => {
    const productCategories = products.map(p => p.category);
    const serviceCategories = services.map(s => s.category);
    return Array.from(new Set([...productCategories, ...serviceCategories])).sort();
  };

  if (isLoading) {
    return (
      <div className={`${themeClasses.cardBackground} rounded-lg shadow-sm p-8`}>
        <div className="flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin mr-3" />
          <span className={themeClasses.textSecondary}>Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/dashboard')}
            className={`flex items-center space-x-2 ${themeClasses.textSecondary} hover:${themeClasses.text} transition-colors`}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className={`text-2xl font-bold ${themeClasses.text}`}>
            {businessType === 'legal' ? 'Legal Services' : 'Products & Services'}
          </h1>
          <p className={`${themeClasses.textSecondary} mt-1`}>
            {businessType === 'legal' 
              ? 'Manage your legal service offerings and rates'
              : 'Manage your business products and services'
            }
          </p>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex space-x-1 mb-6">
        <button
          onClick={() => setActiveTab('products')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'products'
              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
              : `${themeClasses.textSecondary} hover:${themeClasses.text} ${themeClasses.hover}`
          }`}
        >
          Products ({products.length})
        </button>
        <button
          onClick={() => setActiveTab('services')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'services'
              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
              : `${themeClasses.textSecondary} hover:${themeClasses.text} ${themeClasses.hover}`
          }`}
        >
          Services ({services.length})
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${themeClasses.cardBackground}`}
            placeholder={`Search ${activeTab}...`}
          />
        </div>
        
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className={`px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${themeClasses.cardBackground}`}
        >
          <option value="">All Categories</option>
          {getUniqueCategories().map(category => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>

        <button
          onClick={() => activeTab === 'products' ? setShowProductForm(true) : setShowServiceForm(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-sm hover:shadow-md"
        >
          <Plus className="w-4 h-4" />
          <span>Add {activeTab === 'products' ? 'Product' : 'Service'}</span>
        </button>
      </div>

      {/* Content */}
      {activeTab === 'products' ? (
        <ProductsList 
          products={getFilteredProducts()}
          onEdit={handleEditProduct}
          onDelete={handleDeleteProduct}
          themeClasses={themeClasses}
          formatCurrency={formatCurrency}
        />
      ) : (
        <ServicesList 
          services={getFilteredServices()}
          onEdit={handleEditService}
          onDelete={handleDeleteService}
          themeClasses={themeClasses}
          formatCurrency={formatCurrency}
        />
      )}

      {/* Product Form Modal */}
      {showProductForm && (
        <ProductFormModal
          product={editingProduct}
          formData={productForm}
          errors={formErrors}
          isSubmitting={isSubmitting}
          onSubmit={handleProductSubmit}
          onCancel={resetProductForm}
          onChange={setProductForm}
          themeClasses={themeClasses}
        />
      )}

      {/* Service Form Modal */}
      {showServiceForm && (
        <ServiceFormModal
          service={editingService}
          formData={serviceForm}
          errors={formErrors}
          isSubmitting={isSubmitting}
          onSubmit={handleServiceSubmit}
          onCancel={resetServiceForm}
          onChange={setServiceForm}
          themeClasses={themeClasses}
        />
      )}
    </div>
  );
}

// Products List Component
function ProductsList({ products, onEdit, onDelete, themeClasses, formatCurrency }: any) {
  if (products.length === 0) {
    return (
      <div className={`${themeClasses.cardBackground} rounded-lg shadow-sm p-8 text-center`}>
        <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className={`text-lg font-medium ${themeClasses.text} mb-2`}>No products yet</h3>
        <p className={`${themeClasses.textSecondary}`}>
          Add your first product to start tracking inventory and sales.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {products.map((product: Product) => (
        <div key={product.id} className={`${themeClasses.cardBackground} rounded-lg shadow-sm p-6 border ${themeClasses.border}`}>
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h3 className={`font-semibold ${themeClasses.text} mb-1`}>{product.name}</h3>
              <p className={`text-sm ${themeClasses.textSecondary} mb-2`}>{product.description}</p>
              <div className="flex items-center space-x-2">
                <Tag className="w-4 h-4 text-gray-400" />
                <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-full">
                  {product.category}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1">
              <DollarSign className="w-4 h-4 text-green-600" />
              <span className="font-bold text-green-600">{formatCurrency(product.price)}</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onEdit(product)}
                className={`p-2 ${themeClasses.textSecondary} hover:${themeClasses.text} ${themeClasses.hover} rounded-lg transition-colors`}
                title="Edit product"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDelete(product.id)}
                className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                title="Delete product"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Services List Component
function ServicesList({ services, onEdit, onDelete, themeClasses, formatCurrency }: any) {
  if (services.length === 0) {
    return (
      <div className={`${themeClasses.cardBackground} rounded-lg shadow-sm p-8 text-center`}>
        <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className={`text-lg font-medium ${themeClasses.text} mb-2`}>No services yet</h3>
        <p className={`${themeClasses.textSecondary}`}>
          Add your first service to start tracking your offerings and rates.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {services.map((service: Service) => (
        <div key={service.id} className={`${themeClasses.cardBackground} rounded-lg shadow-sm p-6 border ${themeClasses.border}`}>
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h3 className={`font-semibold ${themeClasses.text} mb-1`}>{service.name}</h3>
              <p className={`text-sm ${themeClasses.textSecondary} mb-2`}>{service.description}</p>
              <div className="flex items-center space-x-2">
                <Tag className="w-4 h-4 text-gray-400" />
                <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-full">
                  {service.category}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1">
              <DollarSign className="w-4 h-4 text-blue-600" />
              <span className="font-bold text-blue-600">{formatCurrency(service.hourlyRate)}/hr</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onEdit(service)}
                className={`p-2 ${themeClasses.textSecondary} hover:${themeClasses.text} ${themeClasses.hover} rounded-lg transition-colors`}
                title="Edit service"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDelete(service.id)}
                className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                title="Delete service"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Product Form Modal Component
function ProductFormModal({ product, formData, errors, isSubmitting, onSubmit, onCancel, onChange, themeClasses }: any) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`${themeClasses.cardBackground} rounded-2xl shadow-2xl max-w-md w-full`}>
        <div className={`p-6 border-b ${themeClasses.border}`}>
          <h2 className={`text-xl font-bold ${themeClasses.text}`}>
            {product ? 'Edit Product' : 'Add New Product'}
          </h2>
        </div>
        
        <form onSubmit={onSubmit} className="p-6 space-y-4">
          <div>
            <label className={`block text-sm font-medium ${themeClasses.text} mb-2`}>
              Product Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => onChange({ ...formData, name: e.target.value })}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.name ? 'border-red-300 bg-red-50' : `border-gray-300 ${themeClasses.cardBackground}`
              }`}
              placeholder="Enter product name"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          <div>
            <label className={`block text-sm font-medium ${themeClasses.text} mb-2`}>
              Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => onChange({ ...formData, description: e.target.value })}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.description ? 'border-red-300 bg-red-50' : `border-gray-300 ${themeClasses.cardBackground}`
              }`}
              placeholder="Enter product description"
              rows={3}
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description}</p>
            )}
          </div>

          <div>
            <label className={`block text-sm font-medium ${themeClasses.text} mb-2`}>
              Price *
            </label>
            <input
              type="number"
              value={formData.price || ''}
              onChange={(e) => onChange({ ...formData, price: parseFloat(e.target.value) || 0 })}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.price ? 'border-red-300 bg-red-50' : `border-gray-300 ${themeClasses.cardBackground}`
              }`}
              placeholder="0.00"
              min="0"
              step="0.01"
            />
            {errors.price && (
              <p className="mt-1 text-sm text-red-600">{errors.price}</p>
            )}
          </div>

          <div>
            <label className={`block text-sm font-medium ${themeClasses.text} mb-2`}>
              Category *
            </label>
            <input
              type="text"
              value={formData.category}
              onChange={(e) => onChange({ ...formData, category: e.target.value })}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.category ? 'border-red-300 bg-red-50' : `border-gray-300 ${themeClasses.cardBackground}`
              }`}
              placeholder="Enter category"
            />
            {errors.category && (
              <p className="mt-1 text-sm text-red-600">{errors.category}</p>
            )}
          </div>
        </form>

        <div className={`p-6 border-t ${themeClasses.border} flex items-center justify-end space-x-3`}>
          <button
            type="button"
            onClick={onCancel}
            className={`px-4 py-2 ${themeClasses.textSecondary} hover:${themeClasses.text} transition-colors`}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={onSubmit}
            disabled={isSubmitting}
            className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>{product ? 'Update' : 'Add'} Product</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// Service Form Modal Component
function ServiceFormModal({ service, formData, errors, isSubmitting, onSubmit, onCancel, onChange, themeClasses }: any) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`${themeClasses.cardBackground} rounded-2xl shadow-2xl max-w-md w-full`}>
        <div className={`p-6 border-b ${themeClasses.border}`}>
          <h2 className={`text-xl font-bold ${themeClasses.text}`}>
            {service ? 'Edit Service' : 'Add New Service'}
          </h2>
        </div>
        
        <form onSubmit={onSubmit} className="p-6 space-y-4">
          <div>
            <label className={`block text-sm font-medium ${themeClasses.text} mb-2`}>
              Service Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => onChange({ ...formData, name: e.target.value })}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.name ? 'border-red-300 bg-red-50' : `border-gray-300 ${themeClasses.cardBackground}`
              }`}
              placeholder="Enter service name"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          <div>
            <label className={`block text-sm font-medium ${themeClasses.text} mb-2`}>
              Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => onChange({ ...formData, description: e.target.value })}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.description ? 'border-red-300 bg-red-50' : `border-gray-300 ${themeClasses.cardBackground}`
              }`}
              placeholder="Enter service description"
              rows={3}
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description}</p>
            )}
          </div>

          <div>
            <label className={`block text-sm font-medium ${themeClasses.text} mb-2`}>
              Hourly Rate *
            </label>
            <input
              type="number"
              value={formData.hourlyRate || ''}
              onChange={(e) => onChange({ ...formData, hourlyRate: parseFloat(e.target.value) || 0 })}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.hourlyRate ? 'border-red-300 bg-red-50' : `border-gray-300 ${themeClasses.cardBackground}`
              }`}
              placeholder="0.00"
              min="0"
              step="0.01"
            />
            {errors.hourlyRate && (
              <p className="mt-1 text-sm text-red-600">{errors.hourlyRate}</p>
            )}
          </div>

          <div>
            <label className={`block text-sm font-medium ${themeClasses.text} mb-2`}>
              Category *
            </label>
            <input
              type="text"
              value={formData.category}
              onChange={(e) => onChange({ ...formData, category: e.target.value })}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.category ? 'border-red-300 bg-red-50' : `border-gray-300 ${themeClasses.cardBackground}`
              }`}
              placeholder="Enter category"
            />
            {errors.category && (
              <p className="mt-1 text-sm text-red-600">{errors.category}</p>
            )}
          </div>
        </form>

        <div className={`p-6 border-t ${themeClasses.border} flex items-center justify-end space-x-3`}>
          <button
            type="button"
            onClick={onCancel}
            className={`px-4 py-2 ${themeClasses.textSecondary} hover:${themeClasses.text} transition-colors`}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={onSubmit}
            disabled={isSubmitting}
            className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>{service ? 'Update' : 'Add'} Service</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}