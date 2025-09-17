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

  const { attachments, loadAttachments, removeAttachment, downloadAttachment, previewAttachment, isLoading: attachmentsLoading } = useLegalFileAttachments();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'feesToBePaid' || name === 'depositPaid' 
        ? parseFloat(value) || 0 
        : value
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
      return;
    }
    setIsSubmitting(true);
    setError('');

    try {
      const now = new Date().toISOString();
      let fileIdToUse: string;
      
      const baseFileData = {
        id: tempFileId || uuidv4(), // Use temp ID if available, otherwise generate new
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
        // Update existing file
        await updateClientFile(clientFileId, baseFileData);
        fileIdToUse = clientFileId;
      } else {
        // Create new file - use tempFileId if it exists (attachments already use it)
        if (tempFileId) {
          baseFileData.id = tempFileId;
          await addClientFile(baseFileData);
          fileIdToUse = tempFileId;
        } else {
          // Fallback for cases without temp ID
          fileIdToUse = await addClientFile(baseFileData);
          setClientFileId(fileIdToUse);
        }
      }

      // Clear temp ID after successful save
      setTempFileId('');

      console.log('Legal file saved successfully:', fileIdToUse);

      // Navigate back to client files with files tab active
      navigate(`/clients/${clientId}?tab=files`);
    } catch (err) {
      console.error('Failed to save legal file:', err);
      setError('Failed to save legal file. Please try again.');
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
    <div className="max-w-3xl mx-auto p-8 bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-extrabold text-blue-700 dark:text-blue-300 flex items-center gap-2">
          <svg className="w-7 h-7 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
          {formTitle}
        </h2>
        <div className="space-x-2">
          {currentMode === 'view' && (
            <button
              onClick={() => navigate(`/clients/${clientId}/files/${fileId}/edit`)}
              className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-500 rounded-lg shadow hover:from-blue-700 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              Edit
            </button>
          )}
          <button
            onClick={() => navigate(`/clients/${clientId}?tab=files`)}
            className="px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
          >
            Cancel
          </button>
        </div>
      </div>
      <div className="space-y-8">
        {/* Main Form Fields Card */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl shadow-inner p-6 border border-gray-200 dark:border-gray-700">
          {/* All main form fields go here (file name, date, case number, fees, etc.) */}
          {/** Existing form fields code remains here, just inside this styled div. **/}
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg flex items-start">
          <AlertCircle className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className={`${themeClasses.cardBackground} rounded-lg shadow-sm border ${themeClasses.border} p-6`}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            <div>
              <label htmlFor="fileName" className="block text-sm font-medium mb-1">
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
                  className={`block w-full px-3 py-2 border ${currentMode === 'view' ? 'bg-gray-100 dark:bg-gray-700' : 'bg-white dark:bg-gray-700'} border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:border-gray-600 dark:text-white`}
                  disabled={currentMode === 'view'}
                  placeholder="Enter file name"
                  required
                />
                {formErrors.fileName && <span className="text-red-500">{formErrors.fileName}</span>}
              </div>
            </div>

            <div>
              <label htmlFor="caseNumber" className="block text-sm font-medium mb-1">
                Case/File Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="caseNumber"
                name="caseNumber"
                value={formData.caseNumber}
                onChange={handleChange}
                className={`block w-full px-3 py-2 border ${currentMode === 'view' ? 'bg-gray-100 dark:bg-gray-700' : 'bg-white dark:bg-gray-700'} border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:border-gray-600 dark:text-white`}
                disabled={currentMode === 'view'}
                placeholder="e.g., 2023-CV-12345"
              />
              {formErrors.caseNumber && <span className="text-red-500">{formErrors.caseNumber}</span>}
            </div>

            <div>
              <label htmlFor="caseType" className="block text-sm font-medium mb-1">
                Case Type
              </label>
              <select
                id="caseType"
                name="caseType"
                value={formData.caseType}
                onChange={handleChange}
                className={`block w-full px-3 py-2 border ${currentMode === 'view' ? 'bg-gray-100 dark:bg-gray-700' : 'bg-white dark:bg-gray-700'} border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:border-gray-600 dark:text-white`}
                disabled={currentMode === 'view'}
              >
                {caseTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="court" className="block text-sm font-medium mb-1">
                Court/Jurisdiction <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="court"
                name="court"
                value={formData.court}
                onChange={handleChange}
                className={`block w-full px-3 py-2 border ${currentMode === 'view' ? 'bg-gray-100 dark:bg-gray-700' : 'bg-white dark:bg-gray-700'} border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:border-gray-600 dark:text-white`}
                disabled={currentMode === 'view'}
                placeholder="e.g., High Court of [Country]"
              />
              {formErrors.court && <span className="text-red-500">{formErrors.court}</span>}
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <div>
              <label htmlFor="dateOpened" className="block text-sm font-medium mb-1">
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
                  className={`block w-full px-3 py-2 border ${currentMode === 'view' ? 'bg-gray-100 dark:bg-gray-700' : 'bg-white dark:bg-gray-700'} border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:border-gray-600 dark:text-white`}
                  disabled={currentMode === 'view'}
                />
              </div>
            </div>

            <div>
              <label htmlFor="feesToBePaid" className="block text-sm font-medium mb-1">
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
                  className={`block w-full px-3 py-2 border ${currentMode === 'view' ? 'bg-gray-100 dark:bg-gray-700' : 'bg-white dark:bg-gray-700'} border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:border-gray-600 dark:text-white`}
                  disabled={currentMode === 'view'}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <label htmlFor="depositPaid" className="block text-sm font-medium mb-1">
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
                  className={`block w-full px-3 py-2 border ${currentMode === 'view' ? 'bg-gray-100 dark:bg-gray-700' : 'bg-white dark:bg-gray-700'} border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:border-gray-600 dark:text-white`}
                  disabled={currentMode === 'view'}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium mb-1">
                Status
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className={`w-full rounded-md border border-gray-300 ${currentMode === 'view' ? 'bg-gray-100 dark:bg-gray-700' : 'bg-white dark:bg-gray-700'} py-2 px-3 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:text-white`}
                disabled={currentMode === 'view'}
              >
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <label htmlFor="description" className="block text-sm font-medium mb-1">
            Case Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={4}
            className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            placeholder="Provide a brief description of the case..."
          />
        </div>

        {/* File Attachments Section */}
        {(currentMode === 'create' || currentMode === 'edit') && clientFileId && (
          <div className="mt-8">
            <div className="flex items-center mb-4">
              <Paperclip className="h-5 w-5 mr-2 text-gray-500" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Case Documents & Attachments
                {currentMode === 'create' && tempFileId && (
                  <span className="ml-2 text-sm text-gray-500">(Temporary ID: {tempFileId.slice(0, 8)}...)</span>
                )}
              </h3>
            </div>
            <FileAttachmentSystem
              clientFileId={clientFileId}
              onFilesChange={handleAttachmentChange}
              maxFiles={10}
              maxFileSize={25}
              acceptedTypes={['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.txt']}
              className="mb-6"
            />
          </div>
        )}

        {/* Attachments Display for View Mode */}
        {currentMode === 'view' && attachments.length > 0 && (
          <div className="mt-8">
            <div className="flex items-center mb-4">
              <Paperclip className="h-5 w-5 mr-2 text-gray-500" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Attached Documents ({attachments.length})</h3>
            </div>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {attachments.map((attachment) => (
                <div key={attachment.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <div className="w-10 h-10 bg-gray-200 dark:bg-gray-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-medium">{attachment.name.split('.').pop()}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white truncate">{attachment.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {Math.round(attachment.size / 1024)} KB • {new Date(attachment.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => previewAttachment(attachment)}
                      className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Preview"
                      disabled={!attachment.data}
                    >
                      👁️
                    </button>
                    <button
                      onClick={() => downloadAttachment(attachment)}
                      className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-colors"
                      title="Download"
                      disabled={!attachment.data}
                    >
                      ⬇️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8 flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            disabled={isSubmitting || !formData.fileName.trim()}
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </>
            ) : (
              <>
                <Save className="-ml-1 mr-2 h-4 w-4" />
                {currentMode === 'edit' ? 'Update Legal File' : 'Save Legal File'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default LegalFileForm;
