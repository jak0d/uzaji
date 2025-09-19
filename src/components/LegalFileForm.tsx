import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { Save, FileText, Calendar, DollarSign, AlertCircle, Paperclip } from 'lucide-react';
import { useSettings } from '../hooks/useSettings';
import { FileAttachmentSystem } from './FileAttachmentSystem';
import { useLegalFileAttachments } from '../hooks/useLegalFileAttachments';
import { addClientFile, updateClientFile, getClientFiles } from '../utils/database';

type FormMode = 'create' | 'edit' | 'view';

interface LegalFileFormProps {
  mode?: FormMode;
}

export function LegalFileForm({ mode = 'create' }: LegalFileFormProps) {
  const navigate = useNavigate();
  const { clientId, fileId } = useParams<{ clientId: string; fileId?: string }>();
  const location = useLocation();
  
  // If we're in view mode from the URL, extract it
  const urlMode = location.pathname.includes('/edit/') ? 'edit' : location.pathname.includes('/files/') ? 'view' : 'create';
  const currentMode = mode || urlMode;
  const { getThemeClasses } = useSettings();
  const themeClasses = getThemeClasses();
  
  const [clientFileId, setClientFileId] = useState<string | null>(null);
  const [tempFileId, setTempFileId] = useState<string>('');
  
  const [formData, setFormData] = useState({
    fileName: '',
    caseNumber: '',
    caseType: 'civil', // Default case type
    court: '',
    dateOpened: new Date().toISOString().split('T')[0], // Today's date
    description: '',
    status: 'active' as 'active' | 'pending' | 'closed',
    feesToBePaid: 0,
    depositPaid: 0,
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(currentMode !== 'create');
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  
  // UX Enhancement States
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [validationStatus, setValidationStatus] = useState<{ [key: string]: 'valid' | 'invalid' | 'pending' }>({});
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [formProgress, setFormProgress] = useState(0);

  const { attachments, loadAttachments, removeAttachment, downloadAttachment, previewAttachment, isLoading: attachmentsLoading } = useLegalFileAttachments();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Clear any existing error for this field
    if (formErrors[name]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: name === 'feesToBePaid' || name === 'depositPaid' 
        ? parseFloat(value) || 0 
        : value
    }));
    
    // Mark as having unsaved changes
    setHasUnsavedChanges(true);
    
    // Real-time validation for specific fields
    validateFieldRealTime(name, value);
  };

  // Real-time field validation
  const validateFieldRealTime = (fieldName: string, value: string) => {
    let isValid = true;
    
    switch (fieldName) {
      case 'fileName':
        isValid = value.trim().length >= 2;
        break;
      case 'caseNumber':
        isValid = value.trim().length >= 3;
        break;
      case 'court':
        isValid = value.trim().length >= 3;
        break;
      default:
        isValid = true;
    }
    
    setValidationStatus(prev => ({
      ...prev,
      [fieldName]: isValid ? 'valid' : 'invalid'
    }));
  };

  // Generate temporary file ID for create mode to enable immediate attachment uploads
  useEffect(() => {
    if (currentMode === 'create' && !tempFileId) {
      const generatedId = uuidv4();
      setTempFileId(generatedId);
      setClientFileId(generatedId);
    }
  }, [currentMode, tempFileId, uuidv4]);

  // Calculate form completion progress
  useEffect(() => {
    const requiredFields = ['fileName', 'caseNumber', 'court'];
    const optionalFields = ['caseType', 'dateOpened', 'description', 'feesToBePaid', 'depositPaid', 'status'];
    
    let completedRequired = 0;
    let completedOptional = 0;
    
    requiredFields.forEach(field => {
      if (formData[field as keyof typeof formData] && String(formData[field as keyof typeof formData]).trim()) {
        completedRequired++;
      }
    });
    
    optionalFields.forEach(field => {
      if (formData[field as keyof typeof formData] && String(formData[field as keyof typeof formData]).trim()) {
        completedOptional++;
      }
    });
    
    const progress = ((completedRequired * 2 + completedOptional) / (requiredFields.length * 2 + optionalFields.length)) * 100;
    setFormProgress(Math.round(progress));
  }, [formData]);

  // Auto-save functionality (for edit mode)
  useEffect(() => {
    if (currentMode === 'edit' && hasUnsavedChanges && clientFileId) {
      const autoSaveTimer = setTimeout(async () => {
        try {
          setIsAutoSaving(true);
          const errors = validateForm();
          if (Object.keys(errors).length === 0) {
            // Only auto-save if form is valid
            await updateClientFile(clientFileId, {
              ...formData,
              updatedAt: new Date().toISOString()
            });
            setLastSaved(new Date());
            setHasUnsavedChanges(false);
          }
        } catch (error) {
          console.error('Auto-save failed:', error);
        } finally {
          setIsAutoSaving(false);
        }
      }, 3000); // Auto-save after 3 seconds of inactivity

      return () => clearTimeout(autoSaveTimer);
    }
  }, [formData, hasUnsavedChanges, currentMode, clientFileId]);

  // Warn about unsaved changes when leaving
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + S to save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (currentMode !== 'view') {
          handleSubmit(e as any);
        }
      }
      
      // Escape to cancel/go back
      if (e.key === 'Escape') {
        navigate(`/clients`);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentMode, navigate, clientId]);

  // Load file data in edit/view mode
  useEffect(() => {
    if (currentMode !== 'create' && fileId) {
      const loadFile = async () => {
        try {
          setIsLoading(true);
          const existingFiles = await getClientFiles(clientId!);
          const file = existingFiles.find((f) => f.id === fileId);
          if (file) {
            setClientFileId(fileId);
            setTempFileId(''); // Clear temp ID for edit/view mode
            setFormData({
              fileName: file.fileName || '',
              caseNumber: file.caseNumber || '',
              caseType: file.caseType || 'civil',
              court: file.court || '',
              dateOpened: file.dateOpened?.split('T')[0] || new Date().toISOString().split('T')[0],
              feesToBePaid: file.feesToBePaid || 0,
              depositPaid: file.depositPaid || 0,
              status: file.status || 'active',
              description: file.description || ''
            });
            
            // Load attachments for this file
            await loadAttachments(fileId);
          }
        } catch (error) {
          console.error('Error loading file:', error);
          setError('Failed to load file data');
        } finally {
          setIsLoading(false);
        }
      };
      
      loadFile();
    }
  }, [fileId, currentMode, clientId, loadAttachments]);

  const validateForm = () => {
    const errors: { [key: string]: string } = {};
    if (!formData.fileName.trim()) errors.fileName = 'File Name is required';
    if (!formData.caseNumber.trim()) errors.caseNumber = 'Case Number is required';
    if (!formData.court.trim()) errors.court = 'Court is required';
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      // Scroll to first error
      const firstErrorField = Object.keys(errors)[0];
      const element = document.getElementById(firstErrorField);
      element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element?.focus();
      return;
    }
    
    setIsSubmitting(true);
    setError('');

    try {
      const now = new Date().toISOString();
      let fileIdToUse: string;
      
      const baseFileData = {
        id: tempFileId || uuidv4(),
        clientId: clientId!,
        fileName: formData.fileName,
        caseNumber: formData.caseNumber,
        caseType: formData.caseType,
        court: formData.court,
        description: formData.description,
        status: formData.status,
        dateOpened: new Date(formData.dateOpened).toISOString(),
        feesToBePaid: formData.feesToBePaid,
        depositPaid: formData.depositPaid,
        balanceRemaining: formData.feesToBePaid - formData.depositPaid,
        totalExpenses: 0,
        totalExtraFees: 0,
        totalFeesCharged: formData.feesToBePaid,
        totalPaid: formData.depositPaid,
        netSummary: formData.depositPaid - formData.feesToBePaid,
        encrypted: false,
        ...(currentMode === 'create' ? {
          createdAt: now,
          updatedAt: now
        } : {
          updatedAt: now
        })
      };

      if (currentMode === 'edit' && clientFileId) {
        await updateClientFile(clientFileId, baseFileData);
        fileIdToUse = clientFileId;
      } else {
        if (tempFileId) {
          baseFileData.id = tempFileId;
          await addClientFile(baseFileData);
          fileIdToUse = tempFileId;
        } else {
          fileIdToUse = await addClientFile(baseFileData);
          setClientFileId(fileIdToUse);
        }
      }

      setTempFileId('');
      setHasUnsavedChanges(false);
      setLastSaved(new Date());
      
      // Show success message
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);

      console.log('Legal file saved successfully:', fileIdToUse);

      // Navigate back after a brief delay to show success
      setTimeout(() => {
        navigate(`/clients`, { 
          state: { 
            selectedClientId: clientId,
            showSuccessMessage: `Legal file "${formData.fileName}" ${currentMode === 'edit' ? 'updated' : 'created'} successfully!`
          }
        });
      }, 1500);
      
    } catch (err) {
      console.error('Failed to save legal file:', err);
      setError('Failed to save legal file. Please try again.');
      
      // Scroll to error message
      setTimeout(() => {
        const errorElement = document.querySelector('[role="alert"]');
        errorElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAttachmentChange = (files: any[]) => {
    // This callback can be used to track attachment changes if needed
    console.log('Attachments changed:', files.length);
  };

  const handleRemoveAttachment = async (attachmentId: string) => {
    await removeAttachment(attachmentId);
  };

  const caseTypes = [
    { value: 'civil', label: 'Civil Case' },
    { value: 'criminal', label: 'Criminal Case' },
    { value: 'family', label: 'Family Law' },
    { value: 'corporate', label: 'Corporate Law' },
    { value: 'intellectual', label: 'Intellectual Property' },
    { value: 'real_estate', label: 'Real Estate' },
    { value: 'immigration', label: 'Immigration' },
    { value: 'other', label: 'Other' },
  ];

  if (isLoading || attachmentsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const formTitle = currentMode === 'create' 
    ? 'Add New Legal File' 
    : currentMode === 'edit' 
      ? 'Edit Legal File' 
      : 'View Legal File';

  return (
    <div className={`min-h-screen ${themeClasses.background} py-6 px-4 sm:px-6 lg:px-8`}>
      <div className="max-w-4xl mx-auto">
        {/* Breadcrumb Navigation */}
        <nav className="mb-4" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2 text-sm">
            <li>
              <button
                onClick={() => navigate('/dashboard')}
                className={`${themeClasses.textSecondary} hover:${themeClasses.text} transition-colors`}
              >
                Dashboard
              </button>
            </li>
            <li className={themeClasses.textSecondary}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </li>
            <li>
              <button
                onClick={() => navigate('/clients', { state: { selectedClientId: clientId } })}
                className={`${themeClasses.textSecondary} hover:${themeClasses.text} transition-colors`}
              >
                Clients & Files
              </button>
            </li>
            <li className={themeClasses.textSecondary}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </li>
            <li className={`font-medium ${themeClasses.text}`} aria-current="page">
              {formTitle}
            </li>
          </ol>
        </nav>

        {/* Header Section */}
        <div className={`${themeClasses.cardBackground} rounded-lg shadow-sm border ${themeClasses.border} p-6 mb-6`}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className={`text-2xl font-bold ${themeClasses.text}`}>
                  {formTitle}
                </h1>
                <p className={`text-sm ${themeClasses.textSecondary} mt-1`}>
                  {currentMode === 'create' 
                    ? 'Create a new legal file for this client' 
                    : currentMode === 'edit' 
                      ? 'Update legal file information' 
                      : 'View legal file details'
                  }
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {currentMode === 'view' && (
                <button
                  onClick={() => navigate(`/clients/${clientId}/files/${fileId}/edit`)}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all shadow-sm"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit File
                </button>
              )}
              <button
                onClick={() => navigate(`/clients`, { state: { selectedClientId: clientId } })}
                className={`inline-flex items-center px-4 py-2 text-sm font-medium ${themeClasses.textSecondary} ${themeClasses.cardBackground} border ${themeClasses.border} rounded-lg ${themeClasses.hover} focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all`}
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Files
              </button>
            </div>
          </div>
        </div>

        {/* Success Message */}
        {showSuccessMessage && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 rounded-lg flex items-start animate-pulse">
            <svg className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <div>
              <h4 className="font-medium">Success!</h4>
              <p className="text-sm mt-1">Legal file has been saved successfully. Redirecting...</p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div role="alert" className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-lg flex items-start">
            <AlertCircle className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="font-medium">Error</h4>
              <p className="text-sm mt-1">{error}</p>
              <button
                onClick={() => setError('')}
                className="text-xs text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 mt-2 underline"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Auto-save Status */}
        {(hasUnsavedChanges || isAutoSaving || lastSaved) && currentMode === 'edit' && (
          <div className="mb-6 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg flex items-center justify-between">
            <div className="flex items-center text-sm">
              {isAutoSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin mr-2" />
                  <span className="text-blue-700 dark:text-blue-300">Auto-saving...</span>
                </>
              ) : hasUnsavedChanges ? (
                <>
                  <div className="w-2 h-2 bg-orange-500 rounded-full mr-2" />
                  <span className="text-orange-700 dark:text-orange-300">Unsaved changes</span>
                </>
              ) : lastSaved ? (
                <>
                  <svg className="w-4 h-4 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-green-700 dark:text-green-300">
                    Saved {lastSaved.toLocaleTimeString()}
                  </span>
                </>
              ) : null}
            </div>
            <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 space-x-4">
              <span>Press Ctrl+S to save manually</span>
              <span>•</span>
              <span>Esc to cancel</span>
            </div>
          </div>
        )}

        {/* Main Form */}
        <form onSubmit={handleSubmit} className={`${themeClasses.cardBackground} rounded-lg shadow-sm border ${themeClasses.border}`}>
          {/* Form Header with Progress */}
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <h2 className={`text-lg font-semibold ${themeClasses.text} flex items-center`}>
                  <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  File Information
                </h2>
                <p className={`text-sm ${themeClasses.textSecondary} mt-1`}>
                  {currentMode === 'view' ? 'File details and information' : 'Enter the basic information for this legal file'}
                </p>
              </div>
              
              {/* Progress Indicator */}
              {currentMode !== 'view' && (
                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <div className={`text-sm font-medium ${themeClasses.text}`}>
                      {formProgress}% Complete
                    </div>
                    <div className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-300 ease-out"
                        style={{ width: `${formProgress}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column */}
              <div className="space-y-6">
                {/* File Name */}
                <div>
                  <label htmlFor="fileName" className={`block text-sm font-medium ${themeClasses.text} mb-2`}>
                    File Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FileText className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      id="fileName"
                      name="fileName"
                      value={formData.fileName}
                      onChange={handleChange}
                      className={`block w-full pl-10 pr-10 py-3 border ${
                        formErrors.fileName 
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                          : validationStatus.fileName === 'valid'
                          ? 'border-green-300 focus:border-green-500 focus:ring-green-500'
                          : 'border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500'
                      } ${
                        currentMode === 'view' 
                          ? 'bg-gray-50 dark:bg-gray-800 cursor-not-allowed' 
                          : `${themeClasses.cardBackground} focus:ring-2 focus:ring-opacity-50`
                      } rounded-lg shadow-sm transition-all duration-200 ${themeClasses.text} placeholder-gray-400`}
                      disabled={currentMode === 'view'}
                      placeholder="Enter a descriptive file name"
                      required
                    />
                    {/* Validation Icon */}
                    {currentMode !== 'view' && (
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        {validationStatus.fileName === 'valid' && (
                          <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                        {formErrors.fileName && (
                          <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        )}
                      </div>
                    )}
                  </div>
                  {formErrors.fileName && (
                    <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {formErrors.fileName}
                    </p>
                  )}
                </div>

                {/* Case Number */}
                <div>
                  <label htmlFor="caseNumber" className={`block text-sm font-medium ${themeClasses.text} mb-2`}>
                    Case/File Number <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      id="caseNumber"
                      name="caseNumber"
                      value={formData.caseNumber}
                      onChange={handleChange}
                      className={`block w-full px-3 py-3 pr-10 border ${
                        formErrors.caseNumber 
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                          : validationStatus.caseNumber === 'valid'
                          ? 'border-green-300 focus:border-green-500 focus:ring-green-500'
                          : 'border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500'
                      } ${
                        currentMode === 'view' 
                          ? 'bg-gray-50 dark:bg-gray-800 cursor-not-allowed' 
                          : `${themeClasses.cardBackground} focus:ring-2 focus:ring-opacity-50`
                      } rounded-lg shadow-sm transition-all duration-200 ${themeClasses.text} placeholder-gray-400`}
                      disabled={currentMode === 'view'}
                      placeholder="e.g., 2023-CV-12345"
                    />
                    {/* Validation Icon */}
                    {currentMode !== 'view' && (
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        {validationStatus.caseNumber === 'valid' && (
                          <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                        {formErrors.caseNumber && (
                          <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        )}
                      </div>
                    )}
                  </div>
                  {formErrors.caseNumber && (
                    <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {formErrors.caseNumber}
                    </p>
                  )}
                </div>

                {/* Case Type */}
                <div>
                  <label htmlFor="caseType" className={`block text-sm font-medium ${themeClasses.text} mb-2`}>
                    Case Type
                  </label>
                  <div className="relative">
                    <select
                      id="caseType"
                      name="caseType"
                      value={formData.caseType}
                      onChange={handleChange}
                      className={`block w-full px-3 py-3 border border-gray-300 dark:border-gray-600 ${
                        currentMode === 'view' 
                          ? 'bg-gray-50 dark:bg-gray-800 cursor-not-allowed' 
                          : `${themeClasses.cardBackground} focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 focus:border-blue-500`
                      } rounded-lg shadow-sm transition-colors ${themeClasses.text} appearance-none`}
                      disabled={currentMode === 'view'}
                    >
                      {caseTypes.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Court */}
                <div>
                  <label htmlFor="court" className={`block text-sm font-medium ${themeClasses.text} mb-2`}>
                    Court/Jurisdiction <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      id="court"
                      name="court"
                      value={formData.court}
                      onChange={handleChange}
                      className={`block w-full pl-10 pr-10 py-3 border ${
                        formErrors.court 
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                          : validationStatus.court === 'valid'
                          ? 'border-green-300 focus:border-green-500 focus:ring-green-500'
                          : 'border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500'
                      } ${
                        currentMode === 'view' 
                          ? 'bg-gray-50 dark:bg-gray-800 cursor-not-allowed' 
                          : `${themeClasses.cardBackground} focus:ring-2 focus:ring-opacity-50`
                      } rounded-lg shadow-sm transition-all duration-200 ${themeClasses.text} placeholder-gray-400`}
                      disabled={currentMode === 'view'}
                      placeholder="e.g., High Court of Kenya"
                      list="court-suggestions"
                    />
                    {/* Court Suggestions Datalist */}
                    <datalist id="court-suggestions">
                      <option value="High Court of Kenya" />
                      <option value="Court of Appeal of Kenya" />
                      <option value="Supreme Court of Kenya" />
                      <option value="Employment and Labour Relations Court" />
                      <option value="Environment and Land Court" />
                      <option value="Magistrate's Court" />
                    </datalist>
                    {/* Validation Icon */}
                    {currentMode !== 'view' && (
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        {validationStatus.court === 'valid' && (
                          <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                        {formErrors.court && (
                          <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        )}
                      </div>
                    )}
                  </div>
                  {formErrors.court && (
                    <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {formErrors.court}
                    </p>
                  )}
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                {/* Date Opened */}
                <div>
                  <label htmlFor="dateOpened" className={`block text-sm font-medium ${themeClasses.text} mb-2`}>
                    Date Opened
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Calendar className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="date"
                      id="dateOpened"
                      name="dateOpened"
                      value={formData.dateOpened}
                      onChange={handleChange}
                      className={`block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 ${
                        currentMode === 'view' 
                          ? 'bg-gray-50 dark:bg-gray-800 cursor-not-allowed' 
                          : `${themeClasses.cardBackground} focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 focus:border-blue-500`
                      } rounded-lg shadow-sm transition-colors ${themeClasses.text}`}
                      disabled={currentMode === 'view'}
                    />
                  </div>
                </div>

                {/* Estimated Total Fees */}
                <div>
                  <label htmlFor="feesToBePaid" className={`block text-sm font-medium ${themeClasses.text} mb-2`}>
                    Estimated Total Fees
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <DollarSign className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="number"
                      id="feesToBePaid"
                      name="feesToBePaid"
                      value={formData.feesToBePaid || ''}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                      className={`block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 ${
                        currentMode === 'view' 
                          ? 'bg-gray-50 dark:bg-gray-800 cursor-not-allowed' 
                          : `${themeClasses.cardBackground} focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 focus:border-blue-500`
                      } rounded-lg shadow-sm transition-colors ${themeClasses.text} placeholder-gray-400`}
                      disabled={currentMode === 'view'}
                      placeholder="0.00"
                    />
                  </div>
                  <p className={`mt-1 text-xs ${themeClasses.textSecondary}`}>
                    Enter the estimated total legal fees for this case
                  </p>
                </div>

                {/* Initial Deposit */}
                <div>
                  <label htmlFor="depositPaid" className={`block text-sm font-medium ${themeClasses.text} mb-2`}>
                    Initial Deposit
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <DollarSign className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="number"
                      id="depositPaid"
                      name="depositPaid"
                      value={formData.depositPaid || ''}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                      className={`block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 ${
                        currentMode === 'view' 
                          ? 'bg-gray-50 dark:bg-gray-800 cursor-not-allowed' 
                          : `${themeClasses.cardBackground} focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 focus:border-blue-500`
                      } rounded-lg shadow-sm transition-colors ${themeClasses.text} placeholder-gray-400`}
                      disabled={currentMode === 'view'}
                      placeholder="0.00"
                    />
                  </div>
                  <p className={`mt-1 text-xs ${themeClasses.textSecondary}`}>
                    Amount paid upfront by the client
                  </p>
                </div>

                {/* Balance Calculation Display */}
                {(formData.feesToBePaid > 0 || formData.depositPaid > 0) && (
                  <div className={`p-4 ${themeClasses.background} border ${themeClasses.border} rounded-lg`}>
                    <h4 className={`text-sm font-medium ${themeClasses.text} mb-3`}>Financial Summary</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className={themeClasses.textSecondary}>Total Fees:</span>
                        <span className={`font-medium ${themeClasses.text}`}>
                          ${formData.feesToBePaid.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className={themeClasses.textSecondary}>Deposit Paid:</span>
                        <span className={`font-medium ${themeClasses.text}`}>
                          ${formData.depositPaid.toFixed(2)}
                        </span>
                      </div>
                      <div className="border-t border-gray-200 dark:border-gray-600 pt-2">
                        <div className="flex justify-between">
                          <span className={`font-medium ${themeClasses.text}`}>Balance Remaining:</span>
                          <span className={`font-bold ${
                            (formData.feesToBePaid - formData.depositPaid) > 0 
                              ? 'text-red-600 dark:text-red-400' 
                              : 'text-green-600 dark:text-green-400'
                          }`}>
                            ${(formData.feesToBePaid - formData.depositPaid).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Status */}
                <div>
                  <label htmlFor="status" className={`block text-sm font-medium ${themeClasses.text} mb-2`}>
                    File Status
                  </label>
                  <div className="relative">
                    <select
                      id="status"
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      className={`block w-full px-3 py-3 border border-gray-300 dark:border-gray-600 ${
                        currentMode === 'view' 
                          ? 'bg-gray-50 dark:bg-gray-800 cursor-not-allowed' 
                          : `${themeClasses.cardBackground} focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 focus:border-blue-500`
                      } rounded-lg shadow-sm transition-colors ${themeClasses.text} appearance-none`}
                      disabled={currentMode === 'view'}
                    >
                      <option value="active">Active</option>
                      <option value="pending">Pending</option>
                      <option value="closed">Closed</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Case Description - Full Width */}
            <div className="lg:col-span-2">
              <label htmlFor="description" className={`block text-sm font-medium ${themeClasses.text} mb-2`}>
                Case Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className={`w-full px-3 py-3 border border-gray-300 dark:border-gray-600 ${
                  currentMode === 'view' 
                    ? 'bg-gray-50 dark:bg-gray-800 cursor-not-allowed' 
                    : `${themeClasses.cardBackground} focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 focus:border-blue-500`
                } rounded-lg shadow-sm transition-colors ${themeClasses.text} placeholder-gray-400 resize-none`}
                disabled={currentMode === 'view'}
                placeholder="Provide a detailed description of the case, including key facts, legal issues, and objectives..."
              />
              <p className={`mt-1 text-xs ${themeClasses.textSecondary}`}>
                This description will help you and your team understand the case at a glance
              </p>
            </div>
          </div>

          {/* File Attachments Section */}
          {(currentMode === 'create' || currentMode === 'edit') && clientFileId && (
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mt-6">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center mr-3">
                  <Paperclip className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h3 className={`text-lg font-semibold ${themeClasses.text}`}>
                    Case Documents & Attachments
                  </h3>
                  <p className={`text-sm ${themeClasses.textSecondary}`}>
                    Upload relevant documents, contracts, evidence, and other files for this case
                  </p>
                </div>
              </div>
              <div className={`${themeClasses.cardBackground} border ${themeClasses.border} rounded-lg p-4`}>
                <FileAttachmentSystem
                  clientFileId={clientFileId}
                  onFilesChange={handleAttachmentChange}
                  maxFiles={10}
                  maxFileSize={25}
                  acceptedTypes={['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.txt']}
                  className=""
                />
              </div>
            </div>
          )}

          {/* Attachments Display for View Mode */}
          {currentMode === 'view' && attachments.length > 0 && (
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mt-6">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center mr-3">
                  <Paperclip className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h3 className={`text-lg font-semibold ${themeClasses.text}`}>
                    Attached Documents ({attachments.length})
                  </h3>
                  <p className={`text-sm ${themeClasses.textSecondary}`}>
                    Documents and files associated with this case
                  </p>
                </div>
              </div>
              <div className={`${themeClasses.cardBackground} border ${themeClasses.border} rounded-lg p-4`}>
                <div className="grid grid-cols-1 gap-3 max-h-64 overflow-y-auto">
                  {attachments.map((attachment) => (
                    <div key={attachment.id} className={`flex items-center justify-between p-4 ${themeClasses.background} border ${themeClasses.border} rounded-lg hover:shadow-sm transition-shadow`}>
                      <div className="flex items-center space-x-4 flex-1 min-w-0">
                        <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-lg flex items-center justify-center flex-shrink-0 border border-gray-200 dark:border-gray-600">
                          <span className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase">
                            {attachment.name.split('.').pop()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`font-medium ${themeClasses.text} truncate`}>{attachment.name}</p>
                          <p className={`text-sm ${themeClasses.textSecondary} mt-1`}>
                            {Math.round(attachment.size / 1024)} KB • {new Date(attachment.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          onClick={() => previewAttachment(attachment)}
                          className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                          title="Preview"
                          disabled={!attachment.data}
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          Preview
                        </button>
                        <button
                          onClick={() => downloadAttachment(attachment)}
                          className="inline-flex items-center px-3 py-2 text-sm font-medium text-green-600 hover:text-green-800 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                          title="Download"
                          disabled={!attachment.data}
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Download
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Helpful Tips Section */}
          {currentMode === 'create' && (
            <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4">
              <div className={`p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg`}>
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <h4 className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-2">💡 Pro Tips</h4>
                    <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
                      <li>• Use descriptive file names that include client name and case type</li>
                      <li>• Case numbers should follow your firm's numbering convention</li>
                      <li>• You can upload documents immediately after creating the file</li>
                      <li>• Press Ctrl+S to save your progress at any time</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Form Actions */}
          {currentMode !== 'view' && (
            <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4 bg-gray-50 dark:bg-gray-800/50 rounded-b-lg">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div className="flex items-center justify-between w-full sm:w-auto">
                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    All fields marked with * are required
                  </div>
                  <div className="text-xs text-gray-400 sm:hidden">
                    {formProgress}% complete
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      if (hasUnsavedChanges) {
                        const confirmLeave = window.confirm(
                          'You have unsaved changes that will be lost. Are you sure you want to leave?\n\nTip: Press Ctrl+S to save your changes first.'
                        );
                        if (!confirmLeave) return;
                      }
                      navigate(`/clients`, { state: { selectedClientId: clientId } });
                    }}
                    className={`inline-flex items-center px-4 py-2 text-sm font-medium ${themeClasses.textSecondary} ${themeClasses.cardBackground} border ${themeClasses.border} rounded-lg ${themeClasses.hover} focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all shadow-sm`}
                    disabled={isSubmitting}
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Cancel
                  </button>
                  
                  <button
                    type="submit"
                    className={`inline-flex items-center px-6 py-2 text-sm font-medium text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all shadow-sm hover:shadow-md ${
                      isSubmitting || !formData.fileName.trim() || !formData.caseNumber.trim() || !formData.court.trim()
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
                    }`}
                    disabled={isSubmitting || !formData.fileName.trim() || !formData.caseNumber.trim() || !formData.court.trim()}
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        {currentMode === 'edit' ? 'Updating...' : 'Saving...'}
                      </>
                    ) : (
                      <>
                        <Save className="-ml-1 mr-2 h-4 w-4" />
                        {currentMode === 'edit' ? 'Update Legal File' : 'Save Legal File'}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

export default LegalFileForm;
