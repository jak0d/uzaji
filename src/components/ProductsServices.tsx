import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Package, Clock, Edit2, Trash2, ChevronDown, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getProducts, getServices, addProduct, addService, deleteProduct, deleteService } from '../utils/database';
import { UzajiLogo } from './UzajiLogo';
import { useSettings } from '../hooks/useSettings';
import { useTranslation } from '../hooks/useTranslation';
import type { Product, Service } from '../utils/database';

interface ProductsServicesProps {
  onBack: () => void;
}

interface CategoryWithSubs {
  name: string;
  subcategories: string[];
}

interface CustomCategory {
  id: string;
  name: string;
  subcategories: string[];
  type: 'product' | 'service';
}

export function ProductsServices({ onBack }: ProductsServicesProps) {
  const { formatCurrency, getThemeClasses } = useSettings();
  const { t } = useTranslation();
  const themeClasses = getThemeClasses();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState<'products' | 'services'>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [showCustomCategoryForm, setShowCustomCategoryForm] = useState(false);
  const [customCategories, setCustomCategories] = useState<CustomCategory[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    hourlyRate: '',
    category: '',
    subcategory: '',
  });
  const [customCategoryData, setCustomCategoryData] = useState({
    name: '',
    subcategories: [''],
  });

  const productCategories: CategoryWithSubs[] = [
    {
      name: 'Electronics',
      subcategories: ['Computers & Laptops', 'Mobile Phones', 'Audio Equipment', 'Gaming', 'Smart Home', 'Accessories']
    },
    {
      name: 'Clothing',
      subcategories: ['Men\'s Clothing', 'Women\'s Clothing', 'Children\'s Clothing', 'Shoes', 'Accessories', 'Sportswear']
    },
    {
      name: 'Books',
      subcategories: ['Fiction', 'Non-Fiction', 'Educational', 'Children\'s Books', 'E-books', 'Audiobooks']
    },
    {
      name: 'Food',
      subcategories: ['Fresh Produce', 'Packaged Foods', 'Beverages', 'Snacks', 'Organic', 'International']
    },
    {
      name: 'Home & Garden',
      subcategories: ['Furniture', 'Decor', 'Kitchen', 'Bathroom', 'Garden Tools', 'Plants']
    },
    {
      name: 'Health & Beauty',
      subcategories: ['Skincare', 'Makeup', 'Hair Care', 'Supplements', 'Personal Care', 'Fitness']
    },
    {
      name: 'Sports & Outdoors',
      subcategories: ['Exercise Equipment', 'Outdoor Gear', 'Team Sports', 'Water Sports', 'Winter Sports', 'Cycling']
    },
    {
      name: 'Other',
      subcategories: []
    }
  ];

  const serviceCategories: CategoryWithSubs[] = [
    {
      name: 'Consulting',
      subcategories: ['Business Strategy', 'Financial Advisory', 'Management', 'HR Consulting', 'Legal Consulting', 'IT Consulting']
    },
    {
      name: 'Design',
      subcategories: ['Graphic Design', 'Web Design', 'Interior Design', 'Logo Design', 'Branding', 'UI/UX Design']
    },
    {
      name: 'Development',
      subcategories: ['Web Development', 'Mobile Apps', 'Software Development', 'E-commerce', 'Database Design', 'API Development']
    },
    {
      name: 'Marketing',
      subcategories: ['Digital Marketing', 'Social Media', 'Content Marketing', 'SEO/SEM', 'Email Marketing', 'Brand Strategy']
    },
    {
      name: 'Creative Services',
      subcategories: ['Photography', 'Video Production', 'Writing & Editing', 'Voice Over', 'Animation', 'Music Production']
    },
    {
      name: 'Professional Services',
      subcategories: ['Accounting', 'Legal Services', 'Translation', 'Virtual Assistant', 'Project Management', 'Training']
    },
    {
      name: 'Technical Services',
      subcategories: ['IT Support', 'Data Analysis', 'System Administration', 'Cybersecurity', 'Cloud Services', 'DevOps']
    },
    {
      name: 'Other',
      subcategories: []
    }
  ];

  useEffect(() => {
    loadData();
    loadCustomCategories();
  }, []);

  const loadData = async () => {
    try {
      const [productsData, servicesData] = await Promise.all([
        getProducts(),
        getServices(),
      ]);
      setProducts(productsData);
      setServices(servicesData);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  const loadCustomCategories = () => {
    const stored = localStorage.getItem('uzaji-custom-categories');
    if (stored) {
      try {
        setCustomCategories(JSON.parse(stored));
      } catch (error) {
        console.error('Failed to load custom categories:', error);
      }
    }
  };

  const saveCustomCategories = (categories: CustomCategory[]) => {
    localStorage.setItem('uzaji-custom-categories', JSON.stringify(categories));
    setCustomCategories(categories);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const categoryValue = formData.subcategory 
        ? `${formData.category} > ${formData.subcategory}`
        : formData.category;

      if (activeTab === 'products') {
        await addProduct({
          name: formData.name,
          description: formData.description,
          price: parseFloat(formData.price),
          category: categoryValue,
          encrypted: true,
        });
      } else {
        await addService({
          name: formData.name,
          description: formData.description,
          hourlyRate: parseFloat(formData.hourlyRate),
          category: categoryValue,
          encrypted: true,
        });
      }

      setFormData({
        name: '',
        description: '',
        price: '',
        hourlyRate: '',
        category: '',
        subcategory: '',
      });
      setIsAdding(false);
      loadData();
    } catch (error) {
      console.error('Failed to save:', error);
    }
  };

  const handleCustomCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newCategory: CustomCategory = {
      id: crypto.randomUUID(),
      name: customCategoryData.name,
      subcategories: customCategoryData.subcategories.filter(sub => sub.trim() !== ''),
      type: activeTab === 'products' ? 'product' : 'service',
    };

    const updatedCategories = [...customCategories, newCategory];
    saveCustomCategories(updatedCategories);

    setCustomCategoryData({
      name: '',
      subcategories: [''],
    });
    setShowCustomCategoryForm(false);
  };

  const addSubcategoryField = () => {
    setCustomCategoryData(prev => ({
      ...prev,
      subcategories: [...prev.subcategories, '']
    }));
  };

  const removeSubcategoryField = (index: number) => {
    setCustomCategoryData(prev => ({
      ...prev,
      subcategories: prev.subcategories.filter((_, i) => i !== index)
    }));
  };

  const updateSubcategory = (index: number, value: string) => {
    setCustomCategoryData(prev => ({
      ...prev,
      subcategories: prev.subcategories.map((sub, i) => i === index ? value : sub)
    }));
  };

  const deleteCustomCategory = (categoryId: string) => {
    if (!confirm('Are you sure you want to delete this custom category?')) return;
    
    const updatedCategories = customCategories.filter(cat => cat.id !== categoryId);
    saveCustomCategories(updatedCategories);
  };

  const handleDelete = async (id: string, type: 'product' | 'service') => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      if (type === 'product') {
        await deleteProduct(id);
      } else {
        await deleteService(id);
      }
      loadData();
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  const getCurrentCategories = () => {
    const baseCategories = activeTab === 'products' ? productCategories : serviceCategories;
    const customCats = customCategories
      .filter(cat => cat.type === activeTab.slice(0, -1) as 'product' | 'service')
      .map(cat => ({
        name: cat.name,
        subcategories: cat.subcategories
      }));
    
    return [...baseCategories, ...customCats];
  };

  const getSelectedCategorySubcategories = () => {
    const categories = getCurrentCategories();
    const selectedCategory = categories.find(cat => cat.name === formData.category);
    return selectedCategory?.subcategories || [];
  };

  return (
    <div className={`min-h-screen ${themeClasses.background}`}>
      <header className={`${themeClasses.cardBackground} shadow-sm ${themeClasses.border} border-b`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <button
              onClick={() => navigate('/dashboard')}
              className={`mr-4 p-2 ${themeClasses.textSecondary} hover:${themeClasses.text} ${themeClasses.hover} rounded-lg transition-colors`}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <UzajiLogo size="md" className="mr-4" />
            <h1 className={`text-xl font-bold ${themeClasses.text}`}>{t('products.title')}</h1>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="flex space-x-1 mb-6">
          <button
            onClick={() => setActiveTab('products')}
            className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
              activeTab === 'products'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                : `${themeClasses.cardBackground} ${themeClasses.text} ${themeClasses.hover} ${themeClasses.border} border`
            }`}
          >
            <Package className="w-4 h-4 inline mr-2" />
            {t('products.products')}
          </button>
          <button
            onClick={() => setActiveTab('services')}
            className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
              activeTab === 'services'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                : `${themeClasses.cardBackground} ${themeClasses.text} ${themeClasses.hover} ${themeClasses.border} border`
            }`}
          >
            <Clock className="w-4 h-4 inline mr-2" />
            {t('products.services')}
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => setIsAdding(true)}
            className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            <Plus className="w-4 h-4" />
            <span>{t('products.addNew')} {activeTab === 'products' ? t('products.products') : t('products.services')}</span>
          </button>
          
          <button
            onClick={() => setShowCustomCategoryForm(true)}
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            <Plus className="w-4 h-4" />
            <span>{t('common.add')} {t('transactions.category')}</span>
          </button>
        </div>

        {/* Custom Category Form */}
        {showCustomCategoryForm && (
          <div className={`${themeClasses.cardBackground} rounded-lg shadow-sm ${themeClasses.border} border p-6 mb-6`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-semibold ${themeClasses.text}`}>
                {t('common.add')} {t('transactions.category')} {t('common.for')} {activeTab === 'products' ? t('products.products') : t('products.services')}
              </h3>
              <button
                onClick={() => setShowCustomCategoryForm(false)}
                className={`p-2 ${themeClasses.textSecondary} hover:${themeClasses.text} ${themeClasses.hover} rounded-lg transition-colors`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleCustomCategorySubmit} className="space-y-4">
              <div>
                <label className={`block text-sm font-medium ${themeClasses.text} mb-2`}>
                  {t('transactions.category')} {t('products.name')}
                </label>
                <input
                  type="text"
                  value={customCategoryData.name}
                  onChange={(e) => setCustomCategoryData(prev => ({ ...prev, name: e.target.value }))}
                  className={`w-full px-4 py-3 ${themeClasses.border} border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${themeClasses.cardBackground} ${themeClasses.text}`}
                  placeholder="Enter category name"
                  required
                />
              </div>

              <div>
                <label className={`block text-sm font-medium ${themeClasses.text} mb-2`}>
                  Subcategories
                </label>
                <div className="space-y-2">
                  {customCategoryData.subcategories.map((subcategory, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={subcategory}
                        onChange={(e) => updateSubcategory(index, e.target.value)}
                        className={`flex-1 px-4 py-2 ${themeClasses.border} border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${themeClasses.cardBackground} ${themeClasses.text}`}
                        placeholder="Enter subcategory"
                      />
                      {customCategoryData.subcategories.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeSubcategoryField(index)}
                          className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addSubcategoryField}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center space-x-1"
                  >
                    <Plus className="w-4  h-4" />
                    <span>{t('common.add')} Subcategory</span>
                  </button>
                </div>
              </div>

              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => setShowCustomCategoryForm(false)}
                  className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 py-3 px-4 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-4 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  {t('common.add')} {t('transactions.category')}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Add Form */}
        {isAdding && (
          <div className={`${themeClasses.cardBackground} rounded-lg shadow-sm ${themeClasses.border} border p-6 mb-6`}>
            <h3 className={`text-lg font-semibold ${themeClasses.text} mb-4`}>
              {t('common.add')} {activeTab === 'products' ? t('products.products') : t('products.services')}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className={`block text-sm font-medium ${themeClasses.text} mb-2`}>
                  {t('products.name')}
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className={`w-full px-4 py-3 ${themeClasses.border} border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${themeClasses.cardBackground} ${themeClasses.text}`}
                  required
                />
              </div>

              <div>
                <label className={`block text-sm font-medium ${themeClasses.text} mb-2`}>
                  {t('transactions.description')}
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className={`w-full px-4 py-3 ${themeClasses.border} border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${themeClasses.cardBackground} ${themeClasses.text}`}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium ${themeClasses.text} mb-2`}>
                    {activeTab === 'products' ? t('products.price') : t('products.hourlyRate')}
                  </label>
                  <input
                    type="number"
                    value={activeTab === 'products' ? formData.price : formData.hourlyRate}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      [activeTab === 'products' ? 'price' : 'hourlyRate']: e.target.value 
                    }))}
                    className={`w-full px-4 py-3 ${themeClasses.border} border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${themeClasses.cardBackground} ${themeClasses.text}`}
                    step="0.01"
                    min="0"
                    required
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium ${themeClasses.text} mb-2`}>
                    {t('transactions.category')}
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value, subcategory: '' }))}
                    className={`w-full px-4 py-3 ${themeClasses.border} border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${themeClasses.cardBackground} ${themeClasses.text}`}
                    required
                  >
                    <option value="">{t('transactions.selectCategory')}</option>
                    {getCurrentCategories().map((category) => (
                      <option key={category.name} value={category.name}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Subcategory Selection */}
              {formData.category && formData.category !== 'Other' && getSelectedCategorySubcategories().length > 0 && (
                <div>
                  <label className={`block text-sm font-medium ${themeClasses.text} mb-2`}>
                    Subcategory
                  </label>
                  <select
                    value={formData.subcategory}
                    onChange={(e) => setFormData(prev => ({ ...prev, subcategory: e.target.value }))}
                    className={`w-full px-4 py-3 ${themeClasses.border} border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${themeClasses.cardBackground} ${themeClasses.text}`}
                  >
                    <option value="">Select subcategory (optional)</option>
                    {getSelectedCategorySubcategories().map((subcategory) => (
                      <option key={subcategory} value={subcategory}>
                        {subcategory}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 py-3 px-4 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-4 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  {t('common.add')} {activeTab === 'products' ? t('products.products') : t('products.services')}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Custom Categories List */}
        {customCategories.filter(cat => cat.type === activeTab.slice(0, -1) as 'product' | 'service').length > 0 && (
          <div className={`${themeClasses.cardBackground} rounded-lg shadow-sm ${themeClasses.border} border p-6 mb-6`}>
            <h3 className={`text-lg font-semibold ${themeClasses.text} mb-4`}>
              Custom {t('reports.categories')} {t('common.for')} {activeTab === 'products' ? t('products.products') : t('products.services')}
            </h3>
            <div className="space-y-3">
              {customCategories
                .filter(cat => cat.type === activeTab.slice(0, -1) as 'product' | 'service')
                .map((category) => (
                  <div key={category.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div>
                      <h4 className={`font-medium ${themeClasses.text}`}>{category.name}</h4>
                      {category.subcategories.length > 0 && (
                        <p className={`text-sm ${themeClasses.textSecondary} mt-1`}>
                          Subcategories: {category.subcategories.join(', ')}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => deleteCustomCategory(category.id)}
                      className={`p-2 ${themeClasses.textSecondary} hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Items List */}
        <div className={`${themeClasses.cardBackground} rounded-lg shadow-sm ${themeClasses.border} border`}>
          <div className="p-6">
            {activeTab === 'products' ? (
              <div className="space-y-4">
                {products.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className={`w-12 h-12 ${themeClasses.textSecondary} mx-auto mb-4`} />
                    <p className={themeClasses.textSecondary}>No products added yet</p>
                  </div>
                ) : (
                  products.map((product) => (
                    <div key={product.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                      <div className="flex-1">
                        <h4 className={`font-medium ${themeClasses.text}`}>{product.name}</h4>
                        <p className={`text-sm ${themeClasses.textSecondary}`}>{product.description}</p>
                        <p className={`text-xs ${themeClasses.textSecondary}`}>{product.category}</p>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className="font-bold text-green-600">{formatCurrency(product.price)}</p>
                        </div>
                        <div className="flex space-x-2">
                          <button className={`p-2 ${themeClasses.textSecondary} hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors`}>
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(product.id, 'product')}
                            className={`p-2 ${themeClasses.textSecondary} hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {services.length === 0 ? (
                  <div className="text-center py-8">
                    <Clock className={`w-12 h-12 ${themeClasses.textSecondary} mx-auto mb-4`} />
                    <p className={themeClasses.textSecondary}>No services added yet</p>
                  </div>
                ) : (
                  services.map((service) => (
                    <div key={service.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                      <div className="flex-1">
                        <h4 className={`font-medium ${themeClasses.text}`}>{service.name}</h4>
                        <p className={`text-sm ${themeClasses.textSecondary}`}>{service.description}</p>
                        <p className={`text-xs ${themeClasses.textSecondary}`}>{service.category}</p>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className="font-bold text-green-600">{formatCurrency(service.hourlyRate)}/hr</p>
                        </div>
                        <div className="flex space-x-2">
                          <button className={`p-2 ${themeClasses.textSecondary} hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors`}>
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(service.id, 'service')}
                            className={`p-2 ${themeClasses.textSecondary} hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}