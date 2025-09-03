import React, { useState, useEffect, useCallback } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  FileText, 
  DollarSign, 
  Users, 
  Calendar,
  Search,
  Filter,
  ArrowLeft,
  Eye,
  Download
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../hooks/useSettings';
import { deleteClient, deleteClientFile } from '../utils/database';
import { v4 as uuidv4 } from 'uuid';

interface Client {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  totalOutstandingFees: number;
  totalFundsHeld: number;
  createdAt: string;
  updatedAt: string;
}

interface ClientFile {
  id: string;
  clientId: string;
  fileName: string;
  dateOpened: string;
  feesToBePaid: number;
  depositPaid: number;
  balanceRemaining: number;
  totalExpenses: number;
  totalExtraFees: number;
  totalFeesCharged: number;
  totalPaid: number;
  netSummary: number;
  status: 'active' | 'closed' | 'pending';
  createdAt: string;
  updatedAt: string;
}

interface FileExpense {
  id: string;
  fileId: string;
  date: string;
  description: string;
  amount: number;
  vendor?: string;
  isReimbursable: boolean;
  attachment?: string;
  createdAt: string;
}

interface ExtraFee {
  id: string;
  fileId: string;
  date: string;
  description: string;
  amount: number;
  createdAt: string;
}

interface ClientFileTrackerProps {
  className?: string;
}

export function ClientFileTracker({ className = '' }: ClientFileTrackerProps) {
  const { formatCurrency, getThemeClasses } = useSettings();
  const themeClasses = getThemeClasses();
  const navigate = useNavigate();
  
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientFiles, setClientFiles] = useState<ClientFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'files' | 'transactions' | 'notes' | 'documents'>('files');
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddClientModalOpen, setIsAddClientModalOpen] = useState(false);
  const [newClient, setNewClient] = useState<Omit<Client, 'id' | 'createdAt' | 'updatedAt'>>({ 
    name: '', 
    email: '', 
    phone: '', 
    address: '', 
    totalOutstandingFees: 0, 
    totalFundsHeld: 0 
  });

  const loadClients = useCallback(async () => {
    // Check if we already have clients in localStorage
    const savedClients = localStorage.getItem('uzaji_clients');
    
    if (savedClients) {
      setClients(JSON.parse(savedClients));
    } else {
      // Only load mock data if no saved clients exist
      const mockClients: Client[] = [
        {
          id: '1',
          name: 'John Smith',
          email: 'john.smith@email.com',
          phone: '(555) 123-4567',
          totalOutstandingFees: 5000,
          totalFundsHeld: 2000,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
      
      setClients(mockClients);
      // Save mock data to localStorage
      localStorage.setItem('uzaji_clients', JSON.stringify(mockClients));
    }
    
    setIsLoading(false);
  }, []);

  // Load clients from localStorage on component mount
  useEffect(() => {
    loadClients();
  }, [loadClients]);

  // Save clients to localStorage whenever the clients array changes
  useEffect(() => {
    if (clients.length > 0) {
      localStorage.setItem('uzaji_clients', JSON.stringify(clients));
    }
  }, [clients]);

  const handleAddClient = () => {
    if (!newClient.name.trim()) return;
    
    const newClientWithId = {
      ...newClient,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const updatedClients = [...clients, newClientWithId];
    setClients(updatedClients);
    
    // Reset form
    setNewClient({ 
      name: '', 
      email: '', 
      phone: '', 
      address: '', 
      totalOutstandingFees: 0, 
      totalFundsHeld: 0 
    });
    
    setIsAddClientModalOpen(false);
    
    // Show success message
    alert('Client added successfully!');
  };


  const loadClientFiles = async (clientId: string) => {
    // Mock data for demonstration
    const mockFiles: ClientFile[] = [
      {
        id: '1',
        clientId,
        fileName: 'Smith vs. ABC Corp - Case #2024-001',
        dateOpened: '2024-01-15',
        feesToBePaid: 3000,
        depositPaid: 1500,
        balanceRemaining: 1500,
        totalExpenses: 500,
        totalExtraFees: 200,
        totalFeesCharged: 3200,
        totalPaid: 1500,
        netSummary: 2200,
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
    
    setClientFiles(mockFiles);
  };

  const handleClientSelect = (client: Client) => {
    setSelectedClient(client);
    loadClientFiles(client.id);
  };

  const handleBackToClients = () => {
    setSelectedClient(null);
  };

  const handleDeleteClient = async (clientId: string) => {
    try {
      // Delete client from database
      await deleteClient(clientId);
      
      // Also delete all files associated with this client
      const clientFiles = JSON.parse(localStorage.getItem('uzaji_clientFiles') || '[]');
      const remainingFiles = clientFiles.filter((file: any) => file.clientId !== clientId);
      localStorage.setItem('uzaji_clientFiles', JSON.stringify(remainingFiles));
      
      // Update the clients list
      const updatedClients = clients.filter(client => client.id !== clientId);
      setClients(updatedClients);
      
      // If the deleted client was selected, clear the selection
      if (selectedClient?.id === clientId) {
        setSelectedClient(null);
        setClientFiles([]);
      }
      
      // Update local storage
      localStorage.setItem('uzaji_clients', JSON.stringify(updatedClients));
      
      console.log('Client deleted successfully');
    } catch (error) {
      console.error('Error deleting client:', error);
      alert('Failed to delete client. Please try again.');
    }
  };

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className={`${themeClasses.cardBackground} rounded-lg shadow-sm p-8`}>
        <div className="flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin mr-3" />
          <span className={themeClasses.textSecondary}>Loading clients...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 ${className}`}>
      {selectedClient ? (
        <ClientDetailView
          client={selectedClient}
          files={clientFiles}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          themeClasses={themeClasses}
          formatCurrency={formatCurrency}
          onBack={handleBackToClients}
        />
      ) : (
        <ClientListView
          clients={filteredClients}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onClientSelect={handleClientSelect}
          onDeleteClient={handleDeleteClient}
          onAddClientClick={() => setIsAddClientModalOpen(true)}
          themeClasses={themeClasses}
          formatCurrency={formatCurrency}
        />
      )}

      {/* Add Client Modal */}
      {isAddClientModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className={`${themeClasses.cardBackground} rounded-lg shadow-xl w-full max-w-md p-6`}>
            <h2 className="text-xl font-semibold mb-4">Add New Client</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Full Name *</label>
                <input
                  type="text"
                  value={newClient.name}
                  onChange={(e) => setNewClient({...newClient, name: e.target.value})}
                  className="w-full p-2 border rounded"
                  placeholder="John Doe"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  value={newClient.email}
                  onChange={(e) => setNewClient({...newClient, email: e.target.value})}
                  className="w-full p-2 border rounded"
                  placeholder="john@example.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Phone</label>
                <input
                  type="tel"
                  value={newClient.phone}
                  onChange={(e) => setNewClient({...newClient, phone: e.target.value})}
                  className="w-full p-2 border rounded"
                  placeholder="(123) 456-7890"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Address</label>
                <textarea
                  value={newClient.address}
                  onChange={(e) => setNewClient({...newClient, address: e.target.value})}
                  className="w-full p-2 border rounded"
                  rows={2}
                  placeholder="123 Main St, City, Country"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Initial Fees</label>
                  <input
                    type="number"
                    value={newClient.totalOutstandingFees}
                    onChange={(e) => setNewClient({...newClient, totalOutstandingFees: Number(e.target.value)})}
                    className="w-full p-2 border rounded"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Funds Held</label>
                  <input
                    type="number"
                    value={newClient.totalFundsHeld}
                    onChange={(e) => setNewClient({...newClient, totalFundsHeld: Number(e.target.value)})}
                    className="w-full p-2 border rounded"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setIsAddClientModalOpen(false)}
                className="px-4 py-2 border rounded hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleAddClient}
                disabled={!newClient.name.trim()}
                className={`px-4 py-2 rounded text-white ${!newClient.name.trim() ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
              >
                Add Client
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Client List View Component
/**
 * Client List View Component
 * 
 * This component displays a list of clients with their respective information.
 * It also allows users to search for clients and select a client to view their details.
 */
function ClientListView({ clients, searchTerm, onSearchChange, onClientSelect, onDeleteClient, onAddClientClick, themeClasses, formatCurrency }: any) {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className={`text-2xl font-bold ${themeClasses.text}`}>
            Clients & Files
          </h1>
          <p className={`${themeClasses.textSecondary} mt-1`}>
            Manage client relationships and legal file tracking
          </p>
        </div>
        <button 
          onClick={onAddClientClick}
          className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-sm hover:shadow-md"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Client</span>
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className={`w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${themeClasses.cardBackground}`}
            placeholder="Search clients..."
          />
        </div>
      </div>

      {/* Client Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {clients.map((client: Client) => (
          <div
            key={client.id}
            onClick={() => onClientSelect(client)}
            className={`${themeClasses.cardBackground} rounded-lg shadow-sm p-6 border ${themeClasses.border} cursor-pointer hover:shadow-md transition-all duration-200`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className={`font-semibold ${themeClasses.text} mb-1`}>{client.name}</h3>
                {client.email && (
                  <p className={`text-sm ${themeClasses.textSecondary}`}>{client.email}</p>
                )}
                {client.phone && (
                  <p className={`text-sm ${themeClasses.textSecondary}`}>{client.phone}</p>
                )}
              </div>
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className={`text-sm ${themeClasses.textSecondary}`}>Outstanding Fees:</span>
                <span className="font-medium text-red-600">{formatCurrency(client.totalOutstandingFees)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className={`text-sm ${themeClasses.textSecondary}`}>Funds Held:</span>
                <span className="font-medium text-green-600">{formatCurrency(client.totalFundsHeld)}</span>
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => onClientSelect(client)}
                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                title="View client details"
              >
                <Eye size={18} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm(`Are you sure you want to delete ${client.name}? This action cannot be undone.`)) {
                    onDeleteClient(client.id);
                  }
                }}
                className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                title="Delete client"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {clients.length === 0 && (
        <div className={`${themeClasses.cardBackground} rounded-lg shadow-sm p-8 text-center`}>
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className={`text-lg font-medium ${themeClasses.text} mb-2`}>No clients yet</h3>
          <p className={`${themeClasses.textSecondary} mb-4`}>
            Add your first client to start tracking legal files and finances.
          </p>
          <button 
            onClick={onAddClientClick}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add First Client
          </button>
        </div>
      )}
    </div>
  );
}

// Client Detail View Component
function ClientDetailView({ client, files, activeTab, onTabChange, themeClasses, formatCurrency, onBack }: any) {
  return (
    <div>
      {/* Back Button */}
      <button 
        onClick={onBack}
        className={`flex items-center space-x-2 mb-4 text-sm font-medium ${themeClasses.textSecondary} hover:${themeClasses.text} transition-colors`}
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Clients & Files</span>
      </button>
      
      {/* Client Header */}
      <div className={`${themeClasses.cardBackground} rounded-lg shadow-sm p-6 border ${themeClasses.border} mb-6`}>
        <div className="flex items-start justify-between">
          <div>
            <h1 className={`text-2xl font-bold ${themeClasses.text} mb-2`}>{client.name}</h1>
            <div className="space-y-1">
              {client.email && (
                <p className={`text-sm ${themeClasses.textSecondary}`}>📧 {client.email}</p>
              )}
              {client.phone && (
                <p className={`text-sm ${themeClasses.textSecondary}`}>📞 {client.phone}</p>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="space-y-2">
              <div>
                <span className={`text-sm ${themeClasses.textSecondary}`}>Total Outstanding Fees:</span>
                <p className="font-bold text-red-600">{formatCurrency(client.totalOutstandingFees)}</p>
              </div>
              <div>
                <span className={`text-sm ${themeClasses.textSecondary}`}>Total Funds Held in Trust:</span>
                <p className="font-bold text-green-600">{formatCurrency(client.totalFundsHeld)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 mb-6">
        {[
          { id: 'files', label: 'Files', icon: FileText },
          { id: 'transactions', label: 'Transactions', icon: DollarSign },
          { id: 'notes', label: 'Notes', icon: FileText },
          { id: 'documents', label: 'Documents', icon: FileText }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center space-x-2 px-4 py-3 rounded-lg font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                  : `${themeClasses.textSecondary} hover:${themeClasses.text} ${themeClasses.hover}`
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'files' && (
        <ClientFilesTab files={files} themeClasses={themeClasses} formatCurrency={formatCurrency} />
      )}
      {activeTab === 'transactions' && (
        <div className={`${themeClasses.cardBackground} rounded-lg shadow-sm p-6 border ${themeClasses.border}`}>
          <p className={themeClasses.textSecondary}>All transactions for this client will be displayed here.</p>
        </div>
      )}
      {activeTab === 'notes' && (
        <div className={`${themeClasses.cardBackground} rounded-lg shadow-sm p-6 border ${themeClasses.border}`}>
          <p className={themeClasses.textSecondary}>Client notes will be displayed here.</p>
        </div>
      )}
      {activeTab === 'documents' && (
        <div className={`${themeClasses.cardBackground} rounded-lg shadow-sm p-6 border ${themeClasses.border}`}>
          <p className={themeClasses.textSecondary}>Client documents will be displayed here.</p>
        </div>
      )}
    </div>
  );
}

// Client Files Tab Component
function ClientFilesTab({ files, themeClasses, formatCurrency }: any) {
  return (
    <div className={`${themeClasses.cardBackground} rounded-lg shadow-sm border ${themeClasses.border}`}>
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className={`text-lg font-semibold ${themeClasses.text}`}>Legal Files</h3>
          <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Plus className="w-4 h-4" />
            <span>Add New File</span>
          </button>
        </div>
      </div>

      {files.length === 0 ? (
        <div className="p-8 text-center">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className={`text-lg font-medium ${themeClasses.text} mb-2`}>No files yet</h3>
          <p className={`${themeClasses.textSecondary} mb-4`}>
            Add the first legal file for this client to start tracking finances.
          </p>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Add First File
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className={`px-6 py-3 text-left text-xs font-medium ${themeClasses.textSecondary} uppercase tracking-wider`}>
                  File Name
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium ${themeClasses.textSecondary} uppercase tracking-wider`}>
                  Date Opened
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium ${themeClasses.textSecondary} uppercase tracking-wider`}>
                  Fees to be Paid
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium ${themeClasses.textSecondary} uppercase tracking-wider`}>
                  Deposit Paid
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium ${themeClasses.textSecondary} uppercase tracking-wider`}>
                  Balance Remaining
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium ${themeClasses.textSecondary} uppercase tracking-wider`}>
                  Total Expenses
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium ${themeClasses.textSecondary} uppercase tracking-wider`}>
                  Net Summary
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium ${themeClasses.textSecondary} uppercase tracking-wider`}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {files.map((file: ClientFile) => (
                <tr key={file.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${themeClasses.text}`}>
                    {file.fileName}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${themeClasses.textSecondary}`}>
                    {new Date(file.dateOpened).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                    {formatCurrency(file.feesToBePaid)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                    {formatCurrency(file.depositPaid)}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                    file.balanceRemaining > 0 ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {formatCurrency(file.balanceRemaining)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-orange-600">
                    {formatCurrency(file.totalExpenses)}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm font-bold ${
                    file.netSummary > 0 ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {formatCurrency(file.netSummary)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center space-x-2">
                      <button className={`p-1 ${themeClasses.textSecondary} hover:${themeClasses.text} rounded transition-colors`}>
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className={`p-1 ${themeClasses.textSecondary} hover:${themeClasses.text} rounded transition-colors`}>
                        <Edit className="w-4 h-4" />
                      </button>
                      <button className={`p-1 ${themeClasses.textSecondary} hover:${themeClasses.text} rounded transition-colors`}>
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}